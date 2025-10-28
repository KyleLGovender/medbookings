/**
 * Script to check the specific templates used in guest booking flow
 */

require('dotenv').config();
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function checkSpecificTemplates() {
  console.log('🔍 Checking templates used in guest booking flow...\n');

  const templatesInUse = [
    {
      id: 'HX8bfd0fc829de1adfe41f2e526d42cabf',
      purpose: 'Guest Booking Confirmation',
      expectedVariables: 8,
      variables: [
        'Guest name',
        'Provider name',
        'Date',
        'Time',
        'Service',
        'Location',
        'Reference',
        'Duration',
      ],
    },
    {
      id: 'HX7b7542c849bf762b63fc38dcb069f6f1',
      purpose: 'Provider Booking Notification',
      expectedVariables: 9,
      variables: [
        'Provider name',
        'Guest name',
        'Date',
        'Time',
        'Service',
        'Location',
        'Reference',
        'Guest phone',
        'Duration',
      ],
    },
  ];

  for (const templateInfo of templatesInUse) {
    try {
      console.log(`📋 **${templateInfo.purpose}**`);
      console.log(`Template ID: ${templateInfo.id}`);

      const template = await client.content.v1.contents(templateInfo.id).fetch();

      console.log(`Name: ${template.friendlyName}`);
      console.log(`Language: ${template.language}`);

      if (template.types?.['twilio/text']) {
        const textBody = template.types['twilio/text'].body;
        const variableCount = (textBody.match(/\{\{\d+\}\}/g) || []).length;

        console.log(
          `Variables found: ${variableCount} (expected: ${templateInfo.expectedVariables})`
        );

        if (variableCount === templateInfo.expectedVariables) {
          console.log('✅ Variable count matches!');
        } else {
          console.log('⚠️  Variable count mismatch - template may need updating');
        }

        console.log('\n**Template Content:**');
        console.log(textBody);

        console.log('\n**Expected Variables:**');
        templateInfo.variables.forEach((variable, index) => {
          console.log(`{{${index + 1}}}: ${variable}`);
        });
      }

      console.log('\n' + '='.repeat(60) + '\n');
    } catch (error) {
      console.log(`❌ Error fetching template ${templateInfo.id}: ${error.message}\n`);
    }
  }
}

checkSpecificTemplates();
