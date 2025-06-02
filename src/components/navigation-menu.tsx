import Link from 'next/link';

import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function NavigationMenu() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary">
            <div className="flex h-8 w-8 items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
              >
                {/* Top-left segment - sky-700 */}
                <path d="M2 2H14V14H2V2Z" fill="#0369a1" />

                {/* Top-right segment - sky-500 */}
                <path d="M18 2H30V14H18V2Z" fill="#0ea5e9" />

                {/* Bottom-left segment - sky-400 */}
                <path d="M2 18H14V30H2V18Z" fill="#38bdf8" />

                {/* Bottom-right segment - sky-600 */}
                <path d="M18 18H30V30H18V18Z" fill="#0284c7" />
              </svg>
            </div>
            Medbookings
          </Link>
        </div>
        <nav className="hidden gap-6 md:flex">
          <Link href="#" className="text-sm font-medium hover:text-primary">
            Find Specialists
          </Link>
          <Link href="#" className="text-sm font-medium hover:text-primary">
            How It Works
          </Link>
          <Link href="#for-professionals" className="text-sm font-medium hover:text-primary">
            For Professionals
          </Link>
          <Link href="#" className="text-sm font-medium hover:text-primary">
            About Us
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="#" className="hidden text-sm font-medium hover:text-primary md:block">
            Log in
          </Link>
          <Button>Sign up</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="#">Find Specialists</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="#">How It Works</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="#for-professionals">For Professionals</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="#">About Us</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="#">Log in</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
