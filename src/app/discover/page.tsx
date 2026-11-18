"use client";

import {
  ArrowRight,
  AtSign,
  Check,
  Filter,
  Mail,
  MapPin,
  Search,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NICHES } from "@/lib/constants";
import { LOCATIONS } from "@/lib/candidates";
import type { Candidate, LeadTier } from "@/lib/types";
import { cx, formatNumber } from "@/lib/utils";
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
  ScoreBadge,
  Select,
  Textarea,
  Toggle,
} from "@/components/ui";
import { useWorkspaceReady } from "@/components/workspace-provider";

interface DiscoverResult {
  candidates: Candidate[];
  total: number;
  alreadyInPipeline: number;
}

const EMPTY_FILTERS = {
  query: "",
  niche: "",
  location: "",
  minFollowers: "",
  maxFollowers: "",
  emailOnly: false,
};

export default function DiscoverPage() {
  const { state, meta, act, pending, notify } = useWorkspaceReady();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [results, setResults] = useState<Candidate[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [screening, setScreening] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState({
    name: "",
    username: "",
    niche: NICHES[0],
    followers: "",
    email: "",
    location: "",
    bio: "",
    website: "",
  });

  const runSearch = useCallback(
    async (next: typeof EMPTY_FILTERS, quiet = false) => {
      setLoading(true);
      setError(null);
      try {
        const data = await act<DiscoverResult>(
          "discover.run",
          {
            query: next.query || undefined,
            niche: next.niche || undefined,
            location: next.location || undefined,
            minFollowers: next.minFollowers ? Number(next.minFollowers) : undefined,
            maxFollowers: next.maxFollowers ? Number(next.maxFollowers) : undefined,
            emailOnly: next.emailOnly,
          },
          { silent: quiet },
        );
        if (data) {
          setResults(data.candidates);
          setTotal(data.total);
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Search failed");
      } finally {
        setLoading(false);
      }
    },
    [act],
  );

  useEffect(() => {
    void runSearch(EMPTY_FILTERS, true);
  }, [runSearch]);

  const inPipeline = useMemo(
    () => new Set(state.leads.map((lead) => lead.username.toLowerCase())),
    [state.leads],
  );

  const available = results.filter((candidate) => !inPipeline.has(candidate.username.toLowerCase()));
  const allSelected = available.length > 0 && available.every((candidate) => selected.has(candidate.username));

  const toggle = (username: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });
  };

  const reset = () => {
    setFilters(EMPTY_FILTERS);
    setSelected(new Set());
    void runSearch(EMPTY_FILTERS);
  };

  const addSelected = async () => {
    const candidates = results.filter(
      (candidate) =>
        selected.has(candidate.username) && !inPipeline.has(candidate.username.toLowerCase()),
    );
    if (candidates.length === 0) return;
    await act("leads.add", { candidates });
    setSelected(new Set());
  };

  const addOne = async (candidate: Candidate) => {
    await act("leads.add", { candidate });
    setSelected((current) => {
      const next = new Set(current);
      next.delete(candidate.username);
      return next;
    });
  };

  const rescreen = async (candidate: Candidate) => {
    setScreening(candidate.username);
    try {
      const data = await act<{ score: number; tier: LeadTier; summary: string; tags: string[] }>(
        "discover.screen",
        { candidate },
        { silent: true },
      );
      if (data) {
        setResults((current) =>
          current.map((item) =>
            item.username === candidate.username
              ? { ...item, score: data.score, tier: data.tier, summary: data.summary, tags: data.tags }
              : item,
          ),
        );
        notify(`${candidate.name} re-screened with ${meta.engine}.`, "info");
      }
    } catch {
      notify("Could not refresh this score. Try again.", "error");
    } finally {
      setScreening(null);
    }
  };

  const addManual = async () => {
    if (!manual.name.trim() || !manual.username.trim()) return;
    const result = await act<{ added: unknown[] }>("leads.add", {
      candidate: {
        name: manual.name.trim(),
        username: manual.username.trim().replace(/^@/, ""),
        niche: manual.niche,
        followers: Number(manual.followers) || 0,
        email: manual.email.trim() || null,
        location: manual.location.trim() || "India",
        bio: manual.bio.trim() || "Public creator profile.",
        website: manual.website.trim() || undefined,
        score: 70,
        summary: "",
        tier: "B",
        tags: [],
      },
    });
    if (result?.added.length) {
      setManualOpen(false);
      setManual({
        name: "",
        username: "",
        niche: NICHES[0],
        followers: "",
        email: "",
        location: "",
        bio: "",
        website: "",
      });
    }
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Step one · Research"
        title="Find creators who already feel like you."
        description="Search a curated demo catalog by niche, place and audience size, or add a public profile from your own authorised research. Every record carries only publicly shared business details. No scraping, no private data."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="sage" className="!py-2 !px-3">
              <span className="size-1.5 rounded-full bg-sage" />
              Public data only
            </Badge>
            <Button variant="secondary" onClick={() => setManualOpen(true)}>
              <UserPlus className="size-3.5" />
              Add public profile
            </Button>
          </div>
        }
      />

      <Card className="p-4 sm:p-5">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void runSearch(filters);
          }}
          className="space-y-4"
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <Input
                value={filters.query}
                onChange={(event) => setFilters({ ...filters, query: event.target.value })}
                placeholder="Try “slow mornings”, “ceramics”, “Chennai”…"
                className="!pl-10"
                aria-label="Search creators"
              />
            </div>
            <Button type="submit" loading={loading} className="sm:w-auto">
              <Search className="size-3.5" />
              Search
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Niche">
              <Select
                value={filters.niche}
                onChange={(event) => setFilters({ ...filters, niche: event.target.value })}
              >
                <option value="">All niches</option>
                {NICHES.map((niche) => (
                  <option key={niche} value={niche}>
                    {niche}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Location">
              <Select
                value={filters.location}
                onChange={(event) => setFilters({ ...filters, location: event.target.value })}
              >
                <option value="">Anywhere in India</option>
                {LOCATIONS.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Min followers">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                step={1000}
                value={filters.minFollowers}
                onChange={(event) => setFilters({ ...filters, minFollowers: event.target.value })}
                placeholder="e.g. 20000"
              />
            </Field>
            <Field label="Max followers">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                step={1000}
                value={filters.maxFollowers}
                onChange={(event) => setFilters({ ...filters, maxFollowers: event.target.value })}
                placeholder="e.g. 150000"
              />
            </Field>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-3">
            <div className="flex items-center gap-3">
              <Filter className="size-3.5 text-muted" />
              <Toggle
                checked={filters.emailOnly}
                onChange={(value) => setFilters({ ...filters, emailOnly: value })}
                label="Public email only"
                description=""
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={reset}
                disabled={loading}
              >
                <X className="size-3.5" />
                Clear
              </Button>
              <Button type="submit" variant="secondary" size="sm" loading={loading}>
                Apply filters
              </Button>
            </div>
          </div>
        </form>
      </Card>

      <div className="grid gap-3 rounded-2xl border border-[#d9e3d5] bg-sage-soft/50 px-4 py-3 text-[11.5px] leading-5 text-sage-deep sm:grid-cols-[1fr_auto] sm:items-center">
        <p>
          <span className="font-medium">How this demo collects data:</span> a reviewed catalog of fictional
          creators. Replace it with your own reviewed CSV or an approved Instagram partner API before going live.
        </p>
        <span className="inline-flex items-center gap-1.5 text-[10.5px] font-medium">
          <AtSign className="size-3.5" /> No automated scraping
        </span>
      </div>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-[1.45rem] text-ink">
              {loading ? "Looking through the catalog…" : `${total} creator${total === 1 ? "" : "s"} found`}
            </h2>
            <p className="mt-1 text-[12px] text-muted">
              {loading
                ? "Matching public profiles to your campaign brief."
                : `${available.length} not yet in your pipeline. Ranked by AI fit for ${state.brand.campaignName}.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {available.length > 0 ? (
              <button
                type="button"
                onClick={() =>
                  setSelected(
                    allSelected
                      ? new Set()
                      : new Set(available.map((candidate) => candidate.username)),
                  )
                }
                className="text-[11px] text-muted underline decoration-line underline-offset-2 hover:text-ink"
              >
                {allSelected ? "Clear selection" : "Select all"}
              </button>
            ) : null}
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-[12px] text-rose-600">
            {error}
          </p>
        ) : null}

        {loading && results.length === 0 ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="paper-card h-[230px] animate-pulse bg-paper-deep/30" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={<Search className="size-6" />}
              title="No creators match that brief yet"
              description="Try a wider location, a different niche, or a broader follower range. The demo catalog is intentionally small."
              action={
                <Button variant="secondary" onClick={reset}>
                  Reset filters
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {results.map((candidate) => {
              const already = inPipeline.has(candidate.username.toLowerCase());
              const isSelected = selected.has(candidate.username);
              return (
                <Card
                  key={candidate.username}
                  className={cx(
                    "fade-up p-4 transition-colors sm:p-5",
                    isSelected && "border-[#b8cbb3] bg-[#f7faf4]",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => !already && toggle(candidate.username)}
                      disabled={already}
                      aria-label={already ? "Already in pipeline" : isSelected ? "Deselect creator" : "Select creator"}
                      className={cx(
                        "mt-1 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                        already
                          ? "border-line bg-paper-deep text-muted"
                          : isSelected
                            ? "border-sage-deep bg-sage-deep text-cream"
                            : "border-line bg-cream text-transparent hover:border-sage",
                      )}
                    >
                      <Check className="size-3" />
                    </button>
                    <Avatar name={candidate.name} tone={candidate.username.length} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[14px] font-medium text-ink">{candidate.name}</p>
                        {already ? <Badge tone="sage">In pipeline</Badge> : null}
                      </div>
                      <p className="text-[11px] text-muted">@{candidate.username}</p>
                      <p className="mt-1 text-[11.5px] text-sage-deep">{candidate.niche}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <ScoreBadge score={candidate.score} />
                      <span className="text-[9px] uppercase tracking-[0.12em] text-muted">fit</span>
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-2 text-[12px] leading-5 text-ink-soft">{candidate.bio}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5" />
                      {formatNumber(candidate.followers)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5" />
                      {candidate.location}
                    </span>
                    <span className={cx("inline-flex min-w-0 items-center gap-1.5", !candidate.email && "text-[#a68a72]")}>
                      <Mail className="size-3.5" />
                      <span className="truncate">{candidate.email ?? "No public email"}</span>
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {candidate.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-line-soft pt-3">
                    <button
                      type="button"
                      onClick={() => void rescreen(candidate)}
                      disabled={screening === candidate.username}
                      className="inline-flex items-center gap-1.5 text-[10.5px] text-muted transition-colors hover:text-ink disabled:opacity-50"
                    >
                      <Sparkles className={cx("size-3.5", screening === candidate.username && "animate-pulse")} />
                      {screening === candidate.username ? "Re-screening…" : `Re-screen with ${meta.engine}`}
                    </button>
                    {already ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-sage-deep">
                        <Check className="size-3.5" /> Added
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="soft"
                        onClick={() => void addOne(candidate)}
                        loading={pending === "leads.add"}
                      >
                        <UserPlus className="size-3.5" />
                        Add to pipeline
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {selected.size > 0 ? (
        <div className="fade-up sticky bottom-4 z-20 mx-auto flex w-full max-w-xl items-center justify-between gap-3 rounded-2xl border border-line bg-cream/95 px-4 py-3 shadow-[0_18px_50px_-20px_rgba(32,42,36,0.4)] backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-sage-deep text-[10px] text-cream">
              {selected.size}
            </span>
            <p className="text-[12px] text-ink-soft">creator{selected.size === 1 ? "" : "s"} selected</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
            <Button size="sm" onClick={() => void addSelected()} loading={pending === "leads.add"}>
              Add to pipeline <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>
      ) : null}

      <Modal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        title="Add a public profile"
        description="For creators you found through your own authorised research. Add only details the creator has published for business contact."
        footer={
          <>
            <Button variant="ghost" onClick={() => setManualOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void addManual()}
              loading={pending === "leads.add"}
              disabled={!manual.name.trim() || !manual.username.trim()}
            >
              <UserPlus className="size-3.5" />
              Add to pipeline
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Creator name *">
            <Input
              value={manual.name}
              onChange={(event) => setManual({ ...manual, name: event.target.value })}
              placeholder="e.g. Maya Pillai"
            />
          </Field>
          <Field label="Instagram username *" hint="Without the @. We build the public profile link from this.">
            <div className="relative">
              <AtSign className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
              <Input
                value={manual.username}
                onChange={(event) => setManual({ ...manual, username: event.target.value })}
                placeholder="mayapillai"
                className="!pl-8"
              />
            </div>
          </Field>
          <Field label="Niche">
            <Select
              value={manual.niche}
              onChange={(event) => setManual({ ...manual, niche: event.target.value })}
            >
              {NICHES.map((niche) => (
                <option key={niche} value={niche}>
                  {niche}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Followers">
            <Input
              type="number"
              min={0}
              step={1000}
              value={manual.followers}
              onChange={(event) => setManual({ ...manual, followers: event.target.value })}
              placeholder="e.g. 42000"
            />
          </Field>
          <Field label="Public business email" hint="Leave blank if the creator has not published one.">
            <Input
              type="email"
              value={manual.email}
              onChange={(event) => setManual({ ...manual, email: event.target.value })}
              placeholder="hello@example.com"
            />
          </Field>
          <Field label="Location">
            <Input
              value={manual.location}
              onChange={(event) => setManual({ ...manual, location: event.target.value })}
              placeholder="City, Country"
            />
          </Field>
          <Field label="Website or link in bio" className="sm:col-span-2">
            <Input
              value={manual.website}
              onChange={(event) => setManual({ ...manual, website: event.target.value })}
              placeholder="https://…"
            />
          </Field>
          <Field label="Public bio notes" className="sm:col-span-2">
            <Textarea
              rows={3}
              value={manual.bio}
              onChange={(event) => setManual({ ...manual, bio: event.target.value })}
              placeholder="What the creator publicly says about their work, audience or recent series."
            />
          </Field>
        </div>
        <div className="mt-4 rounded-xl border border-line bg-sage-soft/50 px-3.5 py-3 text-[11px] leading-5 text-sage-deep">
          ReachPilot stores only the public business details you enter. It does not log in to
          Instagram, scrape profiles or send DMs. Duplicate usernames and emails are blocked
          automatically.
        </div>
      </Modal>
    </div>
  );
}
