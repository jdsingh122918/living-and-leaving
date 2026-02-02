"use client";

import { UserRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Eye, Send, User, Tag, MoreVertical } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getResourceTypeIcon, isTemplate } from "@/lib/utils/resource-utils";

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
  externalMeta?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    role: string;
  };
  documents: Array<{ id: string; name: string; url: string }>;
}

interface ResourceTableViewProps {
  resources: Resource[];
  userRole: UserRole;
  onAssign: (resourceId: string, title: string, description: string) => void;
}

export function ResourceTableView({
  resources,
  userRole,
  onAssign,
}: ResourceTableViewProps) {
  const router = useRouter();

  const handleRowClick = (resourceId: string) => {
    router.push(`/${userRole.toLowerCase()}/resources/${resourceId}`);
  };

  const getCreatorDisplay = (resource: Resource) => {
    if ((resource.externalMeta as { systemGenerated?: boolean } | undefined)?.systemGenerated) {
      return (
        <span className="text-purple-600 dark:text-purple-400 font-medium">
          System
        </span>
      );
    }
    if (resource.creator) {
      const name =
        resource.creator.firstName || resource.creator.lastName
          ? `${resource.creator.firstName || ""} ${resource.creator.lastName || ""}`.trim()
          : resource.creator.email.split("@")[0];
      return <span>{name}</span>;
    }
    return <span className="text-muted-foreground">Unknown</span>;
  };

  const canAssign = () => {
    return userRole === UserRole.ADMIN || userRole === UserRole.VOLUNTEER;
  };

  return (
    <Table className="table-fixed sm:table-auto">
      <TableHeader>
        <TableRow>
          <TableHead className="w-auto">Name</TableHead>
          <TableHead className="hidden lg:table-cell w-[300px]">
            Brief Overview
          </TableHead>
          <TableHead className="hidden md:table-cell w-[120px]">Author</TableHead>
          <TableHead className="hidden sm:table-cell w-[80px]">Preview</TableHead>
          <TableHead className="hidden sm:table-cell w-[80px]">Share</TableHead>
          <TableHead className="sm:hidden w-[48px]">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {resources.map((resource) => {
          const isTemplateResource = isTemplate(resource);
          const TypeIcon = getResourceTypeIcon(resource.type, isTemplateResource);

          return (
            <TableRow
              key={resource.id}
              className="cursor-pointer active:bg-muted/70"
              onClick={() => handleRowClick(resource.id)}
            >
              {/* Name Column */}
              <TableCell className="whitespace-normal">
                <div className="flex items-center gap-2">
                  <TypeIcon className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm line-clamp-2 sm:line-clamp-1">
                      {resource.title}
                    </div>
                    {isTemplateResource && (
                      <Badge
                        variant="secondary"
                        className="mt-1 bg-[hsl(var(--brand-primary)/0.1)] text-[hsl(var(--brand-primary))] border-[hsl(var(--brand-primary)/0.3)]"
                      >
                        Template
                      </Badge>
                    )}
                  </div>
                </div>
              </TableCell>

              {/* Brief Overview Column */}
              <TableCell className="hidden lg:table-cell">
                <div className="space-y-1">
                  {resource.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 whitespace-normal max-w-[300px]">
                      {resource.description}
                    </p>
                  )}
                  {resource.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
                      {resource.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {resource.tags.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{resource.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </TableCell>

              {/* Author Column */}
              <TableCell className="hidden md:table-cell">
                <div className="flex items-center gap-1 text-sm">
                  <User className="h-3 w-3 text-muted-foreground" />
                  {getCreatorDisplay(resource)}
                </div>
              </TableCell>

              {/* Preview Column - hidden on mobile */}
              <TableCell className="hidden sm:table-cell">
                <Button
                  variant="default"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRowClick(resource.id);
                  }}
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">Preview</span>
                </Button>
              </TableCell>

              {/* Assign Column - hidden on mobile */}
              <TableCell className="hidden sm:table-cell">
                {canAssign() ? (
                  <Button
                    variant="default"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAssign(resource.id, resource.title, resource.description);
                    }}
                  >
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Share</span>
                  </Button>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>

              {/* Mobile Actions Column */}
              <TableCell className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(resource.id);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    {canAssign() && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onAssign(resource.id, resource.title, resource.description);
                        }}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
