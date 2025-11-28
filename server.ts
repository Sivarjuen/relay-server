import WebSocket, { WebSocketServer } from "ws";
import { randomUUID } from "crypto";

// ============ Types ============

interface Client {
  id: string;
  ws: WebSocket;
  lobbyId: string | null;
}

interface Lobby {
  id: string;
  hostId: string;
  guestIds: Set<string>;
}

type MessageType =
  | "create_lobby"
  | "join_lobby"
  | "leave_lobby"
  | "client_event"
  | "host_event";

interface BaseMessage {
  type: MessageType;
}

interface CreateLobbyMessage extends BaseMessage {
  type: "create_lobby";
}

interface JoinLobbyMessage extends BaseMessage {
  type: "join_lobby";
  lobbyId: string;
}

interface LeaveLobbyMessage extends BaseMessage {
  type: "leave_lobby";
}

interface ClientEventMessage extends BaseMessage {
  type: "client_event";
  payload: unknown;
}

interface HostEventMessage extends BaseMessage {
  type: "host_event";
  payload: unknown;
  targetClientId?: string;
}

type IncomingMessage =
  | CreateLobbyMessage
  | JoinLobbyMessage
  | LeaveLobbyMessage
  | ClientEventMessage
  | HostEventMessage;

// ============ State ============

const clients = new Map<string, Client>();
const lobbies = new Map<string, Lobby>();

// ============ Helpers ============

function send(ws: WebSocket, data: object): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function getClient(clientId: string): Client | undefined {
  return clients.get(clientId);
}

function getLobby(lobbyId: string): Lobby | undefined {
  return lobbies.get(lobbyId);
}

function removeClientFromLobby(client: Client): void {
  if (!client.lobbyId) return;

  const lobby = getLobby(client.lobbyId);
  if (!lobby) {
    client.lobbyId = null;
    return;
  }

  if (lobby.hostId === client.id) {
    // Host is leaving, notify all guests and close lobby
    for (const guestId of lobby.guestIds) {
      const guest = getClient(guestId);
      if (guest) {
        send(guest.ws, { type: "lobby_closed", reason: "host_left" });
        guest.lobbyId = null;
      }
    }
    lobbies.delete(lobby.id);
  } else {
    // Guest is leaving
    lobby.guestIds.delete(client.id);
    const host = getClient(lobby.hostId);
    if (host) {
      send(host.ws, { type: "guest_left", clientId: client.id });
    }
  }

  client.lobbyId = null;
}

// ============ Message Handlers ============

function handleCreateLobby(client: Client): void {
  // Leave current lobby if in one
  if (client.lobbyId) {
    removeClientFromLobby(client);
  }

  const lobbyId = randomUUID();
  const lobby: Lobby = {
    id: lobbyId,
    hostId: client.id,
    guestIds: new Set(),
  };

  lobbies.set(lobbyId, lobby);
  client.lobbyId = lobbyId;

  send(client.ws, { type: "lobby_created", lobbyId });
}

function handleJoinLobby(client: Client, lobbyId: string): void {
  const lobby = getLobby(lobbyId);
  if (!lobby) {
    send(client.ws, { type: "error", message: "Lobby not found" });
    return;
  }

  // Leave current lobby if in one
  if (client.lobbyId) {
    removeClientFromLobby(client);
  }

  lobby.guestIds.add(client.id);
  client.lobbyId = lobbyId;

  // Notify the joining client
  send(client.ws, { type: "lobby_joined", lobbyId });

  // Notify the host
  const host = getClient(lobby.hostId);
  if (host) {
    send(host.ws, { type: "guest_joined", clientId: client.id });
  }
}

function handleLeaveLobby(client: Client): void {
  if (!client.lobbyId) {
    send(client.ws, { type: "error", message: "Not in a lobby" });
    return;
  }

  removeClientFromLobby(client);
  send(client.ws, { type: "lobby_left" });
}

function handleClientEvent(client: Client, payload: unknown): void {
  if (!client.lobbyId) {
    send(client.ws, { type: "error", message: "Not in a lobby" });
    return;
  }

  const lobby = getLobby(client.lobbyId);
  if (!lobby) {
    send(client.ws, { type: "error", message: "Lobby not found" });
    return;
  }

  // Only guests can send client_event to host
  if (client.id === lobby.hostId) {
    send(client.ws, { type: "error", message: "Host cannot send client_event" });
    return;
  }

  const host = getClient(lobby.hostId);
  if (host) {
    send(host.ws, { type: "client_event", clientId: client.id, payload });
  }
}

function handleHostEvent(
  client: Client,
  payload: unknown,
  targetClientId?: string
): void {
  if (!client.lobbyId) {
    send(client.ws, { type: "error", message: "Not in a lobby" });
    return;
  }

  const lobby = getLobby(client.lobbyId);
  if (!lobby) {
    send(client.ws, { type: "error", message: "Lobby not found" });
    return;
  }

  // Only host can send host_event
  if (client.id !== lobby.hostId) {
    send(client.ws, { type: "error", message: "Only host can send host_event" });
    return;
  }

  if (targetClientId) {
    // Send to specific guest
    if (!lobby.guestIds.has(targetClientId)) {
      send(client.ws, { type: "error", message: "Target client not in lobby" });
      return;
    }
    const targetClient = getClient(targetClientId);
    if (targetClient) {
      send(targetClient.ws, { type: "host_event", payload });
    }
  } else {
    // Broadcast to all guests
    for (const guestId of lobby.guestIds) {
      const guest = getClient(guestId);
      if (guest) {
        send(guest.ws, { type: "host_event", payload });
      }
    }
  }
}

// ============ Server Setup ============

const PORT = parseInt(process.env.PORT || "8080", 10);
const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws: WebSocket) => {
  const clientId = randomUUID();
  const client: Client = {
    id: clientId,
    ws,
    lobbyId: null,
  };

  clients.set(clientId, client);
  send(ws, { type: "connected", clientId });

  ws.on("message", (data: WebSocket.RawData) => {
    let message: IncomingMessage;
    try {
      message = JSON.parse(data.toString()) as IncomingMessage;
    } catch {
      send(ws, { type: "error", message: "Invalid JSON" });
      return;
    }

    switch (message.type) {
      case "create_lobby":
        handleCreateLobby(client);
        break;
      case "join_lobby":
        handleJoinLobby(client, message.lobbyId);
        break;
      case "leave_lobby":
        handleLeaveLobby(client);
        break;
      case "client_event":
        handleClientEvent(client, message.payload);
        break;
      case "host_event":
        handleHostEvent(client, message.payload, message.targetClientId);
        break;
      default: {
        const _exhaustiveCheck: never = message;
        send(ws, { type: "error", message: "Unknown message type" });
        return _exhaustiveCheck;
      }
    }
  });

  ws.on("close", () => {
    removeClientFromLobby(client);
    clients.delete(clientId);
  });

  ws.on("error", (error: Error) => {
    console.error(`Client ${clientId} error:`, error.message);
  });
});

console.log(`WebSocket relay server running on port ${PORT}`);
