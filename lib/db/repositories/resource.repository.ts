import {
  PrismaClient,
  Resource,
  ResourceType,
  ResourceVisibility,
  UserRole,
  ResourceDocument,
  ResourceFormResponse,
} from "@prisma/client";

/**
 * Unified Resource Repository
 *
 * Handles all resource operations with role-based access control.
 * - ADMIN/VOLUNTEER: Create and manage resources
 * - MEMBER: View-only (family-shared + assigned templates)
 */

export interface ResourceFilters {
  resourceType?: ResourceType[];
  createdBy?: string;
  familyId?: string;
  categoryId?: string;
  tags?: string[];
  healthcareCategories?: string[];
  healthcareTags?: string[];
  search?: string;
  isTemplate?: boolean;
  templateType?: string;
  isSystemGenerated?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "title";
  sortOrder?: "asc" | "desc";
}

export interface CreateResourceInput {
  title: string;
  description?: string;
  body?: string;
  resourceType: ResourceType;
  visibility?: ResourceVisibility;
  familyId?: string;
  categoryId?: string;
  tags?: string[];
  attachments?: string[];
  createdBy: string;
  sharedWith?: string[];
  url?: string;
  targetAudience?: string[];
  externalMeta?: any;
  isSystemGenerated?: boolean;
  documentIds?: string[];
}

export interface UpdateResourceInput extends Partial<CreateResourceInput> {
  isArchived?: boolean;
  isDeleted?: boolean;
}

export interface ResourceOptions {
  includeDocuments?: boolean;
  includeFormResponses?: boolean;
  includeCreator?: boolean;
  includeFamily?: boolean;
  includeCategory?: boolean;
}

export interface PaginatedResources {
  resources: Resource[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class ResourceRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create new resource with unified features
   */
  async create(
    data: CreateResourceInput,
    userId: string,
    userRole: UserRole,
  ): Promise<Resource> {
    // Validate user permissions
    this.validateCreatePermissions(userRole);

    // Set defaults based on resource type
    const resourceData = this.prepareResourceData(data, userId);

    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Create the resource
        const resource = await prisma.resource.create({
          data: resourceData,
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            family: {
              select: { id: true, name: true },
            },
            category: {
              select: { id: true, name: true, color: true },
            },
          },
        });

        // Link documents if provided
        if (data.documentIds && data.documentIds.length > 0) {
          const documentAttachments = data.documentIds.map(
            (documentId, index) => ({
              resourceId: resource.id,
              documentId,
              source: "UPLOAD" as const,
              order: index,
              createdBy: userId,
            }),
          );

          await prisma.resourceDocument.createMany({
            data: documentAttachments,
          });

          // Fetch resource with documents included
          return await prisma.resource.findUniqueOrThrow({
            where: { id: resource.id },
            include: {
              creator: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              family: {
                select: { id: true, name: true },
              },
              category: {
                select: { id: true, name: true, color: true },
              },
              documents: {
                include: {
                  document: {
                    select: {
                      id: true,
                      title: true,
                      fileName: true,
                      fileSize: true,
                      mimeType: true,
                      type: true,
                      filePath: true,
                    },
                  },
                },
                orderBy: { order: "asc" },
              },
            },
          });
        }

        return resource;
      });
    } catch (error) {
      throw new Error(`Failed to create resource: ${error}`);
    }
  }

  /**
   * Find content by ID with role-based access control
   */
  async findById(
    id: string,
    userId: string,
    userRole: UserRole,
    options: ResourceOptions = {},
  ): Promise<Resource | null> {
    const include = this.buildIncludeClause(options);

    const content = await this.prisma.resource.findUnique({
      where: { id },
      include,
    });

    if (!content) {
      return null;
    }

    // Check access permissions
    const hasAccess = await this.checkResourceAccess(content, userId, userRole);
    if (!hasAccess) {
      return null;
    }

    return content;
  }

  /**
   * Filter and paginate resources with role-based access
   */
  async filter(
    filters: ResourceFilters,
    userId: string,
    userRole: UserRole,
    options: ResourceOptions = {},
  ): Promise<PaginatedResources> {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const offset = (page - 1) * limit;

    const where = await this.buildWhereClause(filters, userId, userRole);
    const orderBy = this.buildOrderByClause(filters);
    const include = this.buildIncludeClause(options);

    const [resources, total] = await Promise.all([
      this.prisma.resource.findMany({
        where,
        include,
        orderBy,
        skip: offset,
        take: limit,
      }),
      this.prisma.resource.count({ where }),
    ]);

    return {
      resources,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update resource with permission checks
   */
  async update(
    id: string,
    data: UpdateResourceInput,
    userId: string,
    userRole: UserRole,
  ): Promise<Resource> {
    const existingContent = await this.findById(id, userId, userRole);
    if (!existingContent) {
      throw new Error("Content not found or access denied");
    }

    this.validateUpdatePermissions(existingContent, userId, userRole);

    const updateData = { ...data };

    try {
      return await this.prisma.resource.update({
        where: { id },
        data: updateData,
        include: {
          creator: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          family: {
            select: { id: true, name: true },
          },
        },
      });
    } catch (error) {
      throw new Error(`Failed to update content: ${error}`);
    }
  }

  /**
   * Soft delete content
   */
  async delete(id: string, userId: string, userRole: UserRole): Promise<void> {
    const content = await this.findById(id, userId, userRole);
    if (!content) {
      throw new Error("Content not found or access denied");
    }

    this.validateDeletePermissions(content, userId, userRole);

    await this.prisma.resource.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  // ========================================
  // DOCUMENT MANAGEMENT (Unified)
  // ========================================

  /**
   * Attach document to resource
   */
  async attachDocument(
    resourceId: string,
    documentId: string,
    attachedBy: string,
    order: number = 0,
    isMain: boolean = false,
  ): Promise<ResourceDocument> {
    return await this.prisma.resourceDocument.create({
      data: {
        resourceId,
        documentId,
        createdBy: attachedBy,
        order,
        isMain,
      },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            type: true,
          },
        },
      },
    });
  }

  /**
   * Remove document from resource
   */
  async detachDocument(
    resourceId: string,
    documentId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<void> {
    const resource = await this.findById(resourceId, userId, userRole);
    if (!resource) {
      throw new Error("Resource not found or access denied");
    }

    await this.prisma.resourceDocument.deleteMany({
      where: {
        resourceId,
        documentId,
      },
    });
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

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

  private validateCreatePermissions(userRole: UserRole): void {
    if (userRole === UserRole.MEMBER) {
      throw new Error("Members cannot create resources");
    }
  }

  private validateUpdatePermissions(
    resource: Resource,
    userId: string,
    userRole: UserRole,
  ): void {
    if (userRole === UserRole.ADMIN) return;
    if (resource.createdBy === userId) return;
    throw new Error("Permission denied to update resource");
  }

  private validateDeletePermissions(
    resource: Resource,
    userId: string,
    userRole: UserRole,
  ): void {
    // ADMIN can delete anything
    if (userRole === UserRole.ADMIN) {
      return;
    }

    // Creator can delete their own resource
    if (resource.createdBy === userId) {
      return;
    }

    throw new Error("Permission denied to delete resource");
  }

  private async checkResourceAccess(
    resource: Resource,
    userId: string,
    userRole: UserRole,
  ): Promise<boolean> {
    // ADMIN: full access
    if (userRole === UserRole.ADMIN) return true;

    // Creator: own resources
    if (resource.createdBy === userId) return true;

    // VOLUNTEER: resources in assigned families
    if (userRole === UserRole.VOLUNTEER) {
      if (resource.familyId) {
        const assignment =
          await this.prisma.volunteerFamilyAssignment.findFirst({
            where: {
              volunteerId: userId,
              familyId: resource.familyId,
              isActive: true,
            },
          });
        if (assignment) return true;
      }
      return false;
    }

    // MEMBER: only assigned templates + family resources
    if (userRole === UserRole.MEMBER) {
      // Check template assignment
      const templateAssignment =
        await this.prisma.templateAssignment.findUnique({
          where: {
            resourceId_assigneeId: {
              resourceId: resource.id,
              assigneeId: userId,
            },
          },
        });
      if (templateAssignment) return true;

      // Check family visibility
      if (
        resource.visibility === ResourceVisibility.FAMILY &&
        resource.familyId
      ) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });
        if (user?.familyId === resource.familyId) return true;
      }

      return false;
    }

    return false;
  }

  private async buildWhereClause(
    filters: ResourceFilters,
    userId: string,
    userRole: UserRole,
  ) {
    const where: any = {
      isDeleted: false,
    };

    if (filters.resourceType && filters.resourceType.length > 0) {
      where.resourceType = { in: filters.resourceType };
    }

    if (filters.createdBy) {
      where.createdBy = filters.createdBy;
    }

    if (filters.familyId) {
      where.familyId = filters.familyId;
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    // Healthcare-specific filtering
    if (
      filters.healthcareCategories &&
      filters.healthcareCategories.length > 0
    ) {
      const { HEALTHCARE_CATEGORIES } = await import(
        "@/lib/data/healthcare-tags"
      );
      const categoryTags: string[] = [];
      for (const categoryName of filters.healthcareCategories) {
        const category = HEALTHCARE_CATEGORIES.find(
          (cat) => cat.name === categoryName,
        );
        if (category) {
          categoryTags.push(...category.tags);
        }
      }
      if (categoryTags.length > 0) {
        where.tags = {
          ...where.tags,
          hasSome: [...(where.tags?.hasSome || []), ...categoryTags],
        };
      }
    }

    if (filters.healthcareTags && filters.healthcareTags.length > 0) {
      where.tags = {
        ...where.tags,
        hasSome: [...(where.tags?.hasSome || []), ...filters.healthcareTags],
      };
    }

    // Template filtering
    if (filters.isTemplate !== undefined) {
      if (filters.isTemplate) {
        where.AND = [
          ...(where.AND || []),
          {
            externalMeta: {
              path: ["isTemplate"],
              equals: true,
            },
          },
        ];
      } else {
        where.AND = [
          ...(where.AND || []),
          {
            NOT: {
              externalMeta: {
                path: ["isTemplate"],
                equals: true,
              },
            },
          },
        ];
      }
    }

    if (filters.templateType) {
      where.externalMeta = {
        path: ["templateType"],
        equals: filters.templateType,
      };
    }

    if (filters.isSystemGenerated !== undefined) {
      where.isSystemGenerated = filters.isSystemGenerated;
    }

    // Search
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { body: { contains: filters.search, mode: "insensitive" } },
        { tags: { hasSome: [filters.search] } },
      ];
    }

    // Role-based access control
    if (userRole === UserRole.ADMIN) {
      // Admin sees everything
    } else if (userRole === UserRole.VOLUNTEER) {
      // Volunteer sees: own resources + resources in assigned families
      const assignments =
        await this.prisma.volunteerFamilyAssignment.findMany({
          where: { volunteerId: userId, isActive: true },
          select: { familyId: true },
        });
      const familyIds = assignments.map((a) => a.familyId);

      where.AND = [
        ...(where.AND || []),
        {
          OR: [{ createdBy: userId }, { familyId: { in: familyIds } }],
        },
      ];
    } else if (userRole === UserRole.MEMBER) {
      // Member sees: assigned templates + family resources
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { familyId: true },
      });

      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            // Resources assigned to this member via TemplateAssignment
            {
              templateAssignments: {
                some: { assigneeId: userId },
              },
            },
            // Family-visible resources in user's family
            ...(user?.familyId
              ? [
                  {
                    AND: [
                      { visibility: ResourceVisibility.FAMILY },
                      { familyId: user.familyId },
                    ],
                  },
                ]
              : []),
          ],
        },
      ];
    }

    return where;
  }

  private buildOrderByClause(filters: ResourceFilters) {
    const sortBy = filters.sortBy || "createdAt";
    const sortOrder = filters.sortOrder || "desc";

    return { [sortBy]: sortOrder };
  }

  private buildIncludeClause(options: ResourceOptions) {
    const include: any = {};

    if (options.includeCreator) {
      include.creator = {
        select: { id: true, firstName: true, lastName: true, email: true },
      };
    }

    if (options.includeFamily) {
      include.family = {
        select: { id: true, name: true },
      };
    }

    if (options.includeCategory) {
      include.category = {
        select: { id: true, name: true, color: true, icon: true },
      };
    }

    if (options.includeDocuments) {
      include.documents = {
        include: {
          document: {
            select: {
              id: true,
              title: true,
              fileName: true,
              fileSize: true,
              mimeType: true,
              type: true,
              filePath: true,
            },
          },
        },
        orderBy: { order: "asc" },
      };
    }

    if (options.includeFormResponses) {
      include.formResponses = {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      };
    }

    return include;
  }

  // ========================================
  // FORM RESPONSE MANAGEMENT
  // ========================================

  /**
   * Save or update form response for content
   */
  async saveFormResponse(
    resourceId: string,
    userId: string,
    formData: any,
    isComplete: boolean = false,
  ) {
    try {
      const data = {
        resourceId: resourceId,
        userId,
        formData,
        completedAt: isComplete ? new Date() : null,
        updatedAt: new Date(),
      };

      // Use upsert to handle both create and update
      const response = await this.prisma.resourceFormResponse.upsert({
        where: {
          resourceId_userId: {
            resourceId: resourceId,
            userId,
          },
        },
        create: data,
        update: data,
        include: {
          resource: {
            select: {
              id: true,
              title: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return response;
    } catch (error) {
      console.error("Error saving form response:", error);
      throw new Error(
        `Failed to save form response: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Save form response on behalf of a member (proxy completion)
   */
  async saveFormResponseOnBehalf(
    resourceId: string,
    memberId: string,
    completerId: string,
    formData: any,
    isComplete: boolean,
  ) {
    try {
      return await this.prisma.resourceFormResponse.upsert({
        where: { resourceId_userId: { resourceId, userId: memberId } },
        create: {
          resourceId,
          userId: memberId,
          completedBy: completerId,
          formData,
          completedAt: isComplete ? new Date() : null,
        },
        update: {
          completedBy: completerId,
          formData,
          completedAt: isComplete ? new Date() : null,
        },
      });
    } catch (error) {
      console.error("Error saving form response on behalf:", error);
      throw new Error(
        `Failed to save form response on behalf: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get form response for specific user and content
   */
  async getFormResponse(resourceId: string, userId: string) {
    try {
      return await this.prisma.resourceFormResponse.findUnique({
        where: {
          resourceId_userId: {
            resourceId: resourceId,
            userId,
          },
        },
        include: {
          resource: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error fetching form response:", error);
      throw new Error(
        `Failed to fetch form response: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get all form responses for a specific content (admin/volunteer view)
   */
  async getContentFormResponses(
    resourceId: string,
    userRole: UserRole,
    requesterId: string,
    options: {
      completed?: boolean;
      includeUser?: boolean;
    } = {},
  ) {
    try {
      // Build where clause with role-based filtering
      const where: any = { resourceId };

      if (options.completed !== undefined) {
        where.completedAt = options.completed ? { not: null } : null;
      }

      // VOLUNTEER role restriction: only see responses from families they created
      if (userRole === UserRole.VOLUNTEER) {
        const familyIds = await this.getUserCreatedFamilyIds(requesterId);
        where.user = {
          familyId: { in: familyIds },
        };
      }

      return await this.prisma.resourceFormResponse.findMany({
        where,
        include: {
          user: options.includeUser
            ? {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  familyId: true,
                },
              }
            : false,
          resource: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });
    } catch (error) {
      console.error("Error fetching content form responses:", error);
      throw new Error(
        `Failed to fetch content form responses: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get user's form responses (member view)
   */
  async getUserFormResponses(
    userId: string,
    options: {
      completed?: boolean;
      resourceType?: ResourceType[];
      tags?: string[];
    } = {},
  ) {
    try {
      const where: any = { userId };

      if (options.completed !== undefined) {
        where.completedAt = options.completed ? { not: null } : null;
      }

      // Filter by resource type or tags if specified
      if (options.resourceType?.length || options.tags?.length) {
        where.resource = {};

        if (options.resourceType?.length) {
          where.resource.resourceType = { in: options.resourceType };
        }

        if (options.tags?.length) {
          where.resource.tags = { hasSome: options.tags };
        }
      }

      return await this.prisma.resourceFormResponse.findMany({
        where,
        include: {
          resource: {
            select: {
              id: true,
              title: true,
              description: true,
              resourceType: true,
              tags: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });
    } catch (error) {
      console.error("Error fetching user form responses:", error);
      throw new Error(
        `Failed to fetch user form responses: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Delete form response
   */
  async deleteFormResponse(resourceId: string, userId: string) {
    try {
      return await this.prisma.resourceFormResponse.delete({
        where: {
          resourceId_userId: {
            resourceId: resourceId,
            userId,
          },
        },
      });
    } catch (error) {
      console.error("Error deleting form response:", error);
      throw new Error(
        `Failed to delete form response: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get form completion statistics for content
   */
  async getFormCompletionStats(
    resourceId: string,
    userRole: UserRole,
    requesterId: string,
  ) {
    try {
      const whereClause: any = { resourceId };

      // VOLUNTEER role restriction
      if (userRole === UserRole.VOLUNTEER) {
        const familyIds = await this.getUserCreatedFamilyIds(requesterId);
        whereClause.user = {
          familyId: { in: familyIds },
        };
      }

      const [total, completed, inProgress] = await Promise.all([
        this.prisma.resourceFormResponse.count({ where: whereClause }),
        this.prisma.resourceFormResponse.count({
          where: { ...whereClause, completedAt: { not: null } },
        }),
        this.prisma.resourceFormResponse.count({
          where: { ...whereClause, completedAt: null },
        }),
      ]);

      return {
        total,
        completed,
        inProgress,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    } catch (error) {
      console.error("Error fetching form completion stats:", error);
      throw new Error(
        `Failed to fetch form completion stats: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get family IDs created by a volunteer user
   * Private helper method for volunteer family-scoped restrictions
   */
  private async getUserCreatedFamilyIds(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        createdFamilies: {
          select: { id: true },
        },
      },
    });

    return user?.createdFamilies.map((family) => family.id) || [];
  }

  /**
   * Get content with form completion status for user
   */
  async getContentWithFormStatus(
    resourceId: string,
    userId: string,
    userRole: UserRole,
    requesterId?: string,
  ) {
    try {
      // Get content with basic info
      const content = await this.findById(resourceId, userId, userRole);

      if (!content) {
        throw new Error("Content not found");
      }

      // Get form response if exists
      const formResponse = await this.getFormResponse(resourceId, userId);

      return {
        ...content,
        formResponse: formResponse
          ? {
              id: formResponse.id,
              formData: formResponse.formData,
              completedAt: formResponse.completedAt,
              updatedAt: formResponse.updatedAt,
              isComplete: Boolean(formResponse.completedAt),
            }
          : null,
        hasFormResponse: Boolean(formResponse),
        isFormComplete: Boolean(formResponse?.completedAt),
      };
    } catch (error) {
      console.error("Error fetching content with form status:", error);
      throw new Error(
        `Failed to fetch content with form status: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

export { ResourceRepository };
