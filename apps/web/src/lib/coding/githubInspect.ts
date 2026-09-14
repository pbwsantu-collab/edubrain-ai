/**
 * Public GitHub repository inspection (no token required for public repos).
 */

export interface RepoTreeEntry {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
}

export interface RepoInspection {
  fullName: string;
  description: string | null;
  defaultBranch: string;
  language: string | null;
  stars: number;
  private: boolean;
  tree: RepoTreeEntry[];
  packageJson?: {
    name?: string;
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  } | null;
  error?: string;
}

function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = url.trim().replace(/\.git$/, '');
    const m = u.match(/github\.com[/:]([^/]+)\/([^/]+)/i);
    if (!m) return null;
    return { owner: m[1], repo: m[2].split('/')[0] };
  } catch {
    return null;
  }
}

export async function inspectPublicRepo(repoUrl: string): Promise<RepoInspection> {
  const parsed = parseGithubUrl(repoUrl);
  if (!parsed) {
    return {
      fullName: '',
      description: null,
      defaultBranch: 'main',
      language: null,
      stars: 0,
      private: false,
      tree: [],
      error: 'Invalid GitHub URL. Expected https://github.com/owner/repo',
    };
  }

  const { owner, repo } = parsed;
  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'EDUBRAIN-AI',
  };

  try {
    const metaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
    });
    if (metaRes.status === 404) {
      return {
        fullName: `${owner}/${repo}`,
        description: null,
        defaultBranch: 'main',
        language: null,
        stars: 0,
        private: false,
        tree: [],
        error: 'Repository not found or private (public API only for now).',
      };
    }
    if (!metaRes.ok) {
      return {
        fullName: `${owner}/${repo}`,
        description: null,
        defaultBranch: 'main',
        language: null,
        stars: 0,
        private: false,
        tree: [],
        error: `GitHub API error: ${metaRes.status}`,
      };
    }

    const meta = await metaRes.json();
    const branch = meta.default_branch || 'main';

    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      { headers }
    );

    let tree: RepoTreeEntry[] = [];
    if (treeRes.ok) {
      const treeJson = await treeRes.json();
      const entries = (treeJson.tree || []) as Array<{
        path: string;
        type: string;
        size?: number;
      }>;
      tree = entries
        .filter((e) => e.type === 'blob' || e.type === 'tree')
        .slice(0, 400)
        .map((e) => ({
          path: e.path,
          type: e.type as 'blob' | 'tree',
          size: e.size,
        }));
    }

    let packageJson: RepoInspection['packageJson'] = null;
    const pkgEntry = tree.find(
      (t) => t.path === 'package.json' || t.path.endsWith('/package.json')
    );
    if (pkgEntry) {
      const path = pkgEntry.path === 'package.json' ? 'package.json' : pkgEntry.path;
      const rawRes = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
      );
      if (rawRes.ok) {
        try {
          packageJson = await rawRes.json();
        } catch {
          packageJson = null;
        }
      }
    }

    return {
      fullName: meta.full_name || `${owner}/${repo}`,
      description: meta.description || null,
      defaultBranch: branch,
      language: meta.language || null,
      stars: meta.stargazers_count || 0,
      private: !!meta.private,
      tree,
      packageJson,
    };
  } catch (err) {
    return {
      fullName: `${owner}/${repo}`,
      description: null,
      defaultBranch: 'main',
      language: null,
      stars: 0,
      private: false,
      tree: [],
      error: err instanceof Error ? err.message : 'Inspect failed',
    };
  }
}

export function summarizeTree(tree: RepoTreeEntry[], limit = 40): string[] {
  const interesting = tree
    .filter((t) => t.type === 'blob')
    .filter((t) => {
      const p = t.path.toLowerCase();
      if (p.includes('node_modules') || p.includes('dist/') || p.includes('.git/')) {
        return false;
      }
      return (
        p.endsWith('.ts') ||
        p.endsWith('.tsx') ||
        p.endsWith('.js') ||
        p.endsWith('.jsx') ||
        p.endsWith('.py') ||
        p.endsWith('.go') ||
        p.endsWith('.rs') ||
        p.endsWith('.json') ||
        p.endsWith('.md') ||
        p.endsWith('.sql') ||
        p.includes('dockerfile')
      );
    })
    .map((t) => t.path)
    .slice(0, limit);
  return interesting;
}
