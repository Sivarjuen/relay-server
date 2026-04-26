import type { Connection, IncomingMessage } from "./types.js";
import { getConnection } from "./connectionManager.js";
import {
  createLobby,
  joinLobby,
  removeFromLobby,
  getLobbyById,
} from "./lobbyManager.js";
import { send } from "./utils/send.js";

export function handleMessage(conn: Connection, message: IncomingMessage): void {
  switch (message.type) {
    case "lobby.create":
      return handleLobbyCreate(conn);
    case "lobby.join":
      return handleLobbyJoin(conn, message.payload.code);
    case "lobby.leave":
      return handleLobbyLeave(conn);
    case "guest.message":
      return handleGuestMessage(conn, message.payload);
    case "host.message":
      return handleHostMessage(conn, message.payload, message.to);
    default: {
      const _exhaustive: never = message;
      send(conn.socket, { type: "error", payload: { code: "INVALID_MESSAGE" } });
      return _exhaustive;
    }
  }
}

// ============ Handlers ============

function handleLobbyCreate(conn: Connection): void {
  if (conn.lobbyId) {
    removeFromLobby(conn);
  }
  const lobby = createLobby(conn);
  send(conn.socket, {
    type: "lobby.created",
    lobbyId: lobby.id,
    payload: { code: lobby.code, hostId: lobby.hostId },
  });
}

function handleLobbyJoin(conn: Connection, code: string): void {
  if (!code || typeof code !== "string") {
    send(conn.socket, { type: "error", payload: { code: "INVALID_MESSAGE" } });
    return;
  }

  if (conn.lobbyId) {
    removeFromLobby(conn);
  }

  const lobby = joinLobby(conn, code);
  if (!lobby) {
    send(conn.socket, { type: "error", payload: { code: "LOBBY_NOT_FOUND" } });
    return;
  }

  // Notify joiner
  send(conn.socket, {
    type: "lobby.joined",
    lobbyId: lobby.id,
    payload: { code: lobby.code, hostId: lobby.hostId },
  });

  // Notify existing members
  for (const memberId of lobby.members) {
    if (memberId === conn.id) continue;
    const member = getConnection(memberId);
    if (member) {
      send(member.socket, {
        type: "player.joined",
        lobbyId: lobby.id,
        payload: { playerId: conn.id },
      });
    }
  }
}

function handleLobbyLeave(conn: Connection): void {
  if (!conn.lobbyId) {
    send(conn.socket, { type: "error", payload: { code: "NOT_IN_LOBBY" } });
    return;
  }

  const lobbyId = conn.lobbyId;
  const lobby = getLobbyById(lobbyId);
  const wasHost = lobby?.hostId === conn.id;

  removeFromLobby(conn);

  send(conn.socket, { type: "player.left", payload: { playerId: conn.id } });

  notifyLobbyOfLeave(lobbyId, conn.id, wasHost);
}

function handleGuestMessage(conn: Connection, payload: unknown): void {
  if (!conn.lobbyId) {
    send(conn.socket, { type: "error", payload: { code: "NOT_IN_LOBBY" } });
    return;
  }

  const lobby = getLobbyById(conn.lobbyId);
  if (!lobby) {
    send(conn.socket, { type: "error", payload: { code: "LOBBY_NOT_FOUND" } });
    return;
  }

  if (conn.id === lobby.hostId) {
    send(conn.socket, { type: "error", payload: { code: "NOT_GUEST" } });
    return;
  }

  const host = getConnection(lobby.hostId);
  if (host) {
    send(host.socket, {
      type: "guest.message",
      lobbyId: lobby.id,
      from: conn.id,
      payload,
    });
  }
}

function handleHostMessage(conn: Connection, payload: unknown, to?: string): void {
  if (!conn.lobbyId) {
    send(conn.socket, { type: "error", payload: { code: "NOT_IN_LOBBY" } });
    return;
  }

  const lobby = getLobbyById(conn.lobbyId);
  if (!lobby) {
    send(conn.socket, { type: "error", payload: { code: "LOBBY_NOT_FOUND" } });
    return;
  }

  if (conn.id !== lobby.hostId) {
    send(conn.socket, { type: "error", payload: { code: "NOT_HOST" } });
    return;
  }

  if (to) {
    // Targeted send to a specific guest
    if (!lobby.members.includes(to)) {
      send(conn.socket, { type: "error", payload: { code: "TARGET_NOT_IN_LOBBY" } });
      return;
    }
    const target = getConnection(to);
    if (target) {
      send(target.socket, {
        type: "host.message",
        lobbyId: lobby.id,
        from: conn.id,
        payload,
      });
    }
  } else {
    // Broadcast to all guests
    for (const memberId of lobby.members) {
      if (memberId === conn.id) continue;
      const member = getConnection(memberId);
      if (member) {
        send(member.socket, {
          type: "host.message",
          lobbyId: lobby.id,
          from: conn.id,
          payload,
        });
      }
    }
  }
}

// ============ Internal ============

export function notifyLobbyOfLeave(
  lobbyId: string,
  leftId: string,
  wasHost: boolean
): void {
  const lobby = getLobbyById(lobbyId);
  if (!lobby) return;

  for (const memberId of lobby.members) {
    const member = getConnection(memberId);
    if (!member) continue;
    send(member.socket, {
      type: "player.left",
      lobbyId: lobby.id,
      payload: { playerId: leftId },
    });
  }

  if (wasHost) {
    // Notify new host
    const newHost = getConnection(lobby.hostId);
    if (newHost) {
      send(newHost.socket, {
        type: "host.changed",
        lobbyId: lobby.id,
        payload: { hostId: lobby.hostId },
      });
    }
    // Notify all others of host change
    for (const memberId of lobby.members) {
      if (memberId === lobby.hostId) continue;
      const member = getConnection(memberId);
      if (member) {
        send(member.socket, {
          type: "host.changed",
          lobbyId: lobby.id,
          payload: { hostId: lobby.hostId },
        });
      }
    }
  }
}
