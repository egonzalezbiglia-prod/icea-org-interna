import { NextResponse } from "next/server";
import { actorFromRequest, editKeyFromRequest, verifyEditKey } from "@/lib/auth";
import { getSchedulePayload, upsertAssignment } from "@/lib/repositories";
import { assignmentSchema } from "@/lib/validation";

export async function GET() {
  return NextResponse.json(await getSchedulePayload());
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!verifyEditKey(editKeyFromRequest(request, body))) {
    return NextResponse.json({ error: "Clave de admin requerida" }, { status: 403 });
  }

  const parsed = assignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos invalidos" }, { status: 400 });
  }

  const assignment = await upsertAssignment({
    ...parsed.data,
    actor: actorFromRequest(request, body),
  });
  return NextResponse.json({ assignment });
}
