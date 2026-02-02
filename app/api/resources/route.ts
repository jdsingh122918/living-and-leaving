import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server-auth';
import { ResourceType, ResourceVisibility, UserRole } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { ResourceRepository, ResourceFilters, CreateResourceInput } from '@/lib/db/repositories/resource.repository';

/**
 * Unified Resources API Endpoint
 *
 * This endpoint handles all resource types through the unified Resource model,
 * providing a comprehensive API interface for all resource operations with
 * optional features enabled via feature flags.
 *
 * Supported operations:
 * - GET: Filter and paginate resources
 * - POST: Create new resources
 * - Supports assignments and template management
 */

const resourceRepository = new ResourceRepository(prisma);

// GET /api/resources - Filter and paginate resources
export async function GET(request: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role and database ID with dual-path pattern
    const userRole = (sessionClaims?.metadata as { role?: UserRole })?.role;
    let finalUserRole = userRole;
    let dbUserId: string | undefined;

    // Get user's database record for ID and role
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true }
    });

    if (dbUser) {
      dbUserId = dbUser.id;
      if (!finalUserRole) finalUserRole = dbUser.role as UserRole;
    }

    if (!finalUserRole) {
      return NextResponse.json({ error: 'User role not found' }, { status: 403 });
    }

    if (!dbUserId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters: ResourceFilters = parseResourceFilters(searchParams);

    // Get content with options
    const options = {
      includeCreator: searchParams.get('includeCreator') === 'true',
      includeFamily: searchParams.get('includeFamily') === 'true',
      includeCategory: searchParams.get('includeCategory') === 'true',
      includeDocuments: searchParams.get('includeDocuments') === 'true',
    };

    const result = await resourceRepository.filter(
      filters,
      dbUserId, // Pass database ID instead of Clerk ID
      finalUserRole,
      options
    );

    return NextResponse.json({
      resources: result.resources,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasNextPage: result.page < result.totalPages,
      hasPrevPage: result.page > 1,
      filters: {
        resourceTypes: filters.resourceType,
        search: filters.search,
        tags: filters.tags,
        healthcareCategories: filters.healthcareCategories
      }
    });

  } catch (error) {
    console.error('💥 Resources API GET error:', error);
    console.error('💥 Error name:', error instanceof Error ? error.name : 'Not an Error');
    console.error('💥 Error message:', error instanceof Error ? error.message : String(error));
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { error: 'Failed to fetch resources', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/resources - Create new resource
export async function POST(request: NextRequest) {
  try {
    console.log('📝 POST /api/resources - Starting resource creation');

    const { userId, sessionClaims } = await auth();
    console.log('📝 Auth result:', { userId: userId ? 'present' : 'missing', sessionClaims: sessionClaims ? 'present' : 'missing' });

    if (!userId) {
      console.error('❌ No userId from auth');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role and database ID with dual-path pattern
    const userRole = (sessionClaims?.metadata as { role?: UserRole })?.role;
    let finalUserRole = userRole;
    let dbUserId: string | undefined;

    console.log('📝 User role from session:', userRole);

    // Get user's database record for ID and role
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true }
    });

    console.log('📝 Database user:', dbUser);

    if (dbUser) {
      dbUserId = dbUser.id;
      if (!finalUserRole) finalUserRole = dbUser.role as UserRole;
    }

    console.log('📝 Final user details:', { finalUserRole, dbUserId });

    if (!finalUserRole) {
      console.error('❌ User role not found');
      return NextResponse.json({ error: 'User role not found' }, { status: 403 });
    }

    if (!dbUserId) {
      console.error('❌ User not found in database');
      return NextResponse.json({ error: 'User not found in database' }, { status: 403 });
    }

    // Members cannot create resources
    if (finalUserRole === UserRole.MEMBER) {
      return NextResponse.json({ error: 'Members cannot create resources' }, { status: 403 });
    }

    // Parse request body
    console.log('📝 Parsing request body...');
    const body = await request.json();
    console.log('📝 Request body:', body);

    console.log('📝 Validating content input...');
    const contentData = validateCreateContentInput(body);
    console.log('📝 Validated content data:', contentData);

    // Create content
    console.log('📝 Creating content with repository...');
    const content = await resourceRepository.create(
      contentData,
      dbUserId, // Pass database ID instead of Clerk ID
      finalUserRole
    );

    console.log('✅ Content created successfully:', { id: content.id, title: content.title });

    return NextResponse.json({
      success: true,
      data: content,
      message: `${contentData.resourceType} created successfully`
    }, { status: 201 });

  } catch (error) {
    console.error('Content API POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function parseResourceFilters(searchParams: URLSearchParams): ResourceFilters {
  const filters: ResourceFilters = {};

  // Resource type filters
  const resourceType = searchParams.get('resourceType') || searchParams.get('type');
  if (resourceType) {
    const types = resourceType.split(',').map(t => t.trim().toUpperCase());
    filters.resourceType = types.filter(t =>
      Object.values(ResourceType).includes(t as ResourceType)
    ) as ResourceType[];
  }

  // Ownership and organization
  const createdBy = searchParams.get('createdBy');
  if (createdBy) filters.createdBy = createdBy;

  const familyId = searchParams.get('familyId');
  if (familyId) filters.familyId = familyId;

  const categoryId = searchParams.get('categoryId');
  if (categoryId) filters.categoryId = categoryId;

  const tags = searchParams.get('tags');
  if (tags) {
    filters.tags = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
  }

  // Healthcare-specific filters
  const healthcareCategories = searchParams.get('healthcareCategories');
  if (healthcareCategories) {
    filters.healthcareCategories = healthcareCategories.split(',').map(t => t.trim()).filter(t => t.length > 0);
  }

  const healthcareTags = searchParams.get('healthcareTags');
  if (healthcareTags) {
    filters.healthcareTags = healthcareTags.split(',').map(t => t.trim()).filter(t => t.length > 0);
  }

  // Search and feature flags
  const search = searchParams.get('search');
  if (search) filters.search = search;

  // Template filtering
  const isTemplate = searchParams.get('isTemplate');
  if (isTemplate) filters.isTemplate = isTemplate === 'true';

  const templateType = searchParams.get('templateType');
  if (templateType) filters.templateType = templateType;

  // System-generated filtering
  const isSystemGenerated = searchParams.get('isSystemGenerated');
  if (isSystemGenerated !== null) {
    filters.isSystemGenerated = isSystemGenerated === 'true';
  }

  // Pagination
  const page = searchParams.get('page');
  if (page) {
    const pageNum = parseInt(page, 10);
    if (!isNaN(pageNum) && pageNum > 0) {
      filters.page = pageNum;
    }
  }

  const limit = searchParams.get('limit');
  if (limit) {
    const limitNum = parseInt(limit, 10);
    if (!isNaN(limitNum) && limitNum > 0 && limitNum <= 100) {
      filters.limit = limitNum;
    }
  }

  // Sorting
  const sortBy = searchParams.get('sortBy');
  if (sortBy && ['createdAt', 'updatedAt', 'title'].includes(sortBy)) {
    filters.sortBy = sortBy as any;
  }

  const sortOrder = searchParams.get('sortOrder');
  if (sortOrder && ['asc', 'desc'].includes(sortOrder)) {
    filters.sortOrder = sortOrder as 'asc' | 'desc';
  }

  return filters;
}

function validateCreateContentInput(body: any): CreateResourceInput {
  const { title, description, content, body: bodyContent, resourceType } = body;

  // Validate required fields
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw new Error('Title is required');
  }

  if (!resourceType || !Object.values(ResourceType).includes(resourceType)) {
    throw new Error('Valid resource type is required');
  }

  // ResourceType validation is already done above - no additional validation needed here

  // Validate visibility
  const visibility = body.visibility;
  if (visibility && !Object.values(ResourceVisibility).includes(visibility)) {
    throw new Error('Invalid visibility value');
  }

  // Validate arrays
  const tags = body.tags;
  if (tags && !Array.isArray(tags)) {
    throw new Error('Tags must be an array');
  }

  const targetAudience = body.targetAudience;
  if (targetAudience && !Array.isArray(targetAudience)) {
    throw new Error('Target audience must be an array');
  }

  // Validate URL for certain resource types
  if (['LINK', 'VIDEO'].includes(resourceType) && !body.url) {
    throw new Error('URL is required for LINK and VIDEO resources');
  }

  if (body.url && typeof body.url !== 'string') {
    throw new Error('URL must be a string');
  }

  return {
    title: title.trim(),
    description: description?.trim(),
    body: bodyContent?.trim() || content?.trim(), // Support both 'body' and 'content' fields
    resourceType,
    visibility,
    familyId: body.familyId || null, // Ensure empty strings become null
    categoryId: body.categoryId || null, // Ensure empty strings become null
    tags: tags?.filter((tag: any) => typeof tag === 'string' && tag.trim().length > 0),
    url: body.url,
    targetAudience: targetAudience?.filter((audience: any) => typeof audience === 'string'),
    externalMeta: body.externalMeta,
    documentIds: body.documentIds,
    createdBy: body.createdBy, // Required field
    sharedWith: body.sharedWith,
    attachments: body.attachments
  };
}