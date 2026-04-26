# Project Design

## Concept

A multiplayer web game platform backend. The server is a generic relay — it does not contain game logic, rules, scoring, or simulation. All product iteration happens in client/game code.

## Design Pillars

- Dumb relay model: the server routes messages, it does not process game state
- Host-authoritative: one player per lobby acts as the game host; all game state lives on the host client
- Generic by design: no game-specific assumptions anywhere in the server
- Minimal backend: keep the server stable while many different games evolve on the client side

## Core Responsibilities

- Accept client connections
- Manage lobbies / rooms
- Route messages between players in the same lobby
- Designate one player as host
- Support host migration if the host disconnects

## Message Routing Model

- Guest → Host: forward gameplay/input messages
- Host → Guests: forward authoritative state messages
- Broadcast: some messages go to all players in a lobby
- System events originate from the server itself

## Server-Controlled Event Types

`connected`, `lobby.created`, `lobby.joined`, `player.joined`, `player.left`, `host.changed`, `error`

## Lobby Codes

- Short, human-friendly, uppercase letters only
- 4 characters recommended initially
- Avoid ambiguous characters where possible
- Easy to speak aloud

## Host Migration

- First creator becomes host
- If host disconnects, promote the oldest remaining member deterministically
- Broadcast `host.changed` event

## Persistence Strategy

- In-memory only for v1 (fastest path, no DB complexity)
- Server restart clears lobbies — acceptable initially
- Optional future: Redis for ephemeral lobby state

## Scaling Philosophy

- Single process instance acceptable for v1
- Future: sticky sessions or shared state broker (Redis pub/sub, multi-node fanout)
- Do not build scaling infrastructure now

## Future Compatibility Goal

This relay should work unchanged for: shared cursor demos, drawing whiteboards, card games, party games, board games, turn-based games, and simple action games. If a new game requires server changes, question the architecture first.

## Non-Goals

Do NOT implement:

- Card game rules or any game-specific logic
- Turn systems
- Hidden information logic
- Physics simulation
- Score tracking
- Persistent player accounts
- Matchmaking systems
- Complex databases
