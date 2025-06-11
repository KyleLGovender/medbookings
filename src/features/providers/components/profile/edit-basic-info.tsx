'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { FormProvider, useForm } from 'react-hook-form';

import CalendarLoader from '@/components/calendar-loader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { useProvider } from '@/features/providers/hooks/use-provider';
import { useProviderTypes } from '@/features/providers/hooks/use-provider-types';
import { useUpdateProviderBasicInfo } from '@/features/providers/hooks/use-provider-updates';
import { SUPPORTED_LANGUAGES, basicInfoSchema } from '@/features/providers/types/types';
import { useToast } from '@/hooks/use-toast';
import { providerDebug } from '@/lib/debug';

interface EditBasicInfoProps {
  providerId: string;
  userId: string;
}

export function EditBasicInfo({ providerId, userId }: EditBasicInfoProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Fetch provider data
  const { data: provider, isLoading, error } = useProvider(providerId);

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
      serviceProviderTypeId: '',
    },
    mode: 'onSubmit', // Changed to onSubmit to avoid premature validation
  });

  // Update form values when provider data is loaded
  useEffect(() => {
    if (provider) {
      // Make sure we have the provider type ID
      const providerTypeId = provider.serviceProviderTypeId || '';

      // Set form values including provider type ID
      methods.reset({
        name: provider.name || '',
        bio: provider.bio || '',
        image: provider.image || 'placeholder', // Use placeholder if no image
        languages: provider.languages || [],
        website: provider.website || '',
        email: provider.email || '',
        whatsapp: provider.whatsapp || '',
        serviceProviderTypeId: providerTypeId,
      });

      // Force set the value directly to ensure it's updated
      methods.setValue('serviceProviderTypeId', providerTypeId);
    }
  }, [provider, methods]);

  // Watch the bio field to show character count
  const bio = methods.watch('bio') || '';

  // Use our custom mutation hook
  const { mutate, isPending } = useUpdateProviderBasicInfo({
    onSuccess: (data) => {
      toast({
        title: 'Profile updated',
        description: 'Your profile information has been updated successfully.',
      });

      // Navigate back to profile view
      if (data.redirect) {
        router.push(data.redirect);
      } else if (provider) {
        router.push(`/providers/${provider.id}/edit`);
      } else {
        // Fallback if provider is not yet loaded
        router.push('/dashboard');
      }
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: 'Error updating profile',
        description: error.message || 'There was an error updating your profile.',
        variant: 'destructive',
      });
    },
  });

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
      providerDebug.error('editBasicInfo', 'No provider data available');
      return;
    }

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

    // Use the selected provider type from the form data
    const selectedProviderTypeId =
      data.serviceProviderTypeId || provider.serviceProviderTypeId || '';
    formData.append('serviceProviderTypeId', selectedProviderTypeId);

    // Add languages
    selectedLanguages.forEach((lang) => {
      formData.append('languages', lang);
    });

    // // Add image URL if it exists and has changed
    // if (typeof data.image === 'string' && data.image !== 'placeholder') {
    //   if (data.image === '') {
    //     // Don't send empty strings that would clear the existing image
    //     providerDebug.log('editBasicInfo', 'Empty image string detected, not sending');
    //   } else if (data.image !== profileImage) {
    //     // Only send if the image URL has actually changed
    //     providerDebug.log('editBasicInfo', 'Adding image URL:', data.image);
    //     formData.append('image', data.image);
    //   } else {
    //     providerDebug.log('editBasicInfo', 'Image URL unchanged, not sending');
    //   }
    // } else {
    //   providerDebug.log('editBasicInfo', 'No valid image URL to send');
    // }

    providerDebug.log('editBasicInfo', 'Form data:', { formData });

    mutate(formData);
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
      {isPending && (
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
            <h2 className="text-2xl font-bold">Provider Type</h2>
            <p className="text-sm text-muted-foreground">
              Specialization and category of the provider.
            </p>
            <Separator className="my-4" />

            <div className="space-y-6">
              <h3 className="mb-2 font-medium">Current Type</h3>
              <p className="mb-4">{provider?.serviceProviderType?.name || 'Not specified'}</p>

              <FormField
                control={methods.control}
                name="serviceProviderTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Change Provider Type</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Explicitly update the form value
                        methods.setValue('serviceProviderTypeId', value);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingProviderTypes ? (
                          <SelectItem value="loading" disabled>
                            Loading provider types...
                          </SelectItem>
                        ) : providerTypes?.length ? (
                          providerTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No provider types available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
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
              </div>
            </div>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={isPending}
              onClick={() => {
                console.log('Save Changes button clicked');
                console.log('Form is valid:', methods.formState.isValid);
                console.log('Form errors:', methods.formState.errors);
                console.log('Current form values:', methods.getValues());
              }}
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
