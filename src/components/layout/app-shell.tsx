"use client";

import { useState, type ReactNode } from "react";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { type AppRole } from "@/lib/navigation/role-nav";
import { cn } from "@/lib/utils";

import { AppSidebar } from "./app-sidebar";
import { AppTopBar } from "./app-top-bar";

type Props = {
  role: AppRole;
  children: ReactNode;
  breadcrumbs?: ReactNode;
  className?: string;
};

export function AppShell({ role, children, breadcrumbs, className }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <TooltipProvider>
      <div className={cn("flex min-h-[calc(100vh-0px)] w-full", className)}>
        <AppSidebar role={role} className="sticky top-0 hidden h-dvh lg:flex" />
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[min(20rem,90vw)] gap-0 p-0">
            <SheetTitle className="sr-only">Navigation menu</SheetTitle>
            <SheetDescription className="sr-only">
              Choose a page in your workspace.
            </SheetDescription>
            <AppSidebar
              role={role}
              onNavigate={() => setMobileOpen(false)}
              className="w-full border-0"
            />
          </SheetContent>
          <div className="flex min-w-0 flex-1 flex-col">
            <AppTopBar role={role} breadcrumbs={breadcrumbs} />
            <main
              id="main-content"
              className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8"
              tabIndex={-1}
            >
              {children}
            </main>
          </div>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}
