import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { SpecValidator } from "../../enforcer/spec-validator.js";
import { SpecSchema } from "../../types/spec.js";

export const validateCommand = new Command("validate")
  .description("Validate repository against spec")
  .option("--spec <path>", "Path to spec file (default: repoforge.yaml)")
  .option("--strict", "Fail on warnings")
  .action((options) => {
    try {
      const specPath = path.join(
        process.cwd(),
        options.spec || "repoforge.yaml"
      );

      if (!fs.existsSync(specPath)) {
        console.error(`❌ Spec file not found: ${specPath}`);
        process.exit(1);
      }

      console.log("🔍 Validating repository...");

      const specContent = fs.readFileSync(specPath, "utf-8");
      const specData = yaml.load(specContent);
      const spec = SpecSchema.parse(specData);

      // Collect existing files
      const existingFiles = new Set<string>();
      const filesDir = path.join(process.cwd(), ".github", "workflows");
      if (fs.existsSync(filesDir)) {
        fs.readdirSync(filesDir).forEach((file) => {
          existingFiles.add(`.github/workflows/${file}`);
        });
      }

      const validator = new SpecValidator();
      const result = validator.validate(spec, existingFiles);

      if (result.violations.length === 0) {
        console.log("✅ Repository is compliant");
        process.exit(0);
      }

      console.log(`\n⚠️  Found ${result.violations.length} violations:\n`);

      for (const violation of result.violations) {
        const icon = violation.severity === "error" ? "❌" : "⚠️ ";
        console.log(`${icon} [${violation.severity.toUpperCase()}] ${violation.file}`);
        console.log(`   Rule: ${violation.rule}`);
        console.log(`   ${violation.message}\n`);
      }

      const hasErrors = result.violations.some((v) => v.severity === "error");
      process.exit(hasErrors || (options.strict && result.violations.length > 0) ? 1 : 0);
    } catch (error) {
      console.error("❌ Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
