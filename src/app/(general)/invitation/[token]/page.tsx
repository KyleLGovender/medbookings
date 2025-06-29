import { Suspense } from 'react';

import { InvitationPageContent } from '@/features/invitations/components/invitation-page-content';

interface InvitationPageProps {
  params: {
    token: string;
  };
}

export default function InvitationPage({ params }: InvitationPageProps) {
  return (
    <Suspense fallback={<div>Loading invitation...</div>}>
      <InvitationPageContent token={params.token} />
    </Suspense>
  );
}
