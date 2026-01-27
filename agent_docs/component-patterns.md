# Component Integration Patterns

Reusable component patterns for Villages platform.

## Auto-Save Forms

30-second intervals with LocalStorage backup.

**Files**:
- `lib/utils/auto-save.ts` - Core auto-save hook
- `components/shared/save-status-indicator.tsx` - Visual status

**Usage**:
```tsx
import { useAutoSave } from '@/lib/utils/auto-save';
import { SaveStatusIndicator } from '@/components/shared/save-status-indicator';

const autoSave = useAutoSave({
  interval: 30000,
  storageKey: `form-${contentId}-${userId}`,
  onSave: async (data) => await repository.saveFormData(data),
});
```

## Accessibility Controls

Font scaling, high contrast, reduced motion support.

**File**: `components/ui/accessibility-controls.tsx`

**Usage**:
```tsx
import { AccessibilityWidget } from '@/components/ui/accessibility-controls';

<AccessibilityWidget showLabels />
```

**Features**:
- Font scale: 87.5% to 200%
- Presets: Standard, Large Print, Elderly Mode
- High contrast toggle
- Reduced motion support
- Persistent via localStorage

## Healthcare Privacy

HIPAA compliance indicators and privacy headers.

**File**: `components/shared/privacy-security.tsx`

**Usage**:
```tsx
import { HealthcarePrivacyHeader, FormPrivacyFooter } from '@/components/shared/privacy-security';

<HealthcarePrivacyHeader formType="medical information" accessLevel="family" />
```

## Editor Integration

Editor.js with ref-based onChange handling to prevent re-initialization loops.

**File**: `components/shared/enhanced-textarea.tsx`

**Usage**:
```tsx
// Store onChange in ref to avoid useEffect dependency issues
const onChangeRef = useRef(onChange);
onChangeRef.current = onChange;

useEffect(() => {
  // Initialize editor once, use ref for callbacks
  editor.current = new EditorJS({
    onChange: () => onChangeRef.current?.(editor.current?.save()),
  });
}, []); // Empty deps - only initialize once
```

**Key rules**:
- Use `useRef` for callback references to avoid re-initialization
- Never include `onChange` in useEffect dependencies
- Validate EditorState with `getCurrentContent` before rendering

## File Upload

Database storage with 15MB limit per file.

**File**: `components/shared/file-upload-preview.tsx`

**Usage**:
```tsx
import { FileUploadPreview } from '@/components/shared/file-upload-preview';

<FileUploadPreview
  files={files}
  onFilesChange={setFiles}
  maxSizeMB={15}
  accept="image/*,.pdf,.doc,.docx"
/>
```

## User Selection

Combobox components with search and avatar display.

**Files**:
- `components/shared/user-combobox.tsx` - Single user selection
- `components/shared/member-multi-combobox.tsx` - Multiple member selection

**Usage**:
```tsx
import { UserCombobox } from '@/components/shared/user-combobox';

<UserCombobox
  users={users}
  value={selectedUserId}
  onValueChange={setSelectedUserId}
  placeholder="Select a user..."
/>
```

---
*All components in `components/shared/` and `components/ui/`*
