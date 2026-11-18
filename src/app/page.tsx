"use client";

import {
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Inbox,
  Mail,
  MessageSquare,
  Send,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { PIPELINE_ORDER, STATUS_META } from "@/lib/constants";
import type { Activity } from "@/lib/types";
import { daysUntil, firstName, formatNumber, timeAgo } from "@/lib/utils";
import { Avatar, Badge, Button, buttonClass, Card, PageHeader, ProgressBar, SectionHeading } from "@/components/ui";
import { useWorkspaceReady } from "@/components/workspace-provider";

const ACTIVITY_ICON = {
  lead: UserPlus,
  email: Mail,
  reply: MessageSquare,
  status: ArrowRight,
  system: Sparkles,
} as const;

function ActivityIcon({ type }: { type: Activity["type"] }) {
  const Icon = ACTIVITY_ICON[type] ?? Sparkles;
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-cream text-sage-deep">
      <Icon className="size-3.5" strokeWidth={1.7} />
    </span>
  );
}

export default function OverviewPage() {
  const { state, meta, act, pending } = useWorkspaceReady();
  const { brand, settings, leads, threads, activities } = state;

  const reviewMessages = threads.flatMap((thread) =>
    thread.messages.filter((message) => message.status === "review" && message.direction === "outbound"),
  );
  const initialDrafts = reviewMessages.filter((message) => message.kind === "initial");
  const replyDrafts = reviewMessages.filter((message) => message.kind === "reply");
  const openReplies = threads.filter(
    (thread) =>
      !thread.handled &&
      thread.messages.some((message) => message.direction === "inbound" && message.status === "received"),
  );
  const dueLeads = leads.filter(
    (lead) =>
      lead.status === "follow_up_due" ||
      (lead.status === "email_sent" && lead.nextFollowUpAt && (daysUntil(lead.nextFollowUpAt) ?? 1) <= 0),
  );
  const confirmed = leads.filter((lead) => lead.status === "collaboration_confirmed");
  const contacted = leads.filter((lead) =>
    ["email_sent", "follow_up_due", "replied", "interested", "not_interested", "collaboration_confirmed", "opted_out"].includes(
      lead.status,
    ),
  );
  const emailCoverage = Math.round(
    (leads.filter((lead) => Boolean(lead.email)).length / Math.max(leads.length, 1)) * 100,
  );

  const stageCounts = PIPELINE_ORDER.map((stage) => ({
    stage,
    count: leads.filter((lead) => lead.status === stage).length,
  }));
  const maxStage = Math.max(...stageCounts.map((item) => item.count), 1);

  const needs = [
    replyDrafts.length
      ? {
          icon: Inbox,
          title: `${replyDrafts.length} reply draft${replyDrafts.length === 1 ? "" : "s"} ready for your read`,
          detail: "AI has classified each reply and written a calm response. Nothing sends without you.",
          href: "/inbox",
          cta: "Open inbox",
        }
      : null,
    initialDrafts.length
      ? {
          icon: Send,
          title: `${initialDrafts.length} first email${initialDrafts.length === 1 ? "" : "s"} waiting for approval`,
          detail: "Personalised from each creator's public profile and the current campaign brief.",
          href: "/outreach",
          cta: "Review outreach",
        }
      : null,
    dueLeads.length
      ? {
          icon: CalendarClock,
          title: `${dueLeads.length} gentle follow-up${dueLeads.length === 1 ? "" : "s"} due`,
          detail: `Follow-ups run ${settings.followUpDays[0]} and ${settings.followUpDays[1]} days after the last email, and stop on any reply.`,
          href: "/pipeline",
          cta: "See who is due",
        }
      : null,
  ].filter(Boolean) as Array<{
    icon: typeof Inbox;
    title: string;
    detail: string;
    href: string;
    cta: string;
  }>;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Campaign studio"
        title={`A calmer way to grow, ${firstName(brand.senderName)}.`}
        description={`${brand.name} has a clear brief, a screened shortlist and drafts ready. Here is what needs your human touch today.`}
        actions={
          <>
            <Link href="/discover" className={buttonClass("secondary")}>
              Find creators
            </Link>
            <Button
              onClick={() => void act("automation.tick")}
              loading={pending === "automation.tick"}
              disabled={pending !== null}
            >
              <Sparkles className="size-3.5" />
              Run daily check
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "In the pipeline",
            value: String(leads.length),
            note: `${formatNumber(leads.reduce((sum, lead) => sum + lead.followers, 0))} combined reach`,
            icon: Users,
          },
          {
            label: "Awaiting approval",
            value: String(reviewMessages.length),
            note: "Human approval is on",
            icon: CheckCircle2,
          },
          {
            label: "Open conversations",
            value: String(openReplies.length),
            note: "Replies that need a read",
            icon: Inbox,
          },
          {
            label: "Confirmed",
            value: String(confirmed.length),
            note: "Collaborations in motion",
            icon: Sparkles,
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="fade-up p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-muted">{stat.label}</p>
                <Icon className="size-3.5 text-sage" strokeWidth={1.7} />
              </div>
              <p className="font-display mt-2 text-[2rem] leading-none text-ink">{stat.value}</p>
              <p className="mt-1.5 text-[10.5px] leading-4 text-[#8f968d]">{stat.note}</p>
            </Card>
          );
        })}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <SectionHeading
              title="Needs you today"
              description="A short list, not an endless feed. Everything else is waiting quietly."
              action={<Badge tone={needs.length ? "clay" : "sage"}>{needs.length ? `${needs.length} to review` : "All clear"}</Badge>}
            />
            <div className="mt-4 divide-y divide-line-soft">
              {needs.length === 0 ? (
                <div className="flex items-center gap-3 py-6 text-[12.5px] text-muted">
                  <CheckCircle2 className="size-4 text-sage-deep" />
                  Nothing needs a human right now. The outbox and inbox are both calm.
                </div>
              ) : (
                needs.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex flex-col gap-3 py-4 first:pt-1 last:pb-1 sm:flex-row sm:items-center">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sage-soft text-sage-deep">
                        <Icon className="size-4" strokeWidth={1.7} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-ink">{item.title}</p>
                        <p className="mt-0.5 text-[11.5px] leading-5 text-muted">{item.detail}</p>
                      </div>
                      <Link href={item.href} className={buttonClass("secondary", "sm")}>
                        {item.cta}
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionHeading
              title="Pipeline at a glance"
              description={`${contacted.length} of ${leads.length} creators have been contacted. ${emailCoverage}% have a public business email.`}
              action={
                <Link href="/pipeline" className={buttonClass("ghost", "sm")}>
                  Open pipeline <ArrowUpRight className="size-3.5" />
                </Link>
              }
            />
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stageCounts.map(({ stage, count }) => (
                <div key={stage} className="rounded-xl border border-line bg-paper/40 p-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`size-1.5 rounded-full ${STATUS_META[stage].dot}`} />
                    <p className="truncate text-[10.5px] text-muted">{STATUS_META[stage].short}</p>
                  </div>
                  <p className="font-display mt-1 text-xl text-ink">{count}</p>
                  <ProgressBar value={(count / maxStage) * 100} className="mt-2" />
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-sage-deep" /> {formatNumber(contacted.length)} contacted
              </span>
              <span className="text-line">·</span>
              <span>{leads.filter((lead) => !lead.email).length} without a public email</span>
              <span className="text-line">·</span>
              <span>{leads.filter((lead) => lead.status === "opted_out").length} opted out and suppressed</span>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionHeading
              title="A quiet record"
              description="Every screen, draft, approval and reply is written down."
            />
            <ol className="mt-4 space-y-4">
              {activities.slice(0, 6).map((activity) => (
                <li key={activity.id} className="flex gap-3">
                  <ActivityIcon type={activity.type} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-medium text-ink">{activity.title}</p>
                    <p className="mt-0.5 text-[11.5px] leading-5 text-muted">{activity.detail}</p>
                  </div>
                  <p className="shrink-0 text-[10px] text-[#9aa197]">{timeAgo(activity.at)}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-[#e9efe4] via-[#f2f2e9] to-[#f4e9de] p-5">
              <p className="eyebrow">Live campaign</p>
              <h2 className="font-display mt-2 text-[1.75rem] leading-tight text-ink">{brand.campaignName}</h2>
              <p className="mt-1 text-[12px] leading-5 text-ink-soft">{brand.tagline}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {brand.niches.slice(0, 3).map((niche) => (
                  <span key={niche} className="chip border-white/60 bg-white/60 text-[#4f5f52]">
                    {niche}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-3 p-5">
              <p className="text-[12px] leading-6 text-ink-soft">{brand.campaignGoal}</p>
              <div className="rounded-xl border border-line bg-paper/50 p-3">
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted">The offer</p>
                <p className="mt-1 text-[12px] leading-5 text-ink-soft">{brand.offer}</p>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted">
                <span>Email coverage</span>
                <span className="tabular-nums text-ink">{emailCoverage}%</span>
              </div>
              <ProgressBar value={emailCoverage} tone="clay" />
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex -space-x-2">
                  {leads.slice(0, 5).map((lead) => (
                    <span key={lead.id} className="rounded-full ring-2 ring-cream">
                      <Avatar name={lead.name} tone={lead.avatarTone} size="xs" />
                    </span>
                  ))}
                </div>
                <Link href="/settings" className="text-[11px] text-muted underline decoration-line underline-offset-2 hover:text-ink">
                  Edit brief
                </Link>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-sage-deep" />
              <p className="text-[12px] font-medium text-ink">The loop</p>
            </div>
            <ol className="mt-4 space-y-3">
              {[
                ["Find", "Search the curated demo catalog by niche, place and reach."],
                ["Screen", `${meta.engine} scores fit and writes a short rationale.`],
                ["Approve", "You read every first email before it leaves."],
                ["Follow up", "Two gentle nudges, stopped by any reply or opt-out."],
                ["Reply", "AI sorts the inbox and drafts; you approve the send."],
              ].map(([step, detail], index) => (
                <li key={step} className="flex gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-line bg-cream text-[9px] tabular-nums text-muted">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[12px] font-medium text-ink">{step}</p>
                    <p className="text-[11px] leading-5 text-muted">{detail}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link href="/guide" className={buttonClass("soft", "sm", "mt-4 w-full")}>
              Read the full walkthrough
            </Link>
          </Card>

          <div className="rounded-2xl border border-[#e6dccb] bg-[#f7efe3] p-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#9a7455]">Demo workspace</p>
            <p className="mt-1.5 text-[11.5px] leading-5 text-[#7b6957]">
              All creators and emails are fictional (<span className="font-mono text-[10.5px]">.example</span>).
              Sends land in {meta.email.mode === "gmail" ? "a guarded Gmail test flow" : "a private demo outbox"} — no
              real person is contacted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
