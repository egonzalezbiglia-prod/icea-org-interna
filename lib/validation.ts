import { z } from "zod";
import { COUNTRIES, DAYS, assignmentId } from "@/lib/domain";
import type { CountryCode, DayId } from "@/lib/types";

const dayIds = new Set(DAYS.map((day) => day.id));
const countryCodes = new Set(COUNTRIES.map((country) => country.code));
const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, "Usa formato HH:MM");

export const assignmentSchema = z
  .object({
    dayId: z.string(),
    slotId: z.string().min(1),
    positionId: z.number().int().positive(),
    serverId: z.string().nullable().optional(),
    editKey: z.string().optional(),
    actorName: z.string().max(80).optional(),
  })
  .superRefine((value, context) => {
    if (!dayIds.has(value.dayId as DayId)) context.addIssue({ code: "custom", message: "Dia invalido", path: ["dayId"] });
  })
  .transform((value) => ({
    ...value,
    serverId: value.serverId || null,
    id: assignmentId(value.dayId as DayId, value.slotId, value.positionId),
  }));

export const planSchema = z.object({
  imageUrl: z.string().url().nullable().or(z.literal("")).transform((value) => value || null),
  note: z.string().max(500).nullable().optional().transform((value) => value || null),
  editKey: z.string().optional(),
});

const slotSchema = z.object({
  id: z.string().optional(),
  dayId: z.string().refine((value) => dayIds.has(value as DayId), "Dia invalido").transform((value) => value as DayId),
  start: timeSchema,
  end: timeSchema,
});

const positionSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().max(80),
});

const availabilitySchema = z.object({
  id: z.string().min(1),
  dayId: z.string().refine((value) => dayIds.has(value as DayId), "Dia invalido").transform((value) => value as DayId),
  start: timeSchema,
  end: timeSchema,
});

const settingsSchema = z.object({
  maxConsecutiveShifts: z.number().int().min(1).max(12),
  blockAfterMaxConsecutive: z.boolean(),
  allowPartialAvailability: z.boolean(),
  warnPartialAvailability: z.boolean(),
  preventSameSlotDuplicate: z.boolean(),
});

const teamSchema = z.object({
  id: z.string().max(80).optional(),
  name: z.string().min(1, "Nombre requerido").max(100),
  description: z.string().max(160).nullable().optional(),
  active: z.boolean().default(true),
});

const serverSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(1, "Nombre requerido").max(120),
  whatsapp: z.string().max(40).default(""),
  countryCode: z.string().refine((value) => countryCodes.has(value as CountryCode), "Pais invalido").transform((value) => value as CountryCode),
  active: z.boolean().default(true),
  availability: z.array(availabilitySchema).default([]),
});

export const configSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("upsertSlot"), slot: slotSchema, editKey: z.string().optional() }),
  z.object({ type: z.literal("deleteSlot"), slotId: z.string().min(1), editKey: z.string().optional() }),
  z.object({ type: z.literal("upsertPosition"), position: positionSchema, editKey: z.string().optional() }),
  z.object({ type: z.literal("deletePosition"), positionId: z.number().int().positive(), editKey: z.string().optional() }),
  z.object({ type: z.literal("upsertServer"), server: serverSchema, editKey: z.string().optional() }),
  z.object({ type: z.literal("deleteServer"), serverId: z.string().min(1), editKey: z.string().optional() }),
  z.object({ type: z.literal("updateSettings"), settings: settingsSchema, editKey: z.string().optional() }),
]);

export const masterSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("upsertTeam"), team: teamSchema, masterKey: z.string().optional() }),
]);
