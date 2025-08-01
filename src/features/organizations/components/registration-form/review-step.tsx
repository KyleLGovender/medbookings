'use client';

import {
  AlertCircle,
  Building2,
  CheckCircle,
  Clock,
  CreditCard,
  MapPin,
  UserCheck,
} from 'lucide-react';
import { useFormContext } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { OrganizationRegistrationData } from '@/features/organizations/types/types';

export function ReviewStep() {
  const form = useFormContext<OrganizationRegistrationData>();
  const formData = form.getValues();

  const getBillingModelLabel = (model: string) => {
    switch (model) {
      case 'CONSOLIDATED':
        return 'Consolidated Billing';
      case 'PER_LOCATION':
        return 'Per-Location Billing';
      default:
        return model;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Review & Submit</h2>
        <p className="text-muted-foreground">
          Please review your information before submitting your organization registration.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Organization Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Organization Name</div>
                <div className="text-base">{formData.organization.name || 'Not provided'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Email</div>
                <div className="text-base">{formData.organization.email || 'Not provided'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Phone</div>
                <div className="text-base">{formData.organization.phone || 'Not provided'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Website</div>
                <div className="text-base">{formData.organization.website || 'Not provided'}</div>
              </div>
            </div>

            {formData.organization.description && (
              <>
                <Separator />
                <div>
                  <div className="mb-2 text-sm font-medium text-muted-foreground">Description</div>
                  <div className="text-base">{formData.organization.description}</div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Locations Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Locations ({formData.locations?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!formData.locations || formData.locations.length === 0 ? (
              <div className="py-6 text-center">
                <MapPin className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">No locations configured</div>
                <div className="text-xs text-muted-foreground">
                  You can add locations later from your dashboard
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.locations.map((location: any, index: number) => (
                  <div key={index} className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="font-medium">{location.name}</div>
                      <Badge variant="outline">Location {index + 1}</Badge>
                    </div>
                    <div className="mb-2 text-sm text-muted-foreground">
                      {location.formattedAddress}
                    </div>
                    {(location.phone || location.email) && (
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        {location.phone && <span>📞 {location.phone}</span>}
                        {location.email && <span>✉️ {location.email}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-muted-foreground">Billing Model:</div>
              <Badge variant="secondary">
                {getBillingModelLabel(formData.organization.billingModel)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* What Happens Next */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              What Happens Next?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  1
                </div>
                <div>
                  <div className="font-medium">Registration Submitted</div>
                  <div className="text-sm text-muted-foreground">
                    Your organization registration will be submitted for review
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-medium text-white">
                  <Clock className="h-3 w-3" />
                </div>
                <div>
                  <div className="font-medium">Approval Process</div>
                  <div className="text-sm text-muted-foreground">
                    Our team will review your application (typically within 24-48 hours)
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs font-medium text-white">
                  <UserCheck className="h-3 w-3" />
                </div>
                <div>
                  <div className="font-medium">Approval Notification</div>
                  <div className="text-sm text-muted-foreground">
                    You&apos;ll receive an email notification once your organization is approved
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  4
                </div>
                <div>
                  <div className="font-medium">Start Your Trial</div>
                  <div className="text-sm text-muted-foreground">
                    Access your dashboard, choose a plan, and start your free trial
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  5
                </div>
                <div>
                  <div className="font-medium">Add Providers</div>
                  <div className="text-sm text-muted-foreground">
                    Invite service providers to join your organization
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div className="text-sm">
                  <div className="mb-1 font-medium text-blue-700 dark:text-blue-300">
                    Free Trial Available
                  </div>
                  <div className="text-blue-600 dark:text-blue-400">
                    Once approved, you&apos;ll get a 30-day free trial to explore all features. No
                    credit card required during registration.
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-400" />
                <div className="text-sm">
                  <div className="mb-1 font-medium text-amber-700 dark:text-amber-300">
                    Important Note
                  </div>
                  <div className="text-amber-600 dark:text-amber-400">
                    You can modify most of these settings later from your organization dashboard.
                    Additional locations and staff members can be added after approval.
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
