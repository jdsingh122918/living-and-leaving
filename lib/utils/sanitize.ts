/**
 * Centralized HTML sanitization utility using DOMPurify
 * Critical for preventing XSS attacks in user-generated content
 */

import DOMPurify from "dompurify";

// Configure allowed tags for chat messages and rich content
const CHAT_ALLOWED_TAGS = [
  // Text formatting
  "p", "br", "span", "div",
  "b", "i", "em", "strong", "u", "s", "del", "mark",
  // Code
  "code", "pre",
  // Structure
  "blockquote", "ul", "ol", "li",
  // Headers (limited for chat)
  "h1", "h2", "h3", "h4", "h5", "h6",
  // Links
  "a",
];

const CHAT_ALLOWED_ATTR = [
  "href", "rel", "target", "class", "style",
];

// Stricter config for inline content (e.g., previews, notifications)
const INLINE_ALLOWED_TAGS = [
  "b", "i", "em", "strong", "u", "s", "del", "code", "a", "span",
];

const INLINE_ALLOWED_ATTR = ["href", "rel", "target", "class"];

// SSR-safe check for window
const isBrowser = typeof window !== "undefined";

/**
 * Initialize DOMPurify hooks for additional security
 * Only runs in browser environment
 */
function initializeDOMPurify(): typeof DOMPurify | null {
  if (!isBrowser) {
    return null;
  }

  // Add hook to enforce rel="noopener noreferrer" on links
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A") {
      node.setAttribute("rel", "noopener noreferrer");
      // Optionally force target="_blank" for external links
      const href = node.getAttribute("href");
      if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
        node.setAttribute("target", "_blank");
      }
    }
  });

  return DOMPurify;
}

// Initialize once
const purifier = initializeDOMPurify();

/**
 * Sanitize HTML content for safe display in chat messages
 * Uses DOMPurify with configured allowlist
 *
 * @param html - Raw HTML string to sanitize
 * @returns Sanitized HTML safe for dangerouslySetInnerHTML
 */
export function sanitizeForChat(html: string): string {
  if (!html) return "";

  // SSR fallback: strip all HTML tags (safe but loses formatting)
  if (!purifier) {
    return html.replace(/<[^>]*>/g, "");
  }

  return purifier.sanitize(html, {
    ALLOWED_TAGS: CHAT_ALLOWED_TAGS,
    ALLOWED_ATTR: CHAT_ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    // Prevent javascript: URLs
    ALLOW_UNKNOWN_PROTOCOLS: false,
  });
}

/**
 * Sanitize HTML for inline display (previews, notifications)
 * More restrictive than chat sanitization
 *
 * @param html - Raw HTML string to sanitize
 * @returns Sanitized HTML with limited formatting
 */
export function sanitizeForInline(html: string): string {
  if (!html) return "";

  // SSR fallback
  if (!purifier) {
    return html.replace(/<[^>]*>/g, "");
  }

  return purifier.sanitize(html, {
    ALLOWED_TAGS: INLINE_ALLOWED_TAGS,
    ALLOWED_ATTR: INLINE_ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
  });
}

/**
 * Strip all HTML tags and return plain text
 * Safe for any context
 *
 * @param html - HTML string to strip
 * @returns Plain text with no HTML
 */
export function stripAllHtml(html: string): string {
  if (!html) return "";

  // Use DOMPurify with empty allowlist if available
  if (purifier) {
    return purifier.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  }

  // SSR fallback
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * Escape HTML entities to prevent XSS when not using DOMPurify
 * Use this for text that will be inserted into HTML context
 *
 * @param text - Text to escape
 * @returns HTML-escaped text
 */
export function escapeHtml(text: string): string {
  if (!text) return "";

  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "`": "&#96;",
  };

  return text.replace(/[&<>"'`]/g, (char) => htmlEntities[char]);
}

/**
 * Sanitize user input for storage
 * Escapes HTML but preserves the original characters for display
 *
 * @param input - User input text
 * @returns Escaped text safe for storage and display
 */
export function sanitizeUserInput(input: string): string {
  if (!input) return "";

  // Trim whitespace and normalize
  let sanitized = input.trim();

  // Remove null bytes and other control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  return sanitized;
}

/**
 * Check if content contains potentially dangerous HTML
 * Useful for logging/monitoring without blocking
 *
 * @param content - Content to check
 * @returns true if potentially dangerous content detected
 */
export function containsSuspiciousHtml(content: string): boolean {
  if (!content) return false;

  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick, onerror, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<form/i,
    /data:/i,
    /vbscript:/i,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(content));
}
