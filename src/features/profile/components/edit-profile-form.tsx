'use client';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { useProfile, useUpdateProfile } from '@/features/profile/hooks/use-profile';
import { toast } from '@/hooks/use-toast';

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function EditProfileForm() {
  const router = useRouter();
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profile?.name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      whatsapp: profile?.whatsapp || '',
    },
    values: {
      name: profile?.name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      whatsapp: profile?.whatsapp || '',
    },
    mode: 'onChange',
  });

  async function onSubmit(data: ProfileFormValues) {
    try {
      const result = await updateProfileMutation.mutateAsync(data);

      if (result.success) {
        toast({
          title: 'Profile updated',
          description: 'Your profile has been updated successfully.',
        });
        router.push('/profile');
        router.refresh();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to update profile. Please try again.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    }
  }

  if (isProfileLoading) {
    return (
      <Card className="mx-auto max-w-lg border-border bg-card dark:border-border dark:bg-card">
        <CardContent className="pt-6">
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg border-border bg-card dark:border-border dark:bg-card">
      <CardHeader>
        <CardTitle className="text-foreground dark:text-foreground">Edit Profile</CardTitle>
        <CardDescription className="text-muted-foreground dark:text-muted-foreground">
          Update your personal information
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground dark:text-foreground">Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground dark:text-foreground">Email</FormLabel>
                  <FormControl>
                    <Input placeholder="your.email@example.com" {...field} />
                  </FormControl>
                  <FormDescription className="text-muted-foreground dark:text-muted-foreground">
                    This email is connected to your Google account.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground dark:text-foreground">
                    Phone Number
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="+27 12 345 6789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground dark:text-foreground">
                    WhatsApp Number
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="+27 12 345 6789" {...field} />
                  </FormControl>
                  <FormDescription className="text-muted-foreground dark:text-muted-foreground">
                    Used for WhatsApp notifications if enabled
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push('/profile')}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
