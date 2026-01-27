'use client';

/**
 * Additional Guardians Section Component
 * Renders the "Add additional guardian" UI with dynamic guardian entries
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Users } from 'lucide-react';
import { GuardianFormCard, GuardianEntry, createEmptyGuardian } from './guardian-form-card';

interface AdditionalGuardiansSectionProps {
  guardians: GuardianEntry[];
  notes: string;
  onAddGuardian: () => void;
  onUpdateGuardian: (index: number, guardian: GuardianEntry) => void;
  onRemoveGuardian: (index: number) => void;
  onNotesChange: (notes: string) => void;
  readOnly?: boolean;
}

export function AdditionalGuardiansSection({
  guardians,
  notes,
  onAddGuardian,
  onUpdateGuardian,
  onRemoveGuardian,
  onNotesChange,
  readOnly = false,
}: AdditionalGuardiansSectionProps) {
  const hasGuardians = guardians.length > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Additional Parent/Legal Guardian(s)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          If there are other individuals with legal authority to make medical decisions for this child, add their information below.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Empty state - show add button */}
        {!hasGuardians && !readOnly && (
          <button
            type="button"
            onClick={onAddGuardian}
            className="w-full border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 hover:border-primary/50 hover:bg-accent/50 transition-colors cursor-pointer group"
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-primary">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-5 w-5" />
              </div>
              <span className="font-medium">Add additional guardian</span>
              <span className="text-sm">
                Add another parent or legal guardian with medical decision-making authority
              </span>
            </div>
          </button>
        )}

        {/* Read-only empty state */}
        {!hasGuardians && readOnly && (
          <p className="text-sm text-muted-foreground italic">
            No additional guardians have been added.
          </p>
        )}

        {/* Guardian cards */}
        {hasGuardians && (
          <div className="space-y-4">
            {guardians.map((guardian, index) => (
              <GuardianFormCard
                key={guardian.id}
                guardian={guardian}
                index={index}
                onChange={(updated) => onUpdateGuardian(index, updated)}
                onRemove={() => onRemoveGuardian(index)}
                readOnly={readOnly}
              />
            ))}

            {/* Add another guardian button */}
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                onClick={onAddGuardian}
                className="w-full min-h-[44px]"
                onMouseDown={(e) => e.preventDefault()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add another guardian
              </Button>
            )}
          </div>
        )}

        {/* Additional notes field */}
        <div className="space-y-2 pt-4 border-t">
          <Label htmlFor="additional-guardians-notes" className="text-sm font-medium">
            Additional Notes About Guardianship
          </Label>
          <Textarea
            id="additional-guardians-notes"
            value={notes}
            onChange={(e) => !readOnly && onNotesChange(e.target.value)}
            placeholder="Any additional information about guardianship arrangements, custody agreements, or special circumstances..."
            readOnly={readOnly}
            className={`min-h-[100px] ${readOnly ? 'bg-gray-50' : ''}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export { createEmptyGuardian };
export type { GuardianEntry };
