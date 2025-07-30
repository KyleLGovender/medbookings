'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

// UI Components
import CalendarLoader from '@/components/calendar-loader';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Feature components
import { renderRequirementInput } from '@/features/providers/components/render-requirement-input';
import { useProvider } from '@/features/providers/hooks/use-provider';
import { useProviderRequirementTypes } from '@/features/providers/hooks/use-provider-requirements';
import { useUpdateProviderRequirements } from '@/features/providers/hooks/use-provider-updates';
// Toast notifications
import { useToast } from '@/hooks/use-toast';

export const regulatoryRequirementsSchema = z.object({
  regulatoryRequirements: z.object({
    requirements: z
      .array(
        z.object({
          requirementTypeId: z.string(),
          value: z.any().optional(),
          documentMetadata: z.record(z.any()).optional(), // For storing document URLs and other metadata
          otherValue: z.string().optional(),
        })
      )
      .min(1, 'Please complete all required regulatory requirements'),
  }),
});

type RegulatoryRequirementsFormValues = z.infer<typeof regulatoryRequirementsSchema>;

interface EditRegulatoryRequirementsProps {
  providerId: string;
  userId: string;
}

export function EditRegulatoryRequirements({
  providerId,
  userId,
}: EditRegulatoryRequirementsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch provider data
  const {
    data: provider,
    isLoading: isProviderLoading,
    error: providerError,
    refetch,
  } = useProvider(providerId);

  // Fetch requirement types for this provider
  const {
    data: requirementTypes,
    isLoading: isRequirementsLoading,
    error: requirementsError,
  } = useProviderRequirementTypes(providerId) as any;

  // Set up form with default values
  const methods = useForm<RegulatoryRequirementsFormValues>({
    resolver: zodResolver(regulatoryRequirementsSchema),
    defaultValues: {
      regulatoryRequirements: {
        requirements: [],
      },
    },
    mode: 'onBlur',
  });

  // Get mutation hook for updating requirements
  const updateRequirementsMutation = useUpdateProviderRequirements();

  // Update form values when provider and requirement types data is loaded
  useEffect(() => {
    if (!provider || !requirementTypes) return;

    // Get existing requirement submissions from provider data
    const existingRequirements = provider.requirementSubmissions || [];

    // Prepare form data by merging requirement types with existing submissions
    const requirementsData = requirementTypes.map((req: any, index: number) => {
      // Find existing submission for this specific requirement type
      const existingSubmission = existingRequirements.find(
        (sub: any) => sub.requirementTypeId === req.id
      );

      // Create form entry with proper values - ONLY for THIS requirement
      const formEntry: any = {
        requirementTypeId: req.id,
        // Don't set any value initially - let the render function handle it
      };

      return formEntry;
    });

    // Reset the form with the merged data
    methods.reset({
      regulatoryRequirements: {
        requirements: requirementsData,
      },
    });
  }, [provider, requirementTypes, methods]);

  // Create indexed requirement types for rendering
  const indexedRequirementTypes = requirementTypes
    ? requirementTypes.map((req: any, index: number) => ({
        ...req,
        index: index,
      }))
    : [];

  // Check if current user is authorized to edit this provider
  useEffect(() => {
    if (provider && provider.userId !== userId) {
      router.push('/dashboard');
    }
  }, [provider, userId, router]);

  const onSubmit = async (data: RegulatoryRequirementsFormValues) => {
    if (!provider) return;

    setIsSubmitting(true);

    try {
      // Process each requirement
      const requirementsData = data.regulatoryRequirements?.requirements || [];

      // Transform the data to match the tRPC schema format
      const requirements = requirementsData
        .filter((req) => req && req.requirementTypeId) // Only include valid requirements
        .map((req) => {
          const transformedReq: any = {
            requirementTypeId: req.requirementTypeId,
          };

          // For document type requirements, prioritize using the value as documentMetadata
          if (
            req.value !== undefined &&
            req.value !== null &&
            typeof req.value === 'string' &&
            (req.value.startsWith('http://') || req.value.startsWith('https://'))
          ) {
            // This is likely a document URL, so create proper document metadata
            transformedReq.documentMetadata = { value: req.value };
            transformedReq.value = req.value;
          }
          // Handle regular text/boolean values
          else if (req.value !== undefined && req.value !== null) {
            transformedReq.value = req.value.toString();
          }

          // Handle other values for predefined lists
          if (req.otherValue) {
            transformedReq.otherValue = req.otherValue;
          }

          return transformedReq;
        });

      // Use mutateAsync to properly await the result
      await updateRequirementsMutation.mutateAsync({
        id: providerId,
        requirements,
      });

      // Invalidate and refetch provider data
      queryClient.invalidateQueries({ queryKey: ['provider', providerId] });
      queryClient.invalidateQueries({ queryKey: ['providerRequirementTypes'] });

      toast({
        title: 'Success',
        description: 'Regulatory requirements updated successfully.',
      });

      // Force a hard refetch to ensure we have the latest data
      refetch();

      // Redirect to the provider profile view
      router.push(`/providers/${providerId}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update requirements',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (isProviderLoading || isRequirementsLoading) {
    return <CalendarLoader message="Loading" submessage="Fetching regulatory requirements..." />;
  }

  // Show error state
  if (providerError || requirementsError || !provider || !requirementTypes) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold text-red-500">Error</h2>
        <p>Failed to load regulatory requirements data. Please try again later.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <>
      {isSubmitting && (
        <CalendarLoader message="Saving Changes" submessage="Updating your requirements..." />
      )}
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Regulatory Requirements</CardTitle>
              <CardDescription>
                Upload or provide the required regulatory documentation for your provider type.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {indexedRequirementTypes.length === 0 ? (
                <div className="py-4 text-center text-muted-foreground">
                  No regulatory requirements found for this provider type.
                </div>
              ) : (
                <div className="space-y-6">
                  {indexedRequirementTypes.map((requirement: any, index: number) => {
                    // Find existing submission for this requirement
                    const existingSubmission = provider.requirementSubmissions?.find(
                      (sub: any) => sub.requirementTypeId === requirement.id
                    );

                    // Get the field name for this requirement
                    const fieldName = `regulatoryRequirements.requirements.${index}`;
                    const fieldError =
                      methods.formState.errors?.regulatoryRequirements?.requirements?.[index];

                    // Create requirement object with existing submission data
                    const requirementWithSubmission = {
                      ...requirement,
                      existingSubmission,
                      index, // Ensure index is set correctly
                    };

                    return (
                      <div key={requirement.id} className="rounded-md border p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <h3 className="text-sm font-medium">
                              {requirement.name}
                              {requirement.isRequired && <span className="text-red-500">*</span>}
                              {existingSubmission && existingSubmission.status && (
                                <span className="ml-2">
                                  <StatusBadge
                                    status={
                                      existingSubmission.status as
                                        | 'PENDING'
                                        | 'APPROVED'
                                        | 'REJECTED'
                                        | 'SUSPENDED'
                                    }
                                  />
                                </span>
                              )}
                            </h3>
                          </div>
                        </div>

                        {requirement.description && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {requirement.description}
                          </p>
                        )}

                        <div className="mt-4">
                          {renderRequirementInput(requirementWithSubmission, {
                            register: methods.register,
                            watch: methods.watch,
                            setValue: methods.setValue,
                            errors: methods.formState.errors,
                            fieldName,
                            existingValue:
                              existingSubmission?.documentMetadata?.value ||
                              existingSubmission?.value,
                          })}
                          {fieldError && (
                            <p className="mt-1 text-xs text-red-500">
                              {fieldError.message?.toString() || 'This field is required'}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Requirements'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </FormProvider>
    </>
  );
}
