import { Spec } from "../types/spec.js";

export interface VersionMetadata {
  version: string;
  date: string;
  breakingChanges: string[];
  features: string[];
  deprecations: string[];
}

export interface UpgradeGuide {
  from: string;
  to: string;
  steps: UpgradeStep[];
  backupRequired: boolean;
}

export interface UpgradeStep {
  action: "create" | "modify" | "delete" | "manual";
  file: string;
  reason: string;
  oldContent?: string;
  newContent?: string;
}

export class VersionManager {
  private versions: Map<string, VersionMetadata>;

  constructor() {
    this.versions = new Map([
      [
        "1.0.0",
        {
          version: "1.0.0",
          date: "2024-01-01",
          breakingChanges: [],
          features: ["Initial release", "CI/Security workflows", "Spec system"],
          deprecations: [],
        },
      ],
      [
        "1.1.0",
        {
          version: "1.1.0",
          date: "2024-02-01",
          breakingChanges: [],
          features: [
            "Release workflow support",
            "Improved dependency scanning",
            "Added Go language support",
          ],
          deprecations: [],
        },
      ],
      [
        "2.0.0",
        {
          version: "2.0.0",
          date: "2024-03-01",
          breakingChanges: [
            "Spec format changed from 1.0 to 2.0",
            "CI level 'permissive' renamed to 'relaxed'",
          ],
          features: [
            "Policy packs",
            "Team-level standards",
            "Drift auto-remediation",
          ],
          deprecations: ["Old spec format (1.0)"],
        },
      ],
    ]);
  }

  getLatestVersion(): string {
    const versions = Array.from(this.versions.keys()).sort((a, b) => {
      const aParts = a.split(".").map(Number);
      const bParts = b.split(".").map(Number);
      for (let i = 0; i < 3; i++) {
        if (aParts[i] !== bParts[i]) {
          return bParts[i] - aParts[i];
        }
      }
      return 0;
    });
    return versions[0];
  }

  getVersionMetadata(version: string): VersionMetadata | undefined {
    return this.versions.get(version);
  }

  planUpgrade(currentVersion: string, targetVersion: string): UpgradeGuide {
    if (currentVersion === targetVersion) {
      return {
        from: currentVersion,
        to: targetVersion,
        steps: [],
        backupRequired: false,
      };
    }

    // Parse versions
    const [currentMajor, currentMinor] = currentVersion
      .split(".")
      .map(Number);
    const [targetMajor, targetMinor] = targetVersion.split(".").map(Number);

    const isMajorUpgrade = targetMajor > currentMajor;

    const steps: UpgradeStep[] = [];

    // Add version-specific migration steps
    if (
      currentMajor === 1 &&
      currentMinor < 1 &&
      targetMajor === 1 &&
      targetMinor >= 1
    ) {
      steps.push({
        action: "create",
        file: ".github/workflows/release.yml",
        reason: "New release workflow added in v1.1.0",
      });
    }

    if (currentMajor === 1 && targetMajor === 2) {
      steps.push({
        action: "modify",
        file: "repoforge.yaml",
        reason: "Spec format updated from v1 to v2",
      });
      steps.push({
        action: "modify",
        file: ".github/workflows/ci.yml",
        reason: "CI workflow improvements in v2.0.0",
      });
    }

    return {
      from: currentVersion,
      to: targetVersion,
      steps,
      backupRequired: isMajorUpgrade,
    };
  }

  generateMigrationScript(
    spec: Spec,
    guide: UpgradeGuide
  ): Map<string, string> {
    const migrations = new Map<string, string>();

    for (const step of guide.steps) {
      if (step.action === "create" || step.action === "modify") {
        migrations.set(step.file, `// TODO: ${step.reason}`);
      }
    }

    return migrations;
  }
}
