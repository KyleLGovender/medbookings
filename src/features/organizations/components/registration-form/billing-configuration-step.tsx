'use client';

import { Building, Calendar, CreditCard, Gift, MapPin, Settings, Zap } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { OrganizationRegistrationData } from '@/features/organizations/types/types';

export function BillingConfigurationStep() {
  const form = useFormContext<OrganizationRegistrationData>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Billing Configuration</h2>
        <p className="text-muted-foreground">
          Choose how you want to manage billing and subscriptions for your organization.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing Model
          </CardTitle>
          <CardDescription>
            Select the billing approach that best fits your organization structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="organization.billingModel"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid gap-4"
                  >
                    <div className="flex items-center space-x-3 rounded-lg border p-4 transition-colors hover:bg-accent/50">
                      <RadioGroupItem value="CONSOLIDATED" id="consolidated" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-primary" />
                          <FormLabel
                            htmlFor="consolidated"
                            className="cursor-pointer text-base font-medium"
                          >
                            Consolidated Billing
                          </FormLabel>
                          <Badge variant="secondary">Recommended</Badge>
                        </div>
                        <FormDescription className="text-sm">
                          One subscription covers your entire organization. Ideal for single
                          practices or centralized billing.
                        </FormDescription>
                        <div className="text-xs text-muted-foreground">
                          ✓ Simplified billing • ✓ Cost-effective for small to medium practices • ✓
                          Centralized management
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 rounded-lg border p-4 transition-colors hover:bg-accent/50">
                      <RadioGroupItem value="PER_LOCATION" id="per-location" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <FormLabel
                            htmlFor="per-location"
                            className="cursor-pointer text-base font-medium"
                          >
                            Per-Location Billing
                          </FormLabel>
                        </div>
                        <FormDescription className="text-sm">
                          Each location has its own subscription. Perfect for multi-location
                          practices with separate budgets.
                        </FormDescription>
                        <div className="text-xs text-muted-foreground">
                          ✓ Location autonomy • ✓ Separate cost centers • ✓ Flexible scaling
                        </div>
                      </div>
                    </div>

                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* What's Next */}
      <Card>
        <CardHeader>
          <CardTitle>What&apos;s Next?</CardTitle>
          <CardDescription>
            After registration approval, you&apos;ll get immediate access to start your journey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 text-sm">
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/20">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-xs font-medium text-white">
                <Gift className="h-3 w-3" />
              </div>
              <div>
                <div className="font-medium text-green-700 dark:text-green-300">
                  Start Your Free Trial
                </div>
                <div className="text-green-600 dark:text-green-400">
                  Get instant access to a 30-day free trial with all premium features included
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                <Settings className="h-3 w-3" />
              </div>
              <div>
                <div className="font-medium">Configure Your Plan</div>
                <div className="text-muted-foreground">
                  Choose from flexible plans that scale with your practice size and needs
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                <Calendar className="h-3 w-3" />
              </div>
              <div>
                <div className="font-medium">Set Up Availability</div>
                <div className="text-muted-foreground">
                  Configure your schedules, services, and start accepting bookings
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
            <div className="mb-2 flex items-center gap-2 font-medium text-blue-700 dark:text-blue-300">
              <Gift className="h-4 w-4" />
              30-Day Free Trial Benefits
            </div>
            <div className="space-y-1 text-sm text-blue-600 dark:text-blue-400">
              <p>• Full access to all features and integrations</p>
              <p>• Unlimited appointment bookings during trial</p>
              <p>• Google Calendar sync and Meet integration</p>
              <p>• No credit card required to start</p>
              <p>• Cancel anytime with no obligations</p>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
            <div className="text-sm">
              <div className="mb-1 font-medium text-amber-700 dark:text-amber-300">
                Plan Configuration
              </div>
              <div className="text-amber-600 dark:text-amber-400">
                After your trial starts, you can explore our flexible pricing plans designed for
                practices of all sizes. Upgrade, downgrade, or modify your plan anytime from your
                dashboard.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
