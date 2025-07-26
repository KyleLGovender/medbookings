/**
 * Unauthorized access error page
 * 
 * Context-aware error page that provides specific messaging
 * based on the type of permission violation.
 */

'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertTriangle,
  ArrowLeft,
  Building,
  Home,
  Lock,
  Shield,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

interface UnauthorizedPageProps {
  searchParams: {
    reason?: string;
    attempted_route?: string;
  };
}

function UnauthorizedContent({ searchParams }: UnauthorizedPageProps) {
  const reason = searchParams.reason || 'access_denied';
  const attemptedRoute = searchParams.attempted_route || '';

  const getErrorDetails = () => {
    switch (reason) {
      case 'insufficient_permissions':
        return {
          icon: <Shield className='h-12 w-12 text-orange-500' />,
          title: 'Insufficient Permissions',
          description: 'You do not have the required permissions to access this resource.',
          suggestions: [
            'Contact your organization administrator to request access',
            'Verify you are logged in with the correct account',
            'Check if you need additional role assignments'
          ]
        };
      
      case 'not_authenticated':
        return {
          icon: <Lock className='h-12 w-12 text-red-500' />,
          title: 'Authentication Required',
          description: 'You must be logged in to access this resource.',
          suggestions: [
            'Sign in to your account',
            'Create a new account if you don\'t have one',
            'Reset your password if you\'ve forgotten it'
          ]
        };
      
      case 'organization_access':
        return {
          icon: <Building className='h-12 w-12 text-blue-500' />,
          title: 'Organization Access Required',
          description: 'You must be a member of this organization to access this resource.',
          suggestions: [
            'Request an invitation from an organization administrator',
            'Verify you are accessing the correct organization',
            'Contact support if you believe this is an error'
          ]
        };
      
      case 'provider_access':
        return {
          icon: <Users className='h-12 w-12 text-purple-500' />,
          title: 'Provider Access Required',
          description: 'You must be a registered service provider to access this resource.',
          suggestions: [
            'Complete your provider registration',
            'Wait for admin approval of your provider application',
            'Contact support for assistance with your provider status'
          ]
        };
      
      default:
        return {
          icon: <AlertTriangle className='h-12 w-12 text-red-500' />,
          title: 'Access Denied',
          description: 'You do not have permission to access this resource.',
          suggestions: [
            'Contact your administrator for assistance',
            'Verify you are using the correct account',
            'Return to the main dashboard'
          ]
        };
    }
  };

  const errorDetails = getErrorDetails();
  
  const getRouteDescription = (route: string) => {
    if (route.startsWith('/admin')) {
      return 'Administrator Dashboard';
    }
    if (route.startsWith('/organizations')) {
      return 'Organization Management';
    }
    if (route.startsWith('/providers')) {
      return 'Provider Management';
    }
    if (route.startsWith('/calendar/availability')) {
      return 'Availability Management';
    }
    return 'Protected Resource';
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <Card>
          <CardHeader className='text-center'>
            <div className='flex justify-center mb-4'>
              {errorDetails.icon}
            </div>
            <CardTitle className='text-2xl font-bold text-gray-900'>
              {errorDetails.title}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <p className='text-center text-gray-600'>
              {errorDetails.description}
            </p>
            
            {attemptedRoute && (
              <Alert>
                <AlertTriangle className='h-4 w-4' />
                <AlertDescription>
                  <strong>Attempted Access:</strong> {getRouteDescription(attemptedRoute)}
                  <br />
                  <span className='text-sm text-muted-foreground font-mono'>
                    {attemptedRoute}
                  </span>
                </AlertDescription>
              </Alert>
            )}

            <div className='space-y-4'>
              <h4 className='font-medium text-gray-900'>What you can do:</h4>
              <ul className='space-y-2'>
                {errorDetails.suggestions.map((suggestion, index) => (
                  <li key={index} className='flex items-start'>
                    <div className='flex-shrink-0 w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3' />
                    <span className='text-sm text-gray-600'>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className='flex flex-col space-y-3'>
              <Button 
                asChild 
                className='w-full'
              >
                <Link href='/dashboard'>
                  <Home className='h-4 w-4 mr-2' />
                  Go to Dashboard
                </Link>
              </Button>
              
              <Button 
                variant='outline' 
                asChild 
                className='w-full'
              >
                <Link href='/profile'>
                  <Users className='h-4 w-4 mr-2' />
                  View Profile
                </Link>
              </Button>
              
              {attemptedRoute && (
                <Button 
                  variant='ghost' 
                  onClick={() => window.history.back()}
                  className='w-full'
                >
                  <ArrowLeft className='h-4 w-4 mr-2' />
                  Go Back
                </Button>
              )}
            </div>

            <div className='text-center'>
              <p className='text-sm text-gray-500'>
                Need help? {' '}
                <Link 
                  href='mailto:support@medbookings.com' 
                  className='font-medium text-blue-600 hover:text-blue-500'
                >
                  Contact Support
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function UnauthorizedPage(props: UnauthorizedPageProps) {
  return (
    <Suspense fallback={
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900'></div>
      </div>
    }>
      <UnauthorizedContent {...props} />
    </Suspense>
  );
}
