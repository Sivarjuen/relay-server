import WebSocket from "ws";
import type { Envelope } from "../types.js";

export function send(socket: WebSocket, data: Envelope): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}
