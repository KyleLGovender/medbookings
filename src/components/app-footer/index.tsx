import ThemeSwitcher from '@/components/app-footer/theme-switcher';

export default function AppFooter() {
  return (
    <footer className="flex w-full items-center justify-between px-6 py-3">
      {/* Empty div to help with spacing */}
      <div className="w-[100px]" />

      {/* Centered text */}
      <span className="text-center text-small text-default-600">
        © 2024 Your Company Name. All rights reserved.
      </span>

      {/* Theme switcher */}
      <div className="flex w-[100px] justify-end">
        <ThemeSwitcher />
      </div>
    </footer>
  );
}
