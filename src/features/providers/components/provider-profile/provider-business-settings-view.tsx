'use client';

import { CheckCircle2, Globe, Languages as LanguagesIcon, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { type RouterOutputs } from '@/utils/api';

// Type extraction for provider data
type ProviderData = RouterOutputs['providers']['getByUserId'];

interface ProviderBusinessSettingsViewProps {
  provider: NonNullable<ProviderData>;
}

export function ProviderBusinessSettingsView({ provider }: ProviderBusinessSettingsViewProps) {
  return (
    <div className="space-y-6">
      {/* Provider status indicator */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Provider Status:</span>
        <Badge variant={provider.status === 'ACTIVE' ? 'default' : 'secondary'}>
          {provider.status}
        </Badge>
      </div>

      <Separator />

      {/* Business Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Business Information</h3>

        {/* Professional Bio */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Professional Bio</label>
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-sm">
              {provider.bio || (
                <span className="italic text-muted-foreground">No bio added yet</span>
              )}
            </p>
          </div>
        </div>

        {/* Website */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Website</label>
          <div className="rounded-lg border bg-muted/50 p-3">
            {provider.website ? (
              <a
                href={provider.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Globe className="h-4 w-4" />
                {provider.website}
              </a>
            ) : (
              <span className="text-sm italic text-muted-foreground">No website added</span>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Languages */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-medium">
          <LanguagesIcon className="h-5 w-5" />
          Languages Spoken
        </h3>
        <div className="rounded-lg border bg-muted/50 p-3">
          {provider.languages && provider.languages.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {provider.languages.map((language) => (
                <Badge key={language} variant="secondary">
                  {language}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-sm italic text-muted-foreground">No languages specified</span>
          )}
        </div>
      </div>

      <Separator />

      {/* Display Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Display Settings</h3>

        <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Display prices to patients</p>
            <p className="text-xs text-muted-foreground">
              Service prices are {provider.showPrice ? 'visible' : 'hidden'} on your public profile
            </p>
          </div>
          <div>
            {provider.showPrice ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {/* Helper text */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> To update your business settings, click the Edit Profile button
          above.
        </p>
      </div>
    </div>
  );
}
