import { Plugin, PluginManifest, PluginOutput, Rule } from "./plugin-registry.js";
import { Spec } from "../types/spec.js";

export class RustPlugin extends Plugin {
  manifest: PluginManifest = {
    name: "rust",
    version: "1.0.0",
    appliesTo: {
      languages: ["rust"],
      projectTypes: ["backend-api", "cli", "library"],
    },
  };

  isApplicable(spec: Spec): boolean {
    return spec.project.language === "rust";
  }

  async execute(spec: Spec): Promise<PluginOutput> {
    const files = new Map<string, string>();
    const workflows = new Map<string, string>();
    const rules: Rule[] = [];

    // Generate Cargo.toml
    files.set(
      "Cargo.toml",
      `[package]
name = "project"
version = "0.1.0"
edition = "2021"

[dependencies]

[dev-dependencies]

[profile.release]
opt-level = 3
lto = true
`
    );

    // Generate rustfmt config
    files.set(
      "rustfmt.toml",
      `edition = "2021"
hard_tabs = false
tab_spaces = 2
newline_style = "Auto"
use_small_heuristics = "Default"
reorder_imports = true
reorder_modules = true
`
    );

    // Generate clippy config
    files.set(
      ".clippy.toml",
      `too-many-arguments-threshold = 8
type-complexity-threshold = 250
single-char-lifetime-names-threshold = 4
`
    );

    // Generate Makefile for common tasks
    files.set(
      "Makefile",
      `.PHONY: build test lint fmt check clean

build:
	cargo build --release

test:
	cargo test --all

lint:
	cargo clippy --all -- -D warnings

fmt:
	cargo fmt --all

check:
	cargo check

clean:
	cargo clean
`
    );

    // Add validation rules
    rules.push({
      name: "rust-cargo-toml",
      description: "Ensure Cargo.toml exists and is valid",
      severity: "error",
      validator: (files: Map<string, string>) => {
        const cargoToml = files.get("Cargo.toml");
        return !!cargoToml && cargoToml.includes("[package]");
      },
    });

    rules.push({
      name: "rust-format-config",
      description: "Ensure rustfmt.toml exists for code formatting",
      severity: "warn",
      validator: (files: Map<string, string>) => files.has("rustfmt.toml"),
    });

    rules.push({
      name: "rust-lint-config",
      description: "Ensure .clippy.toml exists for linting",
      severity: "warn",
      validator: (files: Map<string, string>) => files.has(".clippy.toml"),
    });

    rules.push({
      name: "rust-makefile",
      description: "Ensure Makefile exists for build automation",
      severity: "warn",
      validator: (files: Map<string, string>) => {
        const makefile = files.get("Makefile");
        return !!makefile && makefile.includes("build") && makefile.includes("test");
      },
    });

    return {
      files,
      workflows,
      rules,
    };
  }
}
