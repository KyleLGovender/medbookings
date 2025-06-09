'use client';

import { useEffect, useState } from 'react';

import { useFormContext } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useUpdateProviderRequirements } from '@/features/providers/hooks/use-provider-requirements';
import { getRequirementsForProviderType } from '@/features/providers/lib/provider-types';
import {
  RequirementSubmission,
  RequirementType,
  RequirementValidationType,
  RequirementsValidationStatus,
} from '@/features/providers/types/types';
import { useToast } from '@/hooks/use-toast';

// Helper function to render the appropriate input for each requirement type
import { renderRequirementInput } from '../render-requirement-input';

interface EditRegulatoryRequirementsProps {
  providerId: string;
  userId: string;
  providerTypeId: string;
  existingRequirements?: RequirementSubmission[];
}

export function EditRegulatoryRequirements({
  providerId,
  userId,
  providerTypeId,
  existingRequirements = [],
}: EditRegulatoryRequirementsProps) {
  const [requirements, setRequirements] = useState<RequirementType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const {
    control,
    setValue,
    watch,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useFormContext();

  const { mutate, isPending } = useUpdateProviderRequirements();

  // Fetch requirements when provider type changes or component mounts
  useEffect(() => {
    async function fetchRequirements() {
      if (!providerTypeId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const fetchedRequirements = await getRequirementsForProviderType(providerTypeId);

        // Transform the fetched requirements to match our component's expected format
        // and merge with existing submissions
        const transformedRequirements = fetchedRequirements.map((req, idx) => {
          // Find existing submission for this requirement type
          const existingSubmission = existingRequirements.find(
            (sub) => sub.requirementTypeId === req.id
          );

          // Create a properly typed requirement object
          return {
            id: req.id,
            name: req.name,
            description: req.description || '',
            validationType: req.validationType as RequirementValidationType,
            isRequired: req.isRequired,
            validationConfig: req.validationConfig,
            index: idx,
            existingSubmission: existingSubmission
              ? {
                  documentUrl: existingSubmission.documentUrl || null,
                  documentMetadata: existingSubmission.documentMetadata || null,
                  // Add these properties to the type for our component's use
                  validationStatus: existingSubmission.status,
                  validationMessage: existingSubmission.notes,
                  value: existingSubmission.value,
                }
              : undefined,
          };
        });

        setRequirements(transformedRequirements);

        // Set the requirements array with proper indexes in the form
        setValue(
          'regulatoryRequirements.requirements',
          transformedRequirements.map((req, idx) => ({
            requirementTypeId: req.id,
            index: idx,
            // If there's an existing submission, pre-populate the value
            ...(req.existingSubmission && {
              value: req.existingSubmission.documentMetadata?.value || '',
            }),
          }))
        );
      } catch (error) {
        console.error('Failed to fetch requirements:', error);
        toast({
          title: 'Error',
          description: 'Failed to load regulatory requirements. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchRequirements();
  }, [providerTypeId, existingRequirements, setValue, toast]);

  const onSubmit = async (data: any) => {
    try {
      const formData = new FormData();
      formData.append('id', providerId);
      formData.append('userId', userId);

      // Process each requirement
      const requirementsData = data.regulatoryRequirements?.requirements || [];

      requirementsData.forEach((req: any, index: number) => {
        if (req) {
          formData.append(`requirements[${index}].requirementTypeId`, req.requirementTypeId);

          // Handle document files
          if (req.documentFile) {
            formData.append(`requirements[${index}].documentFile`, req.documentFile);
          }

          // Handle text/boolean values
          if (req.value !== undefined && req.value !== null) {
            formData.append(`requirements[${index}].value`, req.value.toString());
          }
        }
      });

      await mutate(formData);

      toast({
        title: 'Success',
        description: 'Regulatory requirements updated successfully.',
      });
    } catch (error) {
      console.error('Failed to update requirements:', error);
      toast({
        title: 'Error',
        description: 'Failed to update regulatory requirements. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Use a custom type that extends the base type for our component
  type ExtendedRequirementSubmission = {
    documentUrl: string | null;
    documentMetadata: Record<string, any> | null;
    validationStatus?: RequirementsValidationStatus;
    validationMessage?: string | null;
    value?: string | boolean | number | null;
  };

  const renderValidationStatus = (status?: RequirementsValidationStatus) => {
    if (!status) return null;

    switch (status) {
      case RequirementsValidationStatus.APPROVED:
        return <Badge className="bg-green-500">Approved</Badge>;
      case RequirementsValidationStatus.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>;
      case RequirementsValidationStatus.PENDING:
        return <Badge variant="secondary">Pending Review</Badge>;
      default:
        return null;
    }
  };

  const requiredRequirements = requirements.filter((req) => req.isRequired);

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
      <div>
        <h3 className="text-lg font-medium">Regulatory Requirements</h3>
        <p className="text-sm text-muted-foreground">
          Manage your regulatory documentation and credentials.
        </p>
      </div>

      <Separator />

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
                  {requirement.existingSubmission &&
                    renderValidationStatus(
                      (requirement.existingSubmission as ExtendedRequirementSubmission)
                        .validationStatus
                    )}
                </div>
              </CardHeader>
              <CardContent>
                {renderRequirementInput(requirement, {
                  register,
                  watch,
                  setValue,
                  errors,
                })}

                {requirement.existingSubmission &&
                  (requirement.existingSubmission as ExtendedRequirementSubmission)
                    .validationStatus === RequirementsValidationStatus.REJECTED && (
                    <div className="mt-2 rounded-md bg-red-50 p-3 text-sm text-red-800">
                      <p className="font-medium">Rejection reason:</p>
                      <p>
                        {(requirement.existingSubmission as ExtendedRequirementSubmission)
                          .validationMessage || 'No reason provided'}
                      </p>
                    </div>
                  )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || isPending}
          >
            {isPending ? 'Saving...' : 'Save Requirements'}
          </Button>
        </div>
      </div>
    </div>
  );
}
