"use client";

import { Check, Copy, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { STATUS_META } from "@/lib/constants";
import type { LeadStatus } from "@/lib/types";
import { cx, initials } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "soft" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cx(
    "btn",
    `btn-${variant}`,
    size === "sm" && "!px-3 !py-2 text-[12px]",
    size === "lg" && "!px-5 !py-3 text-[14px]",
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function Card({
  className,
  children,
  as: Tag = "div",
  id,
}: {
  className?: string;
  children: React.ReactNode;
  as?: "div" | "section" | "article" | "aside";
  id?: string;
}) {
  return (
    <Tag id={id} className={cx("paper-card", className)}>
      {children}
    </Tag>
  );
}

export function SectionHeading({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-wrap items-start justify-between gap-3", className)}>
      <div>
        <h2 className="font-display text-[1.45rem] leading-tight text-ink">{title}</h2>
        {description ? <p className="mt-1 max-w-2xl text-[13px] leading-6 text-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="fade-up flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="font-display mt-2 text-[2.2rem] leading-[1.05] text-ink sm:text-[2.8rem]">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-[13.5px] leading-6 text-muted">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function StatusPill({ status, short = false }: { status: LeadStatus; short?: boolean }) {
  const meta = STATUS_META[status];
  return (
    <span className={cx("chip border", meta.tone)}>
      <span className={cx("size-1.5 rounded-full", meta.dot)} />
      {short ? meta.short : meta.label}
    </span>
  );
}

const AVATAR_TONES = [
  "from-[#e7eee3] to-[#d5e0ce] text-[#3f5b48]",
  "from-[#f3e7dd] to-[#e9d5c4] text-[#8a5c3f]",
  "from-[#e5ecef] to-[#d3dfe5] text-[#45616e]",
  "from-[#eee9df] to-[#e3dac9] text-[#6d6046]",
  "from-[#ece5e8] to-[#ded3d8] text-[#6f4c59]",
  "from-[#e9ece2] to-[#dbe1ce] text-[#576244]",
];

export function Avatar({
  name,
  tone = 0,
  size = "md",
}: {
  name: string;
  tone?: number;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  return (
    <span
      aria-hidden
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-medium ring-1 ring-white/50",
        AVATAR_TONES[Math.abs(tone) % AVATAR_TONES.length],
        size === "xs" && "size-7 text-[10px]",
        size === "sm" && "size-9 text-[11px]",
        size === "md" && "size-10 text-xs",
        size === "lg" && "size-12 text-sm",
      )}
    >
      {initials(name)}
    </span>
  );
}

export function ScoreBadge({ score, size = "sm" }: { score: number; size?: "sm" | "md" }) {
  const tone =
    score >= 85
      ? "border-[#bfd2b9] bg-sage-soft text-sage-deep"
      : score >= 72
        ? "border-[#eadbc8] bg-clay-soft text-[#8a5c3f]"
        : "border-line bg-paper-deep text-muted";
  return (
    <span
      className={cx(
        "inline-flex items-center justify-center rounded-full border font-medium tabular-nums",
        tone,
        size === "sm" ? "size-9 text-[11px]" : "size-11 text-[12px]",
      )}
      title={`AI fit score ${score}/100`}
    >
      {score}
    </span>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "sage" | "clay" | "rose" | "sky" | "ink";
  className?: string;
}) {
  const tones = {
    neutral: "border-line bg-paper-deep text-muted",
    sage: "border-[#cbdcc6] bg-sage-soft text-sage-deep",
    clay: "border-[#eadbc8] bg-clay-soft text-[#8a5c3f]",
    rose: "border-rose-100 bg-rose-50 text-rose-600",
    sky: "border-sky-100 bg-sky-50 text-sky-700",
    ink: "border-ink bg-ink text-cream",
  };
  return <span className={cx("chip", tones[tone], className)}>{children}</span>;
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 block text-[12px] font-medium text-ink-soft">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] leading-4 text-muted">{hint}</span> : null}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx("field", props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx("field", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx("field appearance-none", props.className)} />;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <p className="text-[13px] font-medium text-ink">{label}</p>
        {description ? <p className="mt-0.5 max-w-lg text-[12px] leading-5 text-muted">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors",
          checked ? "border-sage-deep bg-sage-deep" : "border-line bg-paper-deep",
          disabled && "opacity-50",
        )}
      >
        <span
          className={cx(
            "absolute top-0.5 size-[18px] rounded-full bg-white shadow-sm transition-all",
            checked ? "left-[22px]" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}

export function Tabs({
  items,
  value,
  onChange,
}: {
  items: Array<{ id: string; label: string; count?: number }>;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="scroll-thin flex gap-1 overflow-x-auto rounded-full border border-line bg-paper-deep/60 p-1">
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cx(
              "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[12px] transition-colors",
              active ? "bg-cream text-ink shadow-sm" : "text-muted hover:text-ink",
            )}
          >
            {item.label}
            {typeof item.count === "number" ? (
              <span
                className={cx(
                  "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                  active ? "bg-sage-soft text-sage-deep" : "bg-ink/5 text-muted",
                )}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/25 p-0 backdrop-blur-[2px] sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          "fade-up relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-cream shadow-[0_30px_90px_-30px_rgba(32,42,36,0.5)] sm:rounded-3xl",
          size === "md" && "sm:max-w-lg",
          size === "lg" && "sm:max-w-2xl",
          size === "xl" && "sm:max-w-4xl",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-5 sm:px-6">
          <div>
            <h2 className="font-display text-[1.6rem] leading-tight text-ink">{title}</h2>
            {description ? (
              <p className="mt-1 max-w-xl text-[12.5px] leading-5 text-muted">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted transition-colors hover:bg-ink/5 hover:text-ink"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-paper/60 px-5 py-4 sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-paper/40 px-6 py-12 text-center">
      {icon ? <div className="mb-3 text-sage-deep">{icon}</div> : null}
      <p className="font-display text-lg text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-[12.5px] leading-5 text-muted">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ProgressBar({
  value,
  tone = "sage",
  className,
}: {
  value: number;
  tone?: "sage" | "clay" | "ink";
  className?: string;
}) {
  const colors = { sage: "bg-sage", clay: "bg-clay", ink: "bg-sage-deep" };
  return (
    <div className={cx("h-1.5 w-full overflow-hidden rounded-full bg-paper-deep", className)}>
      <div
        className={cx("h-full rounded-full transition-all duration-500", colors[tone])}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : label}
    </Button>
  );
}
