#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { analyzeCommand } from "./commands/analyze.js";
import { applyCommand } from "./commands/apply.js";
import { validateCommand } from "./commands/validate.js";
import { upgradeCommand } from "./commands/upgrade.js";
import { setupCommand } from "./commands/setup.js";

const program = new Command();

program
  .name("repoctl")
  .description("Policy-driven GitHub repository governance")
  .version("0.1.0");

// Register commands
program.addCommand(initCommand);
program.addCommand(analyzeCommand);
program.addCommand(applyCommand);
program.addCommand(validateCommand);
program.addCommand(upgradeCommand);
program.addCommand(setupCommand);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
