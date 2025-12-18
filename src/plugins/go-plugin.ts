import { Plugin, PluginManifest, PluginOutput, Rule } from "./plugin-registry.js";
import { Spec } from "../types/spec.js";

export class GoPlugin extends Plugin {
  manifest: PluginManifest = {
    name: "go",
    version: "1.0.0",
    appliesTo: {
      languages: ["go"],
      projectTypes: ["backend-api", "cli", "library"],
    },
  };

  isApplicable(spec: Spec): boolean {
    return spec.project.language === "go";
  }

  async execute(spec: Spec): Promise<PluginOutput> {
    const files = new Map<string, string>();
    const workflows = new Map<string, string>();
    const rules: Rule[] = [];

    // Generate go.mod requirements
    files.set(
      "go.mod",
      `module github.com/example/project

go 1.21
`
    );

    // Generate golangci-lint config
    files.set(
      ".golangci.yml",
      `run:
  timeout: 5m
  skip-dirs:
    - vendor
    - .git

linters:
  enable:
    - staticcheck
    - golint
    - gosimple
    - unused
    - errcheck

issues:
  exclude-rules:
    - path: _test\.go
      linters:
        - golint
`
    );

    // Generate Makefile for common tasks
    files.set(
      "Makefile",
      `.PHONY: build test lint fmt clean

build:
	go build -v ./...

test:
	go test -v -race -coverprofile=coverage.out ./...

lint:
	golangci-lint run ./...

fmt:
	go fmt ./...

clean:
	go clean
`
    );

    // Add validation rules
    rules.push({
      name: "go-module-defined",
      description: "Ensure go.mod exists and is valid",
      severity: "error",
      validator: (files: Map<string, string>) => {
        const gomod = files.get("go.mod");
        return !!gomod && gomod.includes("module ");
      },
    });

    rules.push({
      name: "go-lint-config",
      description: "Ensure .golangci.yml exists for linting",
      severity: "warn",
      validator: (files: Map<string, string>) => files.has(".golangci.yml"),
    });

    rules.push({
      name: "go-makefile",
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
