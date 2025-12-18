import { Command } from "commander";
import { ProjectAnalyzer } from "../../analyzer/project-analyzer.js";
import { SpecGenerator } from "../../generator/spec-generator.js";
import { WorkflowGenerator } from "../../generator/workflow-generator.js";
import { FileGenerator } from "../../generator/file-generator.js";
import { GitHubClient } from "../../github/github-client.js";
import * as yaml from "js-yaml";

export const githubInitCommand = new Command("github-init")
  .description("Initialize repository on GitHub with a pull request")
  .requiredOption("--owner <owner>", "GitHub org/user")
  .requiredOption("--repo <repo>", "Repository name")
  .requiredOption("--token <token>", "GitHub personal access token")
  .option("--dir <path>", "Local repo path for analysis (default: cwd)")
  .action(async (options) => {
    try {
      console.log("🔍 Analyzing project...");

      const analyzer = new ProjectAnalyzer(options.dir || process.cwd());
      const analysis = analyzer.analyze();

      console.log(
        `✓ Detected: ${analysis.project.type} (${analysis.project.language})`
      );
      console.log(`  Confidence: ${Math.round(analysis.confidence * 100)}%`);

      console.log("\n📝 Generating spec...");
      const specGenerator = new SpecGenerator();
      const spec = specGenerator.generateSpec(analysis.project);

      const validation = specGenerator.validateSpec(spec);
      if (!validation.valid) {
        throw new Error(`Invalid spec: ${validation.errors.join(", ")}`);
      }

      console.log("✓ Spec generated and validated");

      console.log("\n🏗️  Generating files...");
      const workflowGen = new WorkflowGenerator();
      const fileGen = new FileGenerator();

      const workflows = [
        workflowGen.generateCIWorkflow(spec),
        workflowGen.generateSecurityWorkflow(spec),
        workflowGen.generateReleaseWorkflow(spec),
      ];

      const files = fileGen.generateFiles(spec);

      console.log(`✓ Generated ${files.length} files and ${workflows.length} workflows`);

      console.log("\n🔐 Connecting to GitHub...");
      const client = new GitHubClient({
        token: options.token,
        owner: options.owner,
        repo: options.repo,
      });

      const hasAccess = await client.validateAccess();
      if (!hasAccess) {
        throw new Error("Cannot access repository - check token and permissions");
      }

      console.log(
        `✓ Authenticated as ${options.owner}/${options.repo}`
      );

      console.log("\n📤 Creating pull request...");

      // Build files map
      const filesToCommit = new Map<string, string>();

      // Add spec
      filesToCommit.set(
        "repoforge.yaml",
        yaml.dump(spec, { lineWidth: -1 })
      );

      // Add workflows
      workflows.forEach((wf) => {
        filesToCommit.set(`.github/workflows/${wf.name}`, wf.content);
      });

      // Add other files
      files.forEach((f) => {
        filesToCommit.set(f.path, f.content);
      });

      const prUrl = await client.createPullRequest({
        title: "repoforge: initialize repository standards",
        body: `## RepoForge Initialization

This pull request sets up production-grade standards for your repository:

### Generated Files
- **CI Workflow** - Lint, test, type-check, build
- **Security Workflow** - CodeQL scanning, secret detection
- **Release Workflow** - Automated GitHub releases
- **Configuration** - .editorconfig, .gitattributes, .github/CODEOWNERS
- **Documentation** - README, CONTRIBUTING, SECURITY, CHANGELOG

### Spec
\`\`\`yaml
${yaml.dump(spec, { lineWidth: -1 })}
\`\`\`

### Next Steps
1. Review this PR
2. Merge to apply standards
3. Run \`repoctl setup\` locally to customize (email, maintainers, etc.)
4. Commit customizations

For more info, see the [RepoForge documentation](https://github.com/Nom-nom-hub/RepoForge).
`,
        files: filesToCommit,
      });

      console.log("✅ Pull request created!");
      console.log(`   ${prUrl}`);
      console.log("\nNext steps:");
      console.log("  1. Review the PR on GitHub");
      console.log("  2. Make any customizations");
      console.log("  3. Merge to apply standards");
    } catch (error) {
      console.error("❌ Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
