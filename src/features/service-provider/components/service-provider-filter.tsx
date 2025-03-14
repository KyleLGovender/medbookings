'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

import { ServiceProviderType } from '@prisma/client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ServiceProviderFilterProps {
  providerTypes: ServiceProviderType[];
}

export function ServiceProviderFilter({ providerTypes }: ServiceProviderFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const currentTypeId = searchParams.get('type') || '';

  const handleTypeChange = (value: string) => {
    router.push(`${pathname}?${createQueryString('type', value)}`);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="w-full sm:w-64">
        <Select value={currentTypeId} onValueChange={handleTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by provider type" />
          </SelectTrigger>
          <SelectContent>
            {providerTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {currentTypeId && (
        <Button variant="outline" size="sm" onClick={clearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  );
}
