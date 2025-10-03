'use client';

import { useState } from 'react';

import { DocumentUploader } from '@/components/document-uploader';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { nowUTC } from '@/lib/timezone';

interface RequirementFieldProps {
  requirement: {
    id: string;
    title: string;
    validationType: string;
    required: boolean;
    options?: string[];
    acceptedFormats?: string[];
  };
  onChange: (value: any) => void;
}

export function RequirementField({ requirement, onChange }: RequirementFieldProps) {
  const [otherValue, setOtherValue] = useState('');
  const [value, setValue] = useState<any>(null);

  const handleChange = (newValue: any) => {
    setValue(newValue);
    onChange(newValue);
  };

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === 'other') {
      handleChange(otherValue);
    } else {
      handleChange(selectedValue);
      setOtherValue('');
    }
  };

  switch (requirement.validationType) {
    case 'BOOLEAN':
      return (
        <div className="flex items-center space-x-2">
          <Switch id={requirement.id} checked={value === true} onCheckedChange={handleChange} />
          <span className="text-sm">{value === true ? 'Yes' : 'No'}</span>
        </div>
      );

    case 'DOCUMENT':
      return (
        <DocumentUploader
          onUpload={handleChange}
          acceptedFormats={requirement.acceptedFormats}
          purpose={`requirement-${requirement.id}`}
        />
      );

    case 'TEXT':
      return (
        <Textarea
          placeholder={`Enter ${requirement.title.toLowerCase()}`}
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          className="min-h-[80px]"
        />
      );

    case 'DATE':
    case 'FUTURE_DATE':
    case 'PAST_DATE':
      return (
        <Input
          type="date"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          min={
            requirement.validationType === 'FUTURE_DATE'
              ? nowUTC().toISOString().split('T')[0]
              : undefined
          }
          max={
            requirement.validationType === 'PAST_DATE'
              ? nowUTC().toISOString().split('T')[0]
              : undefined
          }
        />
      );

    case 'NUMBER':
      return (
        <Input
          type="number"
          placeholder={`Enter ${requirement.title.toLowerCase()}`}
          value={value || ''}
          onChange={(e) => handleChange(Number.parseInt(e.target.value) || '')}
          min="0"
        />
      );

    case 'PREDEFINED_LIST':
      return (
        <div className="space-y-2">
          <Select onValueChange={handleSelectChange} value={value || ''}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${requirement.title.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {requirement.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          {value === 'other' && (
            <Input
              placeholder="Please specify"
              value={otherValue}
              onChange={(e) => {
                setOtherValue(e.target.value);
                handleChange(e.target.value);
              }}
            />
          )}
        </div>
      );

    default:
      return (
        <Input
          placeholder={`Enter ${requirement.title.toLowerCase()}`}
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
        />
      );
  }
}
