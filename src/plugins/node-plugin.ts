import { Plugin, PluginManifest, PluginOutput, Rule } from "./plugin-registry.js";
import { Spec } from "../types/spec.js";

export class NodePlugin extends Plugin {
  manifest: PluginManifest = {
    name: "node",
    version: "1.0.0",
    appliesTo: {
      languages: ["typescript", "javascript"],
      projectTypes: ["backend-api", "frontend", "cli", "library"],
    },
  };

  isApplicable(spec: Spec): boolean {
    return (
      spec.project.language === "typescript" ||
      spec.project.language === "javascript"
    );
  }

  async execute(spec: Spec): Promise<PluginOutput> {
    const files = new Map<string, string>();
    const workflows = new Map<string, string>();
    const rules: Rule[] = [];

    // Generate package.json requirements
    files.set(
      ".npmrc",
      `engine-strict=true
legacy-peer-deps=false
`
    );

    // Generate ESLint config
    files.set(
      ".eslintrc.json",
      JSON.stringify(
        {
          env: {
            node: true,
            es2020: true,
          },
          extends: ["eslint:recommended"],
          parserOptions: {
            ecmaVersion: "latest",
          },
          rules: {
            "no-console": "warn",
            "no-debugger": "error",
          },
        },
        null,
        2
      )
    );

    // Generate TypeScript config rules
    rules.push({
      name: "node-package-json",
      description: "Ensure package.json has required fields",
      severity: "error",
      validator: (files: Map<string, string>) => {
        const pkgJson = files.get("package.json");
        if (!pkgJson) return false;
        try {
          const pkg = JSON.parse(pkgJson);
          return !!(pkg.name && pkg.version && pkg.description);
        } catch {
          return false;
        }
      },
    });

    rules.push({
      name: "node-engines",
      description: "Specify Node.js version in package.json",
      severity: "warn",
      validator: (files: Map<string, string>) => {
        const pkgJson = files.get("package.json");
        if (!pkgJson) return false;
        try {
          const pkg = JSON.parse(pkgJson);
          return !!pkg.engines?.node;
        } catch {
          return false;
        }
      },
    });

    return {
      files,
      workflows,
      rules,
    };
  }
}
