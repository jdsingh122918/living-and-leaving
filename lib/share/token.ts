import { randomBytes } from "crypto";

// Base62 alphabet — URL-safe, no ambiguous characters, fits QR efficiently.
const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const TOKEN_LENGTH = 22; // ~130 bits entropy — collision-safe for lifetime of platform

export function generateShareToken(): string {
  const bytes = randomBytes(TOKEN_LENGTH);
  let out = "";
  for (let i = 0; i < TOKEN_LENGTH; i++) {
    out += BASE62[bytes[i] % 62];
  }
  return out;
}

export function isValidShareTokenFormat(token: string): boolean {
  if (typeof token !== "string") return false;
  if (token.length !== TOKEN_LENGTH) return false;
  for (const c of token) {
    if (!BASE62.includes(c)) return false;
  }
  return true;
}
