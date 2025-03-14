import { Separator } from '@/components/ui/separator';
import { ServiceProviderGrid } from '@/features/service-provider/components/service-provider-grid';

interface ServiceProvidersPageProps {
  searchParams: { type?: string };
}

export const metadata = {
  title: 'Service Providers | Book an Appointment',
  description: 'Browse our service providers and book an appointment',
};

export default function ServiceProvidersPage({ searchParams }: ServiceProvidersPageProps) {
  const typeId = searchParams.type;

  return (
    <div className="container py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Our Service Providers</h1>
        <p className="text-muted-foreground">
          Browse our qualified service providers and book an appointment
        </p>
      </div>
      <Separator className="my-6" />
      <ServiceProviderGrid typeId={typeId} />
    </div>
  );
}
