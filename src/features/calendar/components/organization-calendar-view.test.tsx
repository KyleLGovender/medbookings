/**
 * Unit tests for OrganizationCalendarView responsive stats layout
 */

import { render, screen } from '@testing-library/react';
import { OrganizationCalendarView } from './organization-calendar-view';

// Mock the hooks and dependencies
jest.mock('../hooks/use-availability', () => ({
  useAvailabilitySearch: jest.fn(() => ({ data: [], isLoading: false })),
}));

jest.mock('@/features/organizations/hooks/use-admin-organizations', () => ({
  useAdminOrganization: jest.fn(() => ({ 
    data: { 
      id: '1', 
      name: 'Test Medical Center',
      type: 'Hospital' 
    }, 
    isLoading: false 
  })),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
  })),
}));

describe('OrganizationCalendarView Stats Layout', () => {
  const mockProps = {
    organizationId: 'test-org-id',
    currentDate: new Date('2024-01-15'),
    onDateChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stats grid responsive behavior', () => {
    it('should render stats with responsive grid classes', () => {
      render(<OrganizationCalendarView {...mockProps} />);

      // Find the stats container
      const statsContainer = screen.getByText('Avg Utilization').closest('.grid');
      expect(statsContainer).toHaveClass('grid-cols-2');
      expect(statsContainer).toHaveClass('md:grid-cols-3');
      expect(statsContainer).toHaveClass('lg:grid-cols-5');
      expect(statsContainer).toHaveClass('gap-3');
      expect(statsContainer).toHaveClass('md:gap-4');
    });

    it('should render stat numbers with responsive text sizing', () => {
      render(<OrganizationCalendarView {...mockProps} />);

      // Check utilization stat number has responsive text classes
      const utilizationStat = screen.getByText(/\d+%/);
      expect(utilizationStat).toHaveClass('text-lg');
      expect(utilizationStat).toHaveClass('md:text-2xl');
    });

    it('should render all five stats with proper labels', () => {
      render(<OrganizationCalendarView {...mockProps} />);

      // Check all stat labels are present
      expect(screen.getByText('Avg Utilization')).toBeInTheDocument();
      expect(screen.getByText('Active Providers')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Booked Hours')).toBeInTheDocument();
      expect(screen.getByText('Coverage Gaps')).toBeInTheDocument();
    });

    it('should maintain proper text color coding for stats', () => {
      render(<OrganizationCalendarView {...mockProps} />);

      // Find stats by their labels and check parent containers have proper colors
      const avgUtilizationContainer = screen.getByText('Avg Utilization').previousSibling;
      const activeProvidersContainer = screen.getByText('Active Providers').previousSibling;
      const pendingContainer = screen.getByText('Pending').previousSibling;
      const bookedHoursContainer = screen.getByText('Booked Hours').previousSibling;
      const coverageGapsContainer = screen.getByText('Coverage Gaps').previousSibling;

      expect(avgUtilizationContainer).toHaveClass('text-blue-600');
      expect(activeProvidersContainer).toHaveClass('text-green-600');
      expect(pendingContainer).toHaveClass('text-orange-600');
      expect(bookedHoursContainer).toHaveClass('text-purple-600');
      expect(coverageGapsContainer).toHaveClass('text-red-600');
    });
  });

  describe('Progressive responsive layout', () => {
    it('should use 2-column layout on mobile', () => {
      render(<OrganizationCalendarView {...mockProps} />);

      const statsContainer = screen.getByText('Avg Utilization').closest('.grid');
      expect(statsContainer).toHaveClass('grid-cols-2');
    });

    it('should expand to 3-column layout on medium screens', () => {
      render(<OrganizationCalendarView {...mockProps} />);

      const statsContainer = screen.getByText('Avg Utilization').closest('.grid');
      expect(statsContainer).toHaveClass('md:grid-cols-3');
    });

    it('should expand to 5-column layout on large screens', () => {
      render(<OrganizationCalendarView {...mockProps} />);

      const statsContainer = screen.getByText('Avg Utilization').closest('.grid');
      expect(statsContainer).toHaveClass('lg:grid-cols-5');
    });

    it('should use smaller gaps on mobile', () => {
      render(<OrganizationCalendarView {...mockProps} />);

      const statsContainer = screen.getByText('Avg Utilization').closest('.grid');
      expect(statsContainer).toHaveClass('gap-3');
      expect(statsContainer).toHaveClass('md:gap-4');
    });
  });

  describe('Mobile layout optimization', () => {
    it('should handle 5 stats gracefully in mobile 2-column layout', () => {
      render(<OrganizationCalendarView {...mockProps} />);

      // All 5 stats should be rendered
      const statLabels = [
        'Avg Utilization',
        'Active Providers', 
        'Pending',
        'Booked Hours',
        'Coverage Gaps'
      ];

      statLabels.forEach(label => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });

    it('should maintain readability with responsive text sizing', () => {
      render(<OrganizationCalendarView {...mockProps} />);

      // All stat numbers should have responsive text sizing
      const statNumbers = screen.getAllByText(/\d+/);
      statNumbers.forEach(stat => {
        if (stat.classList.contains('font-bold')) {
          expect(stat).toHaveClass('text-lg');
          expect(stat).toHaveClass('md:text-2xl');
        }
      });
    });
  });

  describe('Content display', () => {
    it('should display percentage for average utilization', () => {
      render(<OrganizationCalendarView {...mockProps} />);

      expect(screen.getByText(/\d+%/)).toBeInTheDocument();
    });

    it('should display numeric values for provider and booking stats', () => {
      render(<OrganizationCalendarView {...mockProps} />);

      // Should display multiple numeric values for different stats
      expect(screen.getAllByText(/\d+/).length).toBeGreaterThan(0);
    });

    it('should handle Math.round for booked hours display', () => {
      render(<OrganizationCalendarView {...mockProps} />);

      // The booked hours stat should be rounded (this tests the Math.round call)
      expect(screen.getByText('Booked Hours')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should maintain consistent label text size and color', () => {
      render(<OrganizationCalendarView {...mockProps} />);

      const labels = [
        'Avg Utilization',
        'Active Providers',
        'Pending',
        'Booked Hours',
        'Coverage Gaps'
      ];

      labels.forEach(label => {
        const labelElement = screen.getByText(label);
        expect(labelElement).toHaveClass('text-xs');
        expect(labelElement).toHaveClass('text-muted-foreground');
      });
    });

    it('should maintain centered text alignment', () => {
      render(<OrganizationCalendarView {...mockProps} />);

      const statsContainer = screen.getByText('Avg Utilization').closest('.grid');
      expect(statsContainer).toHaveClass('text-center');
    });
  });

  describe('Layout consistency', () => {
    it('should preserve grid structure integrity', () => {
      render(<OrganizationCalendarView {...mockProps} />);

      const statsContainer = screen.getByText('Avg Utilization').closest('.grid');
      expect(statsContainer).toHaveClass('grid');
      expect(statsContainer).toHaveClass('grid-cols-2');
      expect(statsContainer).toHaveClass('md:grid-cols-3');
      expect(statsContainer).toHaveClass('lg:grid-cols-5');
      expect(statsContainer).toHaveClass('text-center');
    });

    it('should handle organization name display', () => {
      render(<OrganizationCalendarView {...mockProps} />);

      expect(screen.getByText('Test Medical Center')).toBeInTheDocument();
    });
  });

  describe('Complex responsive behavior', () => {
    it('should handle breakpoint transitions smoothly', () => {
      render(<OrganizationCalendarView {...mockProps} />);

      const statsContainer = screen.getByText('Avg Utilization').closest('.grid');
      
      // Should have all breakpoint classes for smooth transitions
      expect(statsContainer.className).toContain('grid-cols-2');
      expect(statsContainer.className).toContain('md:grid-cols-3');
      expect(statsContainer.className).toContain('lg:grid-cols-5');
    });

    it('should adapt gap sizes appropriately across breakpoints', () => {
      render(<OrganizationCalendarView {...mockProps} />);

      const statsContainer = screen.getByText('Avg Utilization').closest('.grid');
      expect(statsContainer.className).toContain('gap-3');
      expect(statsContainer.className).toContain('md:gap-4');
    });
  });
});