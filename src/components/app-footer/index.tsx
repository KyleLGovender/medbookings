export default function AppFooter({ className = '' }: { className?: string }) {
  return (
    <footer
      className={`flex w-full items-center justify-center bg-white px-6 py-3 shadow-sm ${className}`}
    >
      <div className="text-small text-default-600 flex flex-col items-center space-y-2">
        <span className="text-center">© 2024 MedBookings. All rights reserved.</span>
        <div className="flex items-center space-x-4">
          <a href="/terms-of-use" className="text-default-600 transition-colors hover:text-primary">
            Terms of Use
          </a>
          <span>•</span>
          <a
            href="/privacy-policy"
            className="text-default-600 transition-colors hover:text-primary"
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  );
}
