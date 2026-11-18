export type LeadStatus =
  | "new"
  | "email_available"
  | "email_sent"
  | "follow_up_due"
  | "replied"
  | "interested"
  | "not_interested"
  | "collaboration_confirmed"
  | "opted_out";

export type LeadTier = "A" | "B" | "C";

export type ReplyCategory =
  | "interested"
  | "pricing"
  | "collaboration"
  | "not_interested"
  | "opt_out"
  | "question"
  | "other";

export type MessageKind = "initial" | "follow_up_1" | "follow_up_2" | "reply";
export type MessageStatus = "review" | "approved" | "sent" | "received" | "skipped";
export type MessageDirection = "outbound" | "inbound";
export type MessageProvider = "demo" | "gmail";

export interface Lead {
  id: string;
  name: string;
  username: string;
  profileUrl: string;
  niche: string;
  followers: number;
  email: string | null;
  location: string;
  bio: string;
  website?: string;
  score: number;
  summary: string;
  tier: LeadTier;
  status: LeadStatus;
  tags: string[];
  source: "demo_catalog" | "manual" | "import";
  addedAt: string;
  updatedAt: string;
  lastContactedAt?: string;
  nextFollowUpAt?: string;
  followUpCount: number;
  repliedAt?: string;
  notes: string;
  avatarTone: number;
}

export interface Message {
  id: string;
  leadId: string;
  threadId: string;
  direction: MessageDirection;
  kind: MessageKind;
  status: MessageStatus;
  subject: string;
  body: string;
  createdAt: string;
  approvedAt?: string;
  sentAt?: string;
  gmailId?: string;
  gmailThreadId?: string;
  provider?: MessageProvider;
  ai: boolean;
}

export interface Thread {
  id: string;
  leadId: string;
  subject: string;
  messages: Message[];
  category?: ReplyCategory;
  confidence?: number;
  replySummary?: string;
  suggestedAction?: string;
  gmailThreadId?: string;
  handled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandProfile {
  name: string;
  tagline: string;
  description: string;
  website: string;
  campaignName: string;
  campaignGoal: string;
  audience: string;
  offer: string;
  niches: string[];
  tone: string;
  senderName: string;
  senderRole: string;
  senderEmail: string;
  optOutLine: string;
  signature: string;
}

export interface WorkspaceSettings {
  dailySendLimit: number;
  followUpDays: [number, number];
  autoFollowUps: boolean;
  requireApproval: boolean;
  demoMode: boolean;
  timezone: string;
}

export interface Activity {
  id: string;
  type: "lead" | "email" | "reply" | "status" | "system";
  title: string;
  detail: string;
  at: string;
  leadId?: string;
}

export interface Workspace {
  version: 1;
  brand: BrandProfile;
  settings: WorkspaceSettings;
  leads: Lead[];
  threads: Thread[];
  activities: Activity[];
  createdAt: string;
  updatedAt: string;
}

export interface Candidate {
  name: string;
  username: string;
  niche: string;
  followers: number;
  email: string | null;
  location: string;
  bio: string;
  website?: string;
  score: number;
  summary: string;
  tier: LeadTier;
  tags: string[];
}

export interface DiscoverFilters {
  query?: string;
  niche?: string;
  location?: string;
  minFollowers?: number;
  maxFollowers?: number;
  emailOnly?: boolean;
}

export interface AutomationResult {
  followUpsSent: number;
  repliesFound: number;
  draftsCreated: number;
  skipped: number;
  notes: string[];
}

export interface ActionResult {
  state: Workspace;
  result?: unknown;
}
