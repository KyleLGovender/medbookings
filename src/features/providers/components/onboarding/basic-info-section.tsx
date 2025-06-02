"use client"

import { useState } from "react"
import { useFormContext } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProfileImageUploader } from "./profile-image-uploader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

// Languages enum from Prisma schema
const LANGUAGES = [
  "English",
  "IsiZulu",
  "IsiXhosa",
  "Afrikaans",
  "Sepedi",
  "Setswana",
  "Sesotho",
  "IsiNdebele",
  "SiSwati",
  "Tshivenda",
  "Xitsonga",
  "Portuguese",
  "French",
  "Hindi",
  "German",
  "Mandarin",
]

export function BasicInfoSection() {
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const { control, setValue, watch } = useFormContext()

  // Watch the bio field to show character count
  const bio = watch("basicInfo.bio") || ""

  const handleProfileImageChange = (imageUrl: string | null) => {
    setProfileImage(imageUrl)
    setValue("basicInfo.image", imageUrl || "")
  }

  const addLanguage = (language: string) => {
    if (!selectedLanguages.includes(language)) {
      const newLanguages = [...selectedLanguages, language]
      setSelectedLanguages(newLanguages)
      setValue("basicInfo.languages", newLanguages)
    }
  }

  const removeLanguage = (languageToRemove: string) => {
    const newLanguages = selectedLanguages.filter((lang) => lang !== languageToRemove)
    setSelectedLanguages(newLanguages)
    setValue("basicInfo.languages", newLanguages)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <ProfileImageUploader onImageChange={handleProfileImageChange} currentImage={profileImage} />
        </div>

        <div className="md:w-2/3 space-y-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {LANGUAGES.filter((lang) => !selectedLanguages.includes(lang)).map((language) => (
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
                  <Badge key={language} variant="secondary" className="flex items-center gap-1">
                    {language}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 w-4 h-4"
                      onClick={() => removeLanguage(language)}
                    >
                      <X className="w-3 h-3" />
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
    </div>
  )
}
