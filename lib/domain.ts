import type { Day, DayId, Position, Slot, Team, TeamSettings } from "@/lib/types";

export const DAYS: Day[] = [
  { id: "jueves", label: "Jueves" },
  { id: "viernes", label: "Viernes" },
  { id: "sabado", label: "Sabado" },
];

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

export const DEFAULT_TEAMS: Team[] = [
  { id: "organizacion-interna", name: "Organización Interna", description: "Equipo de servidores y ujieres", active: true, createdAt: null, updatedAt: null },
  { id: "tecnica", name: "Técnica", description: "Equipo técnico", active: true, createdAt: null, updatedAt: null },
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
