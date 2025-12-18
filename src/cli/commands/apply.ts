import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { WorkflowGenerator } from "../../generator/workflow-generator.js";
import { FileGenerator } from "../../generator/file-generator.js";
import { SpecValidator } from "../../enforcer/spec-validator.js";
import { Spec } from "../../types/spec.js";

export const applyCommand = new Command("apply")
  .description("Apply spec-driven changes to repository")
  .option("--spec <path>", "Path to spec file (default: repoforge.yaml)")
  .option("--dry-run", "Preview changes without applying")
  .option("--force", "Force overwrite without confirming")
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

      // Validate spec
      const validator = new SpecValidator();
      const validation = validator.validate(spec, new Set());
      if (validation.violations.length > 0) {
        console.warn(
          `⚠️  Found ${validation.violations.length} spec deviations`
        );
      }

      console.log("✓ Spec loaded and validated");

      // Generate files
      console.log("\n📝 Generating files...");
      const workflowGen = new WorkflowGenerator();
      const fileGen = new FileGenerator();

      const workflows = [
        workflowGen.generateCIWorkflow(spec),
        workflowGen.generateSecurityWorkflow(spec),
        workflowGen.generateReleaseWorkflow(spec),
      ];

      const files = fileGen.generateFiles(spec);

      const filesToWrite = new Map<string, string>();

      // Add spec file
      filesToWrite.set("repoforge.yaml", specContent);

      // Add workflows
      for (const wf of workflows) {
        filesToWrite.set(`.github/workflows/${wf.name}`, wf.content);
      }

      // Add other files
      for (const f of files) {
        filesToWrite.set(f.path, f.content);
      }

      console.log(`✓ Generated ${filesToWrite.size} files`);

      if (options.dryRun) {
        console.log("\n📋 Files to be created/updated:");
        for (const [filePath] of filesToWrite) {
          console.log(`  • ${filePath}`);
        }
        console.log("\n(use without --dry-run to apply changes)");
        process.exit(0);
      }

      // Apply changes
      console.log("\n💾 Writing files...");
      let written = 0;
      for (const [filePath, content] of filesToWrite) {
        const fullPath = path.resolve(cwd, filePath);
        const dir = path.dirname(fullPath);

        // Create directory if needed
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(fullPath, content, "utf-8");
        written++;
      }

      console.log(`✅ Applied ${written} files successfully!`);
      console.log("\nNext steps:");
      console.log("  1. Review changes: git diff");
      console.log("  2. Commit: git add -A && git commit -m 'repoforge: apply spec'");
      console.log("  3. Push: git push");
    } catch (error) {
      console.error("❌ Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
