'use client';

import { useState } from 'react';

import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Database,
  Download,
  FileImage,
  FileText,
  Filter,
  Loader,
  Settings,
} from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
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

import { CalendarEvent } from '../types/client';
import {
  ExportConfig,
  ExportResult,
  GoogleCalendarIntegration,
  getDefaultExportConfig,
} from '../types/export';
import { OrganizationProvider } from './organization-calendar-view';

interface CalendarExportDialogProps {
  events: CalendarEvent[];
  providers?: OrganizationProvider[];
  isOpen: boolean;
  onClose: () => void;
  onExportComplete?: (result: ExportResult) => void;
  googleIntegration?: GoogleCalendarIntegration;
  className?: string;
}

export function CalendarExportDialog({
  events,
  providers = [],
  isOpen,
  onClose,
  onExportComplete,
  googleIntegration,
  className = '',
}: CalendarExportDialogProps) {
  const [config, setConfig] = useState<ExportConfig>(getDefaultExportConfig());
  const [isExporting, setIsExporting] = useState(false);
  const [lastExportResult, setLastExportResult] = useState<ExportResult | null>(null);
  const [activeTab, setActiveTab] = useState<'format' | 'fields' | 'filters' | 'settings'>(
    'format'
  );

  const updateConfig = (updates: Partial<ExportConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const updateIncludeFields = (field: keyof ExportConfig['includeFields'], value: boolean) => {
    setConfig((prev) => ({
      ...prev,
      includeFields: { ...prev.includeFields, [field]: value },
    }));
  };

  const updateFilters = (filterType: keyof ExportConfig['filters'], value: any) => {
    setConfig((prev) => ({
      ...prev,
      filters: { ...prev.filters, [filterType]: value },
    }));
  };

  const updateCustomization = (field: keyof ExportConfig['customization'], value: any) => {
    setConfig((prev) => ({
      ...prev,
      customization: { ...prev.customization, [field]: value },
    }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/calendar/availability/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events,
          providers,
          config,
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const result: ExportResult = await response.json();
      setLastExportResult(result);

      if (result.success && result.downloadUrl) {
        // Trigger download
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up URL
        URL.revokeObjectURL(result.downloadUrl);
      }

      onExportComplete?.(result);
    } catch (error) {
      console.error('Export failed:', error);
      setLastExportResult({
        success: false,
        format: config.format,
        filename: '',
        eventCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        metadata: {
          exportedAt: new Date(),
          timezone: config.customization.timezone,
          totalEvents: events.length,
          filteredEvents: 0,
        },
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'ical':
        return <Calendar className="h-4 w-4" />;
      case 'csv':
        return <FileText className="h-4 w-4" />;
      case 'json':
        return <Database className="h-4 w-4" />;
      case 'pdf':
        return <FileImage className="h-4 w-4" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'ical':
        return 'Standard calendar format, compatible with most calendar applications';
      case 'csv':
        return 'Spreadsheet format, suitable for data analysis and reporting';
      case 'json':
        return 'Structured data format, ideal for system integration';
      case 'pdf':
        return 'Printable document format for sharing and archiving';
      default:
        return '';
    }
  };

  const getFilteredEventCount = () => {
    return events.filter((event) => {
      // Apply the same filtering logic as the export service
      if (event.startTime < config.dateRange.start || event.startTime > config.dateRange.end) {
        return false;
      }
      if (config.filters.eventTypes.length > 0 && !config.filters.eventTypes.includes(event.type)) {
        return false;
      }
      if (
        config.filters.statuses.length > 0 &&
        !config.filters.statuses.includes(event.status as string)
      ) {
        return false;
      }
      return true;
    }).length;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className={`max-h-[90vh] w-full max-w-4xl overflow-hidden ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Calendar
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {getFilteredEventCount()} of {events.length} events
              </Badge>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="overflow-y-auto">
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex space-x-1 rounded bg-gray-100 p-1">
              {[
                { id: 'format', label: 'Format', icon: Download },
                { id: 'fields', label: 'Fields', icon: CheckCircle },
                { id: 'filters', label: 'Filters', icon: Filter },
                { id: 'settings', label: 'Settings', icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab(tab.id as any)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </Button>
                );
              })}
            </div>

            {/* Format Selection */}
            {activeTab === 'format' && (
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Export Format</Label>
                  <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {['ical', 'csv', 'json', 'pdf'].map((format) => (
                      <div
                        key={format}
                        className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${config.format === format ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'} `}
                        onClick={() => updateConfig({ format: format as any })}
                      >
                        <div className="flex items-center space-x-3">
                          {getFormatIcon(format)}
                          <div>
                            <div className="font-medium">.{format.toUpperCase()}</div>
                            <div className="text-sm text-muted-foreground">
                              {getFormatDescription(format)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <Label className="text-base font-medium">Date Range</Label>
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Start Date</Label>
                      <Input
                        type="date"
                        value={config.dateRange.start.toISOString().split('T')[0]}
                        onChange={(e) =>
                          updateConfig({
                            dateRange: { ...config.dateRange, start: new Date(e.target.value) },
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">End Date</Label>
                      <Input
                        type="date"
                        value={config.dateRange.end.toISOString().split('T')[0]}
                        onChange={(e) =>
                          updateConfig({
                            dateRange: { ...config.dateRange, end: new Date(e.target.value) },
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Fields Selection */}
            {activeTab === 'fields' && (
              <div className="space-y-4">
                <Label className="text-base font-medium">Include Fields</Label>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {Object.entries(config.includeFields).map(([field, enabled]) => (
                    <div key={field} className="flex items-center justify-between">
                      <Label htmlFor={field} className="text-sm">
                        {field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                      </Label>
                      <Switch
                        id={field}
                        checked={enabled}
                        onCheckedChange={(checked) => updateIncludeFields(field as any, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters */}
            {activeTab === 'filters' && (
              <div className="space-y-4">
                <Label className="text-base font-medium">Filter Events</Label>

                {/* Event Types */}
                <div>
                  <Label className="text-sm font-medium">Event Types</Label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {['availability', 'booking', 'blocked'].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type}`}
                          checked={config.filters.eventTypes.includes(type as any)}
                          onCheckedChange={(checked) => {
                            const newTypes = checked
                              ? [...config.filters.eventTypes, type as any]
                              : config.filters.eventTypes.filter((t) => t !== type);
                            updateFilters('eventTypes', newTypes);
                          }}
                        />
                        <Label htmlFor={`type-${type}`} className="text-sm">
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Providers */}
                {providers.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Providers</Label>
                    <Select
                      value=""
                      onValueChange={(providerId) => {
                        if (providerId) {
                          const newProviders = config.filters.providers.includes(providerId)
                            ? config.filters.providers.filter((p) => p !== providerId)
                            : [...config.filters.providers, providerId];
                          updateFilters('providers', newProviders);
                        }
                      }}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select providers to include..." />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.name} - {provider.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {config.filters.providers.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {config.filters.providers.map((providerId) => {
                          const provider = providers.find((p) => p.id === providerId);
                          return provider ? (
                            <Badge
                              key={providerId}
                              variant="secondary"
                              className="cursor-pointer"
                              onClick={() => {
                                const newProviders = config.filters.providers.filter(
                                  (p) => p !== providerId
                                );
                                updateFilters('providers', newProviders);
                              }}
                            >
                              {provider.name} ×
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Settings */}
            {activeTab === 'settings' && (
              <div className="space-y-4">
                <Label className="text-base font-medium">Export Settings</Label>

                {/* Timezone */}
                <div>
                  <Label className="text-sm font-medium">Timezone</Label>
                  <Select
                    value={config.customization.timezone}
                    onValueChange={(timezone) => updateCustomization('timezone', timezone)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Time Format */}
                <div>
                  <Label className="text-sm font-medium">Time Format</Label>
                  <div className="mt-2 flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="12h"
                        name="timeFormat"
                        checked={config.customization.timeFormat === '12h'}
                        onChange={() => updateCustomization('timeFormat', '12h')}
                      />
                      <Label htmlFor="12h" className="text-sm">
                        12-hour (AM/PM)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="24h"
                        name="timeFormat"
                        checked={config.customization.timeFormat === '24h'}
                        onChange={() => updateCustomization('timeFormat', '24h')}
                      />
                      <Label htmlFor="24h" className="text-sm">
                        24-hour
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Privacy Options */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Privacy Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="include-private" className="text-sm">
                        Include private events
                      </Label>
                      <Switch
                        id="include-private"
                        checked={config.customization.includePrivateEvents}
                        onCheckedChange={(checked) =>
                          updateCustomization('includePrivateEvents', checked)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="anonymize-customer" className="text-sm">
                        Anonymize customer data
                      </Label>
                      <Switch
                        id="anonymize-customer"
                        checked={config.customization.anonymizeCustomerData}
                        onCheckedChange={(checked) =>
                          updateCustomization('anonymizeCustomerData', checked)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Google Calendar Integration */}
            {googleIntegration?.enabled && (
              <>
                <Separator />
                <div className="space-y-4">
                  <Label className="text-base font-medium">Google Calendar Integration</Label>
                  <Alert>
                    <Calendar className="h-4 w-4" />
                    <AlertDescription>
                      Export directly to your Google Calendar or download the file for manual
                      import.
                    </AlertDescription>
                  </Alert>
                  <div className="flex space-x-2">
                    <Button variant="outline" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Sync to Google Calendar
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Export Result */}
            {lastExportResult && (
              <>
                <Separator />
                <Alert
                  className={
                    lastExportResult.success
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }
                >
                  <div className="flex items-center space-x-2">
                    {lastExportResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription>
                      {lastExportResult.success ? (
                        <>
                          <strong>Export successful!</strong> {lastExportResult.eventCount} events
                          exported to {lastExportResult.filename}
                        </>
                      ) : (
                        <>
                          <strong>Export failed:</strong> {lastExportResult.errors?.join(', ')}
                        </>
                      )}
                    </AlertDescription>
                  </div>
                </Alert>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{getFilteredEventCount()} events will be exported</span>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex items-center gap-2"
                >
                  {isExporting ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isExporting ? 'Exporting...' : 'Export Calendar'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
