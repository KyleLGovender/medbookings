'use client';

import { useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  name?: string | null;
  image?: string | null;
  email?: string | null;
  className?: string;
  fallbackClassName?: string;
  showLoading?: boolean;
}

export function UserAvatar({
  name,
  image,
  email,
  className,
  fallbackClassName,
  showLoading = false,
}: UserAvatarProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Preload the image when it changes
  useEffect(() => {
    if (image) {
      setImageError(false);
      const img = new window.Image();
      img.onload = () => setImageLoaded(true);
      img.onerror = () => {
        setImageLoaded(false);
        setImageError(true);
      };
      img.src = image;
    } else {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [image]);

  // Generate initials from name or email
  const getInitials = () => {
    if (showLoading) return '...';

    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name[0]?.toUpperCase() || '?';
    }

    if (email) {
      return email[0]?.toUpperCase() || '?';
    }

    return '?';
  };

  return (
    <Avatar className={className}>
      {image && imageLoaded && !imageError && (
        <AvatarImage src={image} alt={name || 'User avatar'} referrerPolicy="no-referrer" />
      )}
      <AvatarFallback className={cn('text-sm font-medium', fallbackClassName)}>
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
}
