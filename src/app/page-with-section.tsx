'use client';

import { Calendar, CheckCircle } from 'lucide-react';

import LandingBookingQuery from '@/components/landing-booking-query';
import Section from '@/components/section';
import { Card, CardContent } from '@/components/ui/card';

// Example of refactoring the landing page to use the Section component
export default function LandingPageExample() {
  return (
    <>
      {/* Hero Section */}
      <Section
        className="relative overflow-hidden bg-background"
        containerClassName="relative z-10 grid w-full gap-8 py-12 md:grid-cols-2 md:py-24"
      >
        <div className="flex flex-col justify-center space-y-6">
          <div>
            <h1 className="mb-4 text-4xl font-bold tracking-tighter text-foreground sm:text-5xl md:text-6xl">
              What are you looking for?
            </h1>
            <p className="max-w-[600px] text-xl text-muted-foreground">
              Book appointments with healthcare providers in your area or online.
            </p>
          </div>
          <div className="hidden flex-col space-y-4 md:flex">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3 dark:bg-primary/20">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <p className="text-foreground">Find the right healthcare provider for your needs</p>
            </div>
            {/* Additional check items would go here */}
          </div>
        </div>
        <div>
          <LandingBookingQuery />
        </div>
      </Section>

      {/* Benefits Section */}
      <Section className="bg-muted/30 py-16 dark:bg-muted/10" containerClassName="space-y-12">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <h2 className="text-3xl font-bold tracking-tighter text-foreground dark:text-foreground">
            Why Choose Medbookings?
          </h2>
          <p className="text-xl text-muted-foreground dark:text-muted-foreground">
            We make finding and booking healthcare appointments simple and convenient
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="border-border bg-card dark:border-border dark:bg-card">
            <CardContent className="pt-6">
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 p-4 dark:bg-primary/20">
                  <Calendar className="h-8 w-8 text-primary dark:text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground dark:text-foreground">
                  Easy Scheduling
                </h3>
                <p className="text-muted-foreground dark:text-muted-foreground">
                  Book appointments with your preferred healthcare providers anytime, anywhere.
                </p>
              </div>
            </CardContent>
          </Card>
          {/* Additional cards would go here */}
        </div>
      </Section>
    </>
  );
}
