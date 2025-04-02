import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ServiceProviderGrid } from '@/features/service-provider/components/service-provider-grid';

interface HomePageProps {
  searchParams: { type?: string };
}

export const metadata = {
  title: 'Service Providers | Book an Appointment',
  description: 'Browse our service providers and book an appointment',
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const typeId = searchParams.type;

  return (
    <div className="bg-gray-50 py-8">
      <div className="mx-auto flex max-w-7xl items-center justify-center p-6">
        <Card className="mx-auto w-full max-w-4xl">
          <CardHeader>
            <CardTitle className="text-center text-4xl font-bold">Medbookings</CardTitle>
            <CardDescription className="mt-4 text-center text-xl">
              Let&apos;s help you find a medical service provider
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Book appointments with qualified healthcare professionals online.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button asChild>
              <Link href="#service-providers">Browse Providers</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      <div
        id="service-providers"
        className="mx-auto flex max-w-7xl items-center justify-center p-6"
      >
        <Card className="mx-auto w-full max-w-4xl">
          <CardHeader>
            <CardTitle className="text-center text-4xl font-bold">Service Providers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <ServiceProviderGrid typeId={typeId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
