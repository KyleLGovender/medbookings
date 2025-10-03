'use client';

import { useState } from 'react';

import { UploadIcon, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { nowUTC } from '@/lib/timezone';

interface RequirementFileUploadProps {
  onFileUploaded: (url: string, metadata: any) => void;
  existingFile?: {
    url?: string;
    name?: string;
  };
  requirementName: string;
}

export function RequirementFileUpload({
  onFileUploaded,
  existingFile,
  requirementName,
}: RequirementFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF, Word document (DOC/DOCX), JPG, or PNG file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 10MB.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', `regulatory-requirement-${requirementName}`);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      onFileUploaded(data.url, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: nowUTC().toISOString(),
      });

      toast({
        title: 'Document uploaded',
        description: 'Your document has been uploaded successfully.',
      });
    } catch (error) {
      logger.error('Upload error', {
        error: error instanceof Error ? error.message : String(error),
      });
      toast({
        title: 'Upload failed',
        description: 'Failed to upload the document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    onFileUploaded('', null);
  };

  return (
    <div className="space-y-3">
      <Label>Upload Document</Label>

      {/* File input */}
      <div className="flex items-center gap-3">
        <input
          type="file"
          id={`file-upload-${requirementName}`}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleFileSelect}
          disabled={isUploading}
        />

        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById(`file-upload-${requirementName}`)?.click()}
          disabled={isUploading}
          className="w-full"
        >
          <UploadIcon className="mr-2 h-4 w-4" />
          {isUploading ? 'Uploading...' : 'Choose File'}
        </Button>
      </div>

      {/* Display selected/existing file */}
      {(selectedFile || existingFile?.name) && (
        <div className="flex items-center justify-between rounded-lg bg-muted p-3">
          <span className="text-sm">{selectedFile?.name || existingFile?.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFile}
            disabled={isUploading}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">Accepted formats: PDF, JPG, PNG (max 10MB)</p>
    </div>
  );
}
