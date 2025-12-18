# RepoForge Architecture

## Overview

RepoForge is composed of modular, composable components that work together to provide repository governance as infrastructure.

```
┌─────────────────────────────────────────────────────────────┐
│                      CLI Interface                          │
│  init | analyze | apply | validate | upgrade | diff        │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐   ┌──────▼──────┐   ┌───▼────────┐
    │ Analyzer │   │  Generator  │   │  Enforcer  │
    ├──────────┤   ├─────────────┤   ├────────────┤
    │ Detect   │   │ Spec system │   │ Validator  │
    │ Language │   │ Workflows   │   │ Drift      │
    │ Type     │   │ Files       │   │ Detection  │
    └────┬─────┘   └──────┬──────┘   └────┬───────┘
         │                │               │
         └────────────────┼───────────────┘
                          │
                 ┌────────▼─────────┐
                 │  Plugin System   │
                 ├──────────────────┤
                 │ NodePlugin       │
                 │ PythonPlugin     │
                 │ (Extensible)     │
                 └──────────────────┘
                          │
                 ┌────────▼─────────────┐
                 │  GitHub Integration  │
                 ├──────────────────────┤
                 │ Octokit API Client   │
                 │ Actions             │
                 └──────────────────────┘
```

## Core Modules

### 1. **Analyzer** (`src/analyzer/`)
Detects project characteristics:
- Languages (TypeScript, Python, Go, Rust, JavaScript)
- Project types (API, CLI, library, frontend, monorepo)
- Runtimes and deployment targets
- Risk profiles

**Key Class**: `ProjectAnalyzer`
- `analyze()`: Scans repo and returns detected configuration
- Returns confidence score for reliability

### 2. **Generator** (`src/generator/`)
Creates repository configuration:

- **SpecGenerator**: YAML spec creation and validation
- **WorkflowGenerator**: GitHub Actions CI/Security/Release workflows
- **FileGenerator**: Config files (.editorconfig, .gitattributes, documentation)
- **EnforcementAction**: GitHub Action templates for validation

**Key Outputs**:
- `repoforge.yaml` - Single source of truth
- `.github/workflows/*.yml` - Automated workflows
- Config files - Language and framework-specific

### 3. **Enforcer** (`src/enforcer/`)
Ensures repository compliance:

**SpecValidator**:
- `validate()` - Check current state against spec
- `checkDrift()` - Compare baseline vs current files
- Detects missing, deleted, or modified files
- Supports warn/error severity levels

### 4. **Upgrader** (`src/upgrader/`)
Manages safe upgrades:

**VersionManager**:
- Tracks spec versions with metadata
- Plans upgrade paths with breaking change detection
- Generates migration guides

**DiffGenerator**:
- Line-level diff computation
- Human-readable diff formatting

### 5. **Plugin System** (`src/plugins/`)
Extensible language/framework support:

**Abstract Plugin**:
- `isApplicable()` - Checks if plugin applies to spec
- `execute()` - Returns files, workflows, and rules
- Composable output

**Built-in Plugins**:
- `NodePlugin` - Node.js/TypeScript ecosystem
- `PythonPlugin` - Python package configuration

### 6. **CLI** (`src/cli/`)
User-facing commands:

```
repoctl init       # Initialize repository
repoctl analyze    # Detect project configuration
repoctl validate   # Check compliance
repoctl apply      # Apply updates
repoctl upgrade    # Upgrade to new version
```

## Data Flow

### Initialization Flow
```
repoctl init
    ↓
ProjectAnalyzer.analyze()
    ↓
SpecGenerator.generateSpec()
    ↓
PluginRegistry.executeAll()
    ↓
WorkflowGenerator + FileGenerator
    ↓
Write to filesystem
```

### Validation Flow
```
Repository State
    ↓
SpecValidator.validate()
    ↓
Check required files
    ↓
Check drift from baseline
    ↓
Report violations
```

### Upgrade Flow
```
Current Version
    ↓
VersionManager.planUpgrade()
    ↓
Generate migration steps
    ↓
DiffGenerator.generateFileDiff()
    ↓
Prompt for confirmation
    ↓
Apply changes
```

## Spec System (Single Source of Truth)

All configuration is declarative YAML:

```yaml
version: "1.0.0"
project:
  type: backend-api
  language: typescript
  runtime: node20
  deployment: container
  risk: internal
standards:
  ci: strict
  security: enforced
  releases: strict
```

**Properties**:
- **Versioned**: Enables safe upgrades
- **Validated**: Zod schemas ensure correctness
- **Diffable**: Git-friendly format
- **Machine-readable**: JSON Schema compatible

## Enforcement Architecture

### CI Validation
1. **Pull Request Checks**: Prevent spec changes without review
2. **Workflow Protection**: Prevent disabling security workflows
3. **Drift Detection**: Alert on unauthorized changes
4. **Auto-remediation** (future): Optional automatic fixes

### GitHub Action
`.github/actions/enforce/action.yml` provides:
- Workflow validation
- Required file checks
- Security workflow integrity
- YAML syntax validation

## Plugin Architecture

Plugins extend RepoForge for different languages/frameworks:

```typescript
class CustomPlugin extends Plugin {
  manifest = {
    name: "custom",
    appliesTo: { languages: ["rust"] }
  }
  
  isApplicable(spec: Spec): boolean { ... }
  
  async execute(spec: Spec): Promise<PluginOutput> {
    return {
      files: new Map(),
      workflows: new Map(),
      rules: []
    }
  }
}
```

## Security Model

- **No local secrets**: Token-free by default
- **Read-only access**: Prefer `contents: read` in workflows
- **Tamper-resistant**: Enforcement workflows use hash verification
- **Signed releases**: Future: GPG-signed binaries
- **Supply chain**: SBOM generation, dependency scanning

## Performance

- **Target <5s init time**: Fast file scanning + generation
- **Idempotent**: Running twice produces same output
- **Streaming**: Process large repos efficiently
- **Caching**: Git actions support caching

## Extensibility Points

1. **Plugins**: Language/framework support
2. **Custom Rules**: User-defined validation
3. **Policy Packs** (v2): Org-wide standard templates
4. **Post-processing**: Hooks for custom transformations

## Error Handling

- **Validation errors**: Type-safe with Zod
- **File I/O**: Graceful fallbacks
- **Network** (future): Retry logic for GitHub API
- **User guidance**: Clear error messages with remediation steps

---

See [CLI Guide](./cli.md) and [Developer Guide](./developer.md) for more.
