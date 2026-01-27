/**
 * Lexical Serialization Utilities
 * Functions for converting between Lexical state, JSON, HTML, and plain text
 */

import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { $convertToMarkdownString, $convertFromMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { createEditor, $getRoot, $createParagraphNode, $createTextNode } from "lexical";
import type { LexicalEditor, EditorState, SerializedEditorState } from "lexical";
import { editorNodes } from "../config/nodes";
import { lexicalTheme } from "../config/theme";

/**
 * Create a headless Lexical editor for serialization operations
 */
function createHeadlessEditor(): LexicalEditor {
  return createEditor({
    namespace: "Serialization",
    nodes: editorNodes,
    theme: lexicalTheme,
    onError: (error) => console.error("[Serialization Error]:", error),
  });
}

/**
 * Serialize Lexical EditorState to JSON string
 */
export function serializeLexicalState(editorState: EditorState): string {
  return JSON.stringify(editorState.toJSON());
}

/**
 * Parse JSON string to SerializedEditorState
 */
export function deserializeLexicalState(jsonString: string): SerializedEditorState | null {
  if (!jsonString || typeof jsonString !== "string") return null;

  try {
    const parsed = JSON.parse(jsonString);
    // Validate it's a Lexical state (has root property)
    if (parsed && typeof parsed === "object" && parsed.root) {
      return parsed as SerializedEditorState;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if a string is valid Lexical JSON content
 */
export function isLexicalContent(content: string): boolean {
  if (!content || typeof content !== "string") return false;

  try {
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === "object" && parsed.root !== undefined;
  } catch {
    return false;
  }
}

/**
 * Convert Lexical JSON to HTML string
 */
export function lexicalToHtml(jsonString: string): string {
  const serializedState = deserializeLexicalState(jsonString);
  if (!serializedState) return "";

  const editor = createHeadlessEditor();
  let html = "";

  try {
    const editorState = editor.parseEditorState(serializedState);
    editorState.read(() => {
      html = $generateHtmlFromNodes(editor);
    });
  } catch (error) {
    console.error("[lexicalToHtml Error]:", error);
  }

  return html;
}

/**
 * Convert Lexical JSON to Markdown string
 */
export function lexicalToMarkdown(jsonString: string): string {
  const serializedState = deserializeLexicalState(jsonString);
  if (!serializedState) return "";

  const editor = createHeadlessEditor();
  let markdown = "";

  try {
    const editorState = editor.parseEditorState(serializedState);
    editorState.read(() => {
      markdown = $convertToMarkdownString(TRANSFORMERS);
    });
  } catch (error) {
    console.error("[lexicalToMarkdown Error]:", error);
  }

  return markdown;
}

/**
 * Convert Lexical JSON to plain text (strip all formatting)
 */
export function lexicalToPlainText(jsonString: string): string {
  const serializedState = deserializeLexicalState(jsonString);
  if (!serializedState) return "";

  const editor = createHeadlessEditor();
  let plainText = "";

  try {
    const editorState = editor.parseEditorState(serializedState);
    editorState.read(() => {
      plainText = $getRoot().getTextContent();
    });
  } catch (error) {
    console.error("[lexicalToPlainText Error]:", error);
  }

  return plainText;
}

/**
 * Get character count from Lexical JSON
 */
export function getLexicalCharacterCount(jsonString: string): number {
  const plainText = lexicalToPlainText(jsonString);
  return plainText.length;
}

/**
 * Create empty Lexical state JSON
 */
export function createEmptyLexicalState(): string {
  const editor = createHeadlessEditor();
  let emptyState = "";

  editor.update(() => {
    const root = $getRoot();
    root.clear();
    const paragraph = $createParagraphNode();
    root.append(paragraph);
  });

  // Get the state synchronously
  const editorState = editor.getEditorState();
  emptyState = serializeLexicalState(editorState);

  return emptyState;
}

/**
 * Convert plain text to Lexical JSON
 */
export function plainTextToLexical(text: string): string {
  const editor = createHeadlessEditor();

  editor.update(() => {
    const root = $getRoot();
    root.clear();

    // Split by newlines and create paragraphs
    const lines = text.split("\n");
    lines.forEach((line) => {
      const paragraph = $createParagraphNode();
      if (line) {
        paragraph.append($createTextNode(line));
      }
      root.append(paragraph);
    });
  });

  const editorState = editor.getEditorState();
  return serializeLexicalState(editorState);
}

/**
 * Convert Markdown to Lexical JSON
 */
export function markdownToLexical(markdown: string): string {
  const editor = createHeadlessEditor();

  editor.update(() => {
    $convertFromMarkdownString(markdown, TRANSFORMERS);
  });

  const editorState = editor.getEditorState();
  return serializeLexicalState(editorState);
}

/**
 * Convert HTML to Lexical JSON
 */
export function htmlToLexical(html: string): string {
  if (!html) return createEmptyLexicalState();

  const editor = createHeadlessEditor();

  editor.update(() => {
    const parser = new DOMParser();
    const dom = parser.parseFromString(html, "text/html");
    const nodes = $generateNodesFromDOM(editor, dom);

    const root = $getRoot();
    root.clear();
    nodes.forEach((node) => root.append(node));
  });

  const editorState = editor.getEditorState();
  return serializeLexicalState(editorState);
}

/**
 * Get preview text from Lexical JSON (truncated plain text)
 */
export function getLexicalPreview(jsonString: string, maxLength: number = 100): string {
  const plainText = lexicalToPlainText(jsonString);

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return plainText.slice(0, maxLength).trim() + "...";
}

export default {
  serializeLexicalState,
  deserializeLexicalState,
  isLexicalContent,
  lexicalToHtml,
  lexicalToMarkdown,
  lexicalToPlainText,
  getLexicalCharacterCount,
  createEmptyLexicalState,
  plainTextToLexical,
  markdownToLexical,
  htmlToLexical,
  getLexicalPreview,
};
