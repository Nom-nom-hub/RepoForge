# RepoForge

**Policy-driven CLI for professional repository governance.**

Automatically analyze, generate, enforce, and upgrade GitHub repositories with production-grade standards for CI/CD, security, and DevOps.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

## The Problem

Repository setup tools fail because they:
- Generate once and never enforce
- Are template-based and rot over time
- Ignore security and compliance realities
- Require manual DevOps expertise per project

## The Solution

RepoForge acts as **repo governance infrastructure**: it analyzes a project, generates a justified baseline, enforces compliance on every change, and evolves repositories safely over time.

## Features

### 🔍 Automatic Project Analysis
Detects languages, project types, runtimes, and deployment targets.

```bash
repoctl analyze
# Output: TypeScript backend-api, Node 20, container deployment
```

### 🏗️ Production-Grade Generation
Generates GitHub workflows and configuration files tailored to your project:

- **CI Workflow** - Lint, type-check, test, build with caching
- **Security Workflow** - CodeQL, dependency scanning, secret scanning
- **Release Workflow** - Semantic versioning, changelog automation
- **Config Files** - `.editorconfig`, `.gitattributes`, `CODEOWNERS`
- **Documentation** - README, CONTRIBUTING, SECURITY, CHANGELOG

All deterministic. All justified. All traceable to your spec.

### ✅ Continuous Enforcement
Enforcement validates on every PR:

```bash
repoctl validate
# ✅ Repository is compliant
```

Detects missing workflows, unauthorized changes, configuration drift.

### ⬆️ Safe Upgrades
Version your standards and upgrade safely:

```bash
repoctl upgrade --dry-run
# Shows migration steps, breaking changes, diffs
```

### 🔌 Language Plugins
Extensible plugin system for language-specific support:

- **Node.js** - npm, TypeScript, ESLint config
- **Python** - pip, pyproject.toml, pytest
- *More coming*

## Quick Start

### 1. Initialize
```bash
repoctl init
```

Auto-detects your project and generates everything.

### 2. Customize
```bash
repoctl setup
```

Interactive prompts for:
- Security contact email
- Team maintainers
- Project description
- License type

### 3. Validate
```bash
repoctl validate
```

Ensures everything is compliant.

### 4. Commit
```bash
git add .
git commit -m 'repoforge: initialize standards'
```

## Commands

| Command | Purpose |
|---------|---------|
| `repoctl init` | Initialize repository with standards |
| `repoctl analyze` | Detect project configuration |
| `repoctl setup` | Customize generated files (interactive) |
| `repoctl validate` | Check compliance against spec |
| `repoctl upgrade` | Upgrade to new standards version |

## The Spec

All configuration lives in a single declarative YAML file:

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

**Versioned** • **Validated** • **Diffable** • **Machine-readable**

## What Gets Generated

```
.github/
  ├── workflows/
  │   ├── ci.yml              # CI pipeline
  │   ├── security.yml        # Security scanning
  │   ├── release.yml         # Semantic versioning
  │   └── enforce.yml         # Policy enforcement
  ├── CODEOWNERS              # Team assignments
  ├── dependabot.yml          # Dependency updates
  └── actions/enforce/        # Reusable action
.editorconfig                  # Editor standards
.gitattributes                 # Git normalization
repoforge.yaml                 # Your spec (source of truth)
README.md                      # Project overview
CONTRIBUTING.md                # Development guide
SECURITY.md                    # Security policy
CHANGELOG.md                   # Version history
```

## Use Cases

### 👤 Individual Developers
Professional standards without boilerplate.

### 👥 Small Teams
Consistent CI/CD across all projects.

### 🏢 Organizations
Enforce compliance, prevent drift, standardize on best practices.

### 🔒 Security-First
Mandatory security scanning, secret detection, supply chain verification.

## Installation

```bash
npm install -g repoforge
```

## Documentation

- **[Quick Start](./README.md)** - You're reading it
- **[CLI Guide](./docs/cli.md)** - Command reference
- **[Architecture](./docs/architecture.md)** - System design
- **[Developer Guide](./docs/developer.md)** - Contributing
- **[Project Status](./PROJECT_STATUS.md)** - Roadmap & progress

## How It Works

```
Your Repo
    ↓
repoctl analyze     (detects project type)
    ↓
repoctl init        (generates spec + files)
    ↓
repoctl setup       (customize for your team)
    ↓
repoctl validate    (enforce compliance)
    ↓
GitHub Actions      (enforce on every PR)
    ↓
repoctl upgrade     (safe version upgrades)
```

## Philosophy

- **No fake data** - Templates guide, never prescribe
- **Deterministic** - Same input, same output (always)
- **Type-safe** - 100% TypeScript strict mode
- **Well-tested** - 80%+ coverage, 35+ test cases
- **Well-documented** - 10,000+ words of guides
- **Extensible** - Plugin system ready for more languages

## MVP Status (v0.1)

✅ Project analysis  
✅ Spec system  
✅ Workflow generation  
✅ Config file generation  
✅ Enforcement validation  
✅ Upgrade mechanism  
✅ Node + Python support  
✅ GitHub Actions  
✅ Documentation  

## Roadmap

- **v0.2** - GitHub API integration (auto-commit, PR creation)
- **v0.3** - Drift auto-remediation, policy packs, team standards
- **v1.0** - Production release, signed binaries
- **v2.0+** - Enterprise features, multi-VCS support

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Development setup
- Code standards
- PR process
- Plugin development

## License

MIT - See [LICENSE](./LICENSE)

## Community

- 📖 [Full Documentation](./docs/)
- 🐛 [GitHub Issues](https://github.com/Nom-nom-hub/RepoForge/issues)
- 💬 [Discussions](https://github.com/Nom-nom-hub/RepoForge/discussions)

---

**Built for developers who want professional standards without the hassle.**

Made with TypeScript • Tested thoroughly • Documented completely
