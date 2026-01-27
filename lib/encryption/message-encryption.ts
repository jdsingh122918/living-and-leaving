/**
 * Message Encryption Service
 * AES-256-GCM encryption for HIPAA-compliant message storage
 *
 * Format: base64(IV (12 bytes) + AuthTag (16 bytes) + Ciphertext)
 *
 * IMPORTANT: Encrypted content cannot be searched at the database level.
 * Full-text search would require additional indexing solutions.
 */

import crypto from "crypto";

// Environment variable for encryption key (32 bytes = 256 bits)
const ENCRYPTION_KEY_ENV = "MESSAGE_ENCRYPTION_KEY";

// Constants for AES-256-GCM
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Recommended for GCM
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

// Encryption metadata marker stored in message.metadata
export const ENCRYPTION_METADATA_KEY = "isEncrypted";

/**
 * Get the encryption key from environment
 * Key should be a 32-byte value encoded as base64
 *
 * @throws Error if key is not configured or invalid length
 */
function getEncryptionKey(): Buffer {
  const keyBase64 = process.env[ENCRYPTION_KEY_ENV];

  if (!keyBase64) {
    throw new Error(
      `Encryption key not configured. Set ${ENCRYPTION_KEY_ENV} environment variable.`
    );
  }

  const key = Buffer.from(keyBase64, "base64");

  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `Invalid encryption key length. Expected ${KEY_LENGTH} bytes, got ${key.length} bytes. ` +
      `Generate a new key with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
    );
  }

  return key;
}

/**
 * Check if encryption is enabled (key is configured)
 */
export function isEncryptionEnabled(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}

/**
 * Encrypt a message content string
 *
 * @param plaintext - The message content to encrypt
 * @returns Base64-encoded encrypted data (IV + AuthTag + Ciphertext)
 */
export function encryptMessage(plaintext: string): string {
  if (!plaintext) return plaintext;

  const key = getEncryptionKey();

  // Generate random IV
  const iv = crypto.randomBytes(IV_LENGTH);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  // Get auth tag
  const authTag = cipher.getAuthTag();

  // Combine IV + AuthTag + Ciphertext
  const combined = Buffer.concat([iv, authTag, encrypted]);

  return combined.toString("base64");
}

/**
 * Decrypt an encrypted message content string
 *
 * @param ciphertext - Base64-encoded encrypted data
 * @returns Decrypted plaintext message
 */
export function decryptMessage(ciphertext: string): string {
  if (!ciphertext) return ciphertext;

  const key = getEncryptionKey();

  // Decode from base64
  const combined = Buffer.from(ciphertext, "base64");

  // Extract components
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  // Decrypt
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Safely decrypt a message, returning original content if decryption fails
 * or if encryption is not enabled
 *
 * @param content - Potentially encrypted message content
 * @param isEncrypted - Whether the message is marked as encrypted
 * @returns Decrypted content or original content
 */
export function safeDecryptMessage(
  content: string,
  isEncrypted: boolean = false
): string {
  if (!content || !isEncrypted) {
    return content;
  }

  if (!isEncryptionEnabled()) {
    console.warn(
      "Message marked as encrypted but encryption key not available"
    );
    return "[Encrypted message - key not available]";
  }

  try {
    return decryptMessage(content);
  } catch (error) {
    console.error("Failed to decrypt message:", error);
    return "[Decryption failed]";
  }
}

/**
 * Encrypt content if encryption is enabled, otherwise return as-is
 *
 * @param content - Message content to potentially encrypt
 * @returns Object with content (possibly encrypted) and encryption status
 */
export function maybeEncryptMessage(content: string): {
  content: string;
  isEncrypted: boolean;
} {
  if (!content || !isEncryptionEnabled()) {
    return { content, isEncrypted: false };
  }

  try {
    return {
      content: encryptMessage(content),
      isEncrypted: true,
    };
  } catch (error) {
    console.error("Failed to encrypt message:", error);
    // Fall back to unencrypted if encryption fails
    return { content, isEncrypted: false };
  }
}

/**
 * Generate a new encryption key
 * Run this once to generate a key for your environment
 *
 * @returns Base64-encoded 32-byte key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString("base64");
}

/**
 * Verify encryption key is valid and working
 *
 * @returns true if encryption roundtrip succeeds
 */
export function verifyEncryptionKey(): boolean {
  try {
    const testMessage = "Encryption verification test";
    const encrypted = encryptMessage(testMessage);
    const decrypted = decryptMessage(encrypted);
    return decrypted === testMessage;
  } catch (error) {
    console.error("Encryption key verification failed:", error);
    return false;
  }
}
