import { engineLabel } from "@/lib/ai";
import { gmailConfig } from "@/lib/email";
import { readWorkspace, storageMode } from "@/lib/store";

export async function GET() {
  try {
    const state = await readWorkspace();
    return Response.json({
      ok: true,
      app: "ReachPilot",
      engine: engineLabel(),
      gmail: gmailConfig(),
      storage: storageMode(),
      leads: state.leads.length,
      threads: state.threads.length,
      demoMode: state.settings.demoMode,
      updatedAt: state.updatedAt,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Health check failed",
      },
      { status: 500 },
    );
  }
}
