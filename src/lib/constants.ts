import type { LeadStatus, ReplyCategory } from "./types";

export const STATUS_META: Record<
  LeadStatus,
  { label: string; short: string; tone: string; dot: string; order: number }
> = {
  new: {
    label: "New lead",
    short: "New",
    tone: "bg-stone-100 text-stone-600 border-stone-200",
    dot: "bg-stone-400",
    order: 1,
  },
  email_available: {
    label: "Email available",
    short: "Contact",
    tone: "bg-sky-50 text-sky-700 border-sky-100",
    dot: "bg-sky-400",
    order: 2,
  },
  email_sent: {
    label: "Email sent",
    short: "Sent",
    tone: "bg-amber-50 text-amber-700 border-amber-100",
    dot: "bg-amber-400",
    order: 3,
  },
  follow_up_due: {
    label: "Follow-up due",
    short: "Follow-up",
    tone: "bg-orange-50 text-orange-700 border-orange-100",
    dot: "bg-orange-400",
    order: 4,
  },
  replied: {
    label: "Replied",
    short: "Replied",
    tone: "bg-violet-50 text-violet-700 border-violet-100",
    dot: "bg-violet-400",
    order: 5,
  },
  interested: {
    label: "Interested",
    short: "Interested",
    tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dot: "bg-emerald-500",
    order: 6,
  },
  not_interested: {
    label: "Not interested",
    short: "Passed",
    tone: "bg-rose-50 text-rose-600 border-rose-100",
    dot: "bg-rose-400",
    order: 7,
  },
  collaboration_confirmed: {
    label: "Collaboration confirmed",
    short: "Confirmed",
    tone: "bg-teal-50 text-teal-700 border-teal-100",
    dot: "bg-teal-500",
    order: 8,
  },
  opted_out: {
    label: "Opted out",
    short: "Opted out",
    tone: "bg-slate-100 text-slate-500 border-slate-200",
    dot: "bg-slate-400",
    order: 9,
  },
};

export const PIPELINE_ORDER: LeadStatus[] = [
  "new",
  "email_available",
  "email_sent",
  "follow_up_due",
  "replied",
  "interested",
  "collaboration_confirmed",
];

export const REPLY_META: Record<
  ReplyCategory,
  { label: string; tone: string; advice: string }
> = {
  interested: {
    label: "Interested",
    tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
    advice: "Offer two collaboration options and propose a short call.",
  },
  pricing: {
    label: "Pricing enquiry",
    tone: "bg-amber-50 text-amber-700 border-amber-100",
    advice: "Share the rate card range and ask about deliverables.",
  },
  collaboration: {
    label: "Collaboration request",
    tone: "bg-teal-50 text-teal-700 border-teal-100",
    advice: "Clarify scope, timeline and approval rights.",
  },
  not_interested: {
    label: "Not interested",
    tone: "bg-rose-50 text-rose-600 border-rose-100",
    advice: "Thank them warmly, close the loop and stop follow-ups.",
  },
  opt_out: {
    label: "Opt-out",
    tone: "bg-slate-100 text-slate-600 border-slate-200",
    advice: "Confirm removal, suppress the contact and stop all outreach.",
  },
  question: {
    label: "Question",
    tone: "bg-sky-50 text-sky-700 border-sky-100",
    advice: "Answer the question directly and offer a simple next step.",
  },
  other: {
    label: "Needs a human read",
    tone: "bg-stone-100 text-stone-600 border-stone-200",
    advice: "Read the full reply and choose the next step manually.",
  },
};

export const NICHES = [
  "Slow living & home",
  "Everyday wellness",
  "Minimal home styling",
  "Conscious fashion",
  "Coffee & rituals",
  "Urban gardening",
  "Home office & productivity",
  "Food & hosting",
  "Mindful mornings",
  "Photography & lifestyle",
  "Plants & interiors",
  "Outdoor & travel",
  "DIY & crafts",
  "Sleep & recovery",
];

export const DEMO_BRAND_SUMMARY = "Sankar Living";
