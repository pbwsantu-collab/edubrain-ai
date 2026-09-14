/**
 * Coding Agent — Phase 5 scaffold
 *
 * Controlled code generation / modification. Does NOT auto-deploy or push
 * without explicit permission (see docs/PERMISSIONS.md).
 */

export type CodingAction =
  | 'inspect_repo'
  | 'read_file'
  | 'propose_patch'
  | 'run_tests'
  | 'commit'
  | 'open_pr'
  | 'deploy';

export type PermissionLevel = 'SAFE' | 'ASSISTED' | 'AUTONOMOUS';

export const CODING_PERMISSIONS: Record<PermissionLevel, CodingAction[]> = {
  SAFE: ['inspect_repo', 'read_file', 'propose_patch'],
  ASSISTED: ['inspect_repo', 'read_file', 'propose_patch', 'run_tests', 'commit', 'open_pr'],
  AUTONOMOUS: [
    'inspect_repo',
    'read_file',
    'propose_patch',
    'run_tests',
    'commit',
    'open_pr',
    'deploy',
  ],
};

export interface CodingTask {
  id: string;
  goal: string;
  repoUrl?: string;
  branch?: string;
  filesOfInterest?: string[];
  permission: PermissionLevel;
}

export interface CodingPlanStep {
  action: CodingAction;
  description: string;
  requiresConfirmation: boolean;
}

export function planCodingTask(task: CodingTask): CodingPlanStep[] {
  const allowed = new Set(CODING_PERMISSIONS[task.permission]);
  const steps: CodingPlanStep[] = [];

  if (allowed.has('inspect_repo')) {
    steps.push({
      action: 'inspect_repo',
      description: 'Inspect repository structure and package manifests',
      requiresConfirmation: false,
    });
  }
  if (allowed.has('read_file')) {
    steps.push({
      action: 'read_file',
      description: 'Read relevant source files',
      requiresConfirmation: false,
    });
  }
  if (allowed.has('propose_patch')) {
    steps.push({
      action: 'propose_patch',
      description: 'Propose code changes as a reviewable patch',
      requiresConfirmation: true,
    });
  }
  if (allowed.has('run_tests')) {
    steps.push({
      action: 'run_tests',
      description: 'Run tests in a sandbox',
      requiresConfirmation: true,
    });
  }
  if (allowed.has('commit')) {
    steps.push({
      action: 'commit',
      description: 'Create a git commit on a feature branch',
      requiresConfirmation: true,
    });
  }
  if (allowed.has('open_pr')) {
    steps.push({
      action: 'open_pr',
      description: 'Open a pull request for review',
      requiresConfirmation: true,
    });
  }
  if (allowed.has('deploy') && task.permission === 'AUTONOMOUS') {
    steps.push({
      action: 'deploy',
      description: 'Deploy only after explicit user authorization',
      requiresConfirmation: true,
    });
  }

  return steps;
}

export const CODING_SYSTEM_PROMPT = `You are the EDUBRAIN Coding Agent.

Rules:
- Prefer small, reviewable changes over large rewrites.
- Never deploy or force-push without explicit user authorization.
- Always explain what you will change before applying patches.
- Run tests when available; report failures clearly.
- Stay within the permission level (SAFE / ASSISTED / AUTONOMOUS).
`;
