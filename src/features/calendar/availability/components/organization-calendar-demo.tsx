'use client';

import { useState } from 'react';
import { OrganizationCalendarView, OrganizationProvider } from './organization-calendar-view';
import { CalendarEvent } from './provider-calendar-view';
import { CoverageGap } from '../lib/coverage-gap-analyzer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, AlertTriangle, Clock, Lightbulb } from 'lucide-react';

export function OrganizationCalendarDemo() {
  const [recentActions, setRecentActions] = useState<string[]>([]);
  const [showCoverageGaps, setShowCoverageGaps] = useState(true);

  const addAction = (action: string) => {
    setRecentActions(prev => [action, ...prev.slice(0, 4)]);
  };

  const handleProviderClick = (provider: OrganizationProvider) => {
    addAction(`Clicked provider: ${provider.name}`);
  };

  const handleEventClick = (event: CalendarEvent, provider: OrganizationProvider) => {
    addAction(`Clicked event: ${event.title} (${provider.name})`);
  };

  const handleTimeSlotClick = (date: Date, hour: number, provider: OrganizationProvider) => {
    const timeString = `${date.toLocaleDateString()} at ${hour.toString().padStart(2, '0')}:00`;
    addAction(`Clicked time slot: ${timeString} for ${provider.name}`);
  };

  const handleCreateAvailability = (providerId?: string) => {
    addAction(`Create availability ${providerId ? `for provider ${providerId}` : 'clicked'}`);
  };

  const handleManageProvider = (provider: OrganizationProvider) => {
    addAction(`Manage provider: ${provider.name}`);
  };

  const handleGapClick = (gap: CoverageGap) => {
    const timeString = `${gap.startTime.toLocaleDateString()} ${gap.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    addAction(`Clicked coverage gap: ${gap.type} at ${timeString} (${gap.severity} severity)`);
  };

  const handleRecommendationClick = (recommendation: string) => {
    addAction(`Clicked recommendation: ${recommendation.substring(0, 50)}...`);
  };

  return (
    <div className="space-y-6">
      {/* Demo Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Organization Calendar with Coverage Gap Analysis Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium mb-2">Calendar Features:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Multi-provider schedule view</li>
                <li>• Provider selection and filtering</li>
                <li>• Weekly, daily, and monthly views</li>
                <li>• Organization-level statistics</li>
                <li>• Provider utilization metrics</li>
                <li>• Interactive event management</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Coverage Gap Analysis:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Real-time gap identification</li>
                <li>• Severity-based prioritization</li>
                <li>• Hourly coverage heatmap</li>
                <li>• Actionable recommendations</li>
                <li>• Coverage trend analysis</li>
                <li>• Interactive gap exploration</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="coverage-gaps"
                checked={showCoverageGaps}
                onCheckedChange={setShowCoverageGaps}
              />
              <label htmlFor="coverage-gaps" className="text-sm font-medium">
                Show Coverage Gap Analysis
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Component */}
      <OrganizationCalendarView
        organizationId="demo-org"
        onProviderClick={handleProviderClick}
        onEventClick={handleEventClick}
        onTimeSlotClick={handleTimeSlotClick}
        onCreateAvailability={handleCreateAvailability}
        onManageProvider={handleManageProvider}
        onGapClick={handleGapClick}
        onRecommendationClick={handleRecommendationClick}
        viewMode="week"
        initialDate={new Date()}
        showCoverageGaps={showCoverageGaps}
      />

      {/* Demo Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Coverage Gap Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Coverage Gap Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm">No Coverage</span>
                </div>
                <Badge className="bg-red-100 text-red-800">Critical</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Insufficient Coverage</span>
                </div>
                <Badge className="bg-orange-100 text-orange-800">High</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Skill Gap</span>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Available Interactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>• Click on coverage gaps to view details</div>
              <div>• Click on recommendations for actions</div>
              <div>• Hover over heatmap for coverage info</div>
              <div>• Select/deselect providers to filter</div>
              <div>• Click on events for management options</div>
              <div>• Use time slots to create availability</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Actions */}
      {recentActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Actions</CardTitle>
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
          <CardTitle className="text-sm">Usage Example</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-50 p-4 rounded overflow-x-auto">
{`import { OrganizationCalendarView } from './organization-calendar-view';

<OrganizationCalendarView
  organizationId="my-org"
  onProviderClick={(provider) => console.log('Provider:', provider)}
  onEventClick={(event, provider) => console.log('Event:', event)}
  onGapClick={(gap) => console.log('Coverage gap:', gap)}
  onRecommendationClick={(rec) => console.log('Recommendation:', rec)}
  viewMode="week"
  showCoverageGaps={true}
/>`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}