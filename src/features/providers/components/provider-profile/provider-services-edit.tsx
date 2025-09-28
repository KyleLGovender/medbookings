'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Clock, Edit2, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/utils/api';

const serviceSchema = z.object({
  name: z.string().min(2, 'Service name must be at least 2 characters'),
  description: z.string().optional(),
  duration: z.number().min(5, 'Duration must be at least 5 minutes').max(480),
  price: z.number().min(0, 'Price cannot be negative'),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ProviderServicesEditProps {
  providerId: string;
}

export function ProviderServicesEdit({ providerId }: ProviderServicesEditProps) {
  const { toast } = useToast();
  const utils = api.useUtils();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);

  const { data: services, isLoading } = api.providers.getMyServices.useQuery({ providerId });

  const createService = api.providers.createService.useMutation({
    onSuccess: () => {
      toast({ title: 'Service created successfully' });
      utils.providers.getMyServices.invalidate();
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Failed to create service',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateService = api.providers.updateService.useMutation({
    onSuccess: () => {
      toast({ title: 'Service updated successfully' });
      utils.providers.getMyServices.invalidate();
      setIsDialogOpen(false);
      setEditingService(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Failed to update service',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteService = api.providers.deleteService.useMutation({
    onSuccess: () => {
      toast({ title: 'Service deleted successfully' });
      utils.providers.getMyServices.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete service',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      duration: 30,
      price: 0,
    },
  });

  const onSubmit = async (data: ServiceFormValues) => {
    if (editingService) {
      await updateService.mutateAsync({
        serviceId: editingService.id,
        ...data,
      });
    } else {
      await createService.mutateAsync({
        providerId,
        ...data,
      });
    }
  };

  const handleEditService = (service: any) => {
    setEditingService(service);
    form.reset({
      name: service.name,
      description: service.description || '',
      duration: service.defaultDuration || service.duration || 30,
      price: service.defaultPrice || service.price || 0,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      await deleteService.mutateAsync({ serviceId });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Services Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Services Management</CardTitle>
              <CardDescription>Add or edit the services you offer to patients</CardDescription>
            </div>
            <Button
              onClick={() => {
                setEditingService(null);
                form.reset();
                setIsDialogOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Service
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {services && services.length > 0 ? (
            <div className="space-y-4">
              {services.map((service: any) => (
                <div
                  key={service.id}
                  className="flex items-start justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{service.name}</h4>
                    </div>
                    {service.description && (
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{service.defaultDuration || service.duration || 30} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">
                          R{service.defaultPrice || service.price || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditService(service)}
                      className="gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteService(service.id)}
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="mb-4 text-sm text-muted-foreground">No services added yet</p>
              <Button
                onClick={() => {
                  setEditingService(null);
                  form.reset();
                  setIsDialogOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Your First Service
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Service Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit' : 'Add'} Service</DialogTitle>
            <DialogDescription>
              {editingService
                ? 'Update the details of your service'
                : 'Add a new service that you offer to patients'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., General Consultation" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe what this service includes..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow empty string
                            if (value === '') {
                              field.onChange('');
                              return;
                            }
                            // Parse and update only if it's a valid number
                            const parsed = parseInt(value);
                            if (!isNaN(parsed) && parsed > 0) {
                              field.onChange(parsed);
                            }
                          }}
                          onBlur={() => {
                            // Set to 30 only when leaving the field if empty
                            if (!field.value || field.value === 0) {
                              field.onChange(30);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (R)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow empty string
                            if (value === '') {
                              field.onChange('');
                              return;
                            }
                            // Parse and update only if it's a valid number
                            const parsed = parseFloat(value);
                            if (!isNaN(parsed) && parsed >= 0) {
                              field.onChange(parsed);
                            }
                          }}
                          onBlur={() => {
                            // Set to 0 only when leaving the field if empty
                            if (!field.value && field.value !== 0) {
                              field.onChange(0);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createService.isPending || updateService.isPending}>
                  {createService.isPending || updateService.isPending
                    ? 'Saving...'
                    : editingService
                      ? 'Update Service'
                      : 'Add Service'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
