import { randomBytes } from "crypto";

// Unambiguous uppercase letters (no I, O, 0 etc.)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const CODE_LENGTH = 4;

export function generateLobbyCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  return Array.from(bytes as Uint8Array)
    .map((b: number) => ALPHABET[b % ALPHABET.length])
    .join("");
}
