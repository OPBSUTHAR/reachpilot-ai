"use client";

import {
  ArrowUpDown,
  ChevronRight,
  Download,
  Mail,
  Search,
  Send,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { NICHES } from "@/lib/constants";
import type { LeadStatus } from "@/lib/types";
import { cx, dueLabel, formatNumber, timeAgo } from "@/lib/utils";
import { LeadDetailModal } from "@/components/lead-detail";
import {
  Avatar,
  Button,
  buttonClass,
  Card,
  EmptyState,
  Input,
  PageHeader,
  ScoreBadge,
  Select,
  StatusPill,
  Tabs,
} from "@/components/ui";
import { useWorkspaceReady } from "@/components/workspace-provider";

const GROUPS: Array<{ id: string; label: string; statuses: LeadStatus[] | null }> = [
  { id: "all", label: "Everyone", statuses: null },
  { id: "new", label: "New", statuses: ["new"] },
  { id: "ready", label: "Email ready", statuses: ["email_available"] },
  { id: "contacted", label: "Contacted", statuses: ["email_sent", "follow_up_due"] },
  { id: "replies", label: "Replies", statuses: ["replied", "interested"] },
  { id: "won", label: "Confirmed", statuses: ["collaboration_confirmed"] },
  { id: "closed", label: "Closed", statuses: ["not_interested", "opted_out"] },
];

export default function PipelinePage() {
  const { state, act, pending } = useWorkspaceReady();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [niche, setNiche] = useState("");
  const [sort, setSort] = useState("fit");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);

  const selectedGroup = GROUPS.find((item) => item.id === group) ?? GROUPS[0];

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of GROUPS) {
      map[item.id] = item.statuses
        ? state.leads.filter((lead) => item.statuses!.includes(lead.status)).length
        : state.leads.length;
    }
    return map;
  }, [state.leads]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = state.leads.filter((lead) => {
      if (selectedGroup.statuses && !selectedGroup.statuses.includes(lead.status)) return false;
      if (niche && lead.niche !== niche) return false;
      if (!needle) return true;
      return [lead.name, lead.username, lead.niche, lead.location, lead.email ?? "", ...lead.tags]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
    return [...list].sort((a, b) => {
      if (sort === "followers") return b.followers - a.followers;
      if (sort === "recent") return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      if (sort === "followup") {
        const aTime = a.nextFollowUpAt ? new Date(a.nextFollowUpAt).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.nextFollowUpAt ? new Date(b.nextFollowUpAt).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      }
      return b.score - a.score;
    });
  }, [state.leads, selectedGroup, niche, query, sort]);

  const draftable = filtered.filter((lead) => selected.has(lead.id) && lead.email);
  const publicEmails = state.leads.filter((lead) => lead.email).length;
  const due = state.leads.filter(
    (lead) => lead.status === "follow_up_due" || lead.nextFollowUpAt,
  ).length;
  const openReplies = state.threads.filter((thread) => !thread.handled).length;

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const draftSelected = async () => {
    if (draftable.length === 0) return;
    await act("outreach.draft", { leadIds: draftable.map((lead) => lead.id) });
    setSelected(new Set());
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Step three · Pipeline"
        title="A pipeline you can read in one breath."
        description="Every creator, status and next step in one quiet place. Duplicate profiles are blocked by username and public email."
        actions={
          <>
            <a href="/api/export?type=leads" className={buttonClass("secondary")} download>
              <Download className="size-3.5" />
              Export CSV
            </a>
            <Link href="/discover" className={buttonClass("primary")}>
              <UserPlus className="size-3.5" />
              Find creators
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Creators", String(state.leads.length), "in this workspace"],
          ["Public emails", `${publicEmails}`, `${Math.round((publicEmails / Math.max(state.leads.length, 1)) * 100)}% coverage`],
          ["Follow-ups", String(due), "scheduled or due"],
          ["Open threads", String(openReplies), "with a creator"],
        ].map(([label, value, note]) => (
          <div key={label} className="rounded-xl border border-line bg-cream/60 px-4 py-3">
            <p className="text-[10.5px] text-muted">{label}</p>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="font-display text-[1.55rem] leading-none text-ink">{value}</p>
              <p className="text-[10px] text-[#9aa197]">{note}</p>
            </div>
          </div>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="space-y-3 border-b border-line p-4 sm:p-5">
          <div className="min-w-0">
            <Tabs
              items={GROUPS.map((item) => ({ id: item.id, label: item.label, count: counts[item.id] }))}
              value={group}
              onChange={setGroup}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search name, place, tag…"
                  className="!py-2 !pl-9 sm:w-56"
                  aria-label="Search pipeline"
                />
              </div>
              <Select
                value={niche}
                onChange={(event) => setNiche(event.target.value)}
                className="!py-2 sm:w-44"
                aria-label="Filter by niche"
              >
                <option value="">All niches</option>
                {NICHES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
              <Select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="!py-2 sm:w-40"
                aria-label="Sort creators"
              >
                <option value="fit">Best fit</option>
                <option value="followers">Most followers</option>
                <option value="recent">Recently added</option>
                <option value="followup">Follow-up soon</option>
              </Select>
            </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
            <p>
              Showing <span className="text-ink">{filtered.length}</span> of {state.leads.length} creators
              {niche ? ` in ${niche}` : ""}.
            </p>
            {query || niche || group !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setNiche("");
                  setGroup("all");
                }}
                className="inline-flex items-center gap-1 text-muted underline decoration-line underline-offset-2 hover:text-ink"
              >
                <X className="size-3" /> Clear view
              </button>
            ) : null}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<Users className="size-6" />}
              title="No creators in this view"
              description="Try another status, niche or search term. New creators joined from Discover will appear here instantly."
              action={
                <Link href="/discover" className={buttonClass("secondary", "sm")}>
                  Find creators
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-paper/50 text-[10px] uppercase tracking-[0.12em] text-muted">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label="Select all visible creators"
                        checked={filtered.length > 0 && filtered.every((lead) => selected.has(lead.id))}
                        onChange={(event) =>
                          setSelected(
                            event.target.checked ? new Set(filtered.map((lead) => lead.id)) : new Set(),
                          )
                        }
                        className="size-3.5 accent-[#3f5b48]"
                      />
                    </th>
                    <th className="px-3 py-3 font-medium">Creator</th>
                    <th className="px-3 py-3 font-medium">Niche</th>
                    <th className="px-3 py-3 font-medium">Reach</th>
                    <th className="px-3 py-3 font-medium">Fit</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Next step</th>
                    <th className="px-3 py-3 text-right font-medium">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead) => (
                    <tr
                      key={lead.id}
                      className={cx(
                        "group border-b border-line-soft text-[12px] transition-colors last:border-0 hover:bg-sage-soft/25",
                        selected.has(lead.id) && "bg-sage-soft/35",
                      )}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Select ${lead.name}`}
                          checked={selected.has(lead.id)}
                          onChange={() => toggle(lead.id)}
                          className="size-3.5 accent-[#3f5b48]"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => setOpenLeadId(lead.id)}
                          className="flex items-center gap-2.5 text-left"
                        >
                          <Avatar name={lead.name} tone={lead.avatarTone} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-ink">{lead.name}</span>
                            <span className="block truncate text-[10.5px] text-muted">@{lead.username}</span>
                          </span>
                        </button>
                      </td>
                      <td className="max-w-[170px] px-3 py-3">
                        <span className="block truncate text-[11px] text-ink-soft">{lead.niche}</span>
                        <span className="block truncate text-[10px] text-muted">{lead.location}</span>
                      </td>
                      <td className="px-3 py-3 tabular-nums text-ink-soft">{formatNumber(lead.followers)}</td>
                      <td className="px-3 py-3">
                        <ScoreBadge score={lead.score} />
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill status={lead.status} short />
                      </td>
                      <td className="px-3 py-3">
                        <span className="block text-[10.5px] text-ink-soft">
                          {lead.nextFollowUpAt ? dueLabel(lead.nextFollowUpAt) : "—"}
                        </span>
                        <span className="block text-[9.5px] text-muted">
                          {lead.lastContactedAt ? `touched ${timeAgo(lead.lastContactedAt)}` : "not contacted"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {lead.email ? (
                            <button
                              type="button"
                              title="Draft a personalised email"
                              onClick={() => void act("outreach.draft", { leadIds: [lead.id] })}
                              disabled={pending !== null}
                              className="rounded-full p-1.5 text-muted transition-colors hover:bg-cream hover:text-sage-deep disabled:opacity-50"
                            >
                              <Mail className="size-3.5" />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setOpenLeadId(lead.id)}
                            className="rounded-full p-1.5 text-muted transition-colors hover:bg-cream hover:text-ink"
                            aria-label={`Open ${lead.name}`}
                          >
                            <ChevronRight className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-line-soft md:hidden">
              {filtered.map((lead) => (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => setOpenLeadId(lead.id)}
                  className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-sage-soft/20"
                >
                  <Avatar name={lead.name} tone={lead.avatarTone} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-ink">{lead.name}</p>
                        <p className="truncate text-[10.5px] text-muted">
                          @{lead.username} · {lead.niche}
                        </p>
                      </div>
                      <ScoreBadge score={lead.score} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusPill status={lead.status} short />
                      <span className="text-[10.5px] text-muted">{formatNumber(lead.followers)}</span>
                      {lead.nextFollowUpAt ? (
                        <span className="text-[10.5px] text-[#9a7455]">{dueLabel(lead.nextFollowUpAt)}</span>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted">
        <p className="inline-flex items-center gap-1.5">
          <ArrowUpDown className="size-3.5" /> Sorted by{" "}
          {sort === "fit" ? "AI fit" : sort === "followers" ? "audience size" : sort === "recent" ? "newest" : "follow-up date"}.
        </p>
        <p>Click a creator to see the AI rationale, notes and full conversation.</p>
      </div>

      {selected.size > 0 ? (
        <div className="fade-up sticky bottom-4 z-20 mx-auto flex w-full max-w-xl items-center justify-between gap-3 rounded-2xl border border-line bg-cream/95 px-4 py-3 shadow-[0_18px_50px_-20px_rgba(32,42,36,0.4)] backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-sage-deep text-[10px] text-cream">
              {selected.size}
            </span>
            <p className="text-[12px] text-ink-soft">
              selected · {draftable.length} with email
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => void draftSelected()}
              disabled={draftable.length === 0}
              loading={pending === "outreach.draft"}
            >
              <Send className="size-3.5" />
              Draft emails
            </Button>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-line bg-cream/50 px-4 py-3 text-[11px] leading-5 text-muted">
        <span className="font-medium text-ink-soft">A note on duplicates:</span> ReachPilot checks both the
        Instagram username and public email before adding a creator. Opted-out contacts stay suppressed.
      </div>

      <LeadDetailModal leadId={openLeadId} onClose={() => setOpenLeadId(null)} />
    </div>
  );
}
