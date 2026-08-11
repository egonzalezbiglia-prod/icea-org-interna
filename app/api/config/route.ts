import { NextResponse } from "next/server";
import { editKeyFromRequest, verifyEditKey } from "@/lib/auth";
import { DEFAULT_TEAM_ID } from "@/lib/domain";
import { getSchedulePayload, writePublicScheduleSnapshot, upsertSlot, deleteSlot, upsertPosition, deletePosition, upsertServer, importServers, deleteServer, updateTeamSettings } from "@/lib/repositories";
import { configSchema } from "@/lib/validation";

function teamIdFromRequest(request: Request, body?: Record<string, unknown>) {
  const url = new URL(request.url);
  const raw = body?.teamId ?? url.searchParams.get("teamId") ?? DEFAULT_TEAM_ID;
  return typeof raw === "string" && raw.trim() ? raw.trim() : DEFAULT_TEAM_ID;
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!verifyEditKey(editKeyFromRequest(request, body))) return NextResponse.json({ error: "Clave de admin requerida" }, { status: 403 });
  const parsed = configSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos invalidos" }, { status: 400 });
  const teamId = teamIdFromRequest(request, body);
  if (parsed.data.type === "upsertSlot") await upsertSlot(teamId, parsed.data.slot);
  if (parsed.data.type === "deleteSlot") await deleteSlot(teamId, parsed.data.slotId);
  if (parsed.data.type === "upsertPosition") await upsertPosition(teamId, parsed.data.position);
  if (parsed.data.type === "deletePosition") await deletePosition(teamId, parsed.data.positionId);
  if (parsed.data.type === "upsertServer") await upsertServer(teamId, parsed.data.server);
  if (parsed.data.type === "importServers") await importServers(teamId, parsed.data.servers);
  if (parsed.data.type === "deleteServer") await deleteServer(teamId, parsed.data.serverId);
  if (parsed.data.type === "updateSettings") await updateTeamSettings(teamId, parsed.data.settings);
  const payload = await getSchedulePayload(teamId);
  await writePublicScheduleSnapshot(payload);
  return NextResponse.json(payload);
}
