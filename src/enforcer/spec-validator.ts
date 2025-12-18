import { Spec } from "../types/spec.js";

export interface ValidationResult {
  valid: boolean;
  violations: Violation[];
}

export interface Violation {
  file: string;
  rule: string;
  severity: "warn" | "error";
  message: string;
}

export class SpecValidator {
  private requiredFiles: Map<string, string[]>;

  constructor() {
    this.requiredFiles = new Map([
      ["strict", [".github/workflows/ci.yml", ".github/workflows/security.yml"]],
      ["enforced", [".github/workflows/ci.yml", ".github/workflows/security.yml"]],
      ["permissive", [".github/workflows/ci.yml"]],
    ]);
  }

  validate(spec: Spec, existingFiles: Set<string>): ValidationResult {
    const violations: Violation[] = [];

    // Validate project config
    if (!spec.project) {
      violations.push({
        file: "repoforge.yaml",
        rule: "project-defined",
        severity: "error",
        message: "Project configuration is required",
      });
    }

    // Validate required files based on standards level
    const ciLevel = spec.standards.ci;
    const requiredForCI = this.requiredFiles.get(ciLevel) || [];

    for (const file of requiredForCI) {
      if (!existingFiles.has(file)) {
        violations.push({
          file,
          rule: "required-workflow",
          severity: ciLevel === "enforced" ? "error" : "warn",
          message: `Required workflow file missing: ${file}`,
        });
      }
    }

    return {
      valid: violations.filter((v) => v.severity === "error").length === 0,
      violations,
    };
  }

  checkDrift(
    spec: Spec,
    baseline: Map<string, string>,
    current: Map<string, string>
  ): Violation[] {
    const drifts: Violation[] = [];

    for (const [file, baselineContent] of baseline) {
      const currentContent = current.get(file);

      if (!currentContent) {
        drifts.push({
          file,
          rule: "file-deleted",
          severity: spec.standards.ci === "enforced" ? "error" : "warn",
          message: `Required file was deleted: ${file}`,
        });
        continue;
      }

      if (currentContent !== baselineContent) {
        drifts.push({
          file,
          rule: "file-modified",
          severity: spec.standards.ci === "enforced" ? "error" : "warn",
          message: `File was modified from baseline: ${file}`,
        });
      }
    }

    return drifts;
  }
}
