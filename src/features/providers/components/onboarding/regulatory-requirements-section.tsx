'use client';

import { useEffect, useState } from 'react';

import { AlertCircle, CheckCircle } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { RequirementField } from './requirement-field';

// Mock regulatory requirements based on provider type
const REGULATORY_REQUIREMENTS = {
  general_practitioner: [
    {
      id: 'medical_license',
      title: 'Medical License',
      description: 'Upload a copy of your current medical license',
      validationType: 'DOCUMENT',
      required: true,
      acceptedFormats: ['PDF', 'JPG', 'PNG'],
    },
    {
      id: 'malpractice_insurance',
      title: 'Malpractice Insurance',
      description: 'Provide proof of current malpractice insurance coverage',
      validationType: 'DOCUMENT',
      required: true,
      acceptedFormats: ['PDF'],
    },
    {
      id: 'board_certification',
      title: 'Board Certification',
      description: 'Upload your board certification documents',
      validationType: 'DOCUMENT',
      required: true,
      acceptedFormats: ['PDF', 'JPG', 'PNG'],
    },
    {
      id: 'license_expiry',
      title: 'License Expiry Date',
      description: 'When does your medical license expire?',
      validationType: 'FUTURE_DATE',
      required: true,
    },
    {
      id: 'disciplinary_action',
      title: 'Disciplinary Actions',
      description: 'Have you ever been subject to disciplinary action by a medical board?',
      validationType: 'BOOLEAN',
      required: true,
    },
  ],
  specialist: [
    {
      id: 'medical_license',
      title: 'Medical License',
      description: 'Upload a copy of your current medical license',
      validationType: 'DOCUMENT',
      required: true,
      acceptedFormats: ['PDF', 'JPG', 'PNG'],
    },
    {
      id: 'specialty_certification',
      title: 'Specialty Certification',
      description: 'Upload your specialty board certification',
      validationType: 'DOCUMENT',
      required: true,
      acceptedFormats: ['PDF', 'JPG', 'PNG'],
    },
    {
      id: 'malpractice_insurance',
      title: 'Malpractice Insurance',
      description: 'Provide proof of current malpractice insurance coverage',
      validationType: 'DOCUMENT',
      required: true,
      acceptedFormats: ['PDF'],
    },
    {
      id: 'hospital_privileges',
      title: 'Hospital Privileges',
      description: 'Do you have current hospital privileges?',
      validationType: 'BOOLEAN',
      required: true,
    },
    {
      id: 'license_expiry',
      title: 'License Expiry Date',
      description: 'When does your medical license expire?',
      validationType: 'FUTURE_DATE',
      required: true,
    },
    {
      id: 'fellowship_training',
      title: 'Fellowship Training',
      description: 'Upload documentation of your fellowship training',
      validationType: 'DOCUMENT',
      required: false,
      acceptedFormats: ['PDF'],
    },
  ],
  mental_health: [
    {
      id: 'professional_license',
      title: 'Professional License',
      description: 'Upload a copy of your current professional license',
      validationType: 'DOCUMENT',
      required: true,
      acceptedFormats: ['PDF', 'JPG', 'PNG'],
    },
    {
      id: 'liability_insurance',
      title: 'Professional Liability Insurance',
      description: 'Provide proof of current liability insurance coverage',
      validationType: 'DOCUMENT',
      required: true,
      acceptedFormats: ['PDF'],
    },
    {
      id: 'license_expiry',
      title: 'License Expiry Date',
      description: 'When does your professional license expire?',
      validationType: 'FUTURE_DATE',
      required: true,
    },
    {
      id: 'certification',
      title: 'Professional Certification',
      description: 'Upload your professional certification documents',
      validationType: 'DOCUMENT',
      required: true,
      acceptedFormats: ['PDF', 'JPG', 'PNG'],
    },
  ],
  // Add more provider types as needed
  default: [
    {
      id: 'professional_license',
      title: 'Professional License',
      description: 'Upload a copy of your current professional license',
      validationType: 'DOCUMENT',
      required: true,
      acceptedFormats: ['PDF', 'JPG', 'PNG'],
    },
    {
      id: 'liability_insurance',
      title: 'Professional Liability Insurance',
      description: 'Provide proof of current liability insurance coverage',
      validationType: 'DOCUMENT',
      required: true,
      acceptedFormats: ['PDF'],
    },
    {
      id: 'license_expiry',
      title: 'License Expiry Date',
      description: 'When does your professional license expire?',
      validationType: 'FUTURE_DATE',
      required: true,
    },
  ],
};

export function RegulatoryRequirementsSection() {
  const { control, setValue } = useFormContext();
  const [completedRequirements, setCompletedRequirements] = useState<string[]>([]);

  // Watch the provider type to dynamically update requirements
  const providerType = useWatch({
    control,
    name: 'providerType.providerType',
  });

  // Get the appropriate requirements based on provider type
  const requirements = providerType
    ? REGULATORY_REQUIREMENTS[providerType as keyof typeof REGULATORY_REQUIREMENTS] ||
      REGULATORY_REQUIREMENTS.default
    : [];

  const handleRequirementChange = (requirementId: string, value: any) => {
    setValue(`regulatoryRequirements.requirements.${requirementId}`, value);

    // Update completed requirements
    if (value && value !== '') {
      setCompletedRequirements((prev) => [
        ...prev.filter((id) => id !== requirementId),
        requirementId,
      ]);
    } else {
      setCompletedRequirements((prev) => prev.filter((id) => id !== requirementId));
    }
  };

  const requiredRequirements = requirements.filter((req) => req.required);
  const completedRequired = requiredRequirements.filter((req) =>
    completedRequirements.includes(req.id)
  ).length;

  // If provider type changes, reset the requirements
  useEffect(() => {
    if (providerType) {
      setValue('regulatoryRequirements.requirements', {});
      setCompletedRequirements([]);
    }
  }, [providerType, setValue]);

  if (!providerType) {
    return (
      <div className="rounded-lg bg-muted/50 p-6 text-center">
        <p className="text-muted-foreground">
          Please select a provider type to see applicable regulatory requirements.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Complete all required regulatory documentation to verify your credentials.
        </p>

        <Badge
          variant={completedRequired === requiredRequirements.length ? 'default' : 'secondary'}
        >
          {completedRequired}/{requiredRequirements.length} Required
        </Badge>
      </div>

      <div className="space-y-4">
        {requirements.map((requirement) => (
          <Card
            key={requirement.id}
            className={`${
              requirement.required && !completedRequirements.includes(requirement.id)
                ? 'border-orange-200 bg-orange-50/50'
                : completedRequirements.includes(requirement.id)
                  ? 'border-green-200 bg-green-50/50'
                  : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {requirement.title}
                    {requirement.required && (
                      <Badge variant="destructive" className="text-xs">
                        Required
                      </Badge>
                    )}
                    {completedRequirements.includes(requirement.id) && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">{requirement.description}</CardDescription>
                </div>
                {requirement.required && !completedRequirements.includes(requirement.id) && (
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-orange-500" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <RequirementField
                requirement={requirement}
                onChange={(value) => handleRequirementChange(requirement.id, value)}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
