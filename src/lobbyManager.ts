import type { Connection, Lobby } from "./types.js";
import { generateLobbyCode } from "./utils/codes.js";
import { generateConnectionId } from "./utils/ids.js";

// lobbies indexed by id and by code for fast lookup
const lobbiesById = new Map<string, Lobby>();
const lobbiesByCode = new Map<string, Lobby>();

export function getLobbyById(id: string): Lobby | undefined {
  return lobbiesById.get(id);
}

export function getLobbyByCode(code: string): Lobby | undefined {
  return lobbiesByCode.get(code.toUpperCase());
}

export function createLobby(host: Connection): Lobby {
  const code = generateUniqueCode();
  const lobby: Lobby = {
    id: generateConnectionId(),
    code,
    hostId: host.id,
    members: [host.id],
    createdAt: new Date(),
  };
  lobbiesById.set(lobby.id, lobby);
  lobbiesByCode.set(lobby.code, lobby);
  host.lobbyId = lobby.id;
  console.log(`[lobby.created] code=${lobby.code} host=${host.id}`);
  return lobby;
}

export function joinLobby(conn: Connection, code: string): Lobby | null {
  const lobby = getLobbyByCode(code);
  if (!lobby) return null;

  lobby.members.push(conn.id);
  conn.lobbyId = lobby.id;
  console.log(`[lobby.joined] code=${lobby.code} player=${conn.id}`);
  return lobby;
}

export function removeFromLobby(conn: Connection): void {
  if (!conn.lobbyId) return;
  const lobby = getLobbyById(conn.lobbyId);
  if (!lobby) {
    conn.lobbyId = undefined;
    return;
  }

  lobby.members = lobby.members.filter((id) => id !== conn.id);
  conn.lobbyId = undefined;

  if (lobby.members.length === 0) {
    // Empty lobby — clean up
    lobbiesById.delete(lobby.id);
    lobbiesByCode.delete(lobby.code);
    console.log(`[lobby.closed] code=${lobby.code} (empty)`);
    return;
  }

  if (lobby.hostId === conn.id) {
    // Promote oldest remaining member
    const newHostId = lobby.members[0];
    lobby.hostId = newHostId;
    console.log(`[host.changed] code=${lobby.code} newHost=${newHostId}`);
    return;
  }
}

// ============ Helpers ============

function generateUniqueCode(): string {
  let code: string;
  let attempts = 0;
  do {
    code = generateLobbyCode();
    attempts++;
    if (attempts > 100) throw new Error("Could not generate unique lobby code");
  } while (lobbiesByCode.has(code));
  return code;
}
