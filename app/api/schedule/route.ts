import { NextResponse } from "next/server";
import { actorFromRequest, editKeyFromRequest, verifyEditKey } from "@/lib/auth";
import { DEFAULT_TEAM_ID } from "@/lib/domain";
import { AssignmentConflictError, getSchedulePayload, updatePublicAssignmentSnapshot, upsertAssignment } from "@/lib/repositories";
import { assignmentSchema } from "@/lib/validation";

const SCHEDULE_CLIENT_HEADER = "x-icea-schedule-client";
const SCHEDULE_CLIENT_VALUE = "schedule-ui";
const SCHEDULE_CLIENT_COOKIE = "icea_schedule_client=1";

function teamIdFromRequest(request: Request, body?: Record<string, unknown>) {
  const url = new URL(request.url);
  const raw = body?.teamId ?? url.searchParams.get("teamId") ?? DEFAULT_TEAM_ID;
  return typeof raw === "string" && raw.trim() ? raw.trim() : DEFAULT_TEAM_ID;
}

function teamIdFromGetRequest(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get("teamId");
  return raw?.trim() || null;
}

function isAllowedScheduleClient(request: Request) {
  if (request.headers.get(SCHEDULE_CLIENT_HEADER) === SCHEDULE_CLIENT_VALUE) return true;
  return request.headers.get("cookie")?.split(";").some((cookie) => cookie.trim() === SCHEDULE_CLIENT_COOKIE) ?? false;
}

export async function GET(request: Request) {
  if (!isAllowedScheduleClient(request)) {
    return NextResponse.json(
      { error: "Cliente no autorizado" },
      {
        status: 403,
        headers: {
          "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  }

  const teamId = teamIdFromGetRequest(request);
  if (!teamId) {
    return NextResponse.json(
      { error: "teamId requerido" },
      {
        status: 400,
        headers: {
          "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  }

  return NextResponse.json(await getSchedulePayload(teamId), {
    headers: {
      "cache-control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!verifyEditKey(editKeyFromRequest(request, body))) return NextResponse.json({ error: "Clave de admin requerida" }, { status: 403 });
  const parsed = assignmentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos invalidos" }, { status: 400 });
  const teamId = teamIdFromRequest(request, body);
  try {
    const assignment = await upsertAssignment(teamId, { ...parsed.data, actor: actorFromRequest(request, body) });
    await updatePublicAssignmentSnapshot(teamId, assignment);
    return NextResponse.json({ assignment });
  } catch (error) {
    if (error instanceof AssignmentConflictError) return NextResponse.json({ error: error.message }, { status: 409 });
    throw error;
  }
}
