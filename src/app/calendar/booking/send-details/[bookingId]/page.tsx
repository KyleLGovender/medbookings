import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { sendServiceProviderPatientsDetailsByWhatsapp } from '@/features/calendar/lib/actions';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function SendDetailsPage({ params }: { params: { bookingId: string } }) {
  const user = await getCurrentUser();

  if (!user?.id) {
    redirect('/auth/login');
  }

  // Check if user is the service provider for this booking
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    select: {
      guestName: true,
      guestWhatsapp: true,
      serviceProvider: {
        select: {
          userId: true,
          name: true,
        },
      },
    },
  });

  if (!booking) {
    return (
      <Card className="mx-auto mt-8 max-w-md">
        <CardHeader>
          <CardTitle>Booking Not Found</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (booking.serviceProvider.userId !== user?.id) {
    return (
      <Card className="mx-auto mt-8 max-w-md">
        <CardHeader>
          <CardTitle>Unauthorized Access</CardTitle>
          <CardDescription>
            Please log in as the service provider for this booking to view this page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mx-auto mt-8 max-w-md">
      <CardHeader>
        <CardTitle>Send Patient Details</CardTitle>
        <CardDescription>
          Would you like to receive {booking.guestName}'s contact details via WhatsApp?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={async () => {
            'use server';
            await sendServiceProviderPatientsDetailsByWhatsapp(params.bookingId);
          }}
        >
          <Button type="submit" className="w-full">
            Send to WhatsApp
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
