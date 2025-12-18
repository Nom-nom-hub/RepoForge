import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

export interface RepoForgeConfig {
  // Default spec path
  specPath?: string;

  // Default policy pack
  defaultPolicy?: "startup" | "saas" | "enterprise" | "oss";

  // GitHub settings
  github?: {
    owner?: string;
    defaultToken?: string; // Not recommended; use env var instead
  };

  // Automation
  autoFix?: boolean;
  dryRun?: boolean;

  // Output
  verbose?: boolean;
  quiet?: boolean;

  // Custom rules
  rules?: Record<string, any>;
}

export class ConfigLoader {
  private searchDirs = [
    process.cwd(),
    path.join(process.cwd(), ".."),
    path.join(process.cwd(), "../.."),
  ];

  /**
   * Load config from .repoforgerc.yaml, .repoforgerc.json, or repoforge.config.js
   */
  loadConfig(): RepoForgeConfig {
    // Try .repoforgerc.yaml
    for (const dir of this.searchDirs) {
      const yamlPath = path.join(dir, ".repoforgerc.yaml");
      if (fs.existsSync(yamlPath)) {
        return this.loadYamlConfig(yamlPath);
      }
    }

    // Try .repoforgerc.yml
    for (const dir of this.searchDirs) {
      const yamlPath = path.join(dir, ".repoforgerc.yml");
      if (fs.existsSync(yamlPath)) {
        return this.loadYamlConfig(yamlPath);
      }
    }

    // Try .repoforgerc.json
    for (const dir of this.searchDirs) {
      const jsonPath = path.join(dir, ".repoforgerc.json");
      if (fs.existsSync(jsonPath)) {
        return this.loadJsonConfig(jsonPath);
      }
    }

    // Default empty config
    return {};
  }

  /**
   * Load YAML config file
   */
  private loadYamlConfig(filePath: string): RepoForgeConfig {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const config = yaml.load(content) as RepoForgeConfig;
      return config || {};
    } catch (error) {
      console.warn(`⚠️  Failed to load config from ${filePath}`);
      return {};
    }
  }

  /**
   * Load JSON config file
   */
  private loadJsonConfig(filePath: string): RepoForgeConfig {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const config = JSON.parse(content) as RepoForgeConfig;
      return config || {};
    } catch (error) {
      console.warn(`⚠️  Failed to load config from ${filePath}`);
      return {};
    }
  }

  /**
   * Merge environment variables into config
   */
  applyEnvOverrides(config: RepoForgeConfig): RepoForgeConfig {
    const result = { ...config };

    // Environment variable overrides
    if (process.env.REPOFORGE_SPEC_PATH) {
      result.specPath = process.env.REPOFORGE_SPEC_PATH;
    }

    if (process.env.REPOFORGE_POLICY) {
      result.defaultPolicy = process.env.REPOFORGE_POLICY as any;
    }

    if (process.env.REPOFORGE_AUTO_FIX === "true") {
      result.autoFix = true;
    }

    if (process.env.REPOFORGE_DRY_RUN === "true") {
      result.dryRun = true;
    }

    if (process.env.REPOFORGE_VERBOSE === "true") {
      result.verbose = true;
    }

    if (process.env.REPOFORGE_QUIET === "true") {
      result.quiet = true;
    }

    return result;
  }

  /**
   * Create default config file
   */
  createDefaultConfig(filePath: string = ".repoforgerc.yaml"): void {
    const defaultConfig: RepoForgeConfig = {
      specPath: "repoforge.yaml",
      defaultPolicy: "saas",
      autoFix: false,
      dryRun: false,
      verbose: false,
      quiet: false,
      github: {
        // owner: "your-org",
        // Note: Don't commit tokens to config, use GITHUB_TOKEN env var
      },
    };

    const yamlContent = yaml.dump(defaultConfig, { lineWidth: -1 });
    fs.writeFileSync(filePath, yamlContent, "utf-8");
    console.log(`✓ Created ${filePath}`);
  }

  /**
   * Get effective config with environment overrides
   */
  getConfig(): RepoForgeConfig {
    const loaded = this.loadConfig();
    return this.applyEnvOverrides(loaded);
  }
}

export const globalConfigLoader = new ConfigLoader();
