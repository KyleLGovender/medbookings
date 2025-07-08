import { useState } from 'react';

import { EyeOff, Info, Palette, Settings } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

import { VisualIndicatorConfig, VisualIndicatorLegend } from './calendar-visual-indicators';

interface VisualIndicatorsConfigProps {
  config: VisualIndicatorConfig;
  onConfigChange: (config: VisualIndicatorConfig) => void;
  className?: string;
  showPreview?: boolean;
}

export function VisualIndicatorsConfig({
  config,
  onConfigChange,
  className = '',
  showPreview = true,
}: VisualIndicatorsConfigProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateConfig = (key: keyof VisualIndicatorConfig, value: boolean) => {
    onConfigChange({ ...config, [key]: value });
  };

  const getActiveIndicatorsCount = () => {
    return Object.values(config).filter((value) => value === true).length;
  };

  const resetToDefaults = () => {
    const defaultConfig: VisualIndicatorConfig = {
      showStatusIndicators: true,
      showSchedulingRuleIcons: true,
      showRecurringPatternBadges: true,
      showLocationIcons: true,
      showDurationBadges: false,
      showPriorityIndicators: false,
      compactMode: false,
    };
    onConfigChange(defaultConfig);
  };

  const enableAll = () => {
    const allEnabledConfig: VisualIndicatorConfig = {
      showStatusIndicators: true,
      showSchedulingRuleIcons: true,
      showRecurringPatternBadges: true,
      showLocationIcons: true,
      showDurationBadges: true,
      showPriorityIndicators: true,
      compactMode: false,
    };
    onConfigChange(allEnabledConfig);
  };

  const compactView = () => {
    const compactConfig: VisualIndicatorConfig = {
      showStatusIndicators: true,
      showSchedulingRuleIcons: false,
      showRecurringPatternBadges: false,
      showLocationIcons: false,
      showDurationBadges: false,
      showPriorityIndicators: true,
      compactMode: true,
    };
    onConfigChange(compactConfig);
  };

  const activeCount = getActiveIndicatorsCount();

  if (!isExpanded) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="relative"
        >
          <Palette className="mr-2 h-4 w-4" />
          Visual Indicators
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full px-1 py-0 text-xs">
              {activeCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Palette className="h-4 w-4" />
              Visual Indicators Configuration
              <Badge variant="secondary" className="ml-2">
                {activeCount} active
              </Badge>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>
                <EyeOff className="mr-1 h-4 w-4" />
                Collapse
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick Presets */}
          <div>
            <Label className="text-sm font-medium">Quick Presets</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={resetToDefaults}>
                Default
              </Button>
              <Button variant="outline" size="sm" onClick={enableAll}>
                Show All
              </Button>
              <Button variant="outline" size="sm" onClick={compactView}>
                Compact
              </Button>
            </div>
          </div>

          <Separator />

          {/* Core Indicators */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Core Indicators</Label>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="status-indicators" className="text-sm">
                    Status Icons
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Show status icons (active, pending, cancelled)
                  </p>
                </div>
                <Switch
                  id="status-indicators"
                  checked={config.showStatusIndicators}
                  onCheckedChange={(checked) => updateConfig('showStatusIndicators', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="scheduling-rules" className="text-sm">
                    Scheduling Rules
                  </Label>
                  <p className="text-xs text-muted-foreground">Show scheduling rule icons</p>
                </div>
                <Switch
                  id="scheduling-rules"
                  checked={config.showSchedulingRuleIcons}
                  onCheckedChange={(checked) => updateConfig('showSchedulingRuleIcons', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="recurring-patterns" className="text-sm">
                    Recurring Patterns
                  </Label>
                  <p className="text-xs text-muted-foreground">Show recurring series badges</p>
                </div>
                <Switch
                  id="recurring-patterns"
                  checked={config.showRecurringPatternBadges}
                  onCheckedChange={(checked) => updateConfig('showRecurringPatternBadges', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="location-icons" className="text-sm">
                    Location Icons
                  </Label>
                  <p className="text-xs text-muted-foreground">Show online/in-person indicators</p>
                </div>
                <Switch
                  id="location-icons"
                  checked={config.showLocationIcons}
                  onCheckedChange={(checked) => updateConfig('showLocationIcons', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Advanced Indicators */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Advanced Indicators</Label>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="duration-badges" className="text-sm">
                    Duration Badges
                  </Label>
                  <p className="text-xs text-muted-foreground">Show appointment duration</p>
                </div>
                <Switch
                  id="duration-badges"
                  checked={config.showDurationBadges}
                  onCheckedChange={(checked) => updateConfig('showDurationBadges', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="priority-indicators" className="text-sm">
                    Priority Indicators
                  </Label>
                  <p className="text-xs text-muted-foreground">Show priority levels with colors</p>
                </div>
                <Switch
                  id="priority-indicators"
                  checked={config.showPriorityIndicators}
                  onCheckedChange={(checked) => updateConfig('showPriorityIndicators', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Display Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Display Options</Label>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="compact-mode" className="text-sm">
                  Compact Mode
                </Label>
                <p className="text-xs text-muted-foreground">
                  Reduce visual elements for dense layouts
                </p>
              </div>
              <Switch
                id="compact-mode"
                checked={config.compactMode}
                onCheckedChange={(checked) => updateConfig('compactMode', checked)}
              />
            </div>
          </div>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Visual indicators help differentiate between availability types, statuses, and
              scheduling rules. Enable compact mode for mobile or dense calendar views.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Legend Preview */}
      {showPreview && activeCount > 0 && <VisualIndicatorLegend config={config} />}
    </div>
  );
}

// Component to show indicator usage stats
interface IndicatorUsageStatsProps {
  events: Array<{ type: string; status: string; schedulingRule?: string; isRecurring?: boolean }>;
  config: VisualIndicatorConfig;
}

export function IndicatorUsageStats({ events, config }: IndicatorUsageStatsProps) {
  const stats = {
    totalEvents: events.length,
    withStatusIcons: events.filter((e) => config.showStatusIndicators).length,
    withSchedulingRules: events.filter((e) => config.showSchedulingRuleIcons && e.schedulingRule)
      .length,
    withRecurringBadges: events.filter((e) => config.showRecurringPatternBadges && e.isRecurring)
      .length,
    withLocationIcons: events.filter((e) => config.showLocationIcons).length,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Settings className="h-4 w-4" />
          Indicator Usage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{stats.totalEvents}</div>
            <div className="text-xs text-muted-foreground">Total Events</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{stats.withStatusIcons}</div>
            <div className="text-xs text-muted-foreground">With Status</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">{stats.withSchedulingRules}</div>
            <div className="text-xs text-muted-foreground">With Rules</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">{stats.withRecurringBadges}</div>
            <div className="text-xs text-muted-foreground">Recurring</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
