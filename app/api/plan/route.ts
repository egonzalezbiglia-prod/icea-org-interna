import { NextResponse } from "next/server";
import { editKeyFromRequest, verifyEditKey } from "@/lib/auth";
import { updatePlan } from "@/lib/repositories";
import { planSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!verifyEditKey(editKeyFromRequest(request, body))) {
    return NextResponse.json({ error: "Clave de admin requerida" }, { status: 403 });
  }

  const parsed = planSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos invalidos" }, { status: 400 });
  }

  return NextResponse.json({ plan: await updatePlan(parsed.data) });
}
