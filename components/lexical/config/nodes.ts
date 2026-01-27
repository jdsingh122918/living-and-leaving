/**
 * Lexical Node Registrations
 * Defines which node types are available in the editor
 */

import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import type { Klass, LexicalNode } from "lexical";

/**
 * Standard nodes for rich text editing
 * These cover all the formatting options we need:
 * - HeadingNode: h1-h6 headings
 * - QuoteNode: blockquotes
 * - ListNode/ListItemNode: bullet and numbered lists
 * - LinkNode/AutoLinkNode: links and auto-detected URLs
 * - CodeNode/CodeHighlightNode: code blocks with syntax highlighting
 * - HorizontalRuleNode: horizontal dividers
 */
export const editorNodes: Array<Klass<LexicalNode>> = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  CodeNode,
  CodeHighlightNode,
  HorizontalRuleNode,
];

export default editorNodes;
