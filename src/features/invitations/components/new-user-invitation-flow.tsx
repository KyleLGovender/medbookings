'use client';

import { useState } from 'react';

import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowRight,
  Building2,
  Calendar,
  Check,
  Globe,
  Mail,
  MessageSquare,
  Phone,
  Stethoscope,
  User,
  Users,
} from 'lucide-react';
import { signIn } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface InvitationData {
  id: string;
  email: string;
  customMessage?: string;
  status: string;
  expiresAt: string;
  organization: {
    id: string;
    name: string;
    description?: string;
    logo?: string;
    email?: string;
    phone?: string;
    website?: string;
  };
  invitedBy: {
    name?: string;
    email?: string;
  };
}

interface NewUserInvitationFlowProps {
  invitation: InvitationData;
  token: string;
}

export function NewUserInvitationFlow({ invitation, token }: NewUserInvitationFlowProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = async () => {
    setIsLoading(true);
    try {
      // Store invitation context in localStorage for post-registration handling
      localStorage.setItem(
        'pendingInvitation',
        JSON.stringify({
          token,
          organizationName: invitation.organization.name,
          email: invitation.email,
        })
      );

      // Redirect to sign-in page with callbackUrl to return to invitation
      await signIn('google', {
        callbackUrl: `/invitation/${token}`,
        redirect: true,
      });
    } catch (error) {
      console.error('Error starting registration:', error);
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Calendar,
      title: 'Schedule Management',
      description: 'Create and manage your availability, sync with Google Calendar',
    },
    {
      icon: Users,
      title: 'Patient Bookings',
      description: 'Patients can book appointments directly with you online',
    },
    {
      icon: Stethoscope,
      title: 'Multiple Organizations',
      description: 'Work with multiple healthcare organizations and practices',
    },
    {
      icon: Globe,
      title: 'Online & In-Person',
      description: 'Offer both virtual consultations and in-person appointments',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Header */}
          <div className="space-y-4 text-center">
            <div className="mx-auto mb-4">
              {invitation.organization.logo ? (
                <img
                  src={invitation.organization.logo}
                  alt={invitation.organization.name}
                  className="mx-auto h-20 w-20 rounded-lg border object-cover"
                />
              ) : (
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-lg border bg-muted">
                  <Building2 className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold md:text-4xl">
              You&apos;re Invited to Join {invitation.organization.name}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              {invitation.invitedBy?.name || 'Someone'} from {invitation.organization.name} has
              invited you to join their healthcare organization on MedBookings.
            </p>
          </div>

          {/* What is MedBookings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">What is MedBookings?</CardTitle>
              <CardDescription>
                MedBookings is a comprehensive platform for healthcare providers to manage their
                practice, schedule appointments, and connect with patients.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Invitation Details */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Organization Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  About {invitation.organization.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {invitation.organization.description && (
                  <p className="text-sm text-muted-foreground">
                    {invitation.organization.description}
                  </p>
                )}

                <div className="space-y-3">
                  {invitation.organization.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{invitation.organization.email}</span>
                    </div>
                  )}
                  {invitation.organization.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{invitation.organization.phone}</span>
                    </div>
                  )}
                  {invitation.organization.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={invitation.organization.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>

                {/* Custom Message */}
                {invitation.customMessage && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Personal Message:</span>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                          {invitation.customMessage}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Invitation Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Invitation Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Invited by:</span>
                    </div>
                    <p className="ml-6 text-sm text-muted-foreground">
                      {invitation.invitedBy?.name || 'Unknown'}
                    </p>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Invited email:</span>
                    </div>
                    <p className="ml-6 text-sm text-muted-foreground">{invitation.email}</p>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Expires:</span>
                    </div>
                    <p className="ml-6 text-sm text-muted-foreground">
                      {format(new Date(invitation.expiresAt), 'MMM d, yyyy')}
                      <span className="ml-2 text-xs">
                        ({formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true })})
                      </span>
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
                  <h4 className="mb-2 font-medium text-blue-900 dark:text-blue-100">
                    What happens next?
                  </h4>
                  <ol className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                    <li className="flex items-start gap-2">
                      <span className="font-medium">1.</span>
                      <span>Create your MedBookings account</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium">2.</span>
                      <span>Complete your provider profile</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium">3.</span>
                      <span>Accept the invitation to join {invitation.organization.name}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-medium">4.</span>
                      <span>Start scheduling and accepting appointments</span>
                    </li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-8 text-center">
              <div className="space-y-6">
                <div>
                  <h2 className="mb-2 text-2xl font-bold">Ready to Get Started?</h2>
                  <p className="text-muted-foreground">
                    Join MedBookings and start working with {invitation.organization.name} today. It
                    only takes a few minutes to set up your account.
                  </p>
                </div>

                <Button
                  onClick={handleGetStarted}
                  disabled={isLoading}
                  size="lg"
                  className="px-8 py-6 text-lg"
                >
                  {isLoading ? (
                    'Setting up...'
                  ) : (
                    <>
                      Get Started with MedBookings
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground">
                  By continuing, you&apos;ll be signed in with Google and can complete your provider
                  registration. Your invitation will be preserved throughout the process.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="space-y-6 text-center">
            <h2 className="text-2xl font-bold">Why Healthcare Providers Choose MedBookings</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                    <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="mb-2 font-semibold">Easy Setup</h3>
                  <p className="text-sm text-muted-foreground">
                    Get started in minutes with our streamlined onboarding process
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                    <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="mb-2 font-semibold">Flexible Scheduling</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage availability across multiple organizations and locations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                    <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="mb-2 font-semibold">Patient Connect</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with patients through online bookings and virtual consultations
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
