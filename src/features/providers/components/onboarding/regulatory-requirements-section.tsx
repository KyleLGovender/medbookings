'use client';

import { useEffect, useState } from 'react';

import { useFormContext, useWatch } from 'react-hook-form';

import { renderRequirementInput } from '@/components/forms/render-requirement-input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getRequirementsForProviderType } from '@/features/providers/lib/provider-types';
import { RequirementType, RequirementValidationType } from '@/features/providers/types/types';

export function RegulatoryRequirementsSection() {
  const {
    control,
    setValue,
    watch,
    register,
    formState: { errors },
  } = useFormContext();
  const [requirements, setRequirements] = useState<RequirementType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Watch the provider type to dynamically update requirements
  const providerType = useWatch({
    control,
    name: 'providerType.providerType',
  });

  // Fetch requirements when provider type changes
  useEffect(() => {
    async function fetchRequirements() {
      if (!providerType) return;

      setIsLoading(true);
      try {
        const fetchedRequirements = await getRequirementsForProviderType(providerType);

        // Transform the fetched requirements to match our component's expected format
        const transformedRequirements: RequirementType[] = fetchedRequirements.map((req, idx) => ({
          id: req.id,
          name: req.name,
          description: req.description || '',
          validationType: req.validationType as RequirementValidationType,
          isRequired: req.isRequired,
          validationConfig: req.validationConfig,
          index: idx,
        }));

        setRequirements(transformedRequirements);

        // Set the requirements array with proper indexes in the form
        setValue(
          'regulatoryRequirements.requirements',
          transformedRequirements.map((req, idx) => ({
            requirementTypeId: req.id,
            index: idx,
          }))
        );
      } catch (error) {
        console.error('Failed to fetch requirements:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRequirements();
  }, [providerType, setValue]);

  const requiredRequirements = requirements.filter((req) => req.isRequired);

  if (!providerType) {
    return (
      <div className="rounded-lg bg-muted/50 p-6 text-center">
        <p className="text-muted-foreground">
          Please select a provider type to see applicable regulatory requirements.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg bg-muted/50 p-6 text-center">
        <p className="text-muted-foreground">Loading requirements...</p>
      </div>
    );
  }

  if (requirements.length === 0 && !isLoading) {
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
        {requirements.map((requirement, index) => (
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
