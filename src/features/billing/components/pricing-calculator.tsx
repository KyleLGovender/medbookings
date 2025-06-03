'use client';

import type React from 'react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMediaQuery } from '@/hooks/use-media-query';

interface PricingTier {
  name: string;
  pricePerBooking: number;
  minBookings: number;
  maxBookings: number | null;
  bookingsUsed: number;
  totalPrice: number;
}

export function PricingCalculator() {
  const [bookings, setBookings] = useState<number>(50);
  const [maxSliderValue, setMaxSliderValue] = useState<number>(500);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const pricingBreakdown = useMemo(() => {
    const tiers: PricingTier[] = [];
    let remainingBookings = bookings;
    let totalCost = 0;

    // Tier 1: Subscription + first 30 bookings (R300 baseline)
    if (remainingBookings > 0) {
      const tier1Bookings = Math.min(remainingBookings, 30);
      const tier1Cost = 300; // Fixed baseline cost
      tiers.push({
        name: 'Subscription + first 30',
        pricePerBooking: tier1Bookings > 0 ? 300 / 30 : 0, // R10 per booking equivalent
        minBookings: 1,
        maxBookings: 30,
        bookingsUsed: tier1Bookings,
        totalPrice: tier1Cost,
      });
      totalCost += tier1Cost;
      remainingBookings -= tier1Bookings;
    }

    // Tier 2: Bookings 31-60 (R6 per booking)
    if (remainingBookings > 0) {
      const tier2Bookings = Math.min(remainingBookings, 30);
      const tier2Cost = tier2Bookings * 6;
      tiers.push({
        name: 'Bookings 31-60',
        pricePerBooking: 6,
        minBookings: 31,
        maxBookings: 60,
        bookingsUsed: tier2Bookings,
        totalPrice: tier2Cost,
      });
      totalCost += tier2Cost;
      remainingBookings -= tier2Bookings;
    }

    // Tier 3: Bookings 61-90 (R4 per booking)
    if (remainingBookings > 0) {
      const tier3Bookings = Math.min(remainingBookings, 30);
      const tier3Cost = tier3Bookings * 4;
      tiers.push({
        name: 'Bookings 61-90',
        pricePerBooking: 4,
        minBookings: 61,
        maxBookings: 90,
        bookingsUsed: tier3Bookings,
        totalPrice: tier3Cost,
      });
      totalCost += tier3Cost;
      remainingBookings -= tier3Bookings;
    }

    // Tier 4: Bookings 91+ (R3 per booking)
    if (remainingBookings > 0) {
      const tier4Cost = remainingBookings * 3;
      tiers.push({
        name: 'Bookings 91+',
        pricePerBooking: 3,
        minBookings: 91,
        maxBookings: null,
        bookingsUsed: remainingBookings,
        totalPrice: tier4Cost,
      });
      totalCost += tier4Cost;
    }

    const averagePricePerBooking = bookings > 0 ? totalCost / bookings : 0;

    return {
      tiers: tiers.filter((tier) => tier.bookingsUsed > 0),
      totalCost,
      averagePricePerBooking,
      totalBookings: bookings,
    };
  }, [bookings]);

  const handleSliderChange = (value: number[]) => {
    setBookings(value[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value) || 0;
    const clampedValue = Math.max(0, Math.min(10000, value)); // Allow up to 10,000 bookings
    setBookings(clampedValue);

    // Adjust slider max if input exceeds current max
    if (clampedValue > maxSliderValue) {
      setMaxSliderValue(Math.max(1000, Math.ceil(clampedValue / 100) * 100));
    }
  };

  const setQuickValue = (value: number) => {
    setBookings(value);

    // Adjust slider range based on the selected value
    if (value <= 500) {
      setMaxSliderValue(500);
    } else if (value <= 1000) {
      setMaxSliderValue(1000);
    } else if (value <= 2000) {
      setMaxSliderValue(2000);
    } else {
      setMaxSliderValue(Math.max(2000, Math.ceil(value / 100) * 100));
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 md:px-0">
      <Card className="border border-gray-200 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold md:text-2xl">
            MedBookings Pricing Calculator
          </CardTitle>
          <CardDescription className="text-sm md:text-base">
            Our pricing follows a tiered model designed to be cost-effective as your booking volume
            grows.
          </CardDescription>
          <div className="mt-2 text-sm">
            <ul className="list-disc space-y-1 pl-5">
              <li>R300 monthly subscription fee which includes your first 30 bookings</li>
              <li>Additional bookings are charged at decreasing rates as volume increases</li>
              <li>The more bookings you process, the lower your average cost per booking</li>
            </ul>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {/* Input Controls */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className={`${isMobile ? 'flex flex-col' : 'flex items-center'} gap-4`}>
                <Label htmlFor="bookings-input" className="text-base font-medium">
                  Number of Monthly Bookings
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="bookings-input"
                    type="number"
                    value={bookings}
                    onChange={handleInputChange}
                    min={0}
                    max={10000}
                    className="w-32"
                    placeholder="Enter amount"
                  />
                  <span className="text-sm text-muted-foreground">bookings per month</span>
                </div>
              </div>
              {/* Quick Value Buttons */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {[50, 100, 200, 500, 1000, 2000].map((value) => (
                  <Button
                    key={value}
                    variant={bookings === value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setQuickValue(value)}
                    className="text-xs"
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>0</span>
                  <span>{maxSliderValue.toLocaleString()}</span>
                </div>
                <Slider
                  value={[Math.min(bookings, maxSliderValue)]}
                  onValueChange={handleSliderChange}
                  max={maxSliderValue}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="border shadow-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {pricingBreakdown.totalBookings.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Bookings</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    R
                    {pricingBreakdown.totalCost.toLocaleString('en-ZA', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-sm">Total Monthly Cost</div>
                </div>
              </CardContent>
            </Card>
            <Card className="border shadow-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    R{pricingBreakdown.averagePricePerBooking.toFixed(2)}
                  </div>
                  <div className="text-sm">Average per Booking</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pricing Breakdown Table/Cards */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pricing Breakdown</h3>

            {/* Desktop Table View */}
            {!isMobile && (
              <Card className="border shadow-sm">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking Tier</TableHead>
                        <TableHead className="text-right">Price per Booking</TableHead>
                        <TableHead className="text-right">Bookings</TableHead>
                        <TableHead className="text-right">Total Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pricingBreakdown.tiers.map((tier, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              <span>
                                {index === 0
                                  ? 'Monthly Subscription (includes first 30 bookings)'
                                  : tier.name === 'Bookings 31-60'
                                    ? 'Additional Bookings (31-60)'
                                    : tier.name === 'Bookings 61-90'
                                      ? 'Volume Discount Tier (61-90)'
                                      : 'Premium Volume Tier (91+)'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            R{tier.pricePerBooking.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {tier.bookingsUsed.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            R
                            {tier.totalPrice.toLocaleString('en-ZA', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t-2 font-bold">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right">
                          R{pricingBreakdown.averagePricePerBooking.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {pricingBreakdown.totalBookings.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          R
                          {pricingBreakdown.totalCost.toLocaleString('en-ZA', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Mobile Card View */}
            {isMobile && (
              <div className="space-y-3">
                {pricingBreakdown.tiers.map((tier, index) => (
                  <Card key={index} className="border shadow-sm">
                    <CardContent className="p-4">
                      <div className="mb-2 font-medium">
                        {index === 0
                          ? 'Monthly Subscription'
                          : tier.name === 'Bookings 31-60'
                            ? 'Additional Bookings (31-60)'
                            : tier.name === 'Bookings 61-90'
                              ? 'Volume Discount (61-90)'
                              : 'Premium Volume (91+)'}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-muted-foreground">Price per booking:</div>
                        <div className="text-right font-medium">
                          R{tier.pricePerBooking.toFixed(2)}
                        </div>

                        <div className="text-muted-foreground">Bookings:</div>
                        <div className="text-right font-medium">
                          {tier.bookingsUsed.toLocaleString()}
                        </div>

                        <div className="text-muted-foreground">Total price:</div>
                        <div className="text-right font-medium">
                          R
                          {tier.totalPrice.toLocaleString('en-ZA', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Total Card */}
                <Card className="border shadow-sm">
                  <CardContent className="p-4">
                    <div className="mb-2 font-bold">Total</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Average per booking:</div>
                      <div className="text-right font-medium">
                        R{pricingBreakdown.averagePricePerBooking.toFixed(2)}
                      </div>

                      <div className="text-muted-foreground">Total bookings:</div>
                      <div className="text-right font-medium">
                        {pricingBreakdown.totalBookings.toLocaleString()}
                      </div>

                      <div className="text-muted-foreground">Total cost:</div>
                      <div className="text-right font-medium">
                        R
                        {pricingBreakdown.totalCost.toLocaleString('en-ZA', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
