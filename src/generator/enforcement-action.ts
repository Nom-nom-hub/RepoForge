export function generateEnforcementActionWorkflow(): string {
  return `name: RepoForge Enforce

on:
  pull_request:
    paths:
      - '.github/workflows/**'
      - 'repoforge.yaml'
      - '.editorconfig'
      - '.gitattributes'
  push:
    branches: [main]
    paths:
      - '.github/workflows/**'
      - 'repoforge.yaml'

jobs:
  enforce:
    runs-on: ubuntu-latest
    name: Enforce RepoForge Standards
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - name: Install RepoForge
        run: npm install -g repoforge@latest
      
      - name: Validate Compliance
        run: |
          if [ ! -f "repoforge.yaml" ]; then
            echo "❌ Missing repoforge.yaml"
            exit 1
          fi
          repoctl validate --strict
      
      - name: Check Required Files
        run: |
          echo "Checking required workflow files..."
          REQUIRED_FILES=(
            ".github/workflows/ci.yml"
            ".github/workflows/security.yml"
          )
          
          for file in "\${REQUIRED_FILES[@]}"; do
            if [ ! -f "\$file" ]; then
              echo "❌ Missing required file: \$file"
              exit 1
            fi
          done
          echo "✓ All required files present"
      
      - name: Prevent Workflow Disabling
        run: |
          echo "Verifying security workflow integrity..."
          if ! grep -q "name: Security" .github/workflows/security.yml; then
            echo "❌ Security workflow was modified"
            exit 1
          fi
          echo "✓ Security workflow intact"
      
      - name: Validate YAML
        run: |
          echo "Validating YAML files..."
          find .github/workflows -name "*.yml" -o -name "*.yaml" | while read file; do
            echo "  Checking \$file..."
            python3 -c "import sys, yaml; yaml.safe_load(open('\$file'))" || exit 1
          done
          echo "✓ All YAML valid"
      
      - name: Check for Secrets
        run: |
          echo "Scanning for exposed secrets..."
          if grep -r "GITHUB_TOKEN" .github/workflows --include="*.yml" | grep -v "^\s*#"; then
            echo "⚠️  Warning: GITHUB_TOKEN references found"
          fi
          echo "✓ Secret check complete"
      
      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ RepoForge compliance check passed'
            })
      
      - name: Annotate on Failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            core.setFailed('RepoForge compliance check failed')
`;
}

export function generateEnforcementActionYaml(): string {
  return `name: 'RepoForge Enforcer'
description: 'Enforce RepoForge standards and prevent drift'
author: 'RepoForge'

inputs:
  strict:
    description: 'Fail on warnings'
    required: false
    default: 'false'
  spec-path:
    description: 'Path to spec file'
    required: false
    default: 'repoforge.yaml'

runs:
  using: composite
  steps:
    - name: Validate
      shell: bash
      run: |
        repoctl validate --spec \${{ inputs.spec-path }} \\
          \$([ "\${{ inputs.strict }}" = "true" ] && echo "--strict" || echo "")
`;
}
