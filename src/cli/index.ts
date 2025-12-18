#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { analyzeCommand } from "./commands/analyze.js";
import { applyCommand } from "./commands/apply.js";
import { validateCommand } from "./commands/validate.js";
import { upgradeCommand } from "./commands/upgrade.js";
import { setupCommand } from "./commands/setup.js";
import { githubInitCommand } from "./commands/github-init.js";
import { githubValidateCommand } from "./commands/github-validate.js";
import { githubUpgradeCommand } from "./commands/github-upgrade.js";
import { githubAutoFixCommand } from "./commands/github-auto-fix.js";
import { policyListCommand } from "./commands/policy-list.js";

const program = new Command();

program
  .name("repoctl")
  .description("Policy-driven GitHub repository governance")
  .version("0.3.0");

// Register commands
program.addCommand(initCommand);
program.addCommand(analyzeCommand);
program.addCommand(applyCommand);
program.addCommand(validateCommand);
program.addCommand(upgradeCommand);
program.addCommand(setupCommand);
program.addCommand(githubInitCommand);
program.addCommand(githubValidateCommand);
program.addCommand(githubUpgradeCommand);
program.addCommand(githubAutoFixCommand);
program.addCommand(policyListCommand);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
