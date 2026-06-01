const GITHUB_REPO_PATTERN = /^https?:\/\/github\.com\/([^/]+)\/([^/#?]+)(?:[/?#].*)?$/i;

export type RepoReference = {
  owner: string;
  repo: string;
};

export function parseGitHubRepoUrl(input: string): RepoReference | null {
  const match = input.trim().match(GITHUB_REPO_PATTERN);
  if (!match) return null;

  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/i, ""),
  };
}

export async function fetchGitHubReadme(input: string): Promise<string> {
  const repo = parseGitHubRepoUrl(input);
  if (!repo) {
    throw new Error("Enter a valid GitHub repository URL like https://github.com/owner/repo.");
  }

  const response = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}/readme`, {
    headers: {
      Accept: "application/vnd.github.raw+json",
      "User-Agent": "readme-roast-fixer",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Could not fetch that repository README. Paste Markdown manually if the repo is private or rate-limited.");
  }

  return response.text();
}
