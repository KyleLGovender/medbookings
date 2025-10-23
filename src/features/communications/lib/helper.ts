import { logger, sanitizeEmail } from '@/lib/logger';

/**
 * Email logging utility for development
 * Logs email content to logger until email service is implemented
 */
export function logEmail(params: {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  type: string; // Made generic - any string instead of specific types
}) {
  logger.info('Email would be sent', {
    to: sanitizeEmail(params.to),
    subject: params.subject,
    type: params.type,
    hasHtmlContent: !!params.htmlContent,
    hasTextContent: !!params.textContent,
    htmlContentLength: params.htmlContent.length,
    textContentLength: params.textContent?.length || 0,
  });

  // Log content separately at debug level for development troubleshooting
  logger.info('Email HTML content', {
    to: sanitizeEmail(params.to),
    htmlContent: params.htmlContent,
  });

  if (params.textContent) {
    logger.info('Email text content', {
      to: sanitizeEmail(params.to),
      textContent: params.textContent,
    });
  }
}
