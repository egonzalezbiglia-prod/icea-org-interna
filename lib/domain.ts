import type { Day, DayId, Position, PositionArea, Slot } from "@/lib/types";

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

const AREAS: PositionArea[] = [
  "Ingreso",
  "Ingreso",
  "Ingreso",
  "Ingreso",
  "Auditorio",
  "Auditorio",
  "Auditorio",
  "Auditorio",
  "Auditorio",
  "Auditorio",
  "Auditorio",
  "Auditorio",
  "Pasillos",
  "Pasillos",
  "Pasillos",
  "Pasillos",
  "Pasillos",
  "Pasillos",
  "Apoyo",
  "Apoyo",
  "Apoyo",
  "Apoyo",
  "Apoyo",
  "Apoyo",
];

export const POSITIONS: Position[] = Array.from({ length: 24 }, (_, index) => {
  const id = index + 1;
  const area = AREAS[index];
  return {
    id,
    area,
    name: `Posicion ${id}`,
    note:
      area === "Auditorio"
        ? "Atencion durante programa y movimiento entre filas."
        : area === "Ingreso"
          ? "Recepcion, orientacion y flujo de entrada."
          : area === "Pasillos"
            ? "Circulacion, orden y acompanamiento discreto."
            : "Soporte para necesidades puntuales del equipo.",
  };
});

export const POSITION_AREAS: Array<"Todas" | PositionArea> = [
  "Todas",
  "Ingreso",
  "Auditorio",
  "Pasillos",
  "Apoyo",
];

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
