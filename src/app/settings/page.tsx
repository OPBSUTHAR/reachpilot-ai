"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Database,
  Download,
  Gauge,
  KeyRound,
  Mail,
  RefreshCw,
  RotateCcw,
  Save,
  Sparkles,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { NICHES } from "@/lib/constants";
import type { BrandProfile, WorkspaceSettings } from "@/lib/types";
import { cx } from "@/lib/utils";
import {
  Badge,
  Button,
  buttonClass,
  Card,
  CopyButton,
  Field,
  Input,
  Modal,
  PageHeader,
  SectionHeading,
  Select,
  Textarea,
  Toggle,
} from "@/components/ui";
import { useWorkspaceReady } from "@/components/workspace-provider";

const TIMEZONES = ["Asia/Kolkata", "Asia/Dubai", "Europe/London", "America/New_York", "Asia/Singapore"];

export default function SettingsPage() {
  const { state, meta, act, pending, notify } = useWorkspaceReady();
  const [brand, setBrand] = useState<BrandProfile>(state.brand);
  const [settings, setSettings] = useState<WorkspaceSettings>(state.settings);
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => setBrand(state.brand), [state.brand]);
  useEffect(() => setSettings(state.settings), [state.settings]);

  const saveBrand = async () => {
    if (!brand.name.trim() || !brand.senderEmail.trim()) {
      notify("A brand name and sender email are required.", "error");
      return;
    }
    await act("settings.update", { brand });
  };

  const saveSettings = async () => {
    await act("settings.update", {
      settings: {
        ...settings,
        dailySendLimit: Math.max(1, Math.min(100, Number(settings.dailySendLimit) || 20)),
        followUpDays: [
          Math.max(1, Number(settings.followUpDays[0]) || 4),
          Math.max(1, Number(settings.followUpDays[1]) || 6),
        ],
      },
    });
  };

  const resetDemo = async () => {
    await act("data.reset");
    setResetOpen(false);
  };

  const toggleNiche = (niche: string) => {
    setBrand((current) => ({
      ...current,
      niches: current.niches.includes(niche)
        ? current.niches.filter((item) => item !== niche)
        : [...current.niches, niche],
    }));
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Studio settings"
        title="Make the studio sound like you."
        description="The brand brief shapes every screen, score and draft. Change it here once; the whole loop follows."
        actions={
          <Badge tone="sage" className="!px-3 !py-2">
            <CheckCircle2 className="size-3" />
            Human approval stays on
          </Badge>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <SectionHeading
              title="Brand & campaign brief"
              description="Used by the AI screening, first email and reply drafts."
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Brand name">
                <Input value={brand.name} onChange={(event) => setBrand({ ...brand, name: event.target.value })} />
              </Field>
              <Field label="Campaign name">
                <Input
                  value={brand.campaignName}
                  onChange={(event) => setBrand({ ...brand, campaignName: event.target.value })}
                />
              </Field>
              <Field label="Tagline" className="sm:col-span-2">
                <Input value={brand.tagline} onChange={(event) => setBrand({ ...brand, tagline: event.target.value })} />
              </Field>
              <Field label="Website">
                <Input value={brand.website} onChange={(event) => setBrand({ ...brand, website: event.target.value })} />
              </Field>
              <Field label="Tone" className="sm:col-span-2">
                <Input value={brand.tone} onChange={(event) => setBrand({ ...brand, tone: event.target.value })} />
              </Field>
              <Field label="Who you are" className="sm:col-span-2">
                <Textarea
                  rows={3}
                  value={brand.description}
                  onChange={(event) => setBrand({ ...brand, description: event.target.value })}
                />
              </Field>
              <Field label="Campaign goal" className="sm:col-span-2">
                <Textarea
                  rows={3}
                  value={brand.campaignGoal}
                  onChange={(event) => setBrand({ ...brand, campaignGoal: event.target.value })}
                />
              </Field>
              <Field label="Audience">
                <Textarea
                  rows={3}
                  value={brand.audience}
                  onChange={(event) => setBrand({ ...brand, audience: event.target.value })}
                />
              </Field>
              <Field label="The offer">
                <Textarea
                  rows={3}
                  value={brand.offer}
                  onChange={(event) => setBrand({ ...brand, offer: event.target.value })}
                />
              </Field>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-[12px] font-medium text-ink-soft">Niche focus</p>
              <div className="flex flex-wrap gap-1.5">
                {NICHES.map((niche) => {
                  const active = brand.niches.includes(niche);
                  return (
                    <button
                      key={niche}
                      type="button"
                      onClick={() => toggleNiche(niche)}
                      className={cx(
                        "chip border transition-colors",
                        active
                          ? "border-sage-deep bg-sage-deep text-cream"
                          : "border-line bg-cream text-muted hover:border-sage hover:text-ink",
                      )}
                    >
                      {niche}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <Button onClick={() => void saveBrand()} loading={pending === "settings.update"}>
                <Save className="size-3.5" />
                Save brand brief
              </Button>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionHeading
              title="Sender identity"
              description="Every email is signed by a real person and includes a clear opt-out."
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Sender name">
                <Input
                  value={brand.senderName}
                  onChange={(event) => setBrand({ ...brand, senderName: event.target.value })}
                />
              </Field>
              <Field label="Sender role">
                <Input
                  value={brand.senderRole}
                  onChange={(event) => setBrand({ ...brand, senderRole: event.target.value })}
                />
              </Field>
              <Field label="Sender email" className="sm:col-span-2">
                <Input
                  type="email"
                  value={brand.senderEmail}
                  onChange={(event) => setBrand({ ...brand, senderEmail: event.target.value })}
                />
              </Field>
              <Field label="Signature" className="sm:col-span-2">
                <Textarea
                  rows={4}
                  value={brand.signature}
                  onChange={(event) => setBrand({ ...brand, signature: event.target.value })}
                />
              </Field>
              <Field
                label="Opt-out line"
                className="sm:col-span-2"
                hint="Kept in every email. Reply-based opt-outs immediately suppress the contact."
              >
                <Textarea
                  rows={2}
                  value={brand.optOutLine}
                  onChange={(event) => setBrand({ ...brand, optOutLine: event.target.value })}
                />
              </Field>
            </div>
            <div className="mt-5 flex justify-end">
              <Button onClick={() => void saveBrand()} loading={pending === "settings.update"}>
                <Save className="size-3.5" />
                Save sender details
              </Button>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionHeading
              title="Sending rhythm"
              description="Slow enough to stay thoughtful, with a hard daily ceiling and two follow-ups."
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Field label="Daily send limit" hint="First emails and follow-ups share this ceiling.">
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={settings.dailySendLimit}
                  onChange={(event) =>
                    setSettings({ ...settings, dailySendLimit: Number(event.target.value) })
                  }
                />
              </Field>
              <Field label="First follow-up (days)">
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={settings.followUpDays[0]}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      followUpDays: [Number(event.target.value), settings.followUpDays[1]],
                    })
                  }
                />
              </Field>
              <Field label="Second follow-up (days)">
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={settings.followUpDays[1]}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      followUpDays: [settings.followUpDays[0], Number(event.target.value)],
                    })
                  }
                />
              </Field>
              <Field label="Timezone" className="sm:col-span-3">
                <Select
                  value={settings.timezone}
                  onChange={(event) => setSettings({ ...settings, timezone: event.target.value })}
                >
                  {TIMEZONES.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="mt-4 divide-y divide-line-soft">
              <Toggle
                checked={settings.autoFollowUps}
                onChange={(value) => setSettings({ ...settings, autoFollowUps: value })}
                label="Automatic follow-ups"
                description="When on, due follow-ups are sent by the daily check within the limit. When paused, due creators are only marked for review."
              />
              <Toggle
                checked={settings.requireApproval}
                onChange={() => notify("Human approval is locked on for this assignment.", "info")}
                label="Human approval before first send and replies"
                description="Locked on. This is the safety promise of the studio: AI drafts, a person decides."
                disabled
              />
              <Toggle
                checked={settings.demoMode}
                onChange={(value) => setSettings({ ...settings, demoMode: value })}
                label="Demo outbox"
                description="When on, no email leaves the workspace. Turning it off only sends if Gmail is configured — test .example recipients always stay in the demo outbox."
              />
            </div>

            <div className="mt-4 flex justify-end">
              <Button onClick={() => void saveSettings()} loading={pending === "settings.update"}>
                <Save className="size-3.5" />
                Save rhythm
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <SectionHeading title="Connections" description="Everything optional except the workspace itself." />
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-line p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-sage-deep" />
                    <p className="text-[12px] font-medium text-ink">AI writer</p>
                  </div>
                  <Badge tone={meta.engine === "Claude" ? "sage" : "clay"}>{meta.engine}</Badge>
                </div>
                <p className="mt-1.5 text-[10.5px] leading-5 text-muted">
                  {meta.engine === "Claude"
                    ? "Claude is screening creators and writing drafts."
                    : "The guided local model keeps the demo fully working. Add an Anthropic or AI Gateway key for live Claude."}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <code className="rounded bg-paper-deep px-1.5 py-0.5 text-[9px] text-ink-soft">ANTHROPIC_API_KEY</code>
                  <span className="text-[9px] text-muted">or</span>
                  <code className="rounded bg-paper-deep px-1.5 py-0.5 text-[9px] text-ink-soft">AI_GATEWAY_API_KEY</code>
                </div>
              </div>

              <div className="rounded-xl border border-line p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-sage-deep" />
                    <p className="text-[12px] font-medium text-ink">Gmail</p>
                  </div>
                  <Badge tone={meta.email.mode === "gmail" ? "sage" : "neutral"}>
                    {meta.email.mode === "gmail" ? "Connected" : "Demo outbox"}
                  </Badge>
                </div>
                <p className="mt-1.5 text-[10.5px] leading-5 text-muted">
                  {meta.email.mode === "gmail"
                    ? `Sending as ${meta.email.sender ?? "your Gmail sender"}. Test recipients remain simulated.`
                    : "Add Gmail OAuth credentials to send from a real account. Until then every message lands in the private demo outbox."}
                </p>
                {meta.email.missing.length > 0 ? (
                  <p className="mt-2 text-[9.5px] leading-4 text-[#9a7455]">
                    Missing: {meta.email.missing.join(", ")}
                  </p>
                ) : null}
                <Link
                  href="/guide#gmail"
                  className="mt-2 inline-flex items-center gap-1 text-[10.5px] text-sage-deep underline decoration-sage/40 underline-offset-2"
                >
                  Gmail setup notes <ArrowUpRight className="size-3" />
                </Link>
              </div>

              <div className="rounded-xl border border-line p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Database className="size-4 text-sage-deep" />
                    <p className="text-[12px] font-medium text-ink">Workspace storage</p>
                  </div>
                  <Badge tone="sage">
                    {meta.storage === "blob" ? "Vercel Blob" : meta.storage === "file" ? "Local file" : "In memory"}
                  </Badge>
                </div>
                <p className="mt-1.5 text-[10.5px] leading-5 text-muted">
                  {meta.storage === "blob"
                    ? "Saved to a private Vercel Blob store, shared by the deployed app."
                    : meta.storage === "file"
                      ? "Saved locally in .data/workspace.json for development."
                      : "Temporary memory only. Connect Vercel Blob for durable production state."}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeading
              title="Brand preview"
              description="The footer that appears in every first email."
            />
            <div className="mt-4 rounded-xl border border-line bg-white/60 p-4">
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Signature</p>
              <p className="mt-1 whitespace-pre-line text-[11.5px] leading-5 text-ink-soft">
                {brand.signature || "—"}
              </p>
              <div className="mt-3 border-t border-line-soft pt-2.5">
                <p className="text-[10.5px] leading-5 text-muted">{brand.optOutLine}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeading title="Automation & export" description="Bring your own runner or n8n." />
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
                <div className="flex items-center gap-2 text-[11px] text-ink-soft">
                  <Timer className="size-3.5 text-sage-deep" /> Daily check endpoint
                </div>
                <CopyButton value="/api/cron/tick" label="Copy" />
              </div>
              <p className="px-1 text-[10px] leading-4 text-muted">
                GET or POST with <code className="text-[9.5px]">Authorization: Bearer &lt;CRON_SECRET&gt;</code>.
                Runs reply sync, then follow-ups. A companion n8n export lives in the repository.
              </p>
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {[
                  ["Leads", "leads"],
                  ["Outreach", "outreach"],
                  ["Replies", "replies"],
                ].map(([label, type]) => (
                  <a
                    key={type}
                    href={`/api/export?type=${type}`}
                    download
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-line bg-cream px-2 py-2 text-[10px] text-ink-soft transition-colors hover:bg-sage-soft"
                  >
                    <Download className="size-3" /> {label}
                  </a>
                ))}
              </div>
              <Link href="/guide" className={buttonClass("soft", "sm", "mt-1 w-full")}>
                Open the walkthrough
              </Link>
            </div>
          </Card>

          <div className="rounded-2xl border border-[#ecd9d3] bg-[#faf0ec] p-4">
            <div className="flex items-center gap-2 text-[11px] font-medium text-[#9a5c4a]">
              <AlertTriangle className="size-3.5" /> Demo data
            </div>
            <p className="mt-1.5 text-[10.5px] leading-5 text-[#8a6a5d]">
              Resetting restores the original fictional creators, drafts and conversations. Export anything you
              want to keep first.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3 border-[#e6cfc7] bg-white/60 text-[#9a5c4a] hover:bg-white"
              onClick={() => setResetOpen(true)}
            >
              <RotateCcw className="size-3.5" />
              Reset demo workspace
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: KeyRound, title: "No secrets in code", detail: "Keys live in Vercel env vars, never in the repository." },
          { icon: Gauge, title: "Quiet by design", detail: "Daily limits, plain text and one follow-up at a time." },
          { icon: RefreshCw, title: "Recoverable", detail: "Export CSVs and reset to the seeded demo at any time." },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-xl border border-line bg-cream/50 p-4">
              <Icon className="size-4 text-sage-deep" />
              <p className="mt-2 text-[11.5px] font-medium text-ink">{item.title}</p>
              <p className="mt-0.5 text-[10.5px] leading-5 text-muted">{item.detail}</p>
            </div>
          );
        })}
      </div>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Restore the demo workspace?"
        description="This replaces all creators, messages and activity with the original seed."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              Keep my changes
            </Button>
            <Button
              variant="secondary"
              className="border-[#e6cfc7] bg-[#faf0ec] text-[#9a5c4a]"
              onClick={() => void resetDemo()}
              loading={pending === "data.reset"}
            >
              <RotateCcw className="size-3.5" />
              Reset workspace
            </Button>
          </>
        }
      >
        <p className="text-[12.5px] leading-6 text-muted">
          Any creators you added, drafts you edited and replies you simulated will be removed. The seeded campaign,
          creators and conversations return exactly as they were.
        </p>
      </Modal>
    </div>
  );
}
