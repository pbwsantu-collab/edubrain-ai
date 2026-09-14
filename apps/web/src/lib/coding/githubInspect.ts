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
    const metaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
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
      const entries = (treeJson.tree || []) as Array<{ path: string; type: string; size?: number }>;
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
    const pkgEntry = tree.find((t) => t.path === 'package.json' || t.path.endsWith('/package.json'));
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
  return tree
    .filter((t) => t.type === 'blob')
    .filter((t) => {
      const p = t.path.toLowerCase();
      if (p.includes('node_modules') || p.includes('dist/') || p.includes('.git/')) return false;
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
}

export async function readPublicFile(
  repoUrl: string,
  filePath: string,
  branch?: string
): Promise<{ path: string; content: string; error?: string }> {
  const parsed = parseGithubUrl(repoUrl);
  if (!parsed) {
    return { path: filePath, content: '', error: 'Invalid GitHub URL' };
  }

  const b = branch || 'main';
  const url = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${b}/${filePath.replace(/^\//, '')}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      if (b === 'main') {
        const res2 = await fetch(
          `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/master/${filePath.replace(/^\//, '')}`
        );
        if (res2.ok) {
          const content = await res2.text();
          return { path: filePath, content: content.slice(0, 200_000) };
        }
      }
      return { path: filePath, content: '', error: `HTTP ${res.status}` };
    }
    const content = await res.text();
    return { path: filePath, content: content.slice(0, 200_000) };
  } catch (err) {
    return {
      path: filePath,
      content: '',
      error: err instanceof Error ? err.message : 'Read failed',
    };
  }
}

export function proposeSimplePatch(
  path: string,
  original: string,
  instruction: string
): { path: string; summary: string; unifiedDiff: string } {
  const lines = original.split('\n');
  const preview = lines.slice(0, 40).join('\n');
  const summary = `Proposed change for ${path}: ${instruction.slice(0, 200)}`;
  const unifiedDiff = [
    `--- a/${path}`,
    `+++ b/${path}`,
    `@@ note @@`,
    `# EDUBRAIN patch proposal (SAFE mode — not applied)`,
    `# Goal: ${instruction.replace(/\n/g, ' ').slice(0, 180)}`,
    `#`,
    `# Current file preview (${Math.min(lines.length, 40)} / ${lines.length} lines):`,
    ...preview.split('\n').map((l) => ` ${l}`),
    `#`,
    `# Next: wire Coding Agent LLM to emit a real unified diff for review.`,
  ].join('\n');

  return { path, summary, unifiedDiff };
}
