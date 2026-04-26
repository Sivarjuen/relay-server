# AI Agent Rules

## Coding Style

- Prefer readable code over clever abstractions
- Simplicity first — avoid unnecessary complexity
- Use TypeScript interfaces for all shared types (strong typing required)
- Keep modules focused and single-responsibility
- Do not create monolith files (e.g. avoid 1000-line server.ts)

## Implementation Preferences

- Never encode game-specific assumptions in the relay server
- Lobby isolation is strict — never route messages across lobbies
- Host migration must be deterministic and predictable
- Return explicit, machine-readable errors

## Error Types to Support

- `LOBBY_NOT_FOUND`
- `LOBBY_FULL` (optional, later)
- `NOT_HOST`
- `INVALID_MESSAGE`
- `RATE_LIMITED`

## Logging

Always log:

- Client connect / disconnect
- Lobby create / join / close
- Host change
- Malformed packets

## Validation

- Reject malformed messages
- Reject oversized payloads
- Apply per-connection basic rate limiting

## Anti-Patterns to Avoid

- Embedding game logic in the relay server
- Per-game server branches or conditionals
- Adding persistent DB before it's needed
- Using massive frameworks unnecessarily
- Anonymous untyped message blobs
- Cross-lobby message leakage
- Nested abstractions that obscure intent

## Do Not Implement (in relay server)

- Game rules of any kind
- Turn systems
- Score tracking
- Matchmaking
- Persistent player accounts
