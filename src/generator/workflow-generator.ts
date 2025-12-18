import { Spec } from "../types/spec.js";

interface Workflow {
  name: string;
  content: string;
}

export class WorkflowGenerator {
  generateCIWorkflow(spec: Spec): Workflow {
    const { language, runtime } = spec.project;

    let jobSteps = `
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${runtime}
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run build`;

    if (language === "python") {
      jobSteps = `
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: ${runtime}
      - run: pip install -r requirements.txt
      - run: pylint src
      - run: pytest`;
    }

    return {
      name: "ci.yml",
      content: `name: CI

on:
  push:
    branches: [main, master, develop]
  pull_request:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:${jobSteps}
`,
    };
  }

  generateSecurityWorkflow(spec: Spec): Workflow {
    return {
      name: "security.yml",
      content: `name: Security

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]
  schedule:
    - cron: '0 0 * * 0'

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: '${this.getCodeQLLanguage(spec.project.language)}'
      
      - name: Autobuild
        uses: github/codeql-action/autobuild@v2
      
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2
      
      - name: Dependency scanning
        uses: actions/dependency-check_action@main
      
      - name: Secret scanning
        uses: gitleaks/gitleaks-action@v2
`,
    };
  }

  generateReleaseWorkflow(spec: Spec): Workflow {
    return {
      name: "release.yml",
      content: `name: Release

on:
  push:
    branches: [main, master]
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      
      - name: Check if version changed
        id: check-version
        run: |
          if [[ \${{ github.ref }} == refs/tags/v* ]]; then
            echo "version=\${GITHUB_REF#refs/tags/v}" >> \$GITHUB_OUTPUT
            echo "is_release=true" >> \$GITHUB_OUTPUT
          fi
      
      - name: Create Release
        if: steps.check-version.outputs.is_release == 'true'
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: \${{ github.ref }}
          release_name: Release \${{ steps.check-version.outputs.version }}
          draft: false
          prerelease: false
`,
    };
  }

  private getCodeQLLanguage(language: string): string {
    const mapping: Record<string, string> = {
      typescript: "javascript",
      javascript: "javascript",
      python: "python",
      go: "go",
      rust: "rust",
    };
    return mapping[language] || "javascript";
  }
}
