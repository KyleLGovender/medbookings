import { Button, Card, CardBody, Image } from '@nextui-org/react';
import Link from 'next/link';
import { ServiceProviderWithRelations } from '../lib/types';

interface ServiceProviderProps {
  serviceProvider: ServiceProviderWithRelations;
}

export function ServiceProvider({ serviceProvider }: ServiceProviderProps) {
  return (
    <>
      <Card className="mx-auto mt-4 max-w-md">
        <CardBody className="text-center">
          <div className="space-y-6">
            {serviceProvider.image && (
              <Image
                width="100%"
                className="mx-auto"
                alt="NextUI hero Image"
                src={serviceProvider.image}
              />
            )}
            <Link href="/profile/service-provider/calendar/availability">
              <Button className="mx-auto mt-4 max-w-md">
                Manage Availability
              </Button>
            </Link>
            {/* Basic Info */}
            <div className="rounded-lg border p-6">
              <h2 className="text-2xl font-bold mb-4">{serviceProvider.serviceProviderType.name}</h2>
              <div className="space-y-2">
                <p><span className="font-semibold">Name:</span> {serviceProvider.name}</p>
                <p><span className="font-semibold">Email:</span> {serviceProvider.user.email}</p>
                {serviceProvider.bio && (
                  <p><span className="font-semibold">Bio:</span> {serviceProvider.bio}</p>
                )}
              </div>
            </div>

            {/* Services */}
            <div className="rounded-lg border p-6">
              <h2 className="text-2xl font-bold mb-4">Services Offered</h2>
              <div className="grid gap-4">
                {serviceProvider.services.map((service) => (
                  <div key={service.id} className="border rounded p-4">
                    <h3 className="text-lg font-semibold">{service.name}</h3>
                    <p className="text-md">{service.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </>
  );
} 
