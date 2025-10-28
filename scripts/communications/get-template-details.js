/**
 * Alternative script to get template details using Twilio's content API
 */

require('dotenv').config();
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function getTemplateDetails() {
  console.log('🔍 Getting detailed template information...\n');

  const templateIds = [
    'HX8bfd0fc829de1adfe41f2e526d42cabf', // Guest confirmation
    'HX7b7542c849bf762b63fc38dcb069f6f1', // Provider notification
  ];

  for (const templateId of templateIds) {
    try {
      console.log(`📋 Template: ${templateId}`);

      // Get basic template info
      const template = await client.content.v1.contents(templateId).fetch();
      console.log(`Name: ${template.friendlyName}`);
      console.log(`Date Created: ${template.dateCreated}`);
      console.log(`Language: ${template.language}`);

      // Get approval requests to see status
      const approvalRequests = await client.content.v1.contents(templateId).approvalRequests.list();
      if (approvalRequests.length > 0) {
        const latestRequest = approvalRequests[0];
        console.log(`Status: ${latestRequest.status}`);
        if (latestRequest.status === 'approved') {
          console.log('✅ Template is approved and ready to use');
        } else {
          console.log(`⚠️  Template status: ${latestRequest.status}`);
        }
      }

      // Try to get the actual content
      console.log('\n**Available Types:**');
      if (template.types) {
        Object.keys(template.types).forEach((type) => {
          console.log(`- ${type}`);
        });

        // Check for WhatsApp template content
        if (template.types['twilio/text']) {
          console.log('\n**Text Content:**');
          console.log(template.types['twilio/text'].body);
        }

        if (template.types['twilio/whatsapp']) {
          console.log('\n**WhatsApp Content:**');
          console.log(JSON.stringify(template.types['twilio/whatsapp'], null, 2));
        }
      }

      console.log('\n' + '='.repeat(80) + '\n');
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log(`Error code: ${error.code}`);
      console.log('\n' + '='.repeat(80) + '\n');
    }
  }

  // Also show recommendations
  console.log('💡 **Analysis & Recommendations:**\n');
  console.log(
    "Based on your guest booking implementation, here's what your templates should contain:\n"
  );

  console.log('**Guest Confirmation Template (8 variables):**');
  console.log('{{1}}: Guest name');
  console.log('{{2}}: Provider name');
  console.log('{{3}}: Appointment date');
  console.log('{{4}}: Appointment time');
  console.log('{{5}}: Service type');
  console.log('{{6}}: Location or "Online consultation"');
  console.log('{{7}}: Booking reference (e.g., #ABC12345)');
  console.log('{{8}}: Duration (e.g., "30 minutes")');

  console.log('\n**Provider Notification Template (9 variables):**');
  console.log('{{1}}: Provider name');
  console.log('{{2}}: Guest name');
  console.log('{{3}}: Appointment date');
  console.log('{{4}}: Appointment time');
  console.log('{{5}}: Service type');
  console.log('{{6}}: Location or "Online consultation"');
  console.log('{{7}}: Booking reference');
  console.log('{{8}}: Guest phone number');
  console.log('{{9}}: Duration');
}

getTemplateDetails();
