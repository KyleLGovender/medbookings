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
      <div id="service-providers" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Our Service Providers</h1>
          <p className="mt-2 text-sm text-gray-600">
            Browse our qualified service providers and book an appointment
          </p>
        </div>
        <ServiceProviderGrid typeId={typeId} />
      </div>
    </div>
  );
}
