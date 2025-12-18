import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { VersionManager } from "../../upgrader/version-manager.js";
import { DiffGenerator } from "../../upgrader/diff-generator.js";
import { SpecSchema } from "../../types/spec.js";

export const upgradeCommand = new Command("upgrade")
  .description("Upgrade repository to latest RepoForge standards")
  .option("--to <version>", "Target version (default: latest)")
  .option("--dry-run", "Preview changes without applying")
  .option("--auto-backup", "Create backup before upgrading")
  .action((options) => {
    try {
      const specPath = path.join(process.cwd(), "repoforge.yaml");

      if (!fs.existsSync(specPath)) {
        console.error(`❌ Spec file not found: ${specPath}`);
        process.exit(1);
      }

      console.log("📦 Checking version...");

      const specContent = fs.readFileSync(specPath, "utf-8");
      const specData = yaml.load(specContent);
      const spec = SpecSchema.parse(specData);

      const currentVersion = spec.version || "1.0.0";
      const versionManager = new VersionManager();
      const latestVersion = versionManager.getLatestVersion();
      const targetVersion = options.to || latestVersion;

      console.log(`  Current: ${currentVersion}`);
      console.log(`  Latest: ${latestVersion}`);

      if (currentVersion === targetVersion) {
        console.log("✅ Already at latest version");
        process.exit(0);
      }

      console.log(`\n📋 Planning upgrade from ${currentVersion} to ${targetVersion}...`);

      const guide = versionManager.planUpgrade(currentVersion, targetVersion);
      const currentMeta = versionManager.getVersionMetadata(currentVersion);
      const targetMeta = versionManager.getVersionMetadata(targetVersion);

      if (guide.backupRequired && options.autoBackup) {
        console.log("💾 Creating backup...");
        const backupPath = path.join(
          process.cwd(),
          `repoforge.yaml.backup-${currentVersion}`
        );
        fs.copyFileSync(specPath, backupPath);
        console.log(`✓ Backup created: ${backupPath}`);
      }

      if (guide.steps.length === 0) {
        console.log("ℹ️  No changes required");
        process.exit(0);
      }

      console.log(`\n🔍 Changes required (${guide.steps.length} steps):\n`);

      const diffGen = new DiffGenerator();

      for (const step of guide.steps) {
        console.log(`${step.action.toUpperCase()}: ${step.file}`);
        console.log(`  Reason: ${step.reason}`);

        if (step.oldContent && step.newContent) {
          const diff = diffGen.generateFileDiff(
            step.oldContent,
            step.newContent
          );
          console.log(
            diffGen.formatDiffForDisplay({
              file: step.file,
              type: "modified",
              hunks: diff,
            })
          );
        }
      }

      if (guide.backupRequired) {
        console.log(
          "⚠️  This is a major version upgrade. Backup recommended."
        );
      }

      if (options.dryRun) {
        console.log("\n✓ Dry-run complete. No changes applied.");
        process.exit(0);
      }

      console.log("\n💾 Applying upgrade...");

      // Update spec version
      const updatedSpec = {
        ...spec,
        version: targetVersion,
        metadata: {
          ...spec.metadata,
          generated: new Date().toISOString(),
        },
      };

      fs.writeFileSync(
        specPath,
        yaml.dump(updatedSpec, { lineWidth: -1 }),
        "utf-8"
      );
      console.log("✓ Spec updated");

      // Apply migration steps
      for (const step of guide.steps) {
        if (step.action === "create" && step.newContent) {
          const filePath = path.join(process.cwd(), step.file);
          fs.mkdirSync(path.dirname(filePath), { recursive: true });
          fs.writeFileSync(filePath, step.newContent, "utf-8");
          console.log(`✓ Created: ${step.file}`);
        } else if (step.action === "modify" && step.newContent) {
          const filePath = path.join(process.cwd(), step.file);
          fs.writeFileSync(filePath, step.newContent, "utf-8");
          console.log(`✓ Modified: ${step.file}`);
        } else if (step.action === "delete") {
          const filePath = path.join(process.cwd(), step.file);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`✓ Deleted: ${step.file}`);
          }
        }
      }

      console.log("\n✅ Upgrade complete!");
      console.log(`   Review changes with 'git diff'`);
      console.log(`   Run 'repoctl validate' to verify compliance`);
    } catch (error) {
      console.error("❌ Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
