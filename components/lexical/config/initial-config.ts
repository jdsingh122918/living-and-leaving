/**
 * Lexical Editor Initial Configuration
 * Factory function to create editor config with proper settings
 */

import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import { lexicalTheme } from "./theme";
import { editorNodes } from "./nodes";

export interface EditorConfigOptions {
  namespace?: string;
  editable?: boolean;
  onError?: (error: Error) => void;
}

/**
 * Creates the initial configuration for the Lexical editor
 */
export function createEditorConfig(options: EditorConfigOptions = {}): InitialConfigType {
  const {
    namespace = "FireflyEditor",
    editable = true,
    onError = (error: Error) => {
      console.error("[Lexical Error]:", error);
    },
  } = options;

  return {
    namespace,
    theme: lexicalTheme,
    nodes: editorNodes,
    editable,
    onError,
  };
}

/**
 * Default editor configuration
 */
export const defaultEditorConfig = createEditorConfig();

export default createEditorConfig;
