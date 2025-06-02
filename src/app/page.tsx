'use client';

import { ArrowRight, ArrowRightIcon, Bell, Calendar, CheckCircle, Users } from 'lucide-react';

import LandingBookingQuery from '@/components/landing-booking-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="relative z-10 grid w-full gap-8 px-6 py-12 md:grid-cols-2 md:px-24 md:py-24">
          <div className="flex flex-col justify-center space-y-6">
            <div>
              <h1 className="mb-4 text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                Your Health. <span className="text-primary">On Demand.</span>
              </h1>
              <p className="max-w-[600px] text-xl text-muted-foreground">
                Book appointments with healthcare providers in your area or online.
              </p>
            </div>
            <div className="hidden flex-col space-y-4 md:flex">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <p>Find the right healthcare provider for your needs</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <p>Book appointments instantly, 24/7</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <p>Choose between in-person or online consultations</p>
              </div>
            </div>
          </div>
          <div>
            <LandingBookingQuery />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/30 py-16">
        <div className="w-full space-y-12 px-6 md:px-24">
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter">Why Choose Medbookings?</h2>
            <p className="text-xl text-muted-foreground">
              We make finding and booking healthcare appointments simple and convenient
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 p-4">
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Easy Scheduling</h3>
                  <p className="text-muted-foreground">
                    Book appointments with your preferred healthcare providers anytime, anywhere.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 p-4">
                    <Bell className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Appointment Reminders</h3>
                  <p className="text-muted-foreground">
                    Receive timely reminders via WhatsApp and email so you never miss an
                    appointment.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 p-4">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Verified Providers</h3>
                  <p className="text-muted-foreground">
                    Connect with qualified healthcare professionals who have been verified by our
                    team.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* For Professionals Section */}
      <section id="for-professionals" className="py-16 md:py-24">
        <div className="w-full px-6 md:px-24">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="order-2 hidden md:order-1 md:block">
              <img
                src="/medbookings-landing.png"
                alt="Healthcare provider"
                width={600}
                height={400}
                className="rounded-lg shadow-xl"
              />
            </div>
            <div className="order-1 space-y-6 md:order-2">
              <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                For Healthcare Providers
              </div>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Grow your practice with Medbookings
              </h2>
              <p className="text-lg text-muted-foreground">
                Join thousands of healthcare providers who use Medbookings to streamline their
                booking process and find new patients.
              </p>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary" />
                  <div>
                    <h3 className="font-medium">Professional booking experience</h3>
                    <p className="text-muted-foreground">
                      Provide your patients with a seamless booking experience that reflects your
                      professionalism.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary" />
                  <div>
                    <h3 className="font-medium">Automated communications</h3>
                    <p className="text-muted-foreground">
                      Keep your patients informed with automated WhatsApp and email communications.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary" />
                  <div>
                    <h3 className="font-medium">Appointment reminders</h3>
                    <p className="text-muted-foreground">
                      Reduce no-shows with automated appointment reminders sent to your patients.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary" />
                  <div>
                    <h3 className="font-medium">Find new patients</h3>
                    <p className="text-muted-foreground">
                      Expand your practice by connecting with new patients looking for your
                      services.
                    </p>
                  </div>
                </div>
              </div>
              <Button size="lg" className="mt-4">
                Register as a Professional
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/30 py-16">
        <div className="w-full space-y-12 px-6 md:px-24">
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter">How Medbookings Works</h2>
            <p className="text-xl text-muted-foreground">
              Book your next medical appointment in 3 simple steps
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="relative flex flex-col items-center space-y-4 text-center">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                1
              </div>
              <div className="rounded-full bg-primary/10 p-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Find a Healthcare Provider</h3>
              <p className="text-muted-foreground">
                Search for healthcare providers based on your needs, location, and availability
              </p>
              <div className="absolute right-0 top-24 hidden h-4 w-24 translate-x-1/2 transform md:block">
                <ArrowRightIcon className="h-4 w-24 text-primary/50" strokeWidth={1} />
              </div>
            </div>
            <div className="relative flex flex-col items-center space-y-4 text-center">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                2
              </div>
              <div className="rounded-full bg-primary/10 p-4">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Book an Appointment</h3>
              <p className="text-muted-foreground">
                Select a convenient time slot and book your appointment instantly
              </p>
              <div className="absolute right-0 top-24 hidden h-4 w-24 translate-x-1/2 transform md:block">
                <ArrowRightIcon className="h-4 w-24 text-primary/50" strokeWidth={1} />
              </div>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                3
              </div>
              <div className="rounded-full bg-primary/10 p-4">
                <Bell className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Receive Confirmations</h3>
              <p className="text-muted-foreground">
                Get appointment confirmations and reminders via WhatsApp and email
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="w-full space-y-12 px-6 md:px-24">
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter">What Our Users Say</h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of satisfied patients and healthcare providers
            </p>
          </div>
          <Tabs defaultValue="patients" className="w-full">
            <div className="mb-8 flex justify-center">
              <TabsList>
                <TabsTrigger value="patients">Patients</TabsTrigger>
                <TabsTrigger value="professionals">Healthcare Providers</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="patients" className="space-y-8">
              <div className="grid gap-6 md:grid-cols-3">
                {[
                  {
                    quote:
                      'Medbookings made it so easy to find a dentist in my area. I was able to book an appointment for the next day!',
                    name: 'Jessica T.',
                    image: '/patient-1.png',
                  },
                  {
                    quote:
                      'I love the reminders I get before my appointments. I havent missed a single appointment since I started using Medbookings.',
                    name: 'Mark R.',
                    image: '/patient-2.png',
                  },
                  {
                    quote:
                      'I needed to find a physiotherapist urgently after an injury. Medbookings helped me find one with great reviews in minutes.',
                    name: 'Samantha K.',
                    image: '/patient-3.png',
                  },
                ].map((testimonial, index) => (
                  <Card key={index} className="p-6">
                    <div className="space-y-4">
                      <p className="italic">&quot;{testimonial.quote}&quot;</p>
                      <div className="flex items-center gap-3">
                        {/* <Image
                            src={testimonial.image || '/placeholder.svg'}
                            alt={testimonial.name}
                            width={48}
                            height={48}
                            className="rounded-full"
                          /> */}
                        <div>
                          <p className="font-medium">{testimonial.name}</p>
                          <div className="flex">
                            {Array(5)
                              .fill(0)
                              .map((_, i) => (
                                <svg
                                  key={i}
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="h-4 w-4 text-primary"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="professionals" className="space-y-8">
              <div className="grid gap-6 md:grid-cols-3">
                {[
                  {
                    quote:
                      'Since joining Medbookings, I have seen a 30% increase in new patients. The platform is intuitive and my patients love the booking experience.',
                    name: 'Dr. James Wilson',
                    specialty: 'Dentist',
                    image: '/doctor-1.png',
                  },
                  {
                    quote:
                      'The automated reminders have significantly reduced no-shows at my practice. Medbookings has been a game-changer for my clinic.',
                    name: 'Dr. Sarah Chen',
                    specialty: 'Psychologist',
                    image: '/doctor-2.png',
                  },
                  {
                    quote:
                      'As a physiotherapist, I need a reliable booking system. Medbookings not only provides that but also helps me connect with new patients.',
                    name: 'Dr. Michael Brown',
                    specialty: 'Physiotherapist',
                    image: '/doctor-3.png',
                  },
                ].map((testimonial, index) => (
                  <Card key={index} className="p-6">
                    <div className="space-y-4">
                      <p className="italic">&quot;{testimonial.quote}&quot;</p>
                      <div className="flex items-center gap-3">
                        {/* <Image
                          src={testimonial.image || '/placeholder.svg'}
                          alt={testimonial.name}
                          width={48}
                          height={48}
                          className="rounded-full"
                        /> */}
                        <div>
                          <p className="font-medium">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.specialty}</p>
                          <div className="flex">
                            {Array(5)
                              .fill(0)
                              .map((_, i) => (
                                <svg
                                  key={i}
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="h-4 w-4 text-primary"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="w-full px-6 md:px-24">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="max-w-xl space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter">
                Ready to find your healthcare provider?
              </h2>
              <p className="text-xl">
                Join thousands of patients who have simplified their healthcare journey with
                Medbookings.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button variant="secondary" size="lg">
                For Providers
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                Find Providers
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
