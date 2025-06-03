import { ProviderOnboardingForm } from '@/features/providers/components/onboarding/provider-onboarding-form';

export default function NewProviderPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Provider Registration</h1>
          <p className="mt-2 text-muted-foreground">
            Complete your registration to start offering services on MedBookings
          </p>
        </div>
        <ProviderOnboardingForm />
      </div>
    </div>
  );
}
