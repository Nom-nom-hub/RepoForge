# Product Requirements Document (PRD)

## Product Name (Working)

RepoForge (placeholder)

---

## 1. Executive Summary

RepoForge is a CLI-first, policy-driven automation platform that **professionally initializes, configures, enforces, and continuously upgrades GitHub repositories** with production-grade standards for CI/CD, security, and DevOps.

Unlike template generators, RepoForge acts as **repo governance infrastructure**: it analyzes a project, generates a justified baseline, enforces compliance on every change, and evolves repositories safely over time.

Target users are professional developers, teams, and organizations that want **repeatable, enforceable engineering standards without maintaining internal platform teams**.

---

## 2. Problem Statement

Current repository setup tools fail because they:

* Generate once and never enforce
* Are template-based and rot over time
* Ignore security and compliance realities
* Require manual DevOps expertise per project

Teams want:

* Professional defaults
* Enforcement, not suggestions
* Low-friction CI/CD and security
* Continuous upgrades without breaking changes

---

## 3. Goals and Non-Goals

### Goals

* Automatically analyze projects and infer correct repo standards
* Generate production-grade GitHub repos and workflows
* Enforce standards continuously via CI
* Detect and remediate configuration drift
* Safely upgrade repos as standards evolve

### Non-Goals

* Replacing full internal platform teams
* Becoming a full CI/CD replacement
* Managing runtime infrastructure directly (initially)

---

## 4. Target Users

### Primary

* Senior developers
* Indie founders
* Small-to-mid engineering teams

### Secondary

* Open-source maintainers
* Consulting firms
* Compliance-conscious startups

---

## 5. User Stories

### Initialization

* As a developer, I want to initialize a repo with professional standards in one command
* As a team lead, I want repo setup to reflect my organization’s policies

### Enforcement

* As a team, we want CI to fail if required standards are removed
* As a security lead, I want guarantees that scanning cannot be bypassed

### Evolution

* As a maintainer, I want to upgrade workflows safely
* As a developer, I want clear diffs and changelogs for repo upgrades

---

## 6. Core Features

### 6.1 Project Analysis Engine

Capabilities:

* Detect languages, runtimes, frameworks
* Identify repo type (library, CLI, API, frontend, monorepo)
* Detect deployment intent (container, serverless, static)
* Assign risk profile (OSS, internal, regulated)

Inputs:

* Repo file scan
* Optional `project.yaml`
* CLI flags

Outputs:

* Normalized internal project model

---

### 6.2 Spec System (Single Source of Truth)

A declarative spec defines repo intent:

```yaml
project:
  type: backend-api
  language: typescript
  runtime: node20
  deployment: container
  risk: public

standards:
  ci: strict
  security: enforced
  releases: automated
```

Spec rules:

* Versioned
* Validated
* Diffable
* Machine-readable

---

### 6.3 Repo Bootstrapper

Generated assets (conditional by project type):

* `.github/workflows/`

  * CI
  * Security
  * Release
* `.github/CODEOWNERS`
* `.github/dependabot.yml`
* `.editorconfig`
* `.gitattributes`
* `.gitignore` (language-specific)
* `README.md`
* `CONTRIBUTING.md`
* `SECURITY.md`
* `LICENSE`
* `CHANGELOG.md`

All files must be:

* Deterministic
* Justified by spec
* Traceable to generator version

---

### 6.4 GitHub Actions Generation

#### CI Workflow

* Lint
* Type check
* Test
* Build
* Caching (language-optimized)
* Matrix support

#### Security Workflow

* CodeQL
* Dependency scanning
* Secret scanning
* License checks

#### Release Workflow (Optional)

* Conventional commits
* Semantic versioning
* Changelog automation
* Artifact publishing

---

### 6.5 Enforcement Engine (Critical)

Mechanisms:

* Validation action runs on every PR
* Detects missing or modified required files
* Prevents disabling security workflows
* Validates spec compliance

Modes:

* Warn
* Enforce (fail CI)
* Auto-fix (future)

---

### 6.6 Drift Detection

* Compare repo state against spec baseline
* Identify unauthorized changes
* Report drift via CI annotations
* Optional auto-remediation

---

### 6.7 Upgrade System

* Versioned standards
* Safe migration paths
* Interactive diffs
* Rollback support

Commands:

```
repoctl upgrade
repoctl diff
```

---

## 7. CLI Interface

Primary commands:

```
repoctl init
repoctl analyze
repoctl apply
repoctl validate
repoctl upgrade
```

Flags:

* `--dry-run`
* `--strict`
* `--spec`

---

## 8. Plugin Architecture

Plugins encapsulate domain logic:

```
plugins/
  node/
  python/
  docker/
  aws/
  react/
```

Each plugin:

* Declares applicability rules
* Emits files
* Emits workflows
* Emits enforcement rules

---

## 9. AI Integration (Assistive Only)

AI usage:

* Project classification assistance
* README and documentation drafting
* CI failure explanations
* Optimization suggestions

AI must never:

* Override enforcement logic
* Weaken security posture
* Make irreversible decisions

---

## 10. Security Requirements

* No secrets stored locally
* Read-only GitHub access where possible
* Signed releases
* Tamper-resistant enforcement workflows
* Supply chain integrity

---

## 11. Compliance & Governance (Phase 2)

* SOC2-lite policy packs
* Audit logs
* Evidence generation
* Approval workflows

---

## 12. Non-Functional Requirements

* Deterministic output
* Fast execution (<5s init)
* Cross-platform CLI
* Idempotent operations
* Backward compatibility

---

## 13. Telemetry & Observability

* Anonymous usage metrics
* Error reporting (opt-in)
* Version adoption tracking

---

## 14. Monetization Strategy

### Free

* Local CLI
* Limited enforcement

### Pro

* Enforcement mode
* Upgrades
* Policy packs

### Team / Enterprise

* Org-wide standards
* Self-hosted runners
* Compliance features

---

## 15. MVP Scope (v1)

* Node + Python support
* CI + Security workflows
* Spec system
* Enforcement validation
* Upgrade mechanism

---

## 16. Production Readiness Checklist

* CLI install via npm/brew
* Signed binaries
* Documentation site
* Example repos
* Security review
* License clarity

---

## 17. Risks

* Over-opinionation
* GitHub API changes
* User trust erosion if enforcement misfires

Mitigation:

* Transparent rules
* Dry-run modes
* Extensive testing

---

## 18. Success Metrics

* Repo init time
* Enforcement adoption rate
* Upgrade success rate
* Retention

---

## 19. Open Questions

* Self-hosted enforcement?
* GitLab support timeline?
* Policy DSL vs YAML?

---

## 20. Roadmap (High-Level)

* v1: CLI + GitHub
* v2: Policy packs + teams
* v3: Multi-VCS support
* v4: Enterprise governance
