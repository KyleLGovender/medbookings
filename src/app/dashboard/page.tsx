import { redirect } from 'next/navigation';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Building2,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Activity
} from 'lucide-react';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/**
 * User Dashboard Page
 *
 * Displays comprehensive user information including:
 * - User profile details
 * - Provider profile status (if applicable)
 * - Organization memberships
 * - Recent activity summary
 * - Quick action buttons
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Get comprehensive user data
  let provider = null;
  let organizationMemberships: any[] = [];
  let recentBookings: any[] = [];

  try {
    // Get provider profile if exists
    provider = await prisma.provider.findFirst({
      where: { userId: user.id },
      include: {
        typeAssignments: {
          include: {
            providerType: {
              select: { name: true }
            }
          }
        },
        services: {
          select: {
            id: true,
            name: true
          }
        },
        requirementSubmissions: {
          include: {
            requirementType: {
              select: { name: true }
            }
          }
        }
      },
    });

    // Get organization memberships
    organizationMemberships = await prisma.organizationMembership.findMany({
      where: { userId: user.id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            status: true,
          }
        }
      },
    });

    // Get recent booking activity if provider
    if (provider) {
      recentBookings = await prisma.booking.findMany({
        where: {
          slot: {
            availability: {
              providerId: provider.id
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          status: true,
          createdAt: true,
          client: {
            select: {
              name: true,
              email: true
            }
          },
          slot: {
            select: {
              startTime: true,
              endTime: true,
              availability: {
                select: {
                  startTime: true,
                  endTime: true
                }
              }
            }
          }
        }
      });
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const userName = user.name || 'User';
  const userInitials = getInitials(userName);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.image || ''} alt={userName} />
            <AvatarFallback className="text-lg font-semibold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {userName}!
            </h1>
            <p className="text-gray-600">
              Here's your MedBookings dashboard overview
            </p>
          </div>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>

      {/* User Profile Information */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Basic User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Email:</span>
              </div>
              <p className="font-medium">{user.email || 'Not provided'}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Role:</span>
              </div>
              <Badge className={getStatusColor(user.role)}>
                {user.role}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Member since:</span>
              </div>
              <p className="text-sm text-gray-600">Account created</p>
            </div>
          </CardContent>
        </Card>

        {/* Provider Profile Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Provider Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            {provider ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge className={getStatusColor(provider.status)}>
                    {provider.status}
                  </Badge>
                </div>

                <div>
                  <span className="text-sm text-gray-600">Name:</span>
                  <p className="font-medium">{provider.name}</p>
                </div>

                {provider.typeAssignments && provider.typeAssignments.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-600">Specialties:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {provider.typeAssignments.map((assignment: any) => (
                        <Badge key={assignment.id} variant="outline" className="text-xs">
                          {assignment.providerType.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <Button size="sm" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Calendar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="text-gray-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No provider profile found</p>
                </div>
                <Button size="sm" variant="outline">
                  Create Provider Profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Organization Memberships */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {organizationMemberships.length > 0 ? (
              <div className="space-y-3">
                {organizationMemberships.map((membership: any) => (
                  <div key={membership.id} className="border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">
                        {membership.organization.name}
                      </h4>
                      <Badge className={`${getStatusColor(membership.status)} text-xs`}>
                        {membership.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">
                      Role: {membership.role}
                    </p>
                  </div>
                ))}
                <Button size="sm" variant="outline" className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Organizations
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="text-gray-500">
                  <Building2 className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No organization memberships</p>
                </div>
                <Button size="sm" variant="outline">
                  Join Organization
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {provider && recentBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Booking Activity
            </CardTitle>
            <CardDescription>
              Your latest booking activity as a provider
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBookings.map((booking: any) => (
                <div key={booking.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium text-sm">
                      {booking.client?.name || 'Client'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(booking.availability.startTime).toLocaleDateString()} at{' '}
                      {new Date(booking.availability.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(booking.status)} text-xs`}>
                    {booking.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              View Calendar
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Edit Profile
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organizations
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}