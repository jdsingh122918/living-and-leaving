/**
 * Field Selection Utilities
 * Helps build Prisma select clauses from query parameters to prevent over-fetching
 */

/**
 * Parse a comma-separated fields string into an array
 */
export function parseFields(fieldsParam: string | null): string[] {
  if (!fieldsParam) return [];
  return fieldsParam
    .split(",")
    .map((f) => f.trim())
    .filter((f) => f.length > 0);
}

/**
 * Build a Prisma select clause from requested fields
 * Returns undefined if no fields specified (returns all fields)
 *
 * @param requestedFields - Array of field names to include
 * @param allowedFields - Array of allowed field names (whitelist)
 * @param alwaysInclude - Fields that should always be included (e.g., 'id')
 * @returns Prisma select object or undefined
 */
export function buildSelectClause(
  requestedFields: string[],
  allowedFields: string[],
  alwaysInclude: string[] = ["id"]
): Record<string, boolean> | undefined {
  // If no fields requested, return undefined (select all)
  if (requestedFields.length === 0) {
    return undefined;
  }

  // Filter to only allowed fields
  const validFields = requestedFields.filter((f) => allowedFields.includes(f));

  // If no valid fields, return undefined (select all)
  if (validFields.length === 0) {
    return undefined;
  }

  // Build select object
  const select: Record<string, boolean> = {};

  // Always include required fields
  alwaysInclude.forEach((f) => {
    select[f] = true;
  });

  // Add requested fields
  validFields.forEach((f) => {
    select[f] = true;
  });

  return select;
}

/**
 * Resource allowed fields for field selection
 */
export const RESOURCE_ALLOWED_FIELDS = [
  "id",
  "title",
  "description",
  "body",
  "resourceType",
  "visibility",
  "tags",
  "isSystemGenerated",
  "externalMeta",
  "createdAt",
  "updatedAt",
  "createdBy",
  "familyId",
  "categoryId",
] as const;

/**
 * User allowed fields for field selection
 */
export const USER_ALLOWED_FIELDS = [
  "id",
  "email",
  "firstName",
  "lastName",
  "role",
  "familyId",
  "familyRole",
  "phoneNumber",
  "emailVerified",
  "createdAt",
  "updatedAt",
] as const;

/**
 * Forum allowed fields for field selection
 */
export const FORUM_ALLOWED_FIELDS = [
  "id",
  "title",
  "description",
  "slug",
  "icon",
  "color",
  "visibility",
  "isActive",
  "isArchived",
  "postCount",
  "memberCount",
  "lastActivityAt",
  "lastPostAt",
  "createdAt",
  "updatedAt",
] as const;

/**
 * Family allowed fields for field selection
 */
export const FAMILY_ALLOWED_FIELDS = [
  "id",
  "name",
  "description",
  "primaryContactId",
  "createdAt",
  "updatedAt",
] as const;

export type ResourceField = (typeof RESOURCE_ALLOWED_FIELDS)[number];
export type UserField = (typeof USER_ALLOWED_FIELDS)[number];
export type ForumField = (typeof FORUM_ALLOWED_FIELDS)[number];
export type FamilyField = (typeof FAMILY_ALLOWED_FIELDS)[number];
