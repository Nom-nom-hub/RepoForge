import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { ProjectAnalyzer } from "./project-analyzer.js";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";

describe("ProjectAnalyzer", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "repoforge-test-"));
  });

  it("should detect Node.js project", () => {
    const packageJson = path.join(tempDir, "package.json");
    fs.writeFileSync(packageJson, JSON.stringify({ name: "test" }));

    const analyzer = new ProjectAnalyzer(tempDir);
    const result = analyzer.analyze();

    assert.equal(result.project.language, "typescript");
    assert(result.detected.patterns.includes("nodejs"));
  });

  it("should detect Python project", () => {
    const reqFile = path.join(tempDir, "requirements.txt");
    fs.writeFileSync(reqFile, "requests==2.28.0");

    const analyzer = new ProjectAnalyzer(tempDir);
    const result = analyzer.analyze();

    assert.equal(result.project.language, "python");
    assert(result.detected.patterns.includes("python"));
  });

  it("should detect Docker project", () => {
    const dockerfile = path.join(tempDir, "Dockerfile");
    fs.writeFileSync(dockerfile, "FROM node:20");

    const analyzer = new ProjectAnalyzer(tempDir);
    const result = analyzer.analyze();

    assert.equal(result.project.deployment, "container");
    assert(result.detected.patterns.includes("containerized"));
  });

  it("should analyze confidence level", () => {
    const packageJson = path.join(tempDir, "package.json");
    fs.writeFileSync(packageJson, JSON.stringify({ name: "test" }));

    const analyzer = new ProjectAnalyzer(tempDir);
    const result = analyzer.analyze();

    assert(result.confidence > 0);
    assert(result.confidence <= 1);
  });
});
