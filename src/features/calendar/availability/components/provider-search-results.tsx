'use client';

import { useState } from 'react';

import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Globe,
  Info,
  Mail,
  MapPin,
  Phone,
  Star,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface ProviderSearchResult {
  providerId: string;
  providerName: string;
  providerType: string;
  rating: number;
  reviewCount: number;
  distance?: number;
  location?: {
    name: string;
    address: string;
  };
  availableServices: Array<{
    serviceId: string;
    serviceName: string;
    duration: number;
    price: number;
    showPrice: boolean;
  }>;
  nearestAvailableSlot?: {
    slotId: string;
    startTime: Date;
    endTime: Date;
    isOnlineAvailable: boolean;
    price: number;
  };
  totalAvailableSlots: number;
  upcomingSlots?: Array<{
    slotId: string;
    startTime: Date;
    endTime: Date;
    serviceName: string;
    price: number;
    isOnlineAvailable: boolean;
    requiresConfirmation: boolean;
  }>;
  providerInfo?: {
    bio?: string;
    specializations?: string[];
    languages?: string[];
    experience?: string;
    education?: string[];
    certifications?: string[];
  };
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
}

interface ProviderSearchResultsProps {
  results: ProviderSearchResult[];
  isLoading?: boolean;
  onSelectProvider?: (provider: ProviderSearchResult) => void;
  onBookSlot?: (slotId: string, providerId: string) => void;
  onViewAllSlots?: (providerId: string) => void;
  showDetailedView?: boolean;
}

export function ProviderSearchResults({
  results,
  isLoading = false,
  onSelectProvider,
  onBookSlot,
  onViewAllSlots,
  showDetailedView = false,
}: ProviderSearchResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="h-6 w-2/3 rounded bg-gray-200"></div>
                    <div className="h-4 w-1/2 rounded bg-gray-200"></div>
                    <div className="h-4 w-1/3 rounded bg-gray-200"></div>
                  </div>
                  <div className="h-8 w-20 rounded bg-gray-200"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-gray-200"></div>
                  <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="py-8 text-center text-muted-foreground">
            <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p className="text-lg font-medium">No providers found</p>
            <p className="text-sm">
              Try adjusting your search criteria or expanding your search radius.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {results.length} Provider{results.length !== 1 ? 's' : ''} Found
        </h3>
        <div className="text-sm text-muted-foreground">Sorted by distance and availability</div>
      </div>

      <div className="grid gap-4">
        {results.map((provider) => (
          <ProviderResultCard
            key={provider.providerId}
            provider={provider}
            onSelect={() => onSelectProvider?.(provider)}
            onBookSlot={
              onBookSlot ? (slotId) => onBookSlot(slotId, provider.providerId) : undefined
            }
            onViewAllSlots={() => onViewAllSlots?.(provider.providerId)}
            showDetailedView={showDetailedView}
          />
        ))}
      </div>
    </div>
  );
}

interface ProviderResultCardProps {
  provider: ProviderSearchResult;
  onSelect?: () => void;
  onBookSlot?: (slotId: string) => void;
  onViewAllSlots?: () => void;
  showDetailedView?: boolean;
}

function ProviderResultCard({
  provider,
  onSelect,
  onBookSlot,
  onViewAllSlots,
  showDetailedView = false,
}: ProviderResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllSlots, setShowAllSlots] = useState(false);

  const displaySlots = showAllSlots
    ? provider.upcomingSlots?.slice(0, 10) || []
    : provider.upcomingSlots?.slice(0, 3) || [];

  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={onSelect}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Provider Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  {provider.providerName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-1">
                <h4 className="text-lg font-semibold">{provider.providerName}</h4>
                <p className="text-sm text-muted-foreground">{provider.providerType}</p>

                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{provider.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({provider.reviewCount} reviews)</span>
                  </div>

                  {provider.distance !== undefined && (
                    <>
                      <Separator orientation="vertical" className="h-4" />
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {provider.distance === 0 ? 'Online' : `${provider.distance} km away`}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge variant="secondary">{provider.totalAvailableSlots} slots available</Badge>

              {provider.nearestAvailableSlot && (
                <div className="text-right text-sm">
                  <p className="text-muted-foreground">Next available</p>
                  <p className="font-medium">
                    {provider.nearestAvailableSlot.startTime.toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    at{' '}
                    {provider.nearestAvailableSlot.startTime.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          {provider.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <div>
                <div className="font-medium">{provider.location.name}</div>
                <div>{provider.location.address}</div>
              </div>
            </div>
          )}

          {/* Available Services */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium">Available Services</h5>
            <div className="flex flex-wrap gap-2">
              {provider.availableServices.slice(0, 4).map((service) => (
                <TooltipProvider key={service.serviceId}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="cursor-help text-xs">
                        {service.serviceName}
                        {service.showPrice && (
                          <span className="ml-1 font-medium">${service.price}</span>
                        )}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="font-medium">{service.serviceName}</p>
                        <p className="text-sm">Duration: {service.duration} minutes</p>
                        {service.showPrice && <p className="text-sm">Price: ${service.price}</p>}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}

              {provider.availableServices.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{provider.availableServices.length - 4} more
                </Badge>
              )}
            </div>
          </div>

          {/* Upcoming Slots */}
          {provider.upcomingSlots && provider.upcomingSlots.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-medium">Available Appointments</h5>
                {provider.upcomingSlots.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAllSlots(!showAllSlots);
                    }}
                  >
                    {showAllSlots ? 'Show less' : `Show all ${provider.upcomingSlots.length}`}
                    {showAllSlots ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>

              <div className="grid gap-2">
                {displaySlots.map((slot) => (
                  <SlotCard key={slot.slotId} slot={slot} onBook={onBookSlot} />
                ))}
              </div>

              {onViewAllSlots && provider.totalAvailableSlots > displaySlots.length && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewAllSlots();
                  }}
                >
                  View all {provider.totalAvailableSlots} available slots
                </Button>
              )}
            </div>
          )}

          {/* Provider Details (Expandable) */}
          {showDetailedView && (provider.providerInfo || provider.contactInfo) && (
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between"
                  onClick={(e) => e.stopPropagation()}
                >
                  Provider Details
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-3 pt-3">
                {provider.providerInfo?.bio && (
                  <div>
                    <h6 className="mb-1 text-sm font-medium">About</h6>
                    <p className="text-sm text-muted-foreground">{provider.providerInfo.bio}</p>
                  </div>
                )}

                {provider.providerInfo?.specializations && (
                  <div>
                    <h6 className="mb-1 text-sm font-medium">Specializations</h6>
                    <div className="flex flex-wrap gap-1">
                      {provider.providerInfo.specializations.map((spec, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {provider.providerInfo?.languages && (
                  <div>
                    <h6 className="mb-1 text-sm font-medium">Languages</h6>
                    <p className="text-sm text-muted-foreground">
                      {provider.providerInfo.languages.join(', ')}
                    </p>
                  </div>
                )}

                {provider.contactInfo && (
                  <div>
                    <h6 className="mb-2 text-sm font-medium">Contact Information</h6>
                    <div className="space-y-1">
                      {provider.contactInfo.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3" />
                          <span>{provider.contactInfo.phone}</span>
                        </div>
                      )}
                      {provider.contactInfo.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3" />
                          <span>{provider.contactInfo.email}</span>
                        </div>
                      )}
                      {provider.contactInfo.website && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="h-3 w-3" />
                          <span>{provider.contactInfo.website}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface SlotCardProps {
  slot: {
    slotId: string;
    startTime: Date;
    endTime: Date;
    serviceName: string;
    price: number;
    isOnlineAvailable: boolean;
    requiresConfirmation: boolean;
  };
  onBook?: (slotId: string) => void;
}

function SlotCard({ slot, onBook }: SlotCardProps) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/50">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-3 w-3" />
            <span className="font-medium">
              {slot.startTime.toLocaleDateString([], {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <Clock className="ml-2 h-3 w-3" />
            <span>
              {slot.startTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              -{' '}
              {slot.endTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {slot.serviceName}
            </Badge>

            {slot.isOnlineAvailable && (
              <Badge variant="secondary" className="text-xs">
                Online
              </Badge>
            )}

            {slot.requiresConfirmation && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="cursor-help text-xs">
                      <Info className="mr-1 h-3 w-3" />
                      Confirmation Required
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This appointment requires provider confirmation</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="flex items-center gap-1 text-lg font-semibold">
              <DollarSign className="h-4 w-4" />
              {slot.price}
            </div>
          </div>

          {onBook && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onBook(slot.slotId);
              }}
            >
              Book
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
