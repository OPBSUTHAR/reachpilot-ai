"use client";

import {
  Brain,
  CheckCheck,
  Inbox,
  Mail,
  MessageSquare,
  PenLine,
  RefreshCw,
  Send,
  Sparkles,
  TestTube2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { REPLY_META } from "@/lib/constants";
import type { Message, Thread } from "@/lib/types";
import { cx, formatDateTime, timeAgo } from "@/lib/utils";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  ProgressBar,
  Select,
  StatusPill,
  Tabs,
  Textarea,
} from "@/components/ui";
import { useWorkspaceReady } from "@/components/workspace-provider";

function latestDraft(thread: Thread): Message | undefined {
  return [...thread.messages]
    .reverse()
    .find(
      (message) =>
        message.direction === "outbound" && message.kind === "reply" && message.status === "review",
    );
}

export default function InboxPage() {
  const { state, act, pending, notify } = useWorkspaceReady();
  const [tab, setTab] = useState("needs");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [simulateOpen, setSimulateOpen] = useState(false);
  const [simulateLead, setSimulateLead] = useState("");
  const [simulateBody, setSimulateBody] = useState(
    "Hi Omprakash, this sounds lovely. I like the slow morning angle. Could you share your rate range and timeline?",
  );

  const replyThreads = useMemo(
    () =>
      state.threads
        .filter((thread) => thread.messages.some((message) => message.direction === "inbound"))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [state.threads],
  );

  const needs = replyThreads.filter(
    (thread) =>
      !thread.handled ||
      thread.messages.some(
        (message) =>
          message.direction === "outbound" && message.kind === "reply" && message.status === "review",
      ),
  );
  const handled = replyThreads.filter((thread) => thread.handled);

  const filtered = tab === "needs" ? needs : tab === "handled" ? handled : replyThreads;

  const selected =
    filtered.find((thread) => thread.id === selectedId) ??
    filtered[0] ??
    null;
  const lead = selected ? state.leads.find((item) => item.id === selected.leadId) ?? null : null;
  const draft = selected ? latestDraft(selected) : undefined;
  const inbound = selected
    ? [...selected.messages].reverse().find((message) => message.direction === "inbound")
    : undefined;
  const metaInfo = selected?.category ? REPLY_META[selected.category] : null;

  useEffect(() => {
    if (draft) {
      setSubject(draft.subject);
      setBody(draft.body);
    } else {
      setSubject(selected ? `Re: ${selected.subject}` : "");
      setBody("");
    }
  }, [draft, selected]);

  const openSimulate = () => {
    if (!simulateLead) {
      const first = state.leads.find((item) => item.email && item.status !== "opted_out");
      if (first) setSimulateLead(first.id);
    }
    setSimulateOpen(true);
  };

  const confidence =
    typeof selected?.confidence === "number"
      ? Math.round(selected.confidence <= 1 ? selected.confidence * 100 : selected.confidence)
      : null;

  const approveSend = async () => {
    if (!draft) {
      notify("Generate a reply draft first.", "info");
      return;
    }
    await act("replies.approveSend", { messageId: draft.id, subject, body });
    setTab("handled");
  };

  const simulate = async () => {
    if (!simulateLead || !simulateBody.trim()) return;
    const result = await act<{ threadId: string }>("replies.simulate", {
      leadId: simulateLead,
      body: simulateBody.trim(),
    });
    if (result?.threadId) {
      setSelectedId(result.threadId);
      setTab("needs");
    }
    setSimulateOpen(false);
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Step six · Reply management"
        title="Every reply, read before it is answered."
        description="The inbox sorts each answer into a clear intent, writes a calm draft and suggests the next step. You approve the words before anything sends."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => void act("replies.sync")}
              loading={pending === "replies.sync"}
            >
              <RefreshCw className="size-3.5" />
              Check Gmail
            </Button>
            <Button onClick={openSimulate}>
              <TestTube2 className="size-3.5" />
              Simulate a reply
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-cream/70 px-4 py-3">
          <p className="text-[10.5px] text-muted">Waiting for you</p>
          <p className="font-display mt-1 text-[1.6rem] leading-none text-ink">{needs.length}</p>
          <p className="mt-1 text-[10px] text-[#9aa197]">unhandled or drafted</p>
        </div>
        <div className="rounded-xl border border-line bg-cream/70 px-4 py-3">
          <p className="text-[10.5px] text-muted">Handled threads</p>
          <p className="font-display mt-1 text-[1.6rem] leading-none text-ink">{handled.length}</p>
          <p className="mt-1 text-[10px] text-[#9aa197]">closed with a reply or opt-out</p>
        </div>
        <div className="rounded-xl border border-line bg-cream/70 px-4 py-3">
          <p className="text-[10.5px] text-muted">Conversations</p>
          <p className="font-display mt-1 text-[1.6rem] leading-none text-ink">{replyThreads.length}</p>
          <p className="mt-1 text-[10px] text-[#9aa197]">with a real inbound message</p>
        </div>
      </div>

      <Tabs
        items={[
          { id: "needs", label: "Needs you", count: needs.length },
          { id: "handled", label: "Handled", count: handled.length },
          { id: "all", label: "All replies", count: replyThreads.length },
        ]}
        value={tab}
        onChange={setTab}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Inbox className="size-6" />}
          title={tab === "handled" ? "Nothing handled yet" : "The inbox is quiet"}
          description="Replies from tracked creators appear here. Use “Simulate a reply” to walk through the demo, or connect Gmail to read a test inbox."
          action={
            tab !== "needs" ? (
              <Button variant="secondary" onClick={() => setTab("needs")}>
                Back to needs you
              </Button>
            ) : (
              <Button variant="secondary" onClick={openSimulate}>
                Simulate a reply
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
          <div className="space-y-2">
            {filtered.map((thread) => {
              const threadLead = state.leads.find((item) => item.id === thread.leadId);
              if (!threadLead) return null;
              const threadDraft = latestDraft(thread);
              const threadMeta = thread.category ? REPLY_META[thread.category] : null;
              const active = selected?.id === thread.id;
              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setSelectedId(thread.id)}
                  className={cx(
                    "w-full rounded-xl border p-3 text-left transition-colors",
                    active
                      ? "border-[#b8cbb3] bg-sage-soft/60"
                      : "border-line bg-cream/60 hover:bg-cream",
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <Avatar name={threadLead.name} tone={threadLead.avatarTone} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[12.5px] font-medium text-ink">{threadLead.name}</p>
                        <span className="shrink-0 text-[9.5px] text-[#9aa197]">{timeAgo(thread.updatedAt)}</span>
                      </div>
                      <p className="truncate text-[10px] text-muted">{thread.subject}</p>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-ink-soft">
                        {thread.replySummary ?? thread.messages.at(-1)?.body}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {threadMeta ? (
                          <span className={cx("chip border", threadMeta.tone)}>{threadMeta.label}</span>
                        ) : null}
                        {threadDraft ? <Badge tone="clay">Draft ready</Badge> : null}
                        {thread.handled ? <Badge tone="sage">Handled</Badge> : null}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {selected && lead ? (
            <Card className="overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-line bg-paper/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex items-center gap-3">
                  <Avatar name={lead.name} tone={lead.avatarTone} size="md" />
                  <div>
                    <p className="text-[14px] font-medium text-ink">{lead.name}</p>
                    <p className="text-[10.5px] text-muted">
                      @{lead.username} · {lead.email}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={lead.status} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void act("replies.classify", { threadId: selected.id })}
                    loading={pending === "replies.classify"}
                  >
                    <Brain className="size-3.5" />
                    Re-classify
                  </Button>
                </div>
              </div>

              <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[1.4fr_1fr]">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="eyebrow">Conversation</p>
                    <a
                      href={`mailto:${lead.email}`}
                      className="inline-flex items-center gap-1 text-[10px] text-muted underline decoration-line underline-offset-2 hover:text-ink"
                    >
                      <Mail className="size-3" /> {lead.email}
                    </a>
                  </div>
                  <div className="scroll-thin mt-3 max-h-[520px] space-y-3 overflow-y-auto pr-1">
                    {selected.messages.map((message) => (
                      <div
                        key={message.id}
                        className={cx(
                          "rounded-xl border px-3.5 py-3",
                          message.direction === "inbound"
                            ? "border-[#d9e3d5] bg-sage-soft/50"
                            : message.kind === "reply"
                              ? "border-line bg-white/70"
                              : "border-line bg-paper/40",
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[9.5px] uppercase tracking-[0.1em] text-muted">
                          <span>
                            {message.direction === "inbound"
                              ? "From creator"
                              : message.kind === "reply"
                                ? "Your reply"
                                : message.kind === "initial"
                                  ? "Initial email"
                                  : "Follow-up"}
                          </span>
                          <span>{message.status}</span>
                        </div>
                        <p className="mt-1 text-[11px] font-medium text-ink">{message.subject}</p>
                        <p className="mt-1.5 whitespace-pre-line text-[12px] leading-6 text-ink-soft">
                          {message.body}
                        </p>
                        <p className="mt-2 text-[9.5px] text-[#9aa197]">
                          {formatDateTime(message.sentAt ?? message.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-line bg-paper/50 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-sage-deep" />
                        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-sage-deep">
                          AI read
                        </p>
                      </div>
                      {metaInfo ? <span className={cx("chip border", metaInfo.tone)}>{metaInfo.label}</span> : null}
                    </div>
                    {selected.replySummary ? (
                      <p className="mt-2 text-[12px] leading-5 text-ink-soft">{selected.replySummary}</p>
                    ) : (
                      <p className="mt-2 text-[12px] text-muted">Not classified yet.</p>
                    )}
                    {confidence !== null ? (
                      <>
                        <div className="mt-3 flex items-center justify-between text-[10px] text-muted">
                          <span>Confidence</span>
                          <span className="tabular-nums">{confidence}%</span>
                        </div>
                        <ProgressBar value={confidence} className="mt-1" />
                      </>
                    ) : null}
                    {selected.suggestedAction ? (
                      <div className="mt-3 rounded-lg bg-cream px-3 py-2">
                        <p className="text-[9.5px] uppercase tracking-[0.1em] text-muted">Suggested next step</p>
                        <p className="mt-0.5 text-[11px] leading-5 text-ink-soft">{selected.suggestedAction}</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-xl border border-line p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
                        Reply draft
                      </p>
                      {draft ? (
                        <Badge tone="sage">
                          <CheckCheck className="size-3" /> Human approval needed
                        </Badge>
                      ) : null}
                    </div>

                    {draft ? (
                      <div className="mt-3 space-y-3">
                        <Field label="Subject">
                          <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
                        </Field>
                        <Field label="Body">
                          <Textarea rows={9} value={body} onChange={(event) => setBody(event.target.value)} />
                        </Field>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => void approveSend()}
                            loading={pending === "replies.approveSend"}
                          >
                            <Send className="size-3.5" />
                            Approve & send
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => void act("replies.draft", { threadId: selected.id })}
                            loading={pending === "replies.draft"}
                          >
                            <RefreshCw className="size-3.5" />
                            Regenerate
                          </Button>
                        </div>
                        <p className="text-[10px] leading-4 text-muted">
                          Suggesting: {metaInfo?.advice ?? "read the reply and choose the next step."}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <p className="text-[11.5px] leading-5 text-muted">
                          {selected.handled
                            ? "This thread has been handled. You can still ask for a fresh draft."
                            : "No reply draft is waiting for this thread."}
                        </p>
                        <Button
                          size="sm"
                          className="mt-3"
                          onClick={() => void act("replies.draft", { threadId: selected.id })}
                          loading={pending === "replies.draft"}
                          disabled={!inbound}
                        >
                          <PenLine className="size-3.5" />
                          Generate reply draft
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-2 rounded-xl bg-paper-deep/60 px-3 py-2.5 text-[10.5px] leading-5 text-muted">
                    <MessageSquare className="mt-0.5 size-3.5 shrink-0" />
                    Approving a reply sends it through the{" "}
                    {state.settings.demoMode ? "demo outbox" : "connected Gmail account"} and marks the thread
                    handled. Follow-ups stop immediately.
                  </div>
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      )}

      <div className="rounded-2xl border border-line bg-cream/50 px-4 py-3 text-[11px] leading-5 text-muted">
        <span className="font-medium text-ink-soft">Real inbox, gently:</span> when Gmail is connected, unread
        replies from known creator emails are imported, classified, drafted and marked read. Unknown senders are
        ignored. Opt-outs update the CRM and suppress all future outreach.
      </div>

      <Modal
        open={simulateOpen}
        onClose={() => setSimulateOpen(false)}
        title="Simulate an inbound reply"
        description="For the demo only. This creates a test reply from a catalog creator so you can walk through classification and approval."
        footer={
          <>
            <Button variant="ghost" onClick={() => setSimulateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void simulate()}
              loading={pending === "replies.simulate"}
              disabled={!simulateLead || !simulateBody.trim()}
            >
              <TestTube2 className="size-3.5" />
              Add test reply
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="From creator">
            <Select value={simulateLead} onChange={(event) => setSimulateLead(event.target.value)}>
              {state.leads
                .filter((item) => item.email)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.status.replace("_", " ")}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Reply text" hint="Try a pricing question, a warm yes, a polite no, or “unsubscribe”.">
            <Textarea
              rows={6}
              value={simulateBody}
              onChange={(event) => setSimulateBody(event.target.value)}
            />
          </Field>
          <div className="rounded-xl border border-line bg-paper/50 px-3 py-2.5 text-[11px] leading-5 text-muted">
            The reply is classified with {state.brand.name}&apos;s campaign context, the CRM status is updated, and a
            draft answer is placed in this inbox.
          </div>
        </div>
      </Modal>
    </div>
  );
}
