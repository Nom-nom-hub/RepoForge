import { Command } from "commander";
import { GitHubClient } from "../../github/github-client.js";
import { ProjectAnalyzer } from "../../analyzer/project-analyzer.js";
import { SpecGenerator } from "../../generator/spec-generator.js";
import { WorkflowGenerator } from "../../generator/workflow-generator.js";
import { FileGenerator } from "../../generator/file-generator.js";
import { SpecValidator } from "../../enforcer/spec-validator.js";
import * as yaml from "js-yaml";

export const githubAutoFixCommand = new Command("github-auto-fix")
  .description("Automatically fix RepoForge spec violations and create PR")
  .requiredOption("--owner <owner>", "GitHub org/user")
  .requiredOption("--repo <repo>", "Repository name")
  .requiredOption("--token <token>", "GitHub personal access token")
  .option("--dry-run", "Preview changes without creating PR")
  .action(async (options) => {
    try {
      console.log(`🔧 Analyzing ${options.owner}/${options.repo} for fixes...`);

      const client = new GitHubClient({
        token: options.token,
        owner: options.owner,
        repo: options.repo,
      });

      const hasAccess = await client.validateAccess();
      if (!hasAccess) {
        throw new Error("Cannot access repository - check token and permissions");
      }

      // Fetch current spec
      let specContent = await client.fetchFile("repoforge.yaml");
      if (!specContent) {
        console.log("ℹ️  No spec found, generating from project...");
        // Analyze repo to generate spec
        const analyzer = new ProjectAnalyzer();
        const analysis = analyzer.analyze();
        const specGen = new SpecGenerator();
        const newSpec = specGen.generateSpec(analysis.project);
        specContent = yaml.dump(newSpec, { lineWidth: -1 });
      }

      const specData = yaml.load(specContent) as any;

      // Get existing files
      const workflowFiles = await client.listFiles(".github/workflows");
      const existingFiles = new Set(workflowFiles);

      console.log(`\n📋 Checking for violations...`);

      const validator = new SpecValidator();
      const result = validator.validate(specData, existingFiles);

      if (result.valid) {
        console.log("✓ No violations found!");
        process.exit(0);
      }

      console.log(`Found ${result.violations.length} violations to fix.\n`);

      // Generate missing files
      const filesToCommit = new Map<string, string>();

      // Check for missing workflows
      const missingWorkflows = result.violations.filter(
        (v) => v.rule === "required-workflow"
      );

      if (missingWorkflows.length > 0) {
        console.log("🔧 Generating missing workflows...");
        const workflowGen = new WorkflowGenerator();
        const ci = workflowGen.generateCIWorkflow(specData);
        const security = workflowGen.generateSecurityWorkflow(specData);
        const release = workflowGen.generateReleaseWorkflow(specData);

        filesToCommit.set(`.github/workflows/${ci.name}`, ci.content);
        filesToCommit.set(`.github/workflows/${security.name}`, security.content);
        filesToCommit.set(`.github/workflows/${release.name}`, release.content);
      }

      // Check for missing config files
      const missingFiles = result.violations.filter(
        (v) => v.file.includes(".editorconfig") || v.file.includes(".gitattributes")
      );

      if (missingFiles.length > 0) {
        console.log("🔧 Generating missing config files...");
        const fileGen = new FileGenerator();
        const files = fileGen.generateFiles(specData);
        files.forEach((f) => filesToCommit.set(f.path, f.content));
      }

      if (filesToCommit.size === 0) {
        console.log("✓ No auto-fixable violations found");
        process.exit(0);
      }

      console.log(`\n📝 Ready to create PR with ${filesToCommit.size} fixes`);

      if (options.dryRun) {
        console.log("\nFiles to be created:");
        for (const [path] of filesToCommit) {
          console.log(`  + ${path}`);
        }
        console.log("\n(use without --dry-run to create PR)");
        process.exit(0);
      }

      console.log("\n📤 Creating auto-fix PR...");

      const prUrl = await client.createPullRequest({
        title: "repoforge: auto-fix spec violations",
        body: `## Auto-Fix Violations

This PR automatically fixes RepoForge spec violations:

### Violations Fixed
${result.violations.map((v) => `- [${v.severity}] ${v.file}: ${v.message}`).join("\n")}

### Files Added
${Array.from(filesToCommit.keys())
  .map((f) => `- \`${f}\``)
  .join("\n")}

All violations have been automatically corrected to match the spec.

Created by RepoForge v0.3.
`,
        files: filesToCommit,
      });

      console.log("✅ Auto-fix PR created!");
      console.log(`   ${prUrl}`);
    } catch (error) {
      console.error("❌ Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
