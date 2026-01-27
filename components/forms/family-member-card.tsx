'use client';

/**
 * Family Member Form Card Component
 * A reusable card for entering one family member's contact information
 */

import React, { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, User } from 'lucide-react';

export interface FamilyMemberEntry {
  id: string;
  name: string;
  relationship: string;
  age: string;
  email: string;
  phone: string;
}

// Relationship options for the dropdown
export const RELATIONSHIP_OPTIONS = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'stepfather', label: 'Stepfather' },
  { value: 'stepmother', label: 'Stepmother' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'cousin', label: 'Cousin' },
  { value: 'foster_parent', label: 'Foster Parent' },
  { value: 'legal_guardian', label: 'Legal Guardian' },
  { value: 'caregiver', label: 'Caregiver' },
  { value: 'other', label: 'Other' },
];

interface FamilyMemberCardProps {
  member: FamilyMemberEntry;
  index: number;
  onChange: (member: FamilyMemberEntry) => void;
  onRemove: () => void;
  readOnly?: boolean;
}

export function FamilyMemberCard({
  member,
  index,
  onChange,
  onRemove,
  readOnly = false,
}: FamilyMemberCardProps) {
  const updateField = useCallback(
    (field: keyof FamilyMemberEntry, value: string) => {
      if (readOnly) return;
      onChange({ ...member, [field]: value });
    },
    [member, onChange, readOnly]
  );

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Family Member #{index + 1}
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
              <span className="sr-only">Remove family member</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor={`${member.id}-name`} className="text-sm font-medium">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`${member.id}-name`}
              value={member.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Enter full name"
              readOnly={readOnly}
              className={readOnly ? 'bg-gray-50' : ''}
            />
          </div>

          {/* Relationship - Dropdown */}
          <div className="space-y-2">
            <Label htmlFor={`${member.id}-relationship`} className="text-sm font-medium">
              Relationship of Parent/Legal Guardian to Child <span className="text-red-500">*</span>
            </Label>
            {readOnly ? (
              <Input
                id={`${member.id}-relationship`}
                value={RELATIONSHIP_OPTIONS.find(o => o.value === member.relationship)?.label || member.relationship}
                readOnly
                className="bg-gray-50"
              />
            ) : (
              <Select
                value={member.relationship}
                onValueChange={(value) => updateField('relationship', value)}
              >
                <SelectTrigger id={`${member.id}-relationship`} className="min-h-[44px]">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Age if minor */}
          <div className="space-y-2">
            <Label htmlFor={`${member.id}-age`} className="text-sm font-medium">
              Age if minor
            </Label>
            <Input
              id={`${member.id}-age`}
              value={member.age}
              onChange={(e) => updateField('age', e.target.value)}
              placeholder="Enter age"
              readOnly={readOnly}
              className={readOnly ? 'bg-gray-50' : ''}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor={`${member.id}-email`} className="text-sm font-medium">
              Email
            </Label>
            <Input
              id={`${member.id}-email`}
              value={member.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="email@example.com"
              readOnly={readOnly}
              className={readOnly ? 'bg-gray-50' : ''}
            />
          </div>
        </div>

        {/* Phone - full width */}
        <div className="space-y-2">
          <Label htmlFor={`${member.id}-phone`} className="text-sm font-medium">
            Phone Number
          </Label>
          <Input
            id={`${member.id}-phone`}
            value={member.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="+1 (555) 555-5555"
            readOnly={readOnly}
            className={readOnly ? 'bg-gray-50' : ''}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Helper to create an empty family member entry
export function createEmptyFamilyMember(): FamilyMemberEntry {
  return {
    id: `family-member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: '',
    relationship: '',
    age: '',
    email: '',
    phone: '',
  };
}
