import { Skeleton } from '@/components/ui/skeleton';

export default function OrganizationCalendarLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="md:col-span-1">
          <Skeleton className="h-80 w-full" />
        </div>
        <div className="md:col-span-3">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    </div>
  );
}