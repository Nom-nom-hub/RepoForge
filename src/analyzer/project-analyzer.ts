import * as fs from "fs";
import * as path from "path";
import {
  Project,
  LanguageSchema,
  RuntimeSchema,
  ProjectTypeSchema,
  DeploymentSchema,
} from "../types/spec.js";

interface ProjectAnalysisResult {
  project: Partial<Project>;
  confidence: number;
  detected: {
    files: string[];
    patterns: string[];
  };
}

export class ProjectAnalyzer {
  private rootDir: string;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
  }

  analyze(): ProjectAnalysisResult {
    const files = this.listFiles();
    const patterns = this.detectPatterns(files);

    const language = this.detectLanguage(files);
    const projectType = this.detectProjectType(files);
    const runtime = this.detectRuntime(files);
    const deployment = this.detectDeployment(files);

    return {
      project: {
        language,
        type: projectType,
        runtime,
        deployment,
        risk: "internal", // default
      },
      confidence: this.calculateConfidence(language, projectType),
      detected: {
        files,
        patterns,
      },
    };
  }

  private listFiles(dir: string = this.rootDir, maxDepth: number = 2, currentDepth: number = 0): string[] {
    if (currentDepth >= maxDepth) return [];

    try {
      const entries = fs.readdirSync(dir);
      return entries
        .filter((e) => !e.startsWith(".") && e !== "node_modules")
        .slice(0, 50);
    } catch {
      return [];
    }
  }

  private detectPatterns(files: string[]): string[] {
    const patterns: string[] = [];

    const fileMap = {
      "package.json": "nodejs",
      "requirements.txt": "python",
      "pyproject.toml": "python",
      "go.mod": "golang",
      "Cargo.toml": "rust",
      "Dockerfile": "containerized",
      "docker-compose.yml": "containerized",
      ".github/workflows": "github-actions",
      "serverless.yml": "serverless",
      "terraform": "iac-terraform",
    };

    for (const [file, pattern] of Object.entries(fileMap)) {
      if (files.includes(file)) {
        patterns.push(pattern);
      }
    }

    return patterns;
  }

  private detectLanguage(files: string[]) {
    if (files.includes("package.json")) {
      return "typescript";
    }
    if (files.includes("requirements.txt") || files.includes("pyproject.toml")) {
      return "python";
    }
    if (files.includes("go.mod")) {
      return "go";
    }
    if (files.includes("Cargo.toml")) {
      return "rust";
    }
    return "javascript";
  }

  private detectProjectType(files: string[]) {
    if (files.includes("package.json")) {
      const content = this.readJson("package.json");
      if (content?.name?.includes("cli")) return "cli";
      if (content?.dependencies?.react) return "frontend";
      if (content?.type === "module") return "backend-api";
      return "library";
    }
    return "backend-api";
  }

  private detectRuntime(files: string[]) {
    if (files.includes("package.json")) {
      const content = this.readJson("package.json");
      const engines = content?.engines?.node;
      if (engines?.includes("20")) return "node20";
      if (engines?.includes("18")) return "node18";
      return "node20";
    }
    return "python311";
  }

  private detectDeployment(files: string[]) {
    if (files.includes("Dockerfile")) return "container";
    if (files.includes("serverless.yml")) return "serverless";
    return "container";
  }

  private calculateConfidence(language: any, projectType: any): number {
    return language && projectType ? 0.8 : 0.5;
  }

  private readJson(filename: string): any {
    try {
      const content = fs.readFileSync(path.join(this.rootDir, filename), "utf-8");
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
}
