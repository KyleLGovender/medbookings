'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Send } from 'lucide-react';
import { FormProvider, SubmitHandler, useForm, useWatch } from 'react-hook-form';

import CalendarLoader from '@/components/calendar-loader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { useCreateProvider } from '@/features/providers/hooks/use-create-provider';
import { ProviderFormType, providerFormSchema } from '@/features/providers/types/schemas';
import { useToast } from '@/hooks/use-toast';
import { type RouterOutputs, api } from '@/utils/api';

import { BasicInfoSection } from './basic-info-section';
import { ProviderTypeSection } from './provider-type-section';
import { RegulatoryRequirementsSection } from './regulatory-requirements-section';
import { ServicesSection } from './services-section';

// Extract OnboardingData type from tRPC procedure output for zero type drift
type OnboardingData = RouterOutputs['providers']['getOnboardingData'];

export function ProviderOnboardingForm() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [missingDocuments, setMissingDocuments] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch consolidated onboarding data
  const {
    data: onboardingData,
    isLoading: isLoadingData,
    error: dataError,
  } = api.providers.getOnboardingData.useQuery();

  const methods = useForm<ProviderFormType>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: {
      basicInfo: {
        name: '',
        bio: '',
        image: '',
        languages: [],
        website: '',
        email: '',
        whatsapp: '',
      },
      providerType: {}, // Empty object since we moved the field to root level
      providerTypeIds: [], // Added at root level for multiple types
      providerTypeId: '', // Keep for backward compatibility
      regulatoryRequirements: {
        requirements: [],
      },
      services: {
        availableServices: [],
      },
      termsAccepted: false,
    },
    mode: 'onBlur',
  });

  // Watch the selected provider types to orchestrate data flow
  const watchedProviderTypeIds = methods.watch('providerTypeIds');
  const selectedProviderTypeIds = useMemo(
    () => watchedProviderTypeIds || [],
    [watchedProviderTypeIds]
  );

  // Get filtered data based on selected provider types - memoized to prevent infinite loops
  const selectedProviderTypes = useMemo(
    () =>
      onboardingData?.providerTypes.filter((type) => selectedProviderTypeIds.includes(type.id)) ||
      [],
    [onboardingData?.providerTypes, selectedProviderTypeIds]
  );

  // Collect all requirements and services from selected types - memoized to prevent infinite loops
  const uniqueRequirementsForSelectedTypes = useMemo(() => {
    const allRequirementsForSelectedTypes = selectedProviderTypeIds.flatMap(
      (typeId) => onboardingData?.requirements[typeId] || []
    );
    // Remove duplicates by requirement ID
    return allRequirementsForSelectedTypes.filter(
      (requirement, index, array) => array.findIndex((r) => r.id === requirement.id) === index
    );
  }, [selectedProviderTypeIds, onboardingData?.requirements]);

  const uniqueServicesForSelectedTypes = useMemo(() => {
    const allServicesForSelectedTypes = selectedProviderTypeIds.flatMap(
      (typeId) => onboardingData?.services[typeId] || []
    );
    // Remove duplicates by service ID
    return allServicesForSelectedTypes.filter(
      (service, index, array) => array.findIndex((s) => s.id === service.id) === index
    );
  }, [selectedProviderTypeIds, onboardingData?.services]);

  const updateFormErrors = useCallback(() => {
    // Collect errors from form state
    const errors = Object.entries(methods.formState.errors)
      .flatMap(([key, value]) => {
        if (key === 'basicInfo' || key === 'providerType') {
          // Handle nested errors
          const sectionErrors = Object.entries(value as Record<string, { message?: string }>)
            .filter(([_, err]) => err.message)
            .map(([field, err]) => `${field}: ${err.message}`);
          return sectionErrors;
        }
        if (key === 'services') {
          // Handle service errors - value is a FieldError from react-hook-form
          const servicesError = value as Record<string, unknown>;

          if (
            typeof servicesError === 'object' &&
            servicesError !== null &&
            'availableServices' in servicesError
          ) {
            const availableServices = servicesError.availableServices as { message?: string };
            if (availableServices?.message) {
              return [`services: ${availableServices.message}`];
            }
          }

          // Handle service configs errors (price, duration)
          if (
            typeof servicesError === 'object' &&
            servicesError !== null &&
            'serviceConfigs' in servicesError
          ) {
            const serviceConfigErrors: string[] = [];
            const serviceConfigs = servicesError.serviceConfigs as Record<string, unknown>;

            // Extract service config errors
            Object.entries(serviceConfigs).forEach(([serviceId, serviceConfig]) => {
              if (typeof serviceConfig === 'object' && serviceConfig !== null) {
                const config = serviceConfig as Record<string, { message?: string }>;
                if (config.price?.message) {
                  serviceConfigErrors.push(`Service price: ${config.price.message}`);
                }
                if (config.duration?.message) {
                  serviceConfigErrors.push(`Service duration: ${config.duration.message}`);
                }
              }
            });

            return serviceConfigErrors;
          }

          return [];
        }
        if (key === 'regulatoryRequirements') {
          return ['Please complete all required regulatory requirements'];
        }
        if (key === 'termsAccepted') {
          return ['You must accept the terms and conditions'];
        }
        // Handle any other top-level errors
        if (
          typeof value === 'object' &&
          value !== null &&
          'message' in value &&
          typeof (value as { message: unknown }).message === 'string'
        ) {
          return [`${key}: ${(value as { message: string }).message}`];
        }
        return [];
      })
      .filter(Boolean);

    // Set errors directly without checking previous state to avoid loops
    setFormErrors(errors);
  }, [methods.formState.errors]);

  // Watch requirements for validation (moved before useCallback to avoid stale closures)
  // Use useWatch for deep nested object tracking instead of methods.watch()
  const watchedRequirements = useWatch({
    control: methods.control,
    name: 'regulatoryRequirements.requirements',
    defaultValue: [],
  });

  // Update form state when provider types change
  useEffect(() => {
    if (selectedProviderTypeIds.length > 0 && onboardingData) {
      // Set requirements in form state from all selected types
      methods.setValue(
        'regulatoryRequirements.requirements',
        uniqueRequirementsForSelectedTypes.map((req, idx) => ({
          requirementTypeId: req.id as string,
          index: idx as number,
        }))
      );

      // Reset services selection when provider types change
      methods.setValue('services.availableServices', []);

      // Store the full service objects for reference in services section (all services from selected types)
      methods.setValue('services.loadedServices', uniqueServicesForSelectedTypes);

      if (selectedProviderTypes.length === 1) {
        toast({
          title: 'Provider type selected',
          description: `Data for ${selectedProviderTypes[0].name} has been loaded.`,
        });
      } else if (selectedProviderTypes.length > 1) {
        toast({
          title: 'Provider types selected',
          description: `Data for ${selectedProviderTypes.length} provider types has been loaded.`,
        });
      }
    }
  }, [
    selectedProviderTypeIds,
    onboardingData,
    methods,
    toast,
    selectedProviderTypes,
    uniqueRequirementsForSelectedTypes,
    uniqueServicesForSelectedTypes,
  ]);

  // Watch for validation errors - only update on submission
  useEffect(() => {
    if (methods.formState.isSubmitted && Object.keys(methods.formState.errors).length > 0) {
      updateFormErrors();
    }
  }, [methods.formState.isSubmitted, methods.formState.errors, updateFormErrors]);

  // Serialize requirements for deep comparison in dependency array
  const serializedRequirements = JSON.stringify(watchedRequirements);

  // Validate required documents when requirements change
  useEffect(() => {
    if (!onboardingData || uniqueRequirementsForSelectedTypes.length === 0) {
      setMissingDocuments([]);
      return;
    }

    const missing: string[] = [];
    // Use getValues() to ensure we read the latest state (not cached watcher data)
    const formRequirements = methods.getValues('regulatoryRequirements.requirements') || [];

    // Check each required requirement
    uniqueRequirementsForSelectedTypes.forEach((reqType) => {
      if (reqType.isRequired && reqType.validationType === 'DOCUMENT') {
        // Find the submission for this requirement
        const submission = formRequirements.find((r) => r.requirementTypeId === reqType.id);

        // Simplified validation: check value field directly (set by DocumentUploader)
        const hasValidDocument =
          submission?.value &&
          typeof submission.value === 'string' &&
          submission.value.trim().length > 0 &&
          (submission.value.startsWith('http://') || submission.value.startsWith('https://'));

        if (!hasValidDocument) {
          missing.push(reqType.name);
        }
      }
    });

    setMissingDocuments(missing);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- serializedRequirements already tracks watchedRequirements deeply
  }, [serializedRequirements, uniqueRequirementsForSelectedTypes, onboardingData, methods]);

  // tRPC mutation
  const mutation = useCreateProvider({
    onSuccess: (data) => {
      toast({
        title: 'Application submitted successfully!',
        description:
          'Your provider application has been submitted for review. You will receive an email confirmation shortly.',
      });

      // Redirect if provided in the response
      const result = data as { redirect?: string };
      if (result.redirect) {
        window.location.href = result.redirect;
      }
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : 'There was an error submitting your application. Please try again.';
      toast({
        title: 'Submission failed',
        description: message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit: SubmitHandler<ProviderFormType> = (data) => {
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = () => {
    setShowConfirmDialog(false);
    const formData = methods.getValues();
    mutation.mutate(formData);
  };

  const handleInvalidSubmit = () => {
    // On invalid submit, directly update errors
    updateFormErrors();

    toast({
      title: 'Please fix the errors in the form',
      description: 'There are validation errors that need to be fixed before submitting.',
      variant: 'destructive',
    });
  };

  // Show loading state while fetching data
  if (isLoadingData) {
    return (
      <CalendarLoader
        message="Loading onboarding data"
        submessage="Preparing your provider application form..."
        showAfterMs={0}
      />
    );
  }

  // Show error state if data loading failed
  if (dataError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load onboarding data. Please refresh the page and try again.
        </AlertDescription>
      </Alert>
    );
  }

  // Don't render form if data is not loaded yet
  if (!onboardingData) {
    return null;
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit, handleInvalidSubmit)} className="space-y-8">
        {formErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5">
                {formErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Card className="p-6">
          <h2 className="text-2xl font-bold">Basic Information</h2>
          <p className="text-sm text-muted-foreground">
            Let potential patients know who you are with your basic details.
          </p>
          <Separator className="my-4" />
          <BasicInfoSection />
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-bold">Provider Type</h2>
          <p className="text-sm text-muted-foreground">
            Select your medical profession or specialty.
          </p>
          <Separator className="my-4" />
          <ProviderTypeSection
            providerTypes={onboardingData.providerTypes}
            selectedProviderTypes={selectedProviderTypes}
            totalRequirementsCount={uniqueRequirementsForSelectedTypes.length}
            totalServicesCount={uniqueServicesForSelectedTypes.length}
            multipleSelection={true}
          />
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-bold">Services</h2>
          <p className="text-sm text-muted-foreground">
            Let patients know what services you offer and your fee structure.
          </p>
          <Separator className="my-4" />
          <ServicesSection
            availableServices={uniqueServicesForSelectedTypes}
            selectedProviderTypeId={selectedProviderTypeIds[0] || ''}
          />
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-bold">Regulatory Requirements</h2>
          <p className="text-sm text-muted-foreground">
            Please complete all required regulatory information and upload necessary documents.
          </p>
          <Separator className="my-4" />
          <RegulatoryRequirementsSection
            requirements={uniqueRequirementsForSelectedTypes}
            selectedProviderTypeId={selectedProviderTypeIds[0] || ''}
          />
        </Card>

        <FormField
          control={methods.control}
          name="termsAccepted"
          render={({ field }) => (
            <FormItem className="flex flex-col space-y-4 rounded-md border p-4">
              <div className="flex flex-row items-start space-x-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="termsAccepted"
                    aria-describedby="terms-error"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel
                    htmlFor="termsAccepted"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I accept the terms and conditions
                  </FormLabel>
                  <p className="text-xs text-muted-foreground">
                    By submitting this application, you agree to our{' '}
                    <a href="/terms-of-use" className="text-primary underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy-policy" className="text-primary underline">
                      Privacy Policy
                    </a>
                    .
                  </p>
                </div>
              </div>
              <FormMessage id="terms-error" className="mt-2" />
            </FormItem>
          )}
        />

        {missingDocuments.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Missing Required Documents</AlertTitle>
            <AlertDescription>
              <p className="mb-2">
                Please upload the following required documents before submitting:
              </p>
              <ul className="list-disc pl-5">
                {missingDocuments.map((docName, index) => (
                  <li key={index}>{docName}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end space-x-4">
          <Button type="reset" variant="outline" onClick={() => methods.reset()}>
            Reset
          </Button>
          <Button type="submit" disabled={mutation.isPending || missingDocuments.length > 0}>
            {mutation.isPending ? 'Submitting...' : 'Submit Application'}{' '}
            <Send className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Submission</DialogTitle>
              <DialogDescription>
                Your submission should be reviewed within 2 business days. You will be able to edit
                your submission at any time.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmSubmit} disabled={mutation.isPending}>
                {mutation.isPending ? 'Submitting...' : 'Confirm Submission'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </form>
    </FormProvider>
  );
}
