/**
 * Unit tests for ProviderCalendarView responsive stats layout
 */

import { render, screen } from '@testing-library/react';
import { ProviderCalendarView } from './provider-calendar-view';

// Mock the hooks and dependencies
jest.mock('../hooks/use-availability', () => ({
  useAvailabilitySearch: jest.fn(() => ({ data: [], isLoading: false })),
}));

jest.mock('@/features/providers/hooks/use-provider', () => ({
  useProvider: jest.fn(() => ({ 
    data: { 
      id: '1', 
      name: 'Dr. Test Provider',
      specialty: 'Cardiology' 
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

describe('ProviderCalendarView Stats Layout', () => {
  const mockProps = {
    providerId: 'test-provider-id',
    currentDate: new Date('2024-01-15'),
    onDateChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stats grid responsive behavior', () => {
    it('should render stats with responsive grid classes', () => {
      render(<ProviderCalendarView {...mockProps} />);

      // Find the stats container
      const statsContainer = screen.getByText('Utilization').closest('.grid');
      expect(statsContainer).toHaveClass('grid-cols-2');
      expect(statsContainer).toHaveClass('md:grid-cols-4');
      expect(statsContainer).toHaveClass('gap-3');
      expect(statsContainer).toHaveClass('md:gap-4');
    });

    it('should render stat numbers with responsive text sizing', () => {
      render(<ProviderCalendarView {...mockProps} />);

      // Check utilization stat number has responsive text classes
      const utilizationStat = screen.getByText(/\d+%/);
      expect(utilizationStat).toHaveClass('text-lg');
      expect(utilizationStat).toHaveClass('md:text-2xl');
    });

    it('should render all four stats with proper labels', () => {
      render(<ProviderCalendarView {...mockProps} />);

      // Check all stat labels are present
      expect(screen.getByText('Utilization')).toBeInTheDocument();
      expect(screen.getByText('Booked Hours')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('should maintain proper text color coding for stats', () => {
      render(<ProviderCalendarView {...mockProps} />);

      // Find stats by their labels and check parent containers have proper colors
      const utilizationContainer = screen.getByText('Utilization').previousSibling;
      const bookedHoursContainer = screen.getByText('Booked Hours').previousSibling;
      const pendingContainer = screen.getByText('Pending').previousSibling;
      const completedContainer = screen.getByText('Completed').previousSibling;

      expect(utilizationContainer).toHaveClass('text-blue-600');
      expect(bookedHoursContainer).toHaveClass('text-green-600');
      expect(pendingContainer).toHaveClass('text-orange-600');
      expect(completedContainer).toHaveClass('text-purple-600');
    });
  });

  describe('Mobile layout optimization', () => {
    it('should use smaller gaps on mobile', () => {
      render(<ProviderCalendarView {...mockProps} />);

      const statsContainer = screen.getByText('Utilization').closest('.grid');
      expect(statsContainer).toHaveClass('gap-3');
    });

    it('should use 2-column layout on mobile', () => {
      render(<ProviderCalendarView {...mockProps} />);

      const statsContainer = screen.getByText('Utilization').closest('.grid');
      expect(statsContainer).toHaveClass('grid-cols-2');
    });

    it('should expand to 4-column layout on medium screens and up', () => {
      render(<ProviderCalendarView {...mockProps} />);

      const statsContainer = screen.getByText('Utilization').closest('.grid');
      expect(statsContainer).toHaveClass('md:grid-cols-4');
    });
  });

  describe('Accessibility', () => {
    it('should maintain readable text sizes across breakpoints', () => {
      render(<ProviderCalendarView {...mockProps} />);

      // All stat numbers should have both mobile and desktop text sizes
      const statNumbers = screen.getAllByText(/\d+/);
      statNumbers.forEach(stat => {
        if (stat.classList.contains('font-bold')) {
          expect(stat).toHaveClass('text-lg');
          expect(stat).toHaveClass('md:text-2xl');
        }
      });
    });

    it('should maintain consistent label text size', () => {
      render(<ProviderCalendarView {...mockProps} />);

      const labels = ['Utilization', 'Booked Hours', 'Pending', 'Completed'];
      labels.forEach(label => {
        const labelElement = screen.getByText(label);
        expect(labelElement).toHaveClass('text-xs');
        expect(labelElement).toHaveClass('text-muted-foreground');
      });
    });
  });

  describe('Content display', () => {
    it('should display numeric stats correctly', () => {
      render(<ProviderCalendarView {...mockProps} />);

      // Should display percentage for utilization
      expect(screen.getByText(/\d+%/)).toBeInTheDocument();
      
      // Should display numeric values for other stats
      expect(screen.getAllByText(/\d+/).length).toBeGreaterThan(0);
    });

    it('should handle loading states gracefully', () => {
      // This would test loading states when the data is loading
      render(<ProviderCalendarView {...mockProps} />);
      
      // Basic render test - more sophisticated loading state testing would 
      // require mocking the loading states in the hooks
      expect(screen.getByText('Dr. Test Provider')).toBeInTheDocument();
    });
  });

  describe('Layout consistency', () => {
    it('should maintain centered text alignment', () => {
      render(<ProviderCalendarView {...mockProps} />);

      const statsContainer = screen.getByText('Utilization').closest('.grid');
      expect(statsContainer).toHaveClass('text-center');
    });

    it('should preserve grid structure integrity', () => {
      render(<ProviderCalendarView {...mockProps} />);

      // Ensure the grid container has all necessary classes for responsive behavior
      const statsContainer = screen.getByText('Utilization').closest('.grid');
      expect(statsContainer).toHaveClass('grid');
      expect(statsContainer).toHaveClass('grid-cols-2');
      expect(statsContainer).toHaveClass('md:grid-cols-4');
      expect(statsContainer).toHaveClass('text-center');
    });
  });
});