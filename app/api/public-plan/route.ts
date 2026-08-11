import { NextResponse } from "next/server";
import { DEFAULT_TEAM_ID } from "@/lib/domain";
import { getPlan } from "@/lib/repositories";

const SCHEDULE_CLIENT_HEADER = "x-icea-schedule-client";
const SCHEDULE_CLIENT_VALUE = "schedule-ui";
const SCHEDULE_CLIENT_COOKIE = "icea_schedule_client=1";

function isAllowedScheduleClient(request: Request) {
  if (request.headers.get(SCHEDULE_CLIENT_HEADER) === SCHEDULE_CLIENT_VALUE) return true;
  return request.headers.get("cookie")?.split(";").some((cookie) => cookie.trim() === SCHEDULE_CLIENT_COOKIE) ?? false;
}

export async function GET(request: Request) {
  if (!isAllowedScheduleClient(request)) return NextResponse.json({ error: "Cliente no autorizado" }, { status: 403 });

  const teamId = new URL(request.url).searchParams.get("teamId")?.trim() || DEFAULT_TEAM_ID;
  return NextResponse.json({ plan: await getPlan(teamId) }, {
    headers: {
      "cache-control": "private, no-store",
    },
  });
}
