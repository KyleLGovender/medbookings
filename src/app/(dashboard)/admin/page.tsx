import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth';

export default async function AdminDashboardPage() {
  const currentUser = await getCurrentUser();

  // Check if user has admin privileges
  if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage providers and organizations awaiting approval
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Provider Stats */}
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500 text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                  Pending Providers
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">Loading...</dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Organization Stats */}
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-500 text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                  Pending Organizations
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">Loading...</dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Approved Today */}
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-600 text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                  Approved Today
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">Loading...</dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Rejected Today */}
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-500 text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                  Rejected Today
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">Loading...</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <a
            href="/admin/providers"
            className="block rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md dark:bg-gray-800"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-500 text-white">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Manage Providers
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Review and approve provider applications
                </p>
              </div>
            </div>
          </a>

          <a
            href="/admin/organizations"
            className="block rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md dark:bg-gray-800"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-500 text-white">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Manage Organizations
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Review and approve organization registrations
                </p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
