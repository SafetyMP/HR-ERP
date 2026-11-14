"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  searchNavigation,
  roleLabel,
  type AppRole,
} from "@/lib/navigation/role-nav";

export function PageFinder({ role }: { role: AppRole }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const groups = searchNavigation(role, query);
  const count = groups.reduce((sum, group) => sum + group.items.length, 0);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        // Do not capture shortcuts from forms or another open dialog.
        const target = event.target;
        if (
          target instanceof HTMLElement &&
          (target.matches("input, textarea, select") ||
            target.isContentEditable ||
            target.closest('[role="dialog"]'))
        )
          return;
        event.preventDefault();
        setQuery("");
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 text-muted-foreground"
          aria-label="Find a page"
          aria-keyshortcuts="Control+k Meta+k"
        >
          <Search className="size-4" aria-hidden />
          <span className="hidden md:inline">Find a page</span>
          <kbd className="ml-5 hidden text-xs lg:inline">⌘ / Ctrl K</kbd>
        </Button>
      </DialogTrigger>
      <DialogContent
        className="gap-4 border-border bg-card text-card-foreground sm:max-w-xl"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <div className="pr-6">
          <DialogTitle>Find a page</DialogTitle>
          <DialogDescription className="mt-1 text-muted-foreground">
            Search your {roleLabel(role).toLowerCase()} workspace by task.
          </DialogDescription>
        </div>
        <label htmlFor="page-finder-query" className="sr-only">
          Search pages
        </label>
        <Input
          ref={inputRef}
          id="page-finder-query"
          placeholder="Try pay, vacation, benefits…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              resultsRef.current
                ?.querySelector<HTMLAnchorElement>("a")
                ?.focus();
            }
          }}
        />
        <p className="text-xs text-muted-foreground" role="status">
          {count} {count === 1 ? "page" : "pages"} found
        </p>
        <div
          ref={resultsRef}
          className="max-h-[50dvh] space-y-4 overflow-y-auto"
          onKeyDown={(event) => {
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
            const links = Array.from(
              resultsRef.current?.querySelectorAll<HTMLAnchorElement>("a") ??
                [],
            );
            const index = links.indexOf(
              document.activeElement as HTMLAnchorElement,
            );
            if (index < 0) return;
            event.preventDefault();
            if (event.key === "ArrowUp" && index === 0)
              inputRef.current?.focus();
            else
              links[
                (index + (event.key === "ArrowDown" ? 1 : -1) + links.length) %
                  links.length
              ]?.focus();
          }}
        >
          {groups.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between gap-3 rounded-lg px-3 py-3 hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <span>
                        <span className="block text-sm font-medium">
                          {item.label}
                        </span>
                        {item.description ? (
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        ) : null}
                      </span>
                      <ArrowUpRight
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {count === 0 ? (
            <div className="py-8 text-center">
              <p className="font-medium">No matching pages</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try a task such as pay, leave, or benefits.
              </p>
              <Button
                variant="link"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
              >
                Show all pages
              </Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
