'use client';

import {
  AlertCircle,
  Building,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Pause,
  Repeat,
  Settings,
  User,
  Wifi,
  XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AvailabilityStatus,
  CalendarEvent,
  SchedulingRule,
  SlotStatus,
} from '@/features/calendar/availability/types/types';

export interface VisualIndicatorConfig {
  showStatusIndicators: boolean;
  showSchedulingRuleIcons: boolean;
  showRecurringPatternBadges: boolean;
  showLocationIcons: boolean;
  showDurationBadges: boolean;
  showPriorityIndicators: boolean;
  compactMode: boolean;
}

export interface CalendarEventWithVisuals extends CalendarEvent {
  priority?: 'low' | 'medium' | 'high' | 'critical';
  conflictLevel?: 'none' | 'minor' | 'major' | 'critical';
  utilizationImpact?: 'low' | 'medium' | 'high';
}

// Color schemes for different event types and statuses
export const EventColorSchemes = {
  availability: {
    [AvailabilityStatus.ACCEPTED]: {
      background: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      accent: 'bg-green-500',
    },
    [AvailabilityStatus.PENDING]: {
      background: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      accent: 'bg-yellow-500',
    },
    [AvailabilityStatus.CANCELLED]: {
      background: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      accent: 'bg-red-500',
    },
  },
  booking: {
    [SlotStatus.BOOKED]: {
      background: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      accent: 'bg-blue-500',
    },
    [SlotStatus.AVAILABLE]: {
      background: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-800',
      accent: 'bg-orange-500',
    },
    [SlotStatus.BLOCKED]: {
      background: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-800',
      accent: 'bg-gray-500',
    },
  },
  blocked: {
    background: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    accent: 'bg-red-500',
  },
};

// Scheduling rule icons and colors
export const SchedulingRuleIndicators = {
  [SchedulingRule.CONTINUOUS]: {
    icon: Clock,
    color: 'text-blue-600',
    background: 'bg-blue-100',
    description: 'Continuous scheduling - flexible appointment times',
  },
  [SchedulingRule.FIXED_INTERVAL]: {
    icon: Calendar,
    color: 'text-green-600',
    background: 'bg-green-100',
    description: 'Fixed intervals - standardized appointment slots',
  },
  [SchedulingRule.CUSTOM_INTERVAL]: {
    icon: Settings,
    color: 'text-purple-600',
    background: 'bg-purple-100',
    description: 'Custom intervals - specialized scheduling rules',
  },
};

// Priority indicators
export const PriorityIndicators = {
  low: { color: 'bg-gray-400', text: 'Low Priority', pulse: false },
  medium: { color: 'bg-yellow-400', text: 'Medium Priority', pulse: false },
  high: { color: 'bg-orange-400', text: 'High Priority', pulse: true },
  critical: { color: 'bg-red-400', text: 'Critical Priority', pulse: true },
};

// Status icons
export const StatusIcons = {
  availability: {
    [AvailabilityStatus.ACCEPTED]: CheckCircle,
    [AvailabilityStatus.PENDING]: Pause,
    [AvailabilityStatus.REJECTED]: XCircle,
  },
  booking: {
    [SlotStatus.BOOKED]: CheckCircle,
    [SlotStatus.AVAILABLE]: AlertCircle,
    [SlotStatus.BLOCKED]: XCircle,
  },
  blocked: XCircle,
};

interface CalendarEventIndicatorProps {
  event: CalendarEventWithVisuals;
  config: VisualIndicatorConfig;
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
}

export function CalendarEventIndicator({
  event,
  config,
  size = 'medium',
  showTooltip = true,
}: CalendarEventIndicatorProps) {
  const getColorScheme = () => {
    if (event.type === 'blocked') {
      return EventColorSchemes.blocked;
    }

    const schemes = EventColorSchemes[event.type as keyof typeof EventColorSchemes];
    if (schemes && typeof schemes === 'object' && event.status in schemes) {
      return schemes[event.status as keyof typeof schemes];
    }

    return {
      background: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-800',
      accent: 'bg-gray-500',
    };
  };

  const colorScheme = getColorScheme();
  const sizeClasses = {
    small: 'p-1 text-xs',
    medium: 'p-2 text-sm',
    large: 'p-3 text-base',
  };

  const StatusIcon =
    event.type === 'blocked'
      ? StatusIcons.blocked
      : StatusIcons[event.type as keyof typeof StatusIcons]?.[
          event.status as keyof (typeof StatusIcons)[keyof typeof StatusIcons]
        ];

  const SchedulingIcon = event.schedulingRule
    ? SchedulingRuleIndicators[event.schedulingRule].icon
    : null;

  const eventContent = (
    <div
      className={`relative rounded border-l-4 ${colorScheme.background} ${colorScheme.border} ${colorScheme.text} ${sizeClasses[size]} transition-all duration-200 hover:shadow-md`}
      style={{
        borderLeftColor: colorScheme.accent.replace('bg-', '').replace('-500', ''),
      }}
    >
      {/* Priority indicator */}
      {config.showPriorityIndicators && event.priority && (
        <div
          className={`absolute -right-1 -top-1 h-3 w-3 rounded-full ${PriorityIndicators[event.priority].color} ${PriorityIndicators[event.priority].pulse ? 'animate-pulse' : ''} `}
        />
      )}

      {/* Main content */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          {/* Title and status */}
          <div className="flex items-center space-x-2">
            {config.showStatusIndicators && StatusIcon && (
              <StatusIcon className="h-4 w-4 flex-shrink-0" />
            )}
            <span className="truncate font-medium">{event.title}</span>
          </div>

          {/* Time */}
          <div className="mt-1 text-xs opacity-75">
            {event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
            {event.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>

          {/* Customer info for bookings */}
          {event.type === 'booking' && event.customer && !config.compactMode && (
            <div className="mt-1 flex items-center text-xs opacity-75">
              <User className="mr-1 h-3 w-3" />
              {event.customer.name}
            </div>
          )}
        </div>

        {/* Right side indicators */}
        <div className="ml-2 flex flex-col items-end space-y-1">
          {/* Scheduling rule indicator */}
          {config.showSchedulingRuleIcons && SchedulingIcon && (
            <div
              className={`rounded-full p-1 ${SchedulingRuleIndicators[event.schedulingRule!].background} `}
            >
              <SchedulingIcon
                className={`h-3 w-3 ${SchedulingRuleIndicators[event.schedulingRule!].color}`}
              />
            </div>
          )}

          {/* Location indicator */}
          {config.showLocationIcons && event.location && (
            <div className="text-xs opacity-75">
              {event.location.isOnline ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <Building className="h-3 w-3" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom badges */}
      {!config.compactMode && (
        <div className="mt-2 flex items-center justify-between">
          <div className="flex space-x-1">
            {/* Recurring pattern badge */}
            {config.showRecurringPatternBadges && event.isRecurring && (
              <Badge variant="outline" className="h-5 text-xs">
                <Repeat className="mr-1 h-2 w-2" />
                Series
              </Badge>
            )}

            {/* Duration badge */}
            {config.showDurationBadges && event.service && (
              <Badge variant="outline" className="h-5 text-xs">
                {event.service.duration}min
              </Badge>
            )}
          </div>

          {/* Price for services */}
          {event.service?.price && (
            <span className="text-xs font-medium">${event.service.price}</span>
          )}
        </div>
      )}

      {/* Conflict indicator */}
      {event.conflictLevel && event.conflictLevel !== 'none' && (
        <div className="absolute right-0 top-0 -mr-1 -mt-1">
          <div
            className={`h-2 w-2 rounded-full ${
              event.conflictLevel === 'minor'
                ? 'bg-yellow-400'
                : event.conflictLevel === 'major'
                  ? 'bg-orange-400'
                  : 'bg-red-400'
            } `}
          />
        </div>
      )}
    </div>
  );

  if (!showTooltip) {
    return eventContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{eventContent}</TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2">
            <div className="font-medium">{event.title}</div>
            <div className="text-sm">
              {event.startTime.toLocaleDateString()}{' '}
              {event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
              {event.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>

            {event.schedulingRule && (
              <div className="text-sm">
                <span className="font-medium">Rule: </span>
                {SchedulingRuleIndicators[event.schedulingRule].description}
              </div>
            )}

            {event.location && (
              <div className="text-sm">
                <span className="font-medium">Location: </span>
                {event.location.isOnline ? 'Online' : event.location.name}
              </div>
            )}

            {event.customer && (
              <div className="text-sm">
                <span className="font-medium">Customer: </span>
                {event.customer.name}
              </div>
            )}

            {event.service && (
              <div className="text-sm">
                <span className="font-medium">Service: </span>
                {event.service.name} ({event.service.duration}min, ${event.service.price})
              </div>
            )}

            {event.priority && (
              <div className="text-sm">
                <span className="font-medium">Priority: </span>
                {PriorityIndicators[event.priority].text}
              </div>
            )}

            {event.conflictLevel && event.conflictLevel !== 'none' && (
              <div className="text-sm text-red-600">
                <span className="font-medium">Conflict: </span>
                {event.conflictLevel} level scheduling conflict detected
              </div>
            )}

            {event.notes && (
              <div className="text-sm">
                <span className="font-medium">Notes: </span>
                {event.notes}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Legend component to explain visual indicators
interface VisualIndicatorLegendProps {
  config: VisualIndicatorConfig;
  className?: string;
}

export function VisualIndicatorLegend({ config, className = '' }: VisualIndicatorLegendProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Eye className="h-4 w-4" />
          Visual Indicators Legend
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Colors */}
        <div>
          <h4 className="mb-2 text-xs font-medium">Status Colors</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded bg-green-500"></div>
              <span>Active/Confirmed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded bg-blue-500"></div>
              <span>Booked</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded bg-yellow-500"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded bg-red-500"></div>
              <span>Cancelled/Blocked</span>
            </div>
          </div>
        </div>

        {/* Scheduling Rules */}
        {config.showSchedulingRuleIcons && (
          <div>
            <h4 className="mb-2 text-xs font-medium">Scheduling Rules</h4>
            <div className="space-y-1">
              {Object.entries(SchedulingRuleIndicators).map(([rule, indicator]) => {
                const Icon = indicator.icon;
                return (
                  <div key={rule} className="flex items-center space-x-2 text-xs">
                    <div className={`rounded-full p-1 ${indicator.background}`}>
                      <Icon className={`h-3 w-3 ${indicator.color}`} />
                    </div>
                    <span>{rule.replace('_', ' ')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Priority Levels */}
        {config.showPriorityIndicators && (
          <div>
            <h4 className="mb-2 text-xs font-medium">Priority Levels</h4>
            <div className="space-y-1">
              {Object.entries(PriorityIndicators).map(([level, indicator]) => (
                <div key={level} className="flex items-center space-x-2 text-xs">
                  <div
                    className={`h-3 w-3 rounded-full ${indicator.color} ${indicator.pulse ? 'animate-pulse' : ''}`}
                  />
                  <span>{indicator.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location Types */}
        {config.showLocationIcons && (
          <div>
            <h4 className="mb-2 text-xs font-medium">Location Types</h4>
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs">
                <Wifi className="h-3 w-3" />
                <span>Online</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <Building className="h-3 w-3" />
                <span>In-person</span>
              </div>
            </div>
          </div>
        )}

        {/* Pattern Indicators */}
        {config.showRecurringPatternBadges && (
          <div>
            <h4 className="mb-2 text-xs font-medium">Pattern Indicators</h4>
            <div className="flex items-center space-x-2 text-xs">
              <Badge variant="outline" className="h-5 text-xs">
                <Repeat className="mr-1 h-2 w-2" />
                Series
              </Badge>
              <span>Recurring event</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
