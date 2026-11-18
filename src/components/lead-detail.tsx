"use client";

import {
  ArrowUpRight,
  CalendarClock,
  ExternalLink,
  Mail,
  MapPin,
  PencilLine,
  RefreshCw,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { STATUS_META } from "@/lib/constants";
import type { LeadStatus, MessageKind } from "@/lib/types";
import { dueLabel, formatDateTime, formatNumber, timeAgo } from "@/lib/utils";
import { Avatar, Badge, Button, CopyButton, Field, Modal, ScoreBadge, Select, StatusPill, Textarea } from "@/components/ui";
import { useWorkspaceReady } from "@/components/workspace-provider";

const KIND_LABEL: Record<MessageKind, string> = {
  initial: "Initial email",
  follow_up_1: "Follow-up 1",
  follow_up_2: "Follow-up 2",
  reply: "Reply",
};

export function LeadDetailModal({
  leadId,
  onClose,
}: {
  leadId: string | null;
  onClose: () => void;
}) {
  const { state, act, pending } = useWorkspaceReady();
  const lead = leadId ? state.leads.find((item) => item.id === leadId) ?? null : null;
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<LeadStatus>("new");

  useEffect(() => {
    if (lead) {
      setNotes(lead.notes);
      setStatus(lead.status);
    }
  }, [lead]);

  if (!lead) return null;

  const threads = state.threads
    .filter((thread) => thread.leadId === lead.id)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const activities = state.activities.filter((activity) => activity.leadId === lead.id).slice(0, 5);
  const busy = pending !== null;

  const saveNotes = async () => {
    await act("leads.update", { leadId: lead.id, fields: { notes } });
  };

  const changeStatus = async (next: LeadStatus) => {
    setStatus(next);
    await act("leads.update", { leadId: lead.id, fields: { status: next } });
  };

  const draft = async () => {
    await act("outreach.draft", { leadIds: [lead.id] });
    onClose();
  };

  return (
    <Modal
      open={Boolean(leadId)}
      onClose={onClose}
      title={lead.name}
      description={`@${lead.username} · ${lead.niche}`}
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="secondary"
            onClick={() => void act("leads.rescore", { leadId: lead.id })}
            disabled={busy}
          >
            <RefreshCw className={`size-3.5 ${pending === "leads.rescore" ? "animate-spin" : ""}`} />
            Refresh fit score
          </Button>
          {lead.email ? (
            <Button onClick={() => void draft()} loading={pending === "outreach.draft"}>
              <Send className="size-3.5" />
              Draft outreach
            </Button>
          ) : null}
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="flex items-start gap-4">
            <Avatar name={lead.name} tone={lead.avatarTone} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={lead.status} />
                <Badge tone={lead.tier === "A" ? "sage" : lead.tier === "B" ? "clay" : "neutral"}>
                  Tier {lead.tier}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-3.5" />
                  {formatNumber(lead.followers)} followers
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {lead.location}
                </span>
                {lead.nextFollowUpAt ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="size-3.5" />
                    {dueLabel(lead.nextFollowUpAt)}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-[13px] leading-6 text-ink-soft">{lead.bio}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a
                  href={lead.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="chip border-line bg-cream text-ink-soft transition-colors hover:bg-sage-soft"
                >
                  <ExternalLink className="size-3" />
                  Instagram profile
                </a>
                <Badge>{lead.source === "demo_catalog" ? "Demo catalog" : lead.source}</Badge>
                {lead.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            </div>
            <ScoreBadge score={lead.score} size="md" />
          </section>

          <section className="rounded-xl border border-line bg-paper/50 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-3.5 text-sage-deep" />
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-sage-deep">
                Why this creator fits
              </p>
            </div>
            <p className="mt-2 text-[13px] leading-6 text-ink-soft">{lead.summary}</p>
            <p className="mt-3 text-[11px] leading-5 text-muted">
              Scored by the {state.brand.name} campaign brief. Public profile details only; every first
              message waits for your approval.
            </p>
          </section>

          <section>
            <p className="eyebrow mb-2">Conversation</p>
            {threads.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-[12px] text-muted">
                No conversation yet. Draft a first email when you are ready.
              </div>
            ) : (
              <div className="space-y-3">
                {threads.map((thread) => (
                  <div key={thread.id} className="rounded-xl border border-line bg-cream/70 p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[12px] font-medium text-ink">{thread.subject}</p>
                      {thread.category ? <Badge tone="sage">{thread.category.replace("_", " ")}</Badge> : null}
                    </div>
                    <div className="mt-3 space-y-2">
                      {thread.messages.slice(-3).map((message) => (
                        <div
                          key={message.id}
                          className={
                            message.direction === "inbound"
                              ? "rounded-lg bg-sage-soft/70 px-3 py-2"
                              : "rounded-lg bg-white px-3 py-2"
                          }
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase tracking-[0.1em] text-muted">
                            <span>
                              {message.direction === "inbound" ? "From creator" : KIND_LABEL[message.kind]}
                            </span>
                            <span>{message.status}</span>
                          </div>
                          <p className="mt-1 line-clamp-3 whitespace-pre-line text-[12px] leading-5 text-ink-soft">
                            {message.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-xl border border-line p-4">
            <p className="eyebrow">Contact</p>
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Business email</p>
                {lead.email ? (
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <a
                      href={`mailto:${lead.email}`}
                      className="truncate text-[12.5px] text-sage-deep underline decoration-sage/40 underline-offset-2"
                    >
                      {lead.email}
                    </a>
                    <CopyButton value={lead.email} />
                  </div>
                ) : (
                  <p className="mt-1 text-[12px] text-muted">No public business email found.</p>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Instagram</p>
                <p className="mt-1 text-[12.5px] text-ink-soft">@{lead.username}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Location</p>
                <p className="mt-1 text-[12.5px] text-ink-soft">{lead.location}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Added</p>
                <p className="mt-1 text-[12.5px] text-ink-soft">{formatDateTime(lead.addedAt)}</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-line p-4">
            <Field label="Pipeline status">
              <Select
                value={status}
                onChange={(event) => void changeStatus(event.target.value as LeadStatus)}
                disabled={busy}
              >
                {Object.entries(STATUS_META).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Private notes" className="mt-4" hint="Only visible in this workspace.">
              <Textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} />
            </Field>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={() => void saveNotes()}
              loading={pending === "leads.update"}
              disabled={notes === lead.notes}
            >
              <PencilLine className="size-3.5" />
              Save notes
            </Button>
          </section>

          <section>
            <p className="eyebrow mb-2">Recent activity</p>
            {activities.length === 0 ? (
              <p className="text-[12px] text-muted">No activity recorded yet.</p>
            ) : (
              <ol className="space-y-3 border-l border-line pl-4">
                {activities.map((activity) => (
                  <li key={activity.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 size-1.5 rounded-full bg-sage" />
                    <p className="text-[12px] font-medium text-ink-soft">{activity.title}</p>
                    <p className="mt-0.5 text-[11px] leading-5 text-muted">{activity.detail}</p>
                    <p className="mt-0.5 text-[10px] text-[#9aa197]">{timeAgo(activity.at)}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {lead.email ? (
            <div className="flex items-start gap-2 rounded-xl bg-sage-soft/60 px-3.5 py-3 text-[11px] leading-5 text-sage-deep">
              <Mail className="mt-0.5 size-3.5 shrink-0" />
              <p>
                Outreach uses this public business contact only. Opt-out requests suppress the contact
                automatically.
              </p>
            </div>
          ) : null}

          <a
            href={lead.profileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-muted underline decoration-line underline-offset-2 hover:text-ink"
          >
            Review the public profile yourself <ArrowUpRight className="size-3" />
          </a>
        </div>
      </div>
    </Modal>
  );
}
