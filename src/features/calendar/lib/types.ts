// BookingView type for communication services

export interface BookingView {
  id: string;
  status: string;
  notificationPreferences: {
    whatsapp: boolean;
  };
  guestInfo: {
    name: string;
    whatsapp?: string;
  };
  slot: {
    id: string;
    startTime: Date;
    endTime: Date;
    status: string;
    service: {
      id: string;
      name: string;
      description?: string;
      displayPriority?: number;
    };
    serviceConfig: {
      id: string;
      price: number;
      duration: number;
      isOnlineAvailable: boolean;
      isInPerson: boolean;
      location?: string;
    };
    provider: {
      id: string;
      name: string;
      whatsapp?: string;
      image?: string;
    };
  };
}