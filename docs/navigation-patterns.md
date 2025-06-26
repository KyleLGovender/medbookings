# Navigation Patterns with Loading States

This document outlines the standardized navigation patterns implemented across the dashboard to provide consistent loading feedback and error handling.

## Overview

We've implemented a centralized navigation system that provides:

- ✅ Immediate visual feedback when navigation is triggered
- ✅ Loading states with spinners and disabled buttons
- ✅ Error handling with toast notifications
- ✅ Prevention of double-clicks during navigation
- ✅ Consistent UX across all navigation elements

## Components

### 1. `useNavigation` Hook

**Location**: `src/hooks/use-navigation.ts`

**Purpose**: Centralized navigation logic with loading states and error handling.

```tsx
const { navigate, replace, back, isNavigating, navigatingTo } = useNavigation({
  onStart: () => console.log('Navigation started'),
  onComplete: () => console.log('Navigation completed'),
  onError: (error) => console.error('Navigation failed', error),
});

// Usage
await navigate('/providers/123');
```

**Features**:

- `navigate(url)` - Push navigation with loading state
- `replace(url)` - Replace navigation with loading state
- `back()` - Browser back with loading state
- `isNavigating` - Boolean indicating if any navigation is in progress
- `navigatingTo` - String indicating which URL is being navigated to
- `isNavigatingTo(url)` - Check if navigating to specific URL

### 2. `NavigationButton` Component

**Location**: `src/components/ui/navigation-button.tsx`

**Purpose**: Button component with built-in navigation and loading states.

```tsx
import { NavigationButton, NavigationOutlineButton } from '@/components/ui/navigation-button';

// Basic usage
<NavigationButton href="/providers/123">
  View Provider
</NavigationButton>

// With custom loading text
<NavigationOutlineButton
  href="/organizations/456"
  loadingText="Loading organization..."
>
  View Organization
</NavigationOutlineButton>

// With callbacks
<NavigationButton
  href="/admin/providers"
  onNavigationStart={() => setIsLoading(true)}
  onNavigationComplete={() => setIsLoading(false)}
  onNavigationError={(error) => handleError(error)}
>
  Go to Admin
</NavigationButton>
```

**Convenience Components**:

- `NavigationButton` - Default button variant
- `NavigationOutlineButton` - Outline button variant
- `NavigationLinkButton` - Link button variant
- `NavigationDefaultButton` - Default button variant (explicit)

**Props**:

- `href` - Target URL (required)
- `loadingText` - Text to show during loading (default: "Loading...")
- `showLoadingIcon` - Show spinner icon (default: true)
- `replace` - Use replace instead of push (default: false)
- All standard Button props (variant, size, disabled, etc.)

### 3. `NavigationLink` Component

**Location**: `src/components/ui/navigation-link.tsx`

**Purpose**: Link component with loading feedback for text links.

```tsx
import { NavigationLink } from '@/components/ui/navigation-link';

<NavigationLink href="/providers/123" className="font-medium hover:underline">
  John Doe
</NavigationLink>;
```

**Features**:

- Loading spinner appears next to link text
- Opacity change during navigation
- Prevents multiple clicks during navigation

## Migration Examples

### Before (Old Pattern)

```tsx
// ❌ Old way - no loading feedback
const router = useRouter();

<Button variant="outline" onClick={() => router.push(`/providers/${provider.id}`)}>
  Provider View
</Button>;
```

### After (New Pattern)

```tsx
// ✅ New way - with loading feedback
import { NavigationOutlineButton } from '@/components/ui/navigation-button';

<NavigationOutlineButton href={`/providers/${provider.id}`}>Provider View</NavigationOutlineButton>;
```

## Best Practices

### 1. Choose the Right Component

- **Buttons**: Use `NavigationButton` or its variants
- **Text Links**: Use `NavigationLink`
- **Complex Logic**: Use `useNavigation` hook directly

### 2. Loading Text Guidelines

- Keep loading text short and descriptive
- Use present continuous tense: "Loading...", "Navigating...", "Opening..."
- Match the action: "Deleting...", "Saving...", "Processing..."

### 3. Error Handling

The navigation components automatically show error toasts, but you can add custom error handling:

```tsx
<NavigationButton
  href="/complex-route"
  onNavigationError={(error) => {
    // Custom error handling
    analytics.track('navigation_error', { error: error.message });
    showCustomErrorModal();
  }}
>
  Navigate
</NavigationButton>
```

### 4. Preventing Double Navigation

All components automatically prevent multiple navigation attempts while one is in progress. No additional logic needed.

## Implementation Status

### ✅ Completed

- Profile page navigation buttons
- Admin provider list navigation
- Admin organization list navigation
- Sidebar navigation links
- Delete provider button navigation

### 🔄 In Progress

- Form submission buttons with navigation
- Modal close buttons with navigation

### 📋 Pending

- Breadcrumb navigation links
- Menu navigation items
- Search result navigation

## Testing

When testing navigation components:

1. **Click Responsiveness**: Button should immediately show loading state
2. **Multiple Clicks**: Subsequent clicks should be ignored during navigation
3. **Error Handling**: Failed navigation should show error toast and reset button state
4. **Accessibility**: Loading state should be announced to screen readers

## Performance Considerations

- Navigation components use optimistic UI updates for immediate feedback
- Error states automatically reset to prevent stuck loading states
- Memory efficient - no unnecessary re-renders during navigation
- Batch navigation requests to prevent route thrashing

## Future Enhancements

- [ ] Add navigation analytics tracking
- [ ] Implement navigation breadcrumb updates
- [ ] Add keyboard navigation support
- [ ] Create navigation testing utilities
- [ ] Add prefetching for common routes
