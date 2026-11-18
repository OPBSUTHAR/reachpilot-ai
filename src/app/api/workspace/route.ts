import { engineLabel } from "@/lib/ai";
import { gmailConfig } from "@/lib/email";
import { readWorkspace, storageMode } from "@/lib/store";

export async function GET() {
  try {
    const state = await readWorkspace();
    return Response.json({
      state,
      meta: {
        engine: engineLabel(),
        email: gmailConfig(),
        storage: storageMode(),
        demoMode: state.settings.demoMode,
        now: new Date().toISOString(),
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Could not load the workspace",
      },
      { status: 500 },
    );
  }
}
