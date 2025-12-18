import { Spec, Project } from "../types/spec.js";

export class SpecGenerator {
  generateSpec(project: Partial<Project>): Spec {
    if (
      !project.type ||
      !project.language ||
      !project.runtime ||
      !project.deployment
    ) {
      throw new Error("Incomplete project definition");
    }

    return {
      version: "1.0.0",
      project: {
        type: project.type,
        language: project.language,
        runtime: project.runtime,
        deployment: project.deployment,
        risk: project.risk || "internal",
      },
      standards: {
        ci: "strict",
        security: "enforced",
        releases: "strict",
      },
      metadata: {
        generated: new Date().toISOString(),
        generatedBy: "repoctl@0.1.0",
      },
    };
  }

  validateSpec(spec: Spec): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!spec.version) errors.push("Missing spec version");
    if (!spec.project) errors.push("Missing project definition");
    if (!spec.standards) errors.push("Missing standards definition");

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
