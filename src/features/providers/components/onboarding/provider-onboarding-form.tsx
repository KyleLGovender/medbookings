'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Send } from 'lucide-react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

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
import { useToast } from '@/hooks/use-toast';

import { BasicInfoSection } from './basic-info-section';
import { ProfessionalDetailsSection } from './professional-details-section';
import { ProviderTypeSection } from './provider-type-section';
import { RegulatoryRequirementsSection } from './regulatory-requirements-section';
import { ServicesSection } from './services-section';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormField, FormItem, FormControl, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';

// Updated schema to match Prisma ServiceProvider model
const basicInfoSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  bio: z
    .string()
    .min(50, 'Bio must be at least 50 characters')
    .max(500, 'Bio must be less than 500 characters'),
  image: z.string().min(1, 'Profile image is required'),
  languages: z.array(z.string()).min(1, 'Please select at least one language'),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  email: z.string().email('Please enter a valid email address'),
  whatsapp: z.string().min(10, 'Please enter a valid WhatsApp number'),
});

const providerTypeSchema = z.object({
  providerType: z.string().min(1, 'Please select a provider type'),
});

const professionalDetailsSchema = z.object({
  medicalLicenseNumber: z.string().min(1, 'Medical license number is required'),
  yearsOfExperience: z.string().min(1, 'Years of experience is required'),
  education: z.string().min(10, 'Please provide details about your education'),
  specializations: z.string().min(1, 'Please select at least one specialization'),
  hospitalAffiliations: z.string().optional(),
});

const regulatoryRequirementsSchema = z.object({
  requirements: z.record(z.any()).refine((data) => {
    return Object.keys(data).length > 0;
  }, 'Please complete all required regulatory requirements'),
});

const servicesSchema = z.object({
  consultationFee: z.string().min(1, 'Consultation fee is required'),
  availableServices: z.array(z.string()).min(1, 'Please select at least one service'),
  customServices: z.array(z.string()).optional(),
});

// Combine all schemas
const formSchema = z.object({
  basicInfo: basicInfoSchema,
  providerType: providerTypeSchema,
  professionalDetails: professionalDetailsSchema,
  regulatoryRequirements: regulatoryRequirementsSchema,
  services: servicesSchema,
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

type FormData = z.infer<typeof formSchema>;

export function ProviderOnboardingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema),
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
      professionalDetails: {
        medicalLicenseNumber: '',
        yearsOfExperience: '',
        education: '',
        specializations: '',
        hospitalAffiliations: '',
      },
      regulatoryRequirements: {
        requirements: {},
      },
      services: {
        consultationFee: '',
        availableServices: [],
        customServices: [],
      },
      termsAccepted: false,
    },
    mode: 'onBlur',
  });

  const onSubmit = (data: FormData) => {
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);

    try {
      // Simulate API submission
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: 'Application submitted successfully!',
        description:
          'Your provider application has been submitted for review. You\'ll receive an email confirmation shortly.',
      });
    } catch (error) {
      toast({
        title: 'Submission failed',
        description: 'There was an error submitting your application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInvalidSubmit = () => {
    const errors = Object.entries(methods.formState.errors)
      .flatMap(([key, value]) => {
        if (
          key === 'basicInfo' ||
          key === 'providerType' ||
          key === 'professionalDetails' ||
          key === 'services'
        ) {
          const sectionErrors = Object.entries(value as Record<string, { message?: string }>)
            .filter(([_, err]) => err.message)
            .map(([field, err]) => `${field}: ${err.message}`);
          return sectionErrors;
        }
        if (key === 'termsAccepted') {
          return ['You must accept the terms and conditions'];
        }
        return [];
      })
      .filter(Boolean);

    setFormErrors(errors);

    const firstErrorElement = document.querySelector('[aria-invalid=\'true\']');
    if (firstErrorElement) {
      firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

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
          <h2 className="mb-4 text-xl font-semibold">Basic Information</h2>
          <BasicInfoSection />
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Provider Type</h2>
          <ProviderTypeSection />
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Professional Details</h2>
          <ProfessionalDetailsSection />
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Regulatory Requirements</h2>
          <RegulatoryRequirementsSection />
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Services Offered</h2>
          <ServicesSection />
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-xl font-semibold">Terms and Conditions</h2>
          <div className="space-y-4">
            <div className="rounded-md bg-muted p-4 text-sm">
              <p className="mb-2">
                By submitting this application, I confirm that all information provided is accurate
                and complete to the best of my knowledge.
              </p>
              <p>
                I understand that my application will be reviewed by MedBookings staff and that I
                may be contacted for additional information or verification. I agree to provide any
                requested documentation in a timely manner.
              </p>
            </div>

            <FormField
              control={methods.control}
              name="termsAccepted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I agree to the{' '}
                      <a href="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </a>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </div>
        </Card>

        <Separator />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Application
              </>
            )}
          </Button>
        </div>

        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Submission</DialogTitle>
              <DialogDescription>
                Are you sure you want to submit your provider application? Once submitted, you'll
                need to contact support to make changes.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmSubmit}>Submit Application</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </form>
    </FormProvider>
  );
}
