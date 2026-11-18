import { runAction } from "@/lib/actions";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      type?: unknown;
      payload?: unknown;
    };
    if (typeof body.type !== "string" || body.type.length === 0) {
      return Response.json({ error: "An action type is required" }, { status: 400 });
    }
    const payload =
      body.payload && typeof body.payload === "object"
        ? (body.payload as Record<string, unknown>)
        : {};
    const outcome = await runAction(body.type, payload);
    return Response.json(outcome, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "The action could not be completed",
      },
      { status: 400 },
    );
  }
}
