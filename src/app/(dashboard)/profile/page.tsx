import { QueryProvider } from '@/components/providers/query-provider';
import Section from '@/components/section';
import { ProfileClient } from '@/features/profile/components/profile-client';

export default function ProfilePage() {
  return (
    <Section className="bg-background py-16 dark:bg-background">
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-3xl font-bold tracking-tighter text-foreground dark:text-foreground">
          Your Profile
        </h1>
        <p className="text-xl text-muted-foreground dark:text-muted-foreground">
          Manage your personal information and service provider details
        </p>
      </div>
      <QueryProvider>
        <ProfileClient />
      </QueryProvider>
    </Section>
  );
}
