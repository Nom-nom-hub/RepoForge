import { Command } from "commander";
import { ProjectAnalyzer } from "../../analyzer/project-analyzer.js";

export const analyzeCommand = new Command("analyze")
  .description("Analyze project and output detected configuration")
  .option("--json", "Output as JSON")
  .action((options) => {
    try {
      console.log("🔍 Analyzing project...");

      const analyzer = new ProjectAnalyzer(process.cwd());
      const analysis = analyzer.analyze();

      if (options.json) {
        console.log(JSON.stringify(analysis, null, 2));
      } else {
        console.log("\n📊 Project Analysis:");
        console.log(
          `  Type: ${analysis.project.type} (${Math.round(analysis.confidence * 100)}% confidence)`
        );
        console.log(`  Language: ${analysis.project.language}`);
        console.log(`  Runtime: ${analysis.project.runtime}`);
        console.log(`  Deployment: ${analysis.project.deployment}`);

        if (analysis.detected.patterns.length > 0) {
          console.log(`\n  Detected patterns:`);
          analysis.detected.patterns.forEach((p) => console.log(`    • ${p}`));
        }
      }
    } catch (error) {
      console.error("❌ Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
