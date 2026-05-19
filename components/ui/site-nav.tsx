"use client";

import { useState } from "react";
import Link from "next/link";
import { Hammer, Menu, X } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

interface NavLink {
  label: string;
  href: string;
}

interface SiteNavProps {
  links: NavLink[];
  /** If provided, renders a primary CTA button on the right when signed out */
  cta?: { label: string; href: string };
}

export function SiteNav({ links, cta }: SiteNavProps) {
  const [open, setOpen] = useState(false);
  const { isSignedIn, isLoaded } = useUser();

  // Determine the right-side action button
  const actionButton = isLoaded
    ? isSignedIn
      ? { label: "Dashboard", href: "/dashboard" }
      : (cta ?? { label: "Sign in", href: "/sign-in" })
    : null;

  const allLinks = isLoaded && isSignedIn
    ? links.filter((l) => l.href !== "/dashboard") // avoid duplicate dashboard link
    : links;

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
        {allLinks.map(({ label, href }) => (
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
        {actionButton && (
          <Button
            size="sm"
            className="ml-3 h-8 text-xs px-4 shadow-[0_0_20px_theme(colors.primary/40%)] hover:shadow-[0_0_28px_theme(colors.primary/60%)] transition-shadow"
            asChild
          >
            <Link href={actionButton.href}>{actionButton.label}</Link>
          </Button>
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
          {allLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            >
              {label}
            </Link>
          ))}
          {actionButton && (
            <Link
              href={actionButton.href}
              onClick={() => setOpen(false)}
              className="mt-1 rounded-lg bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground"
            >
              {actionButton.label}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
