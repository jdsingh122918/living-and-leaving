"use client";

/**
 * Lexical Markdown Shortcuts Plugin
 * Enables markdown-style shortcuts while typing:
 * - **text** -> bold
 * - *text* -> italic
 * - ~~text~~ -> strikethrough
 * - `code` -> inline code
 * - > quote -> blockquote
 * - - item -> bullet list
 * - 1. item -> numbered list
 */

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import {
  TRANSFORMERS,
  ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
} from "@lexical/markdown";
import type { Transformer } from "@lexical/markdown";

export interface MarkdownShortcutsPluginProps {
  /** Use all transformers (default) or specify which ones */
  transformers?: Transformer[];
  disabled?: boolean;
}

/**
 * Default transformers that match our existing markdown support:
 * - Bold: **text** or __text__
 * - Italic: *text* or _text_
 * - Strikethrough: ~~text~~
 * - Inline Code: `code`
 * - Code Block: ```code```
 * - Quote: > text
 * - Bullet List: - text
 * - Numbered List: 1. text
 * - Links: [text](url)
 */
export const DEFAULT_TRANSFORMERS: Transformer[] = TRANSFORMERS;

export function MarkdownShortcutsPluginWrapper({
  transformers = DEFAULT_TRANSFORMERS,
  disabled = false,
}: MarkdownShortcutsPluginProps) {
  if (disabled) {
    return null;
  }

  return <MarkdownShortcutPlugin transformers={transformers} />;
}

export { TRANSFORMERS, ELEMENT_TRANSFORMERS, TEXT_FORMAT_TRANSFORMERS, TEXT_MATCH_TRANSFORMERS };
export default MarkdownShortcutsPluginWrapper;
