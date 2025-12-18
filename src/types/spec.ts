import { z } from "zod";

export const ProjectTypeSchema = z.enum([
  "backend-api",
  "frontend",
  "cli",
  "library",
  "monorepo",
  "static-site",
]);

export const LanguageSchema = z.enum([
  "typescript",
  "javascript",
  "python",
  "go",
  "rust",
]);

export const RuntimeSchema = z.enum([
  "node16",
  "node18",
  "node20",
  "python39",
  "python310",
  "python311",
]);

export const DeploymentSchema = z.enum([
  "container",
  "serverless",
  "static",
  "vm",
]);

export const RiskProfileSchema = z.enum([
  "public",
  "internal",
  "regulated",
  "oss",
]);

export const StandardsLevelSchema = z.enum([
  "permissive",
  "strict",
  "enforced",
]);

export const ProjectSchema = z.object({
  type: ProjectTypeSchema,
  language: LanguageSchema,
  runtime: RuntimeSchema,
  deployment: DeploymentSchema,
  risk: RiskProfileSchema,
});

export const StandardsSchema = z.object({
  ci: StandardsLevelSchema.default("strict"),
  security: StandardsLevelSchema.default("enforced"),
  releases: StandardsLevelSchema.default("strict"),
});

export const SpecSchema = z.object({
  version: z.string().default("1.0.0"),
  project: ProjectSchema,
  standards: StandardsSchema,
  metadata: z.object({
    generated: z.string().optional(),
    generatedBy: z.string().optional(),
  }).optional(),
});

export type Spec = z.infer<typeof SpecSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Standards = z.infer<typeof StandardsSchema>;
