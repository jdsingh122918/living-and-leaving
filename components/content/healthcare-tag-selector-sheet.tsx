'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Search,
  Tag,
  Check,
  X,
  Filter
} from 'lucide-react';
import { HEALTHCARE_CATEGORIES, ALL_HEALTHCARE_TAGS } from '@/lib/data/healthcare-tags';

interface HealthcareTagSelectorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

// Inner component that handles tag selection
// Gets remounted when sheet opens via key prop
function TagSelectorContent({
  selectedTags,
  onTagsChange,
  onClose,
}: {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  onClose: () => void;
}) {
  // Local state initialized from props - this component remounts when sheet opens
  const [localSelectedTags, setLocalSelectedTags] = useState<string[]>(selectedTags);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  // Filter tags based on search query and category filter
  const filteredHealthcareTags = ALL_HEALTHCARE_TAGS.filter(tag => {
    const matchesSearch = searchQuery === '' ||
      tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tag.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategoryFilter === null ||
      tag.category === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Group tags by category for display
  const groupedTags = filteredHealthcareTags.reduce((groups, tag) => {
    if (!groups[tag.category]) {
      groups[tag.category] = [];
    }
    groups[tag.category].push(tag);
    return groups;
  }, {} as Record<string, typeof ALL_HEALTHCARE_TAGS>);

  const handleTagToggle = useCallback((tagName: string) => {
    setLocalSelectedTags(prev => {
      if (prev.includes(tagName)) {
        return prev.filter(t => t !== tagName);
      } else {
        return [...prev, tagName];
      }
    });
  }, []);

  const handleCategoryToggle = useCallback((categoryName: string) => {
    const category = HEALTHCARE_CATEGORIES.find(cat => cat.name === categoryName);
    if (!category) return;

    const categoryTags = category.tags;
    const allCategoryTagsSelected = categoryTags.every(tag => localSelectedTags.includes(tag));

    if (allCategoryTagsSelected) {
      setLocalSelectedTags(prev => prev.filter(tag => !categoryTags.includes(tag)));
    } else {
      setLocalSelectedTags(prev => {
        const newTags = [...prev];
        categoryTags.forEach(tag => {
          if (!newTags.includes(tag)) {
            newTags.push(tag);
          }
        });
        return newTags;
      });
    }
  }, [localSelectedTags]);

  const handleApply = () => {
    onTagsChange(localSelectedTags);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const clearAllTags = () => {
    setLocalSelectedTags([]);
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          Healthcare Tags
        </SheetTitle>
        <SheetDescription>
          Select healthcare tags to organize your resource. Tags help users find relevant information quickly.
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-4 py-4 overflow-y-auto">
        {/* Search and Filter Controls */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search healthcare tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedCategoryFilter || ''}
              onChange={(e) => setSelectedCategoryFilter(e.target.value || null)}
              className="flex-1 px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground"
            >
              <option value="">All Categories</option>
              {HEALTHCARE_CATEGORIES.map(category => (
                <option key={category.name} value={category.name}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Overview */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">Categories</h3>
          <div className="grid grid-cols-2 gap-2">
            {HEALTHCARE_CATEGORIES.map((category) => {
              const categoryTags = category.tags;
              const selectedCount = categoryTags.filter(tag => localSelectedTags.includes(tag)).length;
              const allSelected = selectedCount === categoryTags.length;

              return (
                <button
                  key={category.name}
                  type="button"
                  className="border rounded-lg p-2 hover:bg-accent transition-colors cursor-pointer text-left"
                  style={{ borderColor: `${category.color}40` }}
                  onClick={() => handleCategoryToggle(category.name)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <span className="text-sm">{category.icon}</span>
                      <span className="font-medium text-xs truncate text-foreground">{category.name}</span>
                    </div>
                    {allSelected && (
                      <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedCount}/{categoryTags.length} selected
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${(selectedCount / categoryTags.length) * 100}%`,
                        backgroundColor: category.color
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Individual Tags */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">
              Individual Tags
              {selectedCategoryFilter && (
                <span className="text-xs font-normal text-muted-foreground ml-2">
                  ({selectedCategoryFilter})
                </span>
              )}
            </h3>
            {selectedCategoryFilter && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategoryFilter(null)}
                className="text-xs h-7"
              >
                Show All
              </Button>
            )}
          </div>

          {filteredHealthcareTags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tags found</p>
            </div>
          ) : selectedCategoryFilter === null ? (
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {Object.entries(groupedTags).map(([categoryName, tags]) => {
                const category = HEALTHCARE_CATEGORIES.find(cat => cat.name === categoryName);
                if (!category) return null;

                return (
                  <div key={categoryName}>
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-sm">{category.icon}</span>
                      <span className="font-medium text-xs text-foreground">{categoryName}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map(tag => (
                        <button
                          key={tag.name}
                          type="button"
                          onClick={() => handleTagToggle(tag.name)}
                          className={`text-xs px-2 py-1 rounded border hover:opacity-80 transition-all flex items-center gap-1 ${
                            localSelectedTags.includes(tag.name) ? '' : 'bg-background text-foreground border-input'
                          }`}
                          style={localSelectedTags.includes(tag.name) ? {
                            backgroundColor: `${tag.color}20`,
                            borderColor: tag.color,
                            color: tag.color
                          } : undefined}
                        >
                          <span className="truncate max-w-[150px]">{tag.name}</span>
                          {localSelectedTags.includes(tag.name) && (
                            <Check className="h-3 w-3 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-[300px] overflow-y-auto">
              {filteredHealthcareTags.map(tag => (
                <button
                  key={tag.name}
                  type="button"
                  onClick={() => handleTagToggle(tag.name)}
                  className={`text-xs px-2 py-1 rounded border hover:opacity-80 transition-all flex items-center gap-1 ${
                    localSelectedTags.includes(tag.name) ? '' : 'bg-background text-foreground border-input'
                  }`}
                  style={localSelectedTags.includes(tag.name) ? {
                    backgroundColor: `${tag.color}20`,
                    borderColor: tag.color,
                    color: tag.color
                  } : undefined}
                >
                  <span className="truncate max-w-[150px]">{tag.name}</span>
                  {localSelectedTags.includes(tag.name) && (
                    <Check className="h-3 w-3 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Tags Preview */}
        {localSelectedTags.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-1">
                <Check className="h-4 w-4 text-green-600" />
                Selected ({localSelectedTags.length})
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAllTags}
                className="text-xs h-7"
              >
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
              {localSelectedTags.map(tagName => {
                const tag = ALL_HEALTHCARE_TAGS.find(t => t.name === tagName);
                return (
                  <Badge
                    key={tagName}
                    variant="outline"
                    className="flex items-center gap-1 text-xs"
                    style={tag ? {
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                      borderColor: tag.color
                    } : {}}
                  >
                    {tagName}
                    <button
                      type="button"
                      onClick={() => handleTagToggle(tagName)}
                      className="ml-0.5 hover:bg-red-100 hover:text-red-600 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <SheetFooter className="border-t pt-4">
        <div className="flex justify-between items-center w-full">
          <span className="text-sm text-muted-foreground">
            {localSelectedTags.length} tag{localSelectedTags.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={handleApply}>
              Apply Tags
            </Button>
          </div>
        </div>
      </SheetFooter>
    </>
  );
}

// Wrapper component that handles sheet open/close
// Uses key to remount inner component when sheet opens
const HealthcareTagSelectorSheet: React.FC<HealthcareTagSelectorSheetProps> = ({
  open,
  onOpenChange,
  selectedTags,
  onTagsChange,
}) => {
  // Use a counter to generate unique keys when sheet opens
  const [mountKey, setMountKey] = useState(0);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (newOpen) {
      // Increment key to force remount of inner component
      setMountKey(prev => prev + 1);
    }
    onOpenChange(newOpen);
  }, [onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        {open && (
          <TagSelectorContent
            key={mountKey}
            selectedTags={selectedTags}
            onTagsChange={onTagsChange}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};

export default HealthcareTagSelectorSheet;
