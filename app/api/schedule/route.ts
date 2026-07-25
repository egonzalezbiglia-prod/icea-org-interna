import { NextResponse } from "next/server";
import { actorFromRequest, editKeyFromRequest, verifyEditKey } from "@/lib/auth";
import { DEFAULT_TEAM_ID } from "@/lib/domain";
import { getSchedulePayload, upsertAssignment } from "@/lib/repositories";
import { assignmentSchema } from "@/lib/validation";

function teamIdFromRequest(request: Request, body?: Record<string, unknown>) {
  const url = new URL(request.url);
  const raw = body?.teamId ?? url.searchParams.get("teamId") ?? DEFAULT_TEAM_ID;
  return typeof raw === "string" && raw.trim() ? raw.trim() : DEFAULT_TEAM_ID;
}

export async function GET(request: Request) {
  return NextResponse.json(await getSchedulePayload(teamIdFromRequest(request)));
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!verifyEditKey(editKeyFromRequest(request, body))) return NextResponse.json({ error: "Clave de admin requerida" }, { status: 403 });
  const parsed = assignmentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos invalidos" }, { status: 400 });
  const assignment = await upsertAssignment(teamIdFromRequest(request, body), { ...parsed.data, actor: actorFromRequest(request, body) });
  return NextResponse.json({ assignment });
}
