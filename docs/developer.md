# RepoForge Developer Guide

## Getting Started

### Prerequisites
- Node.js 20 or later
- npm 10 or later
- Git
- A code editor (VS Code recommended)

### Local Setup

```bash
git clone https://github.com/repoforge/repoforge.git
cd repoforge
npm install
npm run build
```

### Verify Installation

```bash
npm test
npm run type-check
npm run lint
```

## Project Layout

```
src/
├── analyzer/
│   ├── project-analyzer.ts    # Main analyzer logic
│   └── project-analyzer.test.ts
├── generator/
│   ├── spec-generator.ts      # Spec creation
│   ├── workflow-generator.ts  # GitHub Actions generation
│   ├── file-generator.ts      # Config/doc file generation
│   ├── enforcement-action.ts  # Action templates
│   ├── spec-generator.test.ts
│   └── file-generator.test.ts
├── enforcer/
│   ├── spec-validator.ts      # Compliance checking
│   └── spec-validator.test.ts
├── upgrader/
│   ├── version-manager.ts     # Version tracking
│   ├── diff-generator.ts      # Diff computation
│   ├── version-manager.test.ts
│   └── diff-generator.test.ts
├── plugins/
│   ├── plugin-registry.ts     # Plugin system
│   ├── node-plugin.ts         # Node.js support
│   └── python-plugin.ts       # Python support
├── cli/
│   ├── index.ts               # CLI entry point
│   └── commands/
│       ├── init.ts            # repoctl init
│       ├── analyze.ts         # repoctl analyze
│       ├── validate.ts        # repoctl validate
│       ├── apply.ts           # repoctl apply
│       └── upgrade.ts         # repoctl upgrade
└── types/
    └── spec.ts                # Type definitions & schemas
```

## Core Concepts

### 1. Spec System

The spec is the single source of truth for repository configuration:

```typescript
interface Spec {
  version: string;
  project: Project;
  standards: Standards;
  metadata?: {
    generated?: string;
    generatedBy?: string;
  };
}
```

Specs are:
- **Versioned**: `1.0.0`, `1.1.0`, `2.0.0`
- **Validated**: Zod schemas ensure correctness
- **Diffable**: Git-friendly YAML format
- **Machine-readable**: JSON Schema compatible

### 2. Project Types

```typescript
type ProjectType = 
  | "backend-api"
  | "frontend"
  | "cli"
  | "library"
  | "monorepo"
  | "static-site";
```

Each type has different defaults for workflows and configuration.

### 3. Standards Levels

```typescript
type StandardsLevel = "permissive" | "strict" | "enforced";
```

- **permissive**: Minimal CI (lint + test)
- **strict**: CI + Security scanning
- **enforced**: Strict + Prevent disabling + Drift detection

## Working with the Analyzer

### Understanding ProjectAnalyzer

```typescript
const analyzer = new ProjectAnalyzer(process.cwd());
const result = analyzer.analyze();

console.log(result.project);  // Detected project config
console.log(result.confidence); // 0.0 - 1.0
console.log(result.detected.files); // Detected files
console.log(result.detected.patterns); // Pattern matches
```

The analyzer:
1. Lists files in the repository
2. Detects patterns (package.json, Dockerfile, etc.)
3. Infers language, type, deployment
4. Assigns confidence score

### Extending Detection

Add patterns to `ProjectAnalyzer.detectPatterns()`:

```typescript
private detectPatterns(files: string[]): string[] {
  const patterns: string[] = [];
  
  if (files.includes("go.mod")) {
    patterns.push("golang");
  }
  
  return patterns;
}
```

## Working with the Generator

### SpecGenerator

Creates and validates specs:

```typescript
const generator = new SpecGenerator();

// From partial project config
const spec = generator.generateSpec({
  type: "backend-api",
  language: "typescript",
  runtime: "node20",
  deployment: "container",
  risk: "internal",
});

// Validate
const validation = generator.validateSpec(spec);
if (!validation.valid) {
  console.error(validation.errors);
}
```

### WorkflowGenerator

Generates GitHub Actions workflows:

```typescript
const wfGen = new WorkflowGenerator();

const ciWorkflow = wfGen.generateCIWorkflow(spec);
// Returns: { name: "ci.yml", content: "workflow YAML" }

const securityWorkflow = wfGen.generateSecurityWorkflow(spec);
const releaseWorkflow = wfGen.generateReleaseWorkflow(spec);
```

Customize workflows by adding language-specific steps:

```typescript
private generateCIWorkflow(spec: Spec): Workflow {
  if (spec.project.language === "rust") {
    // Add Rust-specific steps
  }
  // ...
}
```

### FileGenerator

Generates configuration and documentation files:

```typescript
const fileGen = new FileGenerator();
const files = fileGen.generateFiles(spec);

// Returns array of GeneratedFile objects
for (const file of files) {
  fs.writeFileSync(file.path, file.content);
}
```

Add new file types in private methods:

```typescript
private generateGitHubFiles(spec: Spec): GeneratedFile[] {
  return [
    { path: ".github/dependabot.yml", content: "..." },
    // Add more files
  ];
}
```

## Working with the Enforcer

### SpecValidator

Validates repository compliance:

```typescript
const validator = new SpecValidator();

const existingFiles = new Set([
  ".github/workflows/ci.yml",
  ".github/workflows/security.yml",
]);

const result = validator.validate(spec, existingFiles);

if (!result.valid) {
  for (const violation of result.violations) {
    console.log(`[${violation.severity}] ${violation.file}`);
    console.log(`  ${violation.message}`);
  }
}
```

### Drift Detection

Compare baseline vs current files:

```typescript
const baseline = new Map([
  [".github/workflows/ci.yml", originalContent],
]);

const current = new Map([
  [".github/workflows/ci.yml", modifiedContent],
]);

const drifts = validator.checkDrift(spec, baseline, current);
// Returns violations for any unauthorized changes
```

## Working with the Upgrader

### VersionManager

Manages version upgrades:

```typescript
const manager = new VersionManager();

const latest = manager.getLatestVersion(); // "2.0.0"
const meta = manager.getVersionMetadata("1.0.0");
// { version: "1.0.0", features: [...], breakingChanges: [...] }

// Plan an upgrade
const guide = manager.planUpgrade("1.0.0", "2.0.0");
// {
//   from: "1.0.0",
//   to: "2.0.0",
//   steps: [...],
//   backupRequired: true
// }
```

Add new versions:

```typescript
this.versions = new Map([
  ["1.2.0", {
    version: "1.2.0",
    date: "2024-02-01",
    features: ["New feature"],
    breakingChanges: [],
    deprecations: [],
  }],
]);
```

### DiffGenerator

Computes line-level diffs:

```typescript
const diffGen = new DiffGenerator();

const diff = diffGen.generateFileDiff(oldContent, newContent);
// Returns array of DiffHunk objects

const formatted = diffGen.formatDiffForDisplay({
  file: "path/to/file",
  type: "modified",
  hunks: diff,
});

console.log(formatted); // Unified diff format
```

## Plugin System

### Creating a Plugin

Extend the `Plugin` abstract class:

```typescript
import { Plugin, PluginManifest, PluginOutput } from "./plugin-registry.js";

export class GoPlugin extends Plugin {
  manifest: PluginManifest = {
    name: "go",
    version: "1.0.0",
    appliesTo: {
      languages: ["go"],
      projectTypes: ["backend-api", "cli"],
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
    files.set("go.mod", `module github.com/example/project\n\ngo 1.21\n`);

    // Add rules
    rules.push({
      name: "go-module-defined",
      description: "Ensure go.mod exists",
      severity: "error",
      validator: (files: Map<string, string>) => files.has("go.mod"),
    });

    return { files, workflows, rules };
  }
}
```

### Registering Plugins

```typescript
const registry = new PluginRegistry();
registry.register(new NodePlugin());
registry.register(new PythonPlugin());
registry.register(new GoPlugin());

// Execute all applicable plugins
const output = await registry.executeAll(spec);
```

## CLI Development

### Creating a Command

Commands use `commander.js`:

```typescript
import { Command } from "commander";

export const myCommand = new Command("my-command")
  .description("What this command does")
  .option("--flag", "Description of flag")
  .option("--value <value>", "Option with value")
  .action((options) => {
    try {
      // Command logic
      console.log("✅ Success");
    } catch (error) {
      console.error("❌ Error:", error.message);
      process.exit(1);
    }
  });
```

Register in `src/cli/index.ts`:

```typescript
import { myCommand } from "./commands/my-command.js";

program.addCommand(myCommand);
```

### Command Patterns

Use consistent patterns:

```typescript
// Logging with Unicode symbols
console.log("🔍 Analyzing...");
console.log("✓ Success");
console.log("❌ Error");
console.log("⚠️  Warning");

// Exit codes
process.exit(0); // Success
process.exit(1); // Error

// Dry-run pattern
if (options.dryRun) {
  console.log("Preview (--dry-run):");
  return; // Don't modify files
}
```

## Testing

### Using Vitest

Run tests:

```bash
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # Coverage report
npm run test:cov           # With HTML report
```

### Test Structure

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { MyClass } from "./my-class.js";

describe("MyClass", () => {
  let instance: MyClass;

  beforeEach(() => {
    instance = new MyClass();
  });

  it("should do something", () => {
    expect(instance.method()).toBe("expected");
  });

  it("should handle edge cases", () => {
    expect(() => instance.invalidInput()).toThrow();
  });
});
```

### Test Coverage Goals

- Aim for 80%+ coverage
- Test happy path, edge cases, errors
- Mock external dependencies
- Use fixtures for complex data

## Type Safety

### Using Zod

Validate at runtime:

```typescript
import { z } from "zod";

const ConfigSchema = z.object({
  name: z.string(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  features: z.array(z.string()),
});

type Config = z.infer<typeof ConfigSchema>;

const data = JSON.parse(configJson);
const config = ConfigSchema.parse(data); // Throws on invalid
```

### TypeScript Strict Mode

All strict flags enabled. No `any` types without justification.

## Code Style

### Format

Run Prettier via ESLint:

```bash
npm run lint --fix
```

Rules:
- 100-character line length
- 2-space indentation
- Trailing commas
- Single quotes for strings

### Naming Conventions

- Classes: `PascalCase`
- Functions/methods: `camelCase`
- Constants: `CONSTANT_CASE`
- Files: `kebab-case` or `camelCase` matching exports
- Interfaces: `PascalCase` (no `I` prefix)

### Comments

Use JSDoc for public APIs:

```typescript
/**
 * Analyzes a project and returns detected configuration.
 *
 * @param rootDir - Project root directory (default: cwd)
 * @returns Analysis result with detected project type and confidence
 */
analyze(rootDir: string = process.cwd()): ProjectAnalysisResult {
  // ...
}
```

## Debugging

### VS Code

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Test",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "test"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Console Logging

Use semantic prefixes:

```typescript
console.log("[INFO] Starting analysis");
console.warn("[WARN] Missing config");
console.error("[ERROR] File not found");
```

## Performance

### Profiling

Check execution time:

```bash
time npm run build
time npm test
```

### Optimization Points

1. **File I/O**: Batch reads/writes
2. **Scanning**: Limit directory depth
3. **Pattern matching**: Cache regex
4. **Large arrays**: Use Sets/Maps

## Common Tasks

### Add Support for New Language

1. Create `src/plugins/my-language-plugin.ts`
2. Implement `Plugin` interface
3. Add language to analyzer detection
4. Add language to type schemas
5. Register in plugin registry
6. Add tests
7. Update docs

### Add New Workflow Type

1. Add method to `WorkflowGenerator`
2. Return `Workflow` object with YAML content
3. Update CLI to generate it
4. Add to enforcement rules if applicable
5. Document in architecture guide

### Change Spec Format

1. Update `src/types/spec.ts` schema
2. Add migration in `VersionManager`
3. Generate diffs in `DiffGenerator`
4. Update docs with examples
5. Add tests for migration

## Release Process

See [CONTRIBUTING.md](../CONTRIBUTING.md#release-process) for release steps.

## Resources

- [Commander.js Docs](https://github.com/tj/commander.js)
- [Zod Documentation](https://zod.dev)
- [Vitest Guide](https://vitest.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Getting Help

- Check existing issues: https://github.com/repoforge/repoforge/issues
- Start a discussion: https://github.com/repoforge/repoforge/discussions
- Read docs: [./docs/](../docs/)

---

Happy coding! 🚀
