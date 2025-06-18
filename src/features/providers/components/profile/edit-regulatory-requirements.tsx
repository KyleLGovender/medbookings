'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { RequirementsValidationStatus } from '@prisma/client';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

import CalendarLoader from '@/components/calendar-loader';
import { Badge } from '@/components/ui/badge';
// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Toast notifications
import { useToast } from '@/hooks/use-toast';
import { providerDebug } from '@/lib/debug';

// API hooks
import { RequirementType } from '../../hooks/types';
import { useProvider } from '../../hooks/use-provider';
import {
  useProviderRequirementTypes,
  useUpdateProviderRequirements,
} from '../../hooks/use-provider-requirements';
import { renderRequirementInput } from '../render-requirement-input';

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

  // Fetch provider data
  const providerQuery = useProvider(providerId);
  const provider = providerQuery.data;
  const isProviderLoading = providerQuery.isLoading;
  const providerError = providerQuery.error;

  // Fetch requirement types for this provider
  const {
    data: requirementTypes,
    isLoading: isRequirementsLoading,
    error: requirementsError,
  } = useProviderRequirementTypes(providerId) as {
    data: RequirementType[];
    isLoading: boolean;
    error: Error | null;
  };

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
  const mutation = useUpdateProviderRequirements();

  // Update form values when provider and requirement types data is loaded
  useEffect(() => {
    if (!provider || !requirementTypes) return;

    // Get existing requirement submissions from provider data
    const existingRequirements = provider.requirementSubmissions || [];

    // Prepare form data by merging requirement types with existing submissions
    const requirementsData = requirementTypes.map((req) => {
      // Find existing submission for this requirement type
      const existingSubmission = existingRequirements.find(
        (sub) => sub.requirementTypeId === req.id
      );

      // Create form entry with proper values
      const formEntry: any = {
        requirementTypeId: req.id,
        index: req.index,
      };

      // If there's an existing submission, pre-populate the value
      if (existingSubmission) {
        // Handle different types of values based on requirement type
        if (existingSubmission.documentMetadata?.value !== undefined) {
          formEntry.value = existingSubmission.documentMetadata.value;
        } else if (
          existingSubmission.documentMetadata?.value &&
          typeof existingSubmission.documentMetadata.value === 'string'
        ) {
          formEntry.value = existingSubmission.documentMetadata.value;
        }
      }

      return formEntry;
    });

    // Reset the form with the merged data
    methods.reset({
      regulatoryRequirements: {
        requirements: requirementsData,
      },
    });
  }, [provider, requirementTypes, methods]);

  // Check if current user is authorized to edit this provider
  useEffect(() => {
    if (provider && provider.userId !== userId) {
      router.push('/dashboard');
    }
  }, [provider, userId, router]);

  const onSubmit = async (data: RegulatoryRequirementsFormValues) => {
    if (!provider) return;

    try {
      // Create FormData object for the API
      const formData = new FormData();
      formData.append('id', providerId);
      formData.append('userId', userId);

      // Process each requirement
      const requirementsData = data.regulatoryRequirements?.requirements || [];

      requirementsData.forEach((req, index) => {
        if (req) {
          formData.append(`requirements[${index}][requirementTypeId]`, req.requirementTypeId);

          // For document type requirements, prioritize using the value as documentMetadata
          if (
            req.value !== undefined &&
            req.value !== null &&
            typeof req.value === 'string' &&
            (req.value.startsWith('http://') || req.value.startsWith('https://'))
          ) {
            // This is likely a document URL, so create proper document metadata
            formData.append(
              `requirements[${index}][documentMetadata]`,
              JSON.stringify({ value: req.value })
            );
            formData.append(`requirements[${index}][value]`, req.value.toString());
          }
          // Handle regular text/boolean values
          else if (req.value !== undefined && req.value !== null) {
            formData.append(`requirements[${index}][value]`, req.value.toString());
          }

          // Handle other values for predefined lists
          if (req.otherValue) {
            formData.append(`requirements[${index}][otherValue]`, req.otherValue);
          }
        }
      });

      providerDebug.logFormData('editRegulatoryRequirements', formData);
      mutation.mutate(formData, {
        onSuccess: (data) => {
          toast({
            title: 'Success',
            description: 'Regulatory requirements updated successfully.',
          });

          // Navigate back to profile view or redirect
          if (data.redirect) {
            router.push(data.redirect);
          } else {
            router.push(`/providers/${providerId}/edit`);
          }
          router.refresh();
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to update requirements',
            variant: 'destructive',
          });
        },
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update regulatory requirements. Please try again.',
        variant: 'destructive',
      });
    }
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
      {mutation.isPending && (
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
              {requirementTypes.length === 0 ? (
                <div className="py-4 text-center text-muted-foreground">
                  No regulatory requirements found for this provider type.
                </div>
              ) : (
                <div className="space-y-6">
                  {requirementTypes.map((requirement: RequirementType, index) => {
                    // Find existing submission for this requirement
                    const existingSubmission = provider.requirementSubmissions?.find(
                      (sub) => sub.requirementTypeId === requirement.id
                    );

                    // Get the field name for this requirement
                    const fieldName = `regulatoryRequirements.requirements.${index}`;
                    const fieldError =
                      methods.formState.errors?.regulatoryRequirements?.requirements?.[index];

                    return (
                      <div key={requirement.id} className="rounded-md border p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <h3 className="text-sm font-medium">
                              {requirement.name}
                              {requirement.isRequired && <span className="text-red-500">*</span>}
                              {existingSubmission && existingSubmission.status && (
                                <span className="ml-2">
                                  {renderValidationStatus(existingSubmission.status)}
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
                          {renderRequirementInput(requirement, {
                            register: methods.register,
                            watch: methods.watch,
                            setValue: methods.setValue,
                            errors: methods.formState.errors,
                            fieldName,
                            existingValue: existingSubmission?.documentMetadata?.value,
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
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Saving...' : 'Save Requirements'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </FormProvider>
    </>
  );
}
