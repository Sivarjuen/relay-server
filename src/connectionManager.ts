import type WebSocket from "ws";
import type { Connection } from "./types.js";
import { generateConnectionId } from "./utils/ids.js";
import { nextRateLimitWindow } from "./utils/validation.js";

const connections = new Map<string, Connection>();

export function createConnection(socket: WebSocket): Connection {
  const conn: Connection = {
    id: generateConnectionId(),
    socket,
    joinedAt: new Date(),
    messageCount: 0,
    rateLimitResetAt: nextRateLimitWindow(),
  };
  connections.set(conn.id, conn);
  console.log(`[connect] ${conn.id}`);
  return conn;
}

export function getConnection(id: string): Connection | undefined {
  return connections.get(id);
}

export function removeConnection(id: string): void {
  connections.delete(id);
  console.log(`[disconnect] ${id}`);
}

export function tickMessageCount(conn: Connection): void {
  const now = new Date();
  if (now >= conn.rateLimitResetAt) {
    conn.messageCount = 0;
    conn.rateLimitResetAt = nextRateLimitWindow();
  }
  conn.messageCount++;
}
