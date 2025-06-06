'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
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
import { SUPPORTED_LANGUAGES, basicInfoSchema } from '@/features/providers/types/types';
import { useToast } from '@/hooks/use-toast';

interface EditBasicInfoProps {
  provider: any; // Will be replaced with proper type
}

// API mutation function
const updateProviderProfile = async (formData: FormData) => {
  // Validate required fields
  const requiredFields = ['id', 'email', 'name', 'bio', 'whatsapp', 'userId'];
  const missingFields = requiredFields.filter((field) => !formData.has(field));

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  const response = await fetch(`/api/providers/${formData.get('id')}`, {
    method: 'PUT',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update profile');
  }

  return await response.json();
};

export function EditBasicInfo({ provider }: EditBasicInfoProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(provider.languages || []);
  const [profileImage, setProfileImage] = useState<string | null>(provider.image || null);

  // Set up form with default values from provider
  const methods = useForm({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: provider.name || '',
      bio: provider.bio || '',
      image: provider.image || '',
      languages: provider.languages || [],
      website: provider.website || '',
      email: provider.email || '',
      whatsapp: provider.whatsapp || '',
    },
    mode: 'onBlur',
  });

  // Watch the bio field to show character count
  const bio = methods.watch('bio') || '';

  // TanStack Query mutation
  const mutation = useMutation({
    mutationFn: updateProviderProfile,
    onSuccess: (data) => {
      toast({
        title: 'Profile updated',
        description: 'Your profile information has been updated successfully.',
      });

      // Navigate back to profile view
      if (data.redirect) {
        router.push(data.redirect);
      } else {
        router.push(`/providers/${provider.id}/edit`);
      }
      router.refresh();
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message || 'There was an error updating your profile.',
        variant: 'destructive',
      });
    },
  });

  const handleProfileImageChange = (imageUrl: string | null) => {
    setProfileImage(imageUrl);
    methods.setValue('image', imageUrl || '');
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

  const onSubmit = async (data: any) => {
    // Create FormData object for the API
    const formData = new FormData();
    formData.append('id', provider.id);
    formData.append('userId', provider.userId);

    // Ensure required fields are included
    if (!data.email) data.email = provider.email || '';
    if (!data.name) data.name = provider.name || '';
    if (!data.bio) data.bio = provider.bio || '';
    if (!data.whatsapp) data.whatsapp = provider.whatsapp || '';

    // Append all form fields
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'languages') {
        // Handle languages array separately
        (value as string[]).forEach((lang) => {
          formData.append('languages', lang);
        });
      } else if (value !== undefined && value !== null) {
        formData.append(key, value as string);
      }
    });

    // If we have an image as a URL (not a File object), add it
    if (profileImage && typeof profileImage === 'string') {
      formData.append('image', profileImage);
    }

    // Trigger the mutation
    mutation.mutate(formData);
  };

  return (
    <>
      {mutation.isPending && (
        <CalendarLoader message="Saving Changes" submessage="Updating your provider profile..." />
      )}
      <FormProvider {...methods}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data = methods.getValues();
            onSubmit(data);
          }}
          className="space-y-6"
        >
          <Card className="p-6">
            <h2 className="text-2xl font-bold">Basic Information</h2>
            <p className="text-sm text-muted-foreground">
              Update your profile information visible to patients.
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
                            className="h-4 h-auto w-4 p-0"
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
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </>
  );
}
