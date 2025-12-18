import { Command } from "commander";
import { GitHubClient } from "../../github/github-client.js";
import { VersionManager } from "../../upgrader/version-manager.js";
import { DiffGenerator } from "../../upgrader/diff-generator.js";
import * as yaml from "js-yaml";

export const githubUpgradeCommand = new Command("github-upgrade")
  .description("Propose RepoForge spec upgrade as a pull request")
  .requiredOption("--owner <owner>", "GitHub org/user")
  .requiredOption("--repo <repo>", "Repository name")
  .requiredOption("--token <token>", "GitHub personal access token")
  .option("--to <version>", "Target version (default: latest)")
  .action(async (options) => {
    try {
      console.log(`🔍 Checking ${options.owner}/${options.repo} for upgrades...`);

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
      const specContent = await client.fetchFile("repoforge.yaml");
      if (!specContent) {
        throw new Error("No repoforge.yaml found in repository");
      }

      const specData = yaml.load(specContent) as any;
      const currentVersion = specData.version || "1.0.0";

      const versionManager = new VersionManager();
      const latestVersion = versionManager.getLatestVersion();
      const targetVersion = options.to || latestVersion;

      console.log(`  Current: ${currentVersion}`);
      console.log(`  Latest: ${latestVersion}`);

      if (currentVersion === targetVersion) {
        console.log("\n✓ Repository is already at latest version");
        process.exit(0);
      }

      console.log(
        `\n📋 Planning upgrade from ${currentVersion} to ${targetVersion}...`
      );

      const guide = versionManager.planUpgrade(currentVersion, targetVersion);

      console.log(`📝 Creating upgrade PR...`);

      // Build PR content
      const diffGen = new DiffGenerator();
      let diffs = "";

      for (const step of guide.steps) {
        if (step.oldContent && step.newContent) {
          const diff = diffGen.generateFileDiff(step.oldContent, step.newContent);
          diffs += diffGen.formatDiffForDisplay({
            file: step.file,
            type: "modified",
            hunks: diff,
          });
        }
      }

      // Update spec version
      const updatedSpec = { ...specData, version: targetVersion };

      // Create PR
      const prUrl = await client.createPullRequest({
        title: `repoforge: upgrade specs from ${currentVersion} to ${targetVersion}`,
        body: `## RepoForge Upgrade

Proposes upgrade of RepoForge specs to v${targetVersion}.

${
  guide.backupRequired
    ? "⚠️  **Breaking Changes** - This is a major version upgrade. Please review carefully."
    : "✓ Minor update - backward compatible."
}

### Changes
${
  guide.steps
    .map((s) => `- ${s.action.toUpperCase()}: ${s.file} - ${s.reason}`)
    .join("\n")
}

### New Spec
\`\`\`yaml
${yaml.dump(updatedSpec, { lineWidth: -1 })}
\`\`\`

### Migration Notes
${guide.steps.map((s) => `- ${s.file}: ${s.reason}`).join("\n")}

For details, see [RepoForge Roadmap](https://github.com/Nom-nom-hub/RepoForge).
`,
        files: new Map([["repoforge.yaml", yaml.dump(updatedSpec, { lineWidth: -1 })]]),
      });

      console.log("✅ Upgrade PR created!");
      console.log(`   ${prUrl}`);
      console.log("\nNext steps:");
      console.log("  1. Review the PR");
      console.log("  2. Test the upgrade");
      console.log("  3. Merge when ready");
    } catch (error) {
      console.error("❌ Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
