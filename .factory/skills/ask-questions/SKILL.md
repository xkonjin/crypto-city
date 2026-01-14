---
name: ask-questions
description: Provides guidance for crafting effective user questions during planning
  or clarification. Use when asking users for input, making decisions with options,
  or gathering requirements. Helps avoid generic questions and ensures context-aware,
  well-structured options with clear tradeoffs.
license: MIT
metadata:
  author: obsessed-devs
  version: "1.0"
  category: planning
---

# Asking Effective Questions

Guidance for using the `askuserquestion` tool effectively. Load this skill before
asking questions to ensure you gather useful information.

## Core Principles

### 1. Context First, Questions Second

ALWAYS analyze the project before asking:

1. Check package.json, go.mod, requirements.txt for existing choices
2. Look for existing patterns in the codebase
3. Identify what's ALREADY decided vs genuinely ambiguous
4. Consider what you can reasonably infer

**DON'T ask about decisions already made.**

### 2. Quality Over Quantity

- Maximum 4-6 questions per interaction
- Each question should unlock meaningful progress
- Combine related questions when possible
- Skip questions where you can make a reasonable default

### 3. Options With Tradeoffs

Each option MUST include context:

**BAD**:
```
Database: PostgreSQL | MongoDB | SQLite
```

**GOOD**:
```
Database:
- PostgreSQL (you have complex relationships, ACID needed)
- MongoDB (flexible schema, your data is document-shaped)
- SQLite (simple needs, single-user, no ops overhead)
```

## When NOT to Ask

Skip questions when:

1. **The answer is in the code** - check first
2. **Either choice works fine** - make a reasonable default
3. **It's easily changeable** - just pick one and note it
4. **You're just avoiding a decision** - trust your judgment
5. **The question is premature** - wait until you need the answer

## Question Templates

See [references/templates.md](references/templates.md) for templates:
- Technology Choice
- Scope Clarification
- UX Decision
- Architecture Decision

## Anti-Patterns

See [references/anti-patterns.md](references/anti-patterns.md) for what to avoid:
- Generic questions without context
- Asking about decided things
- Yes/No when options exist
- Overwhelming with too many questions

## Examples

See [references/examples.md](references/examples.md) for:
- Good example: Authentication feature
- Good example: API design
- Bad examples with corrections

## Reasoning Template

Before presenting questions, think through:

1. What do I already know from the codebase?
2. What am I actually uncertain about?
3. Which uncertainties matter RIGHT NOW?
4. Can I make reasonable defaults for any of these?
5. For remaining questions, what are the REAL tradeoffs?
