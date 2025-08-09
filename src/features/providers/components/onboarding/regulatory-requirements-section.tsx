'use client';

import { useEffect, useState } from 'react';

import { useFormContext } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { renderRequirementInput } from '@/features/providers/components/render-requirement-input';
import { RequirementValidationType } from '@prisma/client';
import { type RouterOutputs } from '@/utils/api';

type RequirementType = RouterOutputs['admin']['getProviderRequirements'][number]['requirementType'] & {
  index: number;
  existingSubmission?: RouterOutputs['admin']['getProviderRequirements'][number];
};

interface RegulatoryRequirementsSectionProps {
  requirements: Array<{
    id: string;
    name: string;
    description: string | null;
    validationType: string;
    isRequired: boolean;
    validationConfig: any;
    displayPriority?: number;
  }>;
  selectedProviderTypeId: string;
}

export function RegulatoryRequirementsSection({
  requirements,
  selectedProviderTypeId,
}: RegulatoryRequirementsSectionProps) {
  const {
    control,
    setValue,
    watch,
    register,
    formState: { errors },
  } = useFormContext();
  const [transformedRequirements, setTransformedRequirements] = useState<RequirementType[]>([]);

  // Transform requirements when they change
  useEffect(() => {
    if (!selectedProviderTypeId || requirements.length === 0) {
      setTransformedRequirements([]);
      return;
    }

    // Transform the requirements to match our component's expected format
    const transformedReqs: RequirementType[] = requirements.map((req, idx) => ({
      id: req.id,
      name: req.name,
      description: req.description || '',
      validationType: req.validationType as RequirementValidationType,
      isRequired: req.isRequired,
      validationConfig: req.validationConfig,
      displayPriority: req.displayPriority,
      index: idx,
    }));

    setTransformedRequirements(transformedReqs);

    // Set the requirements array with proper indexes in the form
    setValue(
      'regulatoryRequirements.requirements',
      transformedReqs.map((req, idx) => ({
        requirementTypeId: req.id,
        index: idx,
      }))
    );
  }, [requirements, selectedProviderTypeId, setValue]);

  const requiredRequirements = transformedRequirements.filter((req) => req.isRequired);

  if (!selectedProviderTypeId) {
    return (
      <div className="rounded-lg bg-muted/50 p-6 text-center">
        <p className="text-muted-foreground">
          Please select a provider type to see applicable regulatory requirements.
        </p>
      </div>
    );
  }

  if (transformedRequirements.length === 0) {
    return (
      <div className="rounded-lg bg-muted/50 p-6 text-center">
        <p className="text-muted-foreground">
          No regulatory requirements found for this provider type.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Complete all required regulatory documentation to verify your credentials.
        </p>

        <Badge variant="secondary">{requiredRequirements.length} Required</Badge>
      </div>

      <div className="space-y-4">
        {transformedRequirements
          .sort((a, b) => (a.displayPriority ?? 999) - (b.displayPriority ?? 999))
          .map((requirement, index) => (
            <Card key={requirement.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      {requirement.name}
                      {requirement.isRequired && (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">{requirement.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {renderRequirementInput(requirement, {
                  register,
                  watch,
                  setValue,
                  errors,
                })}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
