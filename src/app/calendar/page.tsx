export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">View Multiple Service Providers</h1>
          <p className="mt-2 text-sm text-gray-600">
            See the available time slots for multiple service providers
          </p>
        </div>
      </div>
    </main>
  );
}
