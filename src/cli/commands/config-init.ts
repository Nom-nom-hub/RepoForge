import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { RepoForgeConfig, ConfigLoader } from "../../config/config-loader.js";

export const configInitCommand = new Command("config-init")
  .description("Create or update .repoforgerc.yaml configuration file")
  .option(
    "--policy <pack>",
    "Default policy pack (startup, saas, enterprise, oss)"
  )
  .option("--owner <org>", "GitHub organization/user")
  .option("--spec <path>", "Default spec path")
  .option("--auto-fix", "Enable auto-fix by default")
  .option("--verbose", "Enable verbose output by default")
  .action((options) => {
    try {
      const configPath = ".repoforgerc.yaml";

      // Check if config already exists
      if (fs.existsSync(configPath)) {
        console.log(`📖 Config already exists at ${configPath}`);
        console.log("   Creating backup at .repoforgerc.yaml.bak");
        fs.copyFileSync(configPath, `${configPath}.bak`);
      }

      // Build config
      const config: RepoForgeConfig = {
        specPath: options.spec || "repoforge.yaml",
        defaultPolicy: options.policy || "saas",
        autoFix: options.autoFix || false,
        dryRun: false,
        verbose: options.verbose || false,
        quiet: false,
        github: {
          owner: options.owner,
          // Note: Don't store token here, use GITHUB_TOKEN env var
        },
      };

      // Clean up undefined values
      if (!config.github?.owner) {
        delete config.github;
      }

      // Write config
      const yamlContent = yaml.dump(config, { lineWidth: -1 });
      fs.writeFileSync(configPath, yamlContent, "utf-8");

      console.log("✅ Configuration created!");
      console.log(`\n📄 ${configPath}:`);
      console.log(yamlContent);

      console.log("\n📋 Configuration Settings:");
      console.log(`  Spec Path:     ${config.specPath}`);
      console.log(`  Default Policy: ${config.defaultPolicy}`);
      console.log(`  Auto-Fix:      ${config.autoFix}`);
      console.log(`  Verbose:       ${config.verbose}`);
      if (config.github?.owner) {
        console.log(`  GitHub Org:    ${config.github.owner}`);
      }

      console.log("\n💡 Tips:");
      console.log("  • Store GitHub token in GITHUB_TOKEN env var, not in config");
      console.log("  • You can override config with CLI flags");
      console.log("  • Environment variables override config file");
      console.log("\n✨ Configuration saved!");
    } catch (error) {
      console.error("❌ Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
