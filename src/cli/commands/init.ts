import { Command } from "commander";
import { ProjectAnalyzer } from "../../analyzer/project-analyzer.js";
import { SpecGenerator } from "../../generator/spec-generator.js";
import { WorkflowGenerator } from "../../generator/workflow-generator.js";
import { FileGenerator } from "../../generator/file-generator.js";
import { PluginRegistry } from "../../plugins/plugin-registry.js";
import { NodePlugin } from "../../plugins/node-plugin.js";
import { PythonPlugin } from "../../plugins/python-plugin.js";
import { GoPlugin } from "../../plugins/go-plugin.js";
import { RustPlugin } from "../../plugins/rust-plugin.js";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

export const initCommand = new Command("init")
  .description("Initialize a repository with RepoForge standards")
  .option("--dry-run", "Preview changes without applying")
  .option("--strict", "Use strict enforcement mode")
  .action(async (options) => {
    try {
      console.log("🔍 Analyzing project...");

      const analyzer = new ProjectAnalyzer(process.cwd());
      const analysis = analyzer.analyze();

      console.log(`✓ Detected: ${analysis.project.type} (${analysis.project.language})`);
      console.log(`  Confidence: ${Math.round(analysis.confidence * 100)}%`);

      console.log("\n📝 Generating spec...");
      const specGenerator = new SpecGenerator();
      const spec = specGenerator.generateSpec(analysis.project);

      const validation = specGenerator.validateSpec(spec);
      if (!validation.valid) {
        throw new Error(`Invalid spec: ${validation.errors.join(", ")}`);
      }

      console.log("✓ Spec generated and validated");

      console.log("\n🏗️  Generating files...");
      const workflowGen = new WorkflowGenerator();
      const fileGen = new FileGenerator();
      
      // Initialize plugin registry
      const registry = new PluginRegistry();
      registry.register(new NodePlugin());
      registry.register(new PythonPlugin());
      registry.register(new GoPlugin());
      registry.register(new RustPlugin());
      
      // Execute language-specific plugins
      const pluginOutput = await registry.executeAll(spec);

      const workflows = [
        workflowGen.generateCIWorkflow(spec),
        workflowGen.generateSecurityWorkflow(spec),
        workflowGen.generateReleaseWorkflow(spec),
      ];

      const files = fileGen.generateFiles(spec);
      
      // Merge plugin-generated files
      for (const [path, content] of pluginOutput.files) {
        files.push({ path, content });
      }

      console.log(`✓ Generated ${files.length} files and ${workflows.length} workflows`);

      if (options.dryRun) {
        console.log("\n📋 Preview (--dry-run mode):");
        files.forEach((f) => console.log(`  ${f.path}`));
        workflows.forEach((w) => console.log(`  .github/workflows/${w.name}`));
        console.log("\nNo changes applied.");
        return;
      }

      console.log("\n💾 Writing files...");

      // Write spec
      const specPath = path.join(process.cwd(), "repoforge.yaml");
      fs.writeFileSync(
        specPath,
        yaml.dump(spec, { lineWidth: -1 }),
        "utf-8"
      );
      console.log(`✓ ${specPath}`);

      // Write workflows
      const workflowsDir = path.join(process.cwd(), ".github", "workflows");
      fs.mkdirSync(workflowsDir, { recursive: true });

      for (const workflow of workflows) {
        const filePath = path.join(workflowsDir, workflow.name);
        fs.writeFileSync(filePath, workflow.content, "utf-8");
        console.log(`✓ ${filePath}`);
      }

      // Write other files
      for (const file of files) {
        const filePath = path.join(process.cwd(), file.path);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, file.content, "utf-8");
        console.log(`✓ ${filePath}`);
      }

      console.log("\n✅ Repository initialized successfully!");
      console.log("\n📋 Next steps:");
      console.log("   1. Run 'repoctl setup' to customize (email, maintainers, description)");
      console.log("   2. Review changes with 'git diff'");
      console.log("   3. Check compliance with 'repoctl validate'");
      console.log("   4. Commit: git add . && git commit -m 'repoforge: initialize standards'");
    } catch (error) {
      console.error("❌ Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
