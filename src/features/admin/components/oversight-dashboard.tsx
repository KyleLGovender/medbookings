'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  Building,
  CheckCircle,
  Clock,
  Eye,
  Search,
  Shield,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  useApproveOrganization,
  useRejectOrganization,
} from '@/features/organizations/hooks/use-admin-organization-approval';
import {
  useApproveProvider,
  useRejectProvider,
} from '@/features/providers/hooks/use-admin-provider-approval';
import { usePermissions } from '@/hooks/use-permissions';
import { Permission } from '@/types/permissions';

/**
 * Admin dashboard for provider/organization management
 *
 * Comprehensive dashboard providing administrators with oversight
 * capabilities for the entire platform.
 */

interface PendingProvider {
  id: string;
  email: string;
  name: string;
  providerType: string;
  submittedAt: Date;
  requirementsStatus: 'complete' | 'pending' | 'rejected';
  totalRequirements: number;
  approvedRequirements: number;
}

interface PendingOrganization {
  id: string;
  name: string;
  type: string;
  ownerEmail: string;
  submittedAt: Date;
  locationsCount: number;
}

interface PlatformStats {
  totalUsers: number;
  totalProviders: number;
  totalOrganizations: number;
  pendingProviders: number;
  pendingOrganizations: number;
  activeBookings: number;
}

interface OversightDashboardProps {
  stats: PlatformStats;
  pendingProviders: PendingProvider[];
  pendingOrganizations: PendingOrganization[];
}

export function OversightDashboard({
  stats,
  pendingProviders,
  pendingOrganizations,
}: OversightDashboardProps) {
  const router = useRouter();
  const { hasPermission, isSuperAdmin } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check permissions
  const canApproveProviders = hasPermission(Permission.APPROVE_PROVIDERS);
  const canApproveOrganizations = hasPermission(Permission.APPROVE_ORGANIZATIONS);
  const canAccessAccounts = hasPermission(Permission.ACCESS_ANY_ACCOUNT);

  const filteredProviders = pendingProviders.filter((provider) => {
    const matchesSearch =
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || provider.requirementsStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredOrganizations = pendingOrganizations.filter((org) => {
    return (
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Admin mutation hooks
  const approveProvider = useApproveProvider({
    onSuccess: () => {
      router.refresh();
      setSelectedItem(null);
      setActionType(null);
      setActionReason('');
      setActionNotes('');
      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error('Error approving provider:', error);
      setIsSubmitting(false);
    },
  });

  const rejectProvider = useRejectProvider({
    onSuccess: () => {
      router.refresh();
      setSelectedItem(null);
      setActionType(null);
      setActionReason('');
      setActionNotes('');
      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error('Error rejecting provider:', error);
      setIsSubmitting(false);
    },
  });

  const approveOrganization = useApproveOrganization({
    onSuccess: () => {
      router.refresh();
      setSelectedItem(null);
      setActionType(null);
      setActionReason('');
      setActionNotes('');
      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error('Error approving organization:', error);
      setIsSubmitting(false);
    },
  });

  const rejectOrganization = useRejectOrganization({
    onSuccess: () => {
      router.refresh();
      setSelectedItem(null);
      setActionType(null);
      setActionReason('');
      setActionNotes('');
      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error('Error rejecting organization:', error);
      setIsSubmitting(false);
    },
  });

  const handleApprovalAction = async (
    type: 'provider' | 'organization',
    id: string,
    action: 'approve' | 'reject'
  ) => {
    setIsSubmitting(true);

    if (type === 'provider') {
      if (action === 'approve') {
        approveProvider.mutate({ id });
      } else {
        rejectProvider.mutate({ id, reason: actionReason });
      }
    } else {
      if (action === 'approve') {
        approveOrganization.mutate({ organizationId: id });
      } else {
        rejectOrganization.mutate({ organizationId: id, rejectionReason: actionReason });
      }
    }
  };

  const handleAccountOverride = async (userEmail: string) => {
    try {
      // This function still needs to be implemented in tRPC
      // For now, keep the existing API call as it's not commonly used
      const response = await fetch('/api/admin/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initiate',
          targetUserEmail: userEmail,
          reason: 'Administrative review',
          durationMinutes: 30,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.redirectUrl) {
          router.push(result.redirectUrl);
        }
      }
    } catch (error) {
      console.error('Error initiating override:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform Statistics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Providers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProviders.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrganizations.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Providers</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingProviders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orgs</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingOrganizations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeBookings}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Search providers, organizations, or emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="complete">Requirements Complete</SelectItem>
            <SelectItem value="pending">Requirements Pending</SelectItem>
            <SelectItem value="rejected">Requirements Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="providers" className="w-full">
        <TabsList>
          <TabsTrigger value="providers">Pending Providers ({pendingProviders.length})</TabsTrigger>
          <TabsTrigger value="organizations">
            Pending Organizations ({pendingOrganizations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provider Approval Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Requirements</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProviders.map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{provider.name}</div>
                          <div className="text-sm text-muted-foreground">{provider.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{provider.providerType}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              provider.requirementsStatus === 'complete'
                                ? 'default'
                                : provider.requirementsStatus === 'rejected'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {provider.approvedRequirements}/{provider.totalRequirements}
                          </Badge>
                          {provider.requirementsStatus === 'complete' && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {provider.requirementsStatus === 'rejected' && (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(provider.submittedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/providers/${provider.id}`)}
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            Review
                          </Button>

                          {canApproveProviders && provider.requirementsStatus === 'complete' && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedItem(provider.id);
                                    setActionType('approve');
                                  }}
                                >
                                  <CheckCircle className="mr-1 h-4 w-4" />
                                  Approve
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Approve Provider</DialogTitle>
                                  <DialogDescription>
                                    Approve {provider.name} as a service provider on the platform?
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <Textarea
                                    placeholder="Add notes (optional)..."
                                    value={actionNotes}
                                    onChange={(e) => setActionNotes(e.target.value)}
                                  />
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedItem(null);
                                      setActionType(null);
                                      setActionNotes('');
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      handleApprovalAction('provider', provider.id, 'approve')
                                    }
                                    disabled={isSubmitting}
                                  >
                                    {isSubmitting ? 'Approving...' : 'Approve Provider'}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}

                          {canApproveProviders && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedItem(provider.id);
                                    setActionType('reject');
                                  }}
                                >
                                  <XCircle className="mr-1 h-4 w-4" />
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject Provider</DialogTitle>
                                  <DialogDescription>
                                    Reject {provider.name}&apos;s provider application.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <Textarea
                                    placeholder="Rejection reason (required)..."
                                    value={actionReason}
                                    onChange={(e) => setActionReason(e.target.value)}
                                  />
                                  <Textarea
                                    placeholder="Additional notes (optional)..."
                                    value={actionNotes}
                                    onChange={(e) => setActionNotes(e.target.value)}
                                  />
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedItem(null);
                                      setActionType(null);
                                      setActionReason('');
                                      setActionNotes('');
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() =>
                                      handleApprovalAction('provider', provider.id, 'reject')
                                    }
                                    disabled={isSubmitting || !actionReason.trim()}
                                  >
                                    {isSubmitting ? 'Rejecting...' : 'Reject Provider'}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}

                          {canAccessAccounts && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAccountOverride(provider.email)}
                            >
                              <Shield className="mr-1 h-4 w-4" />
                              Override
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organizations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Approval Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Locations</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div className="font-medium">{org.name}</div>
                      </TableCell>
                      <TableCell>{org.type}</TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">{org.ownerEmail}</div>
                      </TableCell>
                      <TableCell>{org.locationsCount}</TableCell>
                      <TableCell>{new Date(org.submittedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/organizations/${org.id}`)}
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            Review
                          </Button>

                          {canApproveOrganizations && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() =>
                                  handleApprovalAction('organization', org.id, 'approve')
                                }
                              >
                                <CheckCircle className="mr-1 h-4 w-4" />
                                Approve
                              </Button>

                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  handleApprovalAction('organization', org.id, 'reject')
                                }
                              >
                                <XCircle className="mr-1 h-4 w-4" />
                                Reject
                              </Button>
                            </>
                          )}

                          {canAccessAccounts && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAccountOverride(org.ownerEmail)}
                            >
                              <Shield className="mr-1 h-4 w-4" />
                              Override
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
