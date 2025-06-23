import { notFound, redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth';

interface AdminOrganizationDetailPageProps {
  params: {
    id: string;
  };
}

export default async function AdminOrganizationDetailPage({
  params,
}: AdminOrganizationDetailPageProps) {
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Organization Details
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Review organization information and approval status
            </p>
          </div>
          <a
            href="/admin/organizations"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            ← Back to Organizations
          </a>
        </div>
      </div>

      {/* Organization Info Card */}
      <div className="mb-6 overflow-hidden bg-white shadow dark:bg-gray-800 sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-12 w-12 animate-pulse rounded-lg bg-gray-300 dark:bg-gray-600"></div>
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
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Website</dt>
              <dd className="mt-1">
                <div className="h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
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
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
              <dd className="mt-1">
                <div className="space-y-2">
                  <div className="h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                </div>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Organization Stats */}
      <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                    Members
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    <div className="h-5 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                    Locations
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    <div className="h-5 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                    Providers
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    <div className="h-5 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                    Subscriptions
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    <div className="h-5 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Actions */}
      <div className="overflow-hidden bg-white shadow dark:bg-gray-800 sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
            Organization Approval
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Approve or reject the organization registration.
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
              Approve Organization
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
              Reject Organization
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Loading organization data...
          </p>
        </div>
      </div>
    </div>
  );
}
