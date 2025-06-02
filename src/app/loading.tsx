import CalendarLoader from '@/components/calendar-loader';

export default function Loading() {
  return (
    <CalendarLoader
      message="Loading page..."
      submessage="Please wait while we prepare your content"
    />
  );
}
