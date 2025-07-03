'use client';

import { useEffect, useState } from 'react';

import {
  AlertTriangle,
  ChevronRight,
  Clock,
  Lightbulb,
  MapPin,
  Minus,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
// Note: Progress component might need to be created if not available
// import { Progress } from '@/components/ui/progress';
// Note: Collapsible components might need to be created if not available
// For now, we'll use a simple expandable pattern
// import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { CoverageAnalysis, CoverageGap, CoverageGapAnalyzer } from '../lib/coverage-gap-analyzer';
import { OrganizationProvider } from './organization-calendar-view';

export interface CoverageGapsPanelProps {
  providers: OrganizationProvider[];
  startDate: Date;
  endDate: Date;
  organizationId: string;
  onGapClick?: (gap: CoverageGap) => void;
  onRecommendationClick?: (recommendation: string) => void;
  showTrends?: boolean;
}

export function CoverageGapsPanel({
  providers,
  startDate,
  endDate,
  organizationId,
  onGapClick,
  onRecommendationClick,
  showTrends = true,
}: CoverageGapsPanelProps) {
  const [analysis, setAnalysis] = useState<CoverageAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    gaps: true,
    recommendations: false,
    trends: false,
  });

  useEffect(() => {
    const analyzeGaps = async () => {
      setIsLoading(true);

      // Use default requirements for healthcare organizations
      const analyzer = new CoverageGapAnalyzer(CoverageGapAnalyzer.getDefaultRequirements());
      const result = analyzer.analyzeCoverage(providers, startDate, endDate);

      setAnalysis(result);
      setIsLoading(false);
    };

    analyzeGaps();
  }, [providers, startDate, endDate]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getSeverityColor = (severity: CoverageGap['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeIcon = (type: CoverageGap['type']) => {
    switch (type) {
      case 'no_coverage':
        return <AlertTriangle className="h-4 w-4" />;
      case 'insufficient_coverage':
        return <Users className="h-4 w-4" />;
      case 'skill_gap':
        return <Lightbulb className="h-4 w-4" />;
      case 'location_gap':
        return <MapPin className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Coverage Gap Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="h-20 rounded bg-gray-200"></div>
            <div className="h-4 w-1/2 rounded bg-gray-200"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="py-8 text-center text-muted-foreground">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>Unable to analyze coverage gaps</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overview */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection('overview')}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Coverage Overview
            </div>
            <ChevronRight
              className={`h-4 w-4 transition-transform ${expandedSections.overview ? 'rotate-90' : ''}`}
            />
          </CardTitle>
        </CardHeader>
        {expandedSections.overview && (
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analysis.averageCoveragePercentage.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Average Coverage</div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${analysis.averageCoveragePercentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{analysis.totalGaps}</div>
                <div className="text-sm text-muted-foreground">Total Gaps</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{analysis.criticalGaps}</div>
                <div className="text-sm text-muted-foreground">Critical Gaps</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {analysis.highPriorityGaps}
                </div>
                <div className="text-sm text-muted-foreground">High Priority</div>
              </div>
            </div>

            {analysis.criticalGaps > 0 && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Critical attention needed:</strong> {analysis.criticalGaps} critical
                  coverage gaps require immediate action.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        )}
      </Card>

      {/* Coverage Gaps */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection('gaps')}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Coverage Gaps ({analysis.gaps.length})
            </div>
            <ChevronRight
              className={`h-4 w-4 transition-transform ${expandedSections.gaps ? 'rotate-90' : ''}`}
            />
          </CardTitle>
        </CardHeader>
        {expandedSections.gaps && (
          <CardContent>
            {analysis.gaps.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>No coverage gaps detected</p>
                <p className="text-sm">All time periods have adequate provider coverage</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analysis.gaps.slice(0, 10).map((gap) => (
                  <div
                    key={gap.id}
                    className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                    onClick={() => onGapClick?.(gap)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(gap.type)}
                        <Badge className={getSeverityColor(gap.severity)}>{gap.severity}</Badge>
                      </div>
                      <div>
                        <div className="font-medium">{gap.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(gap.startTime)} at {formatTime(gap.startTime)} -{' '}
                          {formatTime(gap.endTime)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {gap.coveragePercentage.toFixed(0)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Coverage</div>
                    </div>
                  </div>
                ))}

                {analysis.gaps.length > 10 && (
                  <div className="py-2 text-center">
                    <Button variant="outline" size="sm">
                      View {analysis.gaps.length - 10} more gaps
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSection('recommendations')}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Recommendations ({analysis.recommendations.length})
            </div>
            <ChevronRight
              className={`h-4 w-4 transition-transform ${expandedSections.recommendations ? 'rotate-90' : ''}`}
            />
          </CardTitle>
        </CardHeader>
        {expandedSections.recommendations && (
          <CardContent>
            {analysis.recommendations.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Lightbulb className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>No specific recommendations at this time</p>
                <p className="text-sm">Coverage levels are adequate</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analysis.recommendations.map((recommendation, index) => (
                  <div
                    key={index}
                    className="flex cursor-pointer items-start space-x-3 rounded-lg border p-3 hover:bg-gray-50"
                    onClick={() => onRecommendationClick?.(recommendation)}
                  >
                    <Lightbulb className="mt-1 h-4 w-4 flex-shrink-0 text-yellow-600" />
                    <div className="flex-1">
                      <p className="text-sm">{recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Hourly Coverage Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Hourly Coverage Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-12 gap-1 text-xs">
            {/* Hour labels */}
            {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => (
              <div key={hour} className="text-center text-muted-foreground">
                {hour}:00
              </div>
            ))}

            {/* Coverage bars */}
            {Array.from({ length: 12 }, (_, i) => {
              const hour = i + 8;
              const hourlyData = analysis.coverageByHour.filter((h) => h.hour === hour);
              const averageCoverage =
                hourlyData.reduce((sum, h) => sum + h.coveragePercentage, 0) / hourlyData.length ||
                0;

              return (
                <TooltipProvider key={hour}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative h-8">
                        <div
                          className={`h-full w-full rounded ${
                            averageCoverage >= 80
                              ? 'bg-green-500'
                              : averageCoverage >= 60
                                ? 'bg-yellow-500'
                                : averageCoverage >= 40
                                  ? 'bg-orange-500'
                                  : 'bg-red-500'
                          } `}
                          style={{ opacity: averageCoverage / 100 }}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-center">
                        <div className="font-medium">{hour}:00</div>
                        <div>{averageCoverage.toFixed(1)}% coverage</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="h-3 w-3 rounded bg-red-500"></div>
              <span>Critical (&lt;40%)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="h-3 w-3 rounded bg-orange-500"></div>
              <span>Low (40-60%)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="h-3 w-3 rounded bg-yellow-500"></div>
              <span>Moderate (60-80%)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="h-3 w-3 rounded bg-green-500"></div>
              <span>Good (80%+)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
