'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { FormProvider, useForm } from 'react-hook-form';

import CalendarLoader from '@/components/calendar-loader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ProfileImageUploader } from '@/features/providers/components/onboarding/profile-image-uploader';
import { ProviderTypeSection } from '@/features/providers/components/onboarding/provider-type-section';
import { basicInfoSchema } from '@/features/providers/types/schemas';
import { SUPPORTED_LANGUAGES } from '@/features/providers/types/types';
import { useProvider } from '@/features/providers/hooks/use-provider';
import { useProviderTypes } from '@/features/providers/hooks/use-provider-types';
import { useUpdateProviderBasicInfo } from '@/features/providers/hooks/use-provider-updates';
import { useToast } from '@/hooks/use-toast';

interface EditBasicInfoProps {
  providerId: string;
  userId: string;
}

export function EditBasicInfo({ providerId, userId }: EditBasicInfoProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Fetch provider data
  const { data: provider, isLoading, error, refetch } = useProvider(providerId);

  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Update state when provider data is loaded
  useEffect(() => {
    if (provider) {
      setSelectedLanguages(provider.languages || []);
      setProfileImage(provider.image || null);
    }
  }, [provider]);

  // Check if current user is authorized to edit this provider
  useEffect(() => {
    if (provider && provider.userId !== userId) {
      router.push('/dashboard');
    }
  }, [provider, userId, router]);

  // Fetch provider types
  const { data: providerTypes, isLoading: isLoadingProviderTypes } = useProviderTypes();

  // Set up form with default values from provider
  const methods = useForm({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: '',
      bio: '',
      image: 'placeholder', // Use a placeholder to pass validation
      languages: [] as string[], // Explicitly type as string[] to match schema
      website: '',
      email: '',
      whatsapp: '',
      providerTypeIds: [] as string[], // New field for multiple types
      providerTypeId: '', // Keep for backward compatibility
      showPrice: true, // Default to showing prices
    },
    mode: 'onSubmit', // Changed to onSubmit to avoid premature validation
  });

  // Update form values when provider data is loaded
  useEffect(() => {
    if (provider) {
      // Get provider type IDs from the providerTypes array or fall back to legacy field
      const providerTypeIds =
        provider.providerTypes?.length > 0
          ? provider.providerTypes.map((type: any) => type.id)
          : provider.providerTypeId
            ? [provider.providerTypeId]
            : [];
      const legacyProviderTypeId = provider.providerTypeId || '';

      // Set form values including provider type IDs
      methods.reset({
        name: provider.name || '',
        bio: provider.bio || '',
        image: provider.image || 'placeholder', // Use placeholder if no image
        languages: provider.languages || [],
        website: provider.website || '',
        email: provider.email || '',
        whatsapp: provider.whatsapp || '',
        providerTypeIds: providerTypeIds,
        providerTypeId: legacyProviderTypeId, // Keep for backward compatibility
        showPrice: provider.showPrice !== undefined ? provider.showPrice : true, // Default to true if not set
      });

      // Force set the values directly to ensure they're updated
      methods.setValue('providerTypeIds', providerTypeIds);
      methods.setValue('providerTypeId', legacyProviderTypeId);
    }
  }, [provider, methods]);

  // Watch the bio field to show character count
  const bio = methods.watch('bio') || '';

  // Use our custom mutation hook
  const updateProviderMutation = useUpdateProviderBasicInfo();

  const handleProfileImageChange = (imageUrl: string | null) => {
    setProfileImage(imageUrl);
    // If imageUrl is null, set to 'placeholder' instead of empty string
    // This prevents sending empty strings that would clear the existing image
    methods.setValue('image', imageUrl || 'placeholder');
  };

  const addLanguage = (language: string) => {
    if (!selectedLanguages.includes(language)) {
      const newLanguages = [...selectedLanguages, language];
      setSelectedLanguages(newLanguages);
      methods.setValue('languages', newLanguages);
    }
  };

  const removeLanguage = (languageToRemove: string) => {
    const newLanguages = selectedLanguages.filter((lang) => lang !== languageToRemove);
    setSelectedLanguages(newLanguages);
    methods.setValue('languages', newLanguages);
  };

  const onSubmit = async (data: Record<string, any>) => {
    if (!provider) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData object
      const formData = new FormData();

      // Add provider ID
      formData.append('id', provider.id);
      formData.append('userId', provider.userId);

      // Add form fields
      formData.append('name', data.name);
      formData.append('image', data.image);
      formData.append('bio', data.bio);
      formData.append('email', data.email);
      formData.append('whatsapp', data.whatsapp);
      formData.append('website', data.website || '');

      // Handle multiple provider types
      const selectedProviderTypeIds = data.providerTypeIds || [];
      selectedProviderTypeIds.forEach((typeId: string) => {
        formData.append('providerTypeIds', typeId);
      });

      // Also include the legacy single type for backward compatibility
      const selectedProviderTypeId = data.providerTypeId || provider.providerTypeId || '';
      formData.append('providerTypeId', selectedProviderTypeId);

      // Add languages
      selectedLanguages.forEach((lang) => {
        formData.append('languages', lang);
      });

      // Add showPrice field
      formData.append('showPrice', data.showPrice.toString());

      // Add provider ID
      formData.append('id', provider.id);

      // Use mutateAsync to properly await the result
      const updateData = {
        id: provider.id,
        name: data.name,
        email: data.email,
        website: data.website || undefined,
        whatsapp: data.whatsapp,
        bio: data.bio,
        image: data.image !== 'placeholder' ? data.image : undefined,
        languages: selectedLanguages,
        providerTypeIds: data.providerTypeIds || [],
        providerTypeId: data.providerTypeId || undefined,
        showPrice: data.showPrice,
      };
      await updateProviderMutation.mutateAsync(updateData);

      // Manually update the local state to reflect the change immediately
      if (provider) {
        // Create a new provider object with the updated basic info
        const updatedProvider = {
          ...provider,
          name: data.name,
          bio: data.bio,
          image: data.image !== 'placeholder' ? data.image : provider.image,
          languages: selectedLanguages,
          website: data.website || '',
          email: data.email,
          whatsapp: data.whatsapp,
          providerTypeId: selectedProviderTypeId,
          providerTypeIds: selectedProviderTypeIds,
          showPrice: data.showPrice,
        };

        // Force update the query cache with the new data
        queryClient.setQueryData(['provider', providerId], updatedProvider);
      }

      toast({
        title: 'Success',
        description: 'Provider profile updated successfully',
      });

      // Force a hard refetch to ensure we have the latest data
      refetch();

      // Redirect to the provider profile view
      router.push(`/providers/${providerId}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update provider profile',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return <CalendarLoader message="Loading" submessage="Fetching provider data..." />;
  }

  // Show error state
  if (error || !provider) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold text-red-500">Error</h2>
        <p>Failed to load provider data. Please try again later.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {isSubmitting && (
        <CalendarLoader message="Saving Changes" submessage="Updating your provider profile..." />
      )}
      <FormProvider {...methods}>
        <form
          onSubmit={(e) => {
            e.preventDefault();

            // Force submit regardless of validation
            const formData = methods.getValues();
            onSubmit(formData);
          }}
          className="space-y-6"
        >
          {/* Provider Type Card */}
          <Card className="mb-8 p-6">
            <h2 className="text-2xl font-bold">Provider Types</h2>
            <p className="text-sm text-muted-foreground">
              Select your medical profession or specialties.
            </p>
            <Separator className="my-4" />

            <div className="space-y-6">
              <h3 className="mb-2 font-medium">Current Types</h3>
              <div className="mb-4 flex flex-wrap gap-2">
                {provider?.providerTypes && provider.providerTypes.length > 0 ? (
                  provider.providerTypes.map((type: any) => (
                    <Badge key={type.id} variant="secondary">
                      {type.name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">Not specified</p>
                )}
              </div>

              <ProviderTypeSection
                providerTypes={(providerTypes || []).map((type) => ({
                  ...type,
                  description: type.description ?? null,
                }))}
                selectedProviderTypes={(
                  providerTypes?.filter((type) =>
                    methods.watch('providerTypeIds')?.includes(type.id)
                  ) || []
                ).map((type) => ({
                  ...type,
                  description: type.description ?? null,
                }))}
                totalRequirementsCount={0}
                totalServicesCount={0}
                multipleSelection={true}
              />
            </div>
          </Card>

          {/* Basic Information Card */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold">Basic Information</h2>
            <p className="text-sm text-muted-foreground">
              Provider details and contact information.
            </p>
            <Separator className="my-4" />

            <div className="space-y-6">
              <div className="flex w-full flex-col gap-6">
                <div className="w-full">
                  <FormLabel>Profile Image</FormLabel>
                  <div className="mt-2 flex justify-center">
                    <div className="w-[250px]">
                      <ProfileImageUploader
                        onImageChange={handleProfileImageChange}
                        currentImage={profileImage}
                      />
                    </div>
                  </div>
                </div>

                <FormField
                  control={methods.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={methods.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={methods.control}
                    name="whatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., +27123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={methods.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website (Optional)</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://your-website.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={methods.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Bio *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell patients about your background, experience, and approach to care..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <div className="flex justify-between">
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">{bio.length}/500 characters</p>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <FormLabel>Languages Spoken *</FormLabel>
                  <div className="flex gap-2">
                    <Select onValueChange={addLanguage}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select languages you speak" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_LANGUAGES.filter(
                          (lang) => !selectedLanguages.includes(lang)
                        ).map((language) => (
                          <SelectItem key={language} value={language}>
                            {language}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedLanguages.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedLanguages.map((language) => (
                        <Badge
                          key={language}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {language}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-auto w-4 p-0"
                            onClick={() => removeLanguage(language)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {selectedLanguages.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Please select at least one language
                    </p>
                  )}
                </div>

                <FormField
                  control={methods.control}
                  name="showPrice"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Display prices to patients</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Show your service prices when patients view your available appointments
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
