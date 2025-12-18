import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
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

    assert.equal(result.valid, true);
    assert.equal(result.violations.length, 0);
  });

  it("should detect missing required CI workflow", () => {
    spec.standards.ci = "enforced"; // Use enforced for errors instead of warnings
    const files = new Set([".github/workflows/security.yml"]);

    const result = validator.validate(spec, files);

    assert.equal(result.valid, false);
    assert(result.violations.length > 0);
    assert(result.violations.some((v) => v.rule === "required-workflow"));
  });

  it("should detect missing security workflow with enforced level", () => {
    spec.standards.ci = "enforced";
    const files = new Set([".github/workflows/ci.yml"]);

    const result = validator.validate(spec, files);

    // With enforced CI level, missing workflows should be errors
    const violations = result.violations.filter(
      (v) => v.severity === "error" && v.rule === "required-workflow"
    );
    assert(violations.length > 0);
  });

  it("should allow warnings for permissive mode", () => {
    spec.standards.ci = "permissive";
    const files = new Set<string>();

    const result = validator.validate(spec, files);

    const errorViolations = result.violations.filter(
      (v) => v.severity === "error"
    );
    assert.equal(errorViolations.length, 0);
  });

  it("should detect drift from baseline", () => {
    const baseline = new Map([
      [".github/workflows/ci.yml", "original content"],
    ]);

    const current = new Map([
      [".github/workflows/ci.yml", "modified content"],
    ]);

    const drifts = validator.checkDrift(spec, baseline, current);

    assert.equal(drifts.length, 1);
    assert.equal(drifts[0].rule, "file-modified");
  });

  it("should detect deleted required files", () => {
    const baseline = new Map([
      [".github/workflows/ci.yml", "content"],
    ]);

    const current = new Map();

    const drifts = validator.checkDrift(spec, baseline, current);

    assert.equal(drifts.length, 1);
    assert.equal(drifts[0].rule, "file-deleted");
  });
});
