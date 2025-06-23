import { notFound, redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth';

interface AdminProviderDetailPageProps {
  params: {
    id: string;
  };
}

export default async function AdminProviderDetailPage({ params }: AdminProviderDetailPageProps) {
  const currentUser = await getCurrentUser();

  // Check if user has admin privileges
  if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
    redirect('/dashboard');
  }

  // Ensure ID exists
  if (!params.id) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Provider Details</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Review provider information and requirements
            </p>
          </div>
          <a
            href="/admin/providers"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            ← Back to Providers
          </a>
        </div>
      </div>

      {/* Provider Info Card */}
      <div className="mb-6 overflow-hidden bg-white shadow dark:bg-gray-800 sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-12 w-12 animate-pulse rounded-full bg-gray-300 dark:bg-gray-600"></div>
              <div className="ml-4">
                <div className="mb-2 h-6 w-48 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
                <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-6 w-20 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 dark:border-gray-700 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
              <dd className="mt-1">
                <div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</dt>
              <dd className="mt-1">
                <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Provider Type
              </dt>
              <dd className="mt-1">
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Registration Date
              </dt>
              <dd className="mt-1">
                <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Requirements Section */}
      <div className="mb-6 overflow-hidden bg-white shadow dark:bg-gray-800 sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
            Requirements Review
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Review and approve individual requirements submitted by the provider.
          </p>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              {/* Requirement Item Skeleton */}
              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex-1">
                  <div className="flex items-center">
                    <div className="mr-4 h-4 w-48 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
                    <div className="h-5 w-16 animate-pulse rounded bg-yellow-200 dark:bg-yellow-800"></div>
                  </div>
                  <div className="mt-2 h-3 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-8 w-20 animate-pulse rounded bg-green-300 dark:bg-green-700"></div>
                  <div className="h-8 w-20 animate-pulse rounded bg-red-300 dark:bg-red-700"></div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex-1">
                  <div className="flex items-center">
                    <div className="mr-4 h-4 w-40 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
                    <div className="h-5 w-16 animate-pulse rounded bg-green-200 dark:bg-green-800"></div>
                  </div>
                  <div className="mt-2 h-3 w-56 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-8 w-20 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
                  <div className="h-8 w-20 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex-1">
                  <div className="flex items-center">
                    <div className="mr-4 h-4 w-52 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
                    <div className="h-5 w-16 animate-pulse rounded bg-red-200 dark:bg-red-800"></div>
                  </div>
                  <div className="mt-2 h-3 w-72 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-8 w-20 animate-pulse rounded bg-green-300 dark:bg-green-700"></div>
                  <div className="h-8 w-20 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Approval Actions */}
      <div className="overflow-hidden bg-white shadow dark:bg-gray-800 sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
            Provider Approval
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Approve or reject the entire provider application.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 dark:border-gray-700 sm:px-6">
          <div className="flex space-x-3">
            <button
              disabled
              className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                className="-ml-1 mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Approve Provider
            </button>
            <button
              disabled
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
            >
              <svg
                className="-ml-1 mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Reject Provider
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading provider data...</p>
        </div>
      </div>
    </div>
  );
}
