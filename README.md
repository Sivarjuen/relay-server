
# Relay Server

A lightweight multiplayer relay server built for a **client-first multiplayer architecture**.

This repository contains the backend infrastructure responsible for handling player connections, lobby creation, host assignment, and message routing between players.

The server intentionally contains **no game logic**. All gameplay state and rules live on connected clients, with one player acting as the authoritative host.

---

## Core Philosophy

This project uses a **dumb relay / smart client** model:

- The server routes messages between players
- One player in each lobby becomes the **host**
- The host owns the authoritative game state
- Other players send actions / input
- The server remains generic across many game types

This keeps backend maintenance low while allowing rapid game development on the frontend.

---

## Repository Responsibilities

This relay server repository is responsible for:

- WebSocket connection handling
- Lobby creation and joining
- Lobby code generation
- Host designation
- Message forwarding between players
- Player disconnect cleanup
- Host reassignment if host leaves
- Basic validation and rate limiting

This repository does **not** contain gameplay systems.

---

## Tech Stack

- **TypeScript** – strongly typed server logic
- **Node.js** – runtime environment
- **WebSocket (`ws`)** – real-time communication layer

Future optional scaling tools:

- Redis pub/sub
- Container deployment
- Metrics / observability tools

---

## Architecture Model

Each lobby contains connected players.

### Host Authoritative Flow

1. Guest players send actions/input
2. Server forwards messages to host
3. Host updates authoritative state
4. Host sends updated state
5. Server forwards to all lobby members

---

## Why This Model?

Benefits:

- Minimal backend complexity
- Reusable across many game genres
- Faster frontend iteration
- Low infrastructure cost
- Easier scaling later
- Stable backend with evolving clients

---

## Example Supported Games

Without changing the server:

- Shared cursor multiplayer tests
- Whiteboard / drawing games
- Card games
- Party games
- Turn-based board games
- Simple real-time action games

---

## Repository Structure

```txt
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
```

---

## Core Systems

### Connections

- Accept client socket connections
- Assign connection IDs
- Handle disconnect cleanup

### Lobbies

- Create lobby codes
- Join existing lobbies
- Remove empty lobbies

### Host Management

- First creator becomes host
- If host disconnects, promote next player
- Broadcast host changes

### Routing

- Guest → Host
- Host → Guests
- Server system events → Lobby

---

## Example Message Types

### Client-Originated

- `lobby.create`
- `lobby.join`
- `cursor.move`
- `game.action`

### Server-Originated

- `connected`
- `lobby.created`
- `lobby.joined`
- `player.joined`
- `player.left`
- `host.changed`
- `error`

---

## Security / Stability Principles

- Never route messages across lobbies
- Validate malformed packets
- Reject oversized payloads
- Basic per-connection rate limits
- Only host can send host-authoritative broadcasts
- Clean up stale/disconnected clients

---

## Persistence Strategy

Initial version uses **in-memory state only**.

This means:

- Fastest development path
- No database required
- Server restarts clear active lobbies

This is acceptable for early versions.

---

## Development Philosophy

- Keep code simple and readable
- Keep modules focused
- Avoid game-specific assumptions
- Prefer predictable behaviour
- Add complexity only when needed
- Keep the relay generic forever

---

## Anti-Patterns To Avoid

- Embedding gameplay logic
- Per-game server branches
- Premature database complexity
- Overengineered infrastructure
- Massive monolithic server files
- Untyped message handling

---

## Vision

A stable, lightweight multiplayer relay layer that rarely needs changing while many different browser games evolve on top of it.
