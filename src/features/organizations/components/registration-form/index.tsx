'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { useRegisterOrganization } from '@/features/organizations/hooks/use-register-organization';
import { organizationRegistrationSchema } from '@/features/organizations/types/schemas';
import { OrganizationRegistrationData } from '@/features/organizations/types/types';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

import { BillingConfigurationStep } from './billing-configuration-step';
import { LocationSetupStep } from './location-setup-step';
import { OrganizationDetailsStep } from './organization-details-step';
import { ReviewStep } from './review-step';

const STEPS = [
  {
    id: 1,
    title: 'Organization Details',
    description: 'Basic information about your organization',
  },
  { id: 2, title: 'Location Setup', description: 'Add your practice locations (optional)' },
  { id: 3, title: 'Billing Configuration', description: 'Set up your billing preferences' },
  { id: 4, title: 'Review & Submit', description: 'Review and confirm your registration' },
];

export function OrganizationRegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const router = useRouter();
  const { toast } = useToast();
  const registerOrganizationMutation = useRegisterOrganization();

  const form = useForm<OrganizationRegistrationData>({
    resolver: zodResolver(organizationRegistrationSchema),
    defaultValues: {
      organization: {
        name: '',
        description: '',
        email: '',
        phone: '',
        website: '',
        logo: '',
        billingModel: 'CONSOLIDATED',
      },
      locations: [],
    },
  });

  const validateStep = async (stepNumber: number): Promise<boolean> => {
    const fieldsToValidate = getFieldsForStep(stepNumber);

    // For location step, validate each location individually
    if (stepNumber === 2) {
      const locations = form.getValues('locations') || [];
      if (locations.length === 0) {
        // No locations is valid (optional step)
        return true;
      }

      // Validate each location
      for (let i = 0; i < locations.length; i++) {
        const isLocationValid = await form.trigger([
          `locations.${i}.name`,
          `locations.${i}.googlePlaceId`,
          `locations.${i}.formattedAddress`,
        ]);
        if (!isLocationValid) {
          logger.debug('forms', 'Location validation failed', {
            locationIndex: i,
            hasErrors: !!(
              Array.isArray(form.formState.errors.locations) && form.formState.errors.locations[i]
            ),
          });
          return false;
        }
      }
      return true;
    }

    return await form.trigger(fieldsToValidate as ('organization' | 'locations')[]);
  };

  const goToStep = async (stepNumber: number) => {
    // If going to a previous step or the current step, allow it
    if (stepNumber <= currentStep) {
      setCurrentStep(stepNumber);
      return;
    }

    // If going to a future step, validate all steps in between
    let canProceed = true;
    for (let i = currentStep; i < stepNumber; i++) {
      const isValid = await validateStep(i);
      if (isValid) {
        setCompletedSteps((prev) => new Set([...Array.from(prev), i]));
      } else {
        canProceed = false;
        break;
      }
    }

    if (canProceed) {
      setCurrentStep(stepNumber);
    }
  };

  const nextStep = async () => {
    logger.debug('forms', 'Attempting to go to next step', {
      currentStep,
      hasErrors: !!Object.keys(form.formState.errors).length,
    });

    const isValid = await validateStep(currentStep);
    logger.debug('forms', 'Step validation result', { currentStep, isValid });

    if (isValid) {
      setCompletedSteps((prev) => {
        const newSet = new Set(prev);
        newSet.add(currentStep);
        return newSet;
      });
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      logger.debug('forms', 'Validation failed, staying on current step', { currentStep });
      // Force form to show errors
      await form.trigger();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: OrganizationRegistrationData) => {
    logger.info('Organization registration submission started', {
      hasLocations: !!(data.locations && data.locations.length > 0),
      locationCount: data.locations?.length || 0,
    });
    try {
      const organization = await registerOrganizationMutation.mutateAsync(data);
      logger.info('Organization registration successful', {
        organizationId: organization.id,
      });
      toast({
        title: 'Organization registered successfully',
        description: 'Your organization has been created.',
        variant: 'default',
      });
      // Redirect to profile page after successful registration
      router.push('/profile');
    } catch (error) {
      logger.error('Organization registration failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const getFieldsForStep = (step: number) => {
    switch (step) {
      case 1:
        return ['organization' as const];
      case 2:
        return ['locations' as const];
      case 3:
        return ['organization' as const];
      default:
        return [];
    }
  };

  const getStepStatus = (stepId: number) => {
    if (completedSteps.has(stepId)) return 'completed';
    if (stepId === currentStep) return 'current';
    if (stepId < currentStep) return 'accessible';
    return 'upcoming';
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="space-y-8">
      {/* Progress indicator */}
      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <span>
            Step {currentStep} of {STEPS.length}
          </span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />

        {/* Step indicators - Now clickable */}
        <div className="flex justify-between">
          {STEPS.map((step) => {
            const status = getStepStatus(step.id);
            const isClickable =
              status === 'completed' || status === 'current' || status === 'accessible';

            return (
              <div
                key={step.id}
                className={`flex flex-col items-center space-y-2 ${
                  status === 'completed' || status === 'current'
                    ? 'text-primary'
                    : status === 'accessible'
                      ? 'text-muted-foreground hover:text-primary'
                      : 'text-muted-foreground'
                } ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                onClick={() => isClickable && goToStep(step.id)}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    status === 'completed'
                      ? 'bg-primary text-primary-foreground'
                      : status === 'current'
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                        : status === 'accessible'
                          ? 'bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {status === 'completed' ? '✓' : step.id}
                </div>
                <div className="text-center">
                  <div className={`text-xs font-medium ${isClickable ? 'hover:underline' : ''}`}>
                    {step.title}
                  </div>
                  <div className="hidden text-xs text-muted-foreground sm:block">
                    {step.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form content */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {currentStep === 1 && <OrganizationDetailsStep />}
          {currentStep === 2 && <LocationSetupStep />}
          {currentStep === 3 && <BillingConfigurationStep />}
          {currentStep === 4 && <ReviewStep />}

          {/* Navigation buttons */}
          <div className="flex justify-between border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {currentStep < STEPS.length ? (
              <Button type="button" onClick={nextStep} className="flex items-center gap-2">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={registerOrganizationMutation.isPending}
                className="flex items-center gap-2"
              >
                {registerOrganizationMutation.isPending
                  ? 'Registering...'
                  : 'Complete Registration'}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
