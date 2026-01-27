# Desktop UI/UX Patterns

Desktop-specific patterns for Villages platform.

## Hover Interactions

Reveal actions on hover (hidden on mobile):

```tsx
// Reveal on group hover
<Button className="opacity-0 group-hover:opacity-100 transition-opacity">
  <MoreVertical />
</Button>

// Interactive states
className="hover:bg-accent hover:border-border transition-colors"
```

**Reference**: `components/chat/conversation-list.tsx`

## Layout Patterns

### Desktop-Only Elements
```tsx
<div className="hidden lg:flex">Desktop only</div>
<div className="md:hidden">Mobile only</div>
```

### Content Centering
```tsx
<main className="max-w-7xl mx-auto w-full">
  {/* Centered, max 80rem width */}
</main>
```

### Progressive Padding
```tsx
className="p-3 sm:p-4 md:p-6 lg:p-8"
```

**Reference**: `app/(dashboard)/layout.tsx`

## Multi-Column Layouts

### Split Auth Layout
```tsx
{/* Hero - desktop only */}
<div className="hidden lg:flex lg:w-1/2">...</div>

{/* Form - always visible */}
<div className="flex-1 lg:w-1/2">...</div>
```

**Reference**: `app/(auth)/layout.tsx`

### Column Visibility by Breakpoint
```tsx
<TableHead className="hidden lg:table-cell">Overview</TableHead>
<TableHead className="hidden md:table-cell">Author</TableHead>
<TableHead className="hidden sm:table-cell">Preview</TableHead>
```

**Reference**: `components/resources/resource-table-view.tsx`

## Sidebar System

```tsx
const SIDEBAR_WIDTH = "16rem";        // 256px - Desktop expanded
const SIDEBAR_WIDTH_MOBILE = "18rem"; // 288px - Mobile overlay (full-width feel)
const SIDEBAR_WIDTH_ICON = "3rem";    // 48px - Collapsed icon-only mode
```

**Keyboard shortcut**: `Cmd+B` (Mac) / `Ctrl+B` (Windows/Linux)

**Reference**: `components/ui/sidebar.tsx`

## Glass Morphism

Modern frosted glass effect:

```tsx
className="bg-background/95 backdrop-blur-sm"
```

**Reference**: `components/chat/conversation-detail-page.tsx` (input area)

## View Switching

### Grid → Table by Breakpoint
```tsx
{/* Mobile: Cards */}
<div className="grid gap-3 md:hidden">...</div>

{/* Tablet: 2-column */}
<div className="hidden md:grid lg:hidden grid-cols-2">...</div>

{/* Desktop: Table */}
<div className="hidden lg:block"><Table>...</Table></div>
```

**Reference**: `app/(dashboard)/volunteer/families/page.tsx`

## Transition Classes

```tsx
transition-colors    // Background, text color
transition-opacity   // Fade in/out
transition-transform // Scale, rotate
transition-all       // Everything (use sparingly)
```

---
*Key files: `app/(dashboard)/layout.tsx`, `components/ui/sidebar.tsx`, `components/resources/resource-table-view.tsx`*
