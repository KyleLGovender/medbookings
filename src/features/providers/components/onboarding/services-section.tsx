"use client"

import { useState } from "react"
import { useFormContext } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"

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

export function ServicesSection() {
  const { control, setValue, watch } = useFormContext()
  const [customService, setCustomService] = useState("")
  const [customServices, setCustomServices] = useState<string[]>([])

  const watchedServices = watch("services.availableServices") || []

  const addCustomService = () => {
    if (customService.trim() && !customServices.includes(customService.trim())) {
      const newCustomServices = [...customServices, customService.trim()]
      setCustomServices(newCustomServices)
      setValue("services.customServices", newCustomServices)
      setCustomService("")
    }
  }

  const removeCustomService = (serviceToRemove: string) => {
    const newCustomServices = customServices.filter((service) => service !== serviceToRemove)
    setCustomServices(newCustomServices)
    setValue("services.customServices", newCustomServices)
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Select the services you provide and set your consultation fee.</p>

      <div className="space-y-6">
        <FormField
          control={control}
          name="services.consultationFee"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Standard Consultation Fee (USD) *</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                  <Input type="number" placeholder="0.00" className="pl-8" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="services.availableServices"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select services you provide *</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {COMMON_SERVICES.map((service) => (
                  <div key={service} className="flex flex-row items-start space-x-3 space-y-0">
                    <Checkbox
                      checked={field.value?.includes(service)}
                      onCheckedChange={(checked) => {
                        return checked
                          ? field.onChange([...(field.value || []), service])
                          : field.onChange(field.value?.filter((value: string) => value !== service))
                      }}
                    />
                    <span className="text-sm font-normal">{service}</span>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <h4 className="text-sm font-medium">Custom Services</h4>
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

        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Selected Services Summary</h4>
          <p className="text-sm text-muted-foreground mb-2">
            You have selected {watchedServices?.length || 0} standard services
            {customServices.length > 0 && ` and ${customServices.length} custom services`}.
          </p>
          {(watchedServices?.length > 0 || customServices.length > 0) && (
            <div className="flex flex-wrap gap-1">
              {watchedServices?.map((service: string) => (
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
      </div>
    </div>
  )
}
