"use client";

import {
  ArrowUpRight,
  BookOpen,
  Inbox,
  LayoutGrid,
  Leaf,
  Mail,
  Menu,
  Search,
  Settings2,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { useWorkspace } from "@/components/workspace-provider";
import { cx } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutGrid },
  { href: "/discover", label: "Discover", icon: Search },
  { href: "/pipeline", label: "Pipeline", icon: Users },
  { href: "/outreach", label: "Outreach", icon: Mail },
  { href: "/inbox", label: "Inbox", icon: Inbox },
];

const SECONDARY = [
  { href: "/guide", label: "How it works", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-full bg-sage-deep text-cream shadow-sm transition-transform group-hover:-rotate-6">
        <Leaf className="size-4" strokeWidth={1.7} />
      </span>
      {!compact ? (
        <span className="leading-tight">
          <span className="font-display block text-[1.35rem] tracking-[-0.03em] text-ink">ReachPilot</span>
          <span className="block text-[9px] uppercase tracking-[0.18em] text-muted">by Sankar Group</span>
        </span>
      ) : null}
    </Link>
  );
}

function bootLabel(value: string): string {
  if (value.toLowerCase().includes("claude")) return "Claude";
  if (value.toLowerCase().includes("gateway")) return "AI Gateway";
  return "Local model";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { state, meta, loading, error, pending, act, refresh } = useWorkspace();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [pathname]);

  if (!state || !meta) {
    if (error) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
          <Logo />
          <p className="mt-4 max-w-md text-[13px] leading-6 text-muted">
            The studio could not open. {error}
          </p>
          <Button variant="secondary" onClick={() => void refresh()} loading={loading}>
            Try again
          </Button>
        </div>
      );
    }
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-5">
        <Logo />
        <div className="flex items-center gap-2 text-[12px] text-muted">
          <span className="size-1.5 animate-pulse rounded-full bg-sage" />
          Opening your studio
        </div>
      </div>
    );
  }

  const reviewCount = state.threads
    .flatMap((thread) => thread.messages)
    .filter((message) => message.status === "review" && message.direction === "outbound").length;
  const inboxCount = state.threads.filter(
    (thread) =>
      !thread.handled &&
      thread.messages.some((message) => message.direction === "inbound" && message.status === "received"),
  ).length;

  const counts: Record<string, number> = {
    "/pipeline": state.leads.length,
    "/outreach": reviewCount,
    "/inbox": inboxCount,
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo />
        <button
          type="button"
          className="rounded-full p-1.5 text-muted hover:bg-ink/5 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="size-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <p className="px-3 pb-2 pt-4 text-[9px] uppercase tracking-[0.18em] text-[#9aa197]">Workspace</p>
        <div className="space-y-0.5">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx("nav-link", active && "nav-link-active")}
              >
                <Icon className="size-[16px]" strokeWidth={1.7} />
                <span className="flex-1">{item.label}</span>
                {counts[item.href] ? (
                  <span
                    className={cx(
                      "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                      active ? "bg-white/70 text-sage-deep" : "bg-ink/5 text-muted",
                    )}
                  >
                    {counts[item.href]}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>

        <p className="px-3 pb-2 pt-6 text-[9px] uppercase tracking-[0.18em] text-[#9aa197]">Studio</p>
        <div className="space-y-0.5">
          {SECONDARY.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx("nav-link", active && "nav-link-active")}
              >
                <Icon className="size-[16px]" strokeWidth={1.7} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-6 rounded-xl border border-line bg-paper-deep/60 p-3.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-sage-deep">
            <span className="size-1.5 rounded-full bg-sage" />
            Calm by default
          </div>
          <p className="mt-1.5 text-[11px] leading-5 text-muted">
            Public contacts only. No scraping. Human approval before every first send and AI reply.
          </p>
        </div>
      </nav>

      <div className="border-t border-line p-3">
        <div className="rounded-xl bg-cream px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Sparkles className="size-3.5 shrink-0 text-sage-deep" />
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium text-ink">{bootLabel(meta.engine)}</p>
                <p className="truncate text-[10px] text-muted">
                  {meta.email.mode === "gmail" ? "Gmail connected" : "Demo outbox"} ·{" "}
                  {meta.storage === "blob" ? "Cloud saved" : meta.storage === "file" ? "Local saved" : "In memory"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void act("automation.tick")}
              disabled={pending !== null}
              title="Run the daily reply check and follow-ups"
              className="shrink-0 rounded-full border border-line bg-cream p-1.5 text-sage-deep transition-colors hover:bg-sage-soft disabled:opacity-50"
              aria-label="Run daily automation check"
            >
              <ArrowUpRight className="size-3.5" />
            </button>
          </div>
        </div>
        <p className="mt-2 px-1 text-[9.5px] leading-4 text-[#9aa197]">
          Built for Sankar Group · Human in the loop
        </p>
      </div>
    </div>
  );

  return (
    <div className="page-wash min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-line bg-paper/80 backdrop-blur-sm lg:block">
        {sidebar}
      </aside>

      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-paper/85 px-4 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-full p-2 text-ink hover:bg-ink/5"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
        <Logo />
        <span className="size-8" />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu overlay"
          />
          <div className="fade-in absolute inset-y-0 left-0 w-[280px] border-r border-line bg-paper shadow-2xl">
            {sidebar}
          </div>
        </div>
      ) : null}

      <main className="lg:pl-[248px]">
        <div className="mx-auto w-full max-w-[1220px] px-4 py-7 sm:px-7 sm:py-9 lg:px-10 lg:py-11">
          {children}
        </div>
      </main>
    </div>
  );
}
