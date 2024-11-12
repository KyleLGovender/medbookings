import { ServiceProviderFormType } from "@/features/profile/service-provider/lib/service-provider-schema";
import { getLocalTimeZone, now } from "@internationalized/date";
import { DatePicker, DateValue } from "@nextui-org/react";
import { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";

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
};

export const renderRequirementInput = (
  requirement: RequirementType,
  form: {
    register: (name: string) => ReturnType<UseFormRegister<ServiceProviderFormType>>;
    watch: UseFormWatch<ServiceProviderFormType>;
    setValue: UseFormSetValue<ServiceProviderFormType>;
    errors: any;
  }
) => {
  const inputId = `requirement-${requirement.id}`;
  const hasError = form.errors?.value;
  const errorClass = hasError ? 'border-red-500' : 'border-gray-300';

  switch (requirement.validationType) {
    case 'BOOLEAN':
      return (
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              id={`${inputId}-yes`}
              type="radio"
              value="true"
              {...form.register('value')}
            />
            <span className="ml-2">Yes</span>
          </label>
          <label className="flex items-center">
            <input
              id={`${inputId}-no`}
              type="radio"
              value="false"
              {...form.register('value')}
            />
            <span className="ml-2">No</span>
          </label>
        </div>
      );
    case 'DOCUMENT':
      return (
        <input
          id={inputId}
          type="file"
          {...form.register('documentUrl')}
        />
      );
    case 'TEXT':
      return (
        <input
          id={inputId}
          type="text"
          {...form.register('value')}
          className={`mt-1 block w-full rounded-md border ${errorClass} px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
        />
      );
    case 'FUTURE_DATE':
      const dateValue = form.watch('value') || null;
      return (
        <DatePicker
          id={inputId}
          isRequired={requirement.isRequired}
          className="mt-1 block w-full"
          variant="bordered"
          minValue={now(getLocalTimeZone())}
          value={dateValue}
          onChange={(date: DateValue) => {
            form.setValue('value', date);
          }}
          showMonthAndYearPickers
          label="Select Date"
        />
      );
    case 'PAST_DATE':
      const pastDateValue = form.watch('value') || null;
      return (
        <DatePicker
          id={inputId}
          isRequired={requirement.isRequired}
          className="mt-1 block w-full"
          variant="bordered"
          maxValue={now(getLocalTimeZone())}
          value={pastDateValue}
          onChange={(date: DateValue) => {
            form.setValue('value', date);
          }}
          showMonthAndYearPickers
          label="Select Date"
        />
      );
    case 'PREDEFINED_LIST':
      const selectedValue = form.watch('value');
      return (
        <div>
          <select
            id={inputId}
            {...form.register('value')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select an option...</option>
            {requirement.validationConfig?.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            {requirement.validationConfig?.allowOther && (
              <option value="other">{requirement.validationConfig.otherLabel}</option>
            )}
          </select>
          {selectedValue === 'other' && requirement.validationConfig?.allowOther && (
            <input
              type="text"
              {...form.register('otherValue', {
                required: requirement.validationConfig?.otherValidation?.required ?? false,
                minLength: requirement.validationConfig?.otherValidation?.minLength,
                maxLength: requirement.validationConfig?.otherValidation?.maxLength,
              } as const)}
              placeholder={requirement.validationConfig?.otherLabel}
              className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          )}
        </div>
      );
    default:
      return (
        <input
          id={inputId}
          type="text"
          {...form.register('value')}
          className="mt-1 block w-full rounded-md border"
        />
      );
  }
};
