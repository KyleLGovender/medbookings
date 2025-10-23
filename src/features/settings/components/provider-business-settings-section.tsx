'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Languages } from '@prisma/client';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

import { useUpdateProviderBusinessSettings } from '../hooks/use-settings';
import {
  type ProviderBusinessSettingsInput,
  providerBusinessSettingsSchema,
} from '../types/schemas';
import { type ProviderBusinessInfo } from '../types/types';

interface ProviderBusinessSettingsSectionProps {
  provider: ProviderBusinessInfo;
}

// Available languages from Prisma enum
const availableLanguages = Object.values(Languages);

export default function ProviderBusinessSettingsSection({
  provider,
}: ProviderBusinessSettingsSectionProps) {
  const { toast } = useToast();
  const updateBusinessSettings = useUpdateProviderBusinessSettings();

  const form = useForm<ProviderBusinessSettingsInput>({
    resolver: zodResolver(providerBusinessSettingsSchema),
    defaultValues: {
      bio: provider.bio || '',
      website: provider.website || '',
      showPrice: provider.showPrice,
      languages: provider.languages,
    },
  });

  const onSubmit = async (data: ProviderBusinessSettingsInput) => {
    try {
      await updateBusinessSettings.mutateAsync(data);
      toast({
        title: 'Business settings updated',
        description: 'Your provider business settings have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Failed to update business settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Provider status indicator */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Provider Status:</span>
        <Badge variant={provider.status === 'ACTIVE' ? 'default' : 'secondary'}>
          {provider.status}
        </Badge>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Business Information</h3>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Professional Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell patients about your experience, qualifications, and approach to healthcare..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This will be displayed on your provider profile. Max 1000 characters.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://your-website.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your professional website or practice website (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Languages */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Languages Spoken</h3>
            <FormField
              control={form.control}
              name="languages"
              render={() => (
                <FormItem>
                  <FormDescription>
                    Select all languages you can communicate in during consultations
                  </FormDescription>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {availableLanguages.map((language) => (
                      <FormField
                        key={language}
                        control={form.control}
                        name="languages"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={language}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(language)}
                                  onCheckedChange={(checked) => {
                                    const currentLanguages = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentLanguages, language]);
                                    } else {
                                      field.onChange(
                                        currentLanguages.filter((l) => l !== language)
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">{language}</FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Display Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Display Settings</h3>

            <FormField
              control={form.control}
              name="showPrice"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Display prices to patients</FormLabel>
                    <FormDescription>
                      Show service prices on your public profile and booking pages
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              disabled={updateBusinessSettings.isPending}
              className="min-w-[120px]"
            >
              {updateBusinessSettings.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>

            {form.formState.isDirty && (
              <p className="text-sm text-muted-foreground">You have unsaved changes.</p>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
