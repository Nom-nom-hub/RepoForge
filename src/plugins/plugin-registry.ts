import { Spec, Project } from "../types/spec.js";

export interface PluginManifest {
  name: string;
  version: string;
  appliesTo: {
    languages?: string[];
    projectTypes?: string[];
    deployments?: string[];
  };
}

export interface PluginOutput {
  files: Map<string, string>;
  workflows: Map<string, string>;
  rules: Rule[];
}

export interface Rule {
  name: string;
  description: string;
  severity: "warn" | "error";
  validator: (files: Map<string, string>) => boolean;
}

export abstract class Plugin {
  abstract manifest: PluginManifest;

  abstract isApplicable(spec: Spec): boolean;

  abstract execute(spec: Spec): Promise<PluginOutput>;
}

export class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();

  register(plugin: Plugin): void {
    this.plugins.set(plugin.manifest.name, plugin);
  }

  getApplicable(spec: Spec): Plugin[] {
    return Array.from(this.plugins.values()).filter((p) =>
      p.isApplicable(spec)
    );
  }

  async executeAll(spec: Spec): Promise<PluginOutput> {
    const applicable = this.getApplicable(spec);
    const allFiles = new Map<string, string>();
    const allWorkflows = new Map<string, string>();
    const allRules: Rule[] = [];

    for (const plugin of applicable) {
      try {
        const output = await plugin.execute(spec);
        output.files.forEach((v, k) => allFiles.set(k, v));
        output.workflows.forEach((v, k) => allWorkflows.set(k, v));
        allRules.push(...output.rules);
      } catch (error) {
        console.error(`Plugin ${plugin.manifest.name} failed:`, error);
      }
    }

    return {
      files: allFiles,
      workflows: allWorkflows,
      rules: allRules,
    };
  }
}
