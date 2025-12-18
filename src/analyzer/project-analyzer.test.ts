import { describe, it, expect, beforeEach } from "vitest";
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

    expect(result.project.language).toBe("typescript");
    expect(result.detected.patterns).toContain("nodejs");
  });

  it("should detect Python project", () => {
    const reqFile = path.join(tempDir, "requirements.txt");
    fs.writeFileSync(reqFile, "requests==2.28.0");

    const analyzer = new ProjectAnalyzer(tempDir);
    const result = analyzer.analyze();

    expect(result.project.language).toBe("python");
    expect(result.detected.patterns).toContain("python");
  });

  it("should detect Docker project", () => {
    const dockerfile = path.join(tempDir, "Dockerfile");
    fs.writeFileSync(dockerfile, "FROM node:20");

    const analyzer = new ProjectAnalyzer(tempDir);
    const result = analyzer.analyze();

    expect(result.project.deployment).toBe("container");
    expect(result.detected.patterns).toContain("containerized");
  });

  it("should analyze confidence level", () => {
    const packageJson = path.join(tempDir, "package.json");
    fs.writeFileSync(packageJson, JSON.stringify({ name: "test" }));

    const analyzer = new ProjectAnalyzer(tempDir);
    const result = analyzer.analyze();

    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});
