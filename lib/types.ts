export type DayId = "jueves" | "viernes" | "sabado";
export type CountryCode = "AR" | "UY" | "PY" | "CL" | "BR" | "BO";

export type Day = {
  id: DayId;
  label: string;
};

export type Slot = {
  id: string;
  dayId: DayId;
  start: string;
  end: string;
  label: string;
};

export type Position = {
  id: number;
  name: string;
};

export type AvailabilityRange = {
  id: string;
  dayId: DayId;
  start: string;
  end: string;
};

export type Server = {
  id: string;
  fullName: string;
  whatsapp: string;
  countryCode: CountryCode;
  dialCode: string;
  active: boolean;
  availability: AvailabilityRange[];
  createdAt: string | null;
  updatedAt: string | null;
};

export type Assignment = {
  id: string;
  dayId: DayId;
  slotId: string;
  positionId: number;
  serverId: string | null;
  serverName: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type Plan = {
  imageUrl: string | null;
  note: string | null;
  updatedAt: string | null;
};

export type SchedulePayload = {
  days: Day[];
  slots: Slot[];
  positions: Position[];
  servers: Server[];
  assignments: Assignment[];
  plan: Plan;
};
