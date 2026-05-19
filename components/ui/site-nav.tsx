"use client";

import { useState } from "react";
import Link from "next/link";
import { Hammer, Menu, X } from "lucide-react";
import { useUser, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

interface NavLink {
  label: string;
  href: string;
}

interface SiteNavProps {
  /** Always-visible nav links */
  links: NavLink[];
  /** Links shown only when signed in (e.g. Dashboard on public pages) */
  authLinks?: NavLink[];
  /** CTA shown to signed-out users. Defaults to "Sign in". */
  cta?: { label: string; href: string };
}

export function SiteNav({ links, authLinks = [], cta }: SiteNavProps) {
  const [open, setOpen] = useState(false);
  const { isSignedIn, isLoaded } = useUser();
  const signInLink = cta ?? { label: "Sign in", href: "/sign-in" };

  const visibleLinks = [
    ...links,
    ...(isLoaded && isSignedIn ? authLinks : []),
  ];

  return (
    <header className="relative flex items-center justify-between py-5">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_20px_theme(colors.primary/60%)]">
          <Hammer className="size-3.5" />
        </div>
        <span className="text-sm font-semibold">Chisel</span>
      </Link>

      {/* Desktop nav */}
      <nav className="hidden items-center gap-0.5 sm:flex">
        {visibleLinks.map(({ label, href }) => (
          <Button
            key={href}
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href={href}>{label}</Link>
          </Button>
        ))}

        {/* Auth CTA */}
        {isLoaded && !isSignedIn && (
          <Button
            size="sm"
            className="ml-3 h-8 text-xs px-4 shadow-[0_0_20px_theme(colors.primary/40%)] hover:shadow-[0_0_28px_theme(colors.primary/60%)] transition-shadow"
            asChild
          >
            <Link href={signInLink.href}>{signInLink.label}</Link>
          </Button>
        )}

        {isLoaded && isSignedIn && (
          <div className="ml-3">
            <UserButton
              appearance={{
                elements: { avatarBox: "size-8" },
              }}
            />
          </div>
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

      {/* Mobile dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 flex flex-col gap-1 rounded-xl border border-border/60 bg-card/95 p-3 shadow-xl backdrop-blur-xl sm:hidden">
          {visibleLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            >
              {label}
            </Link>
          ))}

          {isLoaded && !isSignedIn && (
            <Link
              href={signInLink.href}
              onClick={() => setOpen(false)}
              className="mt-1 rounded-lg bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground"
            >
              {signInLink.label}
            </Link>
          )}

          {isLoaded && isSignedIn && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-border/40 px-3 py-2">
              <UserButton
                appearance={{
                  elements: { avatarBox: "size-6" },
                }}
              />
              <span className="text-sm text-muted-foreground">Account & sign out</span>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
