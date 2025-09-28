'use client';

import { AlertCircle, CheckCircle2, Upload, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/utils/api';

interface ProviderRequirementsSectionProps {
  providerId: string;
}

export function ProviderRequirementsSection({ providerId }: ProviderRequirementsSectionProps) {
  const { data: requirements, isLoading } = api.providers.getRequirements.useQuery({ providerId });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Regulatory Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'PENDING':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      APPROVED: 'default',
      PENDING: 'secondary',
      REJECTED: 'destructive',
      NOT_SUBMITTED: 'outline',
    };

    return <Badge variant={variants[status] || 'outline'}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regulatory Requirements</CardTitle>
        <CardDescription>
          Upload and manage your professional documents and certifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requirements && requirements.length > 0 ? (
          <div className="space-y-4">
            {requirements.map((req: any) => (
              <div key={req.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  {getStatusIcon(req.status)}
                  <div className="space-y-1">
                    <h4 className="font-medium">{req.requirementType.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {req.requirementType.description}
                    </p>
                    {req.rejectionReason && (
                      <p className="text-sm text-red-600">
                        Rejection reason: {req.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(req.status)}
                  {req.status !== 'APPROVED' && (
                    <Button size="sm" variant="outline" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Upload
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No requirements found for your provider type
            </p>
          </div>
        )}

        {/* Summary Card */}
        {requirements && requirements.length > 0 && (
          <div className="mt-6 rounded-lg bg-muted/50 p-4">
            <h4 className="mb-2 text-sm font-medium">Requirements Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Total: {requirements.length}</div>
              <div className="text-green-600">
                Approved: {requirements.filter((r: any) => r.status === 'APPROVED').length}
              </div>
              <div className="text-yellow-600">
                Pending: {requirements.filter((r: any) => r.status === 'PENDING').length}
              </div>
              <div className="text-red-600">
                Action Required:{' '}
                {
                  requirements.filter(
                    (r: any) => r.status === 'NOT_SUBMITTED' || r.status === 'REJECTED'
                  ).length
                }
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
