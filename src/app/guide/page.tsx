"use client";

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Code2,
  Database,
  Download,
  FileSpreadsheet,
  Lock,
  Mail,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { buttonClass, Card, PageHeader, SectionHeading } from "@/components/ui";

const STEPS = [
  {
    n: "01",
    title: "Research public profiles",
    icon: Search,
    href: "/discover",
    cta: "Open Discover",
    body: "Filter a reviewed catalog by keyword, niche, city and follower range. ReachPilot stores only what a creator already shares publicly: name, handle, profile link, niche, reach, location and a public business email.",
    note: "No Instagram login, no scraping, no private data.",
  },
  {
    n: "02",
    title: "Screen with AI",
    icon: Sparkles,
    href: "/discover",
    cta: "Re-screen a creator",
    body: "The campaign brief is sent with each profile to Claude (or the guided local model). The result is a 0–100 fit score, a tier, a few honest tags and a two-sentence rationale you can read.",
    note: "AI output is a suggestion, never an automatic approval.",
  },
  {
    n: "03",
    title: "Keep a clean CRM",
    icon: Database,
    href: "/pipeline",
    cta: "Open Pipeline",
    body: "New creators land in one pipeline with clear statuses: New lead, Email available, Email sent, Follow-up due, Replied, Interested, Not interested, Collaboration confirmed and Opted out. Username and public email prevent duplicates.",
    note: "Export the whole CRM as CSV at any time.",
  },
  {
    n: "04",
    title: "Draft with a human gate",
    icon: Mail,
    href: "/outreach",
    cta: "Open Outreach",
    body: "Claude writes a short, specific first email: an introduction, why this creator fits, the collaboration idea and a simple next step. It always includes the sender's identity and an opt-out line.",
    note: "Every first email waits for your approval before sending.",
  },
  {
    n: "05",
    title: "Follow up quietly",
    icon: Clock,
    href: "/outreach",
    cta: "See follow-ups",
    body: "Unanswered emails receive a gentle nudge after 4 days and a second after 6 more. The sequence stops immediately on any reply, decline or opt-out. A shared daily limit keeps volume human.",
    note: "Follow-ups can be automatic or paused for manual review.",
  },
  {
    n: "06",
    title: "Read, classify, reply",
    icon: MessageSquare,
    href: "/inbox",
    cta: "Open Inbox",
    body: "Incoming replies are classified as interested, pricing, collaboration, not interested, opt-out, question or needs-a-human. The AI writes a reply draft and suggests the next step; you approve the final words.",
    note: "Approving a reply updates the CRM status and closes the thread.",
  },
];

const LOOP = [
  "Instagram research",
  "Contact collection",
  "AI filtering",
  "CRM",
  "Gmail outreach",
  "Follow-ups",
  "Reply detection",
  "AI reply draft",
  "CRM update",
];

export default function GuidePage() {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Walkthrough"
        title="A small studio with a long memory."
        description="ReachPilot is the working system behind this assignment: research, screen, organise, write, follow up and read replies — with a person at every consequential step."
        actions={
          <>
            <a
              href="https://github.com/OPBSUTHAR/reachpilot-ai"
              target="_blank"
              rel="noreferrer"
              className={buttonClass("secondary")}
            >
              <Code2 className="size-3.5" />
              Source code
            </a>
            <Link href="/discover" className={buttonClass("primary")}>
              Start the demo <ArrowRight className="size-3.5" />
            </Link>
          </>
        }
      />

      <Card className="overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1.3fr_1fr]">
          <div className="bg-gradient-to-br from-[#eaf0e5] via-[#f4f3e9] to-[#f5e9de] p-6 sm:p-8">
            <p className="eyebrow">The whole loop</p>
            <h2 className="font-display mt-2 max-w-xl text-[2rem] leading-[1.1] text-ink">
              From a public profile to a confirmed collaboration — without the noise.
            </h2>
            <p className="mt-3 max-w-xl text-[12.5px] leading-6 text-ink-soft">
              This build is a complete, working demo. Fictional creators and a private outbox make it safe to run
              end-to-end today. The same adapters switch to Claude, Gmail and durable cloud storage with
              environment variables.
            </p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {LOOP.map((item, index) => (
                <span key={item} className="chip border-white/70 bg-white/60 text-[#4f5f52]">
                  <span className="text-[9px] text-[#8f9c8f]">{String(index + 1).padStart(2, "0")}</span>
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="border-t border-line bg-cream/70 p-6 lg:border-l lg:border-t-0">
            <p className="eyebrow">The 60-second demo</p>
            <ol className="mt-3 space-y-3">
              {[
                ["Find", "Discover → search “slow” → add two creators."],
                ["Screen", "Open Pipeline and read the AI rationale."],
                ["Draft", "Select creators → Draft emails."],
                ["Approve", "Outreach → read → Approve → Send approved."],
                ["Reply", "Inbox → Simulate a reply → classify → Approve & send."],
                ["Confirm", "Pipeline status moves on its own."],
              ].map(([title, detail], index) => (
                <li key={title} className="flex gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-line bg-cream text-[9px] tabular-nums text-muted">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[11.5px] font-medium text-ink">{title}</p>
                    <p className="text-[10.5px] leading-5 text-muted">{detail}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link href="/outreach" className={buttonClass("soft", "sm", "mt-4 w-full")}>
              Jump to Outreach
            </Link>
          </div>
        </div>
      </Card>

      <section>
        <SectionHeading
          title="The six steps"
          description="Each step has one job, one owner and a visible state. Click through to the live screen."
        />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.n} className="fade-up flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-display text-[1.5rem] leading-none text-[#c8c3b5]">{step.n}</span>
                  <span className="flex size-8 items-center justify-center rounded-full bg-sage-soft text-sage-deep">
                    <Icon className="size-4" strokeWidth={1.7} />
                  </span>
                </div>
                <h3 className="mt-3 text-[14px] font-medium text-ink">{step.title}</h3>
                <p className="mt-1.5 flex-1 text-[12px] leading-6 text-muted">{step.body}</p>
                <div className="mt-3 rounded-lg bg-paper/60 px-3 py-2 text-[10.5px] leading-4 text-[#7d867c]">
                  {step.note}
                </div>
                <Link
                  href={step.href}
                  className="mt-3 inline-flex items-center gap-1 text-[11px] text-sage-deep underline decoration-sage/40 underline-offset-2"
                >
                  {step.cta} <ArrowRight className="size-3" />
                </Link>
              </Card>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="p-5 sm:p-6">
          <SectionHeading
            title="Tools used, and why"
            description="Boring where it should be, intelligent where it helps."
          />
          <div className="mt-5 divide-y divide-line-soft">
            {[
              {
                icon: Code2,
                name: "Next.js 16 + React 19 + Tailwind 4",
                role: "The studio UI, server actions and API routes.",
                detail: "App Router, server-rendered workspace, TypeScript, calm custom design tokens.",
              },
              {
                icon: Sparkles,
                name: "Claude (Anthropic) — optional",
                role: "Screening, first emails, follow-ups and reply analysis.",
                detail: "ANTHROPIC_API_KEY or Vercel AI Gateway. A deterministic guided model keeps the demo usable without a key.",
              },
              {
                icon: Mail,
                name: "Gmail API — optional",
                role: "Sending and reading replies from a real inbox.",
                detail: "OAuth refresh token, plain-text MIME, List-Unsubscribe header. Test .example addresses always stay in the demo outbox.",
              },
              {
                icon: Database,
                name: "Built-in CRM + Vercel Blob",
                role: "The pipeline, messages, threads and activity log.",
                detail: "One private JSON workspace in Blob; local file in development. CSV export for leads, outreach and replies.",
              },
              {
                icon: Workflow,
                name: "n8n companion workflow",
                role: "Optional external scheduler for the daily check.",
                detail: "Calls /api/cron/tick with a bearer secret. Included as a workflow export in the repository.",
              },
            ].map((tool) => {
              const Icon = tool.icon;
              return (
                <div key={tool.name} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-cream text-sage-deep">
                    <Icon className="size-3.5" strokeWidth={1.7} />
                  </span>
                  <div>
                    <p className="text-[12px] font-medium text-ink">{tool.name}</p>
                    <p className="text-[11px] text-sage-deep">{tool.role}</p>
                    <p className="mt-0.5 text-[10.5px] leading-5 text-muted">{tool.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-5" >
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-sage-deep" />
              <p className="text-[12px] font-medium text-ink">Compliance, plainly</p>
            </div>
            <ul className="mt-3 space-y-2.5">
              {[
                "Public business contacts only. No private data, guessing or scraping.",
                "No Instagram login or automated actions on the platform.",
                "Plain-text Gmail, sender identity, and an opt-out line in every email.",
                "A daily limit shared by first emails and follow-ups.",
                "Opt-outs and declines stop all future outreach immediately.",
                "Human approval before first sends and before every AI reply.",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-[11px] leading-5 text-muted">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-sage" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5" >
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-sage-deep" />
              <p className="text-[12px] font-medium text-ink">What is simulated</p>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-muted">
              The creators, emails and conversations are fictional test data using reserved{" "}
              <code className="rounded bg-paper-deep px-1 text-[10px]">.example</code> addresses. Sends go to a
              private demo outbox. Nothing reaches a real person unless you connect a Gmail test account and turn
              off demo mode for a non-test address.
            </p>
          </Card>
        </div>
      </div>

      <Card id="gmail" className="scroll-mt-24 p-5 sm:p-6">
        <SectionHeading
          title="Connect Claude and Gmail"
          description="Both are optional. The studio works end-to-end without a single secret."
        />
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-line bg-paper/40 p-4">
            <p className="text-[11px] font-medium text-ink">1 · AI writer</p>
            <p className="mt-1 text-[11px] leading-5 text-muted">
              Add <code className="rounded bg-cream px-1 text-[10px]">ANTHROPIC_API_KEY</code> in Vercel (optionally{" "}
              <code className="rounded bg-cream px-1 text-[10px]">ANTHROPIC_MODEL</code>), or connect the Vercel AI
              Gateway with <code className="rounded bg-cream px-1 text-[10px]">AI_GATEWAY_API_KEY</code>. The
              sidebar footer shows which engine is active.
            </p>
            <p className="mt-2 text-[10.5px] leading-5 text-[#9a7455]">
              Without a key, the guided local model produces the same shape of score, email and reply draft.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-paper/40 p-4">
            <p className="text-[11px] font-medium text-ink">2 · Gmail</p>
            <ol className="mt-1 list-decimal space-y-1 pl-4 text-[11px] leading-5 text-muted">
              <li>Create a Google Cloud project and enable the Gmail API.</li>
              <li>Create an OAuth client and obtain a refresh token with send + read scopes.</li>
              <li>
                Set <code className="rounded bg-cream px-1 text-[10px]">GMAIL_CLIENT_ID</code>,{" "}
                <code className="rounded bg-cream px-1 text-[10px]">GMAIL_CLIENT_SECRET</code>,{" "}
                <code className="rounded bg-cream px-1 text-[10px]">GMAIL_REFRESH_TOKEN</code>,{" "}
                <code className="rounded bg-cream px-1 text-[10px]">GMAIL_SENDER_EMAIL</code>.
              </li>
              <li>Keep demo mode on for tests; test addresses never leave the outbox.</li>
            </ol>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-line bg-cream px-3 py-2">
            <p className="text-[9px] uppercase tracking-[0.1em] text-muted">AI engine</p>
            <p className="mt-0.5 text-[11px] text-ink">Optional · local fallback</p>
          </div>
          <div className="rounded-lg border border-line bg-cream px-3 py-2">
            <p className="text-[9px] uppercase tracking-[0.1em] text-muted">Gmail</p>
            <p className="mt-0.5 text-[11px] text-ink">Optional · demo outbox</p>
          </div>
          <div className="rounded-lg border border-line bg-cream px-3 py-2">
            <p className="text-[9px] uppercase tracking-[0.1em] text-muted">Storage</p>
            <p className="mt-0.5 text-[11px] text-ink">Blob in production</p>
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <SectionHeading
          title="Assignment deliverables"
          description="Everything an evaluator needs to reproduce and inspect the work."
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            {
              icon: CheckCircle2,
              title: "Working end-to-end demo",
              detail: "Deployed Next.js app with seeded test data and a private outbox.",
              href: "/",
              cta: "Open studio",
            },
            {
              icon: Code2,
              title: "Source code",
              detail: "Full repository, setup notes and environment template.",
              href: "https://github.com/OPBSUTHAR/reachpilot-ai",
              cta: "GitHub",
              external: true,
            },
            {
              icon: FileSpreadsheet,
              title: "Sample CRM sheet",
              detail: "Download the seeded creator records as CSV.",
              href: "/api/export?type=leads",
              cta: "Download CSV",
              external: true,
            },
            {
              icon: Mail,
              title: "Sample emails",
              detail: "Initial, follow-up and AI reply samples are visible in Outreach and Inbox.",
              href: "/outreach",
              cta: "View samples",
            },
            {
              icon: Workflow,
              title: "Workflow export",
              detail: "Companion n8n daily-check workflow in the repository.",
              href: "/n8n/reachpilot-daily.json",
              cta: "Download JSON",
              external: true,
            },
            {
              icon: BookOpen,
              title: "Explanation & video",
              detail: "This walkthrough covers the tools, flow and compliance notes.",
              href: "#top",
              cta: "Read again",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-xl border border-line bg-paper/40 p-4">
                <Icon className="size-4 text-sage-deep" />
                <p className="mt-2 text-[11.5px] font-medium text-ink">{item.title}</p>
                <p className="mt-0.5 text-[10.5px] leading-5 text-muted">{item.detail}</p>
                {item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-[10.5px] text-sage-deep underline decoration-sage/40 underline-offset-2"
                  >
                    {item.cta} <ArrowRight className="size-3" />
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    className="mt-2 inline-flex items-center gap-1 text-[10.5px] text-sage-deep underline decoration-sage/40 underline-offset-2"
                  >
                    {item.cta} <ArrowRight className="size-3" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-cream px-4 py-3">
          <Download className="size-3.5 text-sage-deep" />
          <p className="text-[10.5px] text-muted">
            The repository also includes a sample sheet, email pack, API notes and the n8n workflow.
          </p>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Why not scrape Instagram?", "It breaks the platform terms and creates fragile, privacy-heavy data. ReachPilot consumes reviewed public profiles or an approved partner API."],
          ["Why two follow-ups?", "One nudge is easy to miss; three starts to feel like pressure. Two gentle notes, then stop."],
          ["Where does the data live?", "A private Vercel Blob workspace in production, a local file in development. CSV stays one click away."],
        ].map(([question, answer]) => (
          <Card key={question} className="p-4">
            <p className="text-[11.5px] font-medium text-ink">{question}</p>
            <p className="mt-1 text-[10.5px] leading-5 text-muted">{answer}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
