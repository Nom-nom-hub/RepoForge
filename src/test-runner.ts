import { readdirSync, statSync } from "fs";
import { join } from "path";
import { spawn } from "child_process";

function findTestFiles(dir: string, pattern = ".test.js"): string[] {
  const files: string[] = [];

  function walk(currentPath: string) {
    const entries = readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentPath, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.includes(pattern) && !entry.name.endsWith(".map")) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files.sort();
}

const testFiles = findTestFiles("dist");

if (testFiles.length === 0) {
  console.error("No test files found in dist/");
  process.exit(1);
}

console.log(`Found ${testFiles.length} test files\n`);

const args = ["--test", ...testFiles];
const proc = spawn("node", args, {
  stdio: "inherit",
});

proc.on("exit", (code) => {
  process.exit(code || 0);
});
