"use client";

/**
 * Lexical Keyboard Shortcuts Plugin
 * Handles keyboard shortcuts for formatting (Cmd+B, Cmd+I, etc.)
 */

import { useEffect, useCallback } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  FORMAT_TEXT_COMMAND,
  KEY_DOWN_COMMAND,
  COMMAND_PRIORITY_HIGH,
  $getSelection,
  $isRangeSelection,
} from "lexical";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";

export interface KeyboardShortcutsPluginProps {
  disabled?: boolean;
}

export function KeyboardShortcutsPlugin({ disabled = false }: KeyboardShortcutsPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (disabled) return;

    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
        const ctrlKey = isMac ? event.metaKey : event.ctrlKey;

        if (!ctrlKey) return false;

        // Prevent default for our shortcuts
        const key = event.key.toLowerCase();

        // Bold: Cmd/Ctrl + B
        if (key === "b" && !event.shiftKey && !event.altKey) {
          event.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
          return true;
        }

        // Italic: Cmd/Ctrl + I
        if (key === "i" && !event.shiftKey && !event.altKey) {
          event.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
          return true;
        }

        // Underline: Cmd/Ctrl + U
        if (key === "u" && !event.shiftKey && !event.altKey) {
          event.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
          return true;
        }

        // Strikethrough: Cmd/Ctrl + Shift + X
        if (key === "x" && event.shiftKey && !event.altKey) {
          event.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
          return true;
        }

        // Inline Code: Cmd/Ctrl + `
        if (key === "`" && !event.shiftKey && !event.altKey) {
          event.preventDefault();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code");
          return true;
        }

        // Link: Cmd/Ctrl + K
        if (key === "k" && !event.shiftKey && !event.altKey) {
          event.preventDefault();
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const url = prompt("Enter URL:");
            if (url) {
              editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
            }
          }
          return true;
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, disabled]);

  // This plugin doesn't render anything
  return null;
}

export default KeyboardShortcutsPlugin;
