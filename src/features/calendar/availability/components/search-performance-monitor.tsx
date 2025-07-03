'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, Database, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { getDatabasePerformanceRecommendations } from '../lib/search-performance-service';

interface PerformanceMetrics {
  queryExecutionTime: number;
  totalResults: number;
  indexesUsed: string[];
  cacheHitRatio?: number;
  memoryUsage?: number;
  optimizationSuggestions: string[];
}

interface SearchPerformanceMonitorProps {
  metrics?: PerformanceMetrics;
  isVisible?: boolean;
  onClose?: () => void;
}

export function SearchPerformanceMonitor({
  metrics,
  isVisible = false,
  onClose,
}: SearchPerformanceMonitorProps) {
  const [recommendations, setRecommendations] = useState<{
    recommendedIndexes: Array<{
      table: string;
      columns: string[];
      reason: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    queryOptimizations: string[];
  } | null>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  useEffect(() => {
    if (isVisible && !recommendations) {
      loadRecommendations();
    }
  }, [isVisible, recommendations]);

  const loadRecommendations = async () => {
    setIsLoadingRecommendations(true);
    try {
      const recs = await getDatabasePerformanceRecommendations();
      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading performance recommendations:', error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const getPerformanceScore = (metrics?: PerformanceMetrics): number => {
    if (!metrics) return 0;
    
    let score = 100;
    
    // Deduct points for slow queries
    if (metrics.queryExecutionTime > 1000) score -= 30;
    else if (metrics.queryExecutionTime > 500) score -= 15;
    else if (metrics.queryExecutionTime > 200) score -= 5;
    
    // Deduct points for optimization suggestions
    score -= metrics.optimizationSuggestions.length * 5;
    
    // Add points for using indexes
    score += Math.min(metrics.indexesUsed.length * 2, 10);
    
    return Math.max(0, Math.min(100, score));
  };

  const getPerformanceLevel = (score: number): { level: string; color: string } => {
    if (score >= 90) return { level: 'Excellent', color: 'text-green-600' };
    if (score >= 75) return { level: 'Good', color: 'text-blue-600' };
    if (score >= 60) return { level: 'Fair', color: 'text-yellow-600' };
    return { level: 'Poor', color: 'text-red-600' };
  };

  if (!isVisible) return null;

  const score = getPerformanceScore(metrics);
  const { level, color } = getPerformanceLevel(score);

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[80vh] overflow-y-auto z-50">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Search Performance Monitor
            </CardTitle>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Performance Score */}
          {metrics && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Performance Score</span>
                <span className={`text-sm font-bold ${color}`}>{level}</span>
              </div>
              <Progress value={score} className="h-2" />
              <div className="text-xs text-muted-foreground text-right">
                {score}/100
              </div>
            </div>
          )}

          {/* Query Metrics */}
          {metrics && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Execution Time
                </div>
                <div className="text-sm font-medium">
                  {metrics.queryExecutionTime}ms
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Database className="h-3 w-3" />
                  Results Found
                </div>
                <div className="text-sm font-medium">
                  {metrics.totalResults}
                </div>
              </div>
            </div>
          )}

          {/* Indexes Used */}
          {metrics && metrics.indexesUsed.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                Indexes Used
              </h4>
              <div className="flex flex-wrap gap-1">
                {metrics.indexesUsed.map((index, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {index.replace('_idx', '').replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Optimization Suggestions */}
          {metrics && metrics.optimizationSuggestions.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-sm">Optimization Suggestions</AlertTitle>
              <AlertDescription className="text-xs">
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {metrics.optimizationSuggestions.map((suggestion, i) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Database Recommendations */}
          {recommendations && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Database Optimization</h4>
              
              {/* High Priority Indexes */}
              {recommendations.recommendedIndexes
                .filter(idx => idx.priority === 'high')
                .slice(0, 3)
                .map((index, i) => (
                <Alert key={i} className="py-2">
                  <Database className="h-3 w-3" />
                  <AlertDescription className="text-xs">
                    <div className="font-medium">{index.table}</div>
                    <div className="text-muted-foreground">
                      Index: {index.columns.join(', ')}
                    </div>
                    <div className="text-muted-foreground mt-1">
                      {index.reason}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}

              {/* Query Optimizations */}
              <div className="space-y-1">
                <h5 className="text-xs font-medium text-muted-foreground">
                  Query Optimizations
                </h5>
                <div className="text-xs space-y-1">
                  {recommendations.queryOptimizations.slice(0, 3).map((opt, i) => (
                    <div key={i} className="flex items-start gap-1">
                      <span className="text-muted-foreground">•</span>
                      <span>{opt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoadingRecommendations && (
            <div className="text-center py-4">
              <div className="text-sm text-muted-foreground">
                Loading performance recommendations...
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Hook for tracking search performance metrics
 */
export function useSearchPerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | undefined>();
  const [isVisible, setIsVisible] = useState(false);

  const trackPerformance = (newMetrics: PerformanceMetrics) => {
    setMetrics(newMetrics);
    // Auto-show if performance is poor
    if (newMetrics.queryExecutionTime > 1000 || newMetrics.optimizationSuggestions.length > 0) {
      setIsVisible(true);
    }
  };

  const showMonitor = () => setIsVisible(true);
  const hideMonitor = () => setIsVisible(false);

  return {
    metrics,
    isVisible,
    trackPerformance,
    showMonitor,
    hideMonitor,
  };
}