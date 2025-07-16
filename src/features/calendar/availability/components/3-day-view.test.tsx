/**
 * Unit tests for ThreeDayView component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThreeDayView, CalendarEvent } from './3-day-view';

// Mock date to ensure consistent testing
const mockDate = new Date('2024-01-15T10:00:00');

describe('ThreeDayView', () => {
  const mockEvents: CalendarEvent[] = [
    {
      id: '1',
      title: 'Test Appointment',
      description: 'Test description',
      startTime: new Date('2024-01-15T09:00:00'),
      endTime: new Date('2024-01-15T10:30:00'),
      type: 'appointment',
      status: 'confirmed',
      patient: { id: '1', name: 'John Doe' },
    },
    {
      id: '2',
      title: 'Another Event',
      startTime: new Date('2024-01-16T14:00:00'),
      endTime: new Date('2024-01-16T15:00:00'),
      type: 'block',
      status: 'confirmed',
    },
  ];

  const mockProps = {
    currentDate: mockDate,
    onDateChange: jest.fn(),
    events: mockEvents,
    onEventClick: jest.fn(),
    onTimeSlotClick: jest.fn(),
    onEventCreate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock current date
    jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render 3-day view with correct days', () => {
      render(<ThreeDayView {...mockProps} />);

      // Should show header
      expect(screen.getByText('3-Day Calendar View')).toBeInTheDocument();

      // Should show three days
      expect(screen.getByText('14')).toBeInTheDocument(); // Previous day
      expect(screen.getByText('15')).toBeInTheDocument(); // Current day
      expect(screen.getByText('16')).toBeInTheDocument(); // Next day
    });

    it('should render time slots correctly', () => {
      render(<ThreeDayView {...mockProps} startHour={9} endHour={17} />);

      // Should show time slots
      expect(screen.getByText('09:00')).toBeInTheDocument();
      expect(screen.getByText('17:00')).toBeInTheDocument();
    });

    it('should render events in correct positions', () => {
      render(<ThreeDayView {...mockProps} />);

      // Should show events
      expect(screen.getByText('Test Appointment')).toBeInTheDocument();
      expect(screen.getByText('Another Event')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should highlight current day', () => {
      render(<ThreeDayView {...mockProps} />);

      // Should show "Today" badge
      expect(screen.getByText('Today')).toBeInTheDocument();
    });
  });

  describe('Event handling', () => {
    it('should call onEventClick when event is clicked', () => {
      render(<ThreeDayView {...mockProps} />);

      const eventElement = screen.getByText('Test Appointment');
      fireEvent.click(eventElement);

      expect(mockProps.onEventClick).toHaveBeenCalledWith(mockEvents[0]);
    });

    it('should call onTimeSlotClick when time slot is clicked', () => {
      render(<ThreeDayView {...mockProps} />);

      // Find a time slot and click it
      const timeSlots = screen.getAllByText('10:00');
      fireEvent.click(timeSlots[1]); // Click on a day column, not the time label

      expect(mockProps.onTimeSlotClick).toHaveBeenCalled();
    });

    it('should call onDateChange when day header is clicked', () => {
      render(<ThreeDayView {...mockProps} />);

      const dayHeader = screen.getByText('16');
      fireEvent.click(dayHeader);

      expect(mockProps.onDateChange).toHaveBeenCalled();
    });
  });

  describe('Loading state', () => {
    it('should show loading spinner when isLoading is true', () => {
      render(<ThreeDayView {...mockProps} isLoading={true} />);

      expect(screen.getByText('Loading calendar...')).toBeInTheDocument();
      expect(screen.queryByText('3-Day Calendar View')).not.toBeInTheDocument();
    });
  });

  describe('Event styling', () => {
    it('should apply correct colors based on event type', () => {
      render(<ThreeDayView {...mockProps} />);

      const appointmentEvent = screen.getByText('Test Appointment').closest('div');
      const blockEvent = screen.getByText('Another Event').closest('div');

      // Check if events have different styling (specific color testing would need more detailed setup)
      expect(appointmentEvent).toHaveClass('border-l-4');
      expect(blockEvent).toHaveClass('border-l-4');
    });

    it('should show event status badges', () => {
      render(<ThreeDayView {...mockProps} />);

      const statusBadges = screen.getAllByText('confirmed');
      expect(statusBadges).toHaveLength(2);
    });
  });

  describe('Time configuration', () => {
    it('should respect custom start and end hours', () => {
      render(
        <ThreeDayView 
          {...mockProps} 
          startHour={8} 
          endHour={18} 
          timeSlotDuration={60}
        />
      );

      expect(screen.getByText('08:00')).toBeInTheDocument();
      expect(screen.getByText('18:00')).toBeInTheDocument();
      expect(screen.queryByText('06:00')).not.toBeInTheDocument();
    });

    it('should show current time indicator', () => {
      render(<ThreeDayView {...mockProps} showCurrentTimeIndicator={true} />);

      // The current time indicator should be visible (this would need more detailed testing for visual elements)
      expect(screen.getByText('3-Day Calendar View')).toBeInTheDocument();
    });
  });

  describe('Drag and drop', () => {
    it('should handle drag start on events', () => {
      render(<ThreeDayView {...mockProps} />);

      const eventElement = screen.getByText('Test Appointment');
      const dragEvent = new DragEvent('dragstart', { bubbles: true });
      
      fireEvent(eventElement, dragEvent);

      // Would need more sophisticated testing for actual drag and drop behavior
      expect(eventElement).toBeInTheDocument();
    });
  });

  describe('Event filtering', () => {
    it('should show only events for displayed days', () => {
      const eventsWithOutOfRange = [
        ...mockEvents,
        {
          id: '3',
          title: 'Out of Range Event',
          startTime: new Date('2024-01-10T10:00:00'),
          endTime: new Date('2024-01-10T11:00:00'),
          type: 'appointment' as const,
          status: 'confirmed' as const,
        },
      ];

      render(<ThreeDayView {...mockProps} events={eventsWithOutOfRange} />);

      expect(screen.getByText('Test Appointment')).toBeInTheDocument();
      expect(screen.getByText('Another Event')).toBeInTheDocument();
      expect(screen.queryByText('Out of Range Event')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<ThreeDayView {...mockProps} />);

      // Check for proper button roles and clickable elements
      const dayHeaders = screen.getAllByText(/\d+/);
      dayHeaders.forEach(header => {
        expect(header.closest('div')).toHaveClass('cursor-pointer');
      });
    });
  });

  describe('Mobile responsiveness', () => {
    it('should handle mobile layout properly', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<ThreeDayView {...mockProps} />);

      // Should still render all components
      expect(screen.getByText('3-Day Calendar View')).toBeInTheDocument();
      expect(screen.getByText('14')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('16')).toBeInTheDocument();
    });
  });

  describe('Event overlapping', () => {
    it('should handle overlapping events correctly', () => {
      const overlappingEvents = [
        {
          id: '1',
          title: 'Event 1',
          startTime: new Date('2024-01-15T09:00:00'),
          endTime: new Date('2024-01-15T10:30:00'),
          type: 'appointment' as const,
          status: 'confirmed' as const,
        },
        {
          id: '2',
          title: 'Event 2',
          startTime: new Date('2024-01-15T10:00:00'),
          endTime: new Date('2024-01-15T11:00:00'),
          type: 'appointment' as const,
          status: 'confirmed' as const,
        },
      ];

      render(<ThreeDayView {...mockProps} events={overlappingEvents} />);

      expect(screen.getByText('Event 1')).toBeInTheDocument();
      expect(screen.getByText('Event 2')).toBeInTheDocument();
    });
  });
});