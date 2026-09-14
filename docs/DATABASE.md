# EDUBRAIN AI — Database Schema

**Phase 1 focus** — Auth, profiles, basic student memory, conversations.

## Extensions

```sql
create extension if not exists "uuid-ossp";
create extension if not exists "vector";
```

## Core Tables (Phase 1)

### profiles
Extends `auth.users`.

| Column            | Type        | Notes                          |
|-------------------|-------------|--------------------------------|
| id                | uuid PK     | = auth.users.id                |
| display_name      | text        |                                |
| role              | text        | student \| teacher \| admin \| developer |
| preferred_language| text        | default 'en'                   |
| ui_language       | text        | default 'en'                   |
| voice_settings    | jsonb       | speed, voice, etc.             |
| avatar_url        | text        |                                |
| created_at        | timestamptz |                                |
| updated_at        | timestamptz |                                |

### student_profiles
| Column            | Type        | Notes                          |
|-------------------|-------------|--------------------------------|
| id                | uuid PK     |                                |
| user_id           | uuid FK     | → profiles                     |
| grade_or_level    | text        |                                |
| goals             | text[]      |                                |
| learning_preferences | jsonb    |                                |
| created_at        | timestamptz |                                |
| updated_at        | timestamptz |                                |

### subjects
| Column            | Type        | Notes                          |
|-------------------|-------------|--------------------------------|
| id                | uuid PK     |                                |
| name              | text        | e.g. Mathematics, Physics      |
| slug              | text unique |                                |
| description       | text        |                                |
| icon              | text        |                                |
| is_active         | boolean     | default true                   |
| created_at        | timestamptz |                                |

### conversations
| Column            | Type        | Notes                          |
|-------------------|-------------|--------------------------------|
| id                | uuid PK     |                                |
| user_id           | uuid FK     |                                |
| subject_id        | uuid FK     | nullable                       |
| title             | text        |                                |
| mode              | text        | teaching \| coding \| general  |
| created_at        | timestamptz |                                |
| updated_at        | timestamptz |                                |

### messages
| Column            | Type        | Notes                          |
|-------------------|-------------|--------------------------------|
| id                | uuid PK     |                                |
| conversation_id   | uuid FK     |                                |
| role              | text        | user \| assistant \| system    |
| content           | text        |                                |
| metadata          | jsonb       |                                |
| created_at        | timestamptz |                                |

### mastery (basic)
| Column            | Type        | Notes                          |
|-------------------|-------------|--------------------------------|
| id                | uuid PK     |                                |
| user_id           | uuid FK     |                                |
| concept_key       | text        | free-form for Phase 1          |
| subject_id        | uuid FK     | nullable                       |
| score             | numeric     | 0–1                            |
| confidence        | numeric     | 0–1                            |
| evidence_count    | integer     |                                |
| last_assessed_at  | timestamptz |                                |
| created_at        | timestamptz |                                |
| updated_at        | timestamptz |                                |

## Row Level Security

- Students can only read/write their own rows.
- Teachers can read assigned students (Phase 2+).
- Admins have broader access via service role or specific policies.

## Future Tables (later phases)

- curricula, units, chapters, topics, concepts
- documents, document_chunks (with embeddings)
- experiences, evaluations
- projects, coding_sessions, repositories
- revision_schedule, attempts, mistakes
- audit_logs, action_requests
