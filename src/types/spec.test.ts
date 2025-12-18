import { describe, it, expect } from "vitest";
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

      expect(() => ProjectSchema.parse(project)).not.toThrow();
    });

    it("should reject invalid project type", () => {
      const project = {
        type: "invalid-type",
        language: "typescript",
        runtime: "node20",
        deployment: "container",
        risk: "internal",
      };

      expect(() => ProjectSchema.parse(project)).toThrow();
    });
  });

  describe("StandardsSchema", () => {
    it("should validate standards with defaults", () => {
      const standards = {
        ci: "strict" as const,
      };

      const result = StandardsSchema.parse(standards);
      expect(result.ci).toBe("strict");
      expect(result.security).toBe("enforced");
      expect(result.releases).toBe("strict");
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

      expect(() => SpecSchema.parse(spec)).not.toThrow();
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
      expect(result.version).toBe("1.0.0");
    });
  });
});
