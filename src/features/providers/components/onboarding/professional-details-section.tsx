'use client';

import { useFormContext } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const SPECIALIZATIONS = [
  'Cardiology',
  'Dermatology',
  'Emergency Medicine',
  'Family Medicine',
  'Internal Medicine',
  'Neurology',
  'Oncology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Radiology',
  'Surgery',
];

const EXPERIENCE_RANGES = [
  '0-2 years',
  '3-5 years',
  '6-10 years',
  '11-15 years',
  '16-20 years',
  '20+ years',
];

export function ProfessionalDetailsSection() {
  const { control } = useFormContext();

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Provide your professional qualifications and experience details.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name="professionalDetails.medicalLicenseNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Medical License Number *</FormLabel>
              <FormControl>
                <Input placeholder="Enter your license number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="professionalDetails.yearsOfExperience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Years of Experience *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience range" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {EXPERIENCE_RANGES.map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="professionalDetails.education"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Education & Qualifications *</FormLabel>
            <FormControl>
              <Textarea
                placeholder="List your medical degree, residency, fellowships, and other relevant qualifications..."
                className="min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="professionalDetails.specializations"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Specializations *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select your primary specialization" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {SPECIALIZATIONS.map((spec) => (
                  <SelectItem key={spec} value={spec}>
                    {spec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name="professionalDetails.languagesSpoken"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Languages Spoken *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., English, Spanish, French" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="professionalDetails.hospitalAffiliations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hospital Affiliations</FormLabel>
              <FormControl>
                <Input placeholder="List any hospital affiliations" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
