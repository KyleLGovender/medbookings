# Component Patterns - React/Next.js

## Client Component with Hooks Pattern

```typescript
// Pattern from: /src/app/(dashboard)/availability/page.tsx
"use client";

import { useCurrentUserProvider } from "~/features/auth/hooks";
import { api } from "~/trpc/react";

export default function FeaturePage() {
  const { data: provider, isLoading, error } = useCurrentUserProvider();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorBoundary error={error} />;
  if (!provider) return <OnboardingFlow />;

  return <MainFeatureComponent providerId={provider.id} />;
}
```

## Server Component Pattern

```typescript
// Pattern for data fetching in server components
import { api } from "~/trpc/server";

export default async function ServerPage() {
  const data = await api.feature.getData();
  return <ClientComponent initialData={data} />;
}
```
