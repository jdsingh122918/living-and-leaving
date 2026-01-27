'use client';

/**
 * Family Members Section Component
 * Renders the dynamic list of family members living in the home with the child
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Home } from 'lucide-react';
import { FamilyMemberCard, FamilyMemberEntry, createEmptyFamilyMember } from './family-member-card';

interface FamilyMembersSectionProps {
  members: FamilyMemberEntry[];
  onAddMember: () => void;
  onUpdateMember: (index: number, member: FamilyMemberEntry) => void;
  onRemoveMember: (index: number) => void;
  readOnly?: boolean;
}

export function FamilyMembersSection({
  members,
  onAddMember,
  onUpdateMember,
  onRemoveMember,
  readOnly = false,
}: FamilyMembersSectionProps) {
  const hasMembers = members.length > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Home className="h-5 w-5 text-primary" />
          People Living in the Home
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          The following are the people that live in the home with my child:
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Empty state - show add button */}
        {!hasMembers && !readOnly && (
          <button
            type="button"
            onClick={onAddMember}
            className="w-full border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 hover:border-primary/50 hover:bg-accent/50 transition-colors cursor-pointer group"
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-primary">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-5 w-5" />
              </div>
              <span className="font-medium">+ ADD FAMILY MEMBER</span>
              <span className="text-sm">
                Add a family member who lives in the home with your child
              </span>
            </div>
          </button>
        )}

        {/* Read-only empty state */}
        {!hasMembers && readOnly && (
          <p className="text-sm text-muted-foreground italic">
            No family members have been added.
          </p>
        )}

        {/* Family member cards */}
        {hasMembers && (
          <div className="space-y-4">
            {members.map((member, index) => (
              <FamilyMemberCard
                key={member.id}
                member={member}
                index={index}
                onChange={(updated) => onUpdateMember(index, updated)}
                onRemove={() => onRemoveMember(index)}
                readOnly={readOnly}
              />
            ))}

            {/* Add/Remove buttons row */}
            {!readOnly && (
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="default"
                  onClick={onAddMember}
                  className="min-h-[44px] bg-teal-600 hover:bg-teal-700"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  + ADD FAMILY MEMBER
                </Button>
                {members.length > 0 && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => onRemoveMember(members.length - 1)}
                    className="min-h-[44px]"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    - REMOVE FAMILY MEMBER
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { createEmptyFamilyMember };
export type { FamilyMemberEntry };
