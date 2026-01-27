"use client";

/**
 * Lexical Send On Enter Plugin
 * Handles Enter key to send message (chat mode)
 * Shift+Enter creates a new line
 */

import { useEffect, useCallback } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  KEY_DOWN_COMMAND,
  COMMAND_PRIORITY_HIGH,
  $getRoot,
} from "lexical";

export interface SendOnEnterPluginProps {
  onSend?: () => void;
  disabled?: boolean;
  /** If true, Enter sends (Shift+Enter for newline). If false, Enter creates newline. */
  sendOnEnter?: boolean;
}

export function SendOnEnterPlugin({
  onSend,
  disabled = false,
  sendOnEnter = true,
}: SendOnEnterPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (disabled || !sendOnEnter || !onSend) return;

    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        // Only handle Enter key
        if (event.key !== "Enter") return false;

        // Shift+Enter creates a new line (let default behavior happen)
        if (event.shiftKey) return false;

        // Prevent default Enter behavior (new line)
        event.preventDefault();

        // Check if editor has content
        const hasContent = editor.getEditorState().read(() => {
          const root = $getRoot();
          const text = root.getTextContent().trim();
          return text.length > 0;
        });

        // Only send if there's content
        if (hasContent) {
          onSend();
        }

        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, disabled, sendOnEnter, onSend]);

  // This plugin doesn't render anything
  return null;
}

export default SendOnEnterPlugin;
