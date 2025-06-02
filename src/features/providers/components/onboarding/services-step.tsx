"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"

const servicesSchema = z.object({
  consultationFee: z.string().min(1, "Consultation fee is required"),
  availableServices: z.array(z.string()).min(1, "Please select at least one service"),
  customServices: z.array(z.string()).optional(),
})

type ServicesData = z.infer<typeof servicesSchema>

interface ServicesStepProps {
  data: any
  onDataChange: (data: any) => void
  onNext: () => void
  onPrevious: () => void
}

const COMMON_SERVICES = [
  "General Consultation",
  "Follow-up Consultation",
  "Preventive Care",
  "Health Screening",
  "Vaccination",
  "Minor Procedures",
  "Diagnostic Tests",
  "Treatment Planning",
  "Second Opinion",
  "Telemedicine Consultation",
]

export function ServicesStep({ data, onDataChange, onNext, onPrevious }: ServicesStepProps) {
  const [customService, setCustomService] = useState("")
  const [customServices, setCustomServices] = useState<string[]>(data?.services?.customServices || [])

  const form = useForm<ServicesData>({
    resolver: zodResolver(servicesSchema),
    defaultValues: {
      consultationFee: data?.services?.consultationFee || "",
      availableServices: data?.services?.availableServices || [],
      customServices: customServices,
    },
  })

  const watchedServices = form.watch("availableServices")

  const addCustomService = () => {
    if (customService.trim() && !customServices.includes(customService.trim())) {
      const newCustomServices = [...customServices, customService.trim()]
      setCustomServices(newCustomServices)
      form.setValue("customServices", newCustomServices)
      setCustomService("")
    }
  }

  const removeCustomService = (serviceToRemove: string) => {
    const newCustomServices = customServices.filter((service) => service !== serviceToRemove)
    setCustomServices(newCustomServices)
    form.setValue("customServices", newCustomServices)
  }

  const onSubmit = (formData: ServicesData) => {
    onDataChange({ services: { ...formData, customServices } })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Services Offered</h3>
        <p className="text-sm text-muted-foreground">Select the services you provide and set your consultation fee.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Consultation Fee</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="consultationFee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Standard Consultation Fee (USD) *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input type="number" placeholder="0.00" className="pl-8" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Available Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="availableServices"
                render={() => (
                  <FormItem>
                    <FormLabel>Select services you provide *</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {COMMON_SERVICES.map((service) => (
                        <FormField
                          key={service}
                          control={form.control}
                          name="availableServices"
                          render={({ field }) => {
                            return (
                              <FormItem key={service} className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(service)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, service])
                                        : field.onChange(field.value?.filter((value) => value !== service))
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">{service}</FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormLabel>Custom Services</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a custom service"
                    value={customService}
                    onChange={(e) => setCustomService(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomService())}
                  />
                  <Button type="button" variant="outline" onClick={addCustomService} disabled={!customService.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {customServices.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {customServices.map((service) => (
                      <Badge key={service} variant="secondary" className="flex items-center gap-1">
                        {service}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 w-4 h-4"
                          onClick={() => removeCustomService(service)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Selected Services Summary</h4>
            <p className="text-sm text-muted-foreground mb-2">
              You have selected {watchedServices?.length || 0} standard services
              {customServices.length > 0 && ` and ${customServices.length} custom services`}.
            </p>
            {(watchedServices?.length > 0 || customServices.length > 0) && (
              <div className="flex flex-wrap gap-1">
                {watchedServices?.map((service) => (
                  <Badge key={service} variant="outline" className="text-xs">
                    {service}
                  </Badge>
                ))}
                {customServices.map((service) => (
                  <Badge key={service} variant="outline" className="text-xs">
                    {service}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onPrevious}>
              Previous
            </Button>
            <Button type="submit">Continue to Review</Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
