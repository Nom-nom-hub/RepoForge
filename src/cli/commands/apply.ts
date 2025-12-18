import { Command } from "commander";

export const applyCommand = new Command("apply")
  .description("Apply spec-driven changes to repository")
  .option("--spec <path>", "Path to spec file (default: repoforge.yaml)")
  .option("--dry-run", "Preview changes without applying")
  .action((options) => {
    console.log("🚀 Apply command (placeholder)");
    console.log(`Spec: ${options.spec || "repoforge.yaml"}`);
    if (options.dryRun) {
      console.log("Mode: dry-run");
    }
  });
