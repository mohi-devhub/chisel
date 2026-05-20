"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useUser, UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

interface NavLink {
  label: string;
  href: string;
}

interface SiteNavProps {
  links: NavLink[];
  authLinks?: NavLink[];
  cta?: { label: string; href: string };
}

export function SiteNav({ links, authLinks = [], cta }: SiteNavProps) {
  const [open, setOpen] = useState(false);
  const { isSignedIn, isLoaded } = useUser();
  const pathname = usePathname();
  const signInLink = cta ?? { label: "Sign in", href: "/sign-in" };

  const visibleLinks = [
    ...links,
    ...(isLoaded && isSignedIn ? authLinks : []),
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-background/75 border-b border-border/60">
      <div className="flex items-center justify-between px-6 md:px-12 lg:px-20 py-4 font-body">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight text-foreground"
          onClick={() => setOpen(false)}
        >
          <span className="text-accent">✦</span> Chisel
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 sm:flex">
          {visibleLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "text-sm transition-colors",
                isActive(href)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </Link>
          ))}

          {isLoaded && !isSignedIn && (
            <Link
              href={signInLink.href}
              className="rounded-full px-5 py-2 text-sm font-medium bg-foreground text-background hover:opacity-90 transition-opacity"
            >
              {signInLink.label}
            </Link>
          )}

          {isLoaded && isSignedIn && (
            <UserButton appearance={{ elements: { avatarBox: "size-8" } }} />
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground sm:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="sm:hidden border-t border-border bg-background px-6 py-4">
          <div className="flex flex-col gap-3">
            {visibleLinks.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive(href)
                    ? "text-foreground bg-secondary"
                    : "text-muted-foreground hover:bg-secondary"
                )}
              >
                {label}
              </Link>
            ))}

            {isLoaded && !isSignedIn && (
              <Link
                href={signInLink.href}
                onClick={() => setOpen(false)}
                className="mt-1 rounded-full bg-foreground px-4 py-2 text-center text-sm font-medium text-background"
              >
                {signInLink.label}
              </Link>
            )}

            {isLoaded && isSignedIn && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                <UserButton appearance={{ elements: { avatarBox: "size-6" } }} />
                <span className="text-sm text-muted-foreground">Account</span>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
