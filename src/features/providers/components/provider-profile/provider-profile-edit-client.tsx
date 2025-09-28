'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Languages } from '@prisma/client';
import { AlertCircle, ArrowLeft, Clock, Loader2, PauseCircle, Save, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentUserProvider } from '@/features/providers/hooks/use-current-user-provider';
import { useDeleteProvider } from '@/features/providers/hooks/use-provider-delete';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/utils/api';

import { ProviderBusinessSettings } from './provider-business-settings';
import { ProviderRequirementsEdit } from './provider-requirements-edit';
import { ProviderServicesEdit } from './provider-services-edit';

// Form schemas
const basicInfoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email('Invalid email address'),
  website: z.string().url('Invalid URL').or(z.literal('')).optional(),
  languages: z.array(z.nativeEnum(Languages)),
  showPrice: z.boolean(),
});

const reminderSettingsSchema = z.object({
  reminderEnabled: z.boolean(),
  reminderHours: z.number().min(1).max(72),
  reminderChannels: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    whatsapp: z.boolean(),
  }),
});

type BasicInfoFormValues = z.infer<typeof basicInfoSchema>;
type ReminderSettingsFormValues = z.infer<typeof reminderSettingsSchema>;

export function ProviderProfileEditClient() {
  const router = useRouter();
  const { toast } = useToast();
  const utils = api.useUtils();
  const { data: provider, isLoading, error } = useCurrentUserProvider();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSuspending, setIsSuspending] = useState(false);

  // Mutations
  const updateBasicInfo = api.providers.updateBasicInfo.useMutation({
    onSuccess: () => {
      toast({ title: 'Profile updated successfully' });
      utils.providers.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateReminderSettings = api.providers.updateReminderSettings.useMutation({
    onSuccess: () => {
      toast({ title: 'Reminder settings updated' });
      utils.providers.invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const suspendProvider = api.providers.suspend.useMutation({
    onSuccess: () => {
      // Invalidate relevant queries after suspending
      utils.providers.getByUserId.invalidate();
      utils.profile.invalidate();
      utils.settings.invalidate();

      toast({ title: 'Provider profile suspended' });
      router.push('/profile');
    },
    onError: (error) => {
      toast({
        title: 'Suspension failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteProvider = useDeleteProvider({
    onSuccess: () => {
      toast({ title: 'Provider profile deleted' });
      router.push('/profile');
    },
    onError: (error) => {
      toast({
        title: 'Deletion failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Forms
  const basicInfoForm = useForm<BasicInfoFormValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: provider?.name || '',
      bio: provider?.bio || '',
      phone: provider?.user?.phone || '',
      whatsapp: provider?.whatsapp === '+1234567890' ? '' : provider?.whatsapp || '',
      email:
        provider?.email === 'default@example.com'
          ? provider?.user?.email || ''
          : provider?.email || provider?.user?.email || '',
      website: provider?.website || '',
      languages: provider?.languages || [],
      showPrice: provider?.showPrice ?? true,
    },
  });

  const reminderForm = useForm<ReminderSettingsFormValues>({
    resolver: zodResolver(reminderSettingsSchema),
    defaultValues: {
      reminderEnabled: true,
      reminderHours: 24,
      reminderChannels: {
        email: true,
        sms: false,
        whatsapp: false,
      },
    },
  });

  // Update reminder form when provider data loads
  useEffect(() => {
    if (provider) {
      // Convert the array of channels back to the object format
      const channelsObject = {
        email: provider.reminderChannels?.includes('email') ?? true,
        sms: provider.reminderChannels?.includes('sms') ?? false,
        whatsapp: provider.reminderChannels?.includes('whatsapp') ?? false,
      };

      reminderForm.reset({
        reminderEnabled: provider.reminderEnabled ?? true,
        reminderHours: provider.reminderHours ?? 24,
        reminderChannels: channelsObject,
      });
    }
  }, [provider, reminderForm]);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="animate-pulse">
          <div className="mb-4 h-8 w-1/4 rounded bg-gray-200"></div>
          <div className="mb-8 h-4 w-1/2 rounded bg-gray-200"></div>
          <div className="h-64 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load provider profile. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const onBasicInfoSubmit = async (data: BasicInfoFormValues) => {
    await updateBasicInfo.mutateAsync({
      name: data.name,
      bio: data.bio || '',
      phone: data.phone || '',
      whatsapp: data.whatsapp || '',
      email: data.email,
      website: data.website || '',
      languages: data.languages,
      showPrice: data.showPrice,
    });
  };

  const onReminderSubmit = async (data: ReminderSettingsFormValues) => {
    await updateReminderSettings.mutateAsync(data);
  };

  const handleSuspend = async () => {
    setIsSuspending(true);
    await suspendProvider.mutateAsync({});
    setIsSuspending(false);
  };

  const handleDelete = async () => {
    if (!provider?.id) return;
    setIsDeleting(true);
    await deleteProvider.mutateAsync({ id: provider.id });
    setIsDeleting(false);
  };

  return (
    <div className="container mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-8">
        <Link href="/provider-profile">
          <Button variant="ghost" size="sm" className="mb-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Provider Profile</h1>
            <p className="mt-2 text-muted-foreground">
              Update your professional information and service details
            </p>
          </div>
          <div className="flex gap-2">
            {/* Suspend/Delete Actions */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <PauseCircle className="h-4 w-4" />
                  Suspend Profile
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Suspend Provider Profile?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will temporarily disable your provider profile. Patients won&apos;t be able
                    to book appointments with you. You can reactivate your profile at any time.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSuspend} disabled={isSuspending}>
                    {isSuspending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Suspending...
                      </>
                    ) : (
                      'Suspend Profile'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Profile
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Provider Profile?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your provider
                    profile, including all services, availability settings, and booking history.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>OK</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                      </>
                    ) : (
                      'Delete Profile'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="requirements">Regulatory</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="business">Settings</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update your professional details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...basicInfoForm}>
                <form
                  onSubmit={basicInfoForm.handleSubmit(onBasicInfoSubmit)}
                  className="space-y-6"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={basicInfoForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Professional Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Dr. John Smith" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={basicInfoForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Professional Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="doctor@example.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={basicInfoForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professional Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Describe your experience and expertise..."
                            rows={4}
                          />
                        </FormControl>
                        <FormDescription>
                          This will be displayed on your public profile
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={basicInfoForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} type="tel" placeholder="+27 12 345 6789" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={basicInfoForm.control}
                      name="whatsapp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp Number</FormLabel>
                          <FormControl>
                            <Input {...field} type="tel" placeholder="+27 12 345 6789" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={basicInfoForm.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input {...field} type="url" placeholder="https://example.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={basicInfoForm.control}
                    name="languages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Languages Spoken</FormLabel>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                          {Object.values(Languages).map((language) => (
                            <FormItem
                              key={language}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(language)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, language])
                                      : field.onChange(
                                          field.value?.filter((value) => value !== language)
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">{language}</FormLabel>
                            </FormItem>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={basicInfoForm.control}
                    name="showPrice"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Show Prices</FormLabel>
                          <FormDescription>
                            Display service prices on your public profile
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateBasicInfo.isPending}>
                      {updateBasicInfo.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" /> Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <ProviderServicesEdit providerId={provider?.id || ''} />
        </TabsContent>

        {/* Requirements Tab */}
        <TabsContent value="requirements" className="space-y-6">
          <ProviderRequirementsEdit providerId={provider?.id || ''} />
        </TabsContent>

        {/* Reminder Settings Tab */}
        <TabsContent value="reminders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Appointment Reminder Settings
              </CardTitle>
              <CardDescription>
                Configure how and when your patients receive appointment reminders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...reminderForm}>
                <form onSubmit={reminderForm.handleSubmit(onReminderSubmit)} className="space-y-6">
                  <FormField
                    control={reminderForm.control}
                    name="reminderEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Reminders</FormLabel>
                          <FormDescription>
                            Send automatic reminders to patients before appointments
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={reminderForm.control}
                    name="reminderHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reminder Timing</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select reminder timing" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">1 hour before</SelectItem>
                            <SelectItem value="2">2 hours before</SelectItem>
                            <SelectItem value="4">4 hours before</SelectItem>
                            <SelectItem value="12">12 hours before</SelectItem>
                            <SelectItem value="24">24 hours before</SelectItem>
                            <SelectItem value="48">48 hours before</SelectItem>
                            <SelectItem value="72">72 hours before</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How long before the appointment should reminders be sent
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <FormLabel>Reminder Channels</FormLabel>
                    <div className="space-y-2">
                      <FormField
                        control={reminderForm.control}
                        name="reminderChannels.email"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm">Email</FormLabel>
                              <FormDescription className="text-xs">
                                Send reminders via email
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={reminderForm.control}
                        name="reminderChannels.sms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm">SMS</FormLabel>
                              <FormDescription className="text-xs">
                                Send reminders via SMS (additional charges may apply)
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={reminderForm.control}
                        name="reminderChannels.whatsapp"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm">WhatsApp</FormLabel>
                              <FormDescription className="text-xs">
                                Send reminders via WhatsApp
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Reminder settings apply to all your services. Patients can opt out of
                      reminders in their communication preferences.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateReminderSettings.isPending}>
                      {updateReminderSettings.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" /> Save Reminder Settings
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Settings Tab */}
        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Settings</CardTitle>
              <CardDescription>
                Additional business preferences and display settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProviderBusinessSettings provider={provider} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
