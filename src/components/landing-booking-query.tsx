'use client';

import { useEffect, useRef, useState } from 'react';

import {
  Activity,
  Apple,
  Brain,
  ChevronRight,
  Disc,
  HeartPulse,
  MapPin,
  Stethoscope,
  SmileIcon as Tooth,
  Video,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function LandingBookingQuery() {
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedService, setSelectedService] = useState('');
  const [consultationType, setConsultationType] = useState('');
  const [location, setLocation] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [containerSize, setContainerSize] = useState('sm');
  const containerRef = useRef<HTMLDivElement>(null);

  // Use ResizeObserver to monitor the container size
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width || 0;

      if (width >= 768) {
        setContainerSize('lg');
      } else if (width >= 500) {
        setContainerSize('md');
      } else {
        setContainerSize('sm');
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Determine grid columns based on container size
  const getGridCols = () => {
    switch (containerSize) {
      case 'lg':
        return 'grid-cols-4';
      case 'md':
        return 'grid-cols-3';
      default:
        return 'grid-cols-2';
    }
  };

  const handleServiceSelection = (service: string) => {
    setSelectedService(service);
    setBookingStep(2);
  };

  const handleConsultationTypeSelection = (type: string) => {
    setConsultationType(type);
    if (type === 'online') {
      setBookingStep(4); // Skip location step for online
    } else {
      setBookingStep(3);
    }
  };

  const handleLocationSelection = () => {
    setBookingStep(4);
  };

  const handleUseCurrentLocation = () => {
    setUseCurrentLocation(true);
    setLocation('Current Location');
    setBookingStep(4);
  };

  const resetForm = () => {
    setBookingStep(1);
    setSelectedService('');
    setConsultationType('');
    setLocation('');
    setUseCurrentLocation(false);
  };

  const renderBookingStep = () => {
    switch (bookingStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              What type of medical service are you looking for?
            </h3>

            <div className={`grid gap-3 ${getGridCols()}`}>
              {[
                {
                  name: 'Doctor',
                  icon: (
                    <Stethoscope
                      strokeWidth={1}
                      absoluteStrokeWidth={true}
                      className="mb-2 flex h-12 w-12"
                    />
                  ),
                },
                {
                  name: 'Dentist',
                  icon: (
                    <Tooth strokeWidth={1} absoluteStrokeWidth={true} className="mb-2 h-12 w-12" />
                  ),
                },
                {
                  name: 'Psychologist',
                  icon: (
                    <Brain strokeWidth={1} absoluteStrokeWidth={true} className="mb-2 h-12 w-12" />
                  ),
                },
                {
                  name: 'Chiropractor',
                  icon: (
                    <Disc strokeWidth={1} absoluteStrokeWidth={true} className="mb-2 h-12 w-12" />
                  ),
                },
                {
                  name: 'Dietician',
                  icon: (
                    <Apple strokeWidth={1} absoluteStrokeWidth={true} className="mb-2 h-12 w-12" />
                  ),
                },
                {
                  name: 'Biokineticist',
                  icon: (
                    <Activity
                      strokeWidth={1}
                      absoluteStrokeWidth={true}
                      className="mb-2 h-12 w-12"
                    />
                  ),
                },
                {
                  name: 'Physiotherapist',
                  icon: (
                    <HeartPulse
                      strokeWidth={1}
                      absoluteStrokeWidth={true}
                      className="mb-2 h-12 w-12"
                    />
                  ),
                },
              ].map((service) => (
                <Button
                  key={service.name}
                  variant={selectedService === service.name ? 'default' : 'outline'}
                  className="h-auto flex-col items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover px-4 py-3 transition-colors hover:border-muted/70 hover:bg-popover/90 [&_svg]:size-8"
                  onClick={() => handleServiceSelection(service.name)}
                >
                  {service.icon}
                  <span className="text-base font-medium">{service.name}</span>
                </Button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 p-0 hover:bg-transparent hover:opacity-80"
                onClick={resetForm}
              >
                <span>{selectedService}</span>
              </Button>
              <ChevronRight className="h-4 w-4" />
              <span>Consultation Type</span>
            </div>
            <h3 className="text-lg font-medium">
              Do you prefer an in-person or online consultation?
            </h3>
            <div className={`grid gap-4 ${containerSize === 'sm' ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <Button
                variant={consultationType === 'in-person' ? 'default' : 'outline'}
                className="h-auto w-full flex-col items-start justify-start gap-3 rounded-md border-2 border-muted bg-popover p-6 text-left transition-colors hover:border-muted/70 hover:bg-popover/90 [&_svg]:size-8"
                onClick={() => handleConsultationTypeSelection('in-person')}
              >
                <div className="flex items-center justify-center">
                  <MapPin strokeWidth={1} absoluteStrokeWidth={true} className="h-12 w-12" />
                </div>
                <div className="w-full space-y-1">
                  <span className="text-wrap text-base font-medium">In-person consultation</span>
                  <p className="text-wrap text-sm text-muted-foreground">
                    Visit a medical professional in their office
                  </p>
                </div>
              </Button>
              <Button
                variant={consultationType === 'online' ? 'default' : 'outline'}
                className="h-auto w-full flex-col items-start justify-start gap-3 rounded-md border-2 border-muted bg-popover p-6 text-left transition-colors hover:border-muted/70 hover:bg-popover/90 [&_svg]:size-8"
                onClick={() => handleConsultationTypeSelection('online')}
              >
                <div className="flex items-center justify-center">
                  <Video strokeWidth={1} absoluteStrokeWidth={true} className="h-12 w-12" />
                </div>
                <div className="w-full space-y-1">
                  <span className="text-wrap text-base font-medium">Online consultation</span>
                  <p className="text-wrap text-sm text-muted-foreground">
                    Connect with a medical professional virtually
                  </p>
                </div>
              </Button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 p-0 hover:bg-transparent hover:opacity-80"
                onClick={resetForm}
              >
                <span>{selectedService}</span>
              </Button>
              <ChevronRight className="h-4 w-4" />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 p-0 hover:bg-transparent hover:opacity-80"
                onClick={() => setBookingStep(2)}
              >
                <span>In-person</span>
              </Button>
              <ChevronRight className="h-4 w-4" />
              <span>Location</span>
            </div>
            <h3 className="text-lg font-medium">
              Where would you like to find a {selectedService.toLowerCase()}?
            </h3>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={handleUseCurrentLocation}
                  className="w-full justify-start transition-colors hover:bg-muted/30"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Use my current location
                </Button>
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Enter city, suburb or postal code"
                  className="pl-10"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <Button
                onClick={handleLocationSelection}
                disabled={!location && !useCurrentLocation}
                className="w-full transition-opacity hover:opacity-90"
              >
                Continue
              </Button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Button variant="ghost" size="sm" className="h-8 p-0" onClick={resetForm}>
                <span>{selectedService}</span>
              </Button>
              <ChevronRight className="h-4 w-4" />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 p-0"
                onClick={() => setBookingStep(2)}
              >
                <span>{consultationType === 'online' ? 'Online' : 'In-person'}</span>
              </Button>
              {consultationType === 'in-person' && (
                <>
                  <ChevronRight className="h-4 w-4" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 p-0"
                    onClick={() => setBookingStep(3)}
                  >
                    <span>{location || 'Location'}</span>
                  </Button>
                </>
              )}
            </div>
            <div className="rounded-md bg-muted p-4">
              <h3 className="mb-2 font-medium">Your search</h3>
              <p className="text-sm">
                {selectedService} •{' '}
                {consultationType === 'online' ? 'Online consultation' : 'In-person consultation'}
                {consultationType === 'in-person' && location && ` • ${location}`}
              </p>
            </div>
            <Button size="lg" className="w-full">
              Search for {selectedService}s
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className="w-full">
      <Card className="border-2 shadow-lg">
        <CardContent className="p-6">{renderBookingStep()}</CardContent>
      </Card>
    </div>
  );
}
