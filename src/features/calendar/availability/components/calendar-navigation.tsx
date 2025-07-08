'use client';

import { useState } from 'react';

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  Repeat,
  RotateCcw,
  Settings,
  Share,
} from 'lucide-react';

// Note: These components might need to be created if not available
// import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
// import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

export type CalendarViewMode = 'day' | 'week' | 'month' | 'agenda';

export interface RecurringPatternView {
  showAllOccurrences: boolean;
  highlightSeries: boolean;
  groupBySeries: boolean;
  showSeriesNavigator: boolean;
  expandSeries: string[]; // series IDs to expand
}

export interface CalendarNavigationProps {
  currentDate: Date;
  viewMode: CalendarViewMode;
  onDateChange: (date: Date) => void;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onTodayClick: () => void;

  // Recurring pattern controls
  recurringView: RecurringPatternView;
  onRecurringViewChange: (view: RecurringPatternView) => void;

  // Series navigation
  activeSeries?: Array<{
    id: string;
    title: string;
    color: string;
    occurrenceCount: number;
    nextOccurrence?: Date;
  }>;
  onSeriesSelect?: (seriesId: string) => void;

  // Actions
  onExport?: () => void;
  onShare?: () => void;
  onSettings?: () => void;

  // Quick navigation presets
  showQuickNav?: boolean;
  quickNavOptions?: Array<{
    label: string;
    date: Date;
    badge?: string;
  }>;

  className?: string;
}

export function CalendarNavigation({
  currentDate,
  viewMode,
  onDateChange,
  onViewModeChange,
  onTodayClick,
  recurringView,
  onRecurringViewChange,
  activeSeries = [],
  onSeriesSelect,
  onExport,
  onShare,
  onSettings,
  showQuickNav = true,
  quickNavOptions = [],
  className = '',
}: CalendarNavigationProps) {
  const [showRecurringSettings, setShowRecurringSettings] = useState(false);

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);

    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'agenda':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
    }

    onDateChange(newDate);
  };

  const getViewTitle = (): string => {
    switch (viewMode) {
      case 'day':
        return currentDate.toLocaleDateString([], {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      case 'week':
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${startOfWeek.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'month':
        return currentDate.toLocaleDateString([], { year: 'numeric', month: 'long' });
      case 'agenda':
        const agendaEnd = new Date(currentDate);
        agendaEnd.setDate(agendaEnd.getDate() + 13); // 2 weeks
        return `${currentDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${agendaEnd.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
  };

  const updateRecurringView = (updates: Partial<RecurringPatternView>) => {
    onRecurringViewChange({ ...recurringView, ...updates });
  };

  const getDefaultQuickNavOptions = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    return [
      { label: 'Today', date: today, badge: undefined },
      { label: 'Tomorrow', date: tomorrow, badge: undefined },
      { label: 'Next Week', date: nextWeek, badge: undefined },
      { label: 'Next Month', date: nextMonth, badge: undefined },
    ];
  };

  const displayQuickNavOptions =
    quickNavOptions.length > 0 ? quickNavOptions : getDefaultQuickNavOptions();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Navigation */}
      <div className="flex items-center justify-between">
        {/* Date Navigation */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              className="min-w-[200px] justify-center"
              onClick={() => {
                // For now, just open a simple date input
                const dateStr = prompt(
                  'Enter date (YYYY-MM-DD):',
                  currentDate.toISOString().split('T')[0]
                );
                if (dateStr) {
                  const newDate = new Date(dateStr);
                  if (!isNaN(newDate.getTime())) {
                    onDateChange(newDate);
                  }
                }
              }}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {getViewTitle()}
            </Button>

            <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={onTodayClick}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Today
          </Button>
        </div>

        {/* View Controls */}
        <div className="flex items-center space-x-2">
          <Select
            value={viewMode}
            onValueChange={(value: CalendarViewMode) => onViewModeChange(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="agenda">Agenda</SelectItem>
            </SelectContent>
          </Select>

          {/* Recurring Pattern Controls */}
          <Button
            variant="outline"
            size="sm"
            className="relative"
            onClick={() => setShowRecurringSettings(!showRecurringSettings)}
          >
            <Repeat className="mr-2 h-4 w-4" />
            Series
            {recurringView.highlightSeries && (
              <Badge variant="secondary" className="ml-2 h-4 w-4 rounded-full px-1 py-0 text-xs">
                •
              </Badge>
            )}
          </Button>

          {/* Action Buttons */}
          {onSettings && (
            <Button variant="outline" size="sm" onClick={onSettings}>
              <Settings className="h-4 w-4" />
            </Button>
          )}

          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4" />
            </Button>
          )}

          {onShare && (
            <Button variant="outline" size="sm" onClick={onShare}>
              <Share className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Recurring Pattern Settings */}
      {showRecurringSettings && (
        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Recurring Pattern View</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-all-occurrences" className="text-sm">
                  Show all occurrences
                </Label>
                <Switch
                  id="show-all-occurrences"
                  checked={recurringView.showAllOccurrences}
                  onCheckedChange={(checked) =>
                    updateRecurringView({ showAllOccurrences: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="highlight-series" className="text-sm">
                  Highlight series
                </Label>
                <Switch
                  id="highlight-series"
                  checked={recurringView.highlightSeries}
                  onCheckedChange={(checked) => updateRecurringView({ highlightSeries: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="group-by-series" className="text-sm">
                  Group by series
                </Label>
                <Switch
                  id="group-by-series"
                  checked={recurringView.groupBySeries}
                  onCheckedChange={(checked) => updateRecurringView({ groupBySeries: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-navigator" className="text-sm">
                  Series navigator
                </Label>
                <Switch
                  id="show-navigator"
                  checked={recurringView.showSeriesNavigator}
                  onCheckedChange={(checked) =>
                    updateRecurringView({ showSeriesNavigator: checked })
                  }
                />
              </div>
            </div>

            {activeSeries.length > 0 && (
              <>
                <Separator />
                <div>
                  <Label className="text-sm font-medium">Active Series</Label>
                  <div className="mt-2 grid max-h-32 grid-cols-2 gap-2 overflow-y-auto">
                    {activeSeries.map((series) => (
                      <div
                        key={series.id}
                        className="flex cursor-pointer items-center justify-between rounded border p-2 hover:bg-gray-50"
                        onClick={() => onSeriesSelect?.(series.id)}
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: series.color }}
                          />
                          <div>
                            <div className="truncate text-sm font-medium">{series.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {series.occurrenceCount} occurrences
                            </div>
                          </div>
                        </div>
                        {recurringView.expandSeries.includes(series.id) ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Navigation */}
      {showQuickNav && displayQuickNavOptions.length > 0 && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Quick jump:</span>
          {displayQuickNavOptions.map((option, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={() => onDateChange(option.date)}
              className="h-8"
            >
              {option.label}
              {option.badge && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {option.badge}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      )}

      {/* Series Navigator */}
      {recurringView.showSeriesNavigator && activeSeries.length > 0 && (
        <div className="rounded-lg border bg-gray-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Series Navigator</span>
            <Badge variant="secondary">{activeSeries.length} active</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeSeries.map((series) => (
              <Button
                key={series.id}
                variant="outline"
                size="sm"
                onClick={() => {
                  onSeriesSelect?.(series.id);
                  if (series.nextOccurrence) {
                    onDateChange(series.nextOccurrence);
                  }
                }}
                className="h-8 text-xs"
              >
                <div
                  className="mr-2 h-2 w-2 rounded-full"
                  style={{ backgroundColor: series.color }}
                />
                {series.title}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {series.occurrenceCount}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
