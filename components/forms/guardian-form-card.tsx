'use client';

/**
 * Guardian Form Card Component
 * A reusable card for entering one guardian's contact information
 */

import React, { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, User } from 'lucide-react';

export interface GuardianEntry {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  address: string;
  email: string;
}

interface GuardianFormCardProps {
  guardian: GuardianEntry;
  index: number;
  onChange: (guardian: GuardianEntry) => void;
  onRemove: () => void;
  readOnly?: boolean;
}

export function GuardianFormCard({
  guardian,
  index,
  onChange,
  onRemove,
  readOnly = false,
}: GuardianFormCardProps) {
  const updateField = useCallback(
    (field: keyof GuardianEntry, value: string) => {
      if (readOnly) return;
      onChange({ ...guardian, [field]: value });
    },
    [guardian, onChange, readOnly]
  );

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Additional Guardian #{index + 1}
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
              <span className="sr-only">Remove guardian</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor={`${guardian.id}-name`} className="text-sm font-medium">
              Full Name
            </Label>
            <Input
              id={`${guardian.id}-name`}
              value={guardian.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Enter full legal name"
              readOnly={readOnly}
              className={readOnly ? 'bg-gray-50' : ''}
            />
          </div>

          {/* Relationship */}
          <div className="space-y-2">
            <Label htmlFor={`${guardian.id}-relationship`} className="text-sm font-medium">
              Relationship to Child
            </Label>
            <Input
              id={`${guardian.id}-relationship`}
              value={guardian.relationship}
              onChange={(e) => updateField('relationship', e.target.value)}
              placeholder="e.g., Mother, Father, Grandparent"
              readOnly={readOnly}
              className={readOnly ? 'bg-gray-50' : ''}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor={`${guardian.id}-phone`} className="text-sm font-medium">
              Telephone Number
            </Label>
            <Input
              id={`${guardian.id}-phone`}
              value={guardian.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="(555) 555-5555"
              readOnly={readOnly}
              className={readOnly ? 'bg-gray-50' : ''}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor={`${guardian.id}-email`} className="text-sm font-medium">
              Email Address
            </Label>
            <Input
              id={`${guardian.id}-email`}
              value={guardian.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="email@example.com"
              readOnly={readOnly}
              className={readOnly ? 'bg-gray-50' : ''}
            />
          </div>
        </div>

        {/* Address - full width */}
        <div className="space-y-2">
          <Label htmlFor={`${guardian.id}-address`} className="text-sm font-medium">
            Address
          </Label>
          <Textarea
            id={`${guardian.id}-address`}
            value={guardian.address}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="Street Address&#10;City, State ZIP"
            readOnly={readOnly}
            className={`min-h-[80px] ${readOnly ? 'bg-gray-50' : ''}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Helper to create an empty guardian entry
export function createEmptyGuardian(): GuardianEntry {
  return {
    id: `guardian-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: '',
    relationship: '',
    phone: '',
    address: '',
    email: '',
  };
}
