# Custom Hooks Documentation

This document provides comprehensive documentation for all custom React hooks in the MedBookings application. These hooks provide reusable logic for common patterns like navigation, media queries, toast notifications, and mobile detection.

## Table of Contents

- [Navigation Hooks](#navigation-hooks)
- [UI State Hooks](#ui-state-hooks)
- [Responsive Design Hooks](#responsive-design-hooks)
- [Notification Hooks](#notification-hooks)

---

## Navigation Hooks

### useNavigation

A custom hook for enhanced navigation with loading states and error handling.

**Location:** `src/hooks/use-navigation.ts`

**Features:**

- Enhanced router navigation with loading states
- Error handling for navigation failures
- Prevent double navigation
- Support for push, replace, and back navigation
- Customizable callbacks for navigation events

**Parameters:**

- `options`: Optional configuration object
  - `onError`: Function called when navigation fails
  - `onStart`: Function called when navigation starts
  - `onComplete`: Function called when navigation completes

**Return Value:**

```typescript
{
  navigate: (url: string) => Promise<void>;
  replace: (url: string) => Promise<void>;
  back: () => void;
  reset: () => void;
  isNavigating: boolean;
  navigatingTo: string | null;
  isNavigatingTo: (url: string) => boolean;
}
```

**Example:**

```tsx
import { useNavigation } from '@/hooks/use-navigation';

function MyComponent() {
  const { navigate, isNavigating, navigatingTo } = useNavigation({
    onStart: () => console.log('Navigation started'),
    onComplete: () => console.log('Navigation completed'),
    onError: (error) => console.error('Navigation failed:', error),
  });

  const handleNavigate = async () => {
    await navigate('/profile');
  };

  return (
    <div>
      <button onClick={handleNavigate} disabled={isNavigating}>
        {isNavigating ? 'Navigating...' : 'Go to Profile'}
      </button>
      {navigatingTo && <p>Going to: {navigatingTo}</p>}
    </div>
  );
}
```

**Key Features:**

- **Loading States**: Track navigation progress with `isNavigating`
- **Destination Tracking**: Know where you're navigating with `navigatingTo`
- **Error Handling**: Graceful error handling with custom error callbacks
- **Prevention**: Prevents double-clicking navigation issues
- **Flexibility**: Support for push, replace, and back navigation

---

## UI State Hooks

### useToast

A comprehensive toast notification system with state management.

**Location:** `src/hooks/use-toast.ts`

**Features:**

- Global toast state management
- Toast queuing and limits
- Customizable toast types and styling
- Automatic dismissal with timeout
- Manual dismissal controls
- Update existing toasts

**Return Value:**

```typescript
{
  toasts: ToasterToast[];
  toast: (props: Toast) => { id: string; dismiss: () => void; update: (props: ToasterToast) => void };
  dismiss: (toastId?: string) => void;
}
```

**Toast Properties:**

- `title`: Toast title (ReactNode)
- `description`: Toast description (ReactNode)
- `variant`: Toast variant ('default' | 'destructive')
- `action`: Toast action element
- `duration`: Auto-dismiss duration (optional)

**Example:**

```tsx
import { useToast } from '@/hooks/use-toast';

function MyComponent() {
  const { toast } = useToast();

  const showSuccess = () => {
    toast({
      title: 'Success!',
      description: 'Your action was completed successfully.',
      variant: 'default',
    });
  };

  const showError = () => {
    toast({
      title: 'Error!',
      description: 'Something went wrong. Please try again.',
      variant: 'destructive',
    });
  };

  const showWithAction = () => {
    const { dismiss, update } = toast({
      title: 'Confirmation needed',
      description: 'Please confirm your action',
      action: (
        <button
          onClick={() => {
            // Handle action
            dismiss();
          }}
        >
          Confirm
        </button>
      ),
    });

    // Update the toast later
    setTimeout(() => {
      update({
        title: 'Updated!',
        description: 'Toast has been updated',
      });
    }, 2000);
  };

  return (
    <div>
      <button onClick={showSuccess}>Show Success</button>
      <button onClick={showError}>Show Error</button>
      <button onClick={showWithAction}>Show with Action</button>
    </div>
  );
}
```

**Key Features:**

- **Global State**: Centralized toast management across the app
- **Queuing**: Automatic toast queuing with configurable limits
- **Customization**: Flexible styling and content options
- **Actions**: Support for interactive toast actions
- **Persistence**: Control toast lifetime and dismissal

---

## Responsive Design Hooks

### useMediaQuery

A hook for detecting media query matches with real-time updates.

**Location:** `src/hooks/use-media-query.ts`

**Features:**

- Real-time media query detection
- Automatic cleanup of event listeners
- Support for any CSS media query
- SSR-safe implementation

**Parameters:**

- `query`: CSS media query string

**Return Value:**

- `boolean`: Whether the media query matches

**Example:**

```tsx
import { useMediaQuery } from '@/hooks/use-media-query';

function ResponsiveComponent() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');
  const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const isLandscape = useMediaQuery('(orientation: landscape)');

  return (
    <div>
      <p>Device: {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}</p>
      <p>Theme: {isDarkMode ? 'Dark' : 'Light'}</p>
      <p>Orientation: {isLandscape ? 'Landscape' : 'Portrait'}</p>
    </div>
  );
}
```

**Common Use Cases:**

- **Responsive Layouts**: Show/hide elements based on screen size
- **Theme Detection**: Detect user's preferred color scheme
- **Device Capabilities**: Check for hover, touch, or orientation
- **Print Styles**: Detect print media queries

### useIsMobile

A specialized hook for mobile device detection.

**Location:** `src/hooks/use-mobile.tsx`

**Features:**

- Mobile-specific breakpoint detection
- Configurable breakpoint (768px default)
- Real-time window resize detection
- SSR-safe with undefined initial state

**Return Value:**

- `boolean`: Whether the device is mobile-sized

**Example:**

```tsx
import { useIsMobile } from '@/hooks/use-mobile';

function MobileAwareComponent() {
  const isMobile = useIsMobile();

  return (
    <div>
      {isMobile ? <MobileMenu /> : <DesktopMenu />}

      <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>Content here</div>
    </div>
  );
}
```

**Key Features:**

- **Optimized**: Specifically designed for mobile/desktop detection
- **Performance**: Efficient window resize handling
- **Flexible**: Easy to customize breakpoint if needed
- **Safe**: Handles SSR hydration correctly

---

## Notification Hooks

### useToast (Detailed)

The toast system provides a comprehensive notification solution with advanced features.

**Advanced Usage:**

```tsx
import { useToast } from '@/hooks/use-toast';

function AdvancedToastExample() {
  const { toast, dismiss } = useToast();

  const showProgressToast = () => {
    let progress = 0;
    const { id, update } = toast({
      title: 'Processing...',
      description: `Progress: ${progress}%`,
      duration: Infinity, // Don't auto-dismiss
    });

    const interval = setInterval(() => {
      progress += 10;
      update({
        title: 'Processing...',
        description: `Progress: ${progress}%`,
      });

      if (progress >= 100) {
        clearInterval(interval);
        update({
          title: 'Complete!',
          description: 'Processing finished successfully',
          variant: 'default',
        });

        // Auto-dismiss after showing completion
        setTimeout(() => dismiss(id), 2000);
      }
    }, 500);
  };

  const showUndoToast = () => {
    const { dismiss: dismissToast } = toast({
      title: 'Item deleted',
      description: 'The item has been removed from your list',
      action: (
        <button
          onClick={() => {
            // Handle undo logic
            console.log('Undo action triggered');
            dismissToast();
          }}
        >
          Undo
        </button>
      ),
    });
  };

  return (
    <div>
      <button onClick={showProgressToast}>Show Progress Toast</button>
      <button onClick={showUndoToast}>Show Undo Toast</button>
    </div>
  );
}
```

**Toast Configuration:**

```typescript
// Global toast configuration
const TOAST_LIMIT = 1; // Maximum number of toasts
const TOAST_REMOVE_DELAY = 1000000; // Delay before removing dismissed toasts

// Toast state management
interface ToasterToast {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: 'default' | 'destructive';
  duration?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
```

---

## Hook Patterns and Best Practices

### Custom Hook Creation

When creating custom hooks, follow these patterns:

```typescript
// Template for custom hooks
function useCustomHook(config?: Config) {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    // Setup logic
    return () => {
      // Cleanup logic
    };
  }, [dependencies]);

  const methods = {
    // Methods that use state
  };

  return {
    ...state,
    ...methods,
  };
}
```

### Error Handling

```typescript
function useApiCall() {
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const execute = async (params: any) => {
    try {
      setLoading(true);
      setError(null);
      // API call logic
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error };
}
```

### Performance Optimization

```typescript
function useOptimizedHook() {
  // Use useCallback for functions
  const memoizedCallback = useCallback(() => {
    // Callback logic
  }, [dependencies]);

  // Use useMemo for expensive calculations
  const memoizedValue = useMemo(() => {
    // Expensive calculation
    return computeExpensiveValue();
  }, [dependencies]);

  return { memoizedCallback, memoizedValue };
}
```

### Testing Custom Hooks

```typescript
// Test custom hooks using @testing-library/react-hooks
import { act, renderHook } from '@testing-library/react';

import { useNavigation } from '@/hooks/use-navigation';

test('useNavigation should handle navigation', async () => {
  const { result } = renderHook(() => useNavigation());

  expect(result.current.isNavigating).toBe(false);

  await act(async () => {
    await result.current.navigate('/test');
  });

  expect(result.current.navigatingTo).toBe('/test');
});
```

---

## Integration with Application

### Provider Setup

Ensure hooks work properly with application providers:

```tsx
// _app.tsx or layout.tsx
import { Toaster } from '@/components/ui/toaster';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>
          {children}
          <Toaster /> {/* Required for useToast */}
        </Providers>
      </body>
    </html>
  );
}
```

### Hook Dependencies

Common dependencies for custom hooks:

- **React**: `useState`, `useEffect`, `useCallback`, `useMemo`
- **Next.js**: `useRouter`, `usePathname`, `useSearchParams`
- **Auth**: `useSession` from NextAuth.js
- **State Management**: React Query hooks, Zustand stores

### TypeScript Integration

All hooks are fully typed with TypeScript:

```typescript
interface NavigationOptions {
  onError?: (error: Error) => void;
  onStart?: () => void;
  onComplete?: () => void;
}

interface NavigationReturn {
  navigate: (url: string) => Promise<void>;
  replace: (url: string) => Promise<void>;
  back: () => void;
  reset: () => void;
  isNavigating: boolean;
  navigatingTo: string | null;
  isNavigatingTo: (url: string) => boolean;
}

function useNavigation(options?: NavigationOptions): NavigationReturn;
```

---

## Performance Considerations

### Memory Management

- Always clean up event listeners in useEffect cleanup
- Use WeakMap for object references when possible
- Implement proper dependency arrays to prevent memory leaks

### Re-render Optimization

- Use useCallback for function props
- Use useMemo for expensive calculations
- Consider using React.memo for components that use these hooks

### SSR Compatibility

- Handle server-side rendering appropriately
- Use conditional rendering for client-only features
- Implement proper hydration handling

---

## Common Patterns

### Combining Hooks

```tsx
function useResponsiveNavigation() {
  const isMobile = useIsMobile();
  const { navigate } = useNavigation();
  const { toast } = useToast();

  const navigateWithFeedback = useCallback(
    async (url: string) => {
      try {
        await navigate(url);
        if (isMobile) {
          toast({
            title: 'Navigation complete',
            description: "You've been redirected",
          });
        }
      } catch (error) {
        toast({
          title: 'Navigation failed',
          description: 'Please try again',
          variant: 'destructive',
        });
      }
    },
    [navigate, toast, isMobile]
  );

  return { navigateWithFeedback, isMobile };
}
```

### Conditional Hook Usage

```tsx
function useConditionalFeature(shouldUse: boolean) {
  const result = shouldUse ? useFeatureHook() : null;
  return result;
}
```

### Hook Composition

```tsx
function useComposedHook() {
  const navigation = useNavigation();
  const toast = useToast();
  const isMobile = useIsMobile();

  // Combine functionality
  const enhancedNavigation = {
    ...navigation,
    navigateWithToast: (url: string) => {
      navigation.navigate(url);
      toast.toast({ title: 'Navigating...' });
    },
  };

  return {
    ...enhancedNavigation,
    isMobile,
  };
}
```
