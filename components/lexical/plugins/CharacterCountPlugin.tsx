"use client";

/**
 * Lexical Character Count Plugin
 * Tracks character count and enforces limits
 */

import { useEffect, useState, useCallback } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import { cn } from "@/lib/utils";

export interface CharacterCountPluginProps {
  maxLength?: number;
  showCount?: "always" | "near-limit" | "never";
  nearLimitThreshold?: number; // Percentage (0-1), default 0.9
  onCountChange?: (count: number, isNearLimit: boolean, isOverLimit: boolean) => void;
  className?: string;
}

export interface CharacterCountState {
  count: number;
  isNearLimit: boolean;
  isOverLimit: boolean;
}

export function CharacterCountPlugin({
  maxLength = 50000,
  showCount = "near-limit",
  nearLimitThreshold = 0.9,
  onCountChange,
  className,
}: CharacterCountPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [characterCount, setCharacterCount] = useState(0);

  const isNearLimit = characterCount >= maxLength * nearLimitThreshold;
  const isOverLimit = characterCount > maxLength;

  // Update character count when editor state changes
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const text = root.getTextContent();
        const count = text.length;
        setCharacterCount(count);
      });
    });
  }, [editor]);

  // Notify parent of count changes
  useEffect(() => {
    onCountChange?.(characterCount, isNearLimit, isOverLimit);
  }, [characterCount, isNearLimit, isOverLimit, onCountChange]);

  // Determine if counter should be visible
  const shouldShowCounter =
    showCount === "always" ||
    (showCount === "near-limit" && (isNearLimit || isOverLimit));

  if (!shouldShowCounter) {
    return null;
  }

  return (
    <div className={cn("flex justify-end", className)}>
      <span
        className={cn(
          "text-xs transition-colors",
          isOverLimit
            ? "text-destructive font-medium"
            : isNearLimit
            ? "text-yellow-600 dark:text-yellow-500"
            : "text-muted-foreground"
        )}
      >
        {characterCount.toLocaleString()}/{maxLength.toLocaleString()}
      </span>
    </div>
  );
}

/**
 * Hook to get character count state without rendering the component
 */
export function useCharacterCount(maxLength: number = 50000, nearLimitThreshold: number = 0.9): CharacterCountState {
  const [editor] = useLexicalComposerContext();
  const [count, setCount] = useState(0);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const text = root.getTextContent();
        setCount(text.length);
      });
    });
  }, [editor]);

  return {
    count,
    isNearLimit: count >= maxLength * nearLimitThreshold,
    isOverLimit: count > maxLength,
  };
}

export default CharacterCountPlugin;
