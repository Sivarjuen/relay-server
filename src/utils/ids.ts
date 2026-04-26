import { randomUUID } from "crypto";

export function generateConnectionId(): string {
  return randomUUID();
}
