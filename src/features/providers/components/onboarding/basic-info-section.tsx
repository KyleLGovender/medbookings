'use client';

import { useState } from 'react';

import { X } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { SUPPORTED_LANGUAGES } from '@/features/providers/hooks/types';

import { ProfileImageUploader } from './profile-image-uploader';

export function BasicInfoSection() {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const { control, setValue, watch } = useFormContext();

  // Watch the bio field to show character count
  const bio = watch('basicInfo.bio') || '';

  const handleProfileImageChange = (imageUrl: string | null) => {
    setProfileImage(imageUrl);
    setValue('basicInfo.image', imageUrl || '');
  };

  const addLanguage = (language: string) => {
    if (!selectedLanguages.includes(language)) {
      const newLanguages = [...selectedLanguages, language];
      setSelectedLanguages(newLanguages);
      setValue('basicInfo.languages', newLanguages);
    }
  };

  const removeLanguage = (languageToRemove: string) => {
    const newLanguages = selectedLanguages.filter((lang) => lang !== languageToRemove);
    setSelectedLanguages(newLanguages);
    setValue('basicInfo.languages', newLanguages);
  };

  return (
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
          control={control}
          name="basicInfo.name"
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
            control={control}
            name="basicInfo.email"
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
            control={control}
            name="basicInfo.whatsapp"
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
          control={control}
          name="basicInfo.website"
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
          control={control}
          name="basicInfo.showPrice"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Show Prices</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Display your service prices to patients when they view your profile.  You switch this one or off at any time and all appointments will updated accordingly.
                </p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="basicInfo.bio"
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
                {SUPPORTED_LANGUAGES.filter((lang) => !selectedLanguages.includes(lang)).map(
                  (language) => (
                    <SelectItem key={language} value={language}>
                      {language}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedLanguages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedLanguages.map((language) => (
                <Badge key={language} variant="secondary" className="flex items-center gap-1">
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
            <p className="text-sm text-muted-foreground">Please select at least one language</p>
          )}
        </div>
      </div>
    </div>
  );
}
