/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */
'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle, Clock, Mail, Shield, Trash2, UserPlus, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { Textarea } from '@/components/ui/textarea';
import {
  cancelInvitation,
  inviteOrganizationMember,
} from '@/features/organizations/lib/member-management';
import { useOrganizationPermissions } from '@/hooks/use-permissions';
import { OrganizationRole, Permission } from '@/types/permissions';

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

/**
 * Organization member invitation interface
 *
 * Form component for inviting new members to organizations
 * with role assignment and permission validation.
 */

const invitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(OrganizationRole),
  message: z.string().optional(),
});

type InvitationFormData = z.infer<typeof invitationSchema>;

interface PendingInvitation {
  id: string;
  email: string;
  role: OrganizationRole;
  sentAt: Date;
  expiresAt: Date;
  invitedBy: string;
}

interface Member {
  id: string;
  email: string;
  name: string;
  role: OrganizationRole;
  joinedAt: Date;
}

interface MemberInvitationFormProps {
  organizationId: string;
  organizationName: string;
  members: Member[];
  pendingInvitations: PendingInvitation[];
  onInvitationSent?: () => void;
}

export function MemberInvitationForm({
  organizationId,
  organizationName,
  members,
  pendingInvitations,
  onInvitationSent,
}: MemberInvitationFormProps) {
  const { hasOrganizationPermission, isAdmin } = useOrganizationPermissions(organizationId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);

  const form = useForm<InvitationFormData>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      email: '',
      role: OrganizationRole.STAFF,
      message: '',
    },
  });

  const canInviteMembers = hasOrganizationPermission(Permission.INVITE_MEMBERS);
  const canManageMembers = hasOrganizationPermission(Permission.MANAGE_MEMBERS);

  const onSubmit = async (data: InvitationFormData) => {
    setIsSubmitting(true);
    try {
      const result = await inviteOrganizationMember({
        ...data,
        organizationId,
      });

      if (result.success) {
        form.reset();
        setShowInviteForm(false);
        onInvitationSent?.();
      } else {
        // Handle error - in a real app, use toast or error state
        console.error('Invitation failed:', result.message);
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const result = await cancelInvitation(organizationId, invitationId);
      if (result.success) {
        onInvitationSent?.(); // Refresh the list
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error);
    }
  };

  const getRoleBadgeVariant = (role: OrganizationRole) => {
    switch (role) {
      case OrganizationRole.OWNER:
        return 'default';
      case OrganizationRole.ADMIN:
        return 'secondary';
      case OrganizationRole.MANAGER:
        return 'outline';
      case OrganizationRole.STAFF:
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleDescription = (role: OrganizationRole) => {
    switch (role) {
      case OrganizationRole.OWNER:
        return 'Full control over organization';
      case OrganizationRole.ADMIN:
        return 'Manage members and settings';
      case OrganizationRole.MANAGER:
        return 'Manage calendar and bookings';
      case OrganizationRole.STAFF:
        return 'Basic organization access';
      default:
        return '';
    }
  };

  if (!canInviteMembers && !canManageMembers) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">
            <Shield className="mx-auto mb-2 h-8 w-8" />
            <p>You don&apos;t have permission to manage members</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Organization Members</CardTitle>
            {canInviteMembers && (
              <Dialog open={showInviteForm} onOpenChange={setShowInviteForm}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite New Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation to join {organizationName}
                    </DialogDescription>
                  </DialogHeader>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input placeholder="member@example.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {isAdmin && (
                                  <SelectItem value={OrganizationRole.ADMIN}>
                                    Admin - {getRoleDescription(OrganizationRole.ADMIN)}
                                  </SelectItem>
                                )}
                                <SelectItem value={OrganizationRole.MANAGER}>
                                  Manager - {getRoleDescription(OrganizationRole.MANAGER)}
                                </SelectItem>
                                <SelectItem value={OrganizationRole.STAFF}>
                                  Staff - {getRoleDescription(OrganizationRole.STAFF)}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Personal Message (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Add a personal message to the invitation..."
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              This message will be included in the invitation email
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowInviteForm(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? 'Sending...' : 'Send Invitation'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-muted-foreground">{member.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(member.role)}>{member.role}</Badge>
                  </TableCell>
                  <TableCell>{new Date(member.joinedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {canManageMembers && member.role !== OrganizationRole.OWNER && (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          Edit Role
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {invitation.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(invitation.role)}>
                        {invitation.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(invitation.sentAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        {new Date(invitation.expiresAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {canInviteMembers && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelInvitation(invitation.id)}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
