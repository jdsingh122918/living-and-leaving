"use client";

import { useState, useEffect, useCallback } from "react";
import { UserRole } from "@prisma/client";
import { Plus, Search, Filter, BookOpen, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResourceCard } from "./resource-card";
import { ResourceFilters } from "./resource-filters";
import { ResourceTableView } from "./resource-table-view";
import { AssignTemplateModal } from "./assign-template-modal";

interface Resource {
  id: string;
  title: string;
  description: string;
  content: string;
  type: string;
  visibility: string;
  familyId?: string;
  family?: {
    id: string;
    name: string;
  };
  categoryId?: string;
  category?: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
  tags: string[];
  externalUrl?: string;
  attachments: string[];
  externalMeta?: Record<string, unknown>; // For template metadata
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  documents: Array<{ id: string; name: string; url: string }>;
}

interface ResourcesResponse {
  resources: Resource[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  filters: Record<string, unknown>;
}

interface ResourcesPageContentProps {
  userRole: UserRole;
  userId: string;
}

export function ResourcesPageContent({ userRole, userId: _userId }: ResourcesPageContentProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedContentFilter, setSelectedContentFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [assignModalResource, setAssignModalResource] = useState<{
    id: string;
    title: string;
    description: string;
  } | null>(null);

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Handle content filter to API parameters
      const contentFilterParams: Record<string, string> = {};
      if (selectedContentFilter === "templates") {
        contentFilterParams.isTemplate = "true";
      } else if (selectedContentFilter === "resources") {
        contentFilterParams.isTemplate = "false";
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sortBy,
        sortOrder,
        includeCreator: 'true',
        ...contentFilterParams,
        ...(searchQuery && { search: searchQuery }),
        ...(selectedCategory !== "all" && { categoryId: selectedCategory }),
        ...(selectedType !== "all" && { type: selectedType }),
      });

      const response = await fetch(`/api/resources?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error("Failed to fetch resources");
      }

      const data: ResourcesResponse = await response.json();
      setResources(data.resources);
      setTotalPages(Math.ceil(data.total / data.limit));
    } catch (error) {
      console.error("Error fetching resources:", error);
      setError("Failed to load resources");
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, selectedCategory, selectedType, selectedContentFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // Load view mode preference from localStorage after hydration
  useEffect(() => {
    const savedViewMode = localStorage.getItem("resources-view-mode") as "grid" | "table" | null;
    if (savedViewMode && (savedViewMode === "grid" || savedViewMode === "table")) {
      setViewMode(savedViewMode);
    }
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1);
  }, []);

  const handleFilterChange = useCallback((filters: Record<string, string>) => {
    setSelectedCategory(filters.category || "all");
    setSelectedType(filters.type || "all");
    setSelectedContentFilter(filters.contentFilter || "all");
    setSortBy(filters.sortBy || "createdAt");
    setSortOrder(filters.sortOrder || "desc");
    setPage(1);
  }, []);

  const handleViewModeChange = useCallback((mode: "grid" | "table") => {
    setViewMode(mode);
    localStorage.setItem("resources-view-mode", mode);
  }, []);

  const handleAssign = useCallback((resourceId: string, title: string, description: string) => {
    setAssignModalResource({ id: resourceId, title, description });
  }, []);

  const canCreateResources = userRole === UserRole.ADMIN || userRole === UserRole.VOLUNTEER;

  return (
    <div data-testid="resources-page" className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-xl font-semibold">Resources Library</h1>
            <p className="text-sm text-muted-foreground">
              Discover curated resources
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canCreateResources && (
            <Link href={`/${userRole.toLowerCase()}/resources/new`}>
              <Button data-testid="create-resource-button" size="sm" className="min-h-[44px]">
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                data-testid="search-input"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 min-h-[44px]"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="min-h-[44px]"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <ResourceFilters
              selectedCategory={selectedCategory}
              selectedType={selectedType}
              selectedContentFilter={selectedContentFilter}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onChange={handleFilterChange}
            />
          )}
        </div>
      </Card>

      {/* Content */}
      <div className="space-y-4">
        {/* Results Summary */}
        {!loading && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {resources.length} resources found
              {searchQuery && ` for "${searchQuery}"`}
            </span>
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex items-center border rounded-md">
                <Button
                  data-testid="view-toggle-grid"
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 px-2 rounded-r-none"
                  onClick={() => handleViewModeChange("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="sr-only">Grid view</span>
                </Button>
                <Button
                  data-testid="view-toggle-table"
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 px-2 rounded-l-none"
                  onClick={() => handleViewModeChange("table")}
                >
                  <List className="h-4 w-4" />
                  <span className="sr-only">Table view</span>
                </Button>
              </div>
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [newSortBy, newSortOrder] = value.split('-');
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
                setPage(1);
              }}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                  <SelectItem value="title-asc">Title A-Z</SelectItem>
                  <SelectItem value="title-desc">Title Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && viewMode === "grid" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-4">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {loading && viewMode === "table" && (
          <Card className="p-4">
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-4 bg-muted rounded w-1/3 hidden md:block" />
                  <div className="h-4 bg-muted rounded w-20 hidden sm:block" />
                  <div className="h-4 bg-muted rounded w-8" />
                  <div className="h-4 bg-muted rounded w-8" />
                </div>
              ))}
            </div>
          </Card>
        )}

        {error && (
          <Card className="p-4">
            <div className="text-center text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{error}</p>
              <Button variant="outline" onClick={fetchResources} className="mt-2">
                Try Again
              </Button>
            </div>
          </Card>
        )}

        {!loading && !error && resources.length === 0 && (
          <Card data-testid="empty-state" className="p-4">
            <div className="text-center text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No resources found</p>
              {canCreateResources && (
                <Link href={`/${userRole.toLowerCase()}/resources/new`}>
                  <Button variant="outline" className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Resource
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        )}

        {!loading && !error && resources.length > 0 && (
          <>
            {viewMode === "grid" ? (
              <div data-testid="resources-grid" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {resources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    userRole={userRole}
                    showActions={userRole === UserRole.ADMIN}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <ResourceTableView
                  resources={resources}
                  userRole={userRole}
                  onAssign={handleAssign}
                />
              </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Assign Template Modal */}
      {assignModalResource && (
        <AssignTemplateModal
          open={!!assignModalResource}
          onOpenChange={(open) => {
            if (!open) setAssignModalResource(null);
          }}
          resourceId={assignModalResource.id}
          resourceTitle={assignModalResource.title}
          resourceDescription={assignModalResource.description}
        />
      )}
    </div>
  );
}