import { QueryProvider } from '@/components/providers/query-provider';
import Section from '@/components/section';
import { EditProfileForm } from '@/features/profile/components/edit-profile-form';

export default function EditProfilePage() {
  return (
    <Section className="bg-background py-16 dark:bg-background">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-3xl font-bold tracking-tighter text-foreground dark:text-foreground">
          Edit Profile
        </h1>
        <p className="text-xl text-muted-foreground dark:text-muted-foreground">
          Update your personal information
        </p>
      </div>
      <QueryProvider>
        <EditProfileForm />
      </QueryProvider>
    </Section>
  );
}
