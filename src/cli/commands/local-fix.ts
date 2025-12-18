import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { SpecValidator } from "../../enforcer/spec-validator.js";
import { WorkflowGenerator } from "../../generator/workflow-generator.js";
import { FileGenerator } from "../../generator/file-generator.js";
import { Spec } from "../../types/spec.js";

export const localFixCommand = new Command("local-fix")
  .description("Automatically fix RepoForge spec violations locally")
  .option("--spec <path>", "Path to spec file (default: repoforge.yaml)")
  .option("--dry-run", "Preview changes without applying")
  .action(async (options) => {
    try {
      const specPath = options.spec || "repoforge.yaml";
      const cwd = process.cwd();
      const fullSpecPath = path.resolve(cwd, specPath);

      // Load spec
      if (!fs.existsSync(fullSpecPath)) {
        console.error(`❌ Spec file not found: ${specPath}`);
        process.exit(1);
      }

      console.log(`📖 Loading spec from ${specPath}...`);
      const specContent = fs.readFileSync(fullSpecPath, "utf-8");
      const spec = yaml.load(specContent) as Spec;

      // Get existing files
      const existingFiles = new Set<string>();
      const githubWorkflowsDir = path.join(cwd, ".github", "workflows");
      if (fs.existsSync(githubWorkflowsDir)) {
        const files = fs.readdirSync(githubWorkflowsDir);
        for (const file of files) {
          existingFiles.add(`.github/workflows/${file}`);
        }
      }

      console.log("✓ Spec loaded");

      // Validate
      console.log("\n🔍 Checking for violations...");
      const validator = new SpecValidator();
      const result = validator.validate(spec, existingFiles);

      if (result.valid) {
        console.log("✓ No violations found!");
        process.exit(0);
      }

      console.log(`Found ${result.violations.length} violations:\n`);
      for (const violation of result.violations) {
        console.log(
          `  [${violation.severity.toUpperCase()}] ${violation.file}`
        );
        console.log(`    ${violation.message}\n`);
      }

      // Generate fixes
      console.log("🔧 Generating fixes...");
      const filesToFix = new Map<string, string>();

      // Check for missing workflows
      const missingWorkflows = result.violations.filter(
        (v) => v.rule === "required-workflow"
      );

      if (missingWorkflows.length > 0) {
        console.log(`  • Generating ${missingWorkflows.length} missing workflows`);
        const workflowGen = new WorkflowGenerator();
        const ci = workflowGen.generateCIWorkflow(spec);
        const security = workflowGen.generateSecurityWorkflow(spec);
        const release = workflowGen.generateReleaseWorkflow(spec);

        filesToFix.set(`.github/workflows/${ci.name}`, ci.content);
        filesToFix.set(`.github/workflows/${security.name}`, security.content);
        filesToFix.set(`.github/workflows/${release.name}`, release.content);
      }

      // Check for missing config files
      const missingFiles = result.violations.filter(
        (v) =>
          v.file.includes(".editorconfig") ||
          v.file.includes(".gitattributes") ||
          v.file.includes("CODEOWNERS")
      );

      if (missingFiles.length > 0) {
        console.log(`  • Generating ${missingFiles.length} missing config files`);
        const fileGen = new FileGenerator();
        const files = fileGen.generateFiles(spec);
        for (const file of files) {
          filesToFix.set(file.path, file.content);
        }
      }

      if (filesToFix.size === 0) {
        console.log(
          "\n✓ No auto-fixable violations found (may require manual intervention)"
        );
        process.exit(0);
      }

      console.log(`✓ Generated ${filesToFix.size} fixes`);

      if (options.dryRun) {
        console.log("\n📋 Files to be created/updated:");
        for (const [filePath] of filesToFix) {
          console.log(`  + ${filePath}`);
        }
        console.log("\n(use without --dry-run to apply fixes)");
        process.exit(0);
      }

      // Apply fixes
      console.log("\n💾 Applying fixes...");
      let applied = 0;
      for (const [filePath, content] of filesToFix) {
        const fullPath = path.resolve(cwd, filePath);
        const dir = path.dirname(fullPath);

        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(fullPath, content, "utf-8");
        applied++;
      }

      console.log(`✅ Applied ${applied} fixes!`);

      // Run validation again
      console.log("\n🔄 Re-validating...");
      const newExistingFiles = new Set<string>();
      if (fs.existsSync(githubWorkflowsDir)) {
        const files = fs.readdirSync(githubWorkflowsDir);
        for (const file of files) {
          newExistingFiles.add(`.github/workflows/${file}`);
        }
      }

      const revalidation = validator.validate(spec, newExistingFiles);
      if (revalidation.valid) {
        console.log("✓ All violations fixed!");
      } else {
        console.log(
          `⚠️  ${revalidation.violations.length} violations remain (may need manual fixes)`
        );
        for (const v of revalidation.violations) {
          console.log(`  • ${v.file}: ${v.message}`);
        }
      }

      console.log("\nNext steps:");
      console.log("  1. Review changes: git diff");
      console.log(
        "  2. Commit: git add -A && git commit -m 'repoforge: fix violations'"
      );
      console.log("  3. Push: git push");
    } catch (error) {
      console.error("❌ Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
