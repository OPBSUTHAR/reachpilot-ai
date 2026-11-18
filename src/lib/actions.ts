import {
  aiEngine,
  analyzeReply,
  composeFollowUp,
  composeOutreach,
  composeReply,
  localScreen,
  screenCreator,
} from "./ai";
import { filterCatalog } from "./candidates";
import {
  fetchGmailReplies,
  gmailConfig,
  markGmailRead,
  sendGmail,
} from "./email";
import { createSeedWorkspace } from "./seed";
import { mutateWorkspace, readWorkspace, resetWorkspace } from "./store";
import type {
  Activity,
  AutomationResult,
  Candidate,
  DiscoverFilters,
  Lead,
  LeadStatus,
  Message,
  ReplyCategory,
  Thread,
  Workspace,
  WorkspaceSettings,
} from "./types";
import { addDays, uid } from "./utils";

const nowIso = () => new Date().toISOString();

function activity(
  state: Workspace,
  type: Activity["type"],
  title: string,
  detail: string,
  leadId?: string,
): void {
  state.activities = [
    {
      id: uid("act"),
      type,
      title,
      detail,
      at: nowIso(),
      leadId,
    },
    ...state.activities,
  ].slice(0, 80);
}

function getLead(state: Workspace, leadId: string): Lead {
  const lead = state.leads.find((item) => item.id === leadId);
  if (!lead) throw new Error("Lead not found");
  return lead;
}

function getThread(state: Workspace, threadId: string): Thread {
  const thread = state.threads.find((item) => item.id === threadId);
  if (!thread) throw new Error("Conversation not found");
  return thread;
}

function threadForLead(state: Workspace, leadId: string): Thread | undefined {
  return state.threads.find((thread) => thread.leadId === leadId);
}

function ensureThread(
  state: Workspace,
  lead: Lead,
  subject: string,
  gmailThreadId?: string,
): Thread {
  const existing = threadForLead(state, lead.id);
  if (existing) {
    if (gmailThreadId && !existing.gmailThreadId) existing.gmailThreadId = gmailThreadId;
    return existing;
  }
  const thread: Thread = {
    id: uid("thread"),
    leadId: lead.id,
    subject,
    messages: [],
    handled: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  if (gmailThreadId) thread.gmailThreadId = gmailThreadId;
  state.threads.unshift(thread);
  return thread;
}

function isDemoRecipient(email: string | null): boolean {
  if (!email) return true;
  return /\.(example|test|invalid)$/i.test(email);
}

async function deliver(
  state: Workspace,
  lead: Lead,
  thread: Thread,
  message: Message,
): Promise<void> {
  if (!lead.email) throw new Error("This creator has no public business email");
  const demo = state.settings.demoMode || !gmailConfig().configured || isDemoRecipient(lead.email);
  if (demo) {
    message.provider = "demo";
    message.gmailId = `demo_${uid("msg")}`;
    message.gmailThreadId = thread.gmailThreadId ?? `demo_thread_${thread.id}`;
    thread.gmailThreadId = message.gmailThreadId;
    return;
  }
  const result = await sendGmail({
    to: lead.email,
    subject: message.subject,
    body: message.body,
    brand: state.brand,
    threadId: thread.gmailThreadId,
  });
  message.provider = "gmail";
  message.gmailId = result.messageId;
  message.gmailThreadId = result.threadId;
  thread.gmailThreadId = result.threadId;
}

function sentToday(state: Workspace): number {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return state.threads
    .flatMap((thread) => thread.messages)
    .filter(
      (message) =>
        message.direction === "outbound" &&
        message.status === "sent" &&
        message.sentAt &&
        new Date(message.sentAt) >= start,
    ).length;
}

function sendCapacity(state: Workspace): number {
  return Math.max(0, state.settings.dailySendLimit - sentToday(state));
}

function replyStatus(category: ReplyCategory, text: string): LeadStatus {
  if (category === "opt_out") return "opted_out";
  if (category === "not_interested") return "not_interested";
  if (category === "interested") return "interested";
  if (
    category === "collaboration" &&
    /confirmed|lock it|i am in|i'm in|let's do it|sounds good|send the brief/i.test(text)
  ) {
    return "collaboration_confirmed";
  }
  if (category === "collaboration") return "interested";
  return "replied";
}

function latestInbound(thread: Thread): Message | undefined {
  return [...thread.messages].reverse().find((message) => message.direction === "inbound");
}

async function ingestReply(
  state: Workspace,
  lead: Lead,
  thread: Thread,
  body: string,
  receivedAt: string,
  extras: { gmailMessageId?: string; gmailThreadId?: string; subject?: string } = {},
): Promise<{ thread: Thread; analysis: Awaited<ReturnType<typeof analyzeReply>>; draft?: Message }> {
  const inbound: Message = {
    id: uid("msg"),
    leadId: lead.id,
    threadId: thread.id,
    direction: "inbound",
    kind: "reply",
    status: "received",
    subject: extras.subject ?? `Re: ${thread.subject}`,
    body,
    createdAt: receivedAt,
    ai: false,
  };
  if (extras.gmailMessageId) {
    inbound.gmailId = extras.gmailMessageId;
    inbound.gmailThreadId = extras.gmailThreadId;
    if (extras.gmailThreadId) thread.gmailThreadId = extras.gmailThreadId;
  }
  thread.messages.push(inbound);
  thread.updatedAt = receivedAt;

  const analysis = await analyzeReply(body, lead, state.brand);
  thread.category = analysis.category;
  thread.confidence = analysis.confidence;
  thread.replySummary = analysis.summary;
  thread.suggestedAction = analysis.suggestedAction;
  thread.handled = false;

  lead.status = replyStatus(analysis.category, body);
  lead.repliedAt = receivedAt;
  lead.nextFollowUpAt = undefined;
  lead.updatedAt = nowIso();

  activity(
    state,
    "reply",
    `${lead.name} replied: ${analysis.category.replace(/_/g, " ")}`,
    `${analysis.summary} ${analysis.suggestedAction}`,
    lead.id,
  );

  let draft: Message | undefined;
  const existingDraft = thread.messages.find(
    (message) =>
      message.direction === "outbound" && message.kind === "reply" && message.status === "review",
  );
  if (existingDraft) {
    draft = existingDraft;
  } else {
    const composed = await composeReply(lead, state.brand, analysis, body);
    draft = {
      id: uid("msg"),
      leadId: lead.id,
      threadId: thread.id,
      direction: "outbound",
      kind: "reply",
      status: "review",
      subject: composed.subject,
      body: composed.body,
      createdAt: nowIso(),
      ai: true,
    };
    thread.messages.push(draft);
    activity(
      state,
      "email",
      `Reply draft ready for ${lead.name}`,
      "Waiting for human approval before sending.",
      lead.id,
    );
  }
  thread.updatedAt = nowIso();
  return { thread, analysis, draft };
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function toCandidate(value: unknown): Candidate {
  const input = (value ?? {}) as Record<string, unknown>;
  const name = asString(input.name);
  const username = asString(input.username)?.replace(/^@/, "");
  if (!name || !username) throw new Error("A creator needs a name and an Instagram username");
  return {
    name,
    username,
    niche: asString(input.niche) ?? "Slow living & home",
    followers: Math.max(0, asNumber(input.followers) ?? 0),
    email: asString(input.email) ?? null,
    location: asString(input.location) ?? "India",
    bio: asString(input.bio) ?? "Public creator profile.",
    website: asString(input.website),
    score: Math.max(0, Math.min(100, asNumber(input.score) ?? 70)),
    summary: asString(input.summary) ?? "",
    tier: "B",
    tags: asStringArray(input.tags),
  };
}

function applyBrandPatch(state: Workspace, patch: Record<string, unknown>): void {
  const brand = state.brand as unknown as Record<string, unknown>;
  for (const key of [
    "name",
    "tagline",
    "description",
    "website",
    "campaignName",
    "campaignGoal",
    "audience",
    "offer",
    "tone",
    "senderName",
    "senderRole",
    "senderEmail",
    "optOutLine",
    "signature",
  ]) {
    const value = asString(patch[key]);
    if (value !== undefined) brand[key] = value;
  }
  const niches = asStringArray(patch.niches);
  if (niches.length > 0) state.brand.niches = niches;
}

function applySettingsPatch(state: Workspace, patch: Record<string, unknown>): void {
  const next: WorkspaceSettings = { ...state.settings };
  const limit = asNumber(patch.dailySendLimit);
  if (limit !== undefined) next.dailySendLimit = Math.max(1, Math.min(50, Math.round(limit)));
  if (Array.isArray(patch.followUpDays) && patch.followUpDays.length === 2) {
    const first = asNumber(patch.followUpDays[0]);
    const second = asNumber(patch.followUpDays[1]);
    if (first !== undefined && second !== undefined) {
      next.followUpDays = [
        Math.max(1, Math.min(30, Math.round(first))),
        Math.max(1, Math.min(30, Math.round(second))),
      ];
    }
  }
  if (typeof patch.autoFollowUps === "boolean") next.autoFollowUps = patch.autoFollowUps;
  if (typeof patch.requireApproval === "boolean") next.requireApproval = patch.requireApproval;
  if (typeof patch.demoMode === "boolean") next.demoMode = patch.demoMode;
  const timezone = asString(patch.timezone);
  if (timezone) next.timezone = timezone;
  state.settings = next;
}

function threadHasReply(thread: Thread): boolean {
  return thread.messages.some((message) => message.direction === "inbound");
}

export interface ActionOutcome {
  state: Workspace;
  result: unknown;
}

export async function runAction(
  type: string,
  payload: Record<string, unknown> = {},
): Promise<ActionOutcome> {
  if (type === "discover.run") {
    const state = await readWorkspace();
    const filters: DiscoverFilters = {
      query: asString(payload.query),
      niche: asString(payload.niche),
      location: asString(payload.location),
      minFollowers: asNumber(payload.minFollowers),
      maxFollowers: asNumber(payload.maxFollowers),
      emailOnly: payload.emailOnly === true,
    };
    const candidates = filterCatalog(filters);
    const existing = new Set(state.leads.map((lead) => lead.username.toLowerCase()));
    return {
      state,
      result: {
        candidates,
        total: candidates.length,
        alreadyInPipeline: candidates.filter((candidate) =>
          existing.has(candidate.username.toLowerCase()),
        ).length,
      },
    };
  }

  if (type === "discover.screen") {
    const state = await readWorkspace();
    const screen = await screenCreator(toCandidate(payload.candidate), state.brand);
    return { state, result: screen };
  }

  if (type === "followups.preview") {
    const state = await readWorkspace();
    const now = Date.now();
    const due = state.leads
      .filter((lead) => {
        if (!lead.email || lead.status === "opted_out" || lead.nextFollowUpAt === undefined) return false;
        if (lead.followUpCount >= 2) return false;
        if (new Date(lead.nextFollowUpAt).getTime() > now) return false;
        const thread = threadForLead(state, lead.id);
        return !thread || !threadHasReply(thread);
      })
      .map((lead) => ({
        lead,
        step: (lead.followUpCount + 1) as 1 | 2,
        dueAt: lead.nextFollowUpAt,
      }));
    return { state, result: { due, autoFollowUps: state.settings.autoFollowUps } };
  }

  if (type === "data.reset") {
    const state = await resetWorkspace();
    return { state, result: { reset: true } };
  }

  if (type === "automation.tick") {
    const sync = await runAction("replies.sync", {});
    const follow = await runAction("followups.send", {});
    const state = await readWorkspace();
    const syncResult = (sync.result ?? {}) as { imported?: number; drafts?: number; note?: string };
    const followResult = (follow.result ?? {}) as { sent?: number; skipped?: number; note?: string };
    const result: AutomationResult = {
      followUpsSent: followResult.sent ?? 0,
      repliesFound: syncResult.imported ?? 0,
      draftsCreated: syncResult.drafts ?? 0,
      skipped: followResult.skipped ?? 0,
      notes: [
        syncResult.note ?? "Gmail reply check completed.",
        followResult.note ?? "Follow-up check completed.",
      ],
    };
    return { state, result };
  }

  const outcome = await mutateWorkspace(async (state): Promise<ActionOutcome> => {
    switch (type) {
      case "leads.add": {
        const candidates = Array.isArray(payload.candidates)
          ? payload.candidates.map(toCandidate)
          : [toCandidate(payload.candidate ?? payload)];
        const added: Lead[] = [];
        const skipped: string[] = [];
        for (const candidate of candidates) {
          const duplicate = state.leads.find(
            (lead) =>
              lead.username.toLowerCase() === candidate.username.toLowerCase() ||
              (!!candidate.email &&
                !!lead.email &&
                lead.email.toLowerCase() === candidate.email.toLowerCase()),
          );
          if (duplicate) {
            skipped.push(`@${candidate.username}`);
            continue;
          }
          const screen = candidate.summary
            ? {
                score: candidate.score,
                tier: candidate.score >= 85 ? "A" : candidate.score >= 72 ? "B" : "C",
                summary: candidate.summary,
                tags: candidate.tags,
              }
            : localScreen(candidate, state.brand);
          const lead: Lead = {
            id: uid("lead"),
            name: candidate.name,
            username: candidate.username,
            profileUrl: `https://instagram.com/${candidate.username}`,
            niche: candidate.niche,
            followers: candidate.followers,
            email: candidate.email,
            location: candidate.location,
            bio: candidate.bio,
            website: candidate.website,
            score: screen.score,
            summary: screen.summary,
            tier: screen.tier as "A" | "B" | "C",
            status: candidate.email ? "email_available" : "new",
            tags: screen.tags,
            source: "demo_catalog",
            addedAt: nowIso(),
            updatedAt: nowIso(),
            followUpCount: 0,
            notes: candidate.email
              ? "Public business email on file."
              : "No public business email. Do not scrape or infer private contact details.",
            avatarTone: state.leads.length % 6,
          };
          state.leads.unshift(lead);
          added.push(lead);
          activity(
            state,
            "lead",
            `${lead.name} added to the pipeline`,
            `AI fit score ${lead.score}/100. ${lead.email ? "Public business email on file." : "No public email found."}`,
            lead.id,
          );
        }
        return { state, result: { added, skipped } };
      }

      case "leads.rescore": {
        const lead = getLead(state, String(payload.leadId));
        const screen = await screenCreator(lead, state.brand);
        lead.score = screen.score;
        lead.tier = screen.tier;
        lead.summary = screen.summary;
        lead.tags = Array.from(new Set([...lead.tags, ...screen.tags])).slice(0, 8);
        lead.updatedAt = nowIso();
        activity(state, "lead", `${lead.name} re-scored`, `New fit score: ${screen.score}/100.`, lead.id);
        return { state, result: screen };
      }

      case "leads.update": {
        const lead = getLead(state, String(payload.leadId));
        const fields = (payload.fields ?? {}) as Record<string, unknown>;
        const name = asString(fields.name);
        const email = asString(fields.email);
        const niche = asString(fields.niche);
        const location = asString(fields.location);
        const notes = asString(fields.notes);
        const followers = asNumber(fields.followers);
        const status = asString(fields.status) as LeadStatus | undefined;
        if (name) lead.name = name;
        if (email !== undefined) lead.email = email.includes("@") ? email : null;
        if (niche) lead.niche = niche;
        if (location) lead.location = location;
        if (notes !== undefined) lead.notes = notes;
        if (followers !== undefined) lead.followers = Math.max(0, Math.round(followers));
        if (status) {
          lead.status = status;
          if (status === "opted_out" || status === "not_interested") {
            lead.nextFollowUpAt = undefined;
          }
          if (status === "opted_out") {
            activity(state, "status", `${lead.name} opted out`, "Contact suppressed. Follow-ups stopped.", lead.id);
          } else {
            activity(state, "status", `${lead.name} moved to ${status.replace(/_/g, " ")}`, "Status updated manually.", lead.id);
          }
        }
        if (lead.email && lead.status === "new") lead.status = "email_available";
        if (!lead.email && lead.status === "email_available") lead.status = "new";
        lead.updatedAt = nowIso();
        return { state, result: lead };
      }

      case "outreach.draft": {
        const leadIds = asStringArray(payload.leadIds);
        const created: Message[] = [];
        const skipped: string[] = [];
        for (const leadId of leadIds) {
          const lead = state.leads.find((item) => item.id === leadId);
          if (!lead || !lead.email || lead.status === "opted_out") {
            skipped.push(leadId);
            continue;
          }
          const existing = threadForLead(state, lead.id);
          if (
            existing?.messages.some(
              (message) =>
                message.direction === "outbound" &&
                (message.status === "sent" || message.status === "review" || message.status === "approved"),
            )
          ) {
            skipped.push(lead.name);
            continue;
          }
          const composed = await composeOutreach(lead, state.brand);
          const thread = ensureThread(state, lead, composed.subject);
          const draft: Message = {
            id: uid("msg"),
            leadId: lead.id,
            threadId: thread.id,
            direction: "outbound",
            kind: "initial",
            status: "review",
            subject: composed.subject,
            body: composed.body,
            createdAt: nowIso(),
            ai: true,
          };
          thread.messages.push(draft);
          thread.updatedAt = nowIso();
          if (lead.status === "new") lead.status = "email_available";
          lead.updatedAt = nowIso();
          created.push(draft);
          activity(
            state,
            "email",
            `Draft ready for ${lead.name}`,
            `Personalised ${state.brand.campaignName} email is waiting for approval.`,
            lead.id,
          );
        }
        return { state, result: { created, skipped } };
      }

      case "outreach.updateDraft": {
        const message = state.threads
          .flatMap((thread) => thread.messages)
          .find((item) => item.id === String(payload.messageId));
        if (!message) throw new Error("Draft not found");
        if (message.status === "sent") throw new Error("This email has already been sent");
        const subject = asString(payload.subject);
        const body = asString(payload.body);
        if (subject) message.subject = subject;
        if (body) message.body = body;
        if (message.status === "approved") message.status = "review";
        const thread = getThread(state, message.threadId);
        thread.updatedAt = nowIso();
        return { state, result: message };
      }

      case "outreach.approve": {
        const ids = asStringArray(payload.messageIds);
        const approved: string[] = [];
        for (const id of ids) {
          const message = state.threads
            .flatMap((thread) => thread.messages)
            .find((item) => item.id === id);
          if (!message || message.direction !== "outbound" || message.status === "sent") continue;
          message.status = "approved";
          message.approvedAt = nowIso();
          approved.push(id);
        }
        return { state, result: { approved } };
      }

      case "outreach.skip": {
        const message = state.threads
          .flatMap((thread) => thread.messages)
          .find((item) => item.id === String(payload.messageId));
        if (!message) throw new Error("Draft not found");
        message.status = "skipped";
        const lead = getLead(state, message.leadId);
        activity(state, "email", `Draft skipped for ${lead.name}`, "No email was sent.", lead.id);
        return { state, result: message };
      }

      case "outreach.send":
      case "outreach.approveSend": {
        const ids = asStringArray(payload.messageIds);
        if (type === "outreach.approveSend" && ids.length === 1) {
          const message = state.threads
            .flatMap((thread) => thread.messages)
            .find((item) => item.id === ids[0]);
          if (message && message.status !== "sent") {
            message.status = "approved";
            message.approvedAt = nowIso();
          }
        }
        const candidates = state.threads
          .flatMap((thread) => thread.messages.map((message) => ({ thread, message })))
          .filter(
            ({ message }) =>
              message.direction === "outbound" &&
              message.kind === "initial" &&
              message.status === "approved" &&
              (ids.length === 0 || ids.includes(message.id)),
          );
        const capacity = sendCapacity(state);
        const toSend = candidates.slice(0, capacity);
        const errors: string[] = [];
        let sent = 0;
        for (const { thread, message } of toSend) {
          const lead = state.leads.find((item) => item.id === message.leadId);
          if (!lead) continue;
          if (lead.status === "opted_out") {
            message.status = "skipped";
            continue;
          }
          try {
            await deliver(state, lead, thread, message);
            message.status = "sent";
            message.sentAt = nowIso();
            lead.status = "email_sent";
            lead.lastContactedAt = message.sentAt;
            lead.nextFollowUpAt = addDays(message.sentAt, state.settings.followUpDays[0]);
            lead.updatedAt = nowIso();
            sent += 1;
            activity(
              state,
              "email",
              `Initial email sent to ${lead.name}`,
              `${state.settings.demoMode ? "Demo outbox" : "Gmail"} · ${message.subject}`,
              lead.id,
            );
          } catch (error) {
            errors.push(error instanceof Error ? error.message : "Send failed");
          }
        }
        const note =
          capacity === 0
            ? "Daily sending limit reached. Approved emails will stay queued."
            : candidates.length > capacity
              ? `Daily limit: ${sent} sent, ${candidates.length - capacity} left queued.`
              : undefined;
        return { state, result: { sent, skipped: Math.max(0, candidates.length - sent), errors, note } };
      }

      case "replies.simulate": {
        const lead = getLead(state, String(payload.leadId));
        const body = asString(payload.body);
        if (!body) throw new Error("Reply text is required");
        const thread = ensureThread(state, lead, `Re: ${state.brand.campaignName}`);
        const ingested = await ingestReply(state, lead, thread, body, nowIso());
        return {
          state,
          result: {
            analysis: ingested.analysis,
            threadId: ingested.thread.id,
            draftId: ingested.draft?.id,
          },
        };
      }

      case "replies.classify": {
        const thread = getThread(state, String(payload.threadId));
        const inbound = latestInbound(thread);
        if (!inbound) throw new Error("No inbound reply to classify");
        const lead = getLead(state, thread.leadId);
        const analysis = await analyzeReply(inbound.body, lead, state.brand);
        thread.category = analysis.category;
        thread.confidence = analysis.confidence;
        thread.replySummary = analysis.summary;
        thread.suggestedAction = analysis.suggestedAction;
        thread.updatedAt = nowIso();
        lead.status = replyStatus(analysis.category, inbound.body);
        lead.nextFollowUpAt = undefined;
        return { state, result: analysis };
      }

      case "replies.draft": {
        const thread = getThread(state, String(payload.threadId));
        const lead = getLead(state, thread.leadId);
        const inbound = latestInbound(thread);
        if (!inbound) throw new Error("No inbound reply to answer");
        const analysis =
          thread.category !== undefined
            ? {
                category: thread.category,
                confidence: thread.confidence ?? 0.7,
                summary: thread.replySummary ?? "",
                suggestedAction: thread.suggestedAction ?? "",
              }
            : await analyzeReply(inbound.body, lead, state.brand);
        for (const message of thread.messages) {
          if (
            message.direction === "outbound" &&
            message.kind === "reply" &&
            message.status === "review"
          ) {
            message.status = "skipped";
          }
        }
        const composed = await composeReply(lead, state.brand, analysis, inbound.body);
        const draft: Message = {
          id: uid("msg"),
          leadId: lead.id,
          threadId: thread.id,
          direction: "outbound",
          kind: "reply",
          status: "review",
          subject: composed.subject,
          body: composed.body,
          createdAt: nowIso(),
          ai: true,
        };
        thread.messages.push(draft);
        thread.category = analysis.category;
        thread.confidence = analysis.confidence;
        thread.replySummary = analysis.summary;
        thread.suggestedAction = analysis.suggestedAction;
        thread.handled = false;
        thread.updatedAt = nowIso();
        activity(state, "email", `Reply draft regenerated for ${lead.name}`, "Waiting for approval.", lead.id);
        return { state, result: draft };
      }

      case "replies.approveSend": {
        const message = state.threads
          .flatMap((thread) => thread.messages)
          .find((item) => item.id === String(payload.messageId));
        if (!message) throw new Error("Reply draft not found");
        if (message.status === "sent") return { state, result: message };
        const thread = getThread(state, message.threadId);
        const lead = getLead(state, message.leadId);
        const subject = asString(payload.subject);
        const body = asString(payload.body);
        if (subject) message.subject = subject;
        if (body) message.body = body;
        message.status = "approved";
        message.approvedAt = nowIso();
        await deliver(state, lead, thread, message);
        message.status = "sent";
        message.sentAt = nowIso();
        thread.handled = true;
        thread.updatedAt = nowIso();
        const inbound = latestInbound(thread);
        const category =
          thread.category ?? (inbound ? (await analyzeReply(inbound.body, lead, state.brand)).category : "other");
        lead.status = replyStatus(category, inbound?.body ?? "");
        lead.nextFollowUpAt = undefined;
        lead.updatedAt = nowIso();
        activity(
          state,
          "email",
          `Reply sent to ${lead.name}`,
          `${state.settings.demoMode ? "Demo outbox" : "Gmail"} · ${message.subject}`,
          lead.id,
        );
        return { state, result: message };
      }

      case "replies.sync": {
        if (!gmailConfig().configured) {
          return {
            state,
            result: {
              imported: 0,
              drafts: 0,
              note: "Gmail is not connected, so the demo reply queue is unchanged.",
            },
          };
        }
        const knownEmails = state.leads
          .map((lead) => lead.email)
          .filter((email): email is string => Boolean(email));
        const incoming = await fetchGmailReplies(knownEmails);
        let imported = 0;
        let drafts = 0;
        for (const email of incoming) {
          const duplicate = state.threads.some((thread) =>
            thread.messages.some((message) => message.gmailId === email.gmailMessageId),
          );
          if (duplicate) continue;
          const lead = state.leads.find(
            (item) => item.email?.toLowerCase() === email.fromEmail.toLowerCase(),
          );
          if (!lead) continue;
          const thread = ensureThread(
            state,
            lead,
            email.subject,
            email.gmailThreadId,
          );
          const ingest = await ingestReply(state, lead, thread, email.body, email.receivedAt, {
            gmailMessageId: email.gmailMessageId,
            gmailThreadId: email.gmailThreadId,
            subject: email.subject,
          });
          if (ingest.draft) drafts += 1;
          imported += 1;
          await markGmailRead(email.gmailMessageId);
        }
        return {
          state,
          result: {
            imported,
            drafts,
            note:
              imported === 0
                ? "Gmail checked. No new replies from tracked creators."
                : `Imported ${imported} Gmail ${imported === 1 ? "reply" : "replies"}.`,
          },
        };
      }

      case "followups.send": {
        if (!state.settings.autoFollowUps) {
          const due = state.leads.filter(
            (lead) =>
              lead.nextFollowUpAt &&
              new Date(lead.nextFollowUpAt).getTime() <= Date.now() &&
              lead.followUpCount < 2 &&
              lead.status !== "opted_out",
          );
          for (const lead of due) {
            if (lead.status === "email_sent") lead.status = "follow_up_due";
          }
          return {
            state,
            result: {
              sent: 0,
              skipped: due.length,
              note: "Automatic follow-ups are paused. Due follow-ups were marked for a manual review.",
            },
          };
        }
        const now = Date.now();
        const due = state.leads.filter((lead) => {
          if (!lead.email || lead.status === "opted_out" || !lead.nextFollowUpAt) return false;
          if (lead.followUpCount >= 2) return false;
          if (new Date(lead.nextFollowUpAt).getTime() > now) return false;
          const thread = threadForLead(state, lead.id);
          return !thread || !threadHasReply(thread);
        });
        let capacity = sendCapacity(state);
        let sent = 0;
        const skipped: string[] = [];
        for (const lead of due) {
          if (capacity <= 0) {
            skipped.push(lead.name);
            continue;
          }
          const thread = threadForLead(state, lead.id);
          if (!thread) {
            skipped.push(lead.name);
            continue;
          }
          if (threadHasReply(thread)) {
            lead.nextFollowUpAt = undefined;
            skipped.push(lead.name);
            continue;
          }
          const step = (lead.followUpCount + 1) as 1 | 2;
          const composed = await composeFollowUp(lead, state.brand, step);
          const message: Message = {
            id: uid("msg"),
            leadId: lead.id,
            threadId: thread.id,
            direction: "outbound",
            kind: step === 1 ? "follow_up_1" : "follow_up_2",
            status: "sent",
            subject: composed.subject,
            body: composed.body,
            createdAt: nowIso(),
            ai: true,
          };
          try {
            await deliver(state, lead, thread, message);
          } catch (error) {
            skipped.push(lead.name);
            if (error instanceof Error) console.error(error.message);
            continue;
          }
          message.sentAt = nowIso();
          thread.messages.push(message);
          thread.updatedAt = message.sentAt;
          lead.followUpCount = step;
          lead.lastContactedAt = message.sentAt;
          lead.nextFollowUpAt =
            step === 1 ? addDays(message.sentAt, state.settings.followUpDays[1]) : undefined;
          lead.status = "email_sent";
          lead.updatedAt = nowIso();
          sent += 1;
          capacity -= 1;
          activity(
            state,
            "email",
            `Follow-up ${step} sent to ${lead.name}`,
            `${state.settings.demoMode ? "Demo outbox" : "Gmail"} · No reply received.`,
            lead.id,
          );
        }
        return {
          state,
          result: {
            sent,
            skipped: skipped.length,
            note:
              due.length === 0
                ? "No follow-ups are due right now."
                : `Follow-up check complete: ${sent} sent, ${skipped.length} skipped.`,
          },
        };
      }

      case "settings.update": {
        if (payload.brand && typeof payload.brand === "object") {
          applyBrandPatch(state, payload.brand as Record<string, unknown>);
        }
        if (payload.settings && typeof payload.settings === "object") {
          applySettingsPatch(state, payload.settings as Record<string, unknown>);
        }
        activity(state, "system", "Workspace settings updated", "Brand or outreach preferences changed.");
        return { state, result: { brand: state.brand, settings: state.settings } };
      }

      case "settings.resetBrand": {
        const seeded = createSeedWorkspace();
        state.brand = seeded.brand;
        state.settings = seeded.settings;
        return { state, result: { brand: state.brand, settings: state.settings } };
      }

      default:
        throw new Error(`Unknown action: ${type}`);
    }
  });

  return outcome;
}

export function engineMode(): string {
  return aiEngine();
}
