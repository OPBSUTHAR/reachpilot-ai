# ReachPilot — 6-minute demo script

Record at 1440×900 or 1920×1080. Use the live Vercel URL or
`http://localhost:3000`. Before recording, open **Settings → Reset demo
workspace** so the pipeline starts in its seeded state.

> Voiceover tip: keep it conversational. The screen already carries the detail;
> say what you are doing and why, not every label.

## Before you hit record

- [ ] Demo workspace reset, 15 seeded creators visible.
- [ ] Browser zoom at 100%, notifications silenced.
- [ ] The sidebar shows **Local model / Demo outbox** (or Claude / Gmail if connected).
- [ ] Know where the **Run daily check** button is on Overview.

## 0:00–0:25 — The problem and the promise

**Screen:** Overview.

> "Influencer outreach usually breaks into five tools and a lot of copy-paste:
> research, a spreadsheet, email, follow-ups, and a separate inbox. ReachPilot
> makes that one calm loop. It finds relevant creators from public information,
> scores them against a brand brief, drafts personalised email, tracks
> follow-ups, and turns replies into clear next actions. A human stays in the
> loop for every first send and every AI-written reply."

Point at the four top stats and the **Needs you today** card.

## 0:25–1:10 — Overview: what needs attention

**Screen:** Overview → **Needs you today**.

> "The workspace opens with decisions, not a wall of data. Three reply drafts are
> waiting, two first emails are ready for approval, and three follow-ups are due.
> Nothing goes out without approval."

Click **See who is due** or scroll to **Pipeline at a glance**.

> "Every status in the assignment is here: New lead, Email available, Sent,
> Follow-up due, Replied, Interested, Not interested, Collaboration confirmed,
> and Opted out."

## 1:10–2:10 — Discover: research with guardrails

**Screen:** Discover. Leave the filters empty and search.

> "The discovery catalog is a curated demo set of 25 fictional creators with
> public-style business contacts. It is deliberately simulated: no scraping, no
> private data, no Instagram login. In production, the same queue can be fed by
> authorised research or an approved data provider."

Set:

- **Niche:** `Sleep & recovery`
- **Location:** `Kochi`
- **Min followers:** `50000`
- **Public email only:** on

Click **Search creators**.

> "The search is filtering on niche, location, follower range and whether a public
> business email exists. Scores are generated against the Sankar Living brief."

Click **Re-screen** on one result.

> "The AI reads the public bio and campaign context, then returns a fit score, a
> tier, tags and a short rationale. With an Anthropic key this is Claude; without
> one, the guided local model keeps the flow deterministic and explainable."

Select **Maya Pillai** (or any creator not already in the pipeline) and click
**Add to pipeline**.

## 2:10–2:50 — Pipeline / CRM: one record, no duplicates

**Screen:** Pipeline.

> "Maya lands in the CRM with a status of Email available. ReachPilot blocks
> duplicates by Instagram username and public email before adding a record."

Open Maya's row.

> "The detail view keeps the public profile, fit rationale, contact details,
> private notes and the whole conversation in one place."

Close the modal. Point at the **Export CSV** button.

> "The same records export to CSV, so the sheet can live in Google Sheets if the
> team prefers that surface."

## 2:50–4:05 — Outreach: draft, approve, send

**Screen:** Outreach.

> "Drafts are written one at a time from the brand brief, the creator's niche, bio
> and the specific reason they were selected. They are not mail-merged
> placeholders."

Find Maya's draft (or use the **Draft next batch** button). Click **Edit**, change
one line, and save.

> "I can edit anything. Editing returns the draft to review, so approval is always
> explicit."

Click **Approve**, then **Send approved**.

> "Sending goes through the private demo outbox unless Gmail is configured. The
> daily limit is enforced, and every message carries sender identification and an
> unsubscribe line."

Point at the follow-up card.

> "Follow-ups are scheduled at day 4 and day 6. They stop the moment a reply,
> decline or opt-out arrives. The seeded workspace has three due today; I can run
> the check now."

Click **Run follow-up check**.

## 4:05–5:05 — Inbox: classify, draft, approve

**Screen:** Inbox → **Needs you**.

> "Incoming replies are classified into interested, pricing, collaboration,
> not interested, opt-out, question or other. The original message, the AI read,
> and a suggested next action sit together."

Select **Tara Menon**.

> "Tara is interested at 94% confidence and wants scope plus a rate range. The
> draft answers with two concrete options and a low-pressure call to action."

Edit one sentence if you like. Click **Approve & send**.

> "Sending updates Tara to Interested, marks the thread handled, and stops any
> further follow-ups."

Click **Simulate a reply** (top right) and paste:

```text
This sounds lovely. Could you share the budget for one reel and three stories?
```

Choose a creator and submit.

> "This is a safe way to demonstrate the reply loop without a real inbox. The
> classifier returns Pricing, the status updates, and a new draft appears for
> approval. Nothing is sent automatically."

## 5:05–5:45 — Settings and the production path

**Screen:** Settings.

> "The brand brief is the single source of truth. Changing the tone, offer or
> sender changes every future score and draft. The sending rhythm controls the
> daily cap and both follow-up intervals."

Point at **Connections**.

> "Claude is optional: add an Anthropic key or use Vercel AI Gateway. Gmail is
> optional: add OAuth credentials and the same actions send real mail. The
> workspace is stored in a private Vercel Blob store in production, or a local
> file in development."

Scroll to **Automation & export**.

> "A protected cron endpoint runs the daily reply check and follow-up pass. There
> is also an n8n workflow export for teams that already live in n8n."

## 5:45–6:00 — Close

**Screen:** Overview or Guide.

> "That is the full loop: research, collect public contacts, screen with AI, keep
> a clean CRM, send personalised email, follow up, classify replies and draft the
> next response — with a human approving every relationship-changing message."

## Reset after recording

**Settings → Reset demo workspace** restores the 15 seeded records and removes
the test sends. Do this before handing over the demo link.
