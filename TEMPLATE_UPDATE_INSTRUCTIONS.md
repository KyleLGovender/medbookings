# Template Update Instructions

## New Template IDs to Update

Once you create the new templates in Twilio Console, you'll get new SIDs.
Provide me with:

### Guest Booking Confirmation Template
- **Template Name:** guest_booking_confirmation_v2
- **New SID:** [YOU WILL PROVIDE THIS]
- **Current Code Location:** src/features/communications/lib/whatsapp-templates.ts (line 49)
- **Current SID:** HX8bfd0fc829de1adfe41f2e526d42cabf

### Provider Booking Notification Template
- **Template Name:** provider_booking_notification_v2
- **New SID:** [YOU WILL PROVIDE THIS]
- **Current Code Location:** src/features/communications/lib/whatsapp-templates.ts (line 94)
- **Current SID:** HX7b7542c849bf762b63fc38dcb069f6f1

## Files That Will Be Updated

1. `/src/features/communications/lib/whatsapp-templates.ts`
   - Line 49: contentSid for guest booking
   - Line 94: contentSid for provider booking

2. (Optional) Documentation update in the file comments

## Variable Verification

✅ **Guest Template (8 variables required):**
- {{1}}: Guest name
- {{2}}: Provider name
- {{3}}: Appointment date
- {{4}}: Appointment time
- {{5}}: Service type
- {{6}}: Location
- {{7}}: Booking reference
- {{8}}: Duration

✅ **Provider Template (9 variables required):**
- {{1}}: Provider name
- {{2}}: Guest name
- {{3}}: Appointment date
- {{4}}: Appointment time
- {{5}}: Service type
- {{6}}: Location
- {{7}}: Booking reference
- {{8}}: Guest phone
- {{9}}: Duration

## After Template Creation

1. Create both templates in Twilio Console
2. Submit for WhatsApp approval
3. Provide me with the new SIDs
4. I'll update your code immediately
5. Deploy and test!

## Approval Timeline

- **Meta Approval:** Usually 24-48 hours
- **Testing:** Can test immediately after approval
- **Fallback:** System continues working even if templates fail