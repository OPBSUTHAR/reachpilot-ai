import { STATUS_META } from "@/lib/constants";
import { readWorkspace } from "@/lib/store";
import { toCsv } from "@/lib/utils";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "leads";
  const state = await readWorkspace();

  let rows: Array<Record<string, string | number | null | undefined>> = [];
  if (type === "outreach") {
    rows = state.threads
      .flatMap((thread) =>
        thread.messages
          .filter((message) => message.direction === "outbound")
          .map((message) => {
            const lead = state.leads.find((item) => item.id === message.leadId);
            return {
              creator: lead?.name ?? "",
              username: lead?.username ?? "",
              email: lead?.email ?? "",
              kind: message.kind,
              status: message.status,
              subject: message.subject,
              body: message.body,
              created_at: message.createdAt,
              approved_at: message.approvedAt ?? "",
              sent_at: message.sentAt ?? "",
              provider: message.provider ?? "",
              ai_generated: message.ai ? "yes" : "no",
            };
          }),
      );
  } else if (type === "replies") {
    rows = state.threads
      .filter((thread) => thread.messages.some((message) => message.direction === "inbound"))
      .map((thread) => {
        const lead = state.leads.find((item) => item.id === thread.leadId);
        const inbound = [...thread.messages].reverse().find((message) => message.direction === "inbound");
        return {
          creator: lead?.name ?? "",
          username: lead?.username ?? "",
          email: lead?.email ?? "",
          subject: thread.subject,
          classification: thread.category ?? "",
          confidence: thread.confidence ?? "",
          summary: thread.replySummary ?? "",
          suggested_action: thread.suggestedAction ?? "",
          latest_reply: inbound?.body ?? "",
          received_at: inbound?.createdAt ?? "",
          handled: thread.handled ? "yes" : "no",
          crm_status: lead ? STATUS_META[lead.status].label : "",
        };
      });
  } else {
    rows = state.leads.map((lead) => ({
      name: lead.name,
      username: lead.username,
      profile_url: lead.profileUrl,
      niche: lead.niche,
      followers: lead.followers,
      public_business_email: lead.email ?? "",
      location: lead.location,
      fit_score: lead.score,
      tier: lead.tier,
      status: STATUS_META[lead.status].label,
      tags: lead.tags.join(" | "),
      summary: lead.summary,
      last_contacted_at: lead.lastContactedAt ?? "",
      next_follow_up_at: lead.nextFollowUpAt ?? "",
      follow_ups_sent: lead.followUpCount,
      replied_at: lead.repliedAt ?? "",
      notes: lead.notes,
      added_at: lead.addedAt,
    }));
  }

  const csv = toCsv(rows);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="reachpilot-${type}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}
