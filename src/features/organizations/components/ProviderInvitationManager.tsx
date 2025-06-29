'use client';

import { useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { ProviderInvitationForm } from './ProviderInvitationForm';
import { ProviderInvitationList } from './ProviderInvitationList';

interface ProviderInvitationManagerProps {
  organizationId: string;
}

export function ProviderInvitationManager({ organizationId }: ProviderInvitationManagerProps) {
  const [activeTab, setActiveTab] = useState<string>('invitations');

  const handleInvitationSuccess = () => {
    // Switch to invitations tab to show the newly sent invitation
    setActiveTab('invitations');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Provider Network</h2>
        <p className="text-muted-foreground">
          Invite healthcare providers to join your organization and manage existing connections.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="invite">Send Invitation</TabsTrigger>
        </TabsList>

        <TabsContent value="invitations" className="space-y-6">
          <ProviderInvitationList organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="invite" className="space-y-6">
          <ProviderInvitationForm 
            organizationId={organizationId} 
            onSuccess={handleInvitationSuccess}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}