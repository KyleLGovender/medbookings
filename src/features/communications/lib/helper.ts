/**
 * Email logging utility for development
 * Logs email content to console until email service is implemented
 */
export function logEmail(params: {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  type: string; // Made generic - any string instead of specific types
}) {
  console.log('=ç EMAIL WOULD BE SENT:');
  console.log('=======================');
  console.log(`To: ${params.to}`);
  console.log(`Subject: ${params.subject}`);
  console.log(`Type: ${params.type}`);
  console.log('------- HTML CONTENT -------');
  console.log(params.htmlContent);
  if (params.textContent) {
    console.log('------- TEXT CONTENT -------');
    console.log(params.textContent);
  }
  console.log('============================\n');
}