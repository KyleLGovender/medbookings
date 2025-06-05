'use client';

import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, Send } from 'lucide-react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';

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
import { ServiceProviderFormType, providerFormSchema } from '@/features/providers/types/types';
import { useToast } from '@/hooks/use-toast';

import { BasicInfoSection } from './basic-info-section';
import { ProviderTypeSection } from './provider-type-section';
import { RegulatoryRequirementsSection } from './regulatory-requirements-section';
import { ServicesSection } from './services-section';

// API mutation function
const submitProviderApplication = async (data: ServiceProviderFormType) => {
  const response = await fetch('/api/providers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to submit application');
  }

  return response.json();
};

export function ProviderOnboardingForm() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const methods = useForm<ServiceProviderFormType>({
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
      providerType: {
        providerType: '',
      },
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

  // Watch for validation errors - only update on submission
  useEffect(() => {
    if (methods.formState.isSubmitted && Object.keys(methods.formState.errors).length > 0) {
      updateFormErrors();
    }
  }, [methods.formState.isSubmitted, methods.formState.errors]);

  // TanStack Query mutation
  const mutation = useMutation({
    mutationFn: submitProviderApplication,
    onSuccess: (data) => {
      toast({
        title: 'Application submitted successfully!',
        description:
          'Your provider application has been submitted for review. You will receive an email confirmation shortly.',
      });

      // Redirect if provided in the response
      if (data.redirect) {
        window.location.href = data.redirect;
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Submission failed',
        description:
          error.message || 'There was an error submitting your application. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit: SubmitHandler<ServiceProviderFormType> = (data) => {
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = () => {
    setShowConfirmDialog(false);
    const formData = methods.getValues();
    mutation.mutate(formData);
  };

  const updateFormErrors = () => {
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
          // Handle service errors
          const servicesError = value as any; // Type assertion to avoid TypeScript errors

          if (servicesError.availableServices?.message) {
            return [`services: ${servicesError.availableServices.message}`];
          }

          // Handle service configs errors (price, duration)
          if (servicesError.serviceConfigs) {
            const serviceConfigErrors: string[] = [];

            // Extract service config errors
            Object.entries(servicesError.serviceConfigs).forEach(
              ([serviceId, serviceConfig]: [string, any]) => {
                if (serviceConfig.price?.message) {
                  serviceConfigErrors.push(`Service price: ${serviceConfig.price.message}`);
                }
                if (serviceConfig.duration?.message) {
                  serviceConfigErrors.push(`Service duration: ${serviceConfig.duration.message}`);
                }
              }
            );

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
        if ((value as any)?.message) {
          return [`${key}: ${(value as any).message}`];
        }
        return [];
      })
      .filter(Boolean);

    // Set errors directly without checking previous state to avoid loops
    setFormErrors(errors);
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
          <ProviderTypeSection />
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-bold">Services</h2>
          <p className="text-sm text-muted-foreground">
            Let patients know what services you offer and your fee structure.
          </p>
          <Separator className="my-4" />
          <ServicesSection />
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-bold">Regulatory Requirements</h2>
          <p className="text-sm text-muted-foreground">
            Please complete all required regulatory information and upload necessary documents.
          </p>
          <Separator className="my-4" />
          <RegulatoryRequirementsSection />
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

        <div className="flex justify-end space-x-4">
          <Button type="reset" variant="outline" onClick={() => methods.reset()}>
            Reset
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
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
