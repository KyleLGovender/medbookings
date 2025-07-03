'use client';

import { useState } from 'react';
import { ProviderCalendarView, CalendarEvent } from './provider-calendar-view';
import { CalendarEventDialog } from './calendar-event-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, Plus } from 'lucide-react';

export function ProviderCalendarDemo() {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [recentActions, setRecentActions] = useState<string[]>([]);

  const addAction = (action: string) => {
    setRecentActions(prev => [action, ...prev.slice(0, 4)]);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
    addAction(`Clicked on: ${event.title}`);
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    const timeString = `${date.toLocaleDateString()} at ${hour.toString().padStart(2, '0')}:00`;
    addAction(`Clicked time slot: ${timeString}`);
  };

  const handleCreateAvailability = () => {
    addAction('Create availability clicked');
  };

  const handleEditEvent = (event: CalendarEvent) => {
    addAction(`Edit event: ${event.title}`);
    setIsEventDialogOpen(false);
  };

  const handleDeleteEvent = (event: CalendarEvent) => {
    addAction(`Delete event: ${event.title}`);
    setIsEventDialogOpen(false);
  };

  const handleDuplicateEvent = (event: CalendarEvent) => {
    addAction(`Duplicate event: ${event.title}`);
    setIsEventDialogOpen(false);
  };

  const handleConfirmBooking = async (event: CalendarEvent) => {
    addAction(`Confirmed booking: ${event.title}`);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleCancelBooking = (event: CalendarEvent) => {
    addAction(`Cancelled booking: ${event.title}`);
    setIsEventDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Demo Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Provider Calendar View Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Features Demonstrated:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Weekly, daily, and monthly calendar views</li>
                <li>• Provider availability blocks</li>
                <li>• Confirmed and pending bookings</li>
                <li>• Blocked time periods</li>
                <li>• Interactive event details</li>
                <li>• Working hours visualization</li>
                <li>• Utilization statistics</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Interactions:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Click on events to view details</li>
                <li>• Click on empty time slots</li>
                <li>• Switch between view modes</li>
                <li>• Navigate between dates</li>
                <li>• Manage bookings and availability</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Component */}
      <ProviderCalendarView
        providerId="provider-123"
        onEventClick={handleEventClick}
        onTimeSlotClick={handleTimeSlotClick}
        onCreateAvailability={handleCreateAvailability}
        onEditEvent={handleEditEvent}
        viewMode="week"
        initialDate={new Date()}
      />

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

      {/* Event Details Dialog */}
      <CalendarEventDialog
        event={selectedEvent}
        isOpen={isEventDialogOpen}
        onClose={() => setIsEventDialogOpen(false)}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        onDuplicate={handleDuplicateEvent}
        onConfirmBooking={handleConfirmBooking}
        onCancelBooking={handleCancelBooking}
      />

      {/* Usage Example */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Usage Example</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-50 p-4 rounded overflow-x-auto">
{`import { ProviderCalendarView } from './provider-calendar-view';

<ProviderCalendarView
  providerId="provider-123"
  onEventClick={(event) => console.log('Event clicked:', event)}
  onTimeSlotClick={(date, hour) => console.log('Time slot:', date, hour)}
  onCreateAvailability={() => console.log('Create availability')}
  viewMode="week"
  initialDate={new Date()}
/>`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}