'use client';

import type React from 'react';
import { useEffect, useRef, useState } from 'react';

import { Camera, Upload, X } from 'lucide-react';
import { useSession } from 'next-auth/react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ProfileImageUploaderProps {
  onImageChange: (imageUrl: string | null) => void;
  currentImage?: string | null;
}

export function ProfileImageUploader({ onImageChange, currentImage }: ProfileImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);

  // Update previewUrl when currentImage prop changes
  useEffect(() => {
    setPreviewUrl(currentImage || null);
  }, [currentImage]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { data: session } = useSession();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (JPG, PNG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create a local preview URL for immediate feedback
      const localPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(localPreviewUrl);

      // Prepare form data for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', session?.user?.id || 'unknown-user');
      formData.append('directory', 'provider-images');
      formData.append('purpose', 'profile-image'); // Add the purpose parameter

      // Upload the file to the server
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const result = await response.json();

      if (!result.success || !result.url) {
        throw new Error(result.error || 'Failed to upload image');
      }

      // Pass the actual server URL to the parent component
      onImageChange(result.url);

      // Clean up the local object URL to prevent memory leaks
      URL.revokeObjectURL(localPreviewUrl);

      // Update the preview with the actual server URL
      setPreviewUrl(result.url);

      toast({
        title: 'Image uploaded',
        description: 'Your profile image has been uploaded successfully.',
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description:
          error instanceof Error ? error.message : 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });

      // Reset the preview if upload failed
      setPreviewUrl(currentImage || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="h-40 w-40 border-2 border-border">
          <AvatarImage src={previewUrl || undefined} alt="Profile" className="object-cover" />
          <AvatarFallback className="bg-muted text-lg">
            <Camera className="h-12 w-12 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>

        {previewUrl && (
          <Button
            size="sm"
            variant="destructive"
            className="absolute -right-2 -top-2 h-8 w-8 rounded-full p-0"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={triggerFileSelect}
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {isUploading ? 'Uploading...' : previewUrl ? 'Change Photo' : 'Upload Photo'}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-center text-xs text-muted-foreground">
        Upload a professional photo. JPG or PNG, max 5MB.
      </p>
    </div>
  );
}
