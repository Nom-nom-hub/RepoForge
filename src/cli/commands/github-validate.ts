import { Command } from "commander";
import { GitHubClient } from "../../github/github-client.js";
import { SpecValidator } from "../../enforcer/spec-validator.js";
import * as yaml from "js-yaml";

export const githubValidateCommand = new Command("github-validate")
  .description("Check GitHub repository compliance against RepoForge spec")
  .requiredOption("--owner <owner>", "GitHub org/user")
  .requiredOption("--repo <repo>", "Repository name")
  .requiredOption("--token <token>", "GitHub personal access token")
  .option("--strict", "Fail on warnings")
  .action(async (options) => {
    try {
      console.log(`🔍 Validating ${options.owner}/${options.repo}...`);

      const client = new GitHubClient({
        token: options.token,
        owner: options.owner,
        repo: options.repo,
      });

      const hasAccess = await client.validateAccess();
      if (!hasAccess) {
        throw new Error("Cannot access repository - check token and permissions");
      }

      // Fetch spec file from repo
      const specContent = await client.fetchFile("repoforge.yaml");
      if (!specContent) {
        throw new Error("No repoforge.yaml found in repository");
      }

      const specData = yaml.load(specContent);
      // In real impl, would validate against SpecSchema here
      const spec = specData as any;

      // Fetch workflow files
      const workflowFiles = await client.listFiles(".github/workflows");
      const existingFiles = new Set(workflowFiles);

      console.log(`\n📋 Checking against spec version ${spec.version}...\n`);

      const validator = new SpecValidator();
      const result = validator.validate(spec, existingFiles);

      if (result.valid) {
        console.log("✅ Repository is compliant!\n");
        console.log("All required files present and valid.");
        process.exit(0);
      }

      console.log(`⚠️  Found ${result.violations.length} violations:\n`);

      for (const violation of result.violations) {
        const icon = violation.severity === "error" ? "❌" : "⚠️ ";
        console.log(`${icon} [${violation.severity.toUpperCase()}] ${violation.file}`);
        console.log(`   Rule: ${violation.rule}`);
        console.log(`   ${violation.message}\n`);
      }

      const hasErrors = result.violations.some((v) => v.severity === "error");
      const shouldFail = hasErrors || (options.strict && result.violations.length > 0);

      if (shouldFail) {
        console.log("❌ Compliance check failed");
        process.exit(1);
      }

      console.log("⚠️  Warnings present (use --strict to fail)");
      process.exit(0);
    } catch (error) {
      console.error("❌ Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
