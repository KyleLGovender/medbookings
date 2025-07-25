import {
  AvailabilityNotificationContext,
  AvailabilityStatus,
  AvailabilityWithRelations,
  NotificationPayload,
} from '@/features/calendar/types/types';

/**
 * Generate notifications for availability status changes
 * For now, this logs what would be sent - in production this would integrate with
 * email service, SMS service, and in-app notification system
 */
export async function sendAvailabilityStatusNotifications(
  context: AvailabilityNotificationContext
): Promise<void> {
  const notifications = generateNotifications(context);

  try {
    // In production, this would integrate with email service, SMS service, and in-app notification system
    // For now, notifications are generated but not sent to avoid console noise in production
    
    // Production implementation would include:
    // await sendEmailNotifications(notifications.filter(n => n.type === 'email'));
    // await sendSMSNotifications(notifications.filter(n => n.type === 'sms'));
    // await sendInAppNotifications(notifications.filter(n => n.type === 'in_app'));
    
    // Silent success - notifications are prepared but logging is removed for production cleanliness
  } catch (error) {
    // Only log actual errors that need investigation
    if (error instanceof Error) {
      throw new Error(`Failed to process availability notifications: ${error.message}`);
    }
    throw new Error('Failed to process availability notifications: Unknown error');
  }

  // In production, you would:
  // await sendEmailNotifications(notifications.filter(n => n.type === 'email'));
  // await sendSMSNotifications(notifications.filter(n => n.type === 'sms'));
  // await sendInAppNotifications(notifications.filter(n => n.type === 'in_app'));
}

function generateNotifications(context: AvailabilityNotificationContext): NotificationPayload[] {
  const { availability, newStatus, actionBy, rejectionReason } = context;
  const notifications: NotificationPayload[] = [];

  switch (newStatus) {
    case AvailabilityStatus.PENDING:
      // Notify provider about new proposal
      notifications.push(...generateProposalNotifications(context));
      break;

    case AvailabilityStatus.ACCEPTED:
      // Notify organization about acceptance
      notifications.push(...generateAcceptanceNotifications(context));
      break;

    case AvailabilityStatus.REJECTED:
      // Notify organization about rejection
      notifications.push(...generateRejectionNotifications(context));
      break;

    case AvailabilityStatus.CANCELLED:
      // Notify relevant parties about cancellation
      notifications.push(...generateCancellationNotifications(context));
      break;
  }

  return notifications;
}

function generateProposalNotifications(
  context: AvailabilityNotificationContext
): NotificationPayload[] {
  const { availability, actionBy } = context;
  const notifications: NotificationPayload[] = [];

  // Notify the provider about the new proposal
  if (availability.provider) {
    const startTime = `${availability.startTime.toLocaleDateString()} ${availability.startTime.toLocaleTimeString(
      [],
      { hour: '2-digit', minute: '2-digit' }
    )}`;
    const endTime = availability.endTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const organizationName = availability.organization?.name || 'An organization';

    notifications.push({
      recipientId: availability.provider.id,
      recipientEmail: availability.provider.email,
      recipientName: availability.provider.name,
      type: 'email',
      subject: `New Availability Proposal from ${organizationName}`,
      message:
        `${organizationName} has proposed new availability for you to review.\n\n` +
        `Date & Time: ${startTime} - ${endTime}\n` +
        `Services: ${availability.availableServices?.length || 0} service(s) configured\n` +
        `Recurring: ${availability.isRecurring ? 'Yes' : 'No'}\n\n` +
        'Please review this proposal and accept or reject it in your dashboard.',
      actionUrl: '/dashboard/availability/proposals',
      metadata: {
        availabilityId: availability.id,
        organizationId: availability.organizationId,
        notificationType: 'availability_proposal',
      },
    });

    // Also send in-app notification
    notifications.push({
      recipientId: availability.provider.id,
      recipientEmail: availability.provider.email,
      recipientName: availability.provider.name,
      type: 'in_app',
      subject: 'New Availability Proposal',
      message: `${organizationName} sent you an availability proposal for ${startTime}`,
      actionUrl: '/dashboard/availability/proposals',
      metadata: {
        availabilityId: availability.id,
        organizationId: availability.organizationId,
        notificationType: 'availability_proposal',
        priority: 'normal',
      },
    });
  }

  return notifications;
}

function generateAcceptanceNotifications(
  context: AvailabilityNotificationContext
): NotificationPayload[] {
  const { availability, actionBy } = context;
  const notifications: NotificationPayload[] = [];

  // Notify organization members about acceptance
  if (availability.organization && availability.createdBy) {
    const startTime = `${availability.startTime.toLocaleDateString()} ${availability.startTime.toLocaleTimeString(
      [],
      { hour: '2-digit', minute: '2-digit' }
    )}`;
    const providerName = availability.provider?.name;

    notifications.push({
      recipientId: availability.createdBy.id,
      recipientEmail: availability.createdBy.email || 'member@example.com',
      recipientName: availability.createdBy.name || 'Organization Member',
      type: 'email',
      subject: `Availability Proposal Accepted - ${providerName}`,
      message:
        `Great news! ${providerName} has accepted your availability proposal.\n\n` +
        `Date & Time: ${startTime}\n` +
        `Services: ${availability.availableServices?.length || 0} service(s)\n` +
        `Slots Generated: ${availability.calculatedSlots?.length || 0}\n\n` +
        'The availability is now active and patients can start booking appointments.',
      actionUrl: `/dashboard/organizations/${availability.organizationId}/availability`,
      metadata: {
        availabilityId: availability.id,
        serviceProviderId: availability.providerId,
        notificationType: 'availability_accepted',
      },
    });

    // In-app notification
    notifications.push({
      recipientId: availability.createdBy.id,
      recipientEmail: availability.createdBy.email || 'member@example.com',
      recipientName: availability.createdBy.name || 'Organization Member',
      type: 'in_app',
      subject: 'Proposal Accepted',
      message: `${providerName} accepted your availability proposal`,
      actionUrl: `/dashboard/organizations/${availability.organizationId}/availability`,
      metadata: {
        availabilityId: availability.id,
        serviceProviderId: availability.providerId,
        notificationType: 'availability_accepted',
        priority: 'high',
      },
    });
  }

  return notifications;
}

function generateRejectionNotifications(
  context: AvailabilityNotificationContext
): NotificationPayload[] {
  const { availability, actionBy, rejectionReason } = context;
  const notifications: NotificationPayload[] = [];

  // Notify organization members about rejection
  if (availability.organization && availability.createdBy) {
    const startTime = `${availability.startTime.toLocaleDateString()} ${availability.startTime.toLocaleTimeString(
      [],
      { hour: '2-digit', minute: '2-digit' }
    )}`;
    const providerName = availability.provider?.name;

    let message =
      `${providerName} has declined your availability proposal.\n\n` +
      `Date & Time: ${startTime}\n` +
      `Services: ${availability.availableServices?.length || 0} service(s)\n\n`;

    if (rejectionReason) {
      message += `Reason provided: "${rejectionReason}"\n\n`;
    }

    message += 'You can create a new proposal with different terms if needed.';

    notifications.push({
      recipientId: availability.createdBy.id,
      recipientEmail: availability.createdBy.email || 'member@example.com',
      recipientName: availability.createdBy.name || 'Organization Member',
      type: 'email',
      subject: `Availability Proposal Declined - ${providerName}`,
      message,
      actionUrl: `/dashboard/organizations/${availability.organizationId}/availability`,
      metadata: {
        availabilityId: availability.id,
        serviceProviderId: availability.providerId,
        notificationType: 'availability_rejected',
        rejectionReason,
      },
    });

    // In-app notification
    notifications.push({
      recipientId: availability.createdBy.id,
      recipientEmail: availability.createdBy.email || 'member@example.com',
      recipientName: availability.createdBy.name || 'Organization Member',
      type: 'in_app',
      subject: 'Proposal Declined',
      message: `${providerName} declined your availability proposal${rejectionReason ? `: ${rejectionReason}` : ''}`,
      actionUrl: `/dashboard/organizations/${availability.organizationId}/availability`,
      metadata: {
        availabilityId: availability.id,
        serviceProviderId: availability.providerId,
        notificationType: 'availability_rejected',
        priority: 'normal',
        rejectionReason,
      },
    });
  }

  return notifications;
}

function generateCancellationNotifications(
  context: AvailabilityNotificationContext
): NotificationPayload[] {
  const { availability, actionBy } = context;
  const notifications: NotificationPayload[] = [];

  const startTime = `${availability.startTime.toLocaleDateString()} ${availability.startTime.toLocaleTimeString(
    [],
    { hour: '2-digit', minute: '2-digit' }
  )}`;
  const bookedSlots = availability.calculatedSlots?.filter((slot) => slot.booking)?.length || 0;

  // Notify the provider if organization cancelled
  if (availability.provider && actionBy.id !== availability.provider.id) {
    notifications.push({
      recipientId: availability.provider.id,
      recipientEmail: availability.provider.email,
      recipientName: availability.provider.name,
      type: 'email',
      subject: `Availability Cancelled - ${availability.organization?.name}`,
      message:
        `${availability.organization?.name} has cancelled the availability scheduled for ${startTime}.\n\n` +
        `${bookedSlots > 0 ? `This affects ${bookedSlots} existing booking(s).` : 'No existing bookings were affected.'}\n\n` +
        'If you have questions, please contact the organization directly.',
      metadata: {
        availabilityId: availability.id,
        organizationId: availability.organizationId,
        notificationType: 'availability_cancelled',
        bookedSlots,
      },
    });
  }

  // Notify organization if provider cancelled
  if (
    availability.organization &&
    availability.createdBy &&
    actionBy.id !== availability.createdBy.id
  ) {
    const providerName = availability.provider?.name;

    notifications.push({
      recipientId: availability.createdBy.id,
      recipientEmail: availability.createdBy.email || 'member@example.com',
      recipientName: availability.createdBy.name || 'Organization Member',
      type: 'email',
      subject: `Availability Cancelled - ${providerName}`,
      message:
        `${providerName} has cancelled the availability scheduled for ${startTime}.\n\n` +
        `${bookedSlots > 0 ? `This affects ${bookedSlots} existing booking(s).` : 'No existing bookings were affected.'}\n\n` +
        'You may need to contact affected patients directly.',
      metadata: {
        availabilityId: availability.id,
        serviceProviderId: availability.providerId,
        notificationType: 'availability_cancelled',
        bookedSlots,
      },
    });
  }

  return notifications;
}

/**
 * Send notification when availability proposal is created
 */
export async function notifyAvailabilityProposed(
  availability: AvailabilityWithRelations,
  createdBy: { id: string; name: string; role: string }
): Promise<void> {
  await sendAvailabilityStatusNotifications({
    availability,
    newStatus: AvailabilityStatus.PENDING,
    actionBy: createdBy,
  });
}

/**
 * Send notification when availability proposal is accepted
 */
export async function notifyAvailabilityAccepted(
  availability: AvailabilityWithRelations,
  acceptedBy: { id: string; name: string; role: string }
): Promise<void> {
  await sendAvailabilityStatusNotifications({
    availability,
    previousStatus: AvailabilityStatus.PENDING,
    newStatus: AvailabilityStatus.ACCEPTED,
    actionBy: acceptedBy,
  });
}

/**
 * Send notification when availability proposal is rejected
 */
export async function notifyAvailabilityRejected(
  availability: AvailabilityWithRelations,
  rejectedBy: { id: string; name: string; role: string },
  reason?: string
): Promise<void> {
  await sendAvailabilityStatusNotifications({
    availability,
    previousStatus: AvailabilityStatus.PENDING,
    newStatus: AvailabilityStatus.REJECTED,
    actionBy: rejectedBy,
    rejectionReason: reason,
  });
}

/**
 * Send notification when availability is cancelled
 */
export async function notifyAvailabilityCancelled(
  availability: AvailabilityWithRelations,
  cancelledBy: { id: string; name: string; role: string }
): Promise<void> {
  await sendAvailabilityStatusNotifications({
    availability,
    previousStatus: availability.status,
    newStatus: AvailabilityStatus.CANCELLED,
    actionBy: cancelledBy,
  });
}
