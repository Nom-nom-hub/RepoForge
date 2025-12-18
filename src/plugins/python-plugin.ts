import { Plugin, PluginManifest, PluginOutput, Rule } from "./plugin-registry.js";
import { Spec } from "../types/spec.js";

export class PythonPlugin extends Plugin {
  manifest: PluginManifest = {
    name: "python",
    version: "1.0.0",
    appliesTo: {
      languages: ["python"],
      projectTypes: ["backend-api", "cli", "library"],
    },
  };

  isApplicable(spec: Spec): boolean {
    return spec.project.language === "python";
  }

  async execute(spec: Spec): Promise<PluginOutput> {
    const files = new Map<string, string>();
    const workflows = new Map<string, string>();
    const rules: Rule[] = [];

    // Generate pyproject.toml template
    files.set(
      "pyproject.toml",
      `[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "project"
version = "0.1.0"
description = "Project description"
requires-python = ">=${this.getPythonVersion(spec)}"
dependencies = []

[project.optional-dependencies]
dev = [
    "pytest>=7.0",
    "pytest-cov>=4.0",
    "black>=22.0",
    "isort>=5.0",
    "pylint>=2.0",
]

[tool.black]
line-length = 100
target-version = ["py${this.getPythonTarget(spec)}"]

[tool.isort]
profile = "black"
line_length = 100

[tool.pylint]
max-line-length = 100
disable = ["C0111"]
`
    );

    // Generate .python-version
    files.set(
      ".python-version",
      this.getPythonVersion(spec)
    );

    // Generate requirements.txt
    files.set(
      "requirements.txt",
      `# Python project dependencies
# Install with: pip install -r requirements.txt
`
    );

    // Add validation rules
    rules.push({
      name: "python-pyproject-toml",
      description: "Ensure pyproject.toml exists",
      severity: "error",
      validator: (files: Map<string, string>) => files.has("pyproject.toml"),
    });

    rules.push({
      name: "python-version-file",
      description: "Specify Python version in .python-version",
      severity: "warn",
      validator: (files: Map<string, string>) => files.has(".python-version"),
    });

    return {
      files,
      workflows,
      rules,
    };
  }

  private getPythonVersion(spec: Spec): string {
    const mapping: Record<string, string> = {
      python39: "3.9",
      python310: "3.10",
      python311: "3.11",
    };
    return mapping[spec.project.runtime] || "3.11";
  }

  private getPythonTarget(spec: Spec): string {
    const mapping: Record<string, string> = {
      python39: "39",
      python310: "310",
      python311: "311",
    };
    return mapping[spec.project.runtime] || "311";
  }
}
