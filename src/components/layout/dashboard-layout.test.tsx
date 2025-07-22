/**
 * Unit tests for DashboardLayout breadcrumb functionality
 */
import { usePathname } from 'next/navigation';

import { render, screen } from '@testing-library/react';

import * as responsive from '@/lib/utils/responsive';

// Import the component after mocking
import { DashboardLayout } from './dashboard-layout';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock the responsive utilities
jest.mock('@/lib/utils/responsive', () => ({
  isMobileForUI: jest.fn(),
}));

// Mock hooks
jest.mock('@/features/providers/hooks/use-provider', () => ({
  useProvider: jest.fn(() => ({ data: null, isLoading: false })),
}));

jest.mock('@/features/organizations/hooks/use-admin-organizations', () => ({
  useAdminOrganization: jest.fn(() => ({ data: null, isLoading: false })),
}));

jest.mock('@/features/providers/hooks/use-current-user-provider', () => ({
  useCurrentUserProvider: jest.fn(() => ({ data: null, isLoading: false })),
}));

jest.mock('@/features/organizations/hooks/use-current-user-organizations', () => ({
  useCurrentUserOrganizations: jest.fn(() => ({ data: [], isLoading: false })),
}));

jest.mock('@/lib/auth/session', () => ({
  useSession: jest.fn(() => ({ data: null, status: 'unauthenticated' })),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockResponsive = responsive as jest.Mocked<typeof responsive>;

describe('DashboardLayout Breadcrumbs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResponsive.isMobileForUI.mockReturnValue(false);
  });

  describe('Desktop breadcrumbs', () => {
    it('should show full breadcrumb path on desktop', () => {
      mockUsePathname.mockReturnValue('/admin/providers/123/calendar');
      mockResponsive.isMobileForUI.mockReturnValue(false);

      render(
        <DashboardLayout>
          <div>Test content</div>
        </DashboardLayout>
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('Providers')).toBeInTheDocument();
      expect(screen.getByText('Calendar')).toBeInTheDocument();
    });

    it('should show provider name when available on desktop', () => {
      const mockProvider = { name: 'Dr. John Smith' };

      jest.doMock('@/features/providers/hooks/use-provider', () => ({
        useProvider: jest.fn(() => ({ data: mockProvider, isLoading: false })),
      }));

      mockUsePathname.mockReturnValue('/admin/providers/123/calendar');
      mockResponsive.isMobileForUI.mockReturnValue(false);

      render(
        <DashboardLayout>
          <div>Test content</div>
        </DashboardLayout>
      );

      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
    });
  });

  describe('Mobile breadcrumbs', () => {
    it('should collapse long breadcrumb paths on mobile', () => {
      mockUsePathname.mockReturnValue('/admin/providers/123/calendar/settings');
      mockResponsive.isMobileForUI.mockReturnValue(true);

      render(
        <DashboardLayout>
          <div>Test content</div>
        </DashboardLayout>
      );

      // Should show Dashboard and last item with ellipsis
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();

      // Should show ellipsis for collapsed items
      expect(screen.getByText('More')).toBeInTheDocument(); // sr-only text in BreadcrumbEllipsis
    });

    it('should truncate long provider names on mobile', () => {
      const mockProvider = { name: 'Dr. Very Long Provider Name That Should Be Truncated' };

      jest.doMock('@/features/providers/hooks/use-provider', () => ({
        useProvider: jest.fn(() => ({ data: mockProvider, isLoading: false })),
      }));

      mockUsePathname.mockReturnValue('/providers/123');
      mockResponsive.isMobileForUI.mockReturnValue(true);

      render(
        <DashboardLayout>
          <div>Test content</div>
        </DashboardLayout>
      );

      // Should show truncated version
      expect(screen.getByText(/Dr\. Very Long\.\.\./)).toBeInTheDocument();
    });

    it('should use smaller text size on mobile', () => {
      mockUsePathname.mockReturnValue('/dashboard');
      mockResponsive.isMobileForUI.mockReturnValue(true);

      render(
        <DashboardLayout>
          <div>Test content</div>
        </DashboardLayout>
      );

      const breadcrumbList = screen.getByRole('list');
      expect(breadcrumbList).toHaveClass('text-xs');
    });

    it('should not collapse short breadcrumb paths on mobile', () => {
      mockUsePathname.mockReturnValue('/dashboard/settings');
      mockResponsive.isMobileForUI.mockReturnValue(true);

      render(
        <DashboardLayout>
          <div>Test content</div>
        </DashboardLayout>
      );

      // Should show all items for short paths
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();

      // Should not show ellipsis
      expect(screen.queryByText('More')).not.toBeInTheDocument();
    });
  });

  describe('Organization breadcrumbs', () => {
    it('should handle organization names correctly', () => {
      const mockOrganization = { name: 'Test Medical Center' };

      jest.doMock('@/features/organizations/hooks/use-admin-organizations', () => ({
        useAdminOrganization: jest.fn(() => ({ data: mockOrganization, isLoading: false })),
      }));

      mockUsePathname.mockReturnValue('/admin/organizations/456/dashboard');
      mockResponsive.isMobileForUI.mockReturnValue(false);

      render(
        <DashboardLayout>
          <div>Test content</div>
        </DashboardLayout>
      );

      expect(screen.getByText('Test Medical Center')).toBeInTheDocument();
    });

    it('should truncate organization names on mobile', () => {
      const mockOrganization = { name: 'Very Long Organization Name That Should Be Truncated' };

      jest.doMock('@/features/organizations/hooks/use-admin-organizations', () => ({
        useAdminOrganization: jest.fn(() => ({ data: mockOrganization, isLoading: false })),
      }));

      mockUsePathname.mockReturnValue('/organizations/456');
      mockResponsive.isMobileForUI.mockReturnValue(true);

      render(
        <DashboardLayout>
          <div>Test content</div>
        </DashboardLayout>
      );

      expect(screen.getByText(/Very Long Org\.\.\./)).toBeInTheDocument();
    });
  });

  describe('Loading states', () => {
    it('should show loading text when provider is loading', () => {
      jest.doMock('@/features/providers/hooks/use-provider', () => ({
        useProvider: jest.fn(() => ({ data: null, isLoading: true })),
      }));

      mockUsePathname.mockReturnValue('/providers/123');
      mockResponsive.isMobileForUI.mockReturnValue(false);

      render(
        <DashboardLayout>
          <div>Test content</div>
        </DashboardLayout>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Responsive behavior', () => {
    it('should update breadcrumbs when screen size changes', () => {
      mockUsePathname.mockReturnValue('/admin/providers/123/calendar/settings');
      mockResponsive.isMobileForUI.mockReturnValue(false);

      const { rerender } = render(
        <DashboardLayout>
          <div>Test content</div>
        </DashboardLayout>
      );

      // Initially should show full breadcrumbs
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('Providers')).toBeInTheDocument();

      // Switch to mobile
      mockResponsive.isMobileForUI.mockReturnValue(true);

      rerender(
        <DashboardLayout>
          <div>Test content</div>
        </DashboardLayout>
      );

      // Should now be collapsed
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
      expect(screen.queryByText('Providers')).not.toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty pathname gracefully', () => {
      mockUsePathname.mockReturnValue('/');
      mockResponsive.isMobileForUI.mockReturnValue(false);

      render(
        <DashboardLayout>
          <div>Test content</div>
        </DashboardLayout>
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('should handle special characters in segment names', () => {
      mockUsePathname.mockReturnValue('/dashboard/user-settings');
      mockResponsive.isMobileForUI.mockReturnValue(false);

      render(
        <DashboardLayout>
          <div>Test content</div>
        </DashboardLayout>
      );

      expect(screen.getByText('User Settings')).toBeInTheDocument();
    });
  });
});
