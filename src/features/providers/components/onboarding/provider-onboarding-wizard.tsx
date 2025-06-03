'use client';

import { useState } from 'react';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

import { BasicInfoStep } from './basic-info-step';
import { ProfessionalDetailsStep } from './professional-details-step';
import { ProviderTypeStep } from './provider-type-step';
import { RegulatoryRequirementsStep } from './regulatory-requirements-step';
import { ServicesStep } from './services-step';
import { ReviewSubmitStep } from './review-submit-step';
import { ServicesStep } from './services-step';

const STEPS = [
  { id: 1, title: 'Basic Information', component: BasicInfoStep },
  { id: 2, title: 'Provider Type', component: ProviderTypeStep },
  { id: 3, title: 'Professional Details', component: ProfessionalDetailsStep },
  { id: 4, title: 'Regulatory Requirements', component: RegulatoryRequirementsStep },
  { id: 5, title: 'Services Offered', component: ServicesStep },
  { id: 6, title: 'Review & Submit', component: ReviewSubmitStep },
];

export function ProviderOnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const { toast } = useToast();

  const progress = (currentStep / STEPS.length) * 100;
  const CurrentStepComponent = STEPS.find((step) => step.id === currentStep)?.component;

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCompletedSteps((prev) => [...prev, currentStep]);
      setCurrentStep((prev) => prev + 1);

      // Auto-save progress
      localStorage.setItem(
        'providerOnboardingProgress',
        JSON.stringify({
          currentStep: currentStep + 1,
          formData,
          completedSteps: [...completedSteps, currentStep],
          lastSaved: new Date().toISOString(),
        })
      );
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleStepData = (stepData: any) => {
    setFormData((prev) => ({ ...prev, ...stepData }));
  };

  const handleSaveProgress = () => {
    localStorage.setItem(
      'providerOnboardingProgress',
      JSON.stringify({
        currentStep,
        formData,
        completedSteps,
        lastSaved: new Date().toISOString(),
      })
    );

    toast({
      title: 'Progress saved',
      description: 'Your application progress has been saved.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Step {currentStep} of {STEPS.length}:{' '}
                {STEPS.find((s) => s.id === currentStep)?.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Complete all steps to submit your provider application
              </p>
            </div>
            <Button variant="outline" onClick={handleSaveProgress}>
              Save Progress
            </Button>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
      </Card>

      {/* Step Navigation */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-2">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  step.id === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : completedSteps.includes(step.id)
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {step.id}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`mx-2 h-0.5 w-12 ${completedSteps.includes(step.id) ? 'bg-green-500' : 'bg-muted'}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <Card>
        <CardContent className="p-6">
          {CurrentStepComponent && (
            <CurrentStepComponent
              data={formData}
              onDataChange={handleStepData}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <Button
          onClick={handleNext}
          disabled={currentStep === STEPS.length}
          className="flex items-center gap-2"
        >
          {currentStep === STEPS.length ? 'Submit Application' : 'Next'}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
