'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface MeetSettingsFormProps {
  initialSettings: {
    requireAuthentication: boolean;
    allowExternalGuests: boolean;
    defaultConferenceSolution: string;
  };
}

export function MeetSettingsForm({ initialSettings }: MeetSettingsFormProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/google/meet-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to update settings');

      toast({
        title: 'Success',
        description: 'Meet settings updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update meet settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <label>Require authentication to join</label>
        <Switch
          checked={settings.requireAuthentication}
          onCheckedChange={(checked) =>
            setSettings({ ...settings, requireAuthentication: checked })
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <label>Allow external guests</label>
        <Switch
          checked={settings.allowExternalGuests}
          onCheckedChange={(checked) => setSettings({ ...settings, allowExternalGuests: checked })}
        />
      </div>

      <div className="space-y-2">
        <label>Conference solution</label>
        <Select
          value={settings.defaultConferenceSolution}
          onValueChange={(value) => setSettings({ ...settings, defaultConferenceSolution: value })}
        >
          <option value="google_meet">Google Meet</option>
        </Select>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Settings'}
      </Button>
    </form>
  );
}
