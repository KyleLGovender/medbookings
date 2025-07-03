'use client';

import { useState } from 'react';
import { EnhancedCalendarView } from './enhanced-calendar-view';
import { CalendarEvent } from './provider-calendar-view';
import { OrganizationProvider } from './organization-calendar-view';
import { CoverageGap } from '../lib/coverage-gap-analyzer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
// Note: Tabs component might need to be created if not available
// For now, we'll use a simple toggle approach
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Users, 
  User, 
  Filter, 
  Repeat,
  Settings,
  Clock,
  BarChart3,
  AlertTriangle
} from 'lucide-react';

export function EnhancedCalendarDemo() {
  const [calendarMode, setCalendarMode] = useState<'organization' | 'provider'>('organization');
  const [recentActions, setRecentActions] = useState<string[]>([]);
  const [demoSettings, setDemoSettings] = useState({
    showFilters: true,
    showCoverageGaps: true,
    enableRecurringPatterns: true,
    viewMode: 'week' as const,
  });

  const addAction = (action: string) => {
    setRecentActions(prev => [
      `${new Date().toLocaleTimeString()}: ${action}`,
      ...prev.slice(0, 4)
    ]);
  };

  const handleEventClick = (event: CalendarEvent, provider?: OrganizationProvider) => {
    const providerInfo = provider ? ` (${provider.name})` : '';
    addAction(`Clicked event: ${event.title}${providerInfo}`);
  };

  const handleProviderClick = (provider: OrganizationProvider) => {
    addAction(`Clicked provider: ${provider.name} - ${provider.type}`);
  };

  const handleTimeSlotClick = (date: Date, hour: number, provider?: OrganizationProvider) => {
    const timeString = `${date.toLocaleDateString()} at ${hour.toString().padStart(2, '0')}:00`;
    const providerInfo = provider ? ` for ${provider.name}` : '';
    addAction(`Clicked time slot: ${timeString}${providerInfo}`);
  };

  const handleCreateAvailability = (providerId?: string) => {
    const providerInfo = providerId ? ` for provider ${providerId}` : '';
    addAction(`Create availability clicked${providerInfo}`);
  };

  const handleManageProvider = (provider: OrganizationProvider) => {
    addAction(`Manage provider: ${provider.name}`);
  };

  const handleGapClick = (gap: CoverageGap) => {
    const timeString = `${gap.startTime.toLocaleDateString()} ${gap.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    addAction(`Clicked ${gap.severity} coverage gap: ${gap.type} at ${timeString}`);
  };

  const handleRecommendationClick = (recommendation: string) => {
    addAction(`Clicked recommendation: ${recommendation.substring(0, 50)}...`);
  };

  const getFeaturesList = (mode: 'organization' | 'provider') => {
    const commonFeatures = [
      'Advanced calendar navigation with date picker',
      'Multiple view modes (day, week, month, agenda)',
      'Real-time filtering and search capabilities',
      'Recurring pattern visualization and management',
      'Series-based navigation and grouping',
      'Interactive event management',
      'Quick navigation shortcuts',
      'Export and sharing functionality',
    ];

    const organizationFeatures = [
      'Multi-provider schedule overview',
      'Coverage gap identification and analysis',
      'Organization-level statistics and metrics',
      'Provider utilization tracking',
      'Bulk provider management',
      'Coverage heatmap visualization',
    ];

    const providerFeatures = [
      'Individual provider schedule management',
      'Personal availability tracking',
      'Booking confirmation workflow',
      'Individual utilization metrics',
      'Personal calendar integration',
    ];

    return {
      common: commonFeatures,
      specific: mode === 'organization' ? organizationFeatures : providerFeatures,
    };
  };

  const features = getFeaturesList(calendarMode);

  return (
    <div className="space-y-6">
      {/* Demo Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Enhanced Calendar with Navigation & Filtering Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-2">
              <Button
                variant={calendarMode === 'organization' ? 'default' : 'outline'}
                onClick={() => setCalendarMode('organization')}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Organization View
              </Button>
              <Button
                variant={calendarMode === 'provider' ? 'default' : 'outline'}
                onClick={() => setCalendarMode('provider')}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Provider View
              </Button>
            </div>

            {calendarMode === 'organization' && (
              <div className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Organization Calendar Features:
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {features.specific.map((feature, index) => (
                      <li key={index}>• {feature}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Key Capabilities:
                  </h4>
                  <div className="space-y-2">
                    <Badge variant="outline" className="mr-2">Multi-provider scheduling</Badge>
                    <Badge variant="outline" className="mr-2">Coverage gap analysis</Badge>
                    <Badge variant="outline" className="mr-2">Provider filtering</Badge>
                    <Badge variant="outline" className="mr-2">Utilization tracking</Badge>
                  </div>
                </div>
              </div>
              </div>
            )}

            {calendarMode === 'provider' && (
              <div className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Provider Calendar Features:
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {features.specific.map((feature, index) => (
                      <li key={index}>• {feature}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Key Capabilities:
                  </h4>
                  <div className="space-y-2">
                    <Badge variant="outline" className="mr-2">Personal scheduling</Badge>
                    <Badge variant="outline" className="mr-2">Availability management</Badge>
                    <Badge variant="outline" className="mr-2">Booking workflow</Badge>
                    <Badge variant="outline" className="mr-2">Calendar integration</Badge>
                  </div>
                </div>
              </div>
              </div>
            )}
          </div>

          {/* Common Features */}
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Common Advanced Features:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="text-sm text-muted-foreground space-y-1">
                {features.common.slice(0, 4).map((feature, index) => (
                  <li key={index}>• {feature}</li>
                ))}
              </ul>
              <ul className="text-sm text-muted-foreground space-y-1">
                {features.common.slice(4).map((feature, index) => (
                  <li key={index}>• {feature}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Demo Settings */}
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Demo Settings:
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-filters"
                  checked={demoSettings.showFilters}
                  onCheckedChange={(checked) => 
                    setDemoSettings(prev => ({ ...prev, showFilters: checked }))
                  }
                />
                <Label htmlFor="show-filters" className="text-sm">
                  Show Filters
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-coverage"
                  checked={demoSettings.showCoverageGaps}
                  onCheckedChange={(checked) => 
                    setDemoSettings(prev => ({ ...prev, showCoverageGaps: checked }))
                  }
                />
                <Label htmlFor="show-coverage" className="text-sm">
                  Coverage Gaps
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="recurring-patterns"
                  checked={demoSettings.enableRecurringPatterns}
                  onCheckedChange={(checked) => 
                    setDemoSettings(prev => ({ ...prev, enableRecurringPatterns: checked }))
                  }
                />
                <Label htmlFor="recurring-patterns" className="text-sm">
                  Recurring Patterns
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Calendar Component */}
      <EnhancedCalendarView
        mode={calendarMode}
        organizationId={calendarMode === 'organization' ? 'demo-org' : undefined}
        providerId={calendarMode === 'provider' ? 'demo-provider' : undefined}
        onEventClick={handleEventClick}
        onProviderClick={handleProviderClick}
        onTimeSlotClick={handleTimeSlotClick}
        onCreateAvailability={handleCreateAvailability}
        onManageProvider={handleManageProvider}
        onGapClick={handleGapClick}
        onRecommendationClick={handleRecommendationClick}
        initialViewMode={demoSettings.viewMode}
        showFilters={demoSettings.showFilters}
        showCoverageGaps={demoSettings.showCoverageGaps}
        enableRecurringPatterns={demoSettings.enableRecurringPatterns}
      />

      {/* Demo Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Feature Highlights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Advanced Filtering
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Provider type filtering</span>
                <Badge variant="secondary">Multi-select</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Availability status</span>
                <Badge variant="secondary">Active/Pending</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Recurring patterns</span>
                <Badge variant="secondary">Series-based</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Location-based</span>
                <Badge variant="secondary">Online/In-person</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Time range filtering</span>
                <Badge variant="secondary">Custom hours</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              Recurring Pattern Navigation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Series visualization</span>
                <Badge variant="secondary">Color-coded</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Occurrence tracking</span>
                <Badge variant="secondary">Count-based</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Series navigation</span>
                <Badge variant="secondary">Quick jump</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Pattern grouping</span>
                <Badge variant="secondary">Expandable</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Next occurrence</span>
                <Badge variant="secondary">Auto-navigate</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Actions Log */}
      {recentActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Interactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentActions.map((action, index) => (
                <Alert key={index} className="py-2">
                  <Clock className="h-3 w-3" />
                  <AlertDescription className="text-sm">
                    {action}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Example */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Enhanced Calendar Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-50 p-4 rounded overflow-x-auto">
{`import { EnhancedCalendarView } from './enhanced-calendar-view';

// Organization calendar with full features
<EnhancedCalendarView
  mode="organization"
  organizationId="my-org"
  showFilters={true}
  showCoverageGaps={true}
  enableRecurringPatterns={true}
  onEventClick={(event, provider) => handleEvent(event)}
  onGapClick={(gap) => handleGap(gap)}
/>

// Provider calendar with personal view
<EnhancedCalendarView
  mode="provider"
  providerId="my-provider"
  showFilters={true}
  enableRecurringPatterns={true}
  onEventClick={(event) => handleEvent(event)}
/>`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}