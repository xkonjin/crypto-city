# Question Templates

Templates for common question scenarios. Copy and customize.

## Template: Technology Choice

Use when selecting between valid technical approaches.

```
Question: "Given [CONTEXT], which approach for [FEATURE]?"
Header: "[2-3 word label]" (max 12 chars)
Options:
- [Option A] - [key benefit] ([key tradeoff])
- [Option B] - [key benefit] ([key tradeoff])
- [Option C] - [key benefit] ([key tradeoff])
```

**Example**:
```
Question: "For the new analytics dashboard, which rendering strategy?"
Header: "Rendering"
Options:
- Server Components - faster initial load (requires Next.js 13+)
- Client SPA - more interactive (larger bundle, SEO challenges)
- Static + Hydration - best of both (more build complexity)
```

## Template: Scope Clarification

Use when requirements are ambiguous.

```
Question: "What scope for [FEATURE]?"
Header: "Scope"
Options:
- MVP - [minimal viable description]
- Standard - [typical implementation]
- Full - [comprehensive implementation]
```

**Example**:
```
Question: "What level of authentication do you need?"
Header: "Auth Scope"
Options:
- Basic - email/password only
- Standard - add OAuth (Google, GitHub)
- Enterprise - add SSO, RBAC, audit logs
```

## Template: UX Decision

Use for user-facing design choices.

```
Question: "How should [FEATURE] behave when [SCENARIO]?"
Header: "[2-3 word label]"
Options:
- [Behavior A] - [user experience implication]
- [Behavior B] - [user experience implication]
```

**Example**:
```
Question: "When a form has validation errors, how should we show them?"
Header: "Validation"
Options:
- Inline - errors appear next to each field (more visual noise)
- Summary - errors listed at top (less visual noise, more scrolling)
- Toast - errors in notification (least intrusive, might be missed)
```

## Template: Architecture Decision

Use for structural/design decisions.

```
Question: "For [SYSTEM ASPECT], which architecture pattern?"
Header: "[2-3 word label]"
Options with tradeoffs focused on:
- Complexity vs. flexibility
- Performance vs. maintainability
- Coupling vs. independence
```

**Example**:
```
Question: "How should services communicate in your microservices setup?"
Header: "IPC Pattern"
Options:
- REST - simple, well-understood (tight coupling, synchronous)
- Message Queue - decoupled, resilient (added infrastructure)
- gRPC - fast, typed contracts (steeper learning curve)
```
