# Anti-Patterns

What NOT to do when asking questions.

## Don't: Ask Generic Questions

These show you haven't analyzed the context:

```
BAD "What database do you want?"
BAD "Which framework should I use?"
BAD "What testing approach?"
```

**Instead**: Include context from what you observed:
```
GOOD "I see you're using TypeScript with a monorepo. For the new service,
     which database given your existing Postgres in the main app?"
```

## Don't: Ask About Decided Things

Check the codebase FIRST:

```
BAD "Should I use TypeScript?" (when tsconfig.json exists)
BAD "Which package manager?" (when bun.lock exists)
BAD "What port?" (when .env has PORT=3000)
```

## Don't: Ask Yes/No When Options Exist

```
BAD "Should I add caching?"
```

**Instead**: Present the actual options:
```
GOOD "For API response caching:"
   - None - keep it simple for now
   - In-memory - fast, lost on restart
   - Redis - persistent, shared across instances
```

## Don't: Overwhelm With Questions

```
BAD Asking 10 questions at once
```

**Instead**:
```
GOOD Ask 2-4 critical questions now, follow up if needed
```

## Don't: Use Vague Headers

```
BAD Header: "Choice"
BAD Header: "Option"
BAD Header: "Question"
```

**Instead**: Be specific:
```
GOOD Header: "Database"
GOOD Header: "Auth"
GOOD Header: "Caching"
```

## Don't: Skip Tradeoffs

```
BAD Options without context:
   - PostgreSQL
   - MongoDB
   - SQLite
```

**Instead**: Every option needs its tradeoff:
```
GOOD - PostgreSQL (relational, ACID, mature ecosystem)
     - MongoDB (documents, flexible schema, horizontal scale)
     - SQLite (embedded, zero-ops, single-writer limitation)
```
