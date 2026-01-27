"use client";

/**
 * Lexical Toolbar Plugin
 * Provides formatting toolbar with bold, italic, underline, strikethrough, code, links, lists, quotes
 */

import { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  SELECTION_CHANGE_COMMAND,
  TextFormatType,
} from "lexical";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from "@lexical/list";
import { $isHeadingNode } from "@lexical/rich-text";
import { $getNearestNodeOfType } from "@lexical/utils";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface ToolbarPluginProps {
  isVisible?: boolean;
  className?: string;
}

interface FormatState {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  isCode: boolean;
  isLink: boolean;
  isBulletList: boolean;
  isNumberedList: boolean;
  isQuote: boolean;
}

const initialFormatState: FormatState = {
  isBold: false,
  isItalic: false,
  isUnderline: false,
  isStrikethrough: false,
  isCode: false,
  isLink: false,
  isBulletList: false,
  isNumberedList: false,
  isQuote: false,
};

export function ToolbarPlugin({ isVisible = true, className }: ToolbarPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [formatState, setFormatState] = useState<FormatState>(initialFormatState);

  // Update format state based on selection
  const updateFormatState = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return;
    }

    // Text formats
    const isBold = selection.hasFormat("bold");
    const isItalic = selection.hasFormat("italic");
    const isUnderline = selection.hasFormat("underline");
    const isStrikethrough = selection.hasFormat("strikethrough");
    const isCode = selection.hasFormat("code");

    // Check for link
    const node = selection.anchor.getNode();
    const parent = node.getParent();
    const isLink = $isLinkNode(parent) || $isLinkNode(node);

    // Check for list
    const anchorNode = selection.anchor.getNode();
    const element =
      anchorNode.getKey() === "root"
        ? anchorNode
        : anchorNode.getTopLevelElementOrThrow();

    const elementKey = element.getKey();
    const elementDOM = editor.getElementByKey(elementKey);

    let isBulletList = false;
    let isNumberedList = false;

    if (elementDOM !== null) {
      const listNode = $getNearestNodeOfType(anchorNode, ListNode);
      if ($isListNode(listNode)) {
        isBulletList = listNode.getListType() === "bullet";
        isNumberedList = listNode.getListType() === "number";
      }
    }

    // Check for quote - QuoteNode doesn't have a direct check, so we check element type
    const isQuote = element.getType() === "quote";

    setFormatState({
      isBold,
      isItalic,
      isUnderline,
      isStrikethrough,
      isCode,
      isLink,
      isBulletList,
      isNumberedList,
      isQuote,
    });
  }, [editor]);

  // Listen for selection changes
  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateFormatState();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor, updateFormatState]);

  // Also update on editor state changes
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateFormatState();
      });
    });
  }, [editor, updateFormatState]);

  // Format handlers
  const handleFormat = useCallback(
    (format: TextFormatType) => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    },
    [editor]
  );

  const handleLink = useCallback(() => {
    if (formatState.isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    } else {
      const url = prompt("Enter URL:");
      if (url) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
      }
    }
  }, [editor, formatState.isLink]);

  const handleBulletList = useCallback(() => {
    if (formatState.isBulletList) {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    }
  }, [editor, formatState.isBulletList]);

  const handleNumberedList = useCallback(() => {
    if (formatState.isNumberedList) {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  }, [editor, formatState.isNumberedList]);

  if (!isVisible) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "flex items-center gap-0.5 p-2 border-b border-border/50 bg-muted/30 flex-wrap",
          className
        )}
      >
        {/* Text Formatting Group */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={formatState.isBold ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleFormat("bold")}
                onMouseDown={(e) => e.preventDefault()}
                className="h-8 w-8 p-0"
              >
                <Bold className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Bold (⌘B)
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={formatState.isItalic ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleFormat("italic")}
                onMouseDown={(e) => e.preventDefault()}
                className="h-8 w-8 p-0"
              >
                <Italic className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Italic (⌘I)
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={formatState.isUnderline ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleFormat("underline")}
                onMouseDown={(e) => e.preventDefault()}
                className="h-8 w-8 p-0"
              >
                <Underline className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Underline (⌘U)
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={formatState.isStrikethrough ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleFormat("strikethrough")}
                onMouseDown={(e) => e.preventDefault()}
                className="h-8 w-8 p-0"
              >
                <Strikethrough className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Strikethrough (⌘⇧X)
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-border mx-1" />

        {/* Code Group */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={formatState.isCode ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleFormat("code")}
                onMouseDown={(e) => e.preventDefault()}
                className="h-8 w-8 p-0"
              >
                <Code className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Inline Code (⌘`)
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-border mx-1" />

        {/* Link */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={formatState.isLink ? "secondary" : "ghost"}
                size="sm"
                onClick={handleLink}
                onMouseDown={(e) => e.preventDefault()}
                className="h-8 w-8 p-0"
              >
                <Link className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Insert Link (⌘K)
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-border mx-1" />

        {/* Lists Group */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={formatState.isBulletList ? "secondary" : "ghost"}
                size="sm"
                onClick={handleBulletList}
                onMouseDown={(e) => e.preventDefault()}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Bullet List
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant={formatState.isNumberedList ? "secondary" : "ghost"}
                size="sm"
                onClick={handleNumberedList}
                onMouseDown={(e) => e.preventDefault()}
                className="h-8 w-8 p-0"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Numbered List
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default ToolbarPlugin;
