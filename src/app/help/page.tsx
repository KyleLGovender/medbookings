import Link from 'next/link';

import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  HelpCircle,
  MessageSquare,
  Settings,
  UserPlus,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function HelpPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold">Provider Help Center</h1>
        <p className="text-lg text-muted-foreground">
          Everything you need to know about using MedBookings as a healthcare provider
        </p>
      </div>

      {/* Quick Links */}
      <div className="mb-12 grid gap-6 md:grid-cols-3">
        <Card className="border-2 transition-all hover:border-primary hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              New to MedBookings? Start here to set up your provider profile.
            </p>
            <Link href="#getting-started">
              <Button variant="outline" size="sm">
                Learn More
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-2 transition-all hover:border-primary hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Managing Availability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Learn how to set up and manage your availability for appointments.
            </p>
            <Link href="#availability">
              <Button variant="outline" size="sm">
                Learn More
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-2 transition-all hover:border-primary hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Patient Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Understand how patients book appointments and how to manage them.
            </p>
            <Link href="#bookings">
              <Button variant="outline" size="sm">
                Learn More
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Section */}
      <section id="getting-started" className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Getting Started as a Provider</CardTitle>
            <CardDescription>
              Follow these steps to set up your provider profile and start accepting bookings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold">Register as a Provider</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Navigate to &quot;Become a Provider&quot; and fill in your professional
                      information, including your specialization, qualifications, and contact
                      details.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold">Upload Required Documents</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Submit your regulatory documents such as medical license, practice permit, and
                      malpractice insurance. These will be verified by our admin team.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold">Wait for Approval</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Our admin team will review your application and documents. You&apos;ll receive
                      an email once your profile is approved.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold">Choose a Subscription Plan</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Once approved, select a subscription plan that fits your practice. This
                      activates your profile for patient bookings.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    5
                  </div>
                  <div>
                    <h3 className="font-semibold">Set Up Your Services</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Define the services you offer, including consultation types, durations, and
                      prices. This helps patients understand what you provide.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    6
                  </div>
                  <div>
                    <h3 className="font-semibold">Configure Availability</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Set your available days and times for appointments. You can create recurring
                      schedules or specific time slots.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Availability Management Section */}
      <section id="availability" className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Managing Your Availability</CardTitle>
            <CardDescription>
              Learn how to effectively manage your appointment availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold">
                  <Clock className="h-4 w-4" />
                  Creating Availability Slots
                </h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  You can create availability in two ways:
                </p>
                <ul className="ml-6 list-disc space-y-2 text-sm text-muted-foreground">
                  <li>
                    <strong>Recurring Schedule:</strong> Set regular weekly hours that repeat
                    automatically
                  </li>
                  <li>
                    <strong>Specific Dates:</strong> Add availability for specific dates and times
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold">
                  <Calendar className="h-4 w-4" />
                  Managing Your Calendar
                </h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  Your calendar shows all your availability slots and bookings:
                </p>
                <ul className="ml-6 list-disc space-y-2 text-sm text-muted-foreground">
                  <li>Green slots: Available for booking</li>
                  <li>Blue slots: Booked appointments</li>
                  <li>Gray slots: Blocked or unavailable times</li>
                  <li>Yellow slots: Pending confirmation</li>
                </ul>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold">
                  <Settings className="h-4 w-4" />
                  Availability Settings
                </h3>
                <p className="text-sm text-muted-foreground">
                  Configure your availability preferences:
                </p>
                <ul className="ml-6 mt-2 list-disc space-y-2 text-sm text-muted-foreground">
                  <li>Set minimum advance booking time</li>
                  <li>Define buffer time between appointments</li>
                  <li>Block out lunch breaks and personal time</li>
                  <li>Sync with Google Calendar to avoid conflicts</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Bookings Section */}
      <section id="bookings" className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Managing Patient Bookings</CardTitle>
            <CardDescription>
              Everything you need to know about handling patient appointments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <h3 className="mb-3 font-semibold">How do I receive bookings?</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Patients can book appointments with you through multiple channels:</p>
                  <ul className="ml-6 list-disc space-y-2">
                    <li>Direct booking through your public profile page</li>
                    <li>Organization bookings if you&apos;re associated with a clinic</li>
                    <li>Referrals from other healthcare providers</li>
                  </ul>
                  <p>
                    You&apos;ll receive email and SMS notifications for new bookings based on your
                    notification preferences.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="mb-3 font-semibold">How do I manage existing bookings?</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Navigate to &quot;My Bookings&quot; to view and manage all appointments:</p>
                  <ul className="ml-6 list-disc space-y-2">
                    <li>View patient details and contact information</li>
                    <li>Confirm or decline pending appointments</li>
                    <li>Reschedule appointments when needed</li>
                    <li>Cancel appointments with reason notification</li>
                    <li>Mark patients as no-shows</li>
                    <li>Add consultation notes after appointments</li>
                  </ul>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="mb-3 font-semibold">How do appointment reminders work?</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Automatic reminders help reduce no-shows:</p>
                  <ul className="ml-6 list-disc space-y-2">
                    <li>Patients receive reminders 24 hours before appointments</li>
                    <li>Reminders are sent via email, SMS, or WhatsApp</li>
                    <li>You can customize reminder timing in your settings</li>
                    <li>Patients can confirm or request rescheduling through reminders</li>
                  </ul>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="mb-3 font-semibold">What is the cancellation policy?</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Understanding cancellations:</p>
                  <ul className="ml-6 list-disc space-y-2">
                    <li>Patients can cancel up to 24 hours before appointment</li>
                    <li>Late cancellations may be subject to fees (if configured)</li>
                    <li>You can set your own cancellation policy in settings</li>
                    <li>Cancelled slots automatically become available for rebooking</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Additional Features */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-bold">Additional Features</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Billing & Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                MedBookings handles billing based on your subscription:
              </p>
              <ul className="ml-6 list-disc space-y-2 text-sm text-muted-foreground">
                <li>Monthly subscription fees for platform access</li>
                <li>Per-slot pricing for availability creation</li>
                <li>Automatic invoicing and payment processing</li>
                <li>Detailed billing reports and statements</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Communication Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                Stay connected with your patients:
              </p>
              <ul className="ml-6 list-disc space-y-2 text-sm text-muted-foreground">
                <li>Automated appointment confirmations</li>
                <li>Custom reminder messages</li>
                <li>Secure messaging with patients</li>
                <li>Bulk notifications for schedule changes</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Reports & Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">Track your practice performance:</p>
              <ul className="ml-6 list-disc space-y-2 text-sm text-muted-foreground">
                <li>Booking utilization rates</li>
                <li>Patient demographics and trends</li>
                <li>Revenue reports and projections</li>
                <li>No-show and cancellation statistics</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">Tips for success on MedBookings:</p>
              <ul className="ml-6 list-disc space-y-2 text-sm text-muted-foreground">
                <li>Keep your availability updated regularly</li>
                <li>Respond to bookings promptly</li>
                <li>Maintain complete profile information</li>
                <li>Use professional photos and descriptions</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Support Section */}
      <section className="mb-12">
        <Card className="border-2 border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Need More Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Can&apos;t find what you&apos;re looking for? Our support team is here to help.
            </p>
            <div className="flex gap-4">
              <Link href="mailto:support@medbookings.co.za">
                <Button>Contact Support</Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <div className="border-t pt-8 text-center text-sm text-muted-foreground">
        <p>© 2024 MedBookings. Provider Help Center v1.0</p>
        <p className="mt-2">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
}
