import { Octokit } from "octokit";

export interface GitHubCredentials {
  token: string;
  owner: string;
  repo: string;
}

export interface CreatePROptions {
  title: string;
  body: string;
  files: Map<string, string>;
  baseBranch?: string;
}

export class GitHubClient {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(credentials: GitHubCredentials) {
    this.octokit = new Octokit({ auth: credentials.token });
    this.owner = credentials.owner;
    this.repo = credentials.repo;
  }

  async validateAccess(): Promise<boolean> {
    try {
      const { data } = await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo,
      });
      return !!data;
    } catch {
      return false;
    }
  }

  async getDefaultBranch(): Promise<string> {
    const { data } = await this.octokit.rest.repos.get({
      owner: this.owner,
      repo: this.repo,
    });
    return data.default_branch || "main";
  }

  async createPullRequest(options: CreatePROptions): Promise<string> {
    const baseBranch = options.baseBranch || (await this.getDefaultBranch());
    const branchName = `repoforge/${Date.now()}`;

    // Get the base branch SHA
    const { data: refData } = await this.octokit.rest.git.getRef({
      owner: this.owner,
      repo: this.repo,
      ref: `heads/${baseBranch}`,
    });

    const baseSha = refData.object.sha;

    // Create a new branch
    await this.octokit.rest.git.createRef({
      owner: this.owner,
      repo: this.repo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });

    // Commit files to the branch
    for (const [filePath, content] of options.files) {
      await this.commitFile(branchName, filePath, content);
    }

    // Create PR
    const { data: prData } = await this.octokit.rest.pulls.create({
      owner: this.owner,
      repo: this.repo,
      title: options.title,
      body: options.body,
      head: branchName,
      base: baseBranch,
    });

    return prData.html_url;
  }

  private async commitFile(
    branch: string,
    filePath: string,
    content: string
  ): Promise<void> {
    try {
      // Try to get existing file
      const { data: existingFile } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        ref: branch,
      });

      if ("sha" in existingFile) {
        // Update existing file
        await this.octokit.rest.repos.createOrUpdateFileContents({
          owner: this.owner,
          repo: this.repo,
          path: filePath,
          message: `repoforge: update ${filePath}`,
          content: Buffer.from(content).toString("base64"),
          sha: existingFile.sha,
          branch,
        });
      }
    } catch {
      // File doesn't exist, create it
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        message: `repoforge: add ${filePath}`,
        content: Buffer.from(content).toString("base64"),
        branch,
      });
    }
  }

  async deleteBranch(branchName: string): Promise<void> {
    await this.octokit.rest.git.deleteRef({
      owner: this.owner,
      repo: this.repo,
      ref: `heads/${branchName}`,
    });
  }
}
