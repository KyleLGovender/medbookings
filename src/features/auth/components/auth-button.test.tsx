import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Session } from 'next-auth';

import AuthButton from './auth-button';

// Mock next-auth/react
const mockSignIn = jest.fn();
const mockSignOut = jest.fn();
let mockSessionData: {
  data: Session | null;
  status: 'authenticated' | 'unauthenticated' | 'loading';
} = {
  data: null,
  status: 'unauthenticated',
};

jest.mock('next-auth/react', () => ({
  ...jest.requireActual('next-auth/react'),
  useSession: jest.fn(() => mockSessionData),
  signIn: jest.fn((...args) => mockSignIn(...args)),
  signOut: jest.fn((...args) => mockSignOut(...args)),
}));

// Helper to set session state for tests
const setMockSession = (session: {
  data: Session | null;
  status: 'authenticated' | 'unauthenticated' | 'loading';
}) => {
  mockSessionData = session;
};

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { fill, unoptimized, priority, loading, quality, ...imgProps } = props;
    // Ensure alt is explicitly handled. If AuthButton passes undefined for alt,
    // it would become an empty string here, matching next/image's default.
    // The key is what AuthButton passes as props.alt.
    return <img {...imgProps} alt={imgProps.alt === undefined ? '' : imgProps.alt} />;
  },
}));

// Mock window.Image for testing image preloading
const mockImageInstance = {
  onload: jest.fn(),
  onerror: jest.fn(),
  src: '',
};

beforeAll(() => {
  // @ts-ignore
  global.Image = jest.fn(() => mockImageInstance);
});

describe('AuthButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window.Image mock state
    mockImageInstance.onload = jest.fn();
    mockImageInstance.onerror = jest.fn();
    mockImageInstance.src = '';
    (global.Image as jest.Mock).mockClear();
  });

  describe('Unauthenticated state', () => {
    beforeEach(() => {
      setMockSession({ data: null, status: 'unauthenticated' });
    });

    test('renders Sign in button', () => {
      render(<AuthButton />);
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByText('Sign in')).toBeInTheDocument();
      // Check for SVG presence by a known attribute or structure if needed
    });

    test('calls signIn on button click', () => {
      render(<AuthButton />);
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      expect(mockSignIn).toHaveBeenCalledTimes(1);
      expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/profile' });
    });
  });

  describe('Loading state', () => {
    beforeEach(() => {
      setMockSession({ data: null, status: 'loading' });
    });

    test('renders loading indicator (initials as "...")', () => {
      render(<AuthButton />);
      expect(screen.getByRole('button', { name: /open user menu/i })).toBeInTheDocument();
      expect(screen.getByText('...')).toBeInTheDocument();
    });

    test('does not render dropdown menu in loading state', () => {
      render(<AuthButton />);
      // MenuItems are conditionally rendered, so queryBy should be used.
      expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated state', () => {
    const mockUser: Session['user'] = {
      id: 'user123',
      name: 'Test User',
      email: 'test@example.com',
      image: 'http://example.com/avatar.png',
      role: 'USER', // Assuming 'USER' is a valid UserRole
    };
    const mockUserNoName: Session['user'] = {
      id: 'user456',
      email: 'noname@example.com',
      image: null,
      role: 'USER', // Assuming 'USER' is a valid UserRole
    };
    const mockUserNoImage: Session['user'] = {
      id: 'user789',
      name: 'No Image User',
      email: 'noimage@example.com',
      image: null,
      role: 'USER', // Assuming 'USER' is a valid UserRole
    };

    const profileMenuItems = [
      { label: 'Profile', href: '/profile' },
      { label: 'Settings', href: '/settings' },
    ];

    test('renders user initial if no image', () => {
      setMockSession({
        data: { user: mockUserNoImage, expires: 'never' },
        status: 'authenticated',
      });
      render(<AuthButton />);
      expect(screen.getByText(mockUserNoImage.name![0])).toBeInTheDocument();
    });

    test('renders "?" if no name and no image', () => {
      setMockSession({ data: { user: mockUserNoName, expires: 'never' }, status: 'authenticated' });
      render(<AuthButton />);
      expect(screen.getByText('?')).toBeInTheDocument();
    });

    test('renders user image after it loads', async () => {
      setMockSession({ data: { user: mockUser, expires: 'never' }, status: 'authenticated' });
      render(<AuthButton />);
      // Initially, initials might be shown or just the container
      expect(screen.getByText(mockUser.name![0])).toBeInTheDocument(); // Check initial

      // Simulate image load
      act(() => {
        mockImageInstance.onload();
      });

      await waitFor(() => {
        const img = screen.getByRole('img', { name: mockUser.name! }); // Expect alt text to be user's name
        expect(img).toHaveAttribute('src', mockUser.image);
      });
      // After image load, the initial should ideally not be visible if image covers it.
      // This depends on exact styling, for now we check image presence.
    });

    test('renders user initial if image fails to load', async () => {
      setMockSession({ data: { user: mockUser, expires: 'never' }, status: 'authenticated' });
      render(<AuthButton />);
      expect(screen.getByText(mockUser.name![0])).toBeInTheDocument(); // Check initial

      // Simulate image error
      act(() => {
        mockImageInstance.onerror();
      });

      await waitFor(() => {
        expect(screen.getByText(mockUser.name![0])).toBeInTheDocument();
        expect(screen.queryByRole('img', { name: '' })).not.toBeInTheDocument();
      });
    });

    test('opens dropdown, shows custom items, and calls signOut', () => {
      setMockSession({ data: { user: mockUser, expires: 'never' }, status: 'authenticated' });
      render(<AuthButton profileMenuItems={profileMenuItems} />);

      const menuButton = screen.getByRole('button', { name: /open user menu/i });
      fireEvent.click(menuButton);

      profileMenuItems.forEach((item) => {
        expect(screen.getByRole('menuitem', { name: item.label })).toHaveAttribute(
          'href',
          item.href
        );
      });

      const signOutButton = screen.getByRole('menuitem', { name: /sign out/i });
      expect(signOutButton).toBeInTheDocument();
      fireEvent.click(signOutButton);
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' });
    });
  });
});
