# Plan: Strip Resource System to Minimum

## Goal

Reduce the resource system from 7 models + 3 enums + ~30 fields to only what's needed:

- **ADMIN/VOLUNTEER**: Create resources, share with families, fill forms on behalf of members
- **MEMBER**: View-only (family-shared resources + assigned templates)

## Migration Safety

MongoDB + Prisma: removing models/fields from the schema does **not** delete data from MongoDB. Collections and document fields persist — Prisma simply ignores them. This makes all removals non-destructive.

---

## Phase 1: Schema Cleanup

**File**: `prisma/schema.prisma`

### 1.1 Delete 3 models entirely

| Model | Lines | Reason |
|-------|-------|--------|
| `ResourceRating` | 1040-1058 | No UI, not in requirements |
| `ResourceShare` | 998-1020 | No API endpoints, no UI |
| `ResourceTag` | 1023-1037 | Unused — simple `tags[]` array used instead |

### 1.2 Remove relations referencing deleted models

**On User model** (~lines 103-105):
```diff
- resourceRatings    ResourceRating[] @relation("ResourceRatings")
- resourceShares     ResourceShare[] @relation("ResourceShareReceiver")
- sharedResources    ResourceShare[] @relation("ResourceShareSender")
```

**On Tag model** (line 532):
```diff
- resources     ResourceTag[] @relation("ResourceTags")
```

**On Resource model** (lines 941, 944, 947):
```diff
- shares          ResourceShare[]
- structuredTags  ResourceTag[]
- ratings         ResourceRating[]
```

### 1.3 Remove unused fields from Resource model

Remove these fields (keep the data in MongoDB, just remove from schema):

```diff
  # Feature flags — no longer needed
- hasCuration     Boolean      @default(false)
- hasRatings      Boolean      @default(false)
- hasSharing      Boolean      @default(false)

  # Curation workflow — no curation in new system
- status          ResourceStatus?
- submittedBy     String?      @db.ObjectId
- approvedBy      String?      @db.ObjectId
- approvedAt      DateTime?
- featuredBy      String?      @db.ObjectId
- featuredAt      DateTime?
- isVerified      Boolean      @default(false)
- lastVerifiedAt  DateTime?

  # Engagement metrics — not in requirements
- viewCount       Int          @default(0)
- downloadCount   Int          @default(0)
- shareCount      Int          @default(0)
- rating          Float?
- ratingCount     Int          @default(0)

  # Relations to removed fields
- submitter       User?        @relation("ResourceSubmitter", ...)
- approver        User?        @relation("ResourceApprover", ...)
```

Also remove on **User model** (~lines 101-102):
```diff
- submittedResources Resource[] @relation("ResourceSubmitter")
- approvedResources  Resource[] @relation("ResourceApprover")
```

### 1.4 Remove unused indexes from Resource model

```diff
- @@index([status])
- @@index([visibility])       # Simplify — access is via family or assignment
- @@index([rating, ratingCount])
- @@index([viewCount])
- @@index([hasCuration])
- @@index([hasRatings])
```

### 1.5 Simplify enums

**Delete** `ResourceStatus` enum (lines 861-868) — no curation, no status workflow.

**Simplify** `ResourceVisibility` (lines 835-840):
```diff
  enum ResourceVisibility {
    PRIVATE      // Creator only (draft)
    FAMILY       // Visible to family members
-   SHARED       // Shared with specific users
-   PUBLIC       // Visible to all authenticated users
  }
```

**Keep** `ResourceType` as-is (9 types are fine).

### 1.6 Add `completedBy` to ResourceFormResponse

```diff
  model ResourceFormResponse {
    id          String    @id @default(auto()) @map("_id") @db.ObjectId
    resourceId  String    @db.ObjectId
    userId      String    @db.ObjectId
+   completedBy String?   @db.ObjectId  // null = self, set = proxy completion
    formData    Json
    completedAt DateTime?
    createdAt   DateTime  @default(now())
    updatedAt   DateTime  @updatedAt

    resource    Resource  @relation(fields: [resourceId], references: [id], onDelete: Cascade)
    user        User      @relation("ResourceFormResponses", fields: [userId], references: [id], onDelete: Cascade)
+   completer   User?     @relation("CompletedFormResponses", fields: [completedBy], references: [id], onDelete: SetNull)

    @@unique([resourceId, userId])
    @@index([resourceId])
    @@index([userId])
+   @@index([completedBy])
    @@index([completedAt])
    @@map("resource_form_responses")
  }
```

Add reverse relation on **User model**:
```diff
+ completedFormResponses ResourceFormResponse[] @relation("CompletedFormResponses")
```

### 1.7 Run migration

```bash
npx prisma generate && npx prisma db push
```

### 1.8 Resulting Resource model (after cleanup)

```prisma
model Resource {
  id              String       @id @default(auto()) @map("_id") @db.ObjectId
  title           String
  description     String?
  body            String?
  resourceType    ResourceType
  visibility      ResourceVisibility @default(PRIVATE)
  familyId        String?      @db.ObjectId
  categoryId      String?      @db.ObjectId
  tags            String[]     @default([])
  attachments     String[]     @default([])
  createdBy       String       @db.ObjectId
  sharedWith      String[]     @db.ObjectId @default([])
  isArchived      Boolean      @default(false)
  isDeleted       Boolean      @default(false)
  deletedAt       DateTime?
  isSystemGenerated Boolean    @default(false)
  url             String?
  targetAudience  String[]     @default([])
  externalMeta    Json?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  creator         User         @relation("ResourceCreator", fields: [createdBy], references: [id])
  family          Family?      @relation("FamilyResources", fields: [familyId], references: [id])
  category        Category?    @relation("ResourceCategory", fields: [categoryId], references: [id])
  documents       ResourceDocument[]
  formResponses   ResourceFormResponse[]
  templateAssignments TemplateAssignment[] @relation("TemplateAssignments")

  @@index([createdBy])
  @@index([familyId])
  @@index([resourceType])
  @@index([tags])
  @@index([isArchived, isDeleted])
  @@index([isSystemGenerated])
  @@index([createdAt])
  @@map("resources")
}
```

---

## Phase 2: Delete Unused API Routes

**Delete these directories entirely**:

| Route | Reason |
|-------|--------|
| `app/api/resources/[id]/approve/` | No curation |
| `app/api/resources/[id]/feature/` | No curation |
| `app/api/resources/[id]/rate/` | No rating |
| `app/api/resources/[id]/rating/` | No rating |
| `app/api/resources/[id]/bookmark/` | Not in requirements |
| `app/api/resources/[id]/start-template/` | Folded into assignment flow |

**Keep**:
- `app/api/resources/route.ts` (list + create)
- `app/api/resources/[id]/route.ts` (get + update + delete)
- `app/api/resources/[id]/full/route.ts` (composite get)
- `app/api/resources/[id]/form-response/` (form responses + PDF share)
- `app/api/template-assignments/` (assignment CRUD)

---

## Phase 3: Rewrite Repository

**File**: `lib/db/repositories/resource.repository.ts` (currently 1505 lines -> target ~600)

### 3.1 Delete these methods

| Method | Lines | Reason |
|--------|-------|--------|
| `incrementViewCount` | 354-362 | No metrics |
| `getCurationQueue` | 371-394 | No curation |
| `approveContent` | 399-421 | No curation |
| `featureContent` | 426-448 | No curation |
| `rateContent` | 457-521 | No rating |
| `recalculateRating` | 526-558 | No rating |
| `getUserRating` | 563-588 | No rating |
| `shareContent` | 656-691 | ResourceShare model removed |

### 3.2 Rewrite `prepareResourceData` (~line 697)

Remove all curation/rating/status logic:
```typescript
private prepareResourceData(data: CreateResourceInput, userId: string) {
  return {
    title: data.title,
    description: data.description,
    body: data.body,
    resourceType: data.resourceType,
    visibility: data.visibility || ResourceVisibility.PRIVATE,
    familyId: data.familyId,
    categoryId: data.categoryId,
    tags: data.tags || [],
    createdBy: userId,
    url: data.url,
    targetAudience: data.targetAudience || [],
    externalMeta: data.externalMeta,
    isSystemGenerated: data.isSystemGenerated ?? false,
  };
}
```

### 3.3 Rewrite `validateCreatePermissions` (~line 735)

```typescript
private validateCreatePermissions(userRole: UserRole): void {
  if (userRole === UserRole.MEMBER) {
    throw new Error("Members cannot create resources");
  }
}
```

### 3.4 Rewrite `validateUpdatePermissions` (~line 747)

Remove ResourceShare check:
```typescript
private validateUpdatePermissions(resource: Resource, userId: string, userRole: UserRole): void {
  if (userRole === UserRole.ADMIN) return;
  if (resource.createdBy === userId) return;
  throw new Error("Permission denied to update resource");
}
```

### 3.5 Rewrite `checkResourceAccess` (~line 795)

```typescript
private async checkResourceAccess(resource: Resource, userId: string, userRole: UserRole): Promise<boolean> {
  // ADMIN: full access
  if (userRole === UserRole.ADMIN) return true;

  // Creator: own resources
  if (resource.createdBy === userId) return true;

  // VOLUNTEER: resources in assigned families
  if (userRole === UserRole.VOLUNTEER) {
    if (resource.familyId) {
      const assignment = await this.prisma.volunteerFamilyAssignment.findFirst({
        where: { volunteerId: userId, familyId: resource.familyId, isActive: true },
      });
      if (assignment) return true;
    }
    return false;
  }

  // MEMBER: only assigned templates + family resources
  if (userRole === UserRole.MEMBER) {
    // Check template assignment
    const assignment = await this.prisma.templateAssignment.findUnique({
      where: { resourceId_assigneeId: { resourceId: resource.id, assigneeId: userId } },
    });
    if (assignment) return true;

    // Check family visibility
    if (resource.visibility === ResourceVisibility.FAMILY && resource.familyId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.familyId === resource.familyId) return true;
    }

    return false;
  }

  return false;
}
```

### 3.6 Rewrite `buildWhereClause` (~line 859)

Strip to essentials: resourceType, tags, healthcare tags/categories, search, template filtering, family, and simplified access control. Remove all curation, rating, feature, verified, and metric-based filters.

For member access: `OR: [{ templateAssignment for userId }, { FAMILY visibility + user's familyId }]`

### 3.7 Add new method: `saveFormResponseOnBehalf`

```typescript
async saveFormResponseOnBehalf(
  resourceId: string,
  memberId: string,
  completerId: string,
  formData: any,
  isComplete: boolean,
) {
  return this.prisma.resourceFormResponse.upsert({
    where: { resourceId_userId: { resourceId, userId: memberId } },
    create: {
      resourceId, userId: memberId, completedBy: completerId,
      formData, completedAt: isComplete ? new Date() : null,
    },
    update: {
      completedBy: completerId, formData,
      completedAt: isComplete ? new Date() : null,
    },
  });
}
```

---

## Phase 4: Update API Routes

### 4.1 Block member creation in POST `/api/resources`
**File**: `app/api/resources/route.ts`

Return 403 for `UserRole.MEMBER` before body parsing. Remove all status/curation logic from response formatting.

### 4.2 Clean up GET/PUT/DELETE `/api/resources/[id]`
**File**: `app/api/resources/[id]/route.ts`

Remove: status change logic, curation notifications, rating checks. Simplify response to exclude removed fields.

### 4.3 Clean up GET `/api/resources/[id]/full`
**File**: `app/api/resources/[id]/full/route.ts`

Remove: rating inclusion, bookmark logic.

### 4.4 Create proxy form completion endpoint
**New file**: `app/api/resources/[id]/complete-for-member/route.ts`

POST handler:
- Body: `{ memberId, formData, isComplete }`
- Validates ADMIN or VOLUNTEER role
- VOLUNTEER: validates member belongs to assigned family
- Calls `saveFormResponseOnBehalf()`
- Creates/updates TemplateAssignment
- Sends notification to member

---

## Phase 5: Update UI Components

### 5.1 Resource creation page
**File**: `components/resources/resource-creation-page.tsx`

- Remove PUBLIC and SHARED from visibility dropdown
- Remove curation/rating toggles (if present)
- Remove status selection

### 5.2 Resource card
**File**: `components/resources/resource-card.tsx`

- Remove star rating display
- Remove status badges (PENDING, FEATURED, etc.)
- Remove view count display

### 5.3 Resource detail page
**File**: `components/resources/resource-detail-page.tsx`

- Remove rating UI and actions
- Remove status badges and curation actions
- Add "Fill for Member" button for ADMIN/VOLUNTEER on template resources

### 5.4 Resource filters
**File**: `components/resources/resource-filters.tsx`

- Remove status filter
- Remove "requires curation" filter
- Remove rating filter
- Remove visibility filters for SHARED/PUBLIC

### 5.5 Resources page content
**File**: `components/resources/resources-page-content.tsx`

- Remove sort-by-rating option
- Remove sort-by-views option

### 5.6 New component: Fill-for-member modal
**New file**: `components/resources/complete-for-member-modal.tsx`

Two-step flow:
1. Select member (reuse `MemberMultiCombobox` in single-select mode)
2. Fill form (reuse existing form components)
3. Submit to `/api/resources/[id]/complete-for-member`

### 5.7 New pages: Admin/Volunteer proxy completion
**New files**:
- `app/(dashboard)/admin/resources/[id]/complete-for/page.tsx`
- `app/(dashboard)/volunteer/resources/[id]/complete-for/page.tsx`

---

## Phase 6: Clean Up Types and Imports

### 6.1 Update TypeScript types
**File**: `lib/types/index.ts`

Remove: `ResourceStatus`, rating-related types, curation-related interfaces. Update `Resource` type to match simplified schema.

### 6.2 Fix all broken imports

After schema changes, run `npm run build` to find all TypeScript errors from:
- Removed `ResourceStatus` references
- Removed `ResourceVisibility.SHARED` / `ResourceVisibility.PUBLIC` references
- Removed rating/curation field references
- Removed `ResourceShare`, `ResourceRating`, `ResourceTag` model references

Fix each broken import/reference.

---

## Critical Files Summary

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Delete 3 models, remove ~20 fields, simplify 2 enums, add `completedBy` |
| `lib/db/repositories/resource.repository.ts` | Delete 8 methods, rewrite 5 methods, add 1 method |
| `lib/types/index.ts` | Remove dead types, update Resource interface |
| `app/api/resources/route.ts` | Block member POST, remove curation logic |
| `app/api/resources/[id]/route.ts` | Remove status/curation logic |
| `app/api/resources/[id]/approve/` | **DELETE** |
| `app/api/resources/[id]/feature/` | **DELETE** |
| `app/api/resources/[id]/rate/` | **DELETE** |
| `app/api/resources/[id]/rating/` | **DELETE** |
| `app/api/resources/[id]/bookmark/` | **DELETE** |
| `app/api/resources/[id]/start-template/` | **DELETE** |
| `app/api/resources/[id]/complete-for-member/route.ts` | **NEW** |
| `components/resources/resource-creation-page.tsx` | Remove SHARED/PUBLIC visibility |
| `components/resources/resource-card.tsx` | Remove rating, status badges |
| `components/resources/resource-detail-page.tsx` | Remove rating/curation, add "Fill for Member" |
| `components/resources/resource-filters.tsx` | Remove curation/rating/status filters |
| `components/resources/resources-page-content.tsx` | Remove rating/view sorts |
| `components/resources/complete-for-member-modal.tsx` | **NEW** |
| `app/(dashboard)/admin/resources/[id]/complete-for/page.tsx` | **NEW** |
| `app/(dashboard)/volunteer/resources/[id]/complete-for/page.tsx` | **NEW** |

---

## Verification

1. `npx prisma generate` — no schema errors
2. `npm run build` — no TypeScript errors
3. **Member blocked**: POST `/api/resources` as MEMBER -> 403
4. **Admin creates**: POST `/api/resources` as ADMIN -> resource created (no status field)
5. **Volunteer creates**: POST `/api/resources` as VOLUNTEER -> resource created
6. **Member list**: GET `/api/resources` as MEMBER -> only family-shared + assigned templates
7. **Fill on behalf**: POST `/api/resources/{id}/complete-for-member` as ADMIN -> form saved with `completedBy` set
8. **Volunteer scoping**: VOLUNTEER can only fill for members in their assigned families -> verified
9. **Existing data intact**: Previously created resources still load (MongoDB preserves removed fields)
10. **Existing form responses**: Display correctly with `completedBy = null`
11. **Deleted API routes**: `/api/resources/{id}/rating`, `/approve`, `/feature` -> 404
