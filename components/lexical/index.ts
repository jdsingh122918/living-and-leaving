/**
 * Lexical Editor Components - Public API
 *
 * This module exports all Lexical-based editor components and utilities.
 */

// Main editor components
export { LexicalEditor, type LexicalEditorProps, type ReplyContext } from "./LexicalEditor";
export { LexicalContentEditor, type LexicalContentEditorProps } from "./LexicalContentEditor";
export {
  LexicalChatInput,
  type LexicalChatInputProps,
  type ReplyContext as ChatReplyContext,
} from "./LexicalChatInput";

// Configuration
export { lexicalTheme } from "./config/theme";
export { editorNodes } from "./config/nodes";
export { createEditorConfig, defaultEditorConfig } from "./config/initial-config";

// Plugins
export { ToolbarPlugin, type ToolbarPluginProps } from "./plugins/ToolbarPlugin";
export {
  CharacterCountPlugin,
  useCharacterCount,
  type CharacterCountPluginProps,
  type CharacterCountState,
} from "./plugins/CharacterCountPlugin";
export { KeyboardShortcutsPlugin, type KeyboardShortcutsPluginProps } from "./plugins/KeyboardShortcutsPlugin";
export { SendOnEnterPlugin, type SendOnEnterPluginProps } from "./plugins/SendOnEnterPlugin";
export { EmojiPlugin, useEmojiInsertion, type EmojiPluginProps } from "./plugins/EmojiPlugin";
export {
  default as MarkdownShortcutsPlugin,
  DEFAULT_TRANSFORMERS,
  TRANSFORMERS,
  type MarkdownShortcutsPluginProps,
} from "./plugins/MarkdownShortcutsPlugin";
export { AutoResizePlugin, type AutoResizePluginProps } from "./plugins/AutoResizePlugin";
export { PreviewPlugin, type PreviewPluginProps } from "./plugins/PreviewPlugin";

// Utilities
export {
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
} from "./utils/serialization";
