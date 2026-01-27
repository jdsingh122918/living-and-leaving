"use client";

/**
 * Lexical Chat Input
 * Drop-in replacement for SlackStyleInput with the same API
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, EditorState, CLEAR_EDITOR_COMMAND } from "lexical";
import { Plus, Send, X, Reply, Type } from "lucide-react";

import { createEditorConfig } from "./config/initial-config";
import { ToolbarPlugin } from "./plugins/ToolbarPlugin";
import { CharacterCountPlugin, useCharacterCount } from "./plugins/CharacterCountPlugin";
import { KeyboardShortcutsPlugin } from "./plugins/KeyboardShortcutsPlugin";
import { SendOnEnterPlugin } from "./plugins/SendOnEnterPlugin";
import { EmojiPlugin } from "./plugins/EmojiPlugin";
import MarkdownShortcutsPlugin from "./plugins/MarkdownShortcutsPlugin";
import { AutoResizePlugin } from "./plugins/AutoResizePlugin";
import { serializeLexicalState, deserializeLexicalState } from "./utils/serialization";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useFileUpload, UploadedFile } from "@/hooks/use-file-upload";
import { MessageAttachmentPreview } from "@/components/chat/message-attachment-preview";
import { toast } from "sonner";

// Reply context interface
export interface ReplyContext {
  messageId: string;
  senderName: string;
  content: string;
}

export interface LexicalChatInputProps {
  content: string;
  onChange: (content: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  sending?: boolean;
  maxLength?: number;
  className?: string;
  // File attachment props
  attachments?: UploadedFile[];
  onAttachmentsChange?: (attachments: UploadedFile[]) => void;
  // Reply props
  replyTo?: ReplyContext | null;
  onCancelReply?: () => void;
}

// Inner component with editor context
function ChatInputInner({
  content,
  onChange,
  onSend,
  placeholder = "Type your message...",
  disabled = false,
  sending = false,
  maxLength = 2000,
  className,
  attachments = [],
  onAttachmentsChange,
  replyTo,
  onCancelReply,
}: LexicalChatInputProps) {
  const [editor] = useLexicalComposerContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitializedRef = useRef(false);

  // Mobile toolbar visibility state
  const [showMobileToolbar, setShowMobileToolbar] = useState(false);

  // Character count state
  const { count: characterCount, isNearLimit, isOverLimit } = useCharacterCount(maxLength);

  // File upload functionality
  const { uploads, uploadFiles, removeUpload, hasActiveUploads } = useFileUpload();

  // Initialize editor with content
  useEffect(() => {
    if (isInitializedRef.current) return;

    if (content) {
      const serializedState = deserializeLexicalState(content);
      if (serializedState) {
        const newState = editor.parseEditorState(serializedState);
        editor.setEditorState(newState);
      }
    }
    isInitializedRef.current = true;
  }, [editor, content]);

  // Focus editor when replying
  useEffect(() => {
    if (replyTo) {
      editor.focus();
    }
  }, [replyTo, editor]);

  // Handle editor changes
  const handleEditorChange = useCallback(
    (editorState: EditorState) => {
      const json = serializeLexicalState(editorState);
      onChange(json);
    },
    [onChange]
  );

  // Handle send
  const handleSend = useCallback(() => {
    // Check if editor has content
    const hasContent = editor.getEditorState().read(() => {
      const root = $getRoot();
      return root.getTextContent().trim().length > 0;
    });

    if (!hasContent && attachments.length === 0) return;
    if (disabled || sending || isOverLimit || hasActiveUploads) return;

    onSend();

    // Clear editor after send
    editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
  }, [editor, attachments.length, disabled, sending, isOverLimit, hasActiveUploads, onSend]);

  // Handle file upload
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0 || !onAttachmentsChange) return;

      try {
        const uploadResults = await uploadFiles(Array.from(files), {
          category: "chat-attachments",
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
    [attachments, onAttachmentsChange, uploadFiles]
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

  // Remove upload
  const handleRemoveUpload = useCallback(
    (file: File) => {
      removeUpload(file);
    },
    [removeUpload]
  );

  // Handle file click
  const handleFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Calculate if send button should be enabled
  const hasTextContent = editor.getEditorState().read(() => {
    const root = $getRoot();
    return root.getTextContent().trim().length > 0;
  });
  const canSend =
    (hasTextContent || attachments.length > 0) && !disabled && !sending && !isOverLimit && !hasActiveUploads;

  // Truncate reply content
  const truncateContent = (text: string, maxLen: number = 100) => {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + "...";
  };

  return (
    <Card className={cn("border-border/50 overflow-hidden", className)}>
      {/* Reply Preview */}
      {replyTo && (
        <div className="flex items-start gap-2 px-3 py-2 bg-muted/50 border-b border-border/50">
          <Reply className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground">
              Replying to <span className="font-medium text-foreground">{replyTo.senderName}</span>
            </div>
            <div className="text-sm text-muted-foreground truncate">{truncateContent(replyTo.content)}</div>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancelReply} className="h-6 w-6 p-0 shrink-0" title="Cancel reply">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Formatting Toolbar - Collapsible on mobile, always visible on desktop */}
      <div className={cn(
        "overflow-hidden transition-all duration-200",
        // Desktop: always visible
        "md:h-auto md:opacity-100",
        // Mobile: toggle visibility
        showMobileToolbar ? "h-auto opacity-100" : "h-0 opacity-0 md:h-auto md:opacity-100"
      )}>
        <ToolbarPlugin isVisible={true} />
      </div>

      {/* Main Input Area */}
      <div className="p-3">
        {/* Editor */}
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className={cn(
                  "outline-none min-h-[40px] max-h-[200px] text-sm leading-5",
                  "scrollbar-thin scrollbar-thumb-muted",
                  isOverLimit && "text-destructive",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                style={{
                  minHeight: "40px",
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
                aria-placeholder={placeholder}
                placeholder={
                  <div className="absolute top-0 left-0 text-muted-foreground pointer-events-none select-none text-sm">
                    {placeholder}
                  </div>
                }
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>

        {/* Character Counter (when near/over limit) */}
        {(isNearLimit || isOverLimit) && (
          <div className="flex justify-end mt-1">
            <span className={cn("text-xs", isOverLimit ? "text-destructive" : "text-muted-foreground")}>
              {characterCount}/{maxLength}
            </span>
          </div>
        )}

        {/* Attachment Preview */}
        <MessageAttachmentPreview
          attachments={attachments}
          uploads={uploads}
          onRemoveAttachment={handleRemoveAttachment}
          onRemoveUpload={handleRemoveUpload}
        />

        {/* Action Bar */}
        <div className="flex items-center justify-between mt-3 gap-2">
          {/* Left Actions */}
          <div className="flex items-center gap-1">
            {/* Mobile Formatting Toggle */}
            <Button
              variant={showMobileToolbar ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setShowMobileToolbar(!showMobileToolbar)}
              className="h-8 w-8 p-0 hover:bg-muted md:hidden"
              title={showMobileToolbar ? "Hide formatting" : "Show formatting"}
            >
              <Type className="h-4 w-4" />
            </Button>

            {/* Plus Button - File Upload */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFileClick}
              disabled={disabled}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <Plus className="h-4 w-4" />
            </Button>

            {/* Emoji Picker */}
            <div className="relative">
              <EmojiPlugin disabled={disabled} size="sm" />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Send Button */}
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!canSend}
              className={cn(
                "h-8 w-8 p-0 transition-all duration-200",
                canSend ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.csv,.zip,.rar,.7z,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.mov,.mp3,.wav"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Plugins */}
      <ClearEditorPlugin />
      <HistoryPlugin />
      <LinkPlugin />
      <ListPlugin />
      <OnChangePlugin onChange={handleEditorChange} ignoreSelectionChange />
      <KeyboardShortcutsPlugin disabled={disabled} />
      <MarkdownShortcutsPlugin disabled={disabled} />
      <AutoResizePlugin minHeight={40} maxHeight={200} />
      <SendOnEnterPlugin onSend={handleSend} sendOnEnter={true} disabled={disabled || sending} />
    </Card>
  );
}

// Main exported component
export function LexicalChatInput(props: LexicalChatInputProps) {
  const initialConfig = createEditorConfig({
    namespace: "ChatInput",
    editable: !props.disabled,
  });

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <ChatInputInner {...props} />
    </LexicalComposer>
  );
}

export default LexicalChatInput;
