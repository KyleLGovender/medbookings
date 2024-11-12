import { CircularProgress } from '@nextui-org/react';

export default function Loading() {
  return (
    <CircularProgress
      className="mx-auto p-12"
      classNames={{
        svg: 'w-24 h-24',
      }}
      aria-label="Loading page..."
    />
  );
}
