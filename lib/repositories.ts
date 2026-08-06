import type { CollectionReference, DocumentData, DocumentSnapshot, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { COUNTRIES, DAYS, DEFAULT_TEAM_ID, DEFAULT_TEAM_SETTINGS, DEFAULT_TEAMS, FECHAS_CONGRESO, POSITIONS, SLOTS, cleanPhone, normalizeSearch, slugifyTeamId } from "@/lib/domain";
import { getDb, hasFirebaseConfig, Timestamp } from "@/lib/firebase-admin";
import type { Assignment, AvailabilityRange, CongressDates, CountryCode, DayId, Plan, Position, SchedulePayload, Server, Slot, Team, TeamSettings } from "@/lib/types";

function timestampToString(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return null;
}

function normalizeCongressDates(value: unknown): CongressDates {
  const raw = typeof value === "object" && value ? value as Partial<CongressDates> : {};
  return {
    jueves: raw.jueves || FECHAS_CONGRESO.jueves,
    viernes: raw.viernes || FECHAS_CONGRESO.viernes,
    sabado: raw.sabado || FECHAS_CONGRESO.sabado,
  };
}

function fallbackTeam(teamId: string): Team {
  return DEFAULT_TEAMS.find((team) => team.id === teamId) ?? { id: teamId, name: teamId, description: null, icon: null, congressDates: FECHAS_CONGRESO, active: true, createdAt: null, updatedAt: null };
}

function teamFromDoc(doc: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>): Team {
  const data = doc.data();
  if (!data) return fallbackTeam(doc.id);
  return {
    id: doc.id,
    name: data.name ?? doc.id,
    description: data.description ?? null,
    // Si el doc todavia no tiene icono, cae al de los equipos por defecto (o null).
    icon: data.icon ?? DEFAULT_TEAMS.find((team) => team.id === doc.id)?.icon ?? null,
    congressDates: normalizeCongressDates(data.congressDates),
    active: data.active !== false,
    createdAt: timestampToString(data.createdAt),
    updatedAt: timestampToString(data.updatedAt),
  };
}

function settingsFromData(data: DocumentData | undefined): TeamSettings {
  return {
    maxConsecutiveShifts: Number(data?.maxConsecutiveShifts ?? DEFAULT_TEAM_SETTINGS.maxConsecutiveShifts),
    blockAfterMaxConsecutive: data?.blockAfterMaxConsecutive ?? DEFAULT_TEAM_SETTINGS.blockAfterMaxConsecutive,
    allowPartialAvailability: data?.allowPartialAvailability ?? DEFAULT_TEAM_SETTINGS.allowPartialAvailability,
    warnPartialAvailability: data?.warnPartialAvailability ?? DEFAULT_TEAM_SETTINGS.warnPartialAvailability,
    preventSameSlotDuplicate: data?.preventSameSlotDuplicate ?? DEFAULT_TEAM_SETTINGS.preventSameSlotDuplicate,
    updatedAt: timestampToString(data?.updatedAt),
  };
}

function assignmentFromDoc(doc: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>): Assignment {
  const data = doc.data();
  if (!data) throw new Error("Documento de turno vacio");
  return {
    id: doc.id,
    dayId: data.dayId,
    slotId: data.slotId,
    positionId: Number(data.positionId),
    serverId: data.serverId ?? null,
    serverName: data.serverName ?? data.usherName ?? null,
    updatedAt: timestampToString(data.updatedAt),
    updatedBy: data.updatedBy ?? null,
  };
}

function slotFromDoc(doc: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>): Slot {
  const data = doc.data();
  if (!data) throw new Error("Documento de horario vacio");
  return {
    id: doc.id,
    dayId: data.dayId,
    start: data.start,
    end: data.end,
    label: data.label ?? `${data.start} - ${data.end}`,
  };
}

function positionFromDoc(doc: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>): Position {
  const data = doc.data();
  if (!data) throw new Error("Documento de posicion vacio");
  return {
    id: Number(data.id ?? doc.id),
    name: data.name,
  };
}

function serverFromDoc(doc: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>): Server {
  const data = doc.data();
  if (!data) throw new Error("Documento de servidor vacio");
  const countryCode = (data.countryCode ?? "AR") as CountryCode;
  const country = COUNTRIES.find((item) => item.code === countryCode) ?? COUNTRIES[0];
  return {
    id: doc.id,
    fullName: data.fullName,
    whatsapp: data.whatsapp ?? "",
    countryCode,
    dialCode: data.dialCode ?? country.dialCode,
    active: data.active !== false,
    availability: Array.isArray(data.availability) ? data.availability : [],
    createdAt: timestampToString(data.createdAt),
    updatedAt: timestampToString(data.updatedAt),
  };
}

function teamDoc(teamId: string) {
  return getDb().collection("teams").doc(teamId);
}

function teamCollection(teamId: string, name: string): CollectionReference<DocumentData> {
  return teamDoc(teamId).collection(name);
}


function mergeById<T extends { id: string | number }>(primary: T[], fallback: T[]) {
  const map = new Map<string, T>();
  fallback.forEach((item) => map.set(String(item.id), item));
  primary.forEach((item) => map.set(String(item.id), item));
  return Array.from(map.values());
}

async function rootFallback<T>(teamId: string, collectionName: string, mapper: (doc: QueryDocumentSnapshot<DocumentData>) => T) {
  if (teamId !== DEFAULT_TEAM_ID) return [];
  const snapshot = await getDb().collection(collectionName).get();
  return snapshot.docs.map(mapper);
}

export async function listTeams() {
  if (!hasFirebaseConfig()) return DEFAULT_TEAMS;
  const snapshot = await getDb().collection("teams").get();
  const fromDb = snapshot.docs.map(teamFromDoc);
  const merged = new Map<string, Team>();
  DEFAULT_TEAMS.forEach((team) => merged.set(team.id, team));
  fromDb.forEach((team) => merged.set(team.id, team));
  return Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name, "es"));
}

export async function getTeam(teamId: string) {
  if (!hasFirebaseConfig()) return fallbackTeam(teamId);
  const doc = await teamDoc(teamId).get();
  return doc.exists ? teamFromDoc(doc) : fallbackTeam(teamId);
}

export async function upsertTeam(input: { id?: string; name: string; description?: string | null; icon?: string | null; congressDates?: CongressDates; active?: boolean }) {
  if (!hasFirebaseConfig()) throw new Error("Firebase no esta configurado.");
  const id = input.id ? slugifyTeamId(input.id) : slugifyTeamId(input.name);
  const ref = teamDoc(id);
  const existing = await ref.get();
  await ref.set({
    name: input.name.trim(),
    description: input.description?.trim() || null,
    icon: input.icon ?? null,
    congressDates: normalizeCongressDates(input.congressDates),
    active: input.active !== false,
    createdAt: existing.exists ? existing.data()?.createdAt : Timestamp.now(),
    updatedAt: Timestamp.now(),
  }, { merge: true });
  await seedTeamDefaults(id);
  return teamFromDoc(await ref.get());
}

export async function getTeamSettings(teamId: string) {
  if (!hasFirebaseConfig()) return DEFAULT_TEAM_SETTINGS;
  const doc = await teamCollection(teamId, "settings").doc("rules").get();
  return settingsFromData(doc.data());
}

export async function updateTeamSettings(teamId: string, input: Omit<TeamSettings, "updatedAt">) {
  if (!hasFirebaseConfig()) throw new Error("Firebase no esta configurado.");
  await teamCollection(teamId, "settings").doc("rules").set({ ...input, updatedAt: Timestamp.now() }, { merge: true });
  return getTeamSettings(teamId);
}

export async function listAssignments(teamId = DEFAULT_TEAM_ID) {
  if (!hasFirebaseConfig()) return [];
  const snapshot = await teamCollection(teamId, "assignments").get();
  const assignments = snapshot.docs.map(assignmentFromDoc);
  const fallback = await rootFallback(teamId, "assignments", assignmentFromDoc);
  return mergeById(assignments, fallback).sort((a, b) => a.id.localeCompare(b.id));
}

export async function listSlots(teamId = DEFAULT_TEAM_ID) {
  if (!hasFirebaseConfig()) return SLOTS;
  const snapshot = await teamCollection(teamId, "slots").get();
  const slots = snapshot.docs.map(slotFromDoc);
  const fallback = await rootFallback(teamId, "slots", slotFromDoc);
  const merged = mergeById(slots, fallback);
  return (merged.length ? merged : SLOTS).sort((a, b) => {
    const dayOrder = DAYS.findIndex((day) => day.id === a.dayId) - DAYS.findIndex((day) => day.id === b.dayId);
    if (dayOrder !== 0) return dayOrder;
    return a.start.localeCompare(b.start);
  });
}

export async function listPositions(teamId = DEFAULT_TEAM_ID) {
  if (!hasFirebaseConfig()) return POSITIONS;
  const snapshot = await teamCollection(teamId, "positions").get();
  const positions = snapshot.docs.map(positionFromDoc);
  const fallback = await rootFallback(teamId, "positions", positionFromDoc);
  const merged = mergeById(positions, fallback);
  return (merged.length ? merged : POSITIONS).sort((a, b) => a.id - b.id);
}

export async function listServers(teamId = DEFAULT_TEAM_ID) {
  if (!hasFirebaseConfig()) return [];
  const snapshot = await teamCollection(teamId, "servers").get();
  const servers = snapshot.docs.map(serverFromDoc);
  const fallback = await rootFallback(teamId, "servers", serverFromDoc);
  return mergeById(servers, fallback).sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));
}

export async function getPlan(teamId = DEFAULT_TEAM_ID): Promise<Plan> {
  if (!hasFirebaseConfig()) return { imageUrl: null, note: "Configura Firebase para guardar turnos compartidos.", updatedAt: null };
  const doc = await teamCollection(teamId, "settings").doc("plan").get();
  let data = doc.data();
  if (!data && teamId === DEFAULT_TEAM_ID) data = (await getDb().collection("settings").doc("plan").get()).data();
  return { imageUrl: data?.imageUrl ?? null, note: data?.note ?? null, updatedAt: timestampToString(data?.updatedAt) };
}

export async function getSchedulePayload(teamId = DEFAULT_TEAM_ID): Promise<SchedulePayload> {
  const [assignments, plan, positions, servers, settings, team, slots] = await Promise.all([
    listAssignments(teamId),
    getPlan(teamId),
    listPositions(teamId),
    listServers(teamId),
    getTeamSettings(teamId),
    getTeam(teamId),
    listSlots(teamId),
  ]);
  return { team, settings, days: DAYS, slots, positions, servers, assignments, plan };
}

export async function upsertAssignment(teamId: string, input: { id: string; dayId: string; slotId: string; positionId: number; serverId: string | null; actor: string }) {
  if (!hasFirebaseConfig()) throw new Error("Firebase no esta configurado.");
  const ref = teamCollection(teamId, "assignments").doc(input.id);
  if (!input.serverId) {
    await ref.set({
      dayId: input.dayId,
      slotId: input.slotId,
      positionId: input.positionId,
      serverId: null,
      serverName: null,
      updatedAt: Timestamp.now(),
      updatedBy: input.actor,
    }, { merge: true });
    return assignmentFromDoc(await ref.get());
  }
  const server = await teamCollection(teamId, "servers").doc(input.serverId).get();
  const serverData = server.exists ? serverFromDoc(server) : null;
  await ref.set({ dayId: input.dayId, slotId: input.slotId, positionId: input.positionId, serverId: input.serverId, serverName: serverData?.fullName ?? null, updatedAt: Timestamp.now(), updatedBy: input.actor }, { merge: true });
  return assignmentFromDoc(await ref.get());
}

export async function updatePlan(teamId: string, input: { imageUrl: string | null; note: string | null }) {
  if (!hasFirebaseConfig()) throw new Error("Firebase no esta configurado.");
  await teamCollection(teamId, "settings").doc("plan").set({ imageUrl: input.imageUrl, note: input.note, updatedAt: Timestamp.now() }, { merge: true });
  return getPlan(teamId);
}

export async function upsertSlot(teamId: string, input: { id?: string; dayId: DayId; start: string; end: string }) {
  if (!hasFirebaseConfig()) throw new Error("Firebase no esta configurado.");
  const id = input.id || `${input.dayId}-${input.start.replace(":", "")}`;
  const slot: Slot = { id, dayId: input.dayId, start: input.start, end: input.end, label: `${input.start} - ${input.end}` };
  await teamCollection(teamId, "slots").doc(id).set(slot, { merge: true });
  return slot;
}

export async function deleteSlot(teamId: string, slotId: string) {
  if (!hasFirebaseConfig()) throw new Error("Firebase no esta configurado.");
  const assignments = await teamCollection(teamId, "assignments").where("slotId", "==", slotId).get();
  const batch = getDb().batch();
  assignments.docs.forEach((doc) => batch.delete(doc.ref));
  batch.delete(teamCollection(teamId, "slots").doc(slotId));
  await batch.commit();
}

export async function upsertPosition(teamId: string, input: { id?: number; name: string }) {
  if (!hasFirebaseConfig()) throw new Error("Firebase no esta configurado.");
  const positions = await listPositions(teamId);
  const id = input.id ?? Math.max(0, ...positions.map((position) => position.id)) + 1;
  const position: Position = { id, name: input.name.trim() || `Posicion ${id}` };
  await teamCollection(teamId, "positions").doc(String(id)).set(position, { merge: true });
  return position;
}

export async function deletePosition(teamId: string, positionId: number) {
  if (!hasFirebaseConfig()) throw new Error("Firebase no esta configurado.");
  const assignments = await teamCollection(teamId, "assignments").where("positionId", "==", positionId).get();
  const batch = getDb().batch();
  assignments.docs.forEach((doc) => batch.delete(doc.ref));
  batch.delete(teamCollection(teamId, "positions").doc(String(positionId)));
  await batch.commit();
}

export async function upsertServer(teamId: string, input: { id?: string; fullName: string; whatsapp: string; countryCode: CountryCode; active: boolean; availability: AvailabilityRange[] }) {
  if (!hasFirebaseConfig()) throw new Error("Firebase no esta configurado.");
  const country = COUNTRIES.find((item) => item.code === input.countryCode) ?? COUNTRIES[0];
  const ref = input.id ? teamCollection(teamId, "servers").doc(input.id) : teamCollection(teamId, "servers").doc();
  const existing = await ref.get();
  await ref.set({ fullName: input.fullName.trim(), whatsapp: input.whatsapp.trim(), countryCode: input.countryCode, dialCode: country.dialCode, active: input.active, availability: input.availability, createdAt: existing.exists ? existing.data()?.createdAt : Timestamp.now(), updatedAt: Timestamp.now() }, { merge: true });
  return serverFromDoc(await ref.get());
}


export async function importServers(teamId: string, inputs: Array<{ fullName: string; whatsapp: string; countryCode: CountryCode; active: boolean; availability: AvailabilityRange[] }>) {
  if (!hasFirebaseConfig()) throw new Error("Firebase no esta configurado.");
  const existing = await listServers(teamId);
  const seen = new Set(existing.map((server) => cleanPhone(server.whatsapp) || normalizeSearch(server.fullName)));
  const created: Server[] = [];
  let batch = getDb().batch();
  let pending = 0;

  for (const input of inputs) {
    const key = cleanPhone(input.whatsapp) || normalizeSearch(input.fullName);
    if (!input.fullName.trim() || !key || seen.has(key)) continue;
    seen.add(key);
    const country = COUNTRIES.find((item) => item.code === input.countryCode) ?? COUNTRIES[0];
    const ref = teamCollection(teamId, "servers").doc();
    const serverData = {
      fullName: input.fullName.trim(),
      whatsapp: input.whatsapp.trim(),
      countryCode: input.countryCode,
      dialCode: country.dialCode,
      active: input.active,
      availability: input.availability,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    batch.set(ref, serverData);
    created.push({ id: ref.id, ...serverData, createdAt: null, updatedAt: null });
    pending += 1;
    if (pending === 450) {
      await batch.commit();
      batch = getDb().batch();
      pending = 0;
    }
  }

  if (pending) await batch.commit();
  return created;
}

export async function deleteServer(teamId: string, serverId: string) {
  if (!hasFirebaseConfig()) throw new Error("Firebase no esta configurado.");
  const [assignments, rootAssignments] = await Promise.all([
    teamCollection(teamId, "assignments").where("serverId", "==", serverId).get(),
    teamId === DEFAULT_TEAM_ID ? getDb().collection("assignments").where("serverId", "==", serverId).get() : Promise.resolve(null),
  ]);
  const batch = getDb().batch();
  assignments.docs.forEach((doc) => batch.delete(doc.ref));
  rootAssignments?.docs.forEach((doc) => batch.delete(doc.ref));
  batch.delete(teamCollection(teamId, "servers").doc(serverId));
  if (teamId === DEFAULT_TEAM_ID) batch.delete(getDb().collection("servers").doc(serverId));
  await batch.commit();
}

export async function seedTeamDefaults(teamId: string) {
  if (!hasFirebaseConfig()) throw new Error("Firebase no esta configurado.");
  const [positions, slots] = await Promise.all([
    teamCollection(teamId, "positions").limit(1).get(),
    teamCollection(teamId, "slots").limit(1).get(),
  ]);
  const batch = getDb().batch();
  if (positions.empty) POSITIONS.forEach((position) => batch.set(teamCollection(teamId, "positions").doc(String(position.id)), position));
  if (slots.empty) SLOTS.forEach((slot) => batch.set(teamCollection(teamId, "slots").doc(slot.id), slot));
  batch.set(teamCollection(teamId, "settings").doc("rules"), { ...DEFAULT_TEAM_SETTINGS, updatedAt: Timestamp.now() }, { merge: true });
  batch.set(teamCollection(teamId, "settings").doc("plan"), { note: "Cargar plano del salon principal.", updatedAt: Timestamp.now() }, { merge: true });
  await batch.commit();
}

export async function seedDefaultsIfEmpty() {
  if (!hasFirebaseConfig()) throw new Error("Firebase no esta configurado.");
  for (const team of DEFAULT_TEAMS) {
    await upsertTeam(team);
    await seedTeamDefaults(team.id);
  }
}
