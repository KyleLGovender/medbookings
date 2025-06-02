import Image from 'next/image';
import Link from 'next/link';

import { Calendar, CheckCircle, Clock, CreditCard, LineChart, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PricingCalculator } from '@/features/billing/components/pricing-calculator';

export default function JoinMedbookingsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-teal-500 to-teal-600 py-20 text-white">
        <div className="container mx-auto px-6">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                Grow Your Practice with Medbookings
              </h1>
              <p className="text-xl text-teal-100">
                Join thousands of healthcare providers who use Medbookings to streamline their
                workflow, reduce admin, and connect with new patients.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button size="lg" className="bg-white text-teal-700 hover:bg-teal-50">
                  Register Now
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-teal-600"
                >
                  Request Demo
                </Button>
              </div>
            </div>
            <div className="relative hidden h-[400px] md:block">
              <Image
                src="/medbookings-landing.png"
                alt="Medbookings Professional Dashboard"
                fill
                className="rounded-lg object-cover shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-4xl font-bold">Transparent Pricing</h1>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
              Calculate exactly what you will pay based on your booking volume. No hidden fees, no
              surprises.
            </p>
          </div>
          <PricingCalculator />
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Why Healthcare Providers Choose Medbookings
            </h2>
            <p className="text-xl text-gray-600">
              Our platform is designed specifically for healthcare providers to make practice
              management simpler and more efficient.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold">Smart Scheduling</h3>
                <p className="text-gray-600">
                  Our intelligent booking system prevents double bookings and optimizes your
                  calendar to maximize patient appointments while respecting your availability.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold">Reduced No-Shows</h3>
                <p className="text-gray-600">
                  Automated appointment reminders via WhatsApp and email have helped our providers
                  reduce no-shows by up to 40%, saving valuable time and revenue.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold">New Patient Acquisition</h3>
                <p className="text-gray-600">
                  Expand your practice with our marketplace of patients actively seeking healthcare
                  services in your area of expertise and location.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-6">
          <h2 className="mb-16 text-center text-3xl font-bold md:text-4xl">
            Powerful Features for Healthcare Providers
          </h2>

          <div className="grid gap-12 md:grid-cols-2">
            <div className="flex gap-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <h3 className="mb-2 text-xl font-bold">Secure Online Payments</h3>
                <p className="text-gray-600">
                  Accept deposits, full payments, or co-pays online. Our platform integrates with
                  major payment processors and provides detailed financial reporting.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                <LineChart className="h-6 w-6" />
              </div>
              <div>
                <h3 className="mb-2 text-xl font-bold">Practice Analytics</h3>
                <p className="text-gray-600">
                  Gain insights into your practice with comprehensive analytics on appointment
                  trends, patient demographics, revenue streams, and more.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="mb-2 text-xl font-bold">Customizable Booking Rules</h3>
                <p className="text-gray-600">
                  Set your availability, buffer times between appointments, appointment types, and
                  duration. You have complete control over your schedule.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <h3 className="mb-2 text-xl font-bold">HIPAA Compliance</h3>
                <p className="text-gray-600">
                  Our platform is fully HIPAA-compliant, ensuring that your patients&apos; data is
                  always secure and your practice remains protected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="mb-16 text-center text-3xl font-bold md:text-4xl">
            What Healthcare Providers Are Saying
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="border-2 border-gray-100">
              <CardContent className="p-6">
                <div className="mb-4 flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5 text-yellow-500"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ))}
                </div>
                <p className="mb-4 italic text-gray-600">
                  &ldquo;Since joining Medbookings, I&apos;ve seen a 30% increase in new patients.
                  The platform is intuitive, and my patients love the booking experience.&rdquo;
                </p>
                <div>
                  <p className="font-bold">Dr. James Wilson</p>
                  <p className="text-sm text-gray-500">Dentist, Cape Town</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-100">
              <CardContent className="p-6">
                <div className="mb-4 flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5 text-yellow-500"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ))}
                </div>
                <p className="mb-4 italic text-gray-600">
                  &ldquo;The automated reminders have significantly reduced no-shows at my practice.
                  Medbookings has been a game-changer for my clinic.&rdquo;
                </p>
                <div>
                  <p className="font-bold">Dr. Sarah Chen</p>
                  <p className="text-sm text-gray-500">Psychologist, Johannesburg</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-100">
              <CardContent className="p-6">
                <div className="mb-4 flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5 text-yellow-500"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ))}
                </div>
                <p className="mb-4 italic text-gray-600">
                  &ldquo;As a physiotherapist, I need a reliable booking system. Medbookings not
                  only provides that but also helps me connect with new patients.&rdquo;
                </p>
                <div>
                  <p className="font-bold">Dr. Michael Brown</p>
                  <p className="text-sm text-gray-500">Physiotherapist, Durban</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-teal-600 py-20 text-white">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-3xl font-bold md:text-4xl">
              Ready to Transform Your Practice?
            </h2>
            <p className="mb-8 text-xl text-teal-100">
              Join thousands of healthcare providers who have simplified their workflow and grown
              their practice with Medbookings.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" className="bg-white text-teal-700 hover:bg-teal-50">
                Register Your Practice
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-teal-500"
              >
                Schedule a Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="mb-16 text-center text-3xl font-bold md:text-4xl">
            Frequently Asked Questions
          </h2>

          <div className="mx-auto grid max-w-4xl gap-6">
            <div>
              <h3 className="mb-2 text-xl font-bold">How much does it cost to join Medbookings?</h3>
              <p className="text-gray-600">
                We offer flexible pricing plans starting from R499/month. We also have a
                pay-as-you-go option where you only pay a small fee per booking. Contact us for a
                custom quote based on your practice size.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-xl font-bold">How long does it take to get set up?</h3>
              <p className="text-gray-600">
                Most practitioners are up and running within 24 hours. Our team will help you with
                the initial setup, including importing your existing appointments and patient data
                if needed.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-xl font-bold">Can I integrate with my existing systems?</h3>
              <p className="text-gray-600">
                Yes, Medbookings integrates with popular practice management systems, EMRs, and
                payment processors. We also offer API access for custom integrations.
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-xl font-bold">Is my patients&apos; data secure?</h3>
              <p className="text-gray-600">
                Absolutely. We take data security seriously. Medbookings is fully HIPAA-compliant
                and uses bank-level encryption to protect your patients&apos; information.
              </p>
            </div>

            <div className="mt-8 text-center">
              <Link href="/faq" className="text-teal-600 hover:underline">
                View all FAQs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
