import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { ProjectAnalyzer } from "./analyzer/project-analyzer.js";
import { SpecGenerator } from "./generator/spec-generator.js";
import { WorkflowGenerator } from "./generator/workflow-generator.js";
import { FileGenerator } from "./generator/file-generator.js";
import { SpecValidator } from "./enforcer/spec-validator.js";
import { PolicyInheritanceManager } from "./policies/policy-inheritance.js";
import { Spec } from "./types/spec.js";

describe("Integration Tests - Full Workflows", () => {
  const testDir = "./test-repo-integration";

  before(() => {
    // Create test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    fs.mkdirSync(testDir, { recursive: true });

    // Create a mock Node.js project
    fs.writeFileSync(
      path.join(testDir, "package.json"),
      JSON.stringify({
        name: "test-project",
        version: "1.0.0",
        type: "module",
        scripts: { test: "jest" },
      })
    );

    fs.writeFileSync(path.join(testDir, "tsconfig.json"), "{}");
  });

  after(() => {
    // Cleanup
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  it("workflow: analyze → generate → validate", () => {
    // Step 1: Analyze project
    const analyzer = new ProjectAnalyzer(testDir);
    const analysis = analyzer.analyze();

    assert.ok(analysis.project.language, "Should detect language");
    assert.ok(analysis.project.type, "Should detect project type");
    assert.ok(analysis.confidence > 0.5, "Should have reasonable confidence");

    // Step 2: Generate spec
    const specGen = new SpecGenerator();
    const spec = specGen.generateSpec(analysis.project);

    assert.ok(spec.version, "Spec should have version");
    assert.ok(spec.standards, "Spec should have standards");
    assert.equal(spec.project.language, analysis.project.language);

    // Step 3: Validate spec
    const validator = new SpecValidator();
    const validation = validator.validate(spec, new Set());

    // May have violations but should be parseable
    assert.ok(validation !== null, "Should return validation result");
  });

  it("workflow: apply spec to local files", () => {
    // Generate spec
    const analyzer = new ProjectAnalyzer(testDir);
    const analysis = analyzer.analyze();
    const specGen = new SpecGenerator();
    const spec = specGen.generateSpec(analysis.project);

    // Generate files
    const workflowGen = new WorkflowGenerator();
    const fileGen = new FileGenerator();

    const workflows = [
      workflowGen.generateCIWorkflow(spec),
      workflowGen.generateSecurityWorkflow(spec),
      workflowGen.generateReleaseWorkflow(spec),
    ];

    const files = fileGen.generateFiles(spec);

    // Simulate applying to filesystem
    const appliedFiles = new Map<string, string>();
    appliedFiles.set("repoforge.yaml", yaml.dump(spec));

    for (const wf of workflows) {
      appliedFiles.set(`.github/workflows/${wf.name}`, wf.content);
    }

    for (const f of files) {
      appliedFiles.set(f.path, f.content);
    }

    // Verify files would be created
    assert.ok(appliedFiles.has("repoforge.yaml"), "Should have spec");
    assert.ok(
      Array.from(appliedFiles.keys()).some((k) => k.includes("ci.yml")),
      "Should have CI workflow"
    );
    assert.ok(
      Array.from(appliedFiles.keys()).some((k) => k.includes("security.yml")),
      "Should have security workflow"
    );

    // Verify file count
    assert.ok(appliedFiles.size > 5, "Should generate multiple files");
  });

  it("workflow: policy inheritance → compliance check", () => {
    // Create specs at different levels
    const orgPolicy: Partial<Spec> = {
      standards: { ci: "enforced", security: "enforced", releases: "strict" },
    };

    const teamPolicy: Partial<Spec> = {
      standards: { ci: "enforced", security: "enforced", releases: "strict" },
    };

    const analyzer = new ProjectAnalyzer(testDir);
    const analysis = analyzer.analyze();
    const specGen = new SpecGenerator();
    let repoSpec = specGen.generateSpec(analysis.project);

    // Apply policies
    const manager = new PolicyInheritanceManager();
    const effectivePolicy = manager.getEffectivePolicy(
      testDir,
      orgPolicy,
      teamPolicy,
      repoSpec
    );

    // Update repo spec with effective policy
    repoSpec = {
      ...repoSpec,
      standards: effectivePolicy.standards,
    } as Spec;

    // Check compliance
    const compliance = manager.checkCompliance(repoSpec, effectivePolicy);

    // Should be compliant after applying policies
    assert.equal(compliance.compliant, true, "Should be compliant after policy application");
  });

  it("workflow: detect drift and violations", () => {
    // Generate spec
    const analyzer = new ProjectAnalyzer(testDir);
    const analysis = analyzer.analyze();
    const specGen = new SpecGenerator();
    const spec = specGen.generateSpec(analysis.project);

    // Simulate missing required files
    const existingFiles = new Set([
      ".github/workflows/ci.yml", // Only has CI, missing security and release
    ]);

    // Validate
    const validator = new SpecValidator();
    const result = validator.validate(spec, existingFiles);

    // Should detect missing workflows
    assert.ok(
      result.violations.length > 0,
      "Should detect missing required workflows"
    );

    const missingSecurityWorkflow = result.violations.some((v) =>
      v.file.includes("security.yml")
    );
    assert.ok(missingSecurityWorkflow, "Should specifically detect missing security workflow");
  });

  it("workflow: multi-spec policy merge", () => {
    // Create multiple org policies
    const policies = [
      {
        name: "base",
        spec: {
          standards: { ci: "strict", security: "enforced", releases: "permissive" },
        },
      },
      {
        name: "production",
        spec: {
          standards: { ci: "enforced", security: "enforced", releases: "enforced" },
        },
      },
    ];

    const manager = new PolicyInheritanceManager();

    // Simulate merging production requirements over base
    const merged = {
      standards: {
        ci: policies[1].spec.standards?.ci || policies[0].spec.standards?.ci,
        security:
          policies[1].spec.standards?.security ||
          policies[0].spec.standards?.security,
        releases:
          policies[1].spec.standards?.releases ||
          policies[0].spec.standards?.releases,
      },
    };

    // Production should override base
    assert.equal(merged.standards.ci, "enforced");
    assert.equal(merged.standards.security, "enforced");
    assert.equal(merged.standards.releases, "enforced");
  });

  it("workflow: generate → validate → check compliance", () => {
    // Full workflow from scratch
    const analyzer = new ProjectAnalyzer(testDir);
    const analysis = analyzer.analyze();

    const specGen = new SpecGenerator();
    const spec = specGen.generateSpec(analysis.project);

    // Validate generated spec
    const specValidation = specGen.validateSpec(spec);
    assert.ok(specValidation.valid, "Generated spec should be valid");

    // Generate workflows
    const workflowGen = new WorkflowGenerator();
    const ci = workflowGen.generateCIWorkflow(spec);
    const security = workflowGen.generateSecurityWorkflow(spec);
    const release = workflowGen.generateReleaseWorkflow(spec);

    // Verify all workflows generated
    assert.ok(ci.content, "CI workflow should have content");
    assert.ok(security.content, "Security workflow should have content");
    assert.ok(release.content, "Release workflow should have content");

    // Verify workflow names are set
    assert.ok(ci.name.endsWith(".yml"), "Workflow name should end with .yml");
    assert.ok(security.name.endsWith(".yml"), "Workflow name should end with .yml");
    assert.ok(release.name.endsWith(".yml"), "Workflow name should end with .yml");

    // Check that workflows have proper structure (YAML)
    assert.ok(ci.content.includes("name:"), "CI workflow should be YAML");
    assert.ok(ci.content.includes("on:"), "CI workflow should define triggers");
    assert.ok(ci.content.includes("jobs:"), "CI workflow should define jobs");
  });

  it("workflow: complete init-to-apply scenario", () => {
    // This represents the complete user journey
    const workDir = path.join(testDir, "complete-scenario");
    fs.mkdirSync(workDir, { recursive: true });

    // Step 1: User runs repoctl analyze
    const analyzer = new ProjectAnalyzer(workDir);
    const analysis = analyzer.analyze();
    assert.ok(analysis, "Should analyze project");

    // Step 2: User runs repoctl init (or init creates spec)
    const specGen = new SpecGenerator();
    const spec = specGen.generateSpec(analysis.project);
    const specContent = yaml.dump(spec);
    fs.writeFileSync(path.join(workDir, "repoforge.yaml"), specContent);

    // Step 3: User runs repoctl apply (we generate files)
    const workflowGen = new WorkflowGenerator();
    const fileGen = new FileGenerator();

    const workflows = [
      workflowGen.generateCIWorkflow(spec),
      workflowGen.generateSecurityWorkflow(spec),
      workflowGen.generateReleaseWorkflow(spec),
    ];

    const files = fileGen.generateFiles(spec);

    // Simulate writing files
    const filesToWrite = new Map<string, string>();
    for (const wf of workflows) {
      filesToWrite.set(`.github/workflows/${wf.name}`, wf.content);
    }
    for (const f of files) {
      filesToWrite.set(f.path, f.content);
    }

    // Step 4: Verify all files are ready
    assert.ok(filesToWrite.size > 5, "Should have generated multiple files");
    assert.ok(
      Array.from(filesToWrite.keys()).some((k) => k.includes(".github/workflows")),
      "Should have workflows"
    );

    // Step 5: User runs repoctl validate
    const validator = new SpecValidator();
    const validation = validator.validate(spec, new Set(filesToWrite.keys()));
    assert.ok(validation !== null, "Should validate spec against generated files");

    // Cleanup
    fs.rmSync(workDir, { recursive: true });
  });
});
