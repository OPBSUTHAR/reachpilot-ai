import type { BrandProfile, Candidate, Lead, ReplyCategory } from "./types";

export type Engine = "claude" | "ai-gateway" | "local";

export function aiEngine(): Engine {
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  if (process.env.AI_GATEWAY_API_KEY) return "ai-gateway";
  return "local";
}

export function engineLabel(): string {
  const engine = aiEngine();
  if (engine === "claude") return "Claude";
  if (engine === "ai-gateway") return "Vercel AI Gateway";
  return "Guided local model";
}

async function callClaude(system: string, prompt: string, maxTokens = 900): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
        max_tokens: maxTokens,
        temperature: 0.5,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    return data.content?.find((block) => block.type === "text")?.text ?? null;
  } catch {
    return null;
  }
}

async function callGateway(system: string, prompt: string, maxTokens = 900): Promise<string | null> {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) return null;
  try {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.AI_GATEWAY_MODEL || "anthropic/claude-sonnet-4.5",
        max_tokens: maxTokens,
        temperature: 0.5,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

async function callModel(system: string, prompt: string, maxTokens = 900): Promise<string | null> {
  const engine = aiEngine();
  if (engine === "claude") return callClaude(system, prompt, maxTokens);
  if (engine === "ai-gateway") return callGateway(system, prompt, maxTokens);
  return null;
}

function extractJson<T>(text: string | null): T | null {
  if (!text) return null;
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

function clamp(value: unknown, fallback: number): number {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function cleanText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

const TONE_RULES = `You write for a calm, thoughtful brand. Keep sentences short. Be specific, never hypey. No exclamation marks. No emoji. No generic flattery. Always include a clear, low-pressure next step.`;

function leadContext(lead: Lead | Candidate, brand: BrandProfile): string {
  return [
    `Brand: ${brand.name} — ${brand.tagline}`,
    `Brand description: ${brand.description}`,
    `Campaign: ${brand.campaignName}. Goal: ${brand.campaignGoal}`,
    `Audience: ${brand.audience}`,
    `Offer: ${brand.offer}`,
    `Preferred tone: ${brand.tone}`,
    `Creator: ${lead.name} (@${lead.username})`,
    `Niche: ${lead.niche}`,
    `Location: ${lead.location}`,
    `Followers: ${lead.followers}`,
    `Bio: ${lead.bio}`,
    lead.email ? `Public business email: ${lead.email}` : "No public business email on file",
  ].join("\n");
}

/* ------------------------------------------------------------------ */
/* Screening                                                          */
/* ------------------------------------------------------------------ */

export interface ScreenResult {
  score: number;
  tier: "A" | "B" | "C";
  summary: string;
  tags: string[];
}

export function localScreen(lead: Lead | Candidate, brand: BrandProfile): ScreenResult {
  const existingScore = "score" in lead ? lead.score : 70;
  const nicheMatch = brand.niches.some(
    (niche) => niche.toLowerCase() === lead.niche.toLowerCase(),
  );
  const adjacent = /home|wellness|slow|ritual|plant|morning|sleep|linen|coffee/i.test(lead.niche);
  let score = existingScore;
  if (!nicheMatch && adjacent) score = Math.max(score - 4, 58);
  if (!nicheMatch && !adjacent) score = Math.max(score - 12, 45);
  if (lead.followers >= 15_000 && lead.followers <= 150_000) score += 2;
  if (lead.followers > 180_000) score -= 3;
  if (lead.email) score += 1;
  score = Math.max(35, Math.min(99, score));
  const tier: "A" | "B" | "C" = score >= 85 ? "A" : score >= 72 ? "B" : "C";
  const summary =
    "summary" in lead && lead.summary
      ? lead.summary
      : `${lead.name} is a ${lead.niche.toLowerCase()} creator based in ${lead.location}. The audience and content style ${
          score >= 80 ? "align closely" : score >= 65 ? "partly align" : "are a stretch"
        } with ${brand.campaignName}.`;
  return {
    score,
    tier,
    summary,
    tags: [
      nicheMatch ? "niche-fit" : adjacent ? "adjacent-fit" : "stretch",
      lead.email ? "email-available" : "no-public-email",
    ],
  };
}

export async function screenCreator(
  lead: Lead | Candidate,
  brand: BrandProfile,
): Promise<ScreenResult> {
  const local = localScreen(lead, brand);
  if (aiEngine() === "local") return local;
  const system = `You are a careful influencer research analyst for ${brand.name}. ${TONE_RULES}
Return ONLY valid JSON: {"score": number 0-100, "tier": "A"|"B"|"C", "summary": string, "tags": string[]}.
Score fit for the specific campaign, not general popularity. Penalise audience mismatch. Keep the summary to 2 sentences and do not invent metrics that are not provided.`;
  const prompt = `${leadContext(lead, brand)}
${"hook" in lead && lead.hook ? `A useful personal hook: ${lead.hook}` : ""}

Assess this creator for the campaign.`;
  const parsed = extractJson<Partial<ScreenResult>>(await callModel(system, prompt, 500));
  if (!parsed) return local;
  const score = clamp(parsed.score, local.score);
  return {
    score,
    tier: score >= 85 ? "A" : score >= 72 ? "B" : "C",
    summary: cleanText(parsed.summary, local.summary),
    tags: Array.isArray(parsed.tags)
      ? parsed.tags.filter((tag): tag is string => typeof tag === "string").slice(0, 5)
      : local.tags,
  };
}

/* ------------------------------------------------------------------ */
/* Outreach copy                                                      */
/* ------------------------------------------------------------------ */

export interface DraftEmail {
  subject: string;
  body: string;
}

function ensureOptOut(body: string, brand: BrandProfile): string {
  if (/unsubscribe|opt out|remove you/i.test(body)) return body;
  return `${body.trim()}\n\n${brand.optOutLine}`;
}

export function localInitialEmail(lead: Lead | Candidate, brand: BrandProfile): DraftEmail {
  const first = lead.name.split(" ")[0];
  const hook =
    "hook" in lead && lead.hook
      ? lead.hook
      : `your ${lead.niche.toLowerCase()} work and the care you bring to the everyday`;
  const body = `Hi ${first},

I am ${brand.senderName} from ${brand.name} — ${brand.tagline.toLowerCase()} We are a small home and wellness studio from Sankar Group, making thoughtful linen, ceramics and daily rituals.

I have been following ${hook}. The way you make calm feel practical is exactly the mood behind our new ${brand.campaignName}.

We would love to send you the collection and explore a paid collaboration: one honest review post plus three stories, with full creative freedom. If it feels aligned, I can share the one-page brief and a simple rate range.

Would you be open to a 15-minute call next week?

${brand.signature}

${brand.optOutLine}`;
  return {
    subject: `${brand.campaignName}: a small idea for ${first}`,
    body,
  };
}

export function localFollowUp(lead: Lead, brand: BrandProfile, step: 1 | 2): DraftEmail {
  const first = lead.name.split(" ")[0];
  if (step === 2) {
    return {
      subject: `Re: ${brand.campaignName}: a small idea for ${first}`,
      body: `Hi ${first},

I will close the loop here so your inbox stays quiet. We are still holding two creator places for ${brand.campaignName}, and I would have loved to include you — but I completely understand if the timing is not right.

If a future collection feels closer, you are always welcome to reply and I will pick it back up. No follow-ups from me after this note.

Warmly,
${brand.senderName}
${brand.senderRole}, ${brand.name}

${brand.optOutLine}`,
    };
  }
  return {
    subject: `Re: ${brand.campaignName}: a small idea for ${first}`,
    body: `Hi ${first},

Just floating this back to the top of your inbox in case it got buried. We are still holding a place for two home creators in ${brand.campaignName} this month, and your ${lead.niche.toLowerCase()} work is the first name that came to mind.

No pressure at all — if the timing is not right, a quick "not now" is completely fine and I will close the loop.

Warmly,
${brand.senderName}
${brand.senderRole}, ${brand.name}

${brand.optOutLine}`,
    };
}

export async function composeOutreach(
  lead: Lead | Candidate,
  brand: BrandProfile,
): Promise<DraftEmail> {
  const local = localInitialEmail(lead, brand);
  if (aiEngine() === "local") return local;
  const system = `You write one-to-one cold outreach for ${brand.name}. ${TONE_RULES}
Rules: plain text only; 130-190 words; open with the creator's first name; one specific, plausible compliment based only on the information provided; introduce the brand in one sentence; explain why this creator; propose one low-pressure paid collaboration; one clear call to action; sign as ${brand.senderName}, ${brand.senderRole}; include this exact opt-out sentence at the end: "${brand.optOutLine}".
Do not invent follower counts, open rates or campaign results. Return ONLY JSON: {"subject": string, "body": string}.`;
  const prompt = `${leadContext(lead, brand)}
${"hook" in lead && lead.hook ? `Specific hook to reference: ${lead.hook}` : ""}

Write the initial email.`;
  const parsed = extractJson<Partial<DraftEmail>>(await callModel(system, prompt, 1000));
  if (!parsed) return local;
  return {
    subject: cleanText(parsed.subject, local.subject),
    body: ensureOptOut(cleanText(parsed.body, local.body), brand),
  };
}

export async function composeFollowUp(
  lead: Lead,
  brand: BrandProfile,
  step: 1 | 2,
): Promise<DraftEmail> {
  const local = localFollowUp(lead, brand, step);
  if (aiEngine() === "local") return local;
  const system = `You write gentle follow-up emails for ${brand.name}. ${TONE_RULES}
This is follow-up ${step} of 2. Do not guilt the reader. Do not repeat the full pitch. Add one small new detail or angle, make it easy to say "not now", and include the opt-out sentence. 70-120 words. Return ONLY JSON: {"subject": string, "body": string}.`;
  const prompt = `${leadContext(lead, brand)}
The creator has not replied to the initial email. Write follow-up ${step}.`;
  const parsed = extractJson<Partial<DraftEmail>>(await callModel(system, prompt, 700));
  if (!parsed) return local;
  return {
    subject: cleanText(parsed.subject, local.subject),
    body: ensureOptOut(cleanText(parsed.body, local.body), brand),
  };
}

/* ------------------------------------------------------------------ */
/* Reply intelligence                                                 */
/* ------------------------------------------------------------------ */

export interface ReplyAnalysis {
  category: ReplyCategory;
  confidence: number;
  summary: string;
  suggestedAction: string;
}

export function localAnalyzeReply(text: string): ReplyAnalysis {
  const value = text.toLowerCase();
  const has = (pattern: RegExp) => pattern.test(value);
  let category: ReplyCategory = "other";
  let confidence = 0.62;

  if (has(/unsubscribe|remove me|stop emailing|do not contact|don't contact|opt out|take me off/)) {
    category = "opt_out";
    confidence = 0.99;
  } else if (has(/not interested|not the right fit|no thank|not for me|decline|wish you|pass on this|not now/)) {
    category = "not_interested";
    confidence = 0.93;
  } else if (has(/₹|inr|rate|price|pricing|budget|cost|charge|commercial|fee|how much/)) {
    category = "pricing";
    confidence = 0.9;
  } else if (has(/confirmed|lock it|i am in|i'm in|let's do it|contract|deliverable|scope|dates|brief|work together|partnership/)) {
    category = "collaboration";
    confidence = 0.88;
  } else if (has(/interested|open to|sounds (good|great|lovely)|would love|keen|happy to|let's talk|set up a call/)) {
    category = "interested";
    confidence = 0.86;
  } else if (has(/\?/)) {
    category = "question";
    confidence = 0.7;
  }

  const copy: Record<ReplyCategory, { summary: string; action: string }> = {
    interested: {
      summary: "The creator is positive and open to a conversation.",
      action: "Offer two clear collaboration options and propose a short call.",
    },
    pricing: {
      summary: "The creator wants rates, deliverables or usage details before moving forward.",
      action: "Share a two-tier rate range, explain usage rights and ask for a date hold.",
    },
    collaboration: {
      summary: "The creator is ready to discuss or confirm a collaboration.",
      action: "Confirm scope and dates, then send the one-page brief.",
    },
    not_interested: {
      summary: "The creator has declined this campaign.",
      action: "Thank them once, close the loop and stop all follow-ups.",
    },
    opt_out: {
      summary: "The creator has explicitly asked to be removed from outreach.",
      action: "Confirm removal, suppress the contact and never follow up again.",
    },
    question: {
      summary: "The creator has asked a question that needs a direct answer.",
      action: "Answer the question, then offer a simple next step.",
    },
    other: {
      summary: "The reply needs a human read before a response is sent.",
      action: "Read the full thread and choose the next action manually.",
    },
  };

  return {
    category,
    confidence,
    summary: copy[category].summary,
    suggestedAction: copy[category].action,
  };
}

export async function analyzeReply(
  reply: string,
  lead: Lead,
  brand: BrandProfile,
): Promise<ReplyAnalysis> {
  const local = localAnalyzeReply(reply);
  if (aiEngine() === "local") return local;
  const system = `You classify replies for ${brand.name}'s creator outreach. ${TONE_RULES}
Choose exactly one category: interested, pricing, collaboration, not_interested, opt_out, question, other.
Opt-out and not-interested take priority. Return ONLY JSON:
{"category": string, "confidence": number 0-1, "summary": string, "suggestedAction": string}.
Summary must be one sentence. Suggested action must be one concrete next step.`;
  const prompt = `${leadContext(lead, brand)}

Reply received:
"""
${reply.slice(0, 4000)}
"""

Classify the reply.`;
  const parsed = extractJson<Partial<ReplyAnalysis>>(await callModel(system, prompt, 500));
  if (!parsed) return local;
  const allowed: ReplyCategory[] = [
    "interested",
    "pricing",
    "collaboration",
    "not_interested",
    "opt_out",
    "question",
    "other",
  ];
  const category = allowed.includes(parsed.category as ReplyCategory)
    ? (parsed.category as ReplyCategory)
    : local.category;
  return {
    category,
    confidence:
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : local.confidence,
    summary: cleanText(parsed.summary, local.summary),
    suggestedAction: cleanText(parsed.suggestedAction, local.suggestedAction),
  };
}

function localReplyBody(
  lead: Lead,
  brand: BrandProfile,
  category: ReplyCategory,
): string {
  const first = lead.name.split(" ")[0];
  const sign = `${brand.senderName}\n${brand.senderRole}, ${brand.name}`;
  if (category === "pricing") {
    return `Hi ${first},

Thanks for asking directly — I appreciate that.

For this campaign, our range is:
• One reel plus three stories: ₹22,000–₹30,000
• One reel, five stories and one static: ₹38,000–₹48,000

Organic usage is included. If you are open to 30 days of paid amplification, we add 20% and keep the scope to your existing edit style. No script approval, and we are happy to work with your usual disclosure format.

Would the first option feel workable? If so, I can send the brief and a date hold today.

Warmly,
${sign}`;
  }
  if (category === "interested") {
    return `Hi ${first},

Thank you — that is lovely to hear. I would love to keep this simple.

Two options:
1. The ${brand.campaignName}: one 30s reel plus three stories, ₹25,000–₹35,000 depending on usage rights.
2. A longer ambience film: one 60s reel, five stories and one still set, ₹45,000–₹55,000.

Both come with a full product box, full creative freedom, and no script approval on your side. If either feels close, I can send the one-page brief and we can lock a date.

Would Thursday or Friday suit a 15-minute call?

Warmly,
${sign}`;
  }
  if (category === "collaboration") {
    return `Hi ${first},

Wonderful — thank you for confirming. I will send the one-page brief today with the dates, deliverables and the product shipping details.

The scope we have in mind is one 45s reel plus three stories in launch week, with full creative freedom on your side. We only ask for the collaboration label and a link in bio for seven days.

If anything in the brief needs adjusting, tell me and we will keep it simple. Looking forward to working together.

Warmly,
${sign}`;
  }
  if (category === "not_interested") {
    return `Hi ${first},

Thank you for the honest note. I completely understand, and I appreciate you taking the time to reply.

I will close the loop here and stop the follow-ups. If a future collection feels closer, you are always welcome to reach out.

Wishing you a good week.

Warmly,
${sign}`;
  }
  if (category === "opt_out") {
    return `Hi ${first},

Understood. I have removed you from our outreach list and you will not receive any further emails from this campaign.

I am sorry for the interruption, and I appreciate you telling me directly.

Warmly,
${sign}`;
  }
  if (category === "question") {
    return `Hi ${first},

Thanks for the question. The short answer: the collaboration is a paid partnership with full creative freedom, a product box, and a simple one-page brief. We are planning one reel plus three stories, and the rate range depends on usage rights.

If it helps, I can send the brief with the exact deliverable and rate options so you can see everything in one place. No call needed until you have had a look.

Warmly,
${sign}`;
  }
  return `Hi ${first},

Thank you for the reply. I want to make sure I answer this properly rather than send a generic note — could you tell me a little more about what would be most useful: the brief, the rate range, or the timeline?

I am happy to keep this over email and send everything in one short note.

Warmly,
${sign}`;
}

export async function composeReply(
  lead: Lead,
  brand: BrandProfile,
  analysis: ReplyAnalysis,
  replyText: string,
): Promise<DraftEmail> {
  const localBody = localReplyBody(lead, brand, analysis.category);
  const subject = `Re: ${brand.campaignName}: a small idea for ${lead.name.split(" ")[0]}`;
  if (aiEngine() === "local") return { subject, body: localBody };
  const system = `You draft replies for ${brand.senderName} at ${brand.name}. ${TONE_RULES}
The reply must acknowledge the creator's specific message, answer the actual question, and suggest one concrete next step. 90-170 words. Do not over-promise. Do not invent availability or rates outside the range provided. Plain text only. Sign as ${brand.senderName}, ${brand.senderRole}. Return ONLY JSON: {"subject": string, "body": string}.`;
  const prompt = `${leadContext(lead, brand)}

Category: ${analysis.category}
What they said: ${replyText.slice(0, 2500)}

Draft a human reply that is ready for approval. If the category is opt_out or not_interested, keep it short and respectful.`;
  const parsed = extractJson<Partial<DraftEmail>>(await callModel(system, prompt, 900));
  if (!parsed) return { subject, body: localBody };
  return {
    subject: cleanText(parsed.subject, subject),
    body: cleanText(parsed.body, localBody),
  };
}
