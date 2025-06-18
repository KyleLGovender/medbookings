import { ExternalLinkIcon, FileIcon } from 'lucide-react';
import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';

import { DocumentUploader } from '@/components/document-uploader';
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
import { RequirementType, RequirementValidationType } from '@/features/providers/hooks/types';
import { extractFilenameFromUrl } from '@/lib/utils/document-utils';

// Define a specific type for our form structure to match how we're accessing requirements
interface RequirementForm {
  regulatoryRequirements: {
    requirements: Array<{
      requirementTypeId: string;
      value?: any;
      documentUrl?: string;
      otherValue?: string;
      index?: number;
    }>;
  };
}

export const renderRequirementInput = (
  requirement: RequirementType,
  form: {
    register: UseFormRegister<any>;
    watch: UseFormWatch<any>;
    setValue: UseFormSetValue<any>;
    errors: any;
    fieldName?: string;
    existingValue?: any;
  }
) => {
  // Set the requirement ID directly
  form.setValue(
    `regulatoryRequirements.requirements.${requirement.index}.requirementTypeId`,
    requirement.id
  );

  const inputId = `requirement-${requirement.id}`;

  // Fix how errors are accessed - check if the specific requirement has errors
  const error = form.errors?.regulatoryRequirements?.requirements?.[requirement.index];
  const errorMessage = error?.message || error?.value?.message;

  // Show error message below the input
  const renderError = () => {
    if (errorMessage) {
      return <p className="mt-1 text-sm text-red-500">{errorMessage}</p>;
    }
    return null;
  };

  switch (requirement.validationType) {
    case RequirementValidationType.BOOLEAN:
      return (
        <RadioGroup
          onValueChange={(value) => {
            form.setValue(`regulatoryRequirements.requirements.${requirement.index}.value`, value);
          }}
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
    case RequirementValidationType.DOCUMENT:
      // Extract accepted file types from validation config
      const acceptedFileTypes = (requirement.validationConfig as any)?.acceptedFileTypes || [
        '.pdf',
        '.doc',
        '.docx',
        '.jpg',
        '.jpeg',
        '.png',
      ];

      return (
        <div className="space-y-2">
          {requirement.existingSubmission?.documentMetadata?.value &&
            typeof requirement.existingSubmission.documentMetadata.value === 'string' && (
              <div className="mb-4 rounded-md border bg-muted/40 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileIcon className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">
                        {extractFilenameFromUrl(
                          requirement.existingSubmission.documentMetadata.value
                        )
                          .split('/')
                          .pop()
                          ?.split('?')[0] || 'Document'}
                      </p>
                      <p className="text-xs text-muted-foreground">Uploaded document</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={requirement.existingSubmission.documentMetadata.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <ExternalLinkIcon className="mr-1 h-3 w-3" />
                      View
                    </a>
                  </div>
                </div>
              </div>
            )}
          <DocumentUploader
            acceptedFormats={acceptedFileTypes}
            purpose={requirement.name || `requirement-${requirement.index}`}
            onUpload={(fileUrl) => {
              // Only trigger validation when needed
              const shouldValidate = false;

              if (fileUrl) {
                form.setValue(
                  `regulatoryRequirements.requirements.${requirement.index}.documentMetadata`,
                  { value: fileUrl },
                  { shouldValidate }
                );

                form.setValue(
                  `regulatoryRequirements.requirements.${requirement.index}.value`,
                  fileUrl,
                  { shouldValidate }
                );
              } else {
                form.setValue(
                  `regulatoryRequirements.requirements.${requirement.index}.documentMetadata`,
                  null,
                  { shouldValidate }
                );
                form.setValue(
                  `regulatoryRequirements.requirements.${requirement.index}.value`,
                  null,
                  { shouldValidate }
                );
              }
            }}
          />
          {renderError()}
        </div>
      );
    case RequirementValidationType.TEXT:
      // For TEXT type, we need to register with a default value
      return (
        <Input
          id={inputId}
          required={requirement.isRequired}
          type="text"
          {...form.register(`regulatoryRequirements.requirements.${requirement.index}.value`, {
            value: form.existingValue || '',
          })}
          className={error ? 'border-destructive' : ''}
        />
      );
    case RequirementValidationType.FUTURE_DATE:
      const dateValue =
        requirement.existingSubmission?.documentMetadata?.value ||
        form.watch(`regulatoryRequirements.requirements.${requirement.index}.value`) ||
        null;
      return (
        <div className="max-w-64">
          <DatePickerWithInput
            date={dateValue ? new Date(dateValue) : undefined}
            onChange={(date?: Date) => {
              if (date) {
                const dateString = date.toISOString().split('T')[0];
                form.setValue(
                  `regulatoryRequirements.requirements.${requirement.index}.value`,
                  dateString
                );
              }
            }}
          />
        </div>
      );
    case RequirementValidationType.PAST_DATE:
      const pastDateValue =
        requirement.existingSubmission?.documentMetadata?.value ||
        form.watch(`regulatoryRequirements.requirements.${requirement.index}.value`) ||
        null;
      return (
        <div className="max-w-64">
          <DatePickerWithInput
            date={pastDateValue ? new Date(pastDateValue) : undefined}
            onChange={(date?: Date) => {
              if (date) {
                const dateString = date.toISOString().split('T')[0];
                form.setValue(
                  `regulatoryRequirements.requirements.${requirement.index}.value`,
                  dateString
                );
              }
            }}
          />
        </div>
      );
    case RequirementValidationType.PREDEFINED_LIST:
      const selectedValue =
        requirement.existingSubmission?.documentMetadata?.value ||
        form.watch(`regulatoryRequirements.requirements.${requirement.index}.value`);
      return (
        <div>
          <Select
            onValueChange={(value) =>
              form.setValue(`regulatoryRequirements.requirements.${requirement.index}.value`, value)
            }
            defaultValue={selectedValue}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an option..." />
            </SelectTrigger>
            <SelectContent>
              {requirement.validationConfig &&
                'options' in requirement.validationConfig &&
                requirement.validationConfig.options?.map((option: any) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              {requirement.validationConfig &&
                'allowOther' in requirement.validationConfig &&
                requirement.validationConfig.allowOther && (
                  <SelectItem value="other">
                    {requirement.validationConfig.otherLabel || 'Other'}
                  </SelectItem>
                )}
            </SelectContent>
          </Select>
          {selectedValue === 'other' &&
            requirement.validationConfig &&
            'allowOther' in requirement.validationConfig &&
            requirement.validationConfig.allowOther && (
              <Input
                type="text"
                className="mt-2 w-full"
                placeholder={
                  requirement.validationConfig && 'otherLabel' in requirement.validationConfig
                    ? requirement.validationConfig.otherLabel
                    : 'Please specify'
                }
                value={
                  requirement.existingSubmission?.documentMetadata?.value === 'other'
                    ? form.watch(
                        `regulatoryRequirements.requirements.${requirement.index}.otherValue`
                      ) ||
                      requirement.existingSubmission?.documentUrl ||
                      ''
                    : form.watch(
                        `regulatoryRequirements.requirements.${requirement.index}.otherValue`
                      ) || ''
                }
                onChange={(e) => {
                  form.setValue(
                    `regulatoryRequirements.requirements.${requirement.index}.otherValue`,
                    e.target.value
                  );
                }}
              />
            )}
          {renderError()}
        </div>
      );
    case RequirementValidationType.NUMBER:
      return (
        <Input
          id={inputId}
          required={requirement.isRequired}
          type="number"
          min={(requirement.validationConfig as any)?.min}
          max={(requirement.validationConfig as any)?.max}
          step={(requirement.validationConfig as any)?.step || 1}
          {...form.register(`regulatoryRequirements.requirements.${requirement.index}.value`)}
          className={error ? 'border-destructive' : ''}
          defaultValue={requirement.existingSubmission?.documentMetadata?.value || ''}
        />
      );
    default:
      return (
        <Input
          id={inputId}
          required={requirement.isRequired}
          type="text"
          {...form.register(`regulatoryRequirements.requirements.${requirement.index}.value`)}
          className={error ? 'border-destructive' : ''}
          defaultValue={requirement.existingSubmission?.documentMetadata?.value || ''}
        />
      );
  }
};
