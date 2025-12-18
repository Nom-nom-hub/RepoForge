import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SpecSchema, ProjectSchema, StandardsSchema } from "./spec.js";

describe("Spec Schema", () => {
  describe("ProjectSchema", () => {
    it("should validate a valid project", () => {
      const project = {
        type: "backend-api" as const,
        language: "typescript" as const,
        runtime: "node20" as const,
        deployment: "container" as const,
        risk: "internal" as const,
      };

      assert.doesNotThrow(() => ProjectSchema.parse(project));
    });

    it("should reject invalid project type", () => {
      const project = {
        type: "invalid-type",
        language: "typescript",
        runtime: "node20",
        deployment: "container",
        risk: "internal",
      };

      assert.throws(() => ProjectSchema.parse(project));
    });
  });

  describe("StandardsSchema", () => {
    it("should validate standards with defaults", () => {
      const standards = {
        ci: "strict" as const,
      };

      const result = StandardsSchema.parse(standards);
      assert.equal(result.ci, "strict");
      assert.equal(result.security, "enforced");
      assert.equal(result.releases, "strict");
    });
  });

  describe("SpecSchema", () => {
    it("should validate a complete spec", () => {
      const spec = {
        version: "1.0.0",
        project: {
          type: "backend-api" as const,
          language: "typescript" as const,
          runtime: "node20" as const,
          deployment: "container" as const,
          risk: "internal" as const,
        },
        standards: {
          ci: "strict" as const,
          security: "enforced" as const,
          releases: "strict" as const,
        },
      };

      assert.doesNotThrow(() => SpecSchema.parse(spec));
    });

    it("should add defaults for missing version", () => {
      const spec = {
        project: {
          type: "backend-api" as const,
          language: "typescript" as const,
          runtime: "node20" as const,
          deployment: "container" as const,
          risk: "internal" as const,
        },
        standards: {
          ci: "strict" as const,
        },
      };

      const result = SpecSchema.parse(spec);
      assert.equal(result.version, "1.0.0");
    });
  });
});
