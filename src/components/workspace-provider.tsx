"use client";

import { AlertCircle, CheckCircle2, Loader2, RefreshCw, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Workspace } from "@/lib/types";

export interface WorkspaceMeta {
  engine: string;
  email: {
    configured: boolean;
    sender: string | null;
    missing: string[];
    mode: "gmail" | "demo";
  };
  storage: "blob" | "file" | "memory";
  demoMode: boolean;
  now: string;
}

interface Toast {
  kind: "success" | "error" | "info";
  message: string;
}

interface WorkspaceContextValue {
  state: Workspace | null;
  meta: WorkspaceMeta | null;
  loading: boolean;
  error: string | null;
  pending: string | null;
  act: <T = unknown>(
    type: string,
    payload?: Record<string, unknown>,
    options?: { silent?: boolean },
  ) => Promise<T | undefined>;
  refresh: () => Promise<void>;
  notify: (message: string, kind?: Toast["kind"]) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function successMessage(type: string, result: unknown): string {
  const data = (result ?? {}) as Record<string, unknown>;
  if (type === "leads.add") {
    const added = Array.isArray(data.added) ? data.added.length : 0;
    return added > 0
      ? `${added} creator${added === 1 ? "" : "s"} added to the pipeline.`
      : "Those creators are already in the pipeline.";
  }
  if (type === "outreach.draft") {
    const created = Array.isArray(data.created) ? data.created.length : 0;
    return `${created} draft${created === 1 ? "" : "s"} ready for review.`;
  }
  if (type === "outreach.approve") return "Draft approved. It is ready to send.";
  if (type === "outreach.send" || type === "outreach.approveSend") {
    const sent = Number(data.sent ?? 0);
    const note = typeof data.note === "string" ? data.note : "";
    return note || `${sent} email${sent === 1 ? "" : "s"} sent through the demo outbox.`;
  }
  if (type === "replies.simulate") return "Test reply added, classified and drafted.";
  if (type === "replies.draft") return "A fresh reply draft is ready for review.";
  if (type === "replies.approveSend") return "Reply approved and sent.";
  if (type === "replies.sync") return "Gmail checked for new replies.";
  if (type === "followups.send") {
    const sent = Number(data.sent ?? 0);
    const note = typeof data.note === "string" ? data.note : "";
    return note || `Follow-up check complete. ${sent} sent.`;
  }
  if (type === "settings.update" || type === "settings.resetBrand") return "Workspace settings saved.";
  if (type === "data.reset") return "Demo workspace restored.";
  if (type === "automation.tick") {
    const notes = Array.isArray(data.notes) ? data.notes.join(" ") : "";
    return notes || "Automation check complete.";
  }
  if (type === "leads.update") return "Creator record updated.";
  if (type === "leads.rescore") return "AI fit score refreshed.";
  if (type === "outreach.skip") return "Draft skipped. No email was sent.";
  return "Done.";
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Workspace | null>(null);
  const [meta, setMeta] = useState<WorkspaceMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const notify = useCallback((message: string, kind: Toast["kind"] = "success") => {
    setToast({ message, kind });
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/workspace", { cache: "no-store" });
      const data = (await response.json()) as {
        state?: Workspace;
        meta?: WorkspaceMeta;
        error?: string;
      };
      if (!response.ok || !data.state) throw new Error(data.error || "Could not open the workspace");
      setState(data.state);
      setMeta(data.meta ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not open the workspace");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const act = useCallback(
    async <T = unknown,>(
      type: string,
      payload: Record<string, unknown> = {},
      options: { silent?: boolean } = {},
    ) => {
      setPending(type);
      try {
        const response = await fetch("/api/actions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ type, payload }),
          cache: "no-store",
        });
        const data = (await response.json()) as {
          state?: Workspace;
          result?: unknown;
          error?: string;
        };
        if (!response.ok || !data.state) {
          throw new Error(data.error || "The action could not be completed");
        }
        setState(data.state);
        setMeta((current) =>
          current ? { ...current, demoMode: data.state!.settings.demoMode } : current,
        );
        if (!options.silent) notify(successMessage(type, data.result), "success");
        return data.result as T;
      } catch (caught) {
        if (!options.silent) {
          notify(caught instanceof Error ? caught.message : "The action could not be completed", "error");
        }
        throw caught;
      } finally {
        setPending(null);
      }
    },
    [notify],
  );

  const value = useMemo(
    () => ({ state, meta, loading, error, pending, act, refresh, notify }),
    [state, meta, loading, error, pending, act, refresh, notify],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
      {toast ? (
        <div className="fixed inset-x-4 bottom-5 z-[80] flex justify-center sm:inset-x-auto sm:right-6 sm:justify-end">
          <div
            role="status"
            className="fade-up flex max-w-md items-start gap-3 rounded-2xl border border-line bg-cream px-4 py-3 text-sm text-ink shadow-[0_18px_50px_-24px_rgba(32,42,36,0.45)]"
          >
            {toast.kind === "error" ? (
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-500" />
            ) : toast.kind === "info" ? (
              <RefreshCw className="mt-0.5 size-4 shrink-0 text-sage-deep" />
            ) : (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sage-deep" />
            )}
            <p className="leading-5">{toast.message}</p>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-2 rounded-full p-0.5 text-muted hover:bg-ink/5 hover:text-ink"
              aria-label="Dismiss notification"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      ) : null}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return context;
}

export function useWorkspaceReady(): WorkspaceContextValue & {
  state: Workspace;
  meta: WorkspaceMeta;
} {
  const context = useWorkspace();
  if (!context.state || !context.meta) {
    throw new Error("The workspace is still loading");
  }
  return context as WorkspaceContextValue & { state: Workspace; meta: WorkspaceMeta };
}

export function QuietLoader({ label = "Opening the studio" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-muted">
        <Loader2 className="size-4 animate-spin text-sage-deep" />
        {label}
      </div>
    </div>
  );
}
