"use client";

/**
 * Lexical Emoji Plugin
 * Integrates with the existing EmojiPicker component to insert emojis
 */

import { useCallback } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $createTextNode,
} from "lexical";
import { EmojiPicker } from "@/components/chat/emoji-picker";

export interface EmojiPluginProps {
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function EmojiPlugin({ disabled = false, size = "sm" }: EmojiPluginProps) {
  const [editor] = useLexicalComposerContext();

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertNodes([$createTextNode(emoji)]);
        }
      });
      // Focus editor after insertion
      editor.focus();
    },
    [editor]
  );

  return (
    <EmojiPicker
      onEmojiSelect={handleEmojiSelect}
      disabled={disabled}
      size={size}
    />
  );
}

/**
 * Hook to insert emoji into the editor
 * Use this when you want to control emoji insertion from outside the plugin
 */
export function useEmojiInsertion() {
  const [editor] = useLexicalComposerContext();

  const insertEmoji = useCallback(
    (emoji: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertNodes([$createTextNode(emoji)]);
        }
      });
      editor.focus();
    },
    [editor]
  );

  return { insertEmoji };
}

export default EmojiPlugin;
