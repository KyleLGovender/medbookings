'use client';

import { useState } from 'react';

import { AlertCircle, CheckCircle2, Edit2, FileText, Upload, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { parseUTC } from '@/lib/timezone';
import { api } from '@/utils/api';

import { renderRequirementInput } from '../render-requirement-input';

interface ProviderRequirementsEditProps {
  providerId: string;
}

export function ProviderRequirementsEdit({ providerId }: ProviderRequirementsEditProps) {
  const { toast } = useToast();
  const utils = api.useUtils();
  const [selectedRequirement, setSelectedRequirement] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // React Hook Form for requirement input - structure matches renderRequirementInput expectations
  const form = useForm({
    defaultValues: {
      regulatoryRequirements: {
        requirements: [
          {
            requirementTypeId: '',
            value: '',
            documentMetadata: null,
          },
        ],
      },
      notes: '',
    },
  });

  const { data: requirements, isLoading } = api.providers.getRequirements.useQuery({ providerId });

  const updateRequirement = api.providers.updateRequirement.useMutation({
    onSuccess: () => {
      toast({
        title: 'Requirement updated',
        description: 'Your information has been submitted for review. Admin has been notified.',
      });
      utils.providers.getRequirements.invalidate();
      setIsDialogOpen(false);
      setSelectedRequirement(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmitRequirement = async (data: any) => {
    if (!selectedRequirement) return;

    // Get the requirement value from the form structure that renderRequirementInput uses
    const formValues = form.getValues();
    const requirementPath = 'regulatoryRequirements.requirements.0.value';
    const documentPath = 'regulatoryRequirements.requirements.0.documentMetadata';

    const requirementValue =
      form.watch(requirementPath) ||
      formValues.regulatoryRequirements?.requirements?.[0]?.value ||
      '';
    const documentMetadata = form.watch(documentPath) || null;

    // Build the request payload based on requirement type
    const payload: any = {
      requirementId: selectedRequirement.id,
      notes: data.notes || '',
    };

    if (selectedRequirement.requirementType.validationType === 'DOCUMENT') {
      // For document requirements, use documentUrl
      payload.documentUrl = requirementValue || undefined;
      payload.documentMetadata = documentMetadata;
    } else {
      // For non-document requirements, use value field
      payload.value = requirementValue;
      payload.documentMetadata = documentMetadata || { value: requirementValue };
    }

    await updateRequirement.mutateAsync(payload);
  };

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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Regulatory Requirements</CardTitle>
          <CardDescription>
            Upload and manage your professional documents and certifications. Updating any document
            will notify the admin for review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requirements && requirements.length > 0 ? (
            <div className="space-y-4">
              {requirements.map((req) => (
                <div key={req.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(req.status)}
                      <div className="space-y-1">
                        <h4 className="font-medium">{req.requirementType.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {req.requirementType.description}
                        </p>
                        {req.rejectionReason && (
                          <Alert className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              <strong>Rejection reason:</strong> {req.rejectionReason}
                            </AlertDescription>
                          </Alert>
                        )}
                        {req.documentMetadata && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span>
                              {req.requirementType.validationType === 'DOCUMENT'
                                ? 'Document uploaded'
                                : req.requirementType.validationType === 'BOOLEAN'
                                  ? `Response: ${req.documentMetadata.value === 'true' || req.documentMetadata.value === true ? 'Yes' : 'No'}`
                                  : req.requirementType.validationType?.includes('DATE')
                                    ? `Date provided: ${parseUTC(req.documentMetadata.value).toLocaleDateString()}`
                                    : req.requirementType.validationType === 'TEXT'
                                      ? 'Information provided'
                                      : req.requirementType.validationType === 'PREDEFINED_LIST'
                                        ? 'Selection made'
                                        : 'Information submitted'}
                            </span>
                            {req.updatedAt && (
                              <span className="text-xs">
                                (Last updated: {req.updatedAt.toLocaleDateString()})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(req.status)}
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                          setSelectedRequirement(req);
                          // Reset and populate form with existing values in the structure renderRequirementInput expects
                          form.reset({
                            regulatoryRequirements: {
                              requirements: [
                                {
                                  requirementTypeId: req.requirementType.id,
                                  value: req.documentMetadata?.value || req.value || '',
                                  documentMetadata: req.documentMetadata || null,
                                },
                              ],
                            },
                            notes: req.notes || '',
                          });
                          setIsDialogOpen(true);
                        }}
                      >
                        {req.status === 'NOT_SUBMITTED' ? (
                          <>
                            <Upload className="h-4 w-4" />
                            Upload
                          </>
                        ) : (
                          <>
                            <Edit2 className="h-4 w-4" />
                            Update
                          </>
                        )}
                      </Button>
                    </div>
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

          <Alert className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Any changes to your regulatory documents will
              automatically notify the admin team for review. Your provider status may be affected
              during the review process.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Upload/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedRequirement?.status === 'NOT_SUBMITTED' ? 'Upload' : 'Update'} Document
            </DialogTitle>
            <DialogDescription>
              {selectedRequirement?.requirementType.name} -{' '}
              {selectedRequirement?.requirementType.description}
            </DialogDescription>
          </DialogHeader>

          <form
            id="requirement-form"
            onSubmit={form.handleSubmit(handleSubmitRequirement)}
            className="space-y-4"
          >
            {selectedRequirement && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor={`requirement-${selectedRequirement.requirementType.id}`}>
                    {selectedRequirement.requirementType.name}
                  </Label>
                  <div className="mt-2">
                    {renderRequirementInput(
                      {
                        ...selectedRequirement.requirementType,
                        index: 0,
                        existingSubmission: selectedRequirement,
                      },
                      {
                        register: form.register,
                        watch: form.watch,
                        setValue: form.setValue,
                        errors: form.formState.errors,
                        fieldName: 'requirementValue',
                        existingValue:
                          selectedRequirement.documentMetadata?.value || selectedRequirement.value,
                      }
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional information..."
                    {...form.register('notes')}
                    rows={3}
                  />
                </div>
              </div>
            )}
          </form>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="requirement-form"
              disabled={updateRequirement.isPending}
              onClick={form.handleSubmit(handleSubmitRequirement)}
            >
              {updateRequirement.isPending ? 'Submitting...' : 'Submit for Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
