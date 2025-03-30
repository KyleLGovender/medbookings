import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';

import { DatePickerWithInput } from '@/components/ui/date-picker-with-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ServiceProviderFormType } from '@/features/service-provider/lib/types';

type RequirementType = {
  id: string;
  name: string;
  description?: string | null;
  validationType: string;
  isRequired: boolean;
  validationConfig?: {
    options?: Array<{ value: string; label: string }>;
    allowOther?: boolean;
    otherLabel?: string;
    otherValidation?: {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
    };
  };
  index: number;
  existingSubmission?: {
    documentUrl: string | null;
    documentMetadata: { value?: string } | null;
  };
};

export const renderRequirementInput = (
  requirement: RequirementType,
  form: {
    register: UseFormRegister<ServiceProviderFormType>;
    watch: UseFormWatch<ServiceProviderFormType>;
    setValue: UseFormSetValue<ServiceProviderFormType>;
    errors: any;
  }
) => {
  // Set the requirement ID directly
  form.setValue(`requirements.${requirement.index}.requirementTypeId`, requirement.id);

  const inputId = `requirement-${requirement.id}`;

  // Fix how errors are accessed - check if the specific requirement has errors
  const error = form.errors?.[requirement.index];
  const errorMessage = error?.message || error?.value?.message;

  // Show error message below the input
  const renderError = () => {
    if (errorMessage) {
      return <p className="mt-1 text-sm text-red-500">{errorMessage}</p>;
    }
    return null;
  };

  switch (requirement.validationType) {
    case 'BOOLEAN':
      return (
        <RadioGroup
          onValueChange={(value) => form.setValue(`requirements.${requirement.index}.value`, value)}
          defaultValue={requirement.existingSubmission?.documentMetadata?.value || ''}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="true" id={`${inputId}-yes`} />
            <Label htmlFor={`${inputId}-yes`}>Yes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="false" id={`${inputId}-no`} />
            <Label htmlFor={`${inputId}-no`}>No</Label>
          </div>
        </RadioGroup>
      );
    case 'DOCUMENT':
      return (
        <div className="space-y-2">
          {requirement.existingSubmission?.documentUrl && (
            <div className="flex items-center gap-2 text-sm">
              <span>Current document:</span>
              <a
                href={requirement.existingSubmission.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View document
              </a>
            </div>
          )}
          <Input
            id={inputId}
            required={!requirement.existingSubmission && requirement.isRequired}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                form.setValue(`requirements.${requirement.index}.documentFile`, file);
              }
            }}
            className={error ? 'border-destructive' : ''}
          />
        </div>
      );
    case 'TEXT':
      return (
        <Input
          id={inputId}
          required={requirement.isRequired}
          type="text"
          {...form.register(`requirements.${requirement.index}.value`)}
          className={error ? 'border-destructive' : ''}
          defaultValue={
            requirement.existingSubmission?.documentMetadata?.value ||
            requirement.existingSubmission?.documentUrl ||
            ''
          }
        />
      );
    case 'FUTURE_DATE':
      const dateValue =
        requirement.existingSubmission?.documentMetadata?.value ||
        form.watch(`requirements.${requirement.index}.value`) ||
        null;
      return (
        <div className="max-w-64">
          <DatePickerWithInput
            date={dateValue ? new Date(dateValue) : undefined}
            onChange={(date?: Date) => {
              if (date) {
                form.setValue(
                  `requirements.${requirement.index}.value`,
                  date.toISOString().split('T')[0]
                );
              }
            }}
          />
        </div>
      );
    case 'PAST_DATE':
      const pastDateValue =
        requirement.existingSubmission?.documentMetadata?.value ||
        form.watch(`requirements.${requirement.index}.value`) ||
        null;
      return (
        <div className="max-w-64">
          <DatePickerWithInput
            date={pastDateValue ? new Date(pastDateValue) : undefined}
            onChange={(date?: Date) => {
              if (date) {
                form.setValue(
                  `requirements.${requirement.index}.value`,
                  date.toISOString().split('T')[0]
                );
              }
            }}
          />
        </div>
      );
    case 'PREDEFINED_LIST':
      const selectedValue =
        requirement.existingSubmission?.documentMetadata?.value ||
        form.watch(`requirements.${requirement.index}.value`);
      return (
        <div>
          <Select
            onValueChange={(value) =>
              form.setValue(`requirements.${requirement.index}.value`, value)
            }
            defaultValue={selectedValue}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {requirement.validationConfig?.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
              {requirement.validationConfig?.allowOther && (
                <SelectItem value="other">{requirement.validationConfig.otherLabel}</SelectItem>
              )}
            </SelectContent>
          </Select>
          {selectedValue === 'other' && requirement.validationConfig?.allowOther && (
            <Input
              type="text"
              className="mt-2 w-full"
              placeholder={requirement.validationConfig?.otherLabel}
              value={
                requirement.existingSubmission?.documentMetadata?.value === 'other'
                  ? form.watch(`requirements.${requirement.index}.otherValue`) ||
                    requirement.existingSubmission?.documentUrl ||
                    ''
                  : form.watch(`requirements.${requirement.index}.otherValue`) || ''
              }
              onChange={(e) =>
                form.setValue(`requirements.${requirement.index}.otherValue`, e.target.value)
              }
            />
          )}
        </div>
      );
    default:
      return (
        <Input
          id={inputId}
          required={requirement.isRequired}
          type="text"
          {...form.register(`requirements.${requirement.index}.value`)}
          className="input-field"
          defaultValue={
            requirement.existingSubmission?.documentMetadata?.value ||
            requirement.existingSubmission?.documentUrl ||
            ''
          }
        />
      );
  }
};
