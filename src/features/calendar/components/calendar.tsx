import { redirect } from "next/navigation";
import { Suspense } from "react";

import { CalendarWrapper } from "@/features/calendar/components/calendar-wrapper";
import { getDateRange } from "@/features/calendar/lib/helper";
import { getServiceProviderScheduleInRange } from "@/features/calendar/lib/queries";
import { getCurrentUser } from "@/lib/auth";
import { getAuthenticatedServiceProvider } from "@/lib/server-helper";

type SearchParams = { [key: string]: string | string[] | undefined };

export async function Calendar({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();

  if (!user?.id) {
    redirect("/auth/login");
  }

  const { serviceProviderId } = await getAuthenticatedServiceProvider();

  if (!serviceProviderId) {
    redirect("/profile/service-provider");
  }

  const isValidView = (
    v: string | undefined,
  ): v is "day" | "schedule" | "week" => {
    return v === "day" || v === "schedule" || v === "week";
  };

  const view = searchParams.view as string;
  const validView = isValidView(view) ? view : "schedule";

  const start = searchParams.start as string;
  const end = searchParams.end as string;

  let startDate: Date;
  let endDate: Date;

  if (start) {
    startDate = new Date(start);
  } else {
    startDate = new Date();
  }

  const dateRange = getDateRange(startDate, validView);
  startDate = dateRange.from!;
  endDate = dateRange.to!;

  const initialScheduleData = await getServiceProviderScheduleInRange(
    serviceProviderId,
    startDate,
    endDate,
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Calendar</h1>
          <p className="mt-2 text-sm text-gray-600">
            Set your available time slots and manage your schedule
          </p>
        </div>

        <Suspense
          fallback={
            <div className="h-[600px] animate-pulse rounded-lg bg-gray-100" />
          }
        >
          <div className="rounded-lg bg-white shadow">
            <CalendarWrapper
              initialData={initialScheduleData}
              serviceProviderId={serviceProviderId}
              initialDateRange={{
                from: startDate,
                to: endDate,
              }}
              initialView={validView}
            />
          </div>
        </Suspense>
      </div>
    </main>
  );
}
