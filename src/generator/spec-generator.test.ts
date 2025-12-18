import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { SpecGenerator } from "./spec-generator.js";

describe("SpecGenerator", () => {
  let generator: SpecGenerator;

  beforeEach(() => {
    generator = new SpecGenerator();
  });

  it("should generate a valid spec", () => {
    const project = {
      type: "backend-api" as const,
      language: "typescript" as const,
      runtime: "node20" as const,
      deployment: "container" as const,
      risk: "internal" as const,
    };

    const spec = generator.generateSpec(project);

    assert.equal(spec.version, "1.0.0");
    assert.deepEqual(spec.project, project);
    assert.equal(spec.standards.ci, "strict");
    assert.equal(spec.standards.security, "enforced");
  });

  it("should fail with incomplete project", () => {
    const project = {
      type: "backend-api" as const,
      language: "typescript" as const,
      // missing runtime, deployment
    };

    assert.throws(
      () => generator.generateSpec(project as any),
      /Incomplete project definition/
    );
  });

  it("should validate a generated spec", () => {
    const project = {
      type: "backend-api" as const,
      language: "typescript" as const,
      runtime: "node20" as const,
      deployment: "container" as const,
      risk: "internal" as const,
    };

    const spec = generator.generateSpec(project);
    const validation = generator.validateSpec(spec);

    assert.equal(validation.valid, true);
    assert.equal(validation.errors.length, 0);
  });

  it("should add metadata to spec", () => {
    const project = {
      type: "backend-api" as const,
      language: "typescript" as const,
      runtime: "node20" as const,
      deployment: "container" as const,
      risk: "internal" as const,
    };

    const spec = generator.generateSpec(project);

    assert(spec.metadata !== undefined);
    assert(spec.metadata?.generated !== undefined);
    assert.equal(spec.metadata?.generatedBy, "repoctl@0.1.0");
  });
});
