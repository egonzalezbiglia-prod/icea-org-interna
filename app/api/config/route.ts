import { NextResponse } from "next/server";
import { editKeyFromRequest, verifyEditKey } from "@/lib/auth";
import { getSchedulePayload, upsertSlot, deleteSlot, upsertPosition, deletePosition, upsertServer, deleteServer } from "@/lib/repositories";
import { configSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!verifyEditKey(editKeyFromRequest(request, body))) {
    return NextResponse.json({ error: "Clave de admin requerida" }, { status: 403 });
  }

  const parsed = configSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos invalidos" }, { status: 400 });
  }

  if (parsed.data.type === "upsertSlot") await upsertSlot(parsed.data.slot);
  if (parsed.data.type === "deleteSlot") await deleteSlot(parsed.data.slotId);
  if (parsed.data.type === "upsertPosition") await upsertPosition(parsed.data.position);
  if (parsed.data.type === "deletePosition") await deletePosition(parsed.data.positionId);
  if (parsed.data.type === "upsertServer") await upsertServer(parsed.data.server);
  if (parsed.data.type === "deleteServer") await deleteServer(parsed.data.serverId);

  return NextResponse.json(await getSchedulePayload());
}
