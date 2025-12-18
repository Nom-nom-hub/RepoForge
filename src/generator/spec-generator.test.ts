import { describe, it, expect } from "vitest";
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

    expect(spec.version).toBe("1.0.0");
    expect(spec.project).toEqual(project);
    expect(spec.standards.ci).toBe("strict");
    expect(spec.standards.security).toBe("enforced");
  });

  it("should fail with incomplete project", () => {
    const project = {
      type: "backend-api" as const,
      language: "typescript" as const,
      // missing runtime, deployment
    };

    expect(() =>
      generator.generateSpec(project as any)
    ).toThrow("Incomplete project definition");
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

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
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

    expect(spec.metadata).toBeDefined();
    expect(spec.metadata?.generated).toBeDefined();
    expect(spec.metadata?.generatedBy).toBe("repoctl@0.1.0");
  });
});
