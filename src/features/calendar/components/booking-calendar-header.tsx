'use client';

import React from 'react';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarHeaderProps, CalendarViewMode } from '@/features/calendar/types/booking-types';

export function BookingCalendarHeader({
  currentDate,
  viewMode,
  onDateChange,
  onViewModeChange,
  onNavigate,
}: CalendarHeaderProps) {
  const formatDateRange = () => {
    const endDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        return currentDate.toLocaleDateString('en-US', { 
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case '3-day':
        endDate.setDate(endDate.getDate() + 2);
        break;
      case 'week':
        endDate.setDate(endDate.getDate() + 6);
        break;
    }
    
    if (viewMode !== 'day') {
      const startStr = currentDate.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric'
      });
      const endStr = endDate.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      return `${startStr} - ${endStr}`;
    }
    
    return '';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          {/* Date Navigation */}
          <div className="flex items-center justify-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => onNavigate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-3">
              <DatePicker
                date={currentDate}
                onChange={(date) => date && onDateChange(date)}
              />
              <div className="hidden sm:block">
                <span className="text-sm font-medium text-muted-foreground">
                  {formatDateRange()}
                </span>
              </div>
            </div>
            
            <Button variant="outline" size="sm" onClick={() => onNavigate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Controls */}
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-3 sm:space-y-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onDateChange(new Date())}
              className="w-full sm:w-auto"
            >
              Today
            </Button>
            
            <Select
              value={viewMode}
              onValueChange={(value: CalendarViewMode) => onViewModeChange(value)}
            >
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="3-day">3 Days</SelectItem>
                <SelectItem value="week">Week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}