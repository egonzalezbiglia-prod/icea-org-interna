import { NextResponse } from "next/server";
import { masterKeyFromRequest, verifyMasterKey } from "@/lib/auth";
import { listTeams, refreshPublicScheduleSnapshot, upsertTeam } from "@/lib/repositories";
import { masterSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!verifyMasterKey(url.searchParams.get("masterKey"))) return NextResponse.json({ error: "Clave master requerida" }, { status: 403 });
  return NextResponse.json({ teams: await listTeams() });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!verifyMasterKey(masterKeyFromRequest(request, body))) return NextResponse.json({ error: "Clave master requerida" }, { status: 403 });
  const parsed = masterSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos invalidos" }, { status: 400 });
  if (parsed.data.type === "upsertTeam") {
    const team = await upsertTeam(parsed.data.team);
    await refreshPublicScheduleSnapshot(team.id);
  }
  return NextResponse.json({ teams: await listTeams() });
}
