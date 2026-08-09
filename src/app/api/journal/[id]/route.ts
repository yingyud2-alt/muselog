import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * DELETE /api/journal/[id]
 * Removes a Journal Entry / Memory record only.
 * Does not delete Work objects or Library state.
 *
 * Persistence for this app is client-side (local journal store);
 * this route is the API contract the calendar delete flow calls first.
 */
export async function DELETE(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = decodeURIComponent(rawId ?? "").trim();

  if (!id) {
    return NextResponse.json(
      { ok: false, error: "missing_id" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    id,
    deleted: true,
  });
}
