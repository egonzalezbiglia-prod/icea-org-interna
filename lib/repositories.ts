import type { DocumentData, DocumentSnapshot, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { COUNTRIES, DAYS, POSITIONS, SLOTS } from "@/lib/domain";
import { getDb, hasFirebaseConfig, Timestamp } from "@/lib/firebase-admin";
import type { Assignment, AvailabilityRange, CountryCode, DayId, Plan, Position, SchedulePayload, Server, Slot } from "@/lib/types";

function timestampToString(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return null;
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

export async function listAssignments() {
  if (!hasFirebaseConfig()) return [];
  const snapshot = await getDb().collection("assignments").get();
  return snapshot.docs.map(assignmentFromDoc).sort((a, b) => a.id.localeCompare(b.id));
}

export async function listSlots() {
  if (!hasFirebaseConfig()) return SLOTS;
  const snapshot = await getDb().collection("slots").get();
  const slots = snapshot.docs.map(slotFromDoc);
  return (slots.length ? slots : SLOTS).sort((a, b) => {
    const dayOrder = DAYS.findIndex((day) => day.id === a.dayId) - DAYS.findIndex((day) => day.id === b.dayId);
    if (dayOrder !== 0) return dayOrder;
    return a.start.localeCompare(b.start);
  });
}

export async function listPositions() {
  if (!hasFirebaseConfig()) return POSITIONS;
  const snapshot = await getDb().collection("positions").get();
  const positions = snapshot.docs.map(positionFromDoc);
  return (positions.length ? positions : POSITIONS).sort((a, b) => a.id - b.id);
}

export async function listServers() {
  if (!hasFirebaseConfig()) return [];
  const snapshot = await getDb().collection("servers").get();
  return snapshot.docs.map(serverFromDoc).sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));
}

export async function getPlan(): Promise<Plan> {
  if (!hasFirebaseConfig()) {
    return { imageUrl: null, note: "Configura Firebase para guardar turnos compartidos.", updatedAt: null };
  }
  const doc = await getDb().collection("settings").doc("plan").get();
  const data = doc.data();
  return {
    imageUrl: data?.imageUrl ?? null,
    note: data?.note ?? null,
    updatedAt: timestampToString(data?.updatedAt),
  };
}

export async function getSchedulePayload(): Promise<SchedulePayload> {
  const [assignments, plan, positions, slots, servers] = await Promise.all([
    listAssignments(),
    getPlan(),
    listPositions(),
    listSlots(),
    listServers(),
  ]);
  return { days: DAYS, slots, positions, servers, assignments, plan };
}

export async function upsertAssignment(input: {
  id: string;
  dayId: string;
  slotId: string;
  positionId: number;
  serverId: string | null;
  actor: string;
}) {
  if (!hasFirebaseConfig()) throw new Error("Firebase no esta configurado.");
  const ref = getDb().collection("assignments").doc(input.id);
  if (!input.serverId) {
    await ref.delete();
    return null;
  }
  const server = await getDb().collection("servers").doc(input.serverId).get();
  const serverData = server.exists ? serverFromDoc(server) : null;
  await ref.set(
    {
      dayId: input.dayId,
      slotId: input.slotId,
      positionId: input.positionId,
      serverId: input.serverId,
      serverName: serverData?.fullName ?? null,
      updatedAt: Timestamp.now(),
      updatedBy: input.actor,
    },
    { merge: true },
  );
  return assignmentFromDoc(await ref.get());
}

export async function updatePlan(input: { imageUrl: string | null; note: string | null }) {
  if (!hasFirebaseConfig()) throw new Error("Firebase no esta configurado.");
  await getDb().collection("settings").doc("plan").set(
    { imageUrl: input.imageUrl, note: input.note, updatedAt: Timestamp.now() },
    { merge: true },
  );
  return getPlan();
}

export async function upsertSlot(input: { id?: string; dayId: DayId; start: string; end: string }) {
  if (!hasFirebaseConfig()) throw new Error("Firebase no esta configurado.");
  const id = input.id || `${input.dayId}-${input.start.replace(":", "")}`;
  const slot: Slot = { id, dayId: input.dayId, start: input.start, end: input.end, label: `${input.start} - ${input.end}` };
  await getDb().collection("slots").doc(id).set(slot, { merge: true });
  return slot;
}

export async function deleteSlot(slotId: string) {
  if (!hasFirebaseConfig()) throw new Error("Firebase no esta configurado.");
  const db = getDb();
  const assignments = await db.collection("assignments").where("slotId", "==", slotId).get();
  const batch = db.batch();
  assignments.docs.forEach((doc) => batch.delete(doc.ref));
  batch.delete(db.collection("slots").doc(slotId));
  await batch.commit();
}

export async function upsertPosition(input: { id?: number; name: string }) {
  if (!hasFirebaseConfig()) throw new Error("Firebase no esta configurado.");
  const positions = await listPositions();
  const id = input.id ?? Math.max(0, ...positions.map((position) => position.id)) + 1;
  const position: Position = { id, name: input.name.trim() || `Posicion ${id}` };
  await getDb().collection("positions").doc(String(id)).set(position, { merge: true });
  return position;
}

export async function deletePosition(positionId: number) {
  if (!hasFirebaseConfig()) throw new Error("Firebase no esta configurado.");
  const db = getDb();
  const assignments = await db.collection("assignments").where("positionId", "==", positionId).get();
  const batch = db.batch();
  assignments.docs.forEach((doc) => batch.delete(doc.ref));
  batch.delete(db.collection("positions").doc(String(positionId)));
  await batch.commit();
}

export async function upsertServer(input: {
  id?: string;
  fullName: string;
  whatsapp: string;
  countryCode: CountryCode;
  active: boolean;
  availability: AvailabilityRange[];
}) {
  if (!hasFirebaseConfig()) throw new Error("Firebase no esta configurado.");
  const country = COUNTRIES.find((item) => item.code === input.countryCode) ?? COUNTRIES[0];
  const ref = input.id ? getDb().collection("servers").doc(input.id) : getDb().collection("servers").doc();
  const existing = await ref.get();
  await ref.set(
    {
      fullName: input.fullName.trim(),
      whatsapp: input.whatsapp.trim(),
      countryCode: input.countryCode,
      dialCode: country.dialCode,
      active: input.active,
      availability: input.availability,
      createdAt: existing.exists ? existing.data()?.createdAt : Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    { merge: true },
  );
  return serverFromDoc(await ref.get());
}

export async function deleteServer(serverId: string) {
  if (!hasFirebaseConfig()) throw new Error("Firebase no esta configurado.");
  const db = getDb();
  const assignments = await db.collection("assignments").where("serverId", "==", serverId).get();
  const batch = db.batch();
  assignments.docs.forEach((doc) => batch.delete(doc.ref));
  batch.delete(db.collection("servers").doc(serverId));
  await batch.commit();
}

export async function seedDefaultsIfEmpty() {
  if (!hasFirebaseConfig()) throw new Error("Firebase no esta configurado.");
  const [positions, slots] = await Promise.all([
    getDb().collection("positions").limit(1).get(),
    getDb().collection("slots").limit(1).get(),
  ]);
  const batch = getDb().batch();
  if (positions.empty) POSITIONS.forEach((position) => batch.set(getDb().collection("positions").doc(String(position.id)), position));
  if (slots.empty) SLOTS.forEach((slot) => batch.set(getDb().collection("slots").doc(slot.id), slot));
  batch.set(getDb().collection("settings").doc("plan"), { note: "Cargar plano del salon principal.", updatedAt: Timestamp.now() }, { merge: true });
  await batch.commit();
}
