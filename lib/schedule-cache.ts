import type { SchedulePayload } from "@/lib/types";

const CACHE_VERSION = 1;

type ScheduleCache = {
  version: number;
  teamId: string;
  savedAt: string;
  data: SchedulePayload;
};

function cacheKey(teamId: string) {
  return `icea-schedule-cache:${teamId}`;
}

export function readCachedSchedule(teamId: string) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(cacheKey(teamId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ScheduleCache>;
    if (parsed.version !== CACHE_VERSION || parsed.teamId !== teamId || !parsed.data) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function writeCachedSchedule(data: SchedulePayload) {
  if (typeof window === "undefined") return;
  try {
    const payload: ScheduleCache = {
      version: CACHE_VERSION,
      teamId: data.team.id,
      savedAt: new Date().toISOString(),
      data,
    };
    window.localStorage.setItem(cacheKey(data.team.id), JSON.stringify(payload));
  } catch {
    // Si el navegador bloquea localStorage, la app sigue funcionando con Firestore.
  }
}
