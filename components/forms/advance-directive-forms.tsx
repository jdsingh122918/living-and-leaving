'use client';

/**
 * Interactive Form Components for Advance Directive Content
 * Provides rich form elements that can be embedded in content templates
 *
 * Enhanced with auto-save functionality and recovery system
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Save, Check, AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAutoSave } from '@/lib/utils/auto-save';
import { SaveStatusIndicator, FloatingSaveStatus } from '@/components/shared/save-status-indicator';
import { AdditionalGuardiansSection, createEmptyGuardian, GuardianEntry } from './additional-guardians-section';
import { FamilyMembersSection, createEmptyFamilyMember } from './family-member-section';
import { RelativesFriendsSection, createEmptyRelativeFriend } from './relatives-friends-section';

// Types for form data structure
export interface FormFieldData {
  id: string;
  type: 'checkbox' | 'radio' | 'text' | 'textarea' | 'contact' | 'medical' | 'checkbox-with-text' | 'checkbox-with-nested' | 'select';
  label: string;
  value?: string | string[] | boolean | Record<string, any>;
  required?: boolean;
  options?: string[] | NestedCheckboxOption[];
  placeholder?: string;
  // For checkbox-with-text: which options should show an explanation field
  showExplainFor?: string[];
  // For select fields
  selectOptions?: { value: string; label: string }[];
}

// For nested checkbox options (like in Feeding/Nutrition section)
export interface NestedCheckboxOption {
  value: string;
  label: string;
  nested?: string[];
}

// Import types for dynamic list sections
import type { FamilyMemberEntry } from './family-member-card';
import type { RelativeFriendEntry } from './relatives-friends-card';

export interface FormSectionData {
  id: string;
  title: string;
  description?: string;
  fields: FormFieldData[];
  completed?: boolean;
  // Extended data for special sections (like additional guardians)
  guardians?: GuardianEntry[];
  notes?: string;
  // Dynamic list section properties
  isDynamicList?: boolean;
  listType?: 'family-members' | 'relatives-friends' | 'guardians';
  // Data for dynamic list sections
  familyMembers?: FamilyMemberEntry[];
  relativesFriends?: RelativeFriendEntry[];
}

export interface FormResponseData {
  contentId: string;
  userId: string;
  sections: Record<string, FormSectionData>;
  completedAt?: Date;
  lastSaved?: Date;
}

interface AdvanceDirectiveFormProps {
  contentId: string;
  userId: string;
  initialData?: FormResponseData;
  onSave: (data: FormResponseData) => Promise<void>;
  readOnly?: boolean;
}

// Individual form field components
const CheckboxField: React.FC<{
  field: FormFieldData;
  value?: boolean | string[];
  onChange: (value: boolean | string[]) => void;
  readOnly?: boolean;
}> = ({ field, value, onChange, readOnly }) => {
  const isArray = Array.isArray(value);
  const checkboxValue = isArray ? value : (value as boolean);

  if (field.options && isArray) {
    // Multiple checkbox options (simple string options only)
    const stringOptions = field.options as string[];
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{field.label}</Label>
        <div className="space-y-2">
          {stringOptions.map((option) => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox
                id={`${field.id}-${option}`}
                checked={value.includes(option)}
                onCheckedChange={(checked) => {
                  if (readOnly) return;
                  const currentValue = value as string[];
                  if (checked) {
                    onChange([...currentValue, option]);
                  } else {
                    onChange(currentValue.filter(v => v !== option));
                  }
                }}
                disabled={readOnly}
              />
              <Label htmlFor={`${field.id}-${option}`} className="text-sm">
                {option}
              </Label>
            </div>
          ))}
        </div>
      </div>
    );
  } else {
    // Single checkbox
    return (
      <div className="flex items-center space-x-2">
        <Checkbox
          id={field.id}
          checked={checkboxValue as boolean}
          onCheckedChange={(checked) => {
            if (!readOnly) onChange(checked as boolean);
          }}
          disabled={readOnly}
        />
        <Label htmlFor={field.id} className="text-sm font-medium">
          {field.label}
        </Label>
      </div>
    );
  }
};

const RadioField: React.FC<{
  field: FormFieldData;
  value?: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}> = ({ field, value, onChange, readOnly }) => {
  // Radio fields use simple string options
  const stringOptions = (field.options || []) as string[];
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{field.label}</Label>
      <RadioGroup
        value={value || ''}
        onValueChange={readOnly ? undefined : onChange}
        disabled={readOnly}
      >
        {stringOptions.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <RadioGroupItem value={option} id={`${field.id}-${option}`} />
            <Label htmlFor={`${field.id}-${option}`} className="text-sm">
              {option}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

const TextField: React.FC<{
  field: FormFieldData;
  value?: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}> = ({ field, value, onChange, readOnly }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.id} className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Input
        id={field.id}
        value={value || ''}
        onChange={(e) => !readOnly && onChange(e.target.value)}
        placeholder={field.placeholder}
        readOnly={readOnly}
        className={readOnly ? 'bg-gray-50' : ''}
      />
    </div>
  );
};

const TextareaField: React.FC<{
  field: FormFieldData;
  value?: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}> = ({ field, value, onChange, readOnly }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.id} className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Textarea
        id={field.id}
        value={value || ''}
        onChange={(e) => !readOnly && onChange(e.target.value)}
        placeholder={field.placeholder}
        readOnly={readOnly}
        className={`min-h-[100px] ${readOnly ? 'bg-gray-50' : ''}`}
      />
    </div>
  );
};

// Select dropdown field
const SelectField: React.FC<{
  field: FormFieldData;
  value?: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}> = ({ field, value, onChange, readOnly }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.id} className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {readOnly ? (
        <Input
          id={field.id}
          value={field.selectOptions?.find(o => o.value === value)?.label || value || ''}
          readOnly
          className="bg-gray-50"
        />
      ) : (
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger id={field.id} className="min-h-[44px]">
            <SelectValue placeholder={field.placeholder || 'Select an option'} />
          </SelectTrigger>
          <SelectContent>
            {field.selectOptions?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

// Checkbox field with conditional "please explain" text areas
const CheckboxWithTextFields: React.FC<{
  field: FormFieldData;
  value?: { selected: string[]; explanations: Record<string, string> };
  onChange: (value: { selected: string[]; explanations: Record<string, string> }) => void;
  readOnly?: boolean;
}> = ({ field, value, onChange, readOnly }) => {
  const selected = value?.selected || [];
  const explanations = value?.explanations || {};

  const handleCheckboxChange = (option: string, checked: boolean) => {
    if (readOnly) return;
    const newSelected = checked
      ? [...selected, option]
      : selected.filter(v => v !== option);
    onChange({ selected: newSelected, explanations });
  };

  const handleExplanationChange = (option: string, text: string) => {
    if (readOnly) return;
    onChange({
      selected,
      explanations: { ...explanations, [option]: text }
    });
  };

  // Check if option should show explanation field
  const shouldShowExplanation = (option: string) => {
    if (!field.showExplainFor) return false;
    return field.showExplainFor.some(pattern => option.includes(pattern) || pattern === option);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{field.label}</Label>
      <div className="space-y-3">
        {(field.options as string[])?.map((option) => (
          <div key={option} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${field.id}-${option}`}
                checked={selected.includes(option)}
                onCheckedChange={(checked) => handleCheckboxChange(option, checked as boolean)}
                disabled={readOnly}
              />
              <Label htmlFor={`${field.id}-${option}`} className="text-sm">
                {option}
              </Label>
            </div>
            {/* Show explanation field if this option requires it and is selected */}
            {shouldShowExplanation(option) && selected.includes(option) && (
              <div className="ml-6 mt-2">
                <Label className="text-sm text-muted-foreground">Please explain (optional):</Label>
                <Textarea
                  value={explanations[option] || ''}
                  onChange={(e) => handleExplanationChange(option, e.target.value)}
                  placeholder="Please explain..."
                  readOnly={readOnly}
                  className={`min-h-[80px] mt-1 ${readOnly ? 'bg-gray-50' : ''}`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Checkbox field with nested sub-options (for hierarchical checkboxes like Feeding/Nutrition)
const CheckboxWithNestedOptions: React.FC<{
  field: FormFieldData;
  value?: { selected: string[]; nestedSelected: Record<string, string[]>; explanations: Record<string, string> };
  onChange: (value: { selected: string[]; nestedSelected: Record<string, string[]>; explanations: Record<string, string> }) => void;
  readOnly?: boolean;
}> = ({ field, value, onChange, readOnly }) => {
  const selected = value?.selected || [];
  const nestedSelected = value?.nestedSelected || {};
  const explanations = value?.explanations || {};

  const options = field.options as NestedCheckboxOption[];

  const handleCheckboxChange = (optionValue: string, checked: boolean) => {
    if (readOnly) return;
    const newSelected = checked
      ? [...selected, optionValue]
      : selected.filter(v => v !== optionValue);

    // If unchecking, also clear nested selections
    const newNestedSelected = { ...nestedSelected };
    if (!checked) {
      delete newNestedSelected[optionValue];
    }

    onChange({ selected: newSelected, nestedSelected: newNestedSelected, explanations });
  };

  const handleNestedCheckboxChange = (parentValue: string, nestedOption: string, checked: boolean) => {
    if (readOnly) return;
    const currentNested = nestedSelected[parentValue] || [];
    const newNested = checked
      ? [...currentNested, nestedOption]
      : currentNested.filter(v => v !== nestedOption);

    onChange({
      selected,
      nestedSelected: { ...nestedSelected, [parentValue]: newNested },
      explanations
    });
  };

  const handleExplanationChange = (optionValue: string, text: string) => {
    if (readOnly) return;
    onChange({
      selected,
      nestedSelected,
      explanations: { ...explanations, [optionValue]: text }
    });
  };

  // Check if option label contains "(please explain)"
  const needsExplanation = (label: string) => {
    return label.toLowerCase().includes('(please explain)');
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{field.label}</Label>
      <div className="space-y-3">
        {options?.map((option) => (
          <div key={option.value} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${field.id}-${option.value}`}
                checked={selected.includes(option.value)}
                onCheckedChange={(checked) => handleCheckboxChange(option.value, checked as boolean)}
                disabled={readOnly}
              />
              <Label htmlFor={`${field.id}-${option.value}`} className="text-sm">
                {option.label}
              </Label>
            </div>

            {/* Show nested options if parent is selected */}
            {option.nested && selected.includes(option.value) && (
              <div className="ml-6 mt-2 space-y-2 pl-4 border-l-2 border-muted">
                {option.nested.map((nestedOption) => (
                  <div key={nestedOption} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${field.id}-${option.value}-${nestedOption}`}
                      checked={(nestedSelected[option.value] || []).includes(nestedOption)}
                      onCheckedChange={(checked) => handleNestedCheckboxChange(option.value, nestedOption, checked as boolean)}
                      disabled={readOnly}
                    />
                    <Label htmlFor={`${field.id}-${option.value}-${nestedOption}`} className="text-sm">
                      {nestedOption}
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {/* Show explanation field if needed and selected */}
            {needsExplanation(option.label) && selected.includes(option.value) && (
              <div className="ml-6 mt-2">
                <Label className="text-sm text-muted-foreground">Please explain:</Label>
                <Textarea
                  value={explanations[option.value] || ''}
                  onChange={(e) => handleExplanationChange(option.value, e.target.value)}
                  placeholder="Please explain..."
                  readOnly={readOnly}
                  className={`min-h-[80px] mt-1 ${readOnly ? 'bg-gray-50' : ''}`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Contact information form block
const ContactFormBlock: React.FC<{
  data?: any;
  onChange: (data: any) => void;
  readOnly?: boolean;
  title?: string;
}> = ({ data = {}, onChange, readOnly, title = "Contact Information" }) => {
  const updateField = useCallback((field: string, value: string) => {
    if (!readOnly) {
      onChange({ ...data, [field]: value });
    }
  }, [data, onChange, readOnly]);

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            field={{
              id: 'name',
              type: 'text',
              label: 'Full Name',
              required: true,
              placeholder: 'Enter full name'
            }}
            value={data.name}
            onChange={(value) => updateField('name', value)}
            readOnly={readOnly}
          />
          <TextField
            field={{
              id: 'relationship',
              type: 'text',
              label: 'Relationship',
              placeholder: 'e.g., Father, Doctor, Friend'
            }}
            value={data.relationship}
            onChange={(value) => updateField('relationship', value)}
            readOnly={readOnly}
          />
          <TextField
            field={{
              id: 'phone',
              type: 'text',
              label: 'Phone Number',
              placeholder: '(555) 555-5555'
            }}
            value={data.phone}
            onChange={(value) => updateField('phone', value)}
            readOnly={readOnly}
          />
          <TextField
            field={{
              id: 'email',
              type: 'text',
              label: 'Email',
              placeholder: 'email@example.com'
            }}
            value={data.email}
            onChange={(value) => updateField('email', value)}
            readOnly={readOnly}
          />
        </div>
        <TextField
          field={{
            id: 'address',
            type: 'text',
            label: 'Address',
            placeholder: 'Street Address, City, State, ZIP'
          }}
          value={data.address}
          onChange={(value) => updateField('address', value)}
          readOnly={readOnly}
        />
      </CardContent>
    </Card>
  );
};

// Medical provider form block
const MedicalProviderBlock: React.FC<{
  data?: any;
  onChange: (data: any) => void;
  readOnly?: boolean;
  title?: string;
}> = ({ data = {}, onChange, readOnly, title = "Healthcare Provider" }) => {
  const updateField = useCallback((field: string, value: string) => {
    if (!readOnly) {
      onChange({ ...data, [field]: value });
    }
  }, [data, onChange, readOnly]);

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            field={{
              id: 'name',
              type: 'text',
              label: 'Provider Name',
              required: true,
              placeholder: 'Dr. Smith'
            }}
            value={data.name}
            onChange={(value) => updateField('name', value)}
            readOnly={readOnly}
          />
          <TextField
            field={{
              id: 'specialty',
              type: 'text',
              label: 'Specialty',
              placeholder: 'Primary Care, Cardiology, etc.'
            }}
            value={data.specialty}
            onChange={(value) => updateField('specialty', value)}
            readOnly={readOnly}
          />
          <TextField
            field={{
              id: 'practice',
              type: 'text',
              label: 'Practice/Hospital',
              placeholder: 'Medical Center Name'
            }}
            value={data.practice}
            onChange={(value) => updateField('practice', value)}
            readOnly={readOnly}
          />
          <TextField
            field={{
              id: 'phone',
              type: 'text',
              label: 'Phone',
              placeholder: '(555) 555-5555'
            }}
            value={data.phone}
            onChange={(value) => updateField('phone', value)}
            readOnly={readOnly}
          />
        </div>
      </CardContent>
    </Card>
  );
};

// Form section component
const FormSection: React.FC<{
  section: FormSectionData;
  onUpdate: (section: FormSectionData) => void;
  readOnly?: boolean;
}> = ({ section, onUpdate, readOnly }) => {
  const updateField = useCallback((fieldId: string, value: any) => {
    if (readOnly) return;

    const updatedFields = section.fields.map(field =>
      field.id === fieldId ? { ...field, value } : field
    );

    const updatedSection = {
      ...section,
      fields: updatedFields,
      completed: updatedFields.every(field =>
        field.required ? Boolean(field.value) : true
      )
    };

    onUpdate(updatedSection);
  }, [section, onUpdate, readOnly]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {section.title}
            {section.completed && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <Check className="w-3 h-3 mr-1" />
                Complete
              </Badge>
            )}
          </CardTitle>
        </div>
        {section.description && (
          <p className="text-sm text-muted-foreground">{section.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {section.fields.map((field) => {
          const fieldValue = field.value;

          switch (field.type) {
            case 'checkbox':
              return (
                <CheckboxField
                  key={field.id}
                  field={field}
                  value={Array.isArray(fieldValue) ? fieldValue : typeof fieldValue === 'boolean' ? fieldValue : undefined}
                  onChange={(value) => updateField(field.id, value)}
                  readOnly={readOnly}
                />
              );
            case 'radio':
              return (
                <RadioField
                  key={field.id}
                  field={field}
                  value={fieldValue as string}
                  onChange={(value) => updateField(field.id, value)}
                  readOnly={readOnly}
                />
              );
            case 'text':
              return (
                <TextField
                  key={field.id}
                  field={field}
                  value={fieldValue as string}
                  onChange={(value) => updateField(field.id, value)}
                  readOnly={readOnly}
                />
              );
            case 'textarea':
              return (
                <TextareaField
                  key={field.id}
                  field={field}
                  value={fieldValue as string}
                  onChange={(value) => updateField(field.id, value)}
                  readOnly={readOnly}
                />
              );
            case 'select':
              return (
                <SelectField
                  key={field.id}
                  field={field}
                  value={fieldValue as string}
                  onChange={(value) => updateField(field.id, value)}
                  readOnly={readOnly}
                />
              );
            case 'checkbox-with-text':
              return (
                <CheckboxWithTextFields
                  key={field.id}
                  field={field}
                  value={fieldValue as { selected: string[]; explanations: Record<string, string> }}
                  onChange={(value) => updateField(field.id, value)}
                  readOnly={readOnly}
                />
              );
            case 'checkbox-with-nested':
              return (
                <CheckboxWithNestedOptions
                  key={field.id}
                  field={field}
                  value={fieldValue as { selected: string[]; nestedSelected: Record<string, string[]>; explanations: Record<string, string> }}
                  onChange={(value) => updateField(field.id, value)}
                  readOnly={readOnly}
                />
              );
            default:
              return null;
          }
        })}
      </CardContent>
    </Card>
  );
};

// Main advance directive form component
export const AdvanceDirectiveForm: React.FC<AdvanceDirectiveFormProps> = ({
  contentId,
  userId,
  initialData,
  onSave,
  readOnly = false
}) => {
  const [formData, setFormData] = useState<FormResponseData>(
    initialData || {
      contentId,
      userId,
      sections: {},
      lastSaved: undefined
    }
  );

  // Enhanced auto-save functionality
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);

  // Auto-save configuration
  const autoSave = useAutoSave({
    interval: 30000, // 30 seconds
    storageKey: `advance-directive-${contentId}-${userId}`,
    onSave: async (data: FormResponseData) => {
      const dataToSave = {
        ...data,
        lastSaved: new Date(),
        completedAt: Object.values(data.sections).every(s => s.completed)
          ? new Date()
          : undefined
      };

      await onSave(dataToSave);
      setFormData(dataToSave);
    },
    onError: (error: Error) => {
      console.error('Auto-save error:', error);
    },
    onConflict: async (localData, serverData) => {
      // Simple conflict resolution: prefer local data (user's latest work)
      setShowRecoveryPrompt(true);
      return localData;
    }
  });

  // Initialize auto-save with form data
  useEffect(() => {
    if (!readOnly) {
      autoSave.initialize(formData);
    }
  }, [contentId, userId, readOnly]); // Only initialize once per form instance

  // Check for recovery data on mount
  useEffect(() => {
    if (!readOnly && autoSave.hasBackup) {
      const backupData = autoSave.getBackupData();
      if (backupData && backupData.timestamp) {
        const backupAge = Date.now() - backupData.timestamp;
        // Show recovery prompt if backup is less than 1 hour old
        if (backupAge < 60 * 60 * 1000) {
          setShowRecoveryPrompt(true);
        }
      }
    }
  }, []);

  const updateSection = useCallback((sectionId: string, section: FormSectionData) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionId]: section
        }
      };

      // Trigger auto-save update
      if (!readOnly) {
        autoSave.updateData(updated);
      }

      return updated;
    });
  }, [readOnly, autoSave.updateData]);

  // Manual save function (still available for user-triggered saves)
  const handleManualSave = useCallback(async () => {
    if (readOnly) return;
    await autoSave.save();
  }, [readOnly, autoSave.save]);

  // Recovery functions
  const handleRecoverFromBackup = useCallback(() => {
    const backupData = autoSave.getBackupData();
    if (backupData) {
      setFormData(backupData.formData);
      autoSave.updateData(backupData.formData);
      setShowRecoveryPrompt(false);
    }
  }, [autoSave]);

  const handleDismissRecovery = useCallback(() => {
    autoSave.clearBackup();
    setShowRecoveryPrompt(false);
  }, [autoSave]);

  const sectionEntries = Object.entries(formData.sections);

  // Check if this is the Child Guardian template (has these specific section IDs)
  const sectionIds = sectionEntries.map(([id]) => id);
  const isChildGuardianTemplate =
    sectionIds.includes('child-information') &&
    sectionIds.includes('primary-guardian') &&
    sectionIds.includes('additional-guardians');

  // For child guardian template, exclude the optional additional-guardians from completion tracking
  const sectionsForProgress = isChildGuardianTemplate
    ? sectionEntries.filter(([id]) => id !== 'additional-guardians')
    : sectionEntries;

  const completedSections = sectionsForProgress.filter(([, section]) => section.completed).length;
  const totalSections = sectionsForProgress.length;
  const progressPercentage = totalSections > 0 ? (completedSections / totalSections) * 100 : 0;

  // Guardian handlers for the additional-guardians section
  const handleAddGuardian = useCallback(() => {
    if (readOnly) return;

    setFormData(prev => {
      const additionalGuardiansSection = prev.sections['additional-guardians'];
      const currentGuardians = additionalGuardiansSection?.guardians || [];

      const updated = {
        ...prev,
        sections: {
          ...prev.sections,
          'additional-guardians': {
            ...additionalGuardiansSection,
            guardians: [...currentGuardians, createEmptyGuardian()],
          }
        }
      };

      if (!readOnly) {
        autoSave.updateData(updated);
      }

      return updated;
    });
  }, [readOnly, autoSave.updateData]);

  const handleUpdateGuardian = useCallback((index: number, guardian: GuardianEntry) => {
    if (readOnly) return;

    setFormData(prev => {
      const additionalGuardiansSection = prev.sections['additional-guardians'];
      const currentGuardians = [...(additionalGuardiansSection?.guardians || [])];
      currentGuardians[index] = guardian;

      const updated = {
        ...prev,
        sections: {
          ...prev.sections,
          'additional-guardians': {
            ...additionalGuardiansSection,
            guardians: currentGuardians,
          }
        }
      };

      if (!readOnly) {
        autoSave.updateData(updated);
      }

      return updated;
    });
  }, [readOnly, autoSave.updateData]);

  const handleRemoveGuardian = useCallback((index: number) => {
    if (readOnly) return;

    setFormData(prev => {
      const additionalGuardiansSection = prev.sections['additional-guardians'];
      const currentGuardians = [...(additionalGuardiansSection?.guardians || [])];
      currentGuardians.splice(index, 1);

      const updated = {
        ...prev,
        sections: {
          ...prev.sections,
          'additional-guardians': {
            ...additionalGuardiansSection,
            guardians: currentGuardians,
          }
        }
      };

      if (!readOnly) {
        autoSave.updateData(updated);
      }

      return updated;
    });
  }, [readOnly, autoSave.updateData]);

  const handleGuardianNotesChange = useCallback((notes: string) => {
    if (readOnly) return;

    setFormData(prev => {
      const additionalGuardiansSection = prev.sections['additional-guardians'];

      const updated = {
        ...prev,
        sections: {
          ...prev.sections,
          'additional-guardians': {
            ...additionalGuardiansSection,
            notes,
          }
        }
      };

      if (!readOnly) {
        autoSave.updateData(updated);
      }

      return updated;
    });
  }, [readOnly, autoSave.updateData]);

  // Family members handlers for dynamic list sections
  const handleAddFamilyMember = useCallback((sectionId: string) => {
    if (readOnly) return;

    setFormData(prev => {
      const section = prev.sections[sectionId];
      const currentMembers = section?.familyMembers || [];

      const updated = {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionId]: {
            ...section,
            familyMembers: [...currentMembers, createEmptyFamilyMember()],
          }
        }
      };

      if (!readOnly) {
        autoSave.updateData(updated);
      }

      return updated;
    });
  }, [readOnly, autoSave.updateData]);

  const handleUpdateFamilyMember = useCallback((sectionId: string, index: number, member: FamilyMemberEntry) => {
    if (readOnly) return;

    setFormData(prev => {
      const section = prev.sections[sectionId];
      const currentMembers = [...(section?.familyMembers || [])];
      currentMembers[index] = member;

      const updated = {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionId]: {
            ...section,
            familyMembers: currentMembers,
          }
        }
      };

      if (!readOnly) {
        autoSave.updateData(updated);
      }

      return updated;
    });
  }, [readOnly, autoSave.updateData]);

  const handleRemoveFamilyMember = useCallback((sectionId: string, index: number) => {
    if (readOnly) return;

    setFormData(prev => {
      const section = prev.sections[sectionId];
      const currentMembers = [...(section?.familyMembers || [])];
      currentMembers.splice(index, 1);

      const updated = {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionId]: {
            ...section,
            familyMembers: currentMembers,
          }
        }
      };

      if (!readOnly) {
        autoSave.updateData(updated);
      }

      return updated;
    });
  }, [readOnly, autoSave.updateData]);

  // Relatives/friends handlers for dynamic list sections
  const handleAddRelativeFriend = useCallback((sectionId: string) => {
    if (readOnly) return;

    setFormData(prev => {
      const section = prev.sections[sectionId];
      const currentPeople = section?.relativesFriends || [];

      const updated = {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionId]: {
            ...section,
            relativesFriends: [...currentPeople, createEmptyRelativeFriend()],
          }
        }
      };

      if (!readOnly) {
        autoSave.updateData(updated);
      }

      return updated;
    });
  }, [readOnly, autoSave.updateData]);

  const handleUpdateRelativeFriend = useCallback((sectionId: string, index: number, person: RelativeFriendEntry) => {
    if (readOnly) return;

    setFormData(prev => {
      const section = prev.sections[sectionId];
      const currentPeople = [...(section?.relativesFriends || [])];
      currentPeople[index] = person;

      const updated = {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionId]: {
            ...section,
            relativesFriends: currentPeople,
          }
        }
      };

      if (!readOnly) {
        autoSave.updateData(updated);
      }

      return updated;
    });
  }, [readOnly, autoSave.updateData]);

  const handleRemoveRelativeFriend = useCallback((sectionId: string, index: number) => {
    if (readOnly) return;

    setFormData(prev => {
      const section = prev.sections[sectionId];
      const currentPeople = [...(section?.relativesFriends || [])];
      currentPeople.splice(index, 1);

      const updated = {
        ...prev,
        sections: {
          ...prev.sections,
          [sectionId]: {
            ...section,
            relativesFriends: currentPeople,
          }
        }
      };

      if (!readOnly) {
        autoSave.updateData(updated);
      }

      return updated;
    });
  }, [readOnly, autoSave.updateData]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Recovery prompt */}
      {showRecoveryPrompt && !readOnly && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">Unsaved Changes Found</h3>
                <p className="text-sm text-blue-700 mt-1">
                  We found more recent changes from a previous session.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDismissRecovery}>
                  Ignore
                </Button>
                <Button variant="default" size="sm" onClick={handleRecoverFromBackup}>
                  Recover Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress indicator */}
      {totalSections > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Progress</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {completedSections}/{totalSections} sections complete
                </span>
                {!readOnly && (
                  <SaveStatusIndicator
                    status={autoSave.status}
                    onRetry={handleManualSave}
                    compact
                  />
                )}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form sections */}
      {sectionEntries.map(([sectionId, section]) => {
        // Handle dynamic list sections using isDynamicList and listType
        if (section.isDynamicList) {
          switch (section.listType) {
            case 'family-members':
              return (
                <FamilyMembersSection
                  key={sectionId}
                  members={section.familyMembers || []}
                  onAddMember={() => handleAddFamilyMember(sectionId)}
                  onUpdateMember={(index, member) => handleUpdateFamilyMember(sectionId, index, member)}
                  onRemoveMember={(index) => handleRemoveFamilyMember(sectionId, index)}
                  readOnly={readOnly}
                />
              );
            case 'relatives-friends':
              return (
                <RelativesFriendsSection
                  key={sectionId}
                  people={section.relativesFriends || []}
                  onAddPerson={() => handleAddRelativeFriend(sectionId)}
                  onUpdatePerson={(index, person) => handleUpdateRelativeFriend(sectionId, index, person)}
                  onRemovePerson={(index) => handleRemoveRelativeFriend(sectionId, index)}
                  readOnly={readOnly}
                />
              );
            case 'guardians':
              return (
                <AdditionalGuardiansSection
                  key={sectionId}
                  guardians={section.guardians || []}
                  notes={section.notes || ''}
                  onAddGuardian={handleAddGuardian}
                  onUpdateGuardian={handleUpdateGuardian}
                  onRemoveGuardian={handleRemoveGuardian}
                  onNotesChange={handleGuardianNotesChange}
                  readOnly={readOnly}
                />
              );
            default:
              // Fall through to normal section rendering for unknown list types
              break;
          }
        }

        // Legacy handling for additional-guardians section in child guardian template
        // (for backwards compatibility with existing templates)
        if (sectionId === 'additional-guardians' && isChildGuardianTemplate) {
          return (
            <AdditionalGuardiansSection
              key={sectionId}
              guardians={section.guardians || []}
              notes={section.notes || ''}
              onAddGuardian={handleAddGuardian}
              onUpdateGuardian={handleUpdateGuardian}
              onRemoveGuardian={handleRemoveGuardian}
              onNotesChange={handleGuardianNotesChange}
              readOnly={readOnly}
            />
          );
        }

        // Normal section rendering
        return (
          <FormSection
            key={sectionId}
            section={section}
            onUpdate={(updatedSection) => updateSection(sectionId, updatedSection)}
            readOnly={readOnly}
          />
        );
      })}

      {/* Enhanced save controls and status */}
      {!readOnly && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SaveStatusIndicator
                  status={autoSave.status}
                  onRetry={handleManualSave}
                  hasBackup={autoSave.hasBackup}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleManualSave}
                  disabled={autoSave.status.status === 'saving'}
                  className="flex items-center gap-2 min-h-[44px]"
                >
                  <Save className="w-4 h-4" />
                  Save Now
                </Button>
                {autoSave.hasUnsavedChanges && (
                  <Badge variant="secondary" className="px-3 py-1">
                    Unsaved changes
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Floating save status for mobile/long forms */}
      {!readOnly && (autoSave.status.status === 'saving' || autoSave.status.status === 'error') && (
        <FloatingSaveStatus
          status={autoSave.status}
          onRetry={handleManualSave}
        />
      )}

      {/* Completion indicator */}
      {formData.completedAt && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-800">
              <Check className="w-5 h-5" />
              <span className="font-medium">
                Form completed on {formData.completedAt.toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Specialized components for common form blocks
export { ContactFormBlock, MedicalProviderBlock };

// Export new field components (NestedCheckboxOption is already exported at interface declaration)
export { SelectField, CheckboxWithTextFields, CheckboxWithNestedOptions };

// Re-export dynamic list components for convenience
export { FamilyMembersSection, createEmptyFamilyMember };
export { RelativesFriendsSection, createEmptyRelativeFriend };
export type { FamilyMemberEntry, RelativeFriendEntry };

// Helper function to create form sections from template data
export const createFormSection = (
  id: string,
  title: string,
  description: string,
  fields: FormFieldData[]
): FormSectionData => ({
  id,
  title,
  description,
  fields,
  completed: false
});

// Example form field definitions for advance directives
export const ADVANCE_DIRECTIVE_FORM_FIELDS = {
  qualityOfLife: [
    {
      id: 'meaningful_activities',
      type: 'checkbox' as const,
      label: 'What activities bring meaning to your life?',
      options: [
        'Being able to recognize loved ones and engage in meaningful conversation',
        'Being able to independently meet my own physical needs',
        'Being able to walk or move around',
        'Being able to go to work/school',
        'Being able to participate in sports or recreational activities',
        'Being able to spend quality time with friends and family',
        'Being able to participate in religious and cultural practices',
        'Being able to enjoy food and drink by mouth',
        'Being able to live in my own home',
        'Being continent of bowel and bladder',
        'Being with my pets',
        'Being able to engage in hobbies that give my life meaning'
      ],
      value: []
    },
    {
      id: 'communication_preference',
      type: 'radio' as const,
      label: 'How would you like medical conversations to be handled?',
      options: [
        'I want to be included in all medical discussions using appropriate language',
        'I want private discussions with my healthcare proxy who will share details with me',
        'I am unable to contribute to healthcare decisions; I trust my proxy to make the best choices'
      ],
      value: ''
    }
  ],
  comfortMeasures: [
    {
      id: 'comfort_activities',
      type: 'checkbox' as const,
      label: 'What brings you comfort during difficult times?',
      options: [
        'Visits with specific loved ones',
        'Prayer or spiritual practices',
        'Spending time outside',
        'Listening to favorite music or shows',
        'Special scents like candles or essential oils',
        'Eating favorite foods',
        'Reading or being read to',
        'Gentle touch or massage'
      ],
      value: []
    },
    {
      id: 'favorite_music',
      type: 'text' as const,
      label: 'Favorite music or artist',
      placeholder: 'Taylor Swift, Classical, etc.',
      value: ''
    },
    {
      id: 'comfort_instructions',
      type: 'textarea' as const,
      label: 'Special instructions for comfort care',
      placeholder: 'Describe what helps you feel calm and comfortable...',
      value: ''
    }
  ]
};

export default AdvanceDirectiveForm;