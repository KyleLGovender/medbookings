'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Baby, Bone, Brain, Eye, Heart, Stethoscope } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const providerTypeSchema = z.object({
  providerType: z.string().min(1, 'Please select a provider type'),
});

type ProviderTypeData = z.infer<typeof providerTypeSchema>;

interface ProviderTypeStepProps {
  data: any;
  onDataChange: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

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

export function ProviderTypeStep({
  data,
  onDataChange,
  onNext,
  onPrevious,
}: ProviderTypeStepProps) {
  const form = useForm<ProviderTypeData>({
    resolver: zodResolver(providerTypeSchema),
    defaultValues: {
      providerType: data?.providerType?.providerType || '',
    },
  });

  const onSubmit = (formData: ProviderTypeData) => {
    onDataChange({ providerType: formData });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Provider Type</h3>
        <p className="text-sm text-muted-foreground">
          Select the type of healthcare services you provide. This will determine the regulatory
          requirements for your application.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="providerType"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="grid grid-cols-1 gap-4 md:grid-cols-2"
                  >
                    {PROVIDER_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <div key={type.id}>
                          <RadioGroupItem value={type.id} id={type.id} className="peer sr-only" />
                          <label htmlFor={type.id} className="cursor-pointer">
                            <Card className="transition-all hover:bg-accent peer-checked:ring-2 peer-checked:ring-primary">
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

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onPrevious}>
              Previous
            </Button>
            <Button type="submit">Continue to Professional Details</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
