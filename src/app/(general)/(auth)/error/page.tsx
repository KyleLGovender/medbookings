'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect } from 'react';

// Simple button matching the login page design
const Button = ({
  onClick,
  children,
  className,
  variant = 'primary',
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
}) => (
  <button
    onClick={onClick}
    className={className || ''}
    style={{
      padding: '10px 20px',
      fontSize: '16px',
      cursor: 'pointer',
      backgroundColor: variant === 'primary' ? '#4285F4' : '#f1f3f4',
      color: variant === 'primary' ? 'white' : '#202124',
      border: variant === 'primary' ? 'none' : '1px solid #dadce0',
      borderRadius: '4px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '10px',
      marginRight: '10px',
    }}
  >
    {children}
  </button>
);

// Error icon SVG
const ErrorIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="#DC2626" strokeWidth="2" />
    <path d="M12 8V12" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="16" r="1" fill="#DC2626" />
  </svg>
);

interface ErrorDetails {
  title: string;
  message: string;
  technicalDetails?: string;
  showRetry: boolean;
}

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');

  // Log error for monitoring
  useEffect(() => {
    if (error) {
      // Log to console in development
      console.error('NextAuth Error:', {
        error,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      });

      // TODO: In production, send to monitoring service (e.g., Sentry, LogRocket, etc.)
      // Example:
      // if (process.env.NODE_ENV === 'production') {
      //   logToMonitoring({ type: 'auth_error', error, timestamp: new Date() });
      // }
    }
  }, [error]);

  // Map NextAuth error codes to user-friendly messages
  const getErrorDetails = (errorCode: string | null): ErrorDetails => {
    const errorMap: { [key: string]: ErrorDetails } = {
      Configuration: {
        title: 'Configuration Error',
        message: 'There is a problem with the server configuration. Please try again later.',
        technicalDetails: 'The authentication service is not properly configured.',
        showRetry: false,
      },
      AccessDenied: {
        title: 'Access Denied',
        message:
          'You do not have permission to sign in. This may be because your account has not been approved yet.',
        technicalDetails: 'Sign-in was explicitly denied by the authentication provider.',
        showRetry: true,
      },
      Verification: {
        title: 'Verification Error',
        message: 'The verification link is invalid or has expired. Please request a new one.',
        technicalDetails: 'The token used for verification is no longer valid.',
        showRetry: true,
      },
      OAuthSignin: {
        title: 'OAuth Sign-In Error',
        message: 'There was an error connecting to the sign-in provider. Please try again.',
        technicalDetails: 'Failed to construct authorization URL for OAuth provider.',
        showRetry: true,
      },
      OAuthCallback: {
        title: 'OAuth Callback Error',
        message: 'There was an error during the authentication process. Please try again.',
        technicalDetails: 'Error handling the callback from the OAuth provider.',
        showRetry: true,
      },
      OAuthCreateAccount: {
        title: 'Account Creation Error',
        message: 'Could not create your account. Please try again or contact support.',
        technicalDetails: 'Failed to create user account from OAuth provider data.',
        showRetry: true,
      },
      EmailCreateAccount: {
        title: 'Account Creation Error',
        message: 'Could not create your account via email. Please try again later.',
        technicalDetails: 'Failed to create user account via email provider.',
        showRetry: true,
      },
      Callback: {
        title: 'Callback Error',
        message: 'An error occurred during sign-in. Please try again.',
        technicalDetails: 'Error in OAuth callback handler.',
        showRetry: true,
      },
      OAuthAccountNotLinked: {
        title: 'Account Already Exists',
        message:
          'This email is already associated with another account. Please sign in with the original method you used for this email.',
        technicalDetails: 'Email is associated with a different sign-in method.',
        showRetry: true,
      },
      EmailSignin: {
        title: 'Email Sign-In Error',
        message: 'Could not send sign-in email. Please check your email address and try again.',
        technicalDetails: 'Failed to send verification email.',
        showRetry: true,
      },
      CredentialsSignin: {
        title: 'Sign-In Failed',
        message: 'Sign in failed. Please check the details you provided are correct.',
        technicalDetails: 'Invalid credentials provided.',
        showRetry: true,
      },
      SessionRequired: {
        title: 'Session Required',
        message: 'Please sign in to access this page.',
        technicalDetails: 'Valid session is required to access the requested resource.',
        showRetry: true,
      },
      Default: {
        title: 'Authentication Error',
        message: 'An unexpected error occurred during authentication. Please try again.',
        technicalDetails: 'Unknown error code received.',
        showRetry: true,
      },
    };

    return errorMap[errorCode || 'Default'] || errorMap.Default;
  };

  const errorDetails = getErrorDetails(error);

  const handleRetry = () => {
    // Redirect back to login page
    router.push('/login');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        padding: '20px',
      }}
    >
      {/* Error Icon */}
      <div style={{ marginBottom: '20px' }}>
        <ErrorIcon />
      </div>

      {/* Error Title */}
      <h1 style={{ fontSize: '28px', marginBottom: '10px', color: '#DC2626', textAlign: 'center' }}>
        {errorDetails.title}
      </h1>

      {/* Error Message */}
      <div
        style={{
          maxWidth: '500px',
          textAlign: 'center',
          marginBottom: '30px',
        }}
      >
        <p
          style={{
            fontSize: '16px',
            color: '#374151',
            marginBottom: '15px',
            lineHeight: '1.5',
          }}
        >
          {errorDetails.message}
        </p>

        {/* Technical Details (shown in a subtle way) */}
        {errorDetails.technicalDetails && (
          <details
            style={{
              backgroundColor: '#f9fafb',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              marginTop: '15px',
              textAlign: 'left',
            }}
          >
            <summary
              style={{
                cursor: 'pointer',
                fontSize: '14px',
                color: '#6b7280',
                fontWeight: '500',
              }}
            >
              Technical Details
            </summary>
            <p
              style={{
                marginTop: '8px',
                fontSize: '13px',
                color: '#6b7280',
                fontFamily: 'monospace',
              }}
            >
              <strong>Error Code:</strong> {error}
              <br />
              <strong>Details:</strong> {errorDetails.technicalDetails}
            </p>
          </details>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {errorDetails.showRetry && (
          <Button onClick={handleRetry} variant="primary">
            Try Again
          </Button>
        )}
        <Button onClick={handleGoHome} variant="secondary">
          Go to Home
        </Button>
      </div>

      {/* Additional Help Text */}
      <p
        style={{
          marginTop: '30px',
          fontSize: '14px',
          color: '#6b7280',
          textAlign: 'center',
        }}
      >
        If this problem persists, please contact{' '}
        <a
          href="mailto:support@medbookings.co.za"
          style={{ color: '#4285F4', textDecoration: 'none' }}
        >
          support@medbookings.co.za
        </a>
      </p>
    </div>
  );
}
