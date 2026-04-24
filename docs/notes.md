# Party Games Relay Server Build Brief (AI Agent Handoff)

## Purpose

Build the backend relay server for a multiplayer web game platform.

This server is intentionally minimal. It should **not** contain game logic, game rules, scoring systems, or simulation logic.

Its sole responsibility is to:

- Accept client connections
- Manage lobbies / rooms
- Route messages between players in the same lobby
- Designate one player as host
- Support host migration if needed later
- Remain generic so future games require little or no backend changes

This architecture allows all product iteration to happen in client/game code.

---

## Core Server Philosophy

### Dumb Relay Model

The server is a message router, not a game engine.

The host client is authoritative for game state.

Clients send messages through the relay:

- guest → host
- host → guests
- system events from server

### Why This Architecture

Benefits:

- Faster game iteration
- Minimal backend maintenance
- Supports many game types
- Low server complexity
- Easy scaling model
- Reusable for future games

---

## Recommended Tech Stack (2026)

## Runtime

Use:

- Node.js (LTS)
- TypeScript

Reason:
- Strong typing
- Fast iteration
- Excellent WebSocket ecosystem

## Transport

Use:

- WebSocket

Reason:
- Persistent low-latency bidirectional communication
- Ideal for multiplayer sessions

Recommended libraries:

- ws (minimal)
or
- uWebSockets.js (higher performance)

For first version: use `ws`.

## Deployment

Any simple container/VM/platform works:

- entity["company","Fly.io","hosting platform"]
- entity["company","Railway","hosting platform"]
- entity["company","Render","hosting platform"]
- entity["company","DigitalOcean","cloud provider"]
- VPS / self-hosted

Do not overengineer infrastructure initially.

---

## Non-Goals (Important)

Do NOT implement:

- Card game rules
- Turn systems
- Hidden information logic
- Physics simulation
- Score tracking
- Persistent player accounts
- Matchmaking systems
- Complex databases

Those belong in clients or future services.

---

## Functional Responsibilities

## 1. Connection Management

When a client connects:

- assign unique connection ID
- keep socket reference
- await create/join lobby message

When disconnected:

- remove client cleanly
- notify lobby members
- if host disconnected, reassign host

---

## 2. Lobby Management

Support:

### Create Lobby

Client requests lobby creation.

Server:

- creates unique lobby code
- adds creator to lobby
- marks creator as host

### Join Lobby

Client supplies lobby code.

Server:

- validates lobby exists
- adds player
- notifies existing members
- tells joiner current host

### Leave Lobby

On disconnect or explicit leave:

- remove player
- cleanup empty lobbies

---

## 3. Host Designation

Each lobby has one host.

Store:

- host connection ID

Rules:

- first creator becomes host
- if host leaves, promote next available player deterministically

Simple rule:

oldest remaining member becomes host

Broadcast host change event.

---

## 4. Message Routing

Server routes messages only.

### Guest to Host

Forward gameplay/input messages from guests to host.

### Host to Guests

Forward authoritative state messages from host to all guests.

### Broadcast

Some messages may go to all players.

---

## Suggested Message Envelope

All messages should use consistent envelope:

{
  type: string,
  lobbyId?: string,
  from?: string,
  to?: string,
  seq?: number,
  payload?: object
}

Examples:

type = "lobby.create"
type = "lobby.join"
type = "cursor.move"
type = "presence.state"

---

## Server-Controlled Message Types

These originate from server:

connected
lobby.created
lobby.joined
player.joined
player.left
host.changed
error

---

## Lobby Data Model

Maintain in-memory maps.

### Lobby

{
  id,
  code,
  hostId,
  members: Set<connectionId>,
  createdAt
}

### Connection

{
  id,
  socket,
  lobbyId?,
  joinedAt
}

---

## Persistence Strategy

Initial version:

Use memory only.

Reason:

- Fastest path
- No DB complexity
- Perfect for prototype / early launch

Tradeoff:

Server restart clears lobbies.

Acceptable initially.

Later optional persistence:
- Redis for ephemeral lobby state

---

## Lobby Codes

Use short human-friendly codes.

Examples:

ABCD
QUQJ

Rules:

- uppercase
- avoid ambiguous chars if possible
- easy to speak aloud
- letters only

Length:
4 chars recommended initially

---

## Security / Validation

Minimal but important.

### Validate Input

Reject malformed messages.

### Lobby Isolation

Never route messages across lobbies.

### Host Authority Check

Only current host may send host-only broadcasts.

### Size Limits

Reject oversized payloads.

### Rate Limits

Per connection basic spam protection.

### Sanitize Disconnects

Always cleanup state.

---

## Performance Philosophy

Keep messages lightweight.

Use JSON initially.

Do not prematurely optimize to binary protocols unless required.

Likely enough for early games:
- cursor updates
- presence state
- card actions
- turn events

---

## Scaling Philosophy

Version 1:

Single process instance is acceptable.

When scaling later:

Use sticky sessions or shared state broker.

Possible future tools:

- entity["company","Redis","data platform"] pub/sub
- multi-node message fanout

Do not build this now.

---

## Reliability Features (Later)

Optional future improvements:

- reconnect tokens
- session resume
- heartbeat ping/pong
- stale socket cleanup
- metrics dashboard

Not mandatory for first release.

---

## API / Event Flow Example

### Create Lobby

Client sends:
lobby.create

Server responds:
lobby.created { code, hostId }

### Join Lobby

Client sends:
lobby.join { code }

Server responds:
lobby.joined

Broadcast:
player.joined

### Cursor Update

Guest sends:
cursor.move

Server forwards to host.

Host sends:
presence.state

Server forwards to lobby.

---

## Recommended File Structure

relay-server/
  package.json
  tsconfig.json
  src/
    index.ts
    server.ts
    connectionManager.ts
    lobbyManager.ts
    router.ts
    types.ts
    utils/
      codes.ts
      ids.ts
      validation.ts

---

## Code Design Principles

### Keep Modules Focused

connectionManager.ts
- sockets
- connect/disconnect

lobbyManager.ts
- create/join/leave
- host migration

router.ts
- route incoming messages

### Avoid Monolith Files

Do not put everything in one 1000-line server.ts

---

## Coding Behaviours / Standards

### Simplicity First

Prefer readable code over clever abstractions.

### Genericity

Never encode game-specific assumptions.

### Deterministic Host Migration

Predictable reassignment logic.

### Explicit Errors

Return useful machine-readable errors.

### Strong Types

Use TypeScript interfaces.

### Logging

Log:

- connect
- disconnect
- lobby create/join/close
- host change
- malformed packets

---

## Errors To Support

LOBBY_NOT_FOUND
LOBBY_FULL (optional later)
NOT_HOST
INVALID_MESSAGE
RATE_LIMITED

---

## Anti-Patterns To Avoid

- Embedding game logic
- Per-game server branches
- Persistent DB too early
- Massive frameworks unnecessarily
- Anonymous untyped message blobs
- Cross-lobby leakage
- Nested abstractions nobody understands

---

## Future Compatibility Goal

This relay should work unchanged for:

- shared cursor test
- drawing whiteboard
- card games
- party games
- board games
- turn-based games
- simple action games

If a new game requires server changes, question the architecture first.

---

## Final Summary

Build a TypeScript WebSocket relay server that manages lobbies, assigns hosts, and routes messages.

No gameplay logic belongs here.

Use in-memory state, simple lobby codes, deterministic host reassignment, and strict lobby isolation.

The backend should remain stable while many different games evolve on the client side.No notes yet