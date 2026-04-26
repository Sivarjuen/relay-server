// ============ Connection & Lobby Models ============

import type WebSocket from "ws";

export interface Connection {
  id: string;
  socket: WebSocket;
  lobbyId?: string;
  joinedAt: Date;
  messageCount: number;
  rateLimitResetAt: Date;
}

export interface Lobby {
  id: string;
  code: string;
  hostId: string;
  /** Ordered list of member connection IDs (oldest first) */
  members: string[];
  createdAt: Date;
}

// ============ Message Envelope ============

export interface Envelope {
  type: string;
  lobbyId?: string;
  from?: string;
  to?: string;
  seq?: number;
  payload?: unknown;
}

// ============ Incoming Client Message Types ============

export interface LobbyCreateMessage {
  type: "lobby.create";
}

export interface LobbyJoinMessage {
  type: "lobby.join";
  payload: { code: string };
}

export interface LobbyLeaveMessage {
  type: "lobby.leave";
}

/** Guest → Host: forward input/gameplay message to host */
export interface GuestToHostMessage {
  type: "guest.message";
  payload: unknown;
}

/** Host → Guests: broadcast authoritative state to all guests, or a specific one */
export interface HostToGuestsMessage {
  type: "host.message";
  to?: string; // optional target connectionId; omit to broadcast to all guests
  payload: unknown;
}

export type IncomingMessage =
  | LobbyCreateMessage
  | LobbyJoinMessage
  | LobbyLeaveMessage
  | GuestToHostMessage
  | HostToGuestsMessage;

// ============ Error Codes ============

export type ErrorCode =
  | "LOBBY_NOT_FOUND"
  | "NOT_HOST"
  | "INVALID_MESSAGE"
  | "RATE_LIMITED"
  | "NOT_IN_LOBBY"
  | "TARGET_NOT_IN_LOBBY";
