import { Spec } from "../types/spec.js";

export interface GeneratedFile {
  path: string;
  content: string;
}

export class FileGenerator {
  generateFiles(spec: Spec): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    files.push(...this.generateGitHubFiles(spec));
    files.push(...this.generateConfigFiles(spec));
    files.push(...this.generateDocumentation(spec));

    return files;
  }

  private generateGitHubFiles(spec: Spec): GeneratedFile[] {
    return [
      {
        path: ".github/dependabot.yml",
        content: this.generateDependabot(spec),
      },
      {
        path: ".github/CODEOWNERS",
        content: this.generateCodeOwners(),
      },
    ];
  }

  private generateConfigFiles(spec: Spec): GeneratedFile[] {
    return [
      {
        path: ".editorconfig",
        content: this.generateEditorConfig(),
      },
      {
        path: ".gitattributes",
        content: this.generateGitAttributes(),
      },
    ];
  }

  private generateDocumentation(spec: Spec): GeneratedFile[] {
    return [
      {
        path: "README.md",
        content: this.generateReadme(spec),
      },
      {
        path: "CONTRIBUTING.md",
        content: this.generateContributing(spec),
      },
      {
        path: "SECURITY.md",
        content: this.generateSecurity(spec),
      },
      {
        path: "CHANGELOG.md",
        content: "# Changelog\n\nAll notable changes to this project will be documented in this file.\n",
      },
    ];
  }

  private generateDependabot(spec: Spec): string {
    const ecosystems = spec.project.language === "python" ? "pip" : "npm";
    return `version: 2
updates:
  - package-ecosystem: "${ecosystems}"
    directory: "/"
    schedule:
      interval: "weekly"
    allow:
      - dependency-type: "all"
`;
  }

  private generateCodeOwners(): string {
    return `# CODEOWNERS
# See: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners

# Specify default code owners for the repo
# * @username

# Assign specific paths to team members
# /src/  @team-name
# .github/workflows/ @devops-team
`;
  }

  private generateEditorConfig(): string {
    return `root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.{json,yaml,yml}]
indent_style = space
indent_size = 2

[*.py]
indent_style = space
indent_size = 4
`;
  }

  private generateGitAttributes(): string {
    return `* text=auto
*.js text eol=lf
*.ts text eol=lf
*.json text eol=lf
*.md text eol=lf
`;
  }

  private generateReadme(spec: Spec): string {
    const projectDesc = this.getProjectDescription(spec);
    const devCommand = this.getDevCommand(spec);
    const testCommand = this.getTestCommand(spec);
    const deploymentNote = this.getDeploymentNote(spec);

    return `# ${spec.project.type.charAt(0).toUpperCase() + spec.project.type.slice(1).replace(/-/g, " ")}

${projectDesc}

## Quick Start

### Prerequisites
- ${this.getRequiredTools(spec).join("\n- ")}

### Development

\`\`\`bash
# Install dependencies
${this.getInstallCommand(spec)}

# Start development server
${devCommand}
\`\`\`

## Testing

\`\`\`bash
${testCommand}
\`\`\`

## Building

\`\`\`bash
${this.getBuildCommand(spec)}
\`\`\`

${deploymentNote ? `## Deployment

${deploymentNote}

` : ""}## Code Standards

This project enforces strict code standards:
- **Linting**: ESLint for code style
- **Testing**: All changes must have tests
- **Type Safety**: TypeScript strict mode
- **Security**: Automated dependency scanning

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## CI/CD

This repository uses GitHub Actions for:
- Continuous Integration (testing, linting, type-checking)
- Security scanning (CodeQL, dependency scanning)
- Automated releases

See [.github/workflows/](./.github/workflows/) for workflow definitions.

## Support

For issues, questions, or suggestions, please [open an issue](../../issues).

## License

MIT
`;
  }

  private getProjectDescription(spec: Spec): string {
    const typeMap: Record<string, string> = {
      "backend-api": "A production-grade backend API service",
      frontend: "A modern frontend application",
      cli: "A command-line interface application",
      library: "A reusable software library",
      monorepo: "A monorepo managing multiple packages",
      "static-site": "A static website",
    };

    const runtimeInfo = spec.project.runtime
      ? ` Built with ${spec.project.runtime}.`
      : "";
    const deploymentInfo = spec.project.deployment
      ? ` Designed for ${spec.project.deployment} deployment.`
      : "";

    return `> A \`${spec.project.language}\` ${typeMap[spec.project.type] || "project"}.${runtimeInfo}${deploymentInfo}`;
  }

  private getRequiredTools(spec: Spec): string[] {
    const tools: string[] = [];

    if (
      spec.project.language === "typescript" ||
      spec.project.language === "javascript"
    ) {
      tools.push("Node.js " + (spec.project.runtime || "16.x or higher"));
      tools.push("npm or yarn");
    } else if (spec.project.language === "python") {
      tools.push("Python " + (spec.project.runtime || "3.9+"));
      tools.push("pip");
    } else if (spec.project.language === "go") {
      tools.push("Go 1.18+");
    } else if (spec.project.language === "rust") {
      tools.push("Rust 1.70+");
      tools.push("Cargo");
    }

    return tools.length > 0
      ? tools
      : ["Node.js 16+", "npm or yarn or pnpm"];
  }

  private getInstallCommand(spec: Spec): string {
    if (spec.project.language === "python") {
      return "pip install -r requirements.txt";
    } else if (spec.project.language === "go") {
      return "go mod download";
    } else if (spec.project.language === "rust") {
      return "cargo fetch";
    }
    return "npm install";
  }

  private getDevCommand(spec: Spec): string {
    if (spec.project.language === "python") {
      return "python -m app";
    } else if (spec.project.language === "go") {
      return "go run ./cmd/main.go";
    } else if (spec.project.language === "rust") {
      return "cargo run";
    }
    return "npm run dev";
  }

  private getTestCommand(spec: Spec): string {
    if (spec.project.language === "python") {
      return "pytest";
    } else if (spec.project.language === "go") {
      return "go test ./...";
    } else if (spec.project.language === "rust") {
      return "cargo test";
    }
    return "npm test";
  }

  private getBuildCommand(spec: Spec): string {
    if (spec.project.language === "python") {
      return "python setup.py build";
    } else if (spec.project.language === "go") {
      return "go build -o app";
    } else if (spec.project.language === "rust") {
      return "cargo build --release";
    }
    return "npm run build";
  }

  private getDeploymentNote(spec: Spec): string {
    if (spec.project.deployment === "container") {
      return "This project is containerized. Build and deploy using:\n\n\`\`\`bash\ndocker build -t app .\ndocker run -p 8080:8080 app\n\`\`\`";
    } else if (spec.project.deployment === "serverless") {
      return "This project is designed for serverless deployment. Deploy using your cloud provider's CLI or web console.";
    } else if (spec.project.deployment === "static") {
      return "This is a static site. Deploy the built files to any static hosting service (GitHub Pages, Netlify, Vercel, etc.).";
    }
    return "";
  }

  private generateContributing(spec: Spec): string {
    return `# Contributing

## Code Standards

This repository enforces strict code standards via CI.

### Requirements

- All tests must pass
- Type checking must succeed
- Linting must pass
- Security scans must pass

## Process

1. Create a feature branch
2. Make your changes
3. Ensure all checks pass
4. Submit a pull request

## Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

\`\`\`
<type>(<scope>): <subject>
\`\`\`

Types: \`feat\`, \`fix\`, \`docs\`, \`test\`, \`refactor\`, \`perf\`, \`ci\`
`;
  }

  private generateSecurity(spec: Spec): string {
    return `# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please email **[ADD YOUR SECURITY CONTACT]** instead of using the issue tracker.

Do not open public issues for security vulnerabilities.

## Supported Versions

Only the latest version is supported with security updates.

## Security Features

- Automated dependency scanning (Dependabot)
- Secret scanning enabled
- SAST via CodeQL
- License compliance checking

## Security Best Practices

- Keep dependencies up to date
- Review dependabot PRs promptly
- Address security alerts immediately
- Use branch protection rules
- Require status checks before merge

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.
`;
  }
}
