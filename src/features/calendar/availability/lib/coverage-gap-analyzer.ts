'use client';

import { AvailabilityStatus, OrganizationProvider, SlotStatus } from '../types/types';

export interface CoverageGap {
  id: string;
  type: 'no_coverage' | 'insufficient_coverage' | 'skill_gap' | 'location_gap';
  startTime: Date;
  endTime: Date;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affectedLocations: string[];
  requiredSkills: string[];
  suggestedActions: string[];
  impactScore: number;
  coveragePercentage: number;
}

export interface CoverageAnalysis {
  totalGaps: number;
  criticalGaps: number;
  highPriorityGaps: number;
  averageCoveragePercentage: number;
  gaps: CoverageGap[];
  recommendations: string[];
  coverageByHour: Array<{
    hour: number;
    date: Date;
    providerCount: number;
    coveragePercentage: number;
    gaps: CoverageGap[];
  }>;
}

export interface CoverageRequirements {
  minProvidersPerHour: number;
  requiredSkills: string[];
  businessHours: { start: number; end: number };
  workingDays: number[]; // 0-6, Sunday-Saturday
  locationRequirements: Array<{
    locationId: string;
    minProviders: number;
    requiredSkills: string[];
  }>;
}

export class CoverageGapAnalyzer {
  private requirements: CoverageRequirements;

  constructor(requirements: CoverageRequirements) {
    this.requirements = requirements;
  }

  analyzeCoverage(
    providers: OrganizationProvider[],
    startDate: Date,
    endDate: Date
  ): CoverageAnalysis {
    const gaps: CoverageGap[] = [];
    const coverageByHour: CoverageAnalysis['coverageByHour'] = [];

    // Analyze each hour within the date range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Only analyze working days
      if (this.requirements.workingDays.includes(currentDate.getDay())) {
        for (
          let hour = this.requirements.businessHours.start;
          hour < this.requirements.businessHours.end;
          hour++
        ) {
          const hourlyAnalysis = this.analyzeHourlyCoverage(providers, currentDate, hour);
          coverageByHour.push(hourlyAnalysis);

          // Identify gaps for this hour
          const hourGaps = this.identifyHourlyGaps(hourlyAnalysis, currentDate, hour);
          gaps.push(...hourGaps);
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate overall metrics
    const totalGaps = gaps.length;
    const criticalGaps = gaps.filter((g) => g.severity === 'critical').length;
    const highPriorityGaps = gaps.filter((g) => g.severity === 'high').length;
    const averageCoveragePercentage =
      coverageByHour.reduce((sum, h) => sum + h.coveragePercentage, 0) / coverageByHour.length;

    // Generate recommendations
    const recommendations = this.generateRecommendations(gaps, coverageByHour);

    return {
      totalGaps,
      criticalGaps,
      highPriorityGaps,
      averageCoveragePercentage,
      gaps,
      recommendations,
      coverageByHour,
    };
  }

  private analyzeHourlyCoverage(
    providers: OrganizationProvider[],
    date: Date,
    hour: number
  ): CoverageAnalysis['coverageByHour'][0] {
    const hourDate = new Date(date);
    hourDate.setHours(hour, 0, 0, 0);

    // Count available providers for this hour
    const availableProviders = providers.filter((provider) => {
      return this.isProviderAvailable(provider, hourDate);
    });

    const providerCount = availableProviders.length;
    const coveragePercentage = Math.min(
      100,
      (providerCount / this.requirements.minProvidersPerHour) * 100
    );

    return {
      hour,
      date: hourDate,
      providerCount,
      coveragePercentage,
      gaps: [], // Will be populated by identifyHourlyGaps
    };
  }

  private isProviderAvailable(provider: OrganizationProvider, targetTime: Date): boolean {
    // Check if provider is active
    if (!provider.isActive) return false;

    // Check working hours
    const targetHour = targetTime.getHours();
    const workingStart = parseInt(provider.workingHours.start.split(':')[0]);
    const workingEnd = parseInt(provider.workingHours.end.split(':')[0]);

    if (targetHour < workingStart || targetHour >= workingEnd) return false;

    // Check if provider has availability at this time
    const hasAvailability = provider.events.some((event) => {
      if (event.type !== 'availability') return false;
      if (event.status !== AvailabilityStatus.ACCEPTED) return false;

      return event.startTime <= targetTime && event.endTime > targetTime;
    });

    // Check if provider is booked at this time
    const isBooked = provider.events.some((event) => {
      if (event.type !== 'booking') return false;
      if (event.status !== SlotStatus.BOOKED) return false;

      return event.startTime <= targetTime && event.endTime > targetTime;
    });

    return hasAvailability && !isBooked;
  }

  private identifyHourlyGaps(
    hourlyAnalysis: CoverageAnalysis['coverageByHour'][0],
    date: Date,
    hour: number
  ): CoverageGap[] {
    const gaps: CoverageGap[] = [];
    const endTime = new Date(date);
    endTime.setHours(hour + 1, 0, 0, 0);

    // No coverage gap
    if (hourlyAnalysis.providerCount === 0) {
      gaps.push({
        id: `no-coverage-${date.toISOString().split('T')[0]}-${hour}`,
        type: 'no_coverage',
        startTime: hourlyAnalysis.date,
        endTime,
        severity: 'critical',
        description: 'No providers available during business hours',
        affectedLocations: [],
        requiredSkills: this.requirements.requiredSkills,
        suggestedActions: [
          'Schedule additional provider availability',
          'Consider hiring additional staff',
          'Adjust working hours or requirements',
        ],
        impactScore: 100,
        coveragePercentage: 0,
      });
    }
    // Insufficient coverage gap
    else if (hourlyAnalysis.providerCount < this.requirements.minProvidersPerHour) {
      const severity = this.calculateSeverity(hourlyAnalysis.coveragePercentage);
      gaps.push({
        id: `insufficient-coverage-${date.toISOString().split('T')[0]}-${hour}`,
        type: 'insufficient_coverage',
        startTime: hourlyAnalysis.date,
        endTime,
        severity,
        description: `Only ${hourlyAnalysis.providerCount} of ${this.requirements.minProvidersPerHour} required providers available`,
        affectedLocations: [],
        requiredSkills: this.requirements.requiredSkills,
        suggestedActions: [
          'Request additional availability from existing providers',
          'Redistribute workload across time slots',
          'Consider temporary staffing solutions',
        ],
        impactScore: 100 - hourlyAnalysis.coveragePercentage,
        coveragePercentage: hourlyAnalysis.coveragePercentage,
      });
    }

    return gaps;
  }

  private calculateSeverity(coveragePercentage: number): CoverageGap['severity'] {
    if (coveragePercentage < 25) return 'critical';
    if (coveragePercentage < 50) return 'high';
    if (coveragePercentage < 75) return 'medium';
    return 'low';
  }

  private generateRecommendations(
    gaps: CoverageGap[],
    coverageByHour: CoverageAnalysis['coverageByHour']
  ): string[] {
    const recommendations: string[] = [];

    // Analyze patterns
    const criticalHours = coverageByHour.filter((h) => h.coveragePercentage < 50);
    const lowCoverageHours = coverageByHour.filter((h) => h.coveragePercentage < 75);

    if (criticalHours.length > 0) {
      const criticalTimes = criticalHours.map((h) => `${h.hour}:00`).join(', ');
      recommendations.push(
        `Critical coverage gaps identified at ${criticalTimes}. Consider immediate staffing adjustments.`
      );
    }

    if (lowCoverageHours.length > coverageByHour.length * 0.3) {
      recommendations.push(
        'More than 30% of business hours have insufficient coverage. Review overall staffing levels.'
      );
    }

    // Pattern-based recommendations
    const morningGaps = gaps.filter((g) => {
      const hour = g.startTime.getHours();
      return hour >= 8 && hour < 12;
    });

    const afternoonGaps = gaps.filter((g) => {
      const hour = g.startTime.getHours();
      return hour >= 12 && hour < 17;
    });

    const eveningGaps = gaps.filter((g) => {
      const hour = g.startTime.getHours();
      return hour >= 17 && hour < 20;
    });

    if (morningGaps.length > afternoonGaps.length + eveningGaps.length) {
      recommendations.push(
        'Consider incentivizing morning shifts or adjusting morning staffing requirements.'
      );
    }

    if (eveningGaps.length > morningGaps.length + afternoonGaps.length) {
      recommendations.push(
        'Evening coverage is consistently low. Consider evening shift premiums or flexible scheduling.'
      );
    }

    // Skill-based recommendations
    const skillGaps = gaps.filter((g) => g.type === 'skill_gap');
    if (skillGaps.length > 0) {
      recommendations.push(
        'Skill gaps identified. Consider cross-training staff or hiring specialists.'
      );
    }

    // Location-based recommendations
    const locationGaps = gaps.filter((g) => g.type === 'location_gap');
    if (locationGaps.length > 0) {
      recommendations.push(
        'Location-specific gaps found. Review provider assignments and location requirements.'
      );
    }

    return recommendations;
  }

  // Helper method to get default requirements for healthcare organizations
  static getDefaultRequirements(): CoverageRequirements {
    return {
      minProvidersPerHour: 2,
      requiredSkills: ['General Practice', 'Emergency Response'],
      businessHours: { start: 8, end: 18 },
      workingDays: [1, 2, 3, 4, 5], // Monday-Friday
      locationRequirements: [],
    };
  }

  // Helper method to analyze coverage trends
  static analyzeTrends(analyses: Array<{ date: Date; analysis: CoverageAnalysis }>): {
    trend: 'improving' | 'declining' | 'stable';
    trendPercentage: number;
    insights: string[];
  } {
    if (analyses.length < 2) {
      return { trend: 'stable', trendPercentage: 0, insights: [] };
    }

    const recent = analyses[analyses.length - 1];
    const previous = analyses[analyses.length - 2];

    const coverageChange =
      recent.analysis.averageCoveragePercentage - previous.analysis.averageCoveragePercentage;
    const gapChange = recent.analysis.totalGaps - previous.analysis.totalGaps;

    let trend: 'improving' | 'declining' | 'stable';
    if (coverageChange > 5 && gapChange < 0) {
      trend = 'improving';
    } else if (coverageChange < -5 || gapChange > 0) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }

    const insights: string[] = [];
    if (Math.abs(coverageChange) > 10) {
      insights.push(
        `Coverage has ${coverageChange > 0 ? 'improved' : 'declined'} by ${Math.abs(coverageChange).toFixed(1)}%`
      );
    }

    if (Math.abs(gapChange) > 2) {
      insights.push(
        `${gapChange > 0 ? 'Increased' : 'Decreased'} by ${Math.abs(gapChange)} coverage gaps`
      );
    }

    return {
      trend,
      trendPercentage: Math.abs(coverageChange),
      insights,
    };
  }
}
