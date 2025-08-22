'use client';

import React from 'react';

import { CheckCircle, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface BookingSuccessToastProps {
  show: boolean;
  onClose: () => void;
  providerName: string;
  appointmentTime: string;
}

export function BookingSuccessToast({
  show,
  onClose,
  providerName,
  appointmentTime,
}: BookingSuccessToastProps) {
  // Auto-hide after 5 seconds
  React.useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 duration-300 animate-in slide-in-from-bottom">
      <Card className="w-96 border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-green-600" />

            <div className="flex-1">
              <h3 className="font-semibold text-green-800">Booking Confirmed!</h3>
              <p className="mt-1 text-sm text-green-700">
                Your appointment with {providerName} on {appointmentTime} has been confirmed.
              </p>
              <p className="mt-1 text-sm text-green-600">
                You will receive a confirmation email shortly.
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-green-600 hover:bg-green-100 hover:text-green-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
