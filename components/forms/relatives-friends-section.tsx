'use client';

/**
 * Relatives & Friends Section Component
 * Renders the dynamic list of other relatives or friends close to the child
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import { RelativeFriendCard, RelativeFriendEntry, createEmptyRelativeFriend } from './relatives-friends-card';

interface RelativesFriendsSectionProps {
  people: RelativeFriendEntry[];
  onAddPerson: () => void;
  onUpdatePerson: (index: number, person: RelativeFriendEntry) => void;
  onRemovePerson: (index: number) => void;
  readOnly?: boolean;
}

export function RelativesFriendsSection({
  people,
  onAddPerson,
  onUpdatePerson,
  onRemovePerson,
  readOnly = false,
}: RelativesFriendsSectionProps) {
  const hasPeople = people.length > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Other Relatives or Friends
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Other relatives or friends that are close to my child:
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Empty state - show add button */}
        {!hasPeople && !readOnly && (
          <button
            type="button"
            onClick={onAddPerson}
            className="w-full border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 hover:border-primary/50 hover:bg-accent/50 transition-colors cursor-pointer group"
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-primary">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-5 w-5" />
              </div>
              <span className="font-medium">+ ADD RELATIVE/FRIEND</span>
              <span className="text-sm">
                Add a relative or friend who is close to your child
              </span>
            </div>
          </button>
        )}

        {/* Read-only empty state */}
        {!hasPeople && readOnly && (
          <p className="text-sm text-muted-foreground italic">
            No relatives or friends have been added.
          </p>
        )}

        {/* People cards */}
        {hasPeople && (
          <div className="space-y-4">
            {people.map((person, index) => (
              <RelativeFriendCard
                key={person.id}
                person={person}
                index={index}
                onChange={(updated) => onUpdatePerson(index, updated)}
                onRemove={() => onRemovePerson(index)}
                readOnly={readOnly}
              />
            ))}

            {/* Add/Remove buttons row */}
            {!readOnly && (
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="default"
                  onClick={onAddPerson}
                  className="min-h-[44px] bg-teal-600 hover:bg-teal-700"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  + ADD RELATIVE/FRIEND
                </Button>
                {people.length > 0 && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => onRemovePerson(people.length - 1)}
                    className="min-h-[44px]"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    - REMOVE RELATIVE/FRIEND
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

export { createEmptyRelativeFriend };
export type { RelativeFriendEntry };
