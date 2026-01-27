# Architecture Patterns

Core architectural patterns for Villages platform.

## Repository Pattern

ALL data access via repositories, never direct Prisma queries.

```
lib/db/repositories/
├── user-repository.ts
├── family-repository.ts
├── resource-repository.ts
└── ...
```

**Rule**: Import from `@/lib/db/repositories/*`. Never use `prisma.model.findMany()` directly in components or API routes.

## Authentication Flow

Dual-path authentication (session + DB fallback):

1. Resolve Clerk ID → Database ID before repository calls
2. Use `getFamiliesByCreator()` pattern for family-scoped security
3. Always check `isLoaded` and `isSignedIn` before API calls

**Reference**: `lib/auth/*`, `app/api/*/route.ts`

## Real-Time Architecture

Pusher (WebSocket-based) for unified real-time transport:

- Better serverless compatibility than SSE
- Built-in presence channels for user status
- Reliable connection handling with auto-reconnect
- Simplified error recovery

**Reference**: `lib/pusher/client.ts`, `lib/pusher/server.ts`, `hooks/use-chat-realtime.ts`, `hooks/use-notifications.ts`

## Transaction Safety

Wrap multi-step operations in transactions for atomic execution:

```typescript
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  await tx.family.create({ data: { ...familyData, createdById: user.id } });
  // Both succeed or both roll back
});
```

**Reference**: `lib/db/repositories/*-repository.ts`

## Family-Scoped Security

Volunteers restricted to families they created:

- Use `getFamiliesByCreator()` pattern
- Verify family ownership before data access
- ADMIN role bypasses family restrictions

## Database Optimization

- **Composite indexes**: `@@index([field1, field2])` for common queries
- **Participant queries**: Filter `leftAt` in JavaScript rather than using `leftAt: null` in Prisma queries
- **Graceful degradation**: Systems remain functional when components fail

---
*Reference: `lib/db/repositories/`, `prisma/schema.prisma`*
