export default function AppFooter({ className = '' }: { className?: string }) {
  return (
    <footer
      className={`flex w-full items-center justify-center bg-white px-6 py-3 shadow-sm ${className}`}
    >
      {/* Centered text */}
      <span className="text-small text-default-600 text-center">
        © 2024 MedBookings. All rights reserved.
      </span>
    </footer>
  );
}
