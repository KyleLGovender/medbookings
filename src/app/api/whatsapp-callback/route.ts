import { type NextRequest, NextResponse } from 'next/server';

import twilio from 'twilio';

import env from '@/config/env/server';
import { sendGuestVCardToProvider } from '@/features/communications/lib/server-helper';
import { prisma } from '@/lib/prisma';
import { type RouterOutputs } from '@/utils/api';

// Use the same type as the communications action expects
type BookingWithDetails = RouterOutputs['calendar']['getBookingWithDetails'];

// Helper function to normalize phone numbers to E.164 format (reuse from previous example)
function normalizePhoneNumber(phoneNumber: string): string | null {
  let cleaned = phoneNumber.replace(/[^+\d]/g, '');
  cleaned = cleaned.replace(/^whatsapp:/i, '');
  if (!cleaned.startsWith('+')) {
    return null;
  }
  return cleaned;
}

const VCARD_REQUEST_PREFIX = 'VCARD_REQUEST_'; // Define the prefix used in button payloads

// --- Main Handler ---
export async function POST(request: NextRequest) {
  console.log('/api/whatsapp-callback/route.ts POST request', request);
  const twilioSignature = request.headers.get('x-twilio-signature');
  const requestUrl = request.url; // Use the actual request URL

  // 1. --- Twilio Signature Validation ---
  if (!twilioSignature) {
    return NextResponse.json({ error: 'Missing Twilio signature' }, { status: 400 });
  }
  const authToken = env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.error('[WHATSAPP CALLBACK] Twilio Auth Token not configured.');
    return NextResponse.json({ error: 'Internal server configuration error' }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const paramsObject = Object.fromEntries(formData.entries());

    const isValidRequest = twilio.validateRequest(
      authToken,
      twilioSignature,
      requestUrl, // Pass the full request URL
      paramsObject
    );

    if (!isValidRequest) {
      console.warn('[WHATSAPP CALLBACK] Invalid Twilio signature.');
      return NextResponse.json({ error: 'Invalid Twilio signature' }, { status: 403 });
    }

    // 2. --- Parse Payload - Focus on Interactive Reply ---
    const fromNumberRaw = formData.get('From') as string;
    const buttonPayload = formData.get('ButtonPayload') as string | null; // Adjust field name if using Lists, etc.
    // const messageBody = formData.get('Body') as string; // Less relevant now for button clicks

    if (!fromNumberRaw) {
      console.warn('[WHATSAPP CALLBACK] Missing From in payload.');
      return NextResponse.json({ error: 'Missing required payload fields' }, { status: 400 });
    }

    // Check if it's an interactive reply we care about
    if (!buttonPayload) {
      console.log(
        `[WHATSAPP CALLBACK] Received non-button message from ${fromNumberRaw}. Ignoring.`
      );
      // Handle regular text messages separately if needed, otherwise just acknowledge.
      return NextResponse.json({}, { status: 200 });
    }

    const fromNumberNormalized = normalizePhoneNumber(fromNumberRaw);
    if (!fromNumberNormalized) {
      console.warn(`[WHATSAPP CALLBACK] Could not normalize From number: ${fromNumberRaw}`);
      return NextResponse.json({ error: 'Invalid From number format' }, { status: 400 });
    }

    console.log(
      `[WHATSAPP CALLBACK] Received button click from ${fromNumberNormalized} with payload: "${buttonPayload}"`
    );

    // 3. --- Routing Logic based on Button Payload ---

    // == Use Case 1: Request Patient vCard via Button ==
    if (buttonPayload.startsWith(VCARD_REQUEST_PREFIX)) {
      const bookingId = buttonPayload.substring(VCARD_REQUEST_PREFIX.length);

      if (!bookingId) {
        console.warn(
          `[WHATSAPP CALLBACK] Invalid VCARD request payload from ${fromNumberNormalized}: ${buttonPayload}`
        );
        return NextResponse.json({ error: 'Invalid button payload format' }, { status: 400 });
      }

      console.log(
        `[WHATSAPP CALLBACK] Handling VCARD request for booking ${bookingId} from ${fromNumberNormalized}`
      );

      // 4. Fetch Booking using extracted ID and Verify Provider Number (Security Check)
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          slot: {
            include: {
              service: true,
              serviceConfig: true,
              availability: {
                include: {
                  provider: true,
                },
              },
            },
          },
        },
      });

      if (!booking) {
        console.error(`[WHATSAPP CALLBACK] Booking ${bookingId} not found for VCARD request.`);
        // Don't reveal booking non-existence, just fail gracefully
        return NextResponse.json({ error: 'Associated booking not found' }, { status: 404 }); // Or 400
      }

      const providerWhatsappNormalized = normalizePhoneNumber(
        booking.slot?.availability?.provider?.whatsapp || ''
      );

      // Verify the sender is the correct provider for this booking ID
      if (!providerWhatsappNormalized || fromNumberNormalized !== providerWhatsappNormalized) {
        console.warn(
          `[WHATSAPP CALLBACK] Number mismatch for VCARD request. From: ${fromNumberNormalized}, Provider for ${bookingId}: ${providerWhatsappNormalized}`
        );
        return NextResponse.json({ error: 'Unauthorized number for this action' }, { status: 403 });
      }

      // --- Authorization Passed ---

      // Check prerequisites
      if (!booking.guestWhatsapp) {
        return NextResponse.json(
          { error: 'Guest WhatsApp number not found for this booking.' },
          { status: 400 }
        );
      }
      if (!booking.slot) {
        return NextResponse.json({ error: 'Booking slot details not found.' }, { status: 400 });
      }

      // 5. Use the booking data directly - it already has the right shape from Prisma query
      // The booking is already typed correctly for sendGuestVCardToProvider function

      // 6. Call the Core Logic
      await sendGuestVCardToProvider(booking); // Pass the booking directly

      console.log(`[WHATSAPP CALLBACK] vCard sent successfully for booking ${booking.id}.`);
      // Return success acknowledgment to Twilio
      return NextResponse.json({}, { status: 200 });
    } // == End Use Case 1 ==

    // Add more `else if (buttonPayload.startsWith(...))` blocks here for other button actions
    else {
      // Handle unrecognized button payloads
      console.log(
        `[WHATSAPP CALLBACK] Unhandled button payload from ${fromNumberNormalized}: "${buttonPayload}"`
      );
      return NextResponse.json({}, { status: 200 }); // Acknowledge receipt
    }
  } catch (error) {
    console.error('[WHATSAPP CALLBACK] Error processing webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json(
      { error: 'Failed to process message', details: errorMessage },
      { status: 500 }
    );
  }
}

// You might also want a GET handler for Twilio's initial connectivity check if needed
export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  const userAgent = request.headers.get('user-agent') || 'N/A';
  const ip = request.ip || 'N/A'; // Vercel provides this

  console.log(
    `[GET /api/whatsapp-callback] START ${timestamp} - IP: ${ip} - User-Agent: ${userAgent}`
  );
  console.log(`[GET] NODE_ENV: ${env.NODE_ENV}`);
  console.log(`[GET /api/whatsapp-callback] END ${timestamp}`);

  return NextResponse.json({ message: 'Webhook reachable' });
}
