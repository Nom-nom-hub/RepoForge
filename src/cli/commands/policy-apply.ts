import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { PolicyInheritanceManager } from "../../policies/policy-inheritance.js";
import { Spec } from "../../types/spec.js";

export const policyApplyCommand = new Command("policy-apply")
  .description("Apply organizational policy to a repository spec")
  .requiredOption("--repo-spec <path>", "Path to repository spec (repoforge.yaml)")
  .option("--org-policy <path>", "Organization policy file")
  .option("--team-policy <path>", "Team policy file")
  .option("--check-only", "Check compliance without modifying")
  .option("--out <path>", "Output file (default: update repo-spec)")
  .action(async (options) => {
    try {
      const repoSpecPath = path.resolve(options.repoSpec);

      // Load repo spec
      if (!fs.existsSync(repoSpecPath)) {
        console.error(`❌ Repository spec not found: ${options.repoSpec}`);
        process.exit(1);
      }

      console.log("📖 Loading specs...");
      const repoSpecContent = fs.readFileSync(repoSpecPath, "utf-8");
      const repoSpec = yaml.load(repoSpecContent) as Partial<Spec>;

      let orgPolicy: Partial<Spec> | undefined;
      let teamPolicy: Partial<Spec> | undefined;

      // Load policies if provided
      if (options.orgPolicy) {
        if (!fs.existsSync(options.orgPolicy)) {
          console.error(`❌ Organization policy not found: ${options.orgPolicy}`);
          process.exit(1);
        }
        const orgContent = fs.readFileSync(options.orgPolicy, "utf-8");
        orgPolicy = yaml.load(orgContent) as Partial<Spec>;
        console.log("  ✓ Organization policy loaded");
      }

      if (options.teamPolicy) {
        if (!fs.existsSync(options.teamPolicy)) {
          console.error(`❌ Team policy not found: ${options.teamPolicy}`);
          process.exit(1);
        }
        const teamContent = fs.readFileSync(options.teamPolicy, "utf-8");
        teamPolicy = yaml.load(teamContent) as Partial<Spec>;
        console.log("  ✓ Team policy loaded");
      }

      console.log("  ✓ Repository spec loaded");

      // Initialize inheritance manager
      const manager = new PolicyInheritanceManager();

      // Get effective policy
      const effectivePolicy = manager.getEffectivePolicy(
        repoSpecPath,
        orgPolicy,
        teamPolicy,
        repoSpec
      );

      console.log("\n🔍 Checking compliance...");

      // Check compliance
      const compliance = manager.checkCompliance(repoSpec, effectivePolicy);

      if (compliance.compliant) {
        console.log("✓ Repository spec complies with policies");
      } else {
        console.log(`⚠️  Found ${compliance.violations.length} compliance issues:`);
        for (const violation of compliance.violations) {
          console.log(`  • ${violation}`);
        }

        if (!options.checkOnly) {
          console.log("\n📝 Applying policies to repository spec...");

          // Merge policies into repo spec
          const mergedSpec: Partial<Spec> = {
            ...repoSpec,
            standards: {
              ci: (effectivePolicy.standards?.ci ||
                repoSpec.standards?.ci) as
                | "permissive"
                | "strict"
                | "enforced",
              security: (effectivePolicy.standards?.security ||
                repoSpec.standards?.security) as
                | "permissive"
                | "strict"
                | "enforced",
              releases: (effectivePolicy.standards?.releases ||
                repoSpec.standards?.releases) as
                | "permissive"
                | "strict"
                | "enforced",
            },
            project: {
              ...(repoSpec.project as any),
              ...(effectivePolicy.project as any),
            },
          };

          const outPath = options.out || repoSpecPath;
          const mergedContent = yaml.dump(mergedSpec, { lineWidth: -1 });
          fs.writeFileSync(outPath, mergedContent, "utf-8");

          console.log(`✅ Policies applied and saved to ${outPath}`);
        }
      }

      // Show policy hierarchy
      console.log("\n📊 Policy Hierarchy:");
      if (orgPolicy) {
        console.log("  Organization Level:");
        console.log(`    CI: ${orgPolicy.standards?.ci}`);
        console.log(`    Security: ${orgPolicy.standards?.security}`);
        console.log(`    Releases: ${orgPolicy.standards?.releases}`);
      }
      if (teamPolicy) {
        console.log("  Team Level:");
        console.log(`    CI: ${teamPolicy.standards?.ci}`);
        console.log(`    Security: ${teamPolicy.standards?.security}`);
        console.log(`    Releases: ${teamPolicy.standards?.releases}`);
      }
      console.log("  Repository Level (Current):");
      console.log(`    CI: ${repoSpec.standards?.ci}`);
      console.log(`    Security: ${repoSpec.standards?.security}`);
      console.log(`    Releases: ${repoSpec.standards?.releases}`);

      process.exit(compliance.compliant ? 0 : 1);
    } catch (error) {
      console.error("❌ Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
