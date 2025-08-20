'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { BarChart, Calendar, Download, Plus, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { CalendarExportDialog } from '@/features/calendar/availability/components/calendar-export-dialog';
import { AvailabilityProposalsList } from '@/features/calendar/components/availability/availability-proposals-list';
// import { ProviderSearchInterface } from '@/features/calendar/availability/components/provider-search-interface';
// import { DragDropCalendar } from '@/features/calendar/availability/components/drag-drop-calendar';
// import { EnhancedCalendarView } from '@/features/calendar/availability/components/enhanced-calendar-view';
// Import our comprehensive availability management components
import { ProviderCalendarView } from '@/features/calendar/components/provider-calendar-view';

// import { VisualIndicatorsConfig } from '@/features/calendar/availability/components/visual-indicators-config';

// Mock data types - these would typically come from props or API
interface ProviderCalendarProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export function ProviderCalendar() {
  const [activeTab, setActiveTab] = useState('calendar');
  const router = useRouter();
  // const [showExportDialog, setShowExportDialog] = useState(false);
  const currentDate = new Date();
  const viewMode = 'week';

  // Mock configurations - these would come from user preferences/settings
  // const [dragDropConfig, setDragDropConfig] = useState({
  //   enableMove: true,
  //   enableCopy: false,
  //   enableResize: true,
  //   enableSeriesOperations: true,
  //   showConflicts: true,
  //   autoSave: false,
  //   snapToGrid: true,
  //   gridIntervalMinutes: 15,
  // });

  // const [visualConfig, setVisualConfig] = useState({
  //   showStatusIndicators: true,
  //   showSchedulingRuleIcons: true,
  //   showRecurringPatternBadges: true,
  //   showLocationIcons: true,
  //   showDurationBadges: false,
  //   showPriorityIndicators: false,
  //   compactMode: false,
  // });

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => router.push(`/availability/create?returnUrl=${encodeURIComponent(window.location.pathname)}`)} 
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Availability
          </Button>
          <Button
            variant="outline"
            onClick={() => console.log('Export calendar functionality disabled')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Calendar
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          {/* <VisualIndicatorsConfig
            config={visualConfig}
            onConfigChange={setVisualConfig}
            showPreview={false}
          /> */}
        </div>
      </div>

      {/* Main Calendar Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="enhanced" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Enhanced View
          </TabsTrigger>
          <TabsTrigger value="drag-drop" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Drag & Drop
          </TabsTrigger>
          <TabsTrigger value="proposals" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Proposals
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Search
          </TabsTrigger>
        </TabsList>

        {/* Standard Calendar View */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Provider Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProviderCalendarView
                providerId="current-provider" // This would come from auth context
                viewMode={viewMode}
                initialDate={currentDate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Calendar with Filters and Navigation */}
        <TabsContent value="enhanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Enhanced Calendar View
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* <EnhancedCalendarView
                mode="provider"
                providerId="current-provider" // This would come from auth context
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              /> */}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Drag and Drop Calendar */}
        <TabsContent value="drag-drop" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Interactive Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* <DragDropCalendar
                events={[]} // This would be loaded from API
                onEventUpdate={(eventId, updates) => {
                  console.log('Update event:', eventId, updates);
                }}
                onSeriesUpdate={(seriesId, updates, options) => {
                  console.log('Update series:', seriesId, updates, options);
                }}
                config={dragDropConfig}
                visualConfig={visualConfig}
                viewMode={viewMode}
                currentDate={currentDate}
              /> */}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Availability Proposals */}
        <TabsContent value="proposals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Availability Proposals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AvailabilityProposalsList
                providerId="current-provider" // This would come from auth context
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Provider Search (for testing/demo) */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Provider Search (Demo)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-gray-500">
                Provider search interface temporarily disabled during development.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>


      {/* Export Dialog - Functionality disabled due to missing component */}
    </div>
  );
}
