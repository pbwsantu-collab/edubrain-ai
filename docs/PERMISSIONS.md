# EDUBRAIN AI — Permission & Safety Model

## Modes

| Mode | Description |
|------|-------------|
| **SAFE** | Read-only + teaching. No file writes, installs, pushes, or deploys. |
| **ASSISTED** | Writes require explicit user confirmation for each risky action. |
| **AUTONOMOUS DEVELOPMENT** | Limited automatic repair cycles (configurable max). Still requires confirmation for push / deploy / delete. |

## Action Risk Levels

| Level | Examples | Default requirement |
|-------|----------|---------------------|
| Low | Public docs, student progress read | Allowed |
| Medium | Project file read, generate code | Allowed in ASSISTED+ |
| High | Modify files, install packages, commit | Confirmation |
| Critical | Push, deploy, delete, change production DB | Explicit confirmation + AUDIT log |

## Rules

- Never give generated code unrestricted access to the user's machine by default.
- All high/critical actions create an `action_request` record (Phase 5+).
- Secrets never leave server-side infrastructure.
- Students only access their own data (RLS).
