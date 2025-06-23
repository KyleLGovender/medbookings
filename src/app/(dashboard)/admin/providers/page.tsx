import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth';

export default async function AdminProvidersPage() {
  const currentUser = await getCurrentUser();

  // Check if user has admin privileges
  if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Provider Management
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Review and approve provider applications
            </p>
          </div>
          <a
            href="/admin"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 sm:justify-start"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-4 overflow-x-auto sm:space-x-8">
            <button className="flex-shrink-0 whitespace-nowrap border-b-2 border-blue-500 px-1 py-2 text-sm font-medium text-blue-600 dark:text-blue-400">
              Pending Approval
            </button>
            <button className="flex-shrink-0 whitespace-nowrap border-b-2 border-transparent px-1 py-2 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
              Approved
            </button>
            <button className="flex-shrink-0 whitespace-nowrap border-b-2 border-transparent px-1 py-2 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
              Rejected
            </button>
            <button className="flex-shrink-0 whitespace-nowrap border-b-2 border-transparent px-1 py-2 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
              All
            </button>
          </nav>
        </div>
      </div>

      {/* Provider List */}
      <div className="overflow-hidden bg-white shadow dark:bg-gray-800 sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <div className="py-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
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
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Loading providers...
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Please wait while we fetch the provider data.
            </p>
          </div>
        </div>
      </div>

      {/* Placeholder for Provider Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Provider cards will be rendered here by client component */}
        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 animate-pulse rounded-full bg-gray-300 dark:bg-gray-600"></div>
              </div>
              <div className="ml-4 flex-1">
                <div className="mb-2 h-4 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
                <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-2 h-3 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div className="mt-4 flex space-x-2">
              <div className="h-8 flex-1 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
              <div className="h-8 flex-1 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 animate-pulse rounded-full bg-gray-300 dark:bg-gray-600"></div>
              </div>
              <div className="ml-4 flex-1">
                <div className="mb-2 h-4 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
                <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-2 h-3 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div className="mt-4 flex space-x-2">
              <div className="h-8 flex-1 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
              <div className="h-8 flex-1 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 animate-pulse rounded-full bg-gray-300 dark:bg-gray-600"></div>
              </div>
              <div className="ml-4 flex-1">
                <div className="mb-2 h-4 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
                <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-2 h-3 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div className="mt-4 flex space-x-2">
              <div className="h-8 flex-1 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
              <div className="h-8 flex-1 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
