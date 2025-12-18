# RepoForge CLI Guide

## Installation

```bash
npm install -g repoforge
```

Verify installation:
```bash
repoctl --version
```

## Commands

### repoctl init

Initialize a repository with RepoForge standards.

**Usage**:
```bash
repoctl init [options]
```

**Options**:
- `--dry-run`: Preview changes without writing files
- `--strict`: Enforce strict standards mode

**Example**:
```bash
cd my-repo
repoctl init --dry-run

# Review output, then apply
repoctl init
```

**Output**:
- `repoforge.yaml` - Spec file
- `.github/workflows/ci.yml` - CI workflow
- `.github/workflows/security.yml` - Security workflow
- `.github/workflows/release.yml` - Release workflow (if applicable)
- `.github/CODEOWNERS` - Team responsibility mapping
- `.editorconfig` - Editor settings
- `.gitattributes` - Git attributes
- Documentation files (README, CONTRIBUTING, SECURITY, CHANGELOG)

---

### repoctl analyze

Analyze project and output detected configuration.

**Usage**:
```bash
repoctl analyze [options]
```

**Options**:
- `--json`: Output as JSON (for scripting)

**Example**:
```bash
repoctl analyze

# Output:
# 📊 Project Analysis:
#   Type: backend-api (80% confidence)
#   Language: typescript
#   Runtime: node20
#   Deployment: container
#   Detected patterns:
#     • nodejs
#     • containerized
```

**JSON Output**:
```bash
repoctl analyze --json | jq '.project'

# {
#   "type": "backend-api",
#   "language": "typescript",
#   "runtime": "node20",
#   "deployment": "container",
#   "risk": "internal"
# }
```

---

### repoctl validate

Validate repository against spec.

**Usage**:
```bash
repoctl validate [options]
```

**Options**:
- `--spec <path>`: Path to spec file (default: `repoforge.yaml`)
- `--strict`: Fail on warnings (default: only errors fail)

**Example**:
```bash
repoctl validate

# ✅ Repository is compliant

repoctl validate --strict

# ⚠️ Found 1 violations:
# 
# ⚠️ [WARN] .github/workflows/ci.yml
#    Rule: recommended-workflow
#    Consider adding matrix testing
```

**Exit Codes**:
- `0`: Compliant (no errors, or with warnings if not strict)
- `1`: Non-compliant or warnings with `--strict`

---

### repoctl apply

Apply spec-driven changes to repository.

**Usage**:
```bash
repoctl apply [options]
```

**Options**:
- `--spec <path>`: Path to spec file (default: `repoforge.yaml`)
- `--dry-run`: Preview changes

**Status**: Placeholder for future implementation
- Will synchronize repository files to match spec
- Auto-fix capability for safe changes
- Preserve custom overrides

---

### repoctl upgrade

Upgrade repository to latest RepoForge standards.

**Usage**:
```bash
repoctl upgrade [options]
```

**Options**:
- `--to <version>`: Target version (default: latest)
- `--dry-run`: Preview upgrade without applying
- `--auto-backup`: Create backup before upgrading

**Example**:
```bash
# Check current version
repoctl analyze

# Preview upgrade
repoctl upgrade --dry-run

# Perform upgrade with backup
repoctl upgrade --auto-backup

# Upgrade to specific version
repoctl upgrade --to 1.1.0

# View changes
git diff repoforge.yaml
git diff .github/workflows/
```

**Output**:
- Plans migration steps
- Shows version metadata (breaking changes, features)
- Generates diffs for review
- Backs up before major version upgrades

---

## Configuration

### repoforge.yaml

Single source of truth for repository standards:

```yaml
version: "1.0.0"

project:
  type: backend-api              # backend-api | frontend | cli | library | monorepo | static-site
  language: typescript           # typescript | javascript | python | go | rust
  runtime: node20                # node16 | node18 | node20 | python39 | python310 | python311
  deployment: container          # container | serverless | static | vm
  risk: internal                 # public | internal | regulated | oss

standards:
  ci: strict                     # permissive | strict | enforced
  security: enforced             # permissive | strict | enforced
  releases: strict               # permissive | strict | enforced

metadata:
  generated: "2024-01-15T10:30:00Z"
  generatedBy: "repoctl@0.1.0"
```

**Schema Validation**:
- Type-safe with Zod
- Validates on read and write
- Clear error messages for invalid configs

---

## Enforcement

RepoForge enforces standards in two ways:

### 1. CLI Validation
```bash
repoctl validate --strict
```

Run in CI:
```yaml
- name: Validate RepoForge Compliance
  run: repoctl validate --strict
```

### 2. GitHub Action
```yaml
- uses: ./.github/actions/enforce
  with:
    spec-file: repoforge.yaml
    strict: 'true'
```

---

## Tips & Tricks

### Dry-Run First
Always use `--dry-run` before committing to changes:
```bash
repoctl init --dry-run
repoctl upgrade --dry-run
```

### Scripting
Use `--json` output for automation:
```bash
LANGUAGE=$(repoctl analyze --json | jq -r '.project.language')
if [ "$LANGUAGE" == "python" ]; then
  pip install -r requirements.txt
fi
```

### CI Integration
Add to your CI pipeline:
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20

- run: npm install -g repoforge

- run: repoctl validate --strict
```

### Before Upgrades
Create a backup:
```bash
git add .
git commit -m "backup: before repoforge upgrade"
repoctl upgrade --to 2.0.0
```

---

## Troubleshooting

### "Spec file not found"
Ensure `repoforge.yaml` exists:
```bash
repoctl init --dry-run
```

### "Invalid YAML"
Check syntax:
```bash
python3 -c "import yaml; yaml.safe_load(open('repoforge.yaml'))"
```

### "Missing required workflow"
Run init to generate:
```bash
repoctl init
git add .github/workflows/
git commit -m "repoforge: add required workflows"
```

### Validation always fails
Check strict mode:
```bash
# Warnings only
repoctl validate

# Fail on warnings
repoctl validate --strict
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0    | Success |
| 1    | Validation failed / Error occurred |
| 2    | Invalid arguments |

---

## Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `REPOFORGE_SPEC` | Override spec path | `/etc/repoforge.yaml` |
| `REPOFORGE_DRY_RUN` | Always dry-run | `true` |
| `REPOFORGE_STRICT` | Always strict | `true` |

---

See [Architecture](./architecture.md) for technical details.
