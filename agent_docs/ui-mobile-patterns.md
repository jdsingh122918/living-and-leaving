# Mobile UI/UX Patterns

Mobile-specific patterns for Villages platform.

## Touch Targets (44px Minimum)

WCAG requires 44px minimum touch targets for accessibility.

```tsx
className="min-h-[44px] min-w-[44px]"
```

**Examples**:
- `components/chat/chat-page-content.tsx` - Input/button sizing
- `components/ui/sidebar.tsx:SidebarTrigger` - Trigger button
- `components/sidebar-navigation.tsx` - Menu items (48px)

## Keyboard Awareness

Virtual keyboard detection for proper input positioning:

**Hook**: `hooks/use-keyboard-height.ts`
```tsx
const { keyboardHeight, isKeyboardOpen } = useKeyboardHeight();

<div style={{ bottom: isKeyboardOpen ? `${keyboardHeight}px` : '0px' }}>
  {/* Input adjusts when keyboard opens */}
</div>
```

**Reference**: `components/chat/conversation-detail-page.tsx`

## Mobile Detection

```tsx
import { useIsMobile } from '@/hooks/use-mobile';

const isMobile = useIsMobile(); // Returns true when viewport < 768px
```

**Reference**: `hooks/use-mobile.ts`

## Dialog → Sheet Pattern

Use bottom sheets on mobile, dialogs on desktop:

```tsx
if (isMobile) {
  return <Sheet><SheetContent side="bottom">...</SheetContent></Sheet>;
}
return <Dialog>...</Dialog>;
```

**Reference**: `components/families/add-family-member-button.tsx`

## Responsive Table → Cards

Hide table on mobile, show cards:

```tsx
{/* Desktop */}
<div className="hidden md:block"><Table>...</Table></div>

{/* Mobile */}
<div className="md:hidden"><CardList>...</CardList></div>
```

**Reference**: `components/ui/responsive-table.tsx`

## Touch Optimization

```tsx
// Prevent zoom on double-tap
className="touch-manipulation"

// Press feedback
className="active:scale-[0.98] transition-transform"
```

## Auto-Close Sidebar

Close mobile sidebar on navigation:

```tsx
useEffect(() => {
  if (isMobile) setOpenMobile(false);
}, [pathname, isMobile]);
```

**Reference**: `components/sidebar-navigation.tsx`

## Responsive Breakpoints

| Prefix | Min Width | Target Devices |
|--------|-----------|----------------|
| (none) | 0px | Phones (mobile-first default) |
| `sm:` | 640px | Large phones, small tablets |
| `md:` | 768px | Tablets, small laptops |
| `lg:` | 1024px | Desktops, large tablets |

---
*Key files: `hooks/use-mobile.ts`, `hooks/use-keyboard-height.ts`, `components/ui/responsive-table.tsx`*
