import type { CongressDates, Day, DayId, Position, Slot, Team, TeamSettings } from "@/lib/types";

export const DAYS: Day[] = [
  { id: "jueves", label: "Jueves" },
  { id: "viernes", label: "Viernes" },
  { id: "sabado", label: "Sabado" },
];

export const DEFAULT_IDEAL_COVERAGE = 40;
export const DEFAULT_MINIMUM_COVERAGE = 30;

const DEFAULT_TIMES_BY_DAY: Record<DayId, [string, string][]> = {
  jueves: [
    ["13:00", "15:00"],
    ["15:00", "18:00"],
    ["18:00", "20:00"],
    ["20:00", "22:00"],
  ],
  viernes: [
    ["08:00", "11:00"],
    ["11:00", "13:00"],
    ["13:00", "15:00"],
    ["15:00", "18:00"],
    ["18:00", "20:00"],
    ["20:00", "23:00"],
  ],
  sabado: [
    ["08:00", "11:00"],
    ["11:00", "13:00"],
    ["13:00", "15:00"],
    ["15:00", "18:00"],
    ["18:00", "20:00"],
    ["20:00", "23:00"],
  ],
};

export const SLOTS: Slot[] = DAYS.flatMap((day) =>
  DEFAULT_TIMES_BY_DAY[day.id].map(([start, end]) => ({
    id: `${day.id}-${start.replace(":", "")}`,
    dayId: day.id,
    start,
    end,
    label: `${start} - ${end}`,
    idealCoverage: DEFAULT_IDEAL_COVERAGE,
    minimumCoverage: DEFAULT_MINIMUM_COVERAGE,
  })),
);

export const POSITIONS: Position[] = Array.from({ length: 24 }, (_, index) => {
  const id = index + 1;
  return {
    id,
    name: `Posicion ${id}`,
  };
});

export function assignmentId(dayId: DayId, slotId: string, positionId: number) {
  return `${dayId}__${slotId}__${positionId}`;
}

export function normalizeSearch(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export const COUNTRIES = [
  { code: "AR", label: "Argentina", dialCode: "54" },
  { code: "UY", label: "Uruguay", dialCode: "598" },
  { code: "PY", label: "Paraguay", dialCode: "595" },
  { code: "CL", label: "Chile", dialCode: "56" },
  { code: "BR", label: "Brasil", dialCode: "55" },
  { code: "BO", label: "Bolivia", dialCode: "591" },
] as const;

export function minutesFromTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function hoursBetween(start: string, end: string) {
  return Math.max(0, (minutesFromTime(end) - minutesFromTime(start)) / 60);
}

export function cleanPhone(value: string) {
  return value.replace(/\D/g, "");
}

export function whatsappUrl(dialCode: string, phone: string) {
  const digits = cleanPhone(phone);
  return digits ? `https://wa.me/${dialCode}${digits}` : "";
}

export const DEFAULT_TEAM_ID = "organizacion-interna";

// Fechas por defecto del congreso ICEA 2026 (jueves, viernes y sabado).
export const FECHAS_CONGRESO: CongressDates = {
  jueves: "2026-08-13",
  viernes: "2026-08-14",
  sabado: "2026-08-15",
};

export const DEFAULT_TEAMS: Team[] = [
  { id: "organizacion-interna", name: "Organización Interna", description: "Equipo de servidores y ujieres", icon: "users", congressDates: FECHAS_CONGRESO, active: true, createdAt: null, updatedAt: null },
  { id: "tecnica", name: "Técnica", description: "Equipo técnico", icon: "sliders", congressDates: FECHAS_CONGRESO, active: true, createdAt: null, updatedAt: null },
];

export const DEFAULT_TEAM_SETTINGS: TeamSettings = {
  maxConsecutiveShifts: 2,
  blockAfterMaxConsecutive: true,
  allowPartialAvailability: true,
  warnPartialAvailability: true,
  preventSameSlotDuplicate: true,
  updatedAt: null,
};

export function slugifyTeamId(value: string) {
  return normalizeSearch(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "equipo";
}

// Fecha del dispositivo en formato YYYY-MM-DD (hora local).
function fechaLocalIso(fecha: Date) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

// Etiqueta corta "DD/MM" para el riel de dias.
export function fechaCortaDia(dayId: DayId, congressDates: CongressDates = FECHAS_CONGRESO) {
  const iso = congressDates[dayId] || FECHAS_CONGRESO[dayId];
  if (!iso) return "";
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

// Dia del congreso en curso segun la fecha del dispositivo, o null fuera del evento.
export function diaEnCurso(ahora: Date = new Date(), congressDates: CongressDates = FECHAS_CONGRESO): DayId | null {
  const hoy = fechaLocalIso(ahora);
  return (Object.keys(congressDates) as DayId[]).find((dayId) => (congressDates[dayId] || FECHAS_CONGRESO[dayId]) === hoy) ?? null;
}

// Id del slot que esta ocurriendo ahora mismo, o null si no hay ninguno en curso.
export function slotEnCurso(slots: Slot[], ahora: Date = new Date(), congressDates: CongressDates = FECHAS_CONGRESO): string | null {
  const dayId = diaEnCurso(ahora, congressDates);
  if (!dayId) return null;
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const slot = slots.find(
    (item) =>
      item.dayId === dayId &&
      minutesFromTime(item.start) <= minutosAhora &&
      minutosAhora < minutesFromTime(item.end),
  );
  return slot ? slot.id : null;
}

// Ids de iconos elegibles para un equipo (deben coincidir con el catalogo de team-icon.tsx).
export const IDS_ICONOS_EQUIPO = [
  "users",
  "sliders",
  "music",
  "mic",
  "video",
  "camera",
  "megaphone",
  "door",
  "serve",
  "church",
  "shield",
  "book",
  "kitchen",
  "kids",
  "sparkles",
  "flame",
] as const;

export type IconoEquipoId = (typeof IDS_ICONOS_EQUIPO)[number];

export function esIconoEquipo(value: unknown): value is IconoEquipoId {
  return typeof value === "string" && (IDS_ICONOS_EQUIPO as readonly string[]).includes(value);
}
