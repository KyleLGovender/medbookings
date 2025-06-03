'use client';

import { useState } from 'react';

import { AlertCircle, CheckCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { RequirementField } from './requirement-field';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface RegulatoryRequirementsStepProps {
  data: any;
  onDataChange: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

// Mock regulatory requirements based on provider type
const REGULATORY_REQUIREMENTS = [
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
    id: 'dea_registration',
    title: 'DEA Registration',
    description: 'Do you have a current DEA registration?',
    validationType: 'BOOLEAN',
    required: false,
  },
  {
    id: 'license_expiry',
    title: 'License Expiry Date',
    description: 'When does your medical license expire?',
    validationType: 'FUTURE_DATE',
    required: true,
  },
  {
    id: 'years_licensed',
    title: 'Years Licensed',
    description: 'How many years have you been licensed to practice?',
    validationType: 'NUMBER',
    required: true,
  },
  {
    id: 'disciplinary_action',
    title: 'Disciplinary Actions',
    description: 'Have you ever been subject to disciplinary action by a medical board?',
    validationType: 'BOOLEAN',
    required: true,
  },
  {
    id: 'practice_setting',
    title: 'Primary Practice Setting',
    description: 'Where do you primarily practice?',
    validationType: 'PREDEFINED_LIST',
    required: true,
    options: ['Hospital', 'Private Practice', 'Clinic', 'Urgent Care', 'Other'],
  },
];

export function RegulatoryRequirementsStep({
  data,
  onDataChange,
  onNext,
  onPrevious,
}: RegulatoryRequirementsStepProps) {
  const [requirements, setRequirements] = useState(data?.regulatoryRequirements || {});
  const [completedRequirements, setCompletedRequirements] = useState<string[]>([]);

  const handleRequirementChange = (requirementId: string, value: any) => {
    const updatedRequirements = { ...requirements, [requirementId]: value };
    setRequirements(updatedRequirements);
    onDataChange({ regulatoryRequirements: updatedRequirements });

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

  const requiredRequirements = REGULATORY_REQUIREMENTS.filter((req) => req.required);
  const completedRequired = requiredRequirements.filter((req) =>
    completedRequirements.includes(req.id)
  ).length;

  const canProceed = completedRequired === requiredRequirements.length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Regulatory Requirements</h3>
        <p className="text-sm text-muted-foreground">
          Complete all required regulatory documentation to verify your credentials.
        </p>

        <div className="mt-3 flex items-center gap-2">
          <Badge variant={canProceed ? 'default' : 'secondary'}>
            {completedRequired}/{requiredRequirements.length} Required Completed
          </Badge>
          {canProceed && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">All requirements met</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {REGULATORY_REQUIREMENTS.map((requirement) => (
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
                value={requirements[requirement.id]}
                onChange={(value) => handleRequirementChange(requirement.id, value)}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          Continue to Services
        </Button>
      </div>
    </div>
  );
}
