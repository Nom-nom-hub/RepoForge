import { Command } from "commander";
import { GitHubClient } from "../../github/github-client.js";
import { ProjectAnalyzer } from "../../analyzer/project-analyzer.js";

export interface RepositoryResult {
  owner: string;
  repo: string;
  url: string;
  analysis: {
    type: string;
    language: string;
    runtime: string;
    deployment: string;
    confidence: number;
  };
  hasSpec: boolean;
  status: "success" | "error";
  error?: string;
}

export const scanCommand = new Command("scan")
  .description("Scan multiple GitHub repositories for standards compliance")
  .requiredOption("--owner <owner>", "GitHub org/user")
  .requiredOption("--token <token>", "GitHub personal access token")
  .option("--repos <list>", "Comma-separated list of repos to scan")
  .option("--org", "Scan all repos in the organization")
  .option("--format <format>", "Output format: text, json (default: text)")
  .action(async (options) => {
    try {
      const client = new GitHubClient({
        token: options.token,
        owner: options.owner,
        repo: "", // Will be set per repo
      });

      const hasAccess = await client.validateAccess();
      if (!hasAccess) {
        console.error(
          "❌ Cannot access organization - check token and permissions"
        );
        process.exit(1);
      }

      let repos: string[] = [];

      if (options.repos) {
        // Scan specific repos
        repos = options.repos.split(",").map((r: string) => r.trim());
        console.log(`🔍 Scanning ${repos.length} repositories...`);
      } else if (options.org) {
        console.log("🔍 Fetching all repositories in organization...");
        // This would require listing repos - for now just show repos option
        console.log(
          "ℹ️  Use --repos to specify repositories to scan (comma-separated)"
        );
        process.exit(0);
      } else {
        console.error("❌ Specify --repos or --org");
        process.exit(1);
      }

      const results: RepositoryResult[] = [];

      for (const repo of repos) {
        try {
          console.log(`\n📦 Analyzing ${options.owner}/${repo}...`);

          // Create client for this repo
          const repoClient = new GitHubClient({
            token: options.token,
            owner: options.owner,
            repo,
          });

          // Check if repo is accessible
          const repoAccessible = await repoClient.validateAccess();
          if (!repoAccessible) {
            results.push({
              owner: options.owner,
              repo,
              url: `https://github.com/${options.owner}/${repo}`,
              analysis: {
                type: "",
                language: "",
                runtime: "",
                deployment: "",
                confidence: 0,
              },
              hasSpec: false,
              status: "error",
              error: "Cannot access repository",
            });
            console.error(`  ❌ Cannot access this repository`);
            continue;
          }

          // Check if spec exists
          let hasSpec = false;
          try {
            const spec = await repoClient.fetchFile("repoforge.yaml");
            hasSpec = !!spec;
          } catch {
            hasSpec = false;
          }

          // Since we can't clone, we'll analyze based on visible metadata
          // This is a limitation - in production, you'd clone or use GitHub API to get file contents
          results.push({
            owner: options.owner,
            repo,
            url: `https://github.com/${options.owner}/${repo}`,
            analysis: {
              type: "unknown",
              language: "unknown",
              runtime: "unknown",
              deployment: "unknown",
              confidence: 0,
            },
            hasSpec,
            status: "success",
          });

          if (hasSpec) {
            console.log(`  ✓ Has RepoForge spec`);
          } else {
            console.log(`  ⚠️  No RepoForge spec found`);
          }
        } catch (error) {
          results.push({
            owner: options.owner,
            repo,
            url: `https://github.com/${options.owner}/${repo}`,
            analysis: {
              type: "",
              language: "",
              runtime: "",
              deployment: "",
              confidence: 0,
            },
            hasSpec: false,
            status: "error",
            error: error instanceof Error ? error.message : String(error),
          });
          console.error(`  ❌ Error:`, error instanceof Error ? error.message : error);
        }
      }

      // Output results
      console.log("\n" + "=".repeat(60));

      if (options.format === "json") {
        console.log(JSON.stringify(results, null, 2));
      } else {
        // Text format
        console.log(`\n📊 Scan Results (${repos.length} repositories)\n`);

        const withSpec = results.filter((r) => r.hasSpec).length;
        const errors = results.filter((r) => r.status === "error").length;

        console.log(`  Total:        ${results.length}`);
        console.log(`  With Spec:    ${withSpec}`);
        console.log(`  Errors:       ${errors}`);
        console.log(`  Compliance:   ${Math.round((withSpec / (results.length - errors)) * 100)}%`);

        console.log("\nRepositories:");
        for (const result of results) {
          const status = result.hasSpec ? "✓" : result.status === "error" ? "✗" : "○";
          console.log(`  ${status} ${result.owner}/${result.repo}`);
          if (result.error) {
            console.log(`      Error: ${result.error}`);
          }
        }

        console.log("\nNext steps:");
        console.log(
          "  • Run 'repoctl github-init' on repos without spec to initialize"
        );
        console.log("  • Use 'repoctl github-auto-fix' to remediate violations");
      }

      process.exit(results.every((r) => r.status === "success") ? 0 : 1);
    } catch (error) {
      console.error("❌ Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
