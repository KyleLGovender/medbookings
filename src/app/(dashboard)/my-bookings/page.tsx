import { redirect } from 'next/navigation';

import { UserBookingsPage } from '@/features/calendar/components/user-bookings-page';
import { getCurrentUser } from '@/lib/auth';

export const metadata = {
  title: 'My Bookings - MedBookings',
  description: 'View and manage your appointments',
};

export default async function MyBookingsPageRoute() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <UserBookingsPage />;
}
