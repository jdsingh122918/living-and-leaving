"use client";

/**
 * Lexical Auto Resize Plugin
 * Automatically adjusts the editor height based on content
 */

import { useEffect, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

export interface AutoResizePluginProps {
  minHeight?: number;
  maxHeight?: number;
  disabled?: boolean;
}

export function AutoResizePlugin({
  minHeight = 40,
  maxHeight = 500,
  disabled = false,
}: AutoResizePluginProps) {
  const [editor] = useLexicalComposerContext();
  const rootElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (disabled) return;

    // Get the root element
    const rootElement = editor.getRootElement();
    if (!rootElement) return;
    rootElementRef.current = rootElement;

    // Set initial styles
    rootElement.style.minHeight = `${minHeight}px`;
    rootElement.style.maxHeight = `${maxHeight}px`;
    rootElement.style.overflowY = "auto";

    // Function to resize
    const resize = () => {
      if (!rootElement) return;

      // Reset height to auto to get the natural height
      rootElement.style.height = "auto";

      // Get the scroll height (content height)
      const scrollHeight = rootElement.scrollHeight;

      // Clamp to min/max and set
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      rootElement.style.height = `${newHeight}px`;

      // Add overflow if content exceeds max height
      rootElement.style.overflowY = scrollHeight > maxHeight ? "auto" : "hidden";
    };

    // Initial resize
    resize();

    // Listen for editor updates
    const unregister = editor.registerUpdateListener(() => {
      resize();
    });

    return unregister;
  }, [editor, minHeight, maxHeight, disabled]);

  // This plugin doesn't render anything
  return null;
}

export default AutoResizePlugin;
