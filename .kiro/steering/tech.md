# Tech

## Runtime

- Node.js (LTS)
- TypeScript

## Transport

- WebSocket (persistent, low-latency, bidirectional)
- Library: `ws` for v1 (minimal)
- Future option: `uWebSockets.js` for higher performance if needed

## Message Format

- JSON envelopes for v1
- Do not prematurely optimise to binary protocols

## Message Envelope Schema

```ts
{
  type: string,
  lobbyId?: string,
  from?: string,
  to?: string,
  seq?: number,
  payload?: object
}
```

## State

- In-memory maps only for v1
- No database required initially

## Deployment

- Any simple container/VM/platform (Fly.io, Railway, Render, DigitalOcean, VPS)
- Do not overengineer infrastructure initially

## Testing Tools

- Not specified yet

## Technical Constraints

- Single process instance acceptable for v1
- No persistent storage in v1
