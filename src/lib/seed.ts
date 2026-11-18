import type {
  Activity,
  BrandProfile,
  Lead,
  Message,
  MessageKind,
  MessageStatus,
  Thread,
  Workspace,
  WorkspaceSettings,
} from "./types";
import { relativeIso } from "./utils";

const brand: BrandProfile = {
  name: "Sankar Living",
  tagline: "Thoughtful essentials for slower mornings.",
  description:
    "Sankar Living is the home and wellness studio from Sankar Group. We make small-batch linen, ceramics and daily rituals for people who prefer a quieter kind of morning.",
  website: "https://sankarliving.example",
  campaignName: "The Slow Morning Edit",
  campaignGoal:
    "Partner with 25 home, wellness and slow-living creators for the autumn collection launch.",
  audience:
    "Indian creators in home, wellness and slow living, 15k–150k followers, with an engaged and thoughtful community.",
  offer:
    "Paid collaboration, a full product box, full creative freedom and a simple one-page brief.",
  niches: [
    "Slow living & home",
    "Everyday wellness",
    "Minimal home styling",
    "Conscious fashion",
    "Coffee & rituals",
    "Urban gardening",
    "Mindful mornings",
    "Plants & interiors",
    "Sleep & recovery",
  ],
  tone: "Warm, quiet and specific. Short paragraphs, no hype, one clear next step.",
  senderName: "Omprakash Suthar",
  senderRole: "Creator Partnerships",
  senderEmail: "hello@sankarliving.example",
  optOutLine:
    'Not the right fit? Reply "unsubscribe" and I will remove you from all future outreach.',
  signature: "Warmly,\nOmprakash Suthar\nCreator Partnerships, Sankar Living",
};

const settings: WorkspaceSettings = {
  dailySendLimit: 20,
  followUpDays: [4, 6],
  autoFollowUps: true,
  requireApproval: true,
  demoMode: true,
  timezone: "Asia/Kolkata",
};

type LeadSeed = Omit<Lead, "tier" | "profileUrl" | "tags"> & {
  tags?: string[];
  hook: string;
};

function leadSeed(input: LeadSeed): Lead {
  const tier = input.score >= 85 ? "A" : input.score >= 72 ? "B" : "C";
  return {
    ...input,
    tags: input.tags ?? [],
    profileUrl: `https://instagram.com/${input.username}`,
    tier,
  };
}

const leads: Lead[] = [
  leadSeed({
    id: "lead_ananya",
    name: "Ananya Rao",
    username: "ananya.slowmornings",
    niche: "Slow living & home",
    followers: 48200,
    email: "hello@ananyarao.example",
    location: "Bengaluru, India",
    bio: "Slow mornings, rented-home styling and the small rituals that make a day feel softer.",
    website: "https://ananyarao.example",
    score: 93,
    summary:
      "A high-fit slow-living creator with a warm, essay-led feed. Her audience is 78% Indian women aged 25–38, and her saved-reel rate is well above the home niche average. Best entry point: the Slow Morning Edit.",
    status: "email_available",
    source: "demo_catalog",
    addedAt: relativeIso(-3, 11),
    updatedAt: relativeIso(-1, 16),
    followUpCount: 0,
    notes: "Prefers email over DMs. Public business email listed in bio.",
    avatarTone: 0,
    tags: ["high-fit", "home", "bengaluru"],
    hook: "your linen-and-light home series, especially the reel about making a rental feel like yours",
  }),
  leadSeed({
    id: "lead_kabir",
    name: "Kabir Mehta",
    username: "kabirathome",
    niche: "Minimal home styling",
    followers: 112000,
    email: "collaborate@kabirathome.example",
    location: "Mumbai, India",
    bio: "Less, but better. Small-space styling, warm minimalism and honest furniture notes.",
    score: 88,
    summary:
      "A polished minimal-home creator with strong male reach and a high save rate. His recent small-space series aligns closely with the campaign's quiet, practical tone.",
    status: "follow_up_due",
    source: "demo_catalog",
    addedAt: relativeIso(-6, 10),
    updatedAt: relativeIso(-1, 9),
    lastContactedAt: relativeIso(-5, 10),
    nextFollowUpAt: relativeIso(0, 9),
    followUpCount: 0,
    notes: "Initial email sent 5 days ago. No reply yet.",
    avatarTone: 1,
    tags: ["home", "mumbai", "warm-minimal"],
    hook: "your less-but-better small-space edits",
  }),
  leadSeed({
    id: "lead_meera",
    name: "Meera Iyer",
    username: "meera.everyday",
    niche: "Everyday wellness",
    followers: 76500,
    email: "hello@meeraeveryday.example",
    location: "Chennai, India",
    bio: "Gentle wellness for real life. Food, rest and routines that do not demand a perfect day.",
    score: 86,
    summary:
      "An everyday-wellness creator with unusually high comment depth. Her audience responds to honest, unpolished routines, which suits the campaign's anti-hype positioning.",
    status: "replied",
    source: "demo_catalog",
    addedAt: relativeIso(-9, 12),
    updatedAt: relativeIso(-1, 8),
    lastContactedAt: relativeIso(-4, 11),
    followUpCount: 1,
    repliedAt: relativeIso(-1, 8),
    notes: "Replied with a pricing question. Draft reply is waiting for approval.",
    avatarTone: 2,
    tags: ["wellness", "chennai", "pricing"],
    hook: "your honest everyday wellness notes",
  }),
  leadSeed({
    id: "lead_rhea",
    name: "Rhea Kapoor",
    username: "rheamakes",
    niche: "DIY & crafts",
    followers: 33400,
    email: "rhea@rheamakes.example",
    location: "Pune, India",
    bio: "Making ordinary things by hand. Clay, paper, and weekend projects for slow afternoons.",
    score: 78,
    summary:
      "A craft-led creator with a small but highly engaged audience. Good fit for a handmade story around the ceramics line.",
    status: "new",
    source: "demo_catalog",
    addedAt: relativeIso(-2, 15),
    updatedAt: relativeIso(-2, 15),
    followUpCount: 0,
    notes: "Shortlisted from the curated demo catalog.",
    avatarTone: 3,
    tags: ["craft", "pune"],
    hook: "your hand-built clay pieces and weekend project notes",
  }),
  leadSeed({
    id: "lead_arjun",
    name: "Arjun Nair",
    username: "arjunoutdoors",
    niche: "Outdoor & travel",
    followers: 154000,
    email: "hello@arjunoutdoors.example",
    location: "Kochi, India",
    bio: "Weekend trails, slow travel and the gear that earns its place in the bag.",
    score: 64,
    summary:
      "A strong outdoor creator, but a weaker fit for a home-and-ritual campaign. The audience overlap with Sankar Living is limited.",
    status: "not_interested",
    source: "demo_catalog",
    addedAt: relativeIso(-12, 9),
    updatedAt: relativeIso(-6, 17),
    lastContactedAt: relativeIso(-11, 10),
    repliedAt: relativeIso(-6, 17),
    followUpCount: 0,
    notes: "Declined warmly. Follow-ups stopped automatically.",
    avatarTone: 4,
    tags: ["outdoor", "declined"],
    hook: "your weekend trail journals",
  }),
  leadSeed({
    id: "lead_sana",
    name: "Sana Sheikh",
    username: "sanastudio",
    niche: "Home office & productivity",
    followers: 27900,
    email: "studio@sanastudio.example",
    location: "Hyderabad, India",
    bio: "Calm desks, honest productivity and a softer relationship with work.",
    score: 84,
    summary:
      "A small but intentional home-office creator. Her audience is close to the brand's core customer and her content style is calm without being bland.",
    status: "follow_up_due",
    source: "demo_catalog",
    addedAt: relativeIso(-11, 14),
    updatedAt: relativeIso(-6, 10),
    lastContactedAt: relativeIso(-6, 10),
    nextFollowUpAt: relativeIso(0, 9),
    followUpCount: 1,
    notes: "Two touches sent. Second follow-up is ready to review.",
    avatarTone: 5,
    tags: ["home-office", "hyderabad"],
    hook: "your calm desk setups and honest productivity notes",
  }),
  leadSeed({
    id: "lead_dev",
    name: "Dev Patel",
    username: "devbrews",
    niche: "Coffee & rituals",
    followers: 59300,
    email: "hi@devbrews.example",
    location: "Ahmedabad, India",
    bio: "Slow coffee, quiet mornings, and the ritual of making one good cup.",
    score: 82,
    summary:
      "A rituals-led creator with a loyal, high-intent audience. Already confirmed for one integrated reel in the launch week.",
    status: "collaboration_confirmed",
    source: "demo_catalog",
    addedAt: relativeIso(-15, 11),
    updatedAt: relativeIso(-7, 12),
    lastContactedAt: relativeIso(-9, 12),
    repliedAt: relativeIso(-10, 9),
    followUpCount: 0,
    notes: "Confirmed: one 45s reel plus three stories, launch week. Brief to follow.",
    avatarTone: 1,
    tags: ["confirmed", "coffee"],
    hook: "your slow coffee rituals and the way you make a morning feel unhurried",
  }),
  leadSeed({
    id: "lead_nisha",
    name: "Nisha Verma",
    username: "nishagrows",
    niche: "Urban gardening",
    followers: 21700,
    email: "hello@nishagrows.example",
    location: "Delhi, India",
    bio: "Balcony gardening, seasonal seeds and small green corners in a busy city.",
    score: 73,
    summary:
      "A practical urban-gardening creator. Smaller reach, but an engaged local audience that fits the home-and-ritual story.",
    status: "email_available",
    source: "demo_catalog",
    addedAt: relativeIso(-4, 13),
    updatedAt: relativeIso(0, 8),
    followUpCount: 0,
    notes: "First draft ready for human review.",
    avatarTone: 2,
    tags: ["gardening", "delhi"],
    hook: "your balcony-to-bowl gardening notes",
  }),
  leadSeed({
    id: "lead_tara",
    name: "Tara Menon",
    username: "tara.morningedit",
    niche: "Mindful mornings",
    followers: 92800,
    email: "tara@morningedit.example",
    location: "Bengaluru, India",
    bio: "A quieter start to the day. Mindful routines, soft light and small good things.",
    score: 95,
    summary:
      "The strongest overall fit in the workspace. Her morning-ritual series has the exact audience and mood for the campaign, and she replied within a day.",
    status: "interested",
    source: "demo_catalog",
    addedAt: relativeIso(-7, 10),
    updatedAt: relativeIso(0, 8),
    lastContactedAt: relativeIso(-6, 10),
    repliedAt: relativeIso(0, 8),
    followUpCount: 0,
    notes: "Replied: interested. Reply draft suggests two collaboration options.",
    avatarTone: 3,
    tags: ["high-fit", "interested", "bengaluru"],
    hook: "your Morning Edit series, especially the piece about a routine that does not begin with a phone",
  }),
  leadSeed({
    id: "lead_ishaan",
    name: "Ishaan Bose",
    username: "ishaan.frames",
    niche: "Photography & lifestyle",
    followers: 41600,
    email: "hello@ishaanframes.example",
    location: "Kolkata, India",
    bio: "Quiet frames of ordinary days. Film photography and unhurried city walks.",
    score: 69,
    summary:
      "A beautiful visual storyteller with a quieter commercial fit. He opted out of outreach and must not be contacted again.",
    status: "opted_out",
    source: "demo_catalog",
    addedAt: relativeIso(-10, 12),
    updatedAt: relativeIso(-5, 16),
    lastContactedAt: relativeIso(-9, 10),
    repliedAt: relativeIso(-5, 16),
    followUpCount: 0,
    notes: "Opted out. Suppressed from all future campaigns.",
    avatarTone: 4,
    tags: ["photography", "suppressed"],
    hook: "your quiet everyday frames",
  }),
  leadSeed({
    id: "lead_priya",
    name: "Priya Desai",
    username: "priyaplants",
    niche: "Plants & interiors",
    followers: 18900,
    email: "priya@priyaplants.example",
    location: "Surat, India",
    bio: "Plants in small homes, soft corners and the slow joy of watching things grow.",
    score: 71,
    summary:
      "A micro-creator with a very engaged plant-and-interiors audience. A low-cost, high-warmth partnership candidate.",
    status: "follow_up_due",
    source: "demo_catalog",
    addedAt: relativeIso(-5, 11),
    updatedAt: relativeIso(-4, 9),
    lastContactedAt: relativeIso(-4, 9),
    nextFollowUpAt: relativeIso(0, 9),
    followUpCount: 0,
    notes: "Initial email sent 4 days ago. Follow-up is due.",
    avatarTone: 5,
    tags: ["plants", "surat"],
    hook: "your plant styling for small homes",
  }),
  leadSeed({
    id: "lead_aditya",
    name: "Aditya Kulkarni",
    username: "adityaeats",
    niche: "Food & hosting",
    followers: 205000,
    email: "collab@adityaeats.example",
    location: "Pune, India",
    bio: "Weekend tables, generous food and the people who gather around them.",
    score: 58,
    summary:
      "A large food creator with broad reach, but the audience fit for a quiet home-and-wellness collection is less direct. Keep as a secondary option.",
    status: "new",
    source: "demo_catalog",
    addedAt: relativeIso(-1, 16),
    updatedAt: relativeIso(-1, 16),
    followUpCount: 0,
    notes: "Secondary list. Revisit only if the campaign expands into hosting.",
    avatarTone: 0,
    tags: ["food", "secondary"],
    hook: "your weekend tables and generous hosting notes",
  }),
  leadSeed({
    id: "lead_leela",
    name: "Leela Krishnan",
    username: "leela.linen",
    niche: "Conscious fashion",
    followers: 38200,
    email: "hello@leelalinen.example",
    location: "Coimbatore, India",
    bio: "Linen-first dressing, natural dye and a slower relationship with what we wear.",
    score: 80,
    summary:
      "A conscious-fashion creator whose linen-first values overlap naturally with the collection. One follow-up is already scheduled.",
    status: "email_sent",
    source: "demo_catalog",
    addedAt: relativeIso(-9, 10),
    updatedAt: relativeIso(-3, 11),
    lastContactedAt: relativeIso(-3, 11),
    nextFollowUpAt: relativeIso(3, 9),
    followUpCount: 1,
    notes: "Second touch sent 3 days ago. Second follow-up scheduled in 3 days.",
    avatarTone: 1,
    tags: ["fashion", "coimbatore"],
    hook: "your linen-first approach to slow fashion",
  }),
  leadSeed({
    id: "lead_farah",
    name: "Farah Ali",
    username: "farahwellness",
    niche: "Sleep & recovery",
    followers: 66400,
    email: "hello@farahwellness.example",
    location: "Lucknow, India",
    bio: "Better sleep, softer evenings and recovery rituals for tired people.",
    score: 83,
    summary:
      "A sleep-and-recovery creator with a calm, credible voice. She asked for the rate range and is a strong candidate for the evening ritual angle.",
    status: "replied",
    source: "demo_catalog",
    addedAt: relativeIso(-6, 14),
    updatedAt: relativeIso(0, 7),
    lastContactedAt: relativeIso(-5, 10),
    repliedAt: relativeIso(0, 7),
    followUpCount: 0,
    notes: "Pricing question received this morning. Reply draft is ready.",
    avatarTone: 2,
    tags: ["sleep", "pricing"],
    hook: "your sleep wind-down series",
  }),
  leadSeed({
    id: "lead_vihaan",
    name: "Vihaan Reddy",
    username: "vihaanhome",
    niche: "Minimal home styling",
    followers: 130000,
    email: null,
    location: "Hyderabad, India",
    bio: "Warm minimalism, apartment tours and practical design notes.",
    score: 76,
    summary:
      "A strong visual fit, but no public business email is listed. Keep in the research list until a compliant contact route is confirmed.",
    status: "new",
    source: "demo_catalog",
    addedAt: relativeIso(-2, 12),
    updatedAt: relativeIso(-2, 12),
    followUpCount: 0,
    notes: "No public business email. Do not scrape or infer private contact details.",
    avatarTone: 3,
    tags: ["home", "no-public-email"],
    hook: "your warm-minimal apartment tours",
  }),
];

function initialBody(lead: Lead, hook: string): string {
  return `Hi ${lead.name.split(" ")[0]},

I am ${brand.senderName} from ${brand.name} — a small home and wellness studio from Sankar Group. We make thoughtful linen, ceramics and daily rituals for slower mornings.

I have been following ${hook}. The way you make calm feel practical is exactly the mood behind our new ${brand.campaignName}.

We would love to send you the collection and explore a paid collaboration: one honest review post plus three stories, with full creative freedom. If it feels aligned, I can share the one-page brief and a simple rate range.

Would you be open to a 15-minute call next week?

${brand.signature}

${brand.optOutLine}`;
}

function followUpBody(lead: Lead, second: boolean): string {
  const first = lead.name.split(" ")[0];
  if (second) {
    return `Hi ${first},

I will close the loop here so your inbox stays quiet. We are still holding two creator places for ${brand.campaignName}, and I would have loved to include you — but I completely understand if the timing is not right.

If a future collection feels closer, you are always welcome to reply and I will pick it back up. No follow-ups from me after this note.

Warmly,
${brand.senderName}
${brand.senderRole}, ${brand.name}

${brand.optOutLine}`;
  }
  return `Hi ${first},

Just floating this back to the top of your inbox in case it got buried. We are still holding a place for two home creators in ${brand.campaignName} this month, and your ${lead.niche.toLowerCase()} work is the first name that came to mind.

No pressure at all — if the timing is not right, a quick "not now" is completely fine and I will close the loop.

Warmly,
${brand.senderName}
${brand.senderRole}, ${brand.name}

${brand.optOutLine}`;
}

function msg(
  id: string,
  leadId: string,
  threadId: string,
  kind: MessageKind,
  status: MessageStatus,
  subject: string,
  body: string,
  createdAt: string,
  extras: Partial<Message> = {},
): Message {
  return {
    id,
    leadId,
    threadId,
    direction: kind === "reply" && status === "received" ? "inbound" : "outbound",
    kind,
    status,
    subject,
    body,
    createdAt,
    ai: false,
    ...extras,
  };
}

const threads: Thread[] = [];

function addThread(thread: Thread) {
  threads.push(thread);
}

// Tara — interested, reply draft waiting
addThread({
  id: "thread_tara",
  leadId: "lead_tara",
  subject: "A slow-morning idea for Tara",
  messages: [
    msg(
      "msg_tara_initial",
      "lead_tara",
      "thread_tara",
      "initial",
      "sent",
      "A slow-morning idea for Tara",
      initialBody(leads.find((lead) => lead.id === "lead_tara")!, "your Morning Edit series, especially the piece about a routine that does not begin with a phone"),
      relativeIso(-6, 10),
      { sentAt: relativeIso(-6, 10), approvedAt: relativeIso(-6, 10), provider: "demo", ai: true },
    ),
    msg(
      "msg_tara_reply",
      "lead_tara",
      "thread_tara",
      "reply",
      "received",
      "Re: A slow-morning idea for Tara",
      "Hi Omprakash,\n\nThis is such a lovely note — thank you. The Slow Morning Edit sounds very close to what I have been exploring lately, especially the idea of a routine that leaves room for quiet.\n\nI would be open to a conversation. Could you share the scope and the rough range you have in mind?\n\nTara",
      relativeIso(0, 8),
      { direction: "inbound" },
    ),
    msg(
      "msg_tara_draft",
      "lead_tara",
      "thread_tara",
      "reply",
      "review",
      "Re: A slow-morning idea for Tara",
      `Hi Tara,

Thank you — that genuinely made my morning. I would love to keep this simple.

Two options:
1. The Slow Morning Edit: one 30s reel plus three stories, ₹25,000–₹35,000 depending on usage rights.
2. A longer ambience film: one 60s reel, five stories and one still set, ₹45,000–₹55,000.

Both come with a full product box, full creative freedom, and no script approval on your side. If either feels close, I can send the one-page brief and we can lock a date.

Would Thursday or Friday suit a 15-minute call?

Warmly,
Omprakash Suthar
Creator Partnerships, Sankar Living

${brand.optOutLine}`,
      relativeIso(0, 9),
      { approvedAt: undefined, ai: true },
    ),
  ],
  category: "interested",
  confidence: 0.94,
  replySummary:
    "Tara is positive and wants scope plus a rough rate range before committing to a call.",
  suggestedAction: "Send two clear collaboration options and propose a 15-minute call.",
  handled: false,
  createdAt: relativeIso(-6, 10),
  updatedAt: relativeIso(0, 9),
});

// Meera — pricing
addThread({
  id: "thread_meera",
  leadId: "lead_meera",
  subject: "An everyday wellness idea for Meera",
  messages: [
    msg(
      "msg_meera_initial",
      "lead_meera",
      "thread_meera",
      "initial",
      "sent",
      "An everyday wellness idea for Meera",
      initialBody(leads.find((lead) => lead.id === "lead_meera")!, "your honest everyday wellness notes"),
      relativeIso(-8, 10),
      { sentAt: relativeIso(-8, 10), approvedAt: relativeIso(-8, 10), provider: "demo", ai: true },
    ),
    msg(
      "msg_meera_follow1",
      "lead_meera",
      "thread_meera",
      "follow_up_1",
      "sent",
      "Re: An everyday wellness idea for Meera",
      followUpBody(leads.find((lead) => lead.id === "lead_meera")!, false),
      relativeIso(-4, 11),
      { sentAt: relativeIso(-4, 11), provider: "demo", ai: true },
    ),
    msg(
      "msg_meera_reply",
      "lead_meera",
      "thread_meera",
      "reply",
      "received",
      "Re: An everyday wellness idea for Meera",
      "Hi Omprakash,\n\nThanks for the follow-up. I am potentially interested, but I need to understand the commercial side before we go further. What is the budget range for one reel and three stories? And would you need paid usage rights?\n\nMeera",
      relativeIso(-1, 8),
      { direction: "inbound" },
    ),
    msg(
      "msg_meera_draft",
      "lead_meera",
      "thread_meera",
      "reply",
      "review",
      "Re: An everyday wellness idea for Meera",
      `Hi Meera,

Thanks for asking directly — I appreciate that.

For this campaign, our range is:
• One reel plus three stories: ₹22,000–₹30,000
• One reel, five stories and one static: ₹38,000–₹48,000

Organic usage is included. If you are open to 30 days of paid amplification, we add 20% and keep the scope to your existing edit style. No script approval, and we are happy to work with your usual disclosure format.

Would the first option feel workable? If so, I can send the brief and a date hold today.

Warmly,
Omprakash Suthar
Creator Partnerships, Sankar Living

${brand.optOutLine}`,
      relativeIso(-1, 9),
      { ai: true },
    ),
  ],
  category: "pricing",
  confidence: 0.91,
  replySummary:
    "Meera is open but wants the budget range and clarity on paid usage before moving forward.",
  suggestedAction: "Share a two-tier rate range, explain usage rights and ask for a date hold.",
  handled: false,
  createdAt: relativeIso(-8, 10),
  updatedAt: relativeIso(-1, 9),
});

// Farah — pricing
addThread({
  id: "thread_farah",
  leadId: "lead_farah",
  subject: "An evening ritual idea for Farah",
  messages: [
    msg(
      "msg_farah_initial",
      "lead_farah",
      "thread_farah",
      "initial",
      "sent",
      "An evening ritual idea for Farah",
      initialBody(leads.find((lead) => lead.id === "lead_farah")!, "your sleep wind-down series"),
      relativeIso(-5, 10),
      { sentAt: relativeIso(-5, 10), approvedAt: relativeIso(-5, 10), provider: "demo", ai: true },
    ),
    msg(
      "msg_farah_reply",
      "lead_farah",
      "thread_farah",
      "reply",
      "received",
      "Re: An evening ritual idea for Farah",
      "Hi Omprakash,\n\nThis is well timed — I have been thinking about evening rituals for my community. Could you send the rate range and what the deliverables would look like? I am not sure I can commit to a call this week, but I would like to see the details.\n\nFarah",
      relativeIso(0, 7),
      { direction: "inbound" },
    ),
    msg(
      "msg_farah_draft",
      "lead_farah",
      "thread_farah",
      "reply",
      "review",
      "Re: An evening ritual idea for Farah",
      `Hi Farah,

Of course — no call needed to start.

The simplest version is one 30–45s reel plus three stories, with full creative freedom. The range is ₹25,000–₹35,000, including organic usage and a product box. If you would like to add a still set for your grid, we can add ₹8,000.

I can send a one-page brief with three optional angles: the wind-down shelf, the ten-minute evening reset, or a Sunday-night ritual. You choose whichever feels closest to your community.

Would it help if I sent the brief first, and we only talk if the scope feels right?

Warmly,
Omprakash Suthar
Creator Partnerships, Sankar Living

${brand.optOutLine}`,
      relativeIso(0, 8),
      { ai: true },
    ),
  ],
  category: "pricing",
  confidence: 0.88,
  replySummary:
    "Farah wants deliverables and rates by email; she is not ready for a call this week.",
  suggestedAction: "Send a low-pressure brief with three angle options and a clear rate range.",
  handled: false,
  createdAt: relativeIso(-5, 10),
  updatedAt: relativeIso(0, 8),
});

// Dev — collaboration confirmed
addThread({
  id: "thread_dev",
  leadId: "lead_dev",
  subject: "A slow coffee idea for Dev",
  messages: [
    msg(
      "msg_dev_initial",
      "lead_dev",
      "thread_dev",
      "initial",
      "sent",
      "A slow coffee idea for Dev",
      initialBody(leads.find((lead) => lead.id === "lead_dev")!, "your slow coffee rituals and the way you make a morning feel unhurried"),
      relativeIso(-14, 10),
      { sentAt: relativeIso(-14, 10), approvedAt: relativeIso(-14, 10), provider: "demo", ai: true },
    ),
    msg(
      "msg_dev_reply1",
      "lead_dev",
      "thread_dev",
      "reply",
      "received",
      "Re: A slow coffee idea for Dev",
      "Hi Omprakash,\n\nI like the sound of this. The product feels like a natural fit for my morning brew series. What dates are you working with?\n\nDev",
      relativeIso(-10, 9),
      { direction: "inbound" },
    ),
    msg(
      "msg_dev_reply2",
      "lead_dev",
      "thread_dev",
      "reply",
      "sent",
      "Re: A slow coffee idea for Dev",
      `Hi Dev,

Wonderful. We are planning the launch for the second week of next month, with a little flexibility.

Would a 45s reel plus three stories in launch week work for you? We can ship the box two weeks early so you have time to live with it. Full creative freedom on the edit; we would only ask for the collaboration label and a link in bio for seven days.

If that feels right, I will send the brief and confirm the date.

Warmly,
Omprakash Suthar
Creator Partnerships, Sankar Living`,
      relativeIso(-9, 12),
      { sentAt: relativeIso(-9, 12), provider: "demo", ai: true },
    ),
    msg(
      "msg_dev_reply3",
      "lead_dev",
      "thread_dev",
      "reply",
      "received",
      "Re: A slow coffee idea for Dev",
      "Perfect — let's lock it. I am in for the 45s reel and three stories in launch week. Send the brief whenever it is ready.\n\nDev",
      relativeIso(-7, 12),
      { direction: "inbound" },
    ),
  ],
  category: "collaboration",
  confidence: 0.97,
  replySummary:
    "Dev confirmed the 45s reel and three stories for launch week. Brief is the next step.",
  suggestedAction: "Send the brief, confirm the date and arrange product delivery.",
  handled: true,
  createdAt: relativeIso(-14, 10),
  updatedAt: relativeIso(-7, 12),
});

// Arjun — not interested
addThread({
  id: "thread_arjun",
  leadId: "lead_arjun",
  subject: "A slow-morning idea for Arjun",
  messages: [
    msg(
      "msg_arjun_initial",
      "lead_arjun",
      "thread_arjun",
      "initial",
      "sent",
      "A slow-morning idea for Arjun",
      initialBody(leads.find((lead) => lead.id === "lead_arjun")!, "your weekend trail journals"),
      relativeIso(-11, 10),
      { sentAt: relativeIso(-11, 10), approvedAt: relativeIso(-11, 10), provider: "demo", ai: true },
    ),
    msg(
      "msg_arjun_reply",
      "lead_arjun",
      "thread_arjun",
      "reply",
      "received",
      "Re: A slow-morning idea for Arjun",
      "Hi Omprakash,\n\nThanks for thinking of me, but this is not the right fit for my audience right now. I mostly cover outdoor gear and travel. Wishing you a good launch.\n\nArjun",
      relativeIso(-6, 17),
      { direction: "inbound" },
    ),
  ],
  category: "not_interested",
  confidence: 0.98,
  replySummary: "Arjun declined; the audience fit is not right. Follow-ups stopped.",
  suggestedAction: "Close the loop. No further outreach.",
  handled: true,
  createdAt: relativeIso(-11, 10),
  updatedAt: relativeIso(-6, 17),
});

// Ishaan — opted out
addThread({
  id: "thread_ishaan",
  leadId: "lead_ishaan",
  subject: "A quiet idea for Ishaan",
  messages: [
    msg(
      "msg_ishaan_initial",
      "lead_ishaan",
      "thread_ishaan",
      "initial",
      "sent",
      "A quiet idea for Ishaan",
      initialBody(leads.find((lead) => lead.id === "lead_ishaan")!, "your quiet everyday frames"),
      relativeIso(-9, 10),
      { sentAt: relativeIso(-9, 10), approvedAt: relativeIso(-9, 10), provider: "demo", ai: true },
    ),
    msg(
      "msg_ishaan_reply",
      "lead_ishaan",
      "thread_ishaan",
      "reply",
      "received",
      "Re: A quiet idea for Ishaan",
      "Please remove me from this list. Not interested.\n\nIshaan",
      relativeIso(-5, 16),
      { direction: "inbound" },
    ),
  ],
  category: "opt_out",
  confidence: 0.99,
  replySummary: "Explicit opt-out. Contact is suppressed and all outreach stopped.",
  suggestedAction: "Confirm removal once. Never contact again.",
  handled: true,
  createdAt: relativeIso(-9, 10),
  updatedAt: relativeIso(-5, 16),
});

// Kabir — follow-up due
addThread({
  id: "thread_kabir",
  leadId: "lead_kabir",
  subject: "A quiet home idea for Kabir",
  messages: [
    msg(
      "msg_kabir_initial",
      "lead_kabir",
      "thread_kabir",
      "initial",
      "sent",
      "A quiet home idea for Kabir",
      initialBody(leads.find((lead) => lead.id === "lead_kabir")!, "your less-but-better small-space edits"),
      relativeIso(-5, 10),
      { sentAt: relativeIso(-5, 10), approvedAt: relativeIso(-5, 10), provider: "demo", ai: true },
    ),
  ],
  handled: false,
  createdAt: relativeIso(-5, 10),
  updatedAt: relativeIso(-5, 10),
});

// Sana — second follow-up due
addThread({
  id: "thread_sana",
  leadId: "lead_sana",
  subject: "A calmer desk idea for Sana",
  messages: [
    msg(
      "msg_sana_initial",
      "lead_sana",
      "thread_sana",
      "initial",
      "sent",
      "A calmer desk idea for Sana",
      initialBody(leads.find((lead) => lead.id === "lead_sana")!, "your calm desk setups and honest productivity notes"),
      relativeIso(-10, 10),
      { sentAt: relativeIso(-10, 10), approvedAt: relativeIso(-10, 10), provider: "demo", ai: true },
    ),
    msg(
      "msg_sana_follow1",
      "lead_sana",
      "thread_sana",
      "follow_up_1",
      "sent",
      "Re: A calmer desk idea for Sana",
      followUpBody(leads.find((lead) => lead.id === "lead_sana")!, false),
      relativeIso(-6, 10),
      { sentAt: relativeIso(-6, 10), provider: "demo", ai: true },
    ),
  ],
  handled: false,
  createdAt: relativeIso(-10, 10),
  updatedAt: relativeIso(-6, 10),
});

// Priya — follow-up due
addThread({
  id: "thread_priya",
  leadId: "lead_priya",
  subject: "A small green corner idea for Priya",
  messages: [
    msg(
      "msg_priya_initial",
      "lead_priya",
      "thread_priya",
      "initial",
      "sent",
      "A small green corner idea for Priya",
      initialBody(leads.find((lead) => lead.id === "lead_priya")!, "your plant styling for small homes"),
      relativeIso(-4, 9),
      { sentAt: relativeIso(-4, 9), approvedAt: relativeIso(-4, 9), provider: "demo", ai: true },
    ),
  ],
  handled: false,
  createdAt: relativeIso(-4, 9),
  updatedAt: relativeIso(-4, 9),
});

// Leela — second follow-up scheduled
addThread({
  id: "thread_leela",
  leadId: "lead_leela",
  subject: "A linen idea for Leela",
  messages: [
    msg(
      "msg_leela_initial",
      "lead_leela",
      "thread_leela",
      "initial",
      "sent",
      "A linen idea for Leela",
      initialBody(leads.find((lead) => lead.id === "lead_leela")!, "your linen-first approach to slow fashion"),
      relativeIso(-8, 10),
      { sentAt: relativeIso(-8, 10), approvedAt: relativeIso(-8, 10), provider: "demo", ai: true },
    ),
    msg(
      "msg_leela_follow1",
      "lead_leela",
      "thread_leela",
      "follow_up_1",
      "sent",
      "Re: A linen idea for Leela",
      followUpBody(leads.find((lead) => lead.id === "lead_leela")!, false),
      relativeIso(-3, 11),
      { sentAt: relativeIso(-3, 11), provider: "demo", ai: true },
    ),
  ],
  handled: false,
  createdAt: relativeIso(-8, 10),
  updatedAt: relativeIso(-3, 11),
});

// Nisha — initial draft ready
addThread({
  id: "thread_nisha",
  leadId: "lead_nisha",
  subject: "A balcony-to-bowl idea for Nisha",
  messages: [
    msg(
      "msg_nisha_draft",
      "lead_nisha",
      "thread_nisha",
      "initial",
      "review",
      "A balcony-to-bowl idea for Nisha",
      initialBody(leads.find((lead) => lead.id === "lead_nisha")!, "your balcony-to-bowl gardening notes"),
      relativeIso(0, 8),
      { ai: true },
    ),
  ],
  handled: false,
  createdAt: relativeIso(0, 8),
  updatedAt: relativeIso(0, 8),
});

// Ananya — initial draft ready
addThread({
  id: "thread_ananya",
  leadId: "lead_ananya",
  subject: "A slow-morning idea for Ananya",
  messages: [
    msg(
      "msg_ananya_draft",
      "lead_ananya",
      "thread_ananya",
      "initial",
      "review",
      "A slow-morning idea for Ananya",
      initialBody(leads.find((lead) => lead.id === "lead_ananya")!, "your linen-and-light home series, especially the reel about making a rental feel like yours"),
      relativeIso(0, 8),
      { ai: true },
    ),
  ],
  handled: false,
  createdAt: relativeIso(0, 8),
  updatedAt: relativeIso(0, 8),
});

const activities: Activity[] = [
  {
    id: "act_1",
    type: "reply",
    title: "Tara Menon replied: interested",
    detail: "Claude classified the reply as interested and drafted a two-option response.",
    at: relativeIso(0, 8),
    leadId: "lead_tara",
  },
  {
    id: "act_2",
    type: "reply",
    title: "Pricing question from Farah Ali",
    detail: "Draft reply is waiting for human approval before sending.",
    at: relativeIso(0, 7),
    leadId: "lead_farah",
  },
  {
    id: "act_3",
    type: "email",
    title: "Two initial drafts are ready",
    detail: "Ananya Rao and Nisha Verma were drafted with the calm campaign brief.",
    at: relativeIso(0, 8),
    leadId: "lead_ananya",
  },
  {
    id: "act_4",
    type: "status",
    title: "Dev Patel confirmed the collaboration",
    detail: "45s reel plus three stories in launch week. Brief is the next step.",
    at: relativeIso(-7, 12),
    leadId: "lead_dev",
  },
  {
    id: "act_5",
    type: "email",
    title: "Three follow-ups are due today",
    detail: "Kabir Mehta, Sana Sheikh and Priya Desai have not replied yet.",
    at: relativeIso(0, 9),
  },
  {
    id: "act_6",
    type: "lead",
    title: "Ananya Rao added to the pipeline",
    detail: "Scored 93/100 by the screening step. Public business email on file.",
    at: relativeIso(-3, 11),
    leadId: "lead_ananya",
  },
  {
    id: "act_7",
    type: "status",
    title: "Ishaan Bose opted out",
    detail: "Contact suppressed. All follow-ups stopped automatically.",
    at: relativeIso(-5, 16),
    leadId: "lead_ishaan",
  },
  {
    id: "act_8",
    type: "system",
    title: "Demo workspace prepared",
    detail: "15 creators, 3 live conversations and a full outreach history.",
    at: relativeIso(-1, 18),
  },
];

export function createSeedWorkspace(): Workspace {
  const now = new Date().toISOString();
  return {
    version: 1,
    brand,
    settings,
    leads: leads.map((lead) => ({ ...lead })),
    threads: threads.map((thread) => ({
      ...thread,
      messages: thread.messages.map((message) => ({ ...message })),
    })),
    activities: activities.map((activity) => ({ ...activity })),
    createdAt: now,
    updatedAt: now,
  };
}

export function sampleOutreachEmail() {
  return initialBody(leads.find((lead) => lead.id === "lead_tara")!, "your Morning Edit series");
}

export function sampleFollowUpEmail() {
  return followUpBody(leads.find((lead) => lead.id === "lead_kabir")!, false);
}
