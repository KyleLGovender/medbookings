import React, { forwardRef, useEffect, useState } from 'react';

import { X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type InputProps = React.ComponentProps<'input'>;

type InputTagsProps = Omit<InputProps, 'value' | 'onChange'> & {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
};

export const InputTags = forwardRef<HTMLInputElement, InputTagsProps>(
  ({ value = [], onChange, placeholder = 'Type and press Enter', ...props }, ref) => {
    const [pendingTag, setPendingTag] = useState('');

    // Ensure all existing tags are lowercase
    useEffect(() => {
      const hasNonLowercaseTags = value.some((tag) => tag !== tag.toLowerCase());
      if (hasNonLowercaseTags) {
        const normalizedTags = value.map((tag) => tag.toLowerCase());
        onChange(Array.from(new Set(normalizedTags)));
      }
    }, [value, onChange]);

    const addPendingTag = () => {
      if (pendingTag.trim()) {
        // Convert to lowercase and ensure uniqueness
        const normalizedTag = pendingTag.trim().toLowerCase();
        const newTags = Array.from(new Set([...value, normalizedTag]));
        onChange(newTags);
        setPendingTag('');
      }
    };

    const removeTag = (tagToRemove: string) => {
      const newTags = value.filter((tag) => tag !== tagToRemove);
      onChange(newTags);
    };

    return (
      <div className="space-y-2">
        <div className="flex">
          <Input
            value={pendingTag}
            onChange={(e) => setPendingTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addPendingTag();
              } else if (e.key === ',') {
                e.preventDefault();
                addPendingTag();
              }
            }}
            className="rounded-r-none"
            placeholder={placeholder}
            {...props}
            ref={ref}
          />
          <Button
            type="button"
            variant="secondary"
            className="rounded-l-none border border-l-0"
            onClick={addPendingTag}
          >
            Add
          </Button>
        </div>

        {value.length > 0 && (
          <div className="flex min-h-[2.5rem] flex-wrap items-center gap-2 rounded-md border p-2">
            {value.map((tag, idx) => (
              <Badge key={idx} variant="secondary">
                {tag.toLowerCase()}
                <button
                  type="button"
                  className="ml-1 h-3 w-3 rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onClick={() => removeTag(tag)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {tag}</span>
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  }
);

InputTags.displayName = 'InputTags';
