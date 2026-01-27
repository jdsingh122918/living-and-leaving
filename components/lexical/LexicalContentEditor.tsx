"use client";

/**
 * Lexical Content Editor
 * Drop-in replacement for EnhancedTextarea with the same API
 */

import { LexicalEditor, type LexicalEditorProps } from "./LexicalEditor";
import { UploadedFile } from "@/hooks/use-file-upload";

export interface LexicalContentEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
  // Feature toggles
  showToolbar?: boolean;
  enableEmojis?: boolean;
  enableAttachments?: boolean;
  // File attachment props
  attachments?: UploadedFile[];
  onAttachmentsChange?: (attachments: UploadedFile[]) => void;
  // Additional props for different contexts
  autoResize?: boolean;
  label?: string;
  description?: string;
  // Character counter behavior
  showCharacterCount?: "always" | "near-limit" | "never";
  // Form integration
  name?: string;
  "data-testid"?: string;
}

/**
 * LexicalContentEditor - A rich text editor for content creation
 * API-compatible with EnhancedTextarea for easy migration
 */
export function LexicalContentEditor({
  value,
  onChange,
  placeholder = "Write your content...",
  disabled = false,
  maxLength = 50000,
  minHeight = 120,
  maxHeight = 500,
  className,
  showToolbar = true,
  enableEmojis = true,
  enableAttachments = true,
  attachments = [],
  onAttachmentsChange,
  autoResize = true, // Note: Lexical handles this differently, but we keep the prop for compatibility
  label,
  description,
  showCharacterCount = "near-limit",
  name,
  "data-testid": dataTestId,
}: LexicalContentEditorProps) {
  return (
    <LexicalEditor
      value={value}
      onChange={onChange}
      variant="standard"
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      minHeight={minHeight}
      maxHeight={maxHeight}
      className={className}
      showToolbar={showToolbar}
      enableEmojis={enableEmojis}
      enableAttachments={enableAttachments}
      enableMarkdownShortcuts={true}
      attachments={attachments}
      onAttachmentsChange={onAttachmentsChange}
      showCharacterCount={showCharacterCount}
      label={label}
      description={description}
      name={name}
      data-testid={dataTestId}
    />
  );
}

export default LexicalContentEditor;
