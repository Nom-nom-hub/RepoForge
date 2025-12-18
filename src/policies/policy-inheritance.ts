import { Spec } from "../types/spec.js";

export interface PolicyHierarchy {
  level: "organization" | "team" | "repository";
  policy: Partial<Spec>;
  source: string; // URL or file path
}

export class PolicyInheritanceManager {
  private policies: PolicyHierarchy[] = [];

  /**
   * Register a policy at a specific level
   */
  register(level: "organization" | "team" | "repository", policy: Partial<Spec>, source: string): void {
    this.policies.push({ level, policy, source });
  }

  /**
   * Resolve inheritance chain for a repository
   * Organization → Team → Repository (more specific wins)
   */
  resolvePolicy(repoPolicy?: Partial<Spec>): Partial<Spec> {
    const orgPolicies = this.policies.filter((p) => p.level === "organization");
    const teamPolicies = this.policies.filter((p) => p.level === "team");
    const repoPolicies = this.policies.filter((p) => p.level === "repository");

    // Merge in order: org → team → repo (repo has highest priority)
    return this.deepMerge(
      this.deepMerge(this.mergeArray(orgPolicies), this.mergeArray(teamPolicies)),
      this.mergeArray(repoPolicies),
      repoPolicy || {}
    );
  }

  /**
   * Merge an array of policies
   */
  private mergeArray(policies: PolicyHierarchy[]): Partial<Spec> {
    return policies.reduce((acc, curr) => this.deepMerge(acc, curr.policy), {});
  }

  /**
   * Deep merge two objects (right overwrites left)
   */
  private deepMerge(left: any, right: any, ...rest: any[]): any {
    if (rest.length > 0) {
      return this.deepMerge(this.deepMerge(left, right), rest[0], ...rest.slice(1));
    }

    if (!left || typeof left !== "object") {
      return right;
    }
    if (!right || typeof right !== "object") {
      return left;
    }

    const result = { ...left };
    for (const key in right) {
      if (right.hasOwnProperty(key)) {
        if (typeof right[key] === "object" && !Array.isArray(right[key])) {
          result[key] = this.deepMerge(left[key] || {}, right[key]);
        } else {
          result[key] = right[key];
        }
      }
    }
    return result;
  }

  /**
   * Get the effective policy for a repository
   */
  getEffectivePolicy(
    repoPath: string,
    orgPolicy?: Partial<Spec>,
    teamPolicy?: Partial<Spec>,
    repoPolicy?: Partial<Spec>
  ): Partial<Spec> {
    this.policies = [];

    if (orgPolicy) {
      this.register("organization", orgPolicy, "organization");
    }
    if (teamPolicy) {
      this.register("team", teamPolicy, "team");
    }
    if (repoPolicy) {
      this.register("repository", repoPolicy, "repository");
    }

    return this.resolvePolicy(repoPolicy);
  }

  /**
   * Check if a repo complies with inherited policies
   */
  checkCompliance(repoSpec: Partial<Spec>, inheritedPolicy: Partial<Spec>): {
    compliant: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    // Check standards compliance
    if (inheritedPolicy.standards?.ci) {
      if (repoSpec.standards?.ci !== inheritedPolicy.standards.ci) {
        violations.push(
          `CI standard mismatch: expected ${inheritedPolicy.standards.ci}, got ${repoSpec.standards?.ci}`
        );
      }
    }

    if (inheritedPolicy.standards?.security) {
      if (repoSpec.standards?.security !== inheritedPolicy.standards.security) {
        violations.push(
          `Security standard mismatch: expected ${inheritedPolicy.standards.security}, got ${repoSpec.standards?.security}`
        );
      }
    }

    if (inheritedPolicy.standards?.releases) {
      if (repoSpec.standards?.releases !== inheritedPolicy.standards.releases) {
        violations.push(
          `Release standard mismatch: expected ${inheritedPolicy.standards.releases}, got ${repoSpec.standards?.releases}`
        );
      }
    }

    // Check project requirements
    if (inheritedPolicy.project?.language) {
      if (repoSpec.project?.language !== inheritedPolicy.project.language) {
        violations.push(
          `Language mismatch: expected ${inheritedPolicy.project.language}, got ${repoSpec.project?.language}`
        );
      }
    }

    return {
      compliant: violations.length === 0,
      violations,
    };
  }
}
