'use client';

import { Baby, Bone, Brain, Eye, Heart, Stethoscope } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const PROVIDER_TYPES = [
  {
    id: 'general_practitioner',
    title: 'General Practitioner',
    description: 'Primary care physician providing comprehensive healthcare',
    icon: Stethoscope,
  },
  {
    id: 'specialist',
    title: 'Medical Specialist',
    description: 'Specialized medical care in specific areas',
    icon: Heart,
  },
  {
    id: 'mental_health',
    title: 'Mental Health Professional',
    description: 'Psychiatrists, psychologists, and counselors',
    icon: Brain,
  },
  {
    id: 'optometrist',
    title: 'Optometrist',
    description: 'Eye care and vision health specialists',
    icon: Eye,
  },
  {
    id: 'physiotherapist',
    title: 'Physiotherapist',
    description: 'Physical therapy and rehabilitation services',
    icon: Bone,
  },
  {
    id: 'pediatrician',
    title: 'Pediatrician',
    description: 'Specialized care for infants, children, and adolescents',
    icon: Baby,
  },
];

export function ProviderTypeSection() {
  const { control } = useFormContext();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select the type of healthcare services you provide. This will determine the regulatory
        requirements for your application.
      </p>

      <FormField
        control={control}
        name="providerType.providerType"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
              >
                {PROVIDER_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <div key={type.id}>
                      <RadioGroupItem value={type.id} id={type.id} className="peer sr-only" />
                      <label htmlFor={type.id} className="cursor-pointer">
                        <Card className="h-full transition-all hover:bg-accent peer-checked:ring-2 peer-checked:ring-primary">
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                              <div className="rounded-lg bg-primary/10 p-2">
                                <Icon className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-base">{type.title}</CardTitle>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <CardDescription>{type.description}</CardDescription>
                          </CardContent>
                        </Card>
                      </label>
                    </div>
                  );
                })}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
