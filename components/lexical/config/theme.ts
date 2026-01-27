/**
 * Lexical Editor Theme Configuration
 * Tailwind CSS classes for styling Lexical editor elements
 */

import type { EditorThemeClasses } from "lexical";

export const lexicalTheme: EditorThemeClasses = {
  // Root container
  root: "relative outline-none",

  // Text formatting
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through",
    code: "font-mono bg-muted px-1.5 py-0.5 rounded text-sm",
    subscript: "text-xs align-sub",
    superscript: "text-xs align-super",
  },

  // Links
  link: "text-primary underline cursor-pointer hover:text-primary/80",

  // Lists
  list: {
    ul: "list-disc list-inside ml-4 space-y-1",
    ol: "list-decimal list-inside ml-4 space-y-1",
    listitem: "leading-relaxed",
    listitemChecked: "line-through text-muted-foreground",
    listitemUnchecked: "",
    nested: {
      listitem: "ml-4",
    },
  },

  // Headings
  heading: {
    h1: "text-2xl font-bold mb-4 mt-6 first:mt-0",
    h2: "text-xl font-semibold mb-3 mt-5 first:mt-0",
    h3: "text-lg font-semibold mb-2 mt-4 first:mt-0",
    h4: "text-base font-semibold mb-2 mt-3 first:mt-0",
    h5: "text-sm font-semibold mb-1 mt-2 first:mt-0",
    h6: "text-sm font-medium mb-1 mt-2 first:mt-0",
  },

  // Quote/Blockquote
  quote: "border-l-4 border-muted-foreground/30 pl-4 py-1 italic text-muted-foreground my-2",

  // Code blocks
  code: "block bg-muted p-3 rounded-md font-mono text-sm overflow-x-auto my-2 whitespace-pre-wrap",
  codeHighlight: {
    atrule: "text-purple-500",
    attr: "text-blue-500",
    boolean: "text-orange-500",
    builtin: "text-cyan-500",
    cdata: "text-gray-500",
    char: "text-green-500",
    class: "text-yellow-500",
    "class-name": "text-yellow-500",
    comment: "text-gray-500 italic",
    constant: "text-orange-500",
    deleted: "text-red-500",
    doctype: "text-gray-500",
    entity: "text-orange-500",
    function: "text-blue-500",
    important: "text-red-500 font-bold",
    inserted: "text-green-500",
    keyword: "text-purple-500",
    namespace: "text-cyan-500",
    number: "text-orange-500",
    operator: "text-gray-600",
    prolog: "text-gray-500",
    property: "text-blue-500",
    punctuation: "text-gray-600",
    regex: "text-green-500",
    selector: "text-green-500",
    string: "text-green-500",
    symbol: "text-orange-500",
    tag: "text-red-500",
    url: "text-cyan-500 underline",
    variable: "text-orange-500",
  },

  // Paragraphs
  paragraph: "mb-2 last:mb-0 leading-relaxed",

  // Horizontal rule
  hr: "border-t border-border my-4",

  // Images
  image: "max-w-full h-auto rounded my-2",

  // Tables
  table: "w-full border-collapse my-4",
  tableCell: "border border-border p-2 text-left",
  tableCellHeader: "border border-border p-2 text-left font-semibold bg-muted",
  tableRow: "",
};

export default lexicalTheme;
