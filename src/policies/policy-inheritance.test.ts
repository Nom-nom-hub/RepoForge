import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PolicyInheritanceManager } from "./policy-inheritance.js";
import { Spec } from "../types/spec.js";

describe("PolicyInheritanceManager", () => {
  it("should resolve policy hierarchy correctly", () => {
    const manager = new PolicyInheritanceManager();

    const orgPolicy: Partial<Spec> = {
      standards: { ci: "enforced", security: "enforced", releases: "enforced" },
    };

    const teamPolicy: Partial<Spec> = {
      standards: { ci: "enforced", security: "enforced", releases: "strict" },
    };

    const repoPolicy: Partial<Spec> = {
      standards: { ci: "strict", security: "enforced", releases: "strict" },
    };

    const resolved = manager.getEffectivePolicy(
      "/repo",
      orgPolicy,
      teamPolicy,
      repoPolicy
    );

    assert.equal(resolved.standards?.ci, "strict");
    assert.equal(resolved.standards?.security, "enforced");
    assert.equal(resolved.standards?.releases, "strict");
  });

  it("should check compliance with inherited policies", () => {
    const manager = new PolicyInheritanceManager();

    const inheritedPolicy: Partial<Spec> = {
      standards: { ci: "enforced", security: "enforced", releases: "strict" },
    };

    const compliantSpec: Partial<Spec> = {
      standards: { ci: "enforced", security: "enforced", releases: "strict" },
    };

    const result = manager.checkCompliance(compliantSpec, inheritedPolicy);

    assert.equal(result.compliant, true);
    assert.equal(result.violations.length, 0);
  });

  it("should detect non-compliance", () => {
    const manager = new PolicyInheritanceManager();

    const inheritedPolicy: Partial<Spec> = {
      standards: { ci: "enforced", security: "enforced", releases: "strict" },
    };

    const nonCompliantSpec: Partial<Spec> = {
      standards: { ci: "strict", security: "enforced", releases: "strict" },
    };

    const result = manager.checkCompliance(nonCompliantSpec, inheritedPolicy);

    assert.equal(result.compliant, false);
    assert.ok(result.violations.length > 0);
    assert.ok(result.violations[0].includes("CI standard mismatch"));
  });

  it("should handle multiple inheritance levels", () => {
    const manager = new PolicyInheritanceManager();

    manager.register("organization", {
      standards: { ci: "enforced", security: "enforced", releases: "enforced" },
    }, "org");

    manager.register("team", {
      standards: { ci: "enforced", security: "enforced", releases: "strict" },
    }, "team");

    manager.register("repository", {
      standards: { ci: "strict", security: "enforced", releases: "strict" },
    }, "repo");

    const resolved = manager.resolvePolicy();

    assert.equal(resolved.standards?.ci, "strict");
    assert.equal(resolved.standards?.security, "enforced");
    assert.equal(resolved.standards?.releases, "strict");
  });

  it("should default org policy when no repo policy", () => {
    const manager = new PolicyInheritanceManager();

    const orgPolicy: Partial<Spec> = {
      standards: { ci: "enforced", security: "strict", releases: "permissive" },
    };

    const resolved = manager.getEffectivePolicy("/repo", orgPolicy);

    assert.equal(resolved.standards?.ci, "enforced");
    assert.equal(resolved.standards?.security, "strict");
    assert.equal(resolved.standards?.releases, "permissive");
  });
});
