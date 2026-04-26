# Structure

## Repository Layout

```
relay-server/
  package.json
  tsconfig.json
  src/
    index.ts          # Entry point
    server.ts         # WebSocket server setup
    connectionManager.ts  # Socket lifecycle, connect/disconnect
    lobbyManager.ts   # Create/join/leave lobbies, host migration
    router.ts         # Route incoming messages to correct handler
    types.ts          # Shared TypeScript interfaces and types
    utils/
      codes.ts        # Lobby code generation
      ids.ts          # Connection ID generation
      validation.ts   # Message validation helpers
```

## Module Responsibilities

- `connectionManager.ts` — manages sockets, connect/disconnect lifecycle, connection state
- `lobbyManager.ts` — lobby creation, joining, leaving, host designation and migration
- `router.ts` — routes incoming messages based on type
- `types.ts` — all shared TypeScript interfaces (Lobby, Connection, message envelope, etc.)
- `utils/` — small focused utilities (code gen, ID gen, validation)

## Naming & Grouping Patterns

- One responsibility per module
- Utilities live in `utils/`
- No monolith files — avoid putting everything in `server.ts`

## In-Memory Data Models

### Lobby

```ts
{
  id: string,
  code: string,
  hostId: string,
  members: Set<connectionId>,
  createdAt: Date
}
```

### Connection

```ts
{
  id: string,
  socket: WebSocket,
  lobbyId?: string,
  joinedAt: Date
}
```
