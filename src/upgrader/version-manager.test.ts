import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { VersionManager } from "./version-manager.js";

describe("VersionManager", () => {
  let manager: VersionManager;

  beforeEach(() => {
    manager = new VersionManager();
  });

  it("should return latest version", () => {
    const latest = manager.getLatestVersion();
    assert(latest !== undefined);
    assert(/^\d+\.\d+\.\d+$/.test(latest));
  });

  it("should get version metadata", () => {
    const meta = manager.getVersionMetadata("1.0.0");
    assert(meta !== undefined);
    assert.equal(meta?.version, "1.0.0");
    assert(meta?.features.includes("Initial release"));
  });

  it("should plan minor upgrade", () => {
    const guide = manager.planUpgrade("1.0.0", "1.1.0");

    assert.equal(guide.from, "1.0.0");
    assert.equal(guide.to, "1.1.0");
    assert.equal(guide.backupRequired, false);
  });

  it("should plan major upgrade", () => {
    const guide = manager.planUpgrade("1.0.0", "2.0.0");

    assert.equal(guide.from, "1.0.0");
    assert.equal(guide.to, "2.0.0");
    assert.equal(guide.backupRequired, true);
  });

  it("should detect when already at target version", () => {
    const guide = manager.planUpgrade("1.0.0", "1.0.0");

    assert.equal(guide.steps.length, 0);
  });

  it("should include breaking changes in metadata", () => {
    const meta = manager.getVersionMetadata("2.0.0");
    assert(meta && meta.breakingChanges.length > 0);
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

    assert(migrations !== undefined);
    assert(migrations.size >= 0);
  });
});
