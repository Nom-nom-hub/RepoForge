import { Command } from "commander";
import { defaultRegistry } from "../../policies/policy-pack.js";

export const policyListCommand = new Command("policy-list")
  .description("List available policy packs")
  .option("--json", "Output as JSON")
  .action((options) => {
    const packs = defaultRegistry.list();

    if (options.json) {
      console.log(JSON.stringify(packs, null, 2));
      return;
    }

    console.log("\n📋 Available Policy Packs:\n");

    for (const pack of packs) {
      console.log(`📦 ${pack.name}`);
      console.log(`   ${pack.description}`);
      console.log(`   Standards:`);
      console.log(
        `     • CI: ${pack.spec.standards?.ci || "not set"}`
      );
      console.log(
        `     • Security: ${pack.spec.standards?.security || "not set"}`
      );
      console.log(
        `     • Releases: ${pack.spec.standards?.releases || "not set"}`
      );
      console.log();
    }

    console.log("Usage:");
    console.log("  repoctl init --policy <pack-name>");
    console.log("  repoctl github-init --policy <pack-name> --owner X --repo Y --token Z");
  });
