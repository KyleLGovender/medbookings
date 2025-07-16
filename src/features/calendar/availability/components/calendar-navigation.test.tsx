/**
 * Unit tests for CalendarNavigation component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CalendarNavigation, CalendarViewMode } from './calendar-navigation';
import * as responsive from '@/lib/utils/responsive';

// Mock the responsive utilities
jest.mock('@/lib/utils/responsive', () => ({
  getAllowedCalendarViewModes: jest.fn(),
  isMobileForUI: jest.fn(),
}));

const mockResponsive = responsive as jest.Mocked<typeof responsive>;

describe('CalendarNavigation', () => {
  const mockProps = {
    currentDate: new Date('2024-01-15'),
    viewMode: 'day' as CalendarViewMode,
    onDateChange: jest.fn(),
    onViewModeChange: jest.fn(),
    onTodayClick: jest.fn(),
    recurringView: {
      showAllOccurrences: false,
      highlightSeries: false,
      groupBySeries: false,
      showSeriesNavigator: false,
      expandSeries: [],
    },
    onRecurringViewChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockResponsive.getAllowedCalendarViewModes.mockReturnValue(['day', '3-day', 'week', 'month', 'agenda']);
    mockResponsive.isMobileForUI.mockReturnValue(false);
  });

  describe('Mobile responsive behavior', () => {
    it('should show limited view modes on mobile', () => {
      mockResponsive.getAllowedCalendarViewModes.mockReturnValue(['day', '3-day', 'agenda']);
      mockResponsive.isMobileForUI.mockReturnValue(true);

      render(<CalendarNavigation {...mockProps} />);

      // Open view mode selector
      const viewModeSelect = screen.getByDisplayValue('Day');
      fireEvent.click(viewModeSelect);

      // Should show mobile view modes
      expect(screen.getByText('Day')).toBeInTheDocument();
      expect(screen.getByText('3-Day')).toBeInTheDocument();
      expect(screen.getByText('Agenda')).toBeInTheDocument();
      
      // Should not show week and month
      expect(screen.queryByText('Week')).not.toBeInTheDocument();
      expect(screen.queryByText('Month')).not.toBeInTheDocument();
    });

    it('should show all view modes on desktop', () => {
      mockResponsive.getAllowedCalendarViewModes.mockReturnValue(['day', '3-day', 'week', 'month', 'agenda']);
      mockResponsive.isMobileForUI.mockReturnValue(false);

      render(<CalendarNavigation {...mockProps} />);

      // Open view mode selector
      const viewModeSelect = screen.getByDisplayValue('Day');
      fireEvent.click(viewModeSelect);

      // Should show all view modes
      expect(screen.getByText('Day')).toBeInTheDocument();
      expect(screen.getByText('3-Day')).toBeInTheDocument();
      expect(screen.getByText('Week')).toBeInTheDocument();
      expect(screen.getByText('Month')).toBeInTheDocument();
      expect(screen.getByText('Agenda')).toBeInTheDocument();
    });

    it('should auto-switch to allowed view mode when switching to mobile', async () => {
      // Start on desktop with month view
      const props = { ...mockProps, viewMode: 'month' as CalendarViewMode };
      mockResponsive.getAllowedCalendarViewModes.mockReturnValue(['day', '3-day', 'week', 'month', 'agenda']);
      mockResponsive.isMobileForUI.mockReturnValue(false);

      const { rerender } = render(<CalendarNavigation {...props} />);

      // Switch to mobile (month not allowed)
      mockResponsive.getAllowedCalendarViewModes.mockReturnValue(['day', '3-day', 'agenda']);
      mockResponsive.isMobileForUI.mockReturnValue(true);

      rerender(<CalendarNavigation {...props} />);

      await waitFor(() => {
        expect(mockProps.onViewModeChange).toHaveBeenCalledWith('day');
      });
    });
  });

  describe('View mode navigation', () => {
    it('should navigate dates correctly for 3-day view', () => {
      const props = { ...mockProps, viewMode: '3-day' as CalendarViewMode };
      render(<CalendarNavigation {...props} />);

      // Click next button
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      expect(mockProps.onDateChange).toHaveBeenCalledWith(new Date('2024-01-18'));

      // Click previous button
      const prevButton = screen.getByRole('button', { name: /prev/i });
      fireEvent.click(prevButton);

      expect(mockProps.onDateChange).toHaveBeenCalledWith(new Date('2024-01-12'));
    });

    it('should display correct title for 3-day view', () => {
      const props = { ...mockProps, viewMode: '3-day' as CalendarViewMode };
      render(<CalendarNavigation {...props} />);

      // Should show 3-day range
      expect(screen.getByText(/Jan 14 - Jan 16, 2024/)).toBeInTheDocument();
    });
  });

  describe('Today button', () => {
    it('should call onTodayClick when today button is clicked', () => {
      render(<CalendarNavigation {...mockProps} />);

      const todayButton = screen.getByText('Today');
      fireEvent.click(todayButton);

      expect(mockProps.onTodayClick).toHaveBeenCalled();
    });
  });

  describe('View mode switching', () => {
    it('should call onViewModeChange when view mode is changed', () => {
      render(<CalendarNavigation {...mockProps} />);

      // Open view mode selector
      const viewModeSelect = screen.getByDisplayValue('Day');
      fireEvent.click(viewModeSelect);

      // Select 3-day view
      const threeDayOption = screen.getByText('3-Day');
      fireEvent.click(threeDayOption);

      expect(mockProps.onViewModeChange).toHaveBeenCalledWith('3-day');
    });
  });

  describe('Recurring patterns', () => {
    it('should toggle recurring settings panel', () => {
      render(<CalendarNavigation {...mockProps} />);

      const seriesButton = screen.getByText('Series');
      fireEvent.click(seriesButton);

      expect(screen.getByText('Recurring Pattern View')).toBeInTheDocument();
    });

    it('should update recurring view settings', () => {
      render(<CalendarNavigation {...mockProps} />);

      // Open recurring settings
      const seriesButton = screen.getByText('Series');
      fireEvent.click(seriesButton);

      // Toggle highlight series
      const highlightToggle = screen.getByLabelText('Highlight series');
      fireEvent.click(highlightToggle);

      expect(mockProps.onRecurringViewChange).toHaveBeenCalledWith({
        ...mockProps.recurringView,
        highlightSeries: true,
      });
    });
  });

  describe('Quick navigation', () => {
    it('should show default quick navigation options', () => {
      render(<CalendarNavigation {...mockProps} />);

      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Tomorrow')).toBeInTheDocument();
      expect(screen.getByText('Next Week')).toBeInTheDocument();
      expect(screen.getByText('Next Month')).toBeInTheDocument();
    });

    it('should call onDateChange when quick nav option is clicked', () => {
      render(<CalendarNavigation {...mockProps} />);

      const tomorrowButton = screen.getByText('Tomorrow');
      fireEvent.click(tomorrowButton);

      expect(mockProps.onDateChange).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<CalendarNavigation {...mockProps} />);

      // Check for proper button roles
      expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  describe('Responsive layout', () => {
    it('should handle window resize events', () => {
      render(<CalendarNavigation {...mockProps} />);

      // Simulate window resize
      global.dispatchEvent(new Event('resize'));

      expect(mockResponsive.getAllowedCalendarViewModes).toHaveBeenCalled();
      expect(mockResponsive.isMobileForUI).toHaveBeenCalled();
    });
  });
});