type RequirementType = {
  id: string;
  name: string;
  description?: string | null;
  validationType: string;
  isRequired: boolean;
};

export const renderRequirementInput = (requirement: RequirementType, form: any) => {
  const inputId = `requirement-${requirement.id}`;
  switch (requirement.validationType) {
    case 'BOOLEAN':
      return (
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              id={`${inputId}-yes`}
              type="radio"
              value="true"
              {...form.register(`requirements.${requirement.id}.value`)}
            />
            <span className="ml-2">Yes</span>
          </label>
          <label className="flex items-center">
            <input
              id={`${inputId}-no`}
              type="radio"
              value="false"
              {...form.register(`requirements.${requirement.id}.value`)}
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
          {...form.register(`requirements.${requirement.id}.documentUrl`)}
        />
      );
    case 'TEXT':
      return (
        <input
          id={inputId}
          type="text"
          {...form.register(`requirements.${requirement.id}.value`)}
          className="mt-1 block w-full rounded-md border"
        />
      );
    default:
      return (
        <input
          id={inputId}
          type="text"
          {...form.register(`requirements.${requirement.id}.value`)}
          className="mt-1 block w-full rounded-md border"
        />
      );
  }
};
