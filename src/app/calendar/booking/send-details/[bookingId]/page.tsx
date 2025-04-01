import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
          <CardTitle className="text-center text-xl font-semibold">Booking Not Found</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (booking.serviceProvider.userId !== user?.id) {
    return (
      <Card className="mx-auto mt-8 max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-xl font-semibold">Unauthorized Access</CardTitle>
          <CardDescription className="text-center">
            Please log in as the service provider for this booking to view this page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mx-auto mt-8 max-w-md">
      <CardHeader>
        <CardTitle className="text-center text-xl font-semibold">Send Patient Details</CardTitle>
        <CardDescription className="text-center">
          Would you like to receive {booking.guestName}&apos;s contact details via WhatsApp?
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <form
          action={async () => {
            'use server';
            await sendServiceProviderPatientsDetailsByWhatsapp(params.bookingId);
          }}
          className="w-full"
        >
          <Button type="submit" className="w-full">
            Send to WhatsApp
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
