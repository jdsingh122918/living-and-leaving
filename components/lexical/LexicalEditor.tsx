"use client";

/**
 * Core Lexical Editor Component
 * Unified rich text editor that replaces EnhancedTextarea and SlackStyleInput
 */

import { useCallback, useEffect, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, EditorState } from "lexical";
import { Paperclip, X, Reply } from "lucide-react";

import { createEditorConfig } from "./config/initial-config";
import { ToolbarPlugin } from "./plugins/ToolbarPlugin";
import { CharacterCountPlugin } from "./plugins/CharacterCountPlugin";
import { KeyboardShortcutsPlugin } from "./plugins/KeyboardShortcutsPlugin";
import { SendOnEnterPlugin } from "./plugins/SendOnEnterPlugin";
import { EmojiPlugin } from "./plugins/EmojiPlugin";
import MarkdownShortcutsPlugin from "./plugins/MarkdownShortcutsPlugin";
import { AutoResizePlugin } from "./plugins/AutoResizePlugin";
import {
  serializeLexicalState,
  deserializeLexicalState,
  isLexicalContent,
  plainTextToLexical,
} from "./utils/serialization";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useFileUpload, UploadedFile } from "@/hooks/use-file-upload";
import { MessageAttachmentPreview } from "@/components/chat/message-attachment-preview";
import { toast } from "sonner";

// Reply context interface (same as SlackStyleInput)
export interface ReplyContext {
  messageId: string;
  senderName: string;
  content: string;
}

export interface LexicalEditorProps {
  // Content management
  value: string; // Lexical JSON string or empty
  onChange: (value: string) => void;

  // Mode variants
  variant?: "standard" | "chat";

  // Feature toggles
  showToolbar?: boolean;
  enableEmojis?: boolean;
  enableAttachments?: boolean;
  enableMarkdownShortcuts?: boolean;
  autoFocus?: boolean;

  // Chat-specific props
  onSend?: () => void;
  sendOnEnter?: boolean;
  replyTo?: ReplyContext | null;
  onCancelReply?: () => void;

  // Attachment handling
  attachments?: UploadedFile[];
  onAttachmentsChange?: (attachments: UploadedFile[]) => void;

  // Character limits
  maxLength?: number;
  showCharacterCount?: "always" | "near-limit" | "never";

  // Layout
  minHeight?: number;
  maxHeight?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;

  // Form integration
  name?: string;
  label?: string;
  description?: string;
  "data-testid"?: string;
}

// Inner component that has access to the editor context
function EditorInner({
  value,
  onChange,
  variant = "standard",
  showToolbar = true,
  enableEmojis = true,
  enableAttachments = true,
  enableMarkdownShortcuts = true,
  autoFocus = false,
  onSend,
  sendOnEnter = false,
  replyTo,
  onCancelReply,
  attachments = [],
  onAttachmentsChange,
  maxLength = 50000,
  showCharacterCount = "near-limit",
  minHeight = 120,
  maxHeight = 500,
  placeholder = "Write your content...",
  disabled = false,
  className,
  label,
  description,
  "data-testid": dataTestId,
}: Omit<LexicalEditorProps, "name">) {
  const [editor] = useLexicalComposerContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitializedRef = useRef(false);

  // File upload functionality
  const { uploads, uploadFiles, removeUpload, hasActiveUploads, fetchConfig, config } = useFileUpload();

  // Fetch upload config on mount if attachments enabled
  useEffect(() => {
    if (enableAttachments && !config) {
      fetchConfig();
    }
  }, [enableAttachments, config, fetchConfig]);

  // Initialize editor with value
  useEffect(() => {
    if (isInitializedRef.current) return;

    if (value) {
      const serializedState = deserializeLexicalState(value);
      if (serializedState) {
        const newState = editor.parseEditorState(serializedState);
        editor.setEditorState(newState);
      }
    }
    isInitializedRef.current = true;
  }, [editor, value]);

  // Handle editor changes
  const handleEditorChange = useCallback(
    (editorState: EditorState) => {
      const json = serializeLexicalState(editorState);
      onChange(json);
    },
    [onChange]
  );

  // Handle file upload
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0 || !onAttachmentsChange) return;

      try {
        const uploadResults = await uploadFiles(Array.from(files), {
          category: variant === "chat" ? "chat-attachments" : "documents",
        });

        if (uploadResults.successful.length > 0) {
          const newAttachments = [...attachments, ...uploadResults.successful];
          onAttachmentsChange(newAttachments);
          toast.success(`${uploadResults.successful.length} file(s) uploaded successfully`);
        }

        if (uploadResults.failed.length > 0) {
          console.error("Some files failed to upload:", uploadResults.failed);
          toast.error(`${uploadResults.failed.length} file(s) failed to upload`);
        }
      } catch (error) {
        console.error("File upload error:", error);
        toast.error("Failed to upload files. Please try again.");
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [attachments, onAttachmentsChange, uploadFiles, variant]
  );

  // Remove attachment
  const handleRemoveAttachment = useCallback(
    (fileId: string) => {
      if (!onAttachmentsChange) return;
      const newAttachments = attachments.filter((attachment) => attachment.fileId !== fileId);
      onAttachmentsChange(newAttachments);
    },
    [attachments, onAttachmentsChange]
  );

  // Remove upload (for files currently uploading)
  const handleRemoveUpload = useCallback(
    (file: File) => {
      removeUpload(file);
    },
    [removeUpload]
  );

  // Handle file upload click
  const handleFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Truncate reply content for preview
  const truncateContent = (text: string, maxLen: number = 100) => {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + "...";
  };

  // Adjust heights for chat mode
  const effectiveMinHeight = variant === "chat" ? 40 : minHeight;
  const effectiveMaxHeight = variant === "chat" ? 200 : maxHeight;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Label and description */}
      {(label || description) && (
        <div>
          {label && <label className="text-sm font-medium text-foreground mb-1 block">{label}</label>}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      )}

      {/* Editor Container */}
      <Card className="border-border/50 overflow-hidden">
        {/* Reply Preview (chat mode) */}
        {replyTo && (
          <div className="flex items-start gap-2 px-3 py-2 bg-muted/50 border-b border-border/50">
            <Reply className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground">
                Replying to <span className="font-medium text-foreground">{replyTo.senderName}</span>
              </div>
              <div className="text-sm text-muted-foreground truncate">{truncateContent(replyTo.content)}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelReply}
              className="h-6 w-6 p-0 shrink-0"
              title="Cancel reply"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Formatting Toolbar - Always visible when enabled */}
        {showToolbar && <ToolbarPlugin isVisible={true} />}

        {/* Main Content Area */}
        <div className={variant === "chat" ? "p-3" : "p-4"}>
          {/* Rich Text Editor */}
          <div className="relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className={cn(
                    "outline-none",
                    variant === "chat"
                      ? "min-h-[40px] max-h-[200px] text-sm leading-5"
                      : "min-h-[120px] text-sm leading-relaxed border-2 border-input bg-background p-3 rounded-md",
                    "scrollbar-thin scrollbar-thumb-muted",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                  style={{
                    minHeight: `${effectiveMinHeight}px`,
                    maxHeight: `${effectiveMaxHeight}px`,
                    overflowY: "auto",
                  }}
                  data-testid={dataTestId}
                  aria-placeholder={placeholder}
                  placeholder={
                    <div
                      className={cn(
                        "absolute top-0 left-0 text-muted-foreground pointer-events-none select-none",
                        variant === "chat" ? "text-sm" : "text-sm p-3"
                      )}
                    >
                      {placeholder}
                    </div>
                  }
                />
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>

          {/* Character Counter */}
          <CharacterCountPlugin
            maxLength={maxLength}
            showCount={showCharacterCount}
            className="mt-2"
          />

          {/* Attachment Preview */}
          {enableAttachments && (
            <MessageAttachmentPreview
              attachments={attachments}
              uploads={uploads}
              onRemoveAttachment={handleRemoveAttachment}
              onRemoveUpload={handleRemoveUpload}
            />
          )}

          {/* Action Bar */}
          {(enableEmojis || enableAttachments) && (
            <div className="flex items-center justify-between mt-3 gap-2">
              {/* Left Actions */}
              <div className="flex items-center gap-1">
                {/* File Upload */}
                {enableAttachments && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleFileClick}
                    disabled={disabled || !config}
                    className="h-8 w-8 p-0 hover:bg-muted"
                    title={!config ? "Loading upload configuration..." : "Attach files"}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                )}

                {/* Emoji Picker */}
                {enableEmojis && (
                  <div className="relative">
                    <EmojiPlugin disabled={disabled} size="sm" />
                  </div>
                )}
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-2">
                {/* Upload Status */}
                {hasActiveUploads && (
                  <span className="text-xs text-blue-600 dark:text-blue-400">Uploading...</span>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Hidden File Input */}
      {enableAttachments && (
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={config?.allowedMimeTypes.join(",") || "*/*"}
          className="hidden"
          onChange={handleFileSelect}
        />
      )}

      {/* Plugins that don't render UI */}
      <HistoryPlugin />
      <LinkPlugin />
      <ListPlugin />
      <OnChangePlugin onChange={handleEditorChange} ignoreSelectionChange />
      <KeyboardShortcutsPlugin disabled={disabled} />
      {enableMarkdownShortcuts && <MarkdownShortcutsPlugin disabled={disabled} />}
      <AutoResizePlugin minHeight={effectiveMinHeight} maxHeight={effectiveMaxHeight} />
      {variant === "chat" && sendOnEnter && <SendOnEnterPlugin onSend={onSend} sendOnEnter={sendOnEnter} />}
      {autoFocus && <AutoFocusPlugin />}
    </div>
  );
}

// Main exported component with LexicalComposer wrapper
export function LexicalEditor(props: LexicalEditorProps) {
  const { name, disabled, ...innerProps } = props;

  const initialConfig = createEditorConfig({
    namespace: name || "LexicalEditor",
    editable: !disabled,
  });

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <EditorInner {...innerProps} disabled={disabled} />
    </LexicalComposer>
  );
}

export default LexicalEditor;
