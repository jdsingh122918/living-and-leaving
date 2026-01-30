"use client";

import { UserRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ExternalLink,
  Star,
  Calendar,
  User,
  Tag,
  FileText,
  Video,
  Image as ImageIcon,
  Headphones,
  Link as LinkIcon,
  Wrench,
  Phone,
  Briefcase,
  ScrollText,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { getResourceTypeIcon, isTemplate } from "@/lib/utils/resource-utils";

interface Resource {
  id: string;
  title: string;
  description: string;
  content: string;
  type: string;
  visibility: string;
  status: string;
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
  isFeatured: boolean;
  isApproved: boolean;
  averageRating: number;
  totalRatings: number;
  totalViews: number;
  totalShares: number;
  totalBookmarks: number;
  externalMeta?: any; // For template metadata
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    role: string;
  };
  userRating?: number;
  userBookmark: boolean;
  documents: any[];
}

interface ResourceCardProps {
  resource: Resource;
  userRole: UserRole;
  showActions?: boolean;
}


const getStatusColor = (status: string, isFeatured: boolean) => {
  if (isFeatured) return "bg-[hsl(var(--brand-accent)/0.1)] text-[hsl(var(--brand-accent))] border-[hsl(var(--brand-accent)/0.3)]";
  switch (status) {
    case 'APPROVED':
      return "bg-[hsl(var(--brand-accent)/0.1)] text-[hsl(var(--brand-accent))] border-[hsl(var(--brand-accent)/0.3)]";
    case 'PENDING':
      return "bg-[hsl(var(--brand-primary-light)/0.1)] text-[hsl(var(--brand-primary-light))] border-[hsl(var(--brand-primary-light)/0.3)]";
    case 'DRAFT':
      return "bg-[hsl(var(--brand-deep)/0.1)] text-[hsl(var(--brand-deep))] border-[hsl(var(--brand-deep)/0.3)]";
    case 'REJECTED':
      return "bg-[hsl(var(--brand-muted)/0.1)] text-[hsl(var(--brand-muted))] border-[hsl(var(--brand-muted)/0.3)]";
    default:
      return "bg-[hsl(var(--brand-deep)/0.1)] text-[hsl(var(--brand-deep))] border-[hsl(var(--brand-deep)/0.3)]";
  }
};

const getResourceCardColors = (resource: Resource) => {
  // Priority 0: Templates (highest priority) - Use subtle styling for legibility
  const resourceIsTemplate = isTemplate(resource);
  if (resourceIsTemplate) {
    return {
      border: 'border-l-[var(--brand-primary)]',
      background: 'bg-background dark:bg-background',
      hover: 'hover:bg-accent/50 dark:hover:bg-accent/50'
    };
  }

  // Priority 1: Healthcare tags
  if (resource.tags && resource.tags.length > 0) {
    const tag = resource.tags[0].toLowerCase();
    if (tag.includes('medical') || tag.includes('health')) {
      return {
        border: 'border-l-[var(--healthcare-medical)]',
        background: 'bg-pink-50 dark:bg-pink-950/20',
        hover: 'hover:bg-pink-100 dark:hover:bg-pink-950/30'
      };
    }
    if (tag.includes('mental')) {
      return {
        border: 'border-l-[var(--healthcare-mental)]',
        background: 'bg-purple-50 dark:bg-purple-950/20',
        hover: 'hover:bg-purple-100 dark:hover:bg-purple-950/30'
      };
    }
    if (tag.includes('home') || tag.includes('community')) {
      return {
        border: 'border-l-[var(--healthcare-home)]',
        background: 'bg-teal-50 dark:bg-teal-950/20',
        hover: 'hover:bg-teal-100 dark:hover:bg-teal-950/30'
      };
    }
    if (tag.includes('equipment') || tag.includes('technology') || tag.includes('tool')) {
      return {
        border: 'border-l-[var(--healthcare-equipment)]',
        background: 'bg-blue-50 dark:bg-blue-950/20',
        hover: 'hover:bg-blue-100 dark:hover:bg-blue-950/30'
      };
    }
    if (tag.includes('basic') || tag.includes('resources') || tag.includes('support')) {
      return {
        border: 'border-l-[var(--healthcare-basic)]',
        background: 'bg-orange-50 dark:bg-orange-950/20',
        hover: 'hover:bg-orange-100 dark:hover:bg-orange-950/30'
      };
    }
    if (tag.includes('education') || tag.includes('family') || tag.includes('training')) {
      return {
        border: 'border-l-[var(--healthcare-education)]',
        background: 'bg-blue-50 dark:bg-blue-950/20',
        hover: 'hover:bg-blue-100 dark:hover:bg-blue-950/30'
      };
    }
    if (tag.includes('legal') || tag.includes('advocacy')) {
      return {
        border: 'border-l-[var(--healthcare-legal)]',
        background: 'bg-gray-50 dark:bg-gray-950/20',
        hover: 'hover:bg-gray-100 dark:hover:bg-gray-950/30'
      };
    }
  }

  // Priority 2: Resource status (Featured > Approved > Pending > Others)
  if (resource.isFeatured) {
    return {
      border: 'border-l-[var(--brand-accent)]',
      background: 'bg-blue-50 dark:bg-blue-950/20',
      hover: 'hover:bg-blue-100 dark:hover:bg-blue-950/30'
    };
  }
  if (resource.status === 'APPROVED') {
    return {
      border: 'border-l-[var(--brand-accent)]',
      background: 'bg-teal-50 dark:bg-teal-950/20',
      hover: 'hover:bg-teal-100 dark:hover:bg-teal-950/30'
    };
  }
  if (resource.status === 'PENDING') {
    return {
      border: 'border-l-[var(--brand-primary-light)]',
      background: 'bg-orange-50 dark:bg-orange-950/20',
      hover: 'hover:bg-orange-100 dark:hover:bg-orange-950/30'
    };
  }

  // Priority 3: Resource type mapping to healthcare categories
  switch (resource.type) {
    case 'VIDEO':
    case 'AUDIO':
    case 'IMAGE':
      return {
        border: 'border-l-[var(--healthcare-education)]',
        background: 'bg-blue-50 dark:bg-blue-950/20',
        hover: 'hover:bg-blue-100 dark:hover:bg-blue-950/30'
      };
    case 'TOOL':
    case 'SERVICE':
      return {
        border: 'border-l-[var(--healthcare-equipment)]',
        background: 'bg-blue-50 dark:bg-blue-950/20',
        hover: 'hover:bg-blue-100 dark:hover:bg-blue-950/30'
      };
    case 'CONTACT':
      return {
        border: 'border-l-[var(--healthcare-basic)]',
        background: 'bg-orange-50 dark:bg-orange-950/20',
        hover: 'hover:bg-orange-100 dark:hover:bg-orange-950/30'
      };
    case 'DOCUMENT':
    case 'LINK':
    default:
      return {
        border: 'border-l-[var(--healthcare-home)]',
        background: 'bg-teal-50 dark:bg-teal-950/20',
        hover: 'hover:bg-teal-100 dark:hover:bg-teal-950/30'
      };
  }
};

export function ResourceCard({ resource, userRole, showActions = false }: ResourceCardProps) {
  const router = useRouter();

  const isTemplateResource = isTemplate(resource);
  const TypeIcon = getResourceTypeIcon(resource.type, isTemplateResource);
  const statusColor = getStatusColor(resource.status, resource.isFeatured);
  const cardColors = getResourceCardColors(resource);

  const handleCardClick = () => {
    router.push(`/${userRole.toLowerCase()}/resources/${resource.id}`);
  };

  return (
    <Card
      data-testid="resource-card"
      className={`h-[280px] flex flex-col p-3 border-l-4 transition-colors cursor-pointer ${cardColors.border} ${cardColors.background} ${cardColors.hover}`}
      onClick={handleCardClick}
    >
      <CardHeader className="space-y-2 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <TypeIcon className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 data-testid="resource-title" className="font-medium text-sm hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
                {resource.title}
              </h3>
            </div>
          </div>

        </div>

        {/* Single Priority Badge */}
        <div className="flex items-center gap-2">
          {isTemplateResource ? (
            <Badge data-testid="resource-type-badge" variant="secondary" className="bg-[hsl(var(--brand-primary)/0.1)] text-[hsl(var(--brand-primary))] border-[hsl(var(--brand-primary)/0.3)]">
              <ScrollText className="h-3 w-3 mr-1" />
              Template
            </Badge>
          ) : resource.isFeatured ? (
            <Badge data-testid="resource-type-badge" variant="secondary" className={statusColor}>
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          ) : resource.status !== 'APPROVED' ? (
            <Badge data-testid="resource-type-badge" variant="secondary" className={statusColor}>
              {resource.status}
            </Badge>
          ) : resource.category ? (
            <Badge data-testid="resource-type-badge" variant="outline" className="text-xs">
              {resource.category.name}
            </Badge>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 flex-1 overflow-y-auto">
        {/* Description */}
        {resource.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {resource.description}
          </p>
        )}

        {/* Tags */}
        {resource.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <Tag className="h-3 w-3 text-muted-foreground" />
            {resource.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {resource.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{resource.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Metrics */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {resource.averageRating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-current text-yellow-500" />
              <span>{resource.averageRating.toFixed(1)}</span>
              <span>({resource.totalRatings})</span>
            </div>
          )}
          {resource.externalUrl && (
            <div className="flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              <span>External</span>
            </div>
          )}
        </div>

        {/* Creator and Date */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {/* Show "System" for system-generated templates */}
            {resource.externalMeta?.systemGenerated ? (
              <span className="text-purple-600 font-medium">System</span>
            ) : (
              <span>
                {resource.creator
                  ? (resource.creator.firstName || resource.creator.lastName
                      ? `${resource.creator.firstName || ''} ${resource.creator.lastName || ''}`.trim()
                      : resource.creator.email.split('@')[0])
                  : 'Unknown'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDistanceToNow(new Date(resource.createdAt), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Actions */}
        {resource.externalUrl && (
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 px-2 text-xs"
            >
              <a href={resource.externalUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                Open
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}