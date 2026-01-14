# Worked Examples

Full examples showing the reasoning process.

## Good Example: Authentication Feature

**Context discovered by analyzing codebase**:
- Next.js 14 app with App Router
- PostgreSQL database (existing Prisma schema)
- No existing auth

**Reasoning**:
1. Database choice is made (Postgres) - don't ask
2. Framework is decided (Next.js 14) - don't ask
3. Auth provider and session type are genuinely undecided

**Questions asked** (2 focused questions):

```json
{
  "questions": [
    {
      "question": "I see you're on Next.js 14 with Postgres. For auth:",
      "header": "Auth Provider",
      "options": [
        { "label": "NextAuth.js", "description": "Native integration, stores in your Postgres" },
        { "label": "Clerk", "description": "Managed service, great DX, $25/mo at scale" },
        { "label": "Supabase Auth", "description": "Would add their client, but you keep Postgres" }
      ]
    },
    {
      "question": "Based on your existing Postgres setup:",
      "header": "Session Type",
      "options": [
        { "label": "Database sessions", "description": "Revocable, extra queries per request" },
        { "label": "JWT only", "description": "Stateless, can't revoke without blacklist" }
      ]
    }
  ]
}
```

**Why this is good**:
- References what was found in codebase
- Only 2 questions for truly undecided aspects
- Each option has context specific to their setup

## Good Example: API Design

**Context discovered**:
- Express.js backend
- Existing REST endpoints
- Mobile app client mentioned in README

**Reasoning**:
1. Backend framework is Express - don't ask
2. Some REST exists - could extend or add GraphQL
3. Mobile client = consider data fetching patterns

**Question asked** (1 targeted question):

```json
{
  "questions": [
    {
      "question": "For the new endpoints, given mobile client needs:",
      "header": "API Format",
      "options": [
        { "label": "REST (match existing)", "description": "Consistent, more requests for complex data" },
        { "label": "GraphQL", "description": "Flexible queries (learning curve, new tooling)" },
        { "label": "tRPC", "description": "Type-safe (ties to TS client)" }
      ]
    }
  ]
}
```

## Bad Example: No Context

```json
{
  "questions": [
    {
      "question": "What database?",
      "header": "DB",
      "options": [
        { "label": "PostgreSQL" },
        { "label": "MongoDB" },
        { "label": "MySQL" }
      ]
    }
  ]
}
```

**Problems**:
- No context about existing setup
- Options lack tradeoffs
- Might already be decided in codebase
- Header too terse

**Fixed version**:
```json
{
  "questions": [
    {
      "question": "Your user model has nested addresses and orders. For persistence:",
      "header": "Database",
      "options": [
        { "label": "PostgreSQL", "description": "Relational, your data has clear relationships" },
        { "label": "MongoDB", "description": "Documents match your nested structure" },
        { "label": "SQLite", "description": "Simple start, migrate later if needed" }
      ]
    }
  ]
}
```
