import { Spec } from "../types/spec.js";

export interface PolicyPack {
  name: string;
  description: string;
  version: string;
  extends?: string;
  spec: Partial<Spec>;
}

export type PolicyPackType = "startup" | "saas" | "enterprise" | "oss";

export class PolicyPackRegistry {
  private packs: Map<string, PolicyPack> = new Map();

  constructor() {
    this.initializeBuiltInPacks();
  }

  private initializeBuiltInPacks(): void {
    // Startup Pack - minimal, fast iteration
    this.register({
      name: "startup",
      description: "Minimal standards for fast-moving startups",
      version: "1.0.0",
      spec: {
        standards: {
          ci: "strict",
          security: "strict",
          releases: "permissive",
        },
      },
    });

    // SaaS Pack - production-ready with some overhead
    this.register({
      name: "saas",
      description: "Production-grade standards for SaaS companies",
      version: "1.0.0",
      spec: {
        standards: {
          ci: "enforced",
          security: "enforced",
          releases: "strict",
        },
      },
    });

    // Enterprise Pack - maximum security and compliance
    this.register({
      name: "enterprise",
      description: "Enterprise-grade standards for regulated industries",
      version: "1.0.0",
      spec: {
        standards: {
          ci: "enforced",
          security: "enforced",
          releases: "enforced",
        },
      },
    });

    // OSS Pack - community-friendly open source standards
    this.register({
      name: "oss",
      description: "Standards for open source projects",
      version: "1.0.0",
      spec: {
        standards: {
          ci: "strict",
          security: "strict",
          releases: "strict",
        },
      },
    });
  }

  register(pack: PolicyPack): void {
    this.packs.set(pack.name, pack);
  }

  get(name: string): PolicyPack | undefined {
    return this.packs.get(name);
  }

  list(): PolicyPack[] {
    return Array.from(this.packs.values());
  }

  apply(spec: Partial<Spec>, packName: string): Partial<Spec> {
    const pack = this.get(packName);
    if (!pack) {
      throw new Error(`Policy pack not found: ${packName}`);
    }

    // Deep merge pack spec with provided spec
    return {
      ...spec,
      standards: {
        ci: spec.standards?.ci || pack.spec.standards?.ci,
        security: spec.standards?.security || pack.spec.standards?.security,
        releases: spec.standards?.releases || pack.spec.standards?.releases,
      },
    } as Partial<Spec>;
  }
}

export const defaultRegistry = new PolicyPackRegistry();
