import WebSocket, { WebSocketServer } from "ws";
import {
  createConnection,
  removeConnection,
  tickMessageCount,
} from "./connectionManager.js";
import { removeFromLobby, getLobbyById } from "./lobbyManager.js";
import { handleMessage, notifyLobbyOfLeave } from "./router.js";
import { parseMessage, isRateLimited } from "./utils/validation.js";
import { send } from "./utils/send.js";

const PORT = parseInt(process.env.PORT ?? "8080", 10);
const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (socket: WebSocket) => {
  const conn = createConnection(socket);

  send(socket, {
    type: "connected",
    payload: { connectionId: conn.id },
  });

  socket.on("message", (raw: WebSocket.RawData) => {
    // Rate limiting
    tickMessageCount(conn);
    if (isRateLimited(conn.messageCount, conn.rateLimitResetAt)) {
      send(socket, { type: "error", payload: { code: "RATE_LIMITED" } });
      return;
    }

    const message = parseMessage(raw.toString());
    if (!message) {
      send(socket, { type: "error", payload: { code: "INVALID_MESSAGE" } });
      return;
    }

    handleMessage(conn, message);
  });

  socket.on("close", () => {
    const lobbyId = conn.lobbyId;
    const lobby = lobbyId ? getLobbyById(lobbyId) : undefined;
    const wasHost = lobby?.hostId === conn.id;

    removeFromLobby(conn);
    removeConnection(conn.id);

    if (lobbyId) {
      notifyLobbyOfLeave(lobbyId, conn.id, wasHost ?? false);
    }
  });

  socket.on("error", (err: Error) => {
    console.error(`[error] connection=${conn.id} message=${err.message}`);
  });
});

console.log(`Relay server listening on ws://0.0.0.0:${PORT}`);
