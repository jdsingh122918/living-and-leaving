"use client";

/**
 * Lexical Preview Plugin
 * Shows a rendered preview of the editor content
 */

import { useState, useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import { sanitizeForChat } from "@/lib/utils/sanitize";
import { cn } from "@/lib/utils";

export interface PreviewPluginProps {
  isVisible?: boolean;
  className?: string;
}

export function PreviewPlugin({ isVisible = false, className }: PreviewPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [htmlContent, setHtmlContent] = useState("");
  const [hasContent, setHasContent] = useState(false);

  // Update preview content when editor changes
  useEffect(() => {
    if (!isVisible) return;

    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const textContent = root.getTextContent().trim();
        setHasContent(textContent.length > 0);

        if (textContent.length > 0) {
          const html = $generateHtmlFromNodes(editor);
          setHtmlContent(html);
        } else {
          setHtmlContent("");
        }
      });
    });
  }, [editor, isVisible]);

  if (!isVisible || !hasContent) {
    return null;
  }

  return (
    <div className={cn("mt-3 p-3 border rounded-md bg-muted/30", className)}>
      <div className="text-xs text-muted-foreground mb-2 font-medium">Preview</div>
      <div
        className="prose prose-sm dark:prose-invert max-w-none text-foreground"
        dangerouslySetInnerHTML={{ __html: sanitizeForChat(htmlContent) }}
      />
    </div>
  );
}

export default PreviewPlugin;
