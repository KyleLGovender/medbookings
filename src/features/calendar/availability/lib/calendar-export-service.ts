'use client';

import { CalendarEvent } from '../components/provider-calendar-view';
import { OrganizationProvider } from '../components/organization-calendar-view';

export interface ExportConfig {
  format: 'ical' | 'csv' | 'json' | 'pdf';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeFields: {
    eventDetails: boolean;
    customerInfo: boolean;
    serviceInfo: boolean;
    locationInfo: boolean;
    notes: boolean;
    recurringInfo: boolean;
  };
  filters: {
    eventTypes: ('availability' | 'booking' | 'blocked')[];
    statuses: string[];
    providers: string[];
    locations: string[];
  };
  customization: {
    timezone: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
    includePrivateEvents: boolean;
    anonymizeCustomerData: boolean;
  };
}

export interface ExportResult {
  success: boolean;
  format: string;
  filename: string;
  data?: string | Blob;
  downloadUrl?: string;
  eventCount: number;
  errors?: string[];
  metadata: {
    exportedAt: Date;
    timezone: string;
    totalEvents: number;
    filteredEvents: number;
  };
}

export interface GoogleCalendarIntegration {
  enabled: boolean;
  calendarId?: string;
  syncDirection: 'import' | 'export' | 'bidirectional';
  lastSync?: Date;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
}

export class CalendarExportService {
  private readonly timezone: string;
  private readonly baseUrl: string;

  constructor(timezone = 'UTC', baseUrl = '') {
    this.timezone = timezone;
    this.baseUrl = baseUrl;
  }

  // Main export method
  async exportCalendar(
    events: CalendarEvent[],
    providers: OrganizationProvider[] = [],
    config: ExportConfig
  ): Promise<ExportResult> {
    try {
      // Filter events based on config
      const filteredEvents = this.filterEvents(events, config);
      
      // Generate export data based on format
      let exportData: string | Blob;
      let filename: string;

      switch (config.format) {
        case 'ical':
          exportData = this.generateICalendar(filteredEvents, providers, config);
          filename = `calendar_${this.formatDateForFilename(new Date())}.ics`;
          break;
        case 'csv':
          exportData = this.generateCSV(filteredEvents, providers, config);
          filename = `calendar_${this.formatDateForFilename(new Date())}.csv`;
          break;
        case 'json':
          exportData = this.generateJSON(filteredEvents, providers, config);
          filename = `calendar_${this.formatDateForFilename(new Date())}.json`;
          break;
        case 'pdf':
          exportData = await this.generatePDF(filteredEvents, providers, config);
          filename = `calendar_${this.formatDateForFilename(new Date())}.pdf`;
          break;
        default:
          throw new Error(`Unsupported export format: ${config.format}`);
      }

      // Create download URL
      const downloadUrl = this.createDownloadUrl(exportData, config.format);

      return {
        success: true,
        format: config.format,
        filename,
        data: exportData,
        downloadUrl,
        eventCount: filteredEvents.length,
        metadata: {
          exportedAt: new Date(),
          timezone: config.customization.timezone,
          totalEvents: events.length,
          filteredEvents: filteredEvents.length,
        },
      };

    } catch (error) {
      return {
        success: false,
        format: config.format,
        filename: '',
        eventCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown export error'],
        metadata: {
          exportedAt: new Date(),
          timezone: config.customization.timezone,
          totalEvents: events.length,
          filteredEvents: 0,
        },
      };
    }
  }

  // Filter events based on export config
  private filterEvents(events: CalendarEvent[], config: ExportConfig): CalendarEvent[] {
    return events.filter(event => {
      // Date range filter
      if (event.startTime < config.dateRange.start || event.startTime > config.dateRange.end) {
        return false;
      }

      // Event type filter
      if (config.filters.eventTypes.length > 0 && !config.filters.eventTypes.includes(event.type)) {
        return false;
      }

      // Status filter
      if (config.filters.statuses.length > 0 && !config.filters.statuses.includes(event.status as string)) {
        return false;
      }

      // Private events filter
      if (!config.customization.includePrivateEvents && event.notes?.includes('PRIVATE')) {
        return false;
      }

      return true;
    });
  }

  // Generate iCalendar format
  private generateICalendar(
    events: CalendarEvent[],
    providers: OrganizationProvider[],
    config: ExportConfig
  ): string {
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MedBookings//Calendar Export//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    events.forEach(event => {
      const uid = `${event.id}@medbookings.com`;
      const dtstart = this.formatDateTimeForICal(event.startTime);
      const dtend = this.formatDateTimeForICal(event.endTime);
      const created = this.formatDateTimeForICal(new Date());
      const summary = this.escapeICalValue(event.title);
      
      let description = this.buildEventDescription(event, config);
      if (config.customization.anonymizeCustomerData && event.customer) {
        description = description.replace(event.customer.name, 'Customer');
        description = description.replace(event.customer.email || '', '[hidden]');
      }

      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTART:${dtstart}`,
        `DTEND:${dtend}`,
        `CREATED:${created}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${this.escapeICalValue(description)}`,
        `STATUS:${this.mapStatusToICalStatus(event.status as string)}`,
      );

      if (event.location) {
        if (event.location.isOnline) {
          lines.push('LOCATION:Online Meeting');
        } else {
          lines.push(`LOCATION:${this.escapeICalValue(event.location.name)}`);
        }
      }

      if (event.isRecurring && event.seriesId) {
        // Add recurrence rule (simplified)
        lines.push('RRULE:FREQ=WEEKLY'); // This would be more sophisticated in real implementation
      }

      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  // Generate CSV format
  private generateCSV(
    events: CalendarEvent[],
    providers: OrganizationProvider[],
    config: ExportConfig
  ): string {
    const headers = this.buildCSVHeaders(config);
    const rows: string[] = [headers.join(',')];

    events.forEach(event => {
      const row: string[] = [];
      
      // Basic event info
      row.push(this.escapeCSVValue(event.title));
      row.push(this.escapeCSVValue(event.type));
      row.push(this.escapeCSVValue(event.status as string));
      row.push(this.formatDateTimeForCSV(event.startTime, config));
      row.push(this.formatDateTimeForCSV(event.endTime, config));

      // Duration
      const duration = event.endTime.getTime() - event.startTime.getTime();
      row.push(Math.round(duration / (1000 * 60)).toString()); // Duration in minutes

      // Provider info
      const provider = providers.find(p => event.id.includes(p.id)); // Simplified lookup
      row.push(this.escapeCSVValue(provider?.name || ''));

      // Location info
      if (config.includeFields.locationInfo && event.location) {
        row.push(this.escapeCSVValue(event.location.isOnline ? 'Online' : event.location.name));
      } else {
        row.push('');
      }

      // Customer info
      if (config.includeFields.customerInfo && event.customer) {
        const customerName = config.customization.anonymizeCustomerData ? 'Customer' : event.customer.name;
        row.push(this.escapeCSVValue(customerName));
        row.push(this.escapeCSVValue(config.customization.anonymizeCustomerData ? '[hidden]' : (event.customer.email || '')));
      } else {
        row.push('', '');
      }

      // Service info
      if (config.includeFields.serviceInfo && event.service) {
        row.push(this.escapeCSVValue(event.service.name));
        row.push(event.service.duration.toString());
        row.push(event.service.price.toString());
      } else {
        row.push('', '', '');
      }

      // Recurring info
      if (config.includeFields.recurringInfo) {
        row.push(event.isRecurring ? 'Yes' : 'No');
        row.push(this.escapeCSVValue(event.seriesId || ''));
      } else {
        row.push('', '');
      }

      // Notes
      if (config.includeFields.notes) {
        row.push(this.escapeCSVValue(event.notes || ''));
      } else {
        row.push('');
      }

      rows.push(row.join(','));
    });

    return rows.join('\n');
  }

  // Generate JSON format
  private generateJSON(
    events: CalendarEvent[],
    providers: OrganizationProvider[],
    config: ExportConfig
  ): string {
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        timezone: config.customization.timezone,
        format: 'json',
        version: '1.0',
        eventCount: events.length,
      },
      config: {
        dateRange: {
          start: config.dateRange.start.toISOString(),
          end: config.dateRange.end.toISOString(),
        },
        filters: config.filters,
        includeFields: config.includeFields,
      },
      providers: providers.map(provider => ({
        id: provider.id,
        name: provider.name,
        type: provider.type,
        specialization: provider.specialization,
      })),
      events: events.map(event => {
        const exportEvent: any = {
          id: event.id,
          title: event.title,
          type: event.type,
          status: event.status,
          startTime: event.startTime.toISOString(),
          endTime: event.endTime.toISOString(),
        };

        if (config.includeFields.locationInfo && event.location) {
          exportEvent.location = {
            name: event.location.name,
            isOnline: event.location.isOnline,
          };
        }

        if (config.includeFields.customerInfo && event.customer) {
          exportEvent.customer = {
            name: config.customization.anonymizeCustomerData ? 'Customer' : event.customer.name,
            email: config.customization.anonymizeCustomerData ? '[hidden]' : event.customer.email,
          };
        }

        if (config.includeFields.serviceInfo && event.service) {
          exportEvent.service = {
            name: event.service.name,
            duration: event.service.duration,
            price: event.service.price,
          };
        }

        if (config.includeFields.recurringInfo) {
          exportEvent.recurring = {
            isRecurring: event.isRecurring,
            seriesId: event.seriesId,
            schedulingRule: event.schedulingRule,
          };
        }

        if (config.includeFields.notes && event.notes) {
          exportEvent.notes = event.notes;
        }

        return exportEvent;
      }),
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Generate PDF format (placeholder - would use a PDF library in real implementation)
  private async generatePDF(
    events: CalendarEvent[],
    providers: OrganizationProvider[],
    config: ExportConfig
  ): Promise<Blob> {
    // This is a placeholder. In a real implementation, you would use a PDF library like jsPDF
    const htmlContent = this.generateHTMLForPDF(events, providers, config);
    
    // Convert HTML to PDF (placeholder)
    const pdfContent = `PDF placeholder for calendar export\n\nEvents: ${events.length}\nGenerated: ${new Date().toISOString()}`;
    
    return new Blob([pdfContent], { type: 'application/pdf' });
  }

  // Google Calendar integration methods
  async syncWithGoogleCalendar(
    events: CalendarEvent[],
    integration: GoogleCalendarIntegration
  ): Promise<{ success: boolean; syncedEvents: number; errors?: string[] }> {
    try {
      // This would integrate with Google Calendar API
      console.log('Syncing with Google Calendar:', integration);
      
      // Placeholder implementation
      return {
        success: true,
        syncedEvents: events.length,
      };
    } catch (error) {
      return {
        success: false,
        syncedEvents: 0,
        errors: [error instanceof Error ? error.message : 'Sync failed'],
      };
    }
  }

  // Helper methods
  private buildEventDescription(event: CalendarEvent, config: ExportConfig): string {
    const parts: string[] = [];

    if (config.includeFields.eventDetails) {
      parts.push(`Type: ${event.type}`);
      parts.push(`Status: ${event.status}`);
    }

    if (config.includeFields.customerInfo && event.customer) {
      parts.push(`Customer: ${event.customer.name}`);
      if (event.customer.email) {
        parts.push(`Email: ${event.customer.email}`);
      }
    }

    if (config.includeFields.serviceInfo && event.service) {
      parts.push(`Service: ${event.service.name}`);
      parts.push(`Duration: ${event.service.duration} minutes`);
      parts.push(`Price: $${event.service.price}`);
    }

    if (config.includeFields.locationInfo && event.location) {
      parts.push(`Location: ${event.location.isOnline ? 'Online' : event.location.name}`);
    }

    if (config.includeFields.recurringInfo && event.isRecurring) {
      parts.push('Recurring event');
      if (event.seriesId) {
        parts.push(`Series ID: ${event.seriesId}`);
      }
    }

    if (config.includeFields.notes && event.notes) {
      parts.push(`Notes: ${event.notes}`);
    }

    return parts.join('\\n');
  }

  private buildCSVHeaders(config: ExportConfig): string[] {
    const headers = ['Title', 'Type', 'Status', 'Start Time', 'End Time', 'Duration (min)', 'Provider'];

    if (config.includeFields.locationInfo) {
      headers.push('Location');
    }

    if (config.includeFields.customerInfo) {
      headers.push('Customer Name', 'Customer Email');
    }

    if (config.includeFields.serviceInfo) {
      headers.push('Service Name', 'Service Duration', 'Service Price');
    }

    if (config.includeFields.recurringInfo) {
      headers.push('Is Recurring', 'Series ID');
    }

    if (config.includeFields.notes) {
      headers.push('Notes');
    }

    return headers;
  }

  private generateHTMLForPDF(
    events: CalendarEvent[],
    providers: OrganizationProvider[],
    config: ExportConfig
  ): string {
    // Generate HTML content for PDF conversion
    return `
      <html>
        <head>
          <title>Calendar Export</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Calendar Export</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <p>Events: ${events.length}</p>
          <!-- Event table would go here -->
        </body>
      </html>
    `;
  }

  private formatDateTimeForICal(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  private formatDateTimeForCSV(date: Date, config: ExportConfig): string {
    const timeFormat = config.customization.timeFormat === '12h' 
      ? { hour12: true } 
      : { hour12: false };
    
    return date.toLocaleString('en-US', {
      ...timeFormat,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private formatDateForFilename(date: Date): string {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }

  private escapeICalValue(value: string): string {
    return value.replace(/[\\;,\n]/g, (match) => {
      switch (match) {
        case '\\': return '\\\\';
        case ';': return '\\;';
        case ',': return '\\,';
        case '\n': return '\\n';
        default: return match;
      }
    });
  }

  private escapeCSVValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private mapStatusToICalStatus(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
      case 'booked':
        return 'CONFIRMED';
      case 'pending':
        return 'TENTATIVE';
      case 'cancelled':
        return 'CANCELLED';
      default:
        return 'TENTATIVE';
    }
  }

  private createDownloadUrl(data: string | Blob, format: string): string {
    let blob: Blob;
    
    if (typeof data === 'string') {
      const mimeType = this.getMimeType(format);
      blob = new Blob([data], { type: mimeType });
    } else {
      blob = data;
    }

    return URL.createObjectURL(blob);
  }

  private getMimeType(format: string): string {
    switch (format) {
      case 'ical': return 'text/calendar';
      case 'csv': return 'text/csv';
      case 'json': return 'application/json';
      case 'pdf': return 'application/pdf';
      default: return 'text/plain';
    }
  }

  // Static helper to get default export config
  static getDefaultConfig(): ExportConfig {
    const now = new Date();
    const oneMonthLater = new Date(now);
    oneMonthLater.setMonth(now.getMonth() + 1);

    return {
      format: 'ical',
      dateRange: {
        start: now,
        end: oneMonthLater,
      },
      includeFields: {
        eventDetails: true,
        customerInfo: true,
        serviceInfo: true,
        locationInfo: true,
        notes: false,
        recurringInfo: true,
      },
      filters: {
        eventTypes: ['availability', 'booking'],
        statuses: [],
        providers: [],
        locations: [],
      },
      customization: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '24h',
        includePrivateEvents: false,
        anonymizeCustomerData: false,
      },
    };
  }
}