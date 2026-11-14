"use client";

import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  switchAccountRedirectTarget,
  useHrAccess,
} from "@/lib/auth/use-hr-access";
import type { AppRole } from "@/lib/navigation/role-nav";
import { SheetTrigger } from "@/components/ui/sheet";
import { NavigationBreadcrumbs } from "./navigation-breadcrumbs";
import { PageFinder } from "./page-finder";

type Props = {
  role: AppRole;
  breadcrumbs?: ReactNode;
};

export function AppTopBar({ role, breadcrumbs }: Props) {
  const { theme, setTheme } = useTheme();
  const { signOut, isAuthenticated } = useHrAccess();

  return (
    <header className="sticky top-0 z-40 flex min-h-16 shrink-0 items-center gap-2 border-b border-border bg-card/95 px-4 py-2 backdrop-blur sm:gap-4 sm:px-6 supports-[backdrop-filter]:bg-card/80">
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <div className="min-w-0 flex-1">
        {breadcrumbs ?? <NavigationBreadcrumbs role={role} />}
      </div>
      <PageFinder role={role} />
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                Account
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => {
                  void signOut({ redirectTo: switchAccountRedirectTarget() });
                }}
              >
                Switch account
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  void signOut({ redirectTo: "/" });
                }}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </header>
  );
}
