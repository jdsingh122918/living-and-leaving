'use client';

/**
 * Relative/Friend Form Card Component
 * A reusable card for entering one relative or friend's contact information
 */

import React, { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, UserCircle } from 'lucide-react';

export interface RelativeFriendEntry {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
}

interface RelativeFriendCardProps {
  person: RelativeFriendEntry;
  index: number;
  onChange: (person: RelativeFriendEntry) => void;
  onRemove: () => void;
  readOnly?: boolean;
}

export function RelativeFriendCard({
  person,
  index,
  onChange,
  onRemove,
  readOnly = false,
}: RelativeFriendCardProps) {
  const updateField = useCallback(
    (field: keyof RelativeFriendEntry, value: string) => {
      if (readOnly) return;
      onChange({ ...person, [field]: value });
    },
    [person, onChange, readOnly]
  );

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-primary" />
            Relative/Friend #{index + 1}
          </CardTitle>
          {!readOnly && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              onMouseDown={(e) => e.preventDefault()}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove relative/friend</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor={`${person.id}-name`} className="text-sm font-medium">
              Full Name
            </Label>
            <Input
              id={`${person.id}-name`}
              value={person.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Enter full name"
              readOnly={readOnly}
              className={readOnly ? 'bg-gray-50' : ''}
            />
          </div>

          {/* Relationship */}
          <div className="space-y-2">
            <Label htmlFor={`${person.id}-relationship`} className="text-sm font-medium">
              Relationship
            </Label>
            <Input
              id={`${person.id}-relationship`}
              value={person.relationship}
              onChange={(e) => updateField('relationship', e.target.value)}
              placeholder="e.g., Aunt, Uncle, Family Friend"
              readOnly={readOnly}
              className={readOnly ? 'bg-gray-50' : ''}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor={`${person.id}-phone`} className="text-sm font-medium">
              Phone Number
            </Label>
            <Input
              id={`${person.id}-phone`}
              value={person.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="+1 (555) 555-5555"
              readOnly={readOnly}
              className={readOnly ? 'bg-gray-50' : ''}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor={`${person.id}-email`} className="text-sm font-medium">
              Email
            </Label>
            <Input
              id={`${person.id}-email`}
              value={person.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="email@example.com"
              readOnly={readOnly}
              className={readOnly ? 'bg-gray-50' : ''}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper to create an empty relative/friend entry
export function createEmptyRelativeFriend(): RelativeFriendEntry {
  return {
    id: `relative-friend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: '',
    relationship: '',
    phone: '',
    email: '',
  };
}
