import { describe, it, expect, beforeEach } from "vitest";
import { SpecValidator } from "./spec-validator.js";
import { Spec } from "../types/spec.js";

describe("SpecValidator", () => {
  let validator: SpecValidator;
  let spec: Spec;

  beforeEach(() => {
    validator = new SpecValidator();
    spec = {
      version: "1.0.0",
      project: {
        type: "backend-api",
        language: "typescript",
        runtime: "node20",
        deployment: "container",
        risk: "internal",
      },
      standards: {
        ci: "strict",
        security: "enforced",
        releases: "strict",
      },
    };
  });

  it("should validate compliant repo", () => {
    const files = new Set([
      ".github/workflows/ci.yml",
      ".github/workflows/security.yml",
    ]);

    const result = validator.validate(spec, files);

    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("should detect missing required CI workflow", () => {
    const files = new Set([".github/workflows/security.yml"]);

    const result = validator.validate(spec, files);

    expect(result.valid).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations.some((v) => v.rule === "required-workflow")).toBe(true);
  });

  it("should detect missing security workflow with enforced level", () => {
    const files = new Set([".github/workflows/ci.yml"]);

    const result = validator.validate(spec, files);

    // With strict CI level, missing workflows should be errors
    const violations = result.violations.filter(
      (v) => v.severity === "error" && v.rule === "required-workflow"
    );
    expect(violations.length).toBeGreaterThan(0);
  });

  it("should allow warnings for permissive mode", () => {
    spec.standards.ci = "permissive";
    const files = new Set<string>();

    const result = validator.validate(spec, files);

    const errorViolations = result.violations.filter(
      (v) => v.severity === "error"
    );
    expect(errorViolations).toHaveLength(0);
  });

  it("should detect drift from baseline", () => {
    const baseline = new Map([
      [".github/workflows/ci.yml", "original content"],
    ]);

    const current = new Map([
      [".github/workflows/ci.yml", "modified content"],
    ]);

    const drifts = validator.checkDrift(spec, baseline, current);

    expect(drifts).toHaveLength(1);
    expect(drifts[0].rule).toBe("file-modified");
  });

  it("should detect deleted required files", () => {
    const baseline = new Map([
      [".github/workflows/ci.yml", "content"],
    ]);

    const current = new Map();

    const drifts = validator.checkDrift(spec, baseline, current);

    expect(drifts).toHaveLength(1);
    expect(drifts[0].rule).toBe("file-deleted");
  });
});
