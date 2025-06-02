"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const professionalDetailsSchema = z.object({
  medicalLicenseNumber: z.string().min(1, "Medical license number is required"),
  yearsOfExperience: z.string().min(1, "Years of experience is required"),
  education: z.string().min(10, "Please provide details about your education"),
  specializations: z.string().min(1, "Please select at least one specialization"),
  languagesSpoken: z.string().min(1, "Please specify languages spoken"),
  hospitalAffiliations: z.string().optional(),
})

type ProfessionalDetailsData = z.infer<typeof professionalDetailsSchema>

interface ProfessionalDetailsStepProps {
  data: any
  onDataChange: (data: any) => void
  onNext: () => void
  onPrevious: () => void
}

const SPECIALIZATIONS = [
  "Cardiology",
  "Dermatology",
  "Emergency Medicine",
  "Family Medicine",
  "Internal Medicine",
  "Neurology",
  "Oncology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Radiology",
  "Surgery",
]

const EXPERIENCE_RANGES = ["0-2 years", "3-5 years", "6-10 years", "11-15 years", "16-20 years", "20+ years"]

export function ProfessionalDetailsStep({ data, onDataChange, onNext, onPrevious }: ProfessionalDetailsStepProps) {
  const form = useForm<ProfessionalDetailsData>({
    resolver: zodResolver(professionalDetailsSchema),
    defaultValues: {
      medicalLicenseNumber: data?.professionalDetails?.medicalLicenseNumber || "",
      yearsOfExperience: data?.professionalDetails?.yearsOfExperience || "",
      education: data?.professionalDetails?.education || "",
      specializations: data?.professionalDetails?.specializations || "",
      languagesSpoken: data?.professionalDetails?.languagesSpoken || "",
      hospitalAffiliations: data?.professionalDetails?.hospitalAffiliations || "",
    },
  })

  const onSubmit = (formData: ProfessionalDetailsData) => {
    onDataChange({ professionalDetails: formData })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Professional Details</h3>
        <p className="text-sm text-muted-foreground">
          Provide your professional qualifications and experience details.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="medicalLicenseNumber"
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
              control={form.control}
              name="yearsOfExperience"
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
            control={form.control}
            name="education"
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
            control={form.control}
            name="specializations"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="languagesSpoken"
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
              control={form.control}
              name="hospitalAffiliations"
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

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onPrevious}>
              Previous
            </Button>
            <Button type="submit">Continue to Regulatory Requirements</Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
