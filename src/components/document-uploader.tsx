'use client';

import type React from 'react';
import { useEffect, useRef, useState } from 'react';

import { CheckCircle, ExternalLink, Upload, X } from 'lucide-react';
import { useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { nowUTC } from '@/lib/timezone';
import { extractFilenameFromUrl } from '@/lib/utils/document-utils';

interface DocumentUploaderProps {
  onUpload: (fileUrl: string | null) => void;
  acceptedFormats?: string[];
  currentFileUrl?: string | null;
  directory?: string;
  purpose: string; // Required parameter for file naming
}

export function DocumentUploader({
  onUpload,
  acceptedFormats = ['.pdf', '.jpg', '.png'], // Default to PDF, JPG, and PNG
  currentFileUrl,
  directory = 'documents',
  purpose,
}: DocumentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    type: string;
    url: string;
    uploadedAt: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstRenderRef = useRef(true);
  const { toast } = useToast();
  const { data: session } = useSession();

  // Initialize with currentFileUrl on first render only
  useEffect(() => {
    if (firstRenderRef.current && currentFileUrl) {
      // Create a file object with the URL and extracted filename
      const filename = extractFilenameFromUrl(currentFileUrl);

      setUploadedFile({
        name: filename,
        size: 0,
        type: '',
        url: currentFileUrl,
        uploadedAt: nowUTC().toISOString(),
      });
      firstRenderRef.current = false;
    }
  }, [currentFileUrl]);

  const validateFile = (file: File) => {
    // Get the file extension with dot
    const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;

    // Check if the file extension is in the accepted formats
    if (!acceptedFormats.some((format) => fileExt.endsWith(format.toLowerCase()))) {
      toast({
        title: 'Invalid file type',
        description: `Please upload a file in one of these formats: ${acceptedFormats.join(', ')}`,
        variant: 'destructive',
      });
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 10MB',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleFileUpload = async (file: File) => {
    if (!validateFile(file)) return;

    // Prevent any form submission that might be triggered
    if (window.event) {
      window.event.preventDefault?.();
      window.event.stopPropagation?.();
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Start progress animation to show immediate feedback
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', session?.user?.id || 'anonymous');
      formData.append('directory', directory);
      formData.append('purpose', purpose); // Add the purpose parameter

      // Upload the file using our API route that uses the uploadToBlob server action
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setUploadProgress(100);

      if (!result.success || !result.url) {
        throw new Error(result.error || 'Failed to get upload URL');
      }

      // Create the file data with the actual blob URL
      const fileData = {
        name: file.name,
        size: file.size,
        type: file.type,
        url: result.url, // Use the actual Blob URL from the server response
        uploadedAt: nowUTC().toISOString(),
      };

      // Update local state
      setUploadedFile(fileData);

      // Notify parent with the URL
      onUpload(result.url);

      toast({
        title: 'File uploaded successfully',
        description: `${file.name} has been uploaded.`,
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description:
          error instanceof Error ? error.message : 'Failed to upload file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    // Prevent any potential form submission
    if (e.target instanceof HTMLElement) {
      const form = e.target.closest('form');
      if (form) {
        e.preventDefault();
      }
    }

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent default form behavior
    e.preventDefault();
    e.stopPropagation();

    const files = e.target.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    onUpload(null); // Pass null to indicate file removal
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Format the accepted formats for display
  const displayFormats = acceptedFormats.map((format) =>
    format.startsWith('.') ? format.slice(1).toUpperCase() : format.toUpperCase()
  );

  if (uploadedFile) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="max-w-[200px] sm:max-w-[300px]">
                <p className="truncate font-medium" title={uploadedFile.name}>
                  {uploadedFile.name}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {uploadedFile.size > 0 ? (
                    `${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB`
                  ) : (
                    <>
                      <span className="text-xs">Document uploaded</span>
                      <a
                        href={uploadedFile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-xs text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 ${
          dragActive ? 'border-dashed border-primary bg-primary/5' : 'border-border'
        } rounded-lg`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="rounded-full bg-primary/10 p-3">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Upload a file</h3>
            <p className="text-sm text-muted-foreground">Drag and drop or click to upload</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Supported formats: {displayFormats.join(', ')}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={(e) => {
              // Prevent button click from submitting the form
              e.preventDefault();
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            type="button" // Explicitly set type to button to prevent form submission
            disabled={isUploading}
          >
            Select File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
        </CardContent>
      </Card>

      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Uploading...</span>
            <span className="text-sm">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}
    </div>
  );
}
