import { QueryProvider } from '@/components/providers/query-provider';
import { ProfileClientPage } from '@/features/profile/components/profile-client-page';

export default function ProfilePage() {
  return (
    <>
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-3xl font-bold tracking-tighter text-foreground dark:text-foreground">
          Your Profile
        </h1>
        <p className="text-xl text-muted-foreground dark:text-muted-foreground">
          Manage your personal information and service provider details
        </p>
      </div>
      <QueryProvider>
        <ProfileClientPage />
      </QueryProvider>
    </>
  );
}
