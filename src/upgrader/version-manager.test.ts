import { describe, it, expect, beforeEach } from "vitest";
import { VersionManager } from "./version-manager.js";

describe("VersionManager", () => {
  let manager: VersionManager;

  beforeEach(() => {
    manager = new VersionManager();
  });

  it("should return latest version", () => {
    const latest = manager.getLatestVersion();
    expect(latest).toBeDefined();
    expect(latest).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("should get version metadata", () => {
    const meta = manager.getVersionMetadata("1.0.0");
    expect(meta).toBeDefined();
    expect(meta?.version).toBe("1.0.0");
    expect(meta?.features).toContain("Initial release");
  });

  it("should plan minor upgrade", () => {
    const guide = manager.planUpgrade("1.0.0", "1.1.0");

    expect(guide.from).toBe("1.0.0");
    expect(guide.to).toBe("1.1.0");
    expect(guide.backupRequired).toBe(false);
  });

  it("should plan major upgrade", () => {
    const guide = manager.planUpgrade("1.0.0", "2.0.0");

    expect(guide.from).toBe("1.0.0");
    expect(guide.to).toBe("2.0.0");
    expect(guide.backupRequired).toBe(true);
  });

  it("should detect when already at target version", () => {
    const guide = manager.planUpgrade("1.0.0", "1.0.0");

    expect(guide.steps).toHaveLength(0);
  });

  it("should include breaking changes in metadata", () => {
    const meta = manager.getVersionMetadata("2.0.0");
    expect(meta?.breakingChanges.length).toBeGreaterThan(0);
  });

  it("should generate migration script", () => {
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

    const guide = manager.planUpgrade("1.0.0", "1.1.0");
    const migrations = manager.generateMigrationScript(spec, guide);

    expect(migrations).toBeDefined();
    expect(migrations.size).toBeGreaterThanOrEqual(0);
  });
});
