"use client";

import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  Mail,
  PauseCircle,
  PenLine,
  Send,
  ShieldCheck,
  SkipForward,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { sampleFollowUpEmail, sampleOutreachEmail } from "@/lib/seed";
import type { Message } from "@/lib/types";
import { cx, daysUntil, dueLabel, formatDateTime, timeAgo } from "@/lib/utils";
import {
  Avatar,
  Badge,
  Button,
  buttonClass,
  Card,
  CopyButton,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  ProgressBar,
  ScoreBadge,
  SectionHeading,
  Textarea,
} from "@/components/ui";
import { useWorkspaceReady } from "@/components/workspace-provider";

export default function OutreachPage() {
  const { state, meta, act, pending, notify } = useWorkspaceReady();
  const [editMessage, setEditMessage] = useState<Message | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);

  const allMessages = useMemo(
    () => state.threads.flatMap((thread) => thread.messages),
    [state.threads],
  );
  const review = allMessages.filter(
    (message) => message.direction === "outbound" && message.kind === "initial" && message.status === "review",
  );
  const approved = allMessages.filter(
    (message) => message.direction === "outbound" && message.kind === "initial" && message.status === "approved",
  );
  const sent = allMessages
    .filter((message) => message.direction === "outbound" && message.status === "sent")
    .sort((a, b) => new Date(b.sentAt ?? b.createdAt).getTime() - new Date(a.sentAt ?? a.createdAt).getTime());

  const todayStart = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }, []);
  const sentToday = allMessages.filter(
    (message) =>
      message.direction === "outbound" &&
      message.status === "sent" &&
      message.sentAt &&
      new Date(message.sentAt).getTime() >= todayStart,
  ).length;

  const followUpLeads = state.leads
    .filter(
      (lead) =>
        lead.nextFollowUpAt &&
        lead.followUpCount < 2 &&
        lead.status !== "opted_out" &&
        lead.status !== "not_interested",
    )
    .sort(
      (a, b) =>
        new Date(a.nextFollowUpAt ?? 0).getTime() - new Date(b.nextFollowUpAt ?? 0).getTime(),
    );
  const dueFollowUps = followUpLeads.filter(
    (lead) => (daysUntil(lead.nextFollowUpAt) ?? 1) <= 0 && lead.status === "follow_up_due",
  );

  const newCandidates = state.leads.filter(
    (lead) =>
      lead.email &&
      lead.status !== "opted_out" &&
      lead.status !== "not_interested" &&
      !state.threads.some(
        (thread) =>
          thread.leadId === lead.id &&
          thread.messages.some((message) => message.direction === "outbound"),
      ),
  );

  const leadFor = (message: Message) => state.leads.find((lead) => lead.id === message.leadId);

  useEffect(() => {
    if (editMessage) {
      setSubject(editMessage.subject);
      setBody(editMessage.body);
    }
  }, [editMessage]);

  const openEditor = (message: Message) => setEditMessage(message);

  const saveEdit = async () => {
    if (!editMessage) return;
    await act("outreach.updateDraft", { messageId: editMessage.id, subject, body });
    setEditMessage(null);
  };

  const approve = async (id: string) => {
    await act("outreach.approve", { messageIds: [id] });
  };

  const sendOne = async (id: string) => {
    setSendingId(id);
    try {
      await act("outreach.send", { messageIds: [id] });
    } finally {
      setSendingId(null);
    }
  };

  const sendAllApproved = async () => {
    await act("outreach.send", { messageIds: approved.map((message) => message.id) });
  };

  const draftBatch = async () => {
    if (newCandidates.length === 0) {
      notify("Every email-ready creator already has a draft or has been contacted.", "info");
      return;
    }
    await act("outreach.draft", { leadIds: newCandidates.map((lead) => lead.id) });
  };

  const runFollowUps = async () => {
    await act("followups.send");
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Step four · Outreach"
        title="Write like a person. Send with permission."
        description={`${state.brand.name} introduces itself through a short, specific note. Every first email waits for your approval; every message carries a real sender and a clear opt-out.`}
        actions={
          <>
            <Link href="/pipeline" className={buttonClass("secondary")}>
              <Users className="size-3.5" />
              Choose creators
            </Link>
            <Button onClick={() => void draftBatch()} loading={pending === "outreach.draft"}>
              <Sparkles className="size-3.5" />
              Draft next batch
              {newCandidates.length ? (
                <span className="ml-0.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[9px]">
                  {newCandidates.length}
                </span>
              ) : null}
            </Button>
          </>
        }
      />

      <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr_1fr]">
        <div className="rounded-xl border border-line bg-cream/70 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10.5px] text-muted">Daily sending room</p>
            <span className="text-[10.5px] tabular-nums text-ink">
              {sentToday} / {state.settings.dailySendLimit}
            </span>
          </div>
          <ProgressBar value={(sentToday / Math.max(state.settings.dailySendLimit, 1)) * 100} className="mt-2" />
          <p className="mt-1.5 text-[10px] text-[#9aa197]">
            Follow-ups share the same quiet limit. Nothing bursts.
          </p>
        </div>
        <div className="rounded-xl border border-line bg-cream/70 px-4 py-3">
          <p className="text-[10.5px] text-muted">Sender</p>
          <p className="mt-1 truncate text-[12px] font-medium text-ink">{state.brand.senderName}</p>
          <p className="truncate text-[10px] text-muted">{state.brand.senderEmail}</p>
        </div>
        <div className="rounded-xl border border-[#d9e3d5] bg-sage-soft/60 px-4 py-3">
          <div className="flex items-center gap-1.5 text-[10.5px] text-sage-deep">
            <ShieldCheck className="size-3.5" />
            Human approval on
          </div>
          <p className="mt-1 text-[10px] leading-4 text-sage-deep/80">
            {meta.email.mode === "gmail" ? "Gmail connected · test-safe guardrails" : "Demo outbox · no real sends"}
          </p>
        </div>
      </div>

      <section>
        <SectionHeading
          title="Waiting for your read"
          description={
            review.length
              ? "Edit anything that does not sound like you. Approving moves the email to the ready queue — it still does not send."
              : "The first-email queue is clear. Draft the next batch when you are ready."
          }
          action={<Badge tone={review.length ? "clay" : "sage"}>{review.length} to approve</Badge>}
        />

        {review.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={<CheckCircle2 className="size-6" />}
              title="No first emails waiting"
              description="Everything drafted has been approved, sent or skipped. New drafts will appear here for a human read."
              action={
                <Button variant="secondary" onClick={() => void draftBatch()} loading={pending === "outreach.draft"}>
                  Draft for {newCandidates.length || "new"} creator{newCandidates.length === 1 ? "" : "s"}
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {review.map((message) => {
              const lead = leadFor(message);
              if (!lead) return null;
              return (
                <Card key={message.id} className="overflow-hidden">
                  <div className="flex flex-col gap-3 border-b border-line-soft bg-paper/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={lead.name} tone={lead.avatarTone} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-ink">
                          {lead.name} <span className="font-normal text-muted">@{lead.username}</span>
                        </p>
                        <p className="truncate text-[10.5px] text-muted">
                          {lead.niche} · {lead.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone="sage">
                        <Sparkles className="size-3" /> {meta.engine}
                      </Badge>
                      <ScoreBadge score={lead.score} />
                    </div>
                  </div>

                  <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1.7fr_1fr]">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Subject</p>
                      <p className="mt-1 text-[13px] font-medium text-ink">{message.subject}</p>
                      <div className="scroll-thin mt-3 max-h-60 overflow-y-auto rounded-xl border border-line bg-white/60 px-4 py-3">
                        <p className="whitespace-pre-line text-[12px] leading-6 text-ink-soft">{message.body}</p>
                      </div>
                      <p className="mt-2 text-[10px] text-[#9aa197]">
                        Drafted {timeAgo(message.createdAt)} · opt-out line included · plain text only
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-xl border border-line bg-paper/50 p-3">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="size-3 text-sage-deep" />
                          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-sage-deep">
                            Why {lead.name.split(" ")[0]}
                          </p>
                        </div>
                        <p className="mt-1.5 text-[11.5px] leading-5 text-ink-soft">{lead.summary}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => void approve(message.id)} loading={pending === "outreach.approve"}>
                          Approve
                          <ArrowRight className="size-3.5" />
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => openEditor(message)}>
                          <PenLine className="size-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void act("outreach.skip", { messageId: message.id })}
                        >
                          <SkipForward className="size-3.5" />
                          Skip
                        </Button>
                      </div>
                      <p className="text-[10px] leading-4 text-muted">
                        Approved emails collect below. You can still edit them before sending.
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {approved.length > 0 ? (
        <Card className="border-[#cfdcc9] bg-[#f7faf4] p-4 sm:p-5">
          <SectionHeading
            title="Ready to send"
            description="Approved by you. Review the list once more, then release it."
            action={
              <Button onClick={() => void sendAllApproved()} loading={pending === "outreach.send"}>
                <Send className="size-3.5" />
                Send {approved.length} approved
              </Button>
            }
          />
          <div className="mt-4 divide-y divide-[#dde7d8]">
            {approved.map((message) => {
              const lead = leadFor(message);
              if (!lead) return null;
              return (
                <div key={message.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <Avatar name={lead.name} tone={lead.avatarTone} size="xs" />
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium text-ink">{lead.name}</p>
                      <p className="truncate text-[10.5px] text-muted">{message.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="sm" onClick={() => openEditor(message)}>
                      <PenLine className="size-3.5" /> Edit
                    </Button>
                    <Button size="sm" onClick={() => void sendOne(message.id)} loading={sendingId === message.id}>
                      <Send className="size-3.5" /> Send now
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      <Card className="p-4 sm:p-5">
        <SectionHeading
          title="Follow-ups, softly timed"
          description={`First nudge after ${state.settings.followUpDays[0]} days, second after another ${state.settings.followUpDays[1]}. Any reply, decline or opt-out stops the sequence.`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={state.settings.autoFollowUps ? "sage" : "neutral"}>
                {state.settings.autoFollowUps ? "Automatic" : "Paused"}
              </Badge>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void runFollowUps()}
                loading={pending === "followups.send"}
              >
                <Clock className="size-3.5" />
                Run follow-up check
              </Button>
            </div>
          }
        />
        {followUpLeads.length === 0 ? (
          <p className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-line px-4 py-5 text-[12px] text-muted">
            <PauseCircle className="size-4 text-sage" />
            No follow-ups are scheduled right now. Sent emails will appear here when their quiet window opens.
          </p>
        ) : (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {followUpLeads.slice(0, 6).map((lead) => {
              const overdue = (daysUntil(lead.nextFollowUpAt) ?? 1) <= 0;
              return (
                <div
                  key={lead.id}
                  className={cx(
                    "flex items-center gap-3 rounded-xl border px-3 py-2.5",
                    overdue ? "border-[#eadbc8] bg-clay-soft/50" : "border-line bg-paper/40",
                  )}
                >
                  <Avatar name={lead.name} tone={lead.avatarTone} size="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11.5px] font-medium text-ink">{lead.name}</p>
                    <p className="text-[10px] text-muted">
                      Follow-up {lead.followUpCount + 1} · {dueLabel(lead.nextFollowUpAt)}
                    </p>
                  </div>
                  <span className={cx("text-[10px]", overdue ? "text-[#9a7455]" : "text-muted")}>
                    {overdue ? `${dueFollowUps.length} due` : "scheduled"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-3 text-[10.5px] text-muted">
          <p>
            {state.settings.autoFollowUps
              ? "The daily check sends due follow-ups automatically, within the daily limit."
              : "Automatic follow-ups are paused. Due creators are marked for manual review."}
          </p>
          <Link href="/settings" className="underline decoration-line underline-offset-2 hover:text-ink">
            Follow-up settings
          </Link>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <SectionHeading
          title="The sent shelf"
          description="A calm history of what left the studio. Follow-up emails and replies live with each creator in the inbox."
          action={
            <a href="/api/export?type=outreach" className={buttonClass("ghost", "sm")} download>
              <Download className="size-3.5" /> Export CSV
            </a>
          }
        />
        {sent.length === 0 ? (
          <p className="mt-4 text-[12px] text-muted">Nothing has been sent yet.</p>
        ) : (
          <div className="mt-4 divide-y divide-line-soft">
            {sent.slice(0, 7).map((message) => {
              const lead = leadFor(message);
              if (!lead) return null;
              return (
                <div key={message.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar name={lead.name} tone={lead.avatarTone} size="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-ink">
                      {lead.name}
                      <span className="ml-2 font-normal text-muted">{message.subject}</span>
                    </p>
                    <p className="truncate text-[10px] text-muted">
                      {message.kind === "initial" ? "Initial email" : message.kind === "follow_up_1" ? "Follow-up 1" : "Follow-up 2"} ·{" "}
                      {formatDateTime(message.sentAt)} · {message.provider === "gmail" ? "Gmail" : "Demo outbox"}
                    </p>
                  </div>
                  <Badge tone={message.provider === "gmail" ? "sky" : "neutral"}>
                    {message.provider === "gmail" ? "Gmail" : "Demo"}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <SectionHeading title="Sample initial email" description="The first note, written for Tara Menon." />
          <div className="mt-3 rounded-xl border border-line bg-white/60 p-4">
            <p className="text-[11px] font-medium text-ink">Subject: A slower morning with Sankar Living</p>
            <p className="mt-2 line-clamp-[12] whitespace-pre-line text-[11.5px] leading-5 text-ink-soft">
              {sampleOutreachEmail()}
            </p>
          </div>
          <div className="mt-2 flex justify-end">
            <CopyButton value={sampleOutreachEmail()} label="Copy sample" />
          </div>
        </Card>
        <Card className="p-4 sm:p-5">
          <SectionHeading title="Sample follow-up" description="Gentle, specific, and easy to ignore." />
          <div className="mt-3 rounded-xl border border-line bg-white/60 p-4">
            <p className="text-[11px] font-medium text-ink">Subject: Still thinking about slow mornings?</p>
            <p className="mt-2 line-clamp-[12] whitespace-pre-line text-[11.5px] leading-5 text-ink-soft">
              {sampleFollowUpEmail()}
            </p>
          </div>
          <div className="mt-2 flex justify-end">
            <CopyButton value={sampleFollowUpEmail()} label="Copy sample" />
          </div>
        </Card>
      </div>

      <div className="rounded-2xl border border-line bg-cream/50 px-4 py-3 text-[11px] leading-5 text-muted">
        <span className="font-medium text-ink-soft">Sending rules:</span> plain-text Gmail only, daily limit{" "}
        {state.settings.dailySendLimit}, sender identification on every message, List-Unsubscribe header on
        Gmail sends, and an opt-out line in the body. Test recipients (<span className="font-mono">.example</span>)
        always stay in the demo outbox.
      </div>

      <Modal
        open={Boolean(editMessage)}
        onClose={() => setEditMessage(null)}
        title="Edit this email"
        description="Make it sound like you. Saving an approved draft puts it back in review."
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditMessage(null)}>
              Cancel
            </Button>
            <Button onClick={() => void saveEdit()} loading={pending === "outreach.updateDraft"}>
              Save draft
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Subject">
            <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
          </Field>
          <Field
            label="Body"
            hint="Keep the sender identity and opt-out line intact. Plain text only."
          >
            <Textarea rows={15} value={body} onChange={(event) => setBody(event.target.value)} />
          </Field>
          <div className="flex items-start gap-2 rounded-xl bg-paper-deep/60 px-3 py-2.5 text-[11px] leading-5 text-muted">
            <Mail className="mt-0.5 size-3.5 shrink-0" />
            Test recipients always land in the demo outbox, even if Gmail is connected.
          </div>
        </div>
      </Modal>
    </div>
  );
}
