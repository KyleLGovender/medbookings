import CalendarLoader from '@/components/calendar-loader';

export default function ProfileEditLoading() {
  return (
    <CalendarLoader
      message="Loading Profile Editor"
      submessage="Preparing your profile editor..."
      showAfterMs={0}
    />
  );
}
