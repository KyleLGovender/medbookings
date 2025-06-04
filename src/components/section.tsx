'use client';

import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface SectionProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  as?: 'section' | 'div' | 'article';
  id?: string;
}

/**
 * A reusable Section component for consistent layout spacing
 *
 * @param {ReactNode} children - The content to render inside the section
 * @param {string} className - Optional classes to apply to the outer section element
 * @param {string} containerClassName - Optional classes to apply to the inner container div
 * @param {string} as - Optional HTML element to render as (defaults to 'section')
 * @param {string} id - Optional ID attribute for the section element
 */
export function Section({
  children,
  className,
  containerClassName,
  as: Component = 'section',
  id,
}: SectionProps) {
  return (
    <Component id={id} className={cn('w-full', className)}>
      <div className={cn('mx-auto max-w-7xl space-y-6 px-6 md:px-24', containerClassName)}>
        {children}
      </div>
    </Component>
  );
}

export default Section;
