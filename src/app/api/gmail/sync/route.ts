import { runAction } from "@/lib/actions";
import { gmailConfig } from "@/lib/email";

export async function POST() {
  const config = gmailConfig();
  if (!config.configured) {
    return Response.json(
      {
        ok: false,
        imported: 0,
        note: "Gmail is not connected. Add the Gmail OAuth environment variables in Settings to enable live reply sync.",
      },
      { status: 200 },
    );
  }
  try {
    const outcome = await runAction("replies.sync", {});
    return Response.json({ ok: true, ...(outcome.result as object) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Gmail sync failed" },
      { status: 500 },
    );
  }
}
