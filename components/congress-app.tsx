"use client";

import type React from "react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, Home, ImageIcon, Map as MapIcon, LogOut, MoreHorizontal, RefreshCw, Search, Settings, Trash2, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { assignmentId, fechaCortaDia, hoursBetween, minutesFromTime, normalizeSearch, slotEnCurso } from "@/lib/domain";
import { readCachedSchedule, writeCachedSchedule } from "@/lib/schedule-cache";
import type { Assignment, DayId, SchedulePayload, Server, Slot } from "@/lib/types";

const ADMIN_KEY = "1icea2026";
const ADMIN_SESSION_KEY = "icea-admin-ok";
const MAX_PLAN_IMAGE_CHARS = 850_000;
const PLAN_IMAGE_SIZES = [1800, 1500, 1200, 950, 760];
const PUBLIC_SNAPSHOT_CHECK_MS = 5 * 60_000;

type AvailabilityFit = "complete" | "partial-before" | "partial-after" | "partial-both" | "none";

type ServerOption = {
  server: Server;
  fit: AvailabilityFit;
  availableHours: number;
  occupiedHours: number;
  occupiedPercent: number;
  shiftCount: number;
};

type SearchPerson = {
  id: string;
  name: string;
};

function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  return fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  }).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error ?? "Error inesperado");
    return data;
  });
}

function assignmentMap(assignments: Assignment[]) {
  return new Map(assignments.map((assignment) => [assignment.id, assignment]));
}

function serverMap(servers: Server[]) {
  return new Map(servers.map((server) => [server.id, server]));
}

function slotMap(slots: Slot[]) {
  return new Map(slots.map((slot) => [slot.id, slot]));
}

function availabilityFit(server: Server | undefined, slot: Slot): AvailabilityFit {
  if (!server) return "none";
  const slotStart = minutesFromTime(slot.start);
  const slotEnd = minutesFromTime(slot.end);
  const ranges = server.availability.filter((range) => range.dayId === slot.dayId);
  if (!ranges.length) return "none";
  if (ranges.some((range) => minutesFromTime(range.start) <= slotStart && minutesFromTime(range.end) >= slotEnd)) return "complete";
  const partial = ranges.find((range) => minutesFromTime(range.start) < slotEnd && minutesFromTime(range.end) > slotStart);
  if (!partial) return "none";
  const missesStart = minutesFromTime(partial.start) > slotStart;
  const missesEnd = minutesFromTime(partial.end) < slotEnd;
  if (missesStart && missesEnd) return "partial-both";
  if (missesStart) return "partial-before";
  return "partial-after";
}

function partialLabel(fit: AvailabilityFit) {
  if (fit === "partial-before") return "←";
  if (fit === "partial-after") return "→";
  if (fit === "partial-both") return "↔";
  return "";
}

function isPartial(fit: AvailabilityFit) {
  return fit === "partial-before" || fit === "partial-after" || fit === "partial-both";
}

function availabilityHours(server: Server) {
  return server.availability.reduce((total, range) => total + hoursBetween(range.start, range.end), 0);
}

function occupiedStats(serverId: string, assignments: Assignment[], slotsById: Map<string, Slot>) {
  const serverAssignments = assignments.filter((assignment) => assignment.serverId === serverId);
  const occupiedHours = serverAssignments.reduce((total, assignment) => {
    const slot = slotsById.get(assignment.slotId);
    return total + (slot ? hoursBetween(slot.start, slot.end) : 0);
  }, 0);
  return { occupiedHours, shiftCount: serverAssignments.length };
}

function runLengthFor(serverId: string, candidate: Slot, assignments: Assignment[], slotsById: Map<string, Slot>, currentAssignmentId?: string) {
  const assignedSlots = assignments
    .filter((assignment) => assignment.serverId === serverId && assignment.id !== currentAssignmentId)
    .map((assignment) => slotsById.get(assignment.slotId))
    .filter((slot): slot is Slot => Boolean(slot))
    .filter((slot) => slot.dayId === candidate.dayId);
  const allSlots = [...assignedSlots, candidate].sort((a, b) => minutesFromTime(a.start) - minutesFromTime(b.start));
  const index = allSlots.findIndex((slot) => slot.id === candidate.id);
  if (index < 0) return 1;
  let length = 1;
  for (let i = index - 1; i >= 0; i--) {
    if (allSlots[i].end !== allSlots[i + 1].start) break;
    length += 1;
  }
  for (let i = index + 1; i < allSlots.length; i++) {
    if (allSlots[i - 1].end !== allSlots[i].start) break;
    length += 1;
  }
  return length;
}

function serverAlreadyInSlot(serverId: string, slotId: string, assignments: Assignment[], currentAssignmentId: string, preventSameSlotDuplicate: boolean) {
  return preventSameSlotDuplicate && assignments.some((assignment) => assignment.id !== currentAssignmentId && assignment.slotId === slotId && assignment.serverId === serverId);
}

function fileToImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer el PNG."));
    };
    image.src = url;
  });
}

function redondearRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function ajustarTexto(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let next = text;
  while (next.length > 1 && ctx.measureText(`${next}...`).width > maxWidth) {
    next = next.slice(0, -1);
  }
  return `${next.trim()}...`;
}

async function copiarBlobPng(blob: Blob) {
  if (!navigator.clipboard?.write || !("ClipboardItem" in window)) {
    throw new Error("Este navegador no permite copiar imágenes al portapapeles.");
  }
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}

async function pngFileToDataUrl(file: File) {
  if (file.type !== "image/png") throw new Error("El plano tiene que ser un archivo PNG.");
  const image = await fileToImage(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo preparar el PNG.");

  for (const maxSize of PLAN_IMAGE_SIZES) {
    const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");
    if (dataUrl.length <= MAX_PLAN_IMAGE_CHARS) return dataUrl;
  }

  throw new Error("El PNG es demasiado pesado. Probá exportarlo con menos resolución.");
}

function optionsForCell(data: SchedulePayload, slot: Slot, currentAssignmentId: string): ServerOption[] {
  const slotsById = slotMap(data.slots);
  return data.servers
    .filter((server) => server.active)
    .map((server) => {
      const fit = availabilityFit(server, slot);
      const availableHours = availabilityHours(server);
      const { occupiedHours, shiftCount } = occupiedStats(server.id, data.assignments, slotsById);
      return {
        server,
        fit,
        availableHours,
        occupiedHours,
        occupiedPercent: availableHours ? occupiedHours / availableHours : 1,
        shiftCount,
      };
    })
    .filter((option) => data.settings.allowPartialAvailability ? option.fit !== "none" : option.fit === "complete")
    .filter((option) => !serverAlreadyInSlot(option.server.id, slot.id, data.assignments, currentAssignmentId, data.settings.preventSameSlotDuplicate))
    .filter((option) => !data.settings.blockAfterMaxConsecutive || runLengthFor(option.server.id, slot, data.assignments, slotsById, currentAssignmentId) <= data.settings.maxConsecutiveShifts)
    .sort((a, b) => {
      if (isPartial(a.fit) !== isPartial(b.fit)) return isPartial(a.fit) ? 1 : -1;
      if (a.availableHours !== b.availableHours) return a.availableHours - b.availableHours;
      if (a.occupiedPercent !== b.occupiedPercent) return a.occupiedPercent - b.occupiedPercent;
      if (a.occupiedHours !== b.occupiedHours) return a.occupiedHours - b.occupiedHours;
      if (a.shiftCount !== b.shiftCount) return a.shiftCount - b.shiftCount;
      return a.server.fullName.localeCompare(b.server.fullName, "es");
    });
}

function emptySchedule(teamId: string): SchedulePayload {
  return {
    team: { id: teamId, name: teamId, description: null, icon: null, congressDates: { jueves: "2026-08-13", viernes: "2026-08-14", sabado: "2026-08-15" }, active: true, createdAt: null, updatedAt: null },
    settings: { maxConsecutiveShifts: 2, blockAfterMaxConsecutive: true, allowPartialAvailability: true, warnPartialAvailability: true, preventSameSlotDuplicate: true, updatedAt: null },
    days: [],
    slots: [],
    positions: [],
    servers: [],
    assignments: [],
    plan: { imageUrl: null, note: null, updatedAt: null },
  };
}


export function CongressApp({ initialData = null, teamId: initialTeamId }: { initialData?: SchedulePayload | null; teamId: string }) {
  const [data, setData] = useState<SchedulePayload>(() => initialData ?? emptySchedule(initialTeamId));
  const [hasLoadedData, setHasLoadedData] = useState(Boolean(initialData));
  const [activeDay, setActiveDay] = useState<DayId>(initialData?.days[0]?.id ?? "jueves");
  const [query, setQuery] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState("");
  const teamId = data.team.id;
  const adminSessionKey = `${ADMIN_SESSION_KEY}:${teamId}`;
  const [message, setMessage] = useState("");
  const [planOpen, setPlanOpen] = useState(false);
  const [publicPlanLoaded, setPublicPlanLoaded] = useState(Boolean(initialData?.plan.imageUrl));
  const [savingId, setSavingId] = useState<string | null>(null);
  const [clearingSlotId, setClearingSlotId] = useState<string | null>(null);
  const lastPublicSnapshotCheck = useRef(0);

  const isAdmin = adminKey === ADMIN_KEY;
  const adminDataReady = !isAdmin || data.servers.length > 0;
  const assignments = useMemo(() => assignmentMap(data.assignments), [data.assignments]);
  const assignedCountBySlot = useMemo(() => data.assignments.reduce((counts, assignment) => {
    if (assignment.dayId === activeDay && (assignment.serverId || assignment.serverName)) {
      counts.set(assignment.slotId, (counts.get(assignment.slotId) ?? 0) + 1);
    }
    return counts;
  }, new Map<string, number>()), [activeDay, data.assignments]);
  const servers = useMemo(() => serverMap(data.servers), [data.servers]);
  const slotsById = useMemo(() => slotMap(data.slots), [data.slots]);
  const slots = useMemo(() => data.slots.filter((slot) => slot.dayId === activeDay), [activeDay, data.slots]);
  const positions = data.positions;
  const search = normalizeSearch(query);

  const matchingPeople = useMemo(() => {
    if (!search) return [];
    const people = new Map<string, SearchPerson>();
    data.assignments.forEach((assignment) => {
      const name = assignment.serverName?.trim();
      if (!name || !normalizeSearch(name).includes(search)) return;
      const id = assignment.serverId ?? `nombre:${normalizeSearch(name)}`;
      if (!people.has(id)) people.set(id, { id, name });
    });
    return Array.from(people.values()).sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [data.assignments, search]);

  const selectedPerson = matchingPeople.find((person) => person.id === selectedPersonId) ?? null;

  const personalShifts = useMemo(() => {
    if (!selectedPerson) return [];
    return data.assignments
      .filter((assignment) => (assignment.serverId ?? `nombre:${normalizeSearch(assignment.serverName)}`) === selectedPerson.id)
      .map((assignment) => ({
        assignment,
        day: data.days.find((day) => day.id === assignment.dayId),
        slot: data.slots.find((slot) => slot.id === assignment.slotId),
      }))
      .sort((a, b) => {
        const dayOrder = data.days.findIndex((day) => day.id === a.assignment.dayId) - data.days.findIndex((day) => day.id === b.assignment.dayId);
        if (dayOrder !== 0) return dayOrder;
        if (a.assignment.slotId !== b.assignment.slotId) return a.assignment.slotId.localeCompare(b.assignment.slotId);
        return a.assignment.positionId - b.assignment.positionId;
      });
  }, [data, selectedPerson]);

  const personalShiftsByDay = useMemo(() => data.days
    .map((day) => ({
      day,
      shifts: personalShifts.filter((shift) => shift.assignment.dayId === day.id),
    }))
    .filter((group) => group.shifts.length > 0), [data.days, personalShifts]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [ahora, setAhora] = useState<Date | null>(null);

  useEffect(() => {
    // Se resuelve en el cliente para evitar desajustes de hidratacion.
    setAhora(new Date());
    const tick = window.setInterval(() => setAhora(new Date()), 60_000);
    return () => window.clearInterval(tick);
  }, []);

  const slotAhoraId = useMemo(() => (ahora ? slotEnCurso(data.slots, ahora, data.team.congressDates) : null), [ahora, data.slots, data.team.congressDates]);
  const positionsById = useMemo(() => new Map(positions.map((position) => [position.id, position])), [positions]);
  const anchoColumnaPosicion = useMemo(() => {
    const caracteres = positions.reduce((maximo, position) => {
      const custom = position.name?.trim();
      const etiqueta = custom && custom.toLowerCase() !== `posicion ${position.id}` ? custom : String(position.id);
      return Math.max(maximo, etiqueta.length, String(position.id).length, 3);
    }, 3);
    return Math.min(132, Math.max(58, Math.ceil(caracteres * 7.3 + 28)));
  }, [positions]);
  const estiloGrilla = { "--position-column-width": `${anchoColumnaPosicion}px` } as React.CSSProperties & Record<"--position-column-width", string>;

  // Nombre visible de un puesto: el que cargo el equipo, o el numero si esta vacio.
  const nombrePuesto = (positionId: number) => {
    const custom = positionsById.get(positionId)?.name?.trim();
    if (custom && custom.toLowerCase() !== `posicion ${positionId}`) return custom;
    return `Puesto ${positionId}`;
  };

  const turnoPorSlot = (slot?: Slot | null) => {
    if (!slot) return null;
    const turnosDelDia = data.slots.filter((item) => item.dayId === slot.dayId);
    const indice = turnosDelDia.findIndex((item) => item.id === slot.id);
    return indice >= 0 ? indice + 1 : null;
  };

  const nombrePersona = selectedPerson?.name ?? "";
  const inicialPersona = nombrePersona.trim().charAt(0).toUpperCase();
  const labelDiaActivo = data.days.find((day) => day.id === activeDay)?.label ?? "";
  const grupoDiaActivo = personalShiftsByDay.find((group) => group.day.id === activeDay) ?? null;
  const otrosDias = personalShiftsByDay.filter((group) => group.day.id !== activeDay);

  useEffect(() => {
    if (initialData) writeCachedSchedule(initialData);
  }, [initialData]);

  useEffect(() => {
    if (window.sessionStorage.getItem(adminSessionKey) === "1") setAdminKey(ADMIN_KEY);
  }, [adminSessionKey]);

  useEffect(() => {
    if (!message) return undefined;
    const timeout = window.setTimeout(() => setMessage(""), 2_600);
    return () => window.clearTimeout(timeout);
  }, [message]);

  const refresh = useCallback(async (showMessage = true) => {
    setMessage("");
    try {
      const endpoint = isAdmin ? "/api/schedule" : "/api/public-schedule";
      if (!isAdmin) lastPublicSnapshotCheck.current = Date.now();
      const next = await apiJson<SchedulePayload>(`${endpoint}?teamId=${encodeURIComponent(teamId)}`);
      setData(next);
      setHasLoadedData(true);
      setPublicPlanLoaded(isAdmin || Boolean(next.plan.imageUrl));
      writeCachedSchedule(next);
      if (showMessage && isAdmin) setMessage("Grilla actualizada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo actualizar.");
    }
  }, [isAdmin, teamId]);

  useEffect(() => {
    if (hasLoadedData) return;
    const cached = readCachedSchedule(teamId);
    if (cached) {
      setData(cached);
      setHasLoadedData(true);
      setActiveDay(cached.days[0]?.id ?? "jueves");
      void refresh(false);
      return;
    }
    void refresh(false);
  }, [hasLoadedData, refresh, teamId]);

  useEffect(() => {
    if (!hasLoadedData || !isAdmin || adminDataReady) return;
    void refresh(false);
  }, [adminDataReady, hasLoadedData, isAdmin, refresh]);

  useEffect(() => {
    if (!hasLoadedData || isAdmin) return undefined;
    const checkSnapshotIfDue = () => {
      if (Date.now() - lastPublicSnapshotCheck.current < PUBLIC_SNAPSHOT_CHECK_MS) return;
      void refresh(false);
    };
    const checkSnapshotWhenVisible = () => {
      if (document.visibilityState === "visible") checkSnapshotIfDue();
    };
    window.addEventListener("focus", checkSnapshotIfDue);
    document.addEventListener("visibilitychange", checkSnapshotWhenVisible);
    return () => {
      window.removeEventListener("focus", checkSnapshotIfDue);
      document.removeEventListener("visibilitychange", checkSnapshotWhenVisible);
    };
  }, [hasLoadedData, isAdmin, refresh]);

  function leaveAdmin() {
    setAdminKey("");
    window.sessionStorage.removeItem(adminSessionKey);
    setMessage("Modo admin cerrado.");
  }

  async function saveAssignment(dayId: DayId, slotId: string, positionId: number, serverId: string | null) {
    const id = assignmentId(dayId, slotId, positionId);
    if (!isAdmin) return;
    setSavingId(id);
    setMessage("");
    try {
      const result = await apiJson<{ assignment: Assignment | null }>("/api/schedule", {
        method: "PATCH",
        body: JSON.stringify({ teamId, dayId, slotId, positionId, serverId, editKey: adminKey }),
      });
      setData((current) => {
        const next = current.assignments.filter((assignment) => assignment.id !== id);
        if (result.assignment?.serverId) next.push(result.assignment);
        const nextData = { ...current, assignments: next };
        writeCachedSchedule(nextData);
        return nextData;
      });
      setMessage("Cambio guardado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar.");
    } finally {
      setSavingId(null);
    }
  }

  async function clearSlot(slot: Slot) {
    if (!isAdmin || clearingSlotId) return;
    const assignedPositions = positions.filter((position) => assignments.get(assignmentId(activeDay, slot.id, position.id))?.serverId);
    if (!assignedPositions.length) {
      setMessage("El turno ya está vacío.");
      return;
    }
    const turn = turnoPorSlot(slot);
    const label = `${labelDiaActivo} ${turn ? `Turno ${turn}` : slot.label}`;
    if (!window.confirm(`Vaciar ${label}? Se desasignan ${assignedPositions.length} servidor${assignedPositions.length === 1 ? "" : "es"}.`)) return;
    setClearingSlotId(slot.id);
    setMessage("");
    try {
      await Promise.all(assignedPositions.map((position) => apiJson<{ assignment: Assignment | null }>("/api/schedule", {
        method: "PATCH",
        body: JSON.stringify({ teamId, dayId: activeDay, slotId: slot.id, positionId: position.id, serverId: null, editKey: adminKey }),
      })));
      setData((current) => {
        const nextData = {
          ...current,
          assignments: current.assignments.filter((assignment) => !(assignment.dayId === activeDay && assignment.slotId === slot.id)),
        };
        writeCachedSchedule(nextData);
        return nextData;
      });
      setMessage(`${label} vacío.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo vaciar el turno.");
    } finally {
      setClearingSlotId(null);
    }
  }

  async function savePlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get("planFile");
    const imageUrl = file instanceof File && file.size > 0 ? await pngFileToDataUrl(file) : data.plan.imageUrl ?? "";
    await mutatePlan(imageUrl, String(formData.get("note") ?? ""));
  }

  async function mutatePlan(imageUrl: string, note: string) {
    setMessage("");
    try {
      const result = await apiJson<{ plan: SchedulePayload["plan"] }>("/api/plan", {
        method: "PATCH",
        body: JSON.stringify({ teamId, imageUrl, note, editKey: adminKey }),
      });
      setData((current) => {
        const nextData = { ...current, plan: result.plan };
        writeCachedSchedule(nextData);
        return nextData;
      });
      setPublicPlanLoaded(true);
      setMessage("Plano actualizado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo actualizar el plano.");
    }
  }

  async function openPlan() {
    setPlanOpen(true);
    if (isAdmin || publicPlanLoaded) return;
    try {
      const result = await apiJson<{ plan: SchedulePayload["plan"] }>(`/api/public-plan?teamId=${encodeURIComponent(teamId)}`);
      setData((current) => {
        const nextData = { ...current, plan: result.plan };
        writeCachedSchedule(nextData);
        return nextData;
      });
      setPublicPlanLoaded(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo cargar el plano.");
    }
  }

  async function copyDayScheduleImage() {
    setMessage("");
    try {
      const day = data.days.find((item) => item.id === activeDay);
      const daySlots = slots;
      const hasAssignments = data.assignments.some((assignment) => assignment.dayId === activeDay && Boolean(assignment.serverId || assignment.serverName));
      if (!hasAssignments) {
        setMessage(`${day?.label ?? "El día"} no tiene servidores asignados.`);
        return;
      }
      const groupLabels = ["Puestos", "Escalera", "Ascensores", "Accesos", "VIP"] as const;
      const grupos = groupLabels
        .map((label) => ({
          label,
          positions: positions.filter((position) => {
            const nombre = normalizeSearch(nombrePuesto(position.id));
            if (label === "Escalera") return nombre.includes("escalera");
            if (label === "Ascensores") return nombre.includes("ascensor");
            if (label === "Accesos") return nombre.includes("acceso");
            if (label === "VIP") return nombre.includes("vip");
            return !nombre.includes("escalera") && !nombre.includes("ascensor") && !nombre.includes("acceso") && !nombre.includes("vip");
          }),
        }))
        .filter((group) => group.positions.length > 0);
      const ancho = Math.max(1180, 300 + daySlots.length * 210);
      const margen = 48;
      const altoHeader = 176;
      const altoFila = 78;
      const headerY = altoHeader + 18;
      const tableBottom = headerY + 66 + grupos.length * altoFila;
      const alto = Math.max(620, tableBottom + 128);
      const posWidth = 220;
      const tableWidth = ancho - margen * 2;
      const slotWidth = daySlots.length ? (tableWidth - posWidth) / daySlots.length : tableWidth - posWidth;
      const canvas = document.createElement("canvas");
      canvas.width = ancho;
      canvas.height = alto;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No se pudo preparar la imagen.");

      ctx.fillStyle = "#f8fbf2";
      ctx.fillRect(0, 0, ancho, alto);
      const fondo = ctx.createLinearGradient(0, 0, ancho, alto);
      fondo.addColorStop(0, "#123328");
      fondo.addColorStop(1, "#245640");
      ctx.fillStyle = fondo;
      redondearRect(ctx, 26, 26, ancho - 52, alto - 52, 28);
      ctx.fill();

      ctx.fillStyle = "#f6f3e8";
      ctx.font = "800 42px Georgia, serif";
      ctx.fillText(`Grilla ${day?.label ?? ""}`, margen, 86);
      ctx.fillStyle = "rgba(246, 243, 232, 0.78)";
      ctx.font = "700 17px Arial, sans-serif";
      ctx.fillText(data.team.name.toUpperCase(), margen, 121);
      ctx.font = "500 18px Arial, sans-serif";
      ctx.fillText(`${fechaCortaDia(activeDay, data.team.congressDates)} · grupos, turnos y cantidad asignada`, margen, 154);

      const tableX = margen;
      redondearRect(ctx, tableX, headerY, tableWidth, 54, 18);
      ctx.fillStyle = "#d8ff6a";
      ctx.fill();
      ctx.fillStyle = "#10241d";
      ctx.font = "900 17px Arial, sans-serif";
      ctx.fillText("GRUPO", tableX + 22, headerY + 34);
      daySlots.forEach((slot, index) => {
        const x = tableX + posWidth + index * slotWidth;
        ctx.fillText(`TURNO ${index + 1}`, x + 18, headerY + 26);
        ctx.font = "700 13px Arial, sans-serif";
        ctx.fillText(`${slot.start} - ${slot.end}`, x + 18, headerY + 43);
        ctx.font = "900 17px Arial, sans-serif";
      });

      grupos.forEach((group, rowIndex) => {
        const y = headerY + 66 + rowIndex * altoFila;
        redondearRect(ctx, tableX, y, tableWidth, altoFila - 8, 12);
        ctx.fillStyle = rowIndex % 2 === 0 ? "rgba(255, 255, 255, 0.94)" : "rgba(232, 238, 235, 0.94)";
        ctx.fill();

        ctx.fillStyle = "#10241d";
        ctx.font = "900 19px Arial, sans-serif";
        ctx.fillText(ajustarTexto(ctx, group.label, posWidth - 38), tableX + 22, y + 29);
        ctx.fillStyle = "rgba(16, 36, 29, 0.62)";
        ctx.font = "700 13px Arial, sans-serif";
        ctx.fillText(`${group.positions.length} posiciones`, tableX + 22, y + 51);

        daySlots.forEach((slot, index) => {
          const x = tableX + posWidth + index * slotWidth;
          const assignedCount = group.positions.filter((position) => {
            const assignment = assignments.get(assignmentId(activeDay, slot.id, position.id));
            return Boolean(assignment?.serverId || assignment?.serverName);
          }).length;
          const criticalCoverage = assignedCount / group.positions.length <= 0.7;
          if (criticalCoverage) {
            redondearRect(ctx, x + 10, y + 10, slotWidth - 20, altoFila - 28, 10);
            ctx.fillStyle = "rgba(255, 179, 191, 0.34)";
            ctx.fill();
          }
          ctx.fillStyle = criticalCoverage ? "#9c3142" : "#10241d";
          ctx.font = "900 25px Arial, sans-serif";
          ctx.fillText(String(assignedCount), x + 18, y + 32);
          ctx.font = "800 13px Arial, sans-serif";
          ctx.fillText("asignados", x + 18, y + 53);
        });
      });

      if (!grupos.length) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
        redondearRect(ctx, tableX, headerY + 70, tableWidth, 74, 14);
        ctx.fill();
        ctx.fillStyle = "#476158";
        ctx.font = "800 20px Arial, sans-serif";
        ctx.fillText("Sin grupos de posiciones cargados", tableX + 22, headerY + 116);
      }

      ctx.fillStyle = "rgba(246, 243, 232, 0.72)";
      ctx.font = "700 22px Arial, sans-serif";
      ctx.fillText("ICEA 2026", margen, alto - 58);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((value) => value ? resolve(value) : reject(new Error("No se pudo generar el PNG.")), "image/png");
      });
      await copiarBlobPng(blob);
      setMessage(`Imagen de ${day?.label ?? "día"} copiada.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo copiar la imagen.");
    }
  }


  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-title">
          <p className="eyebrow">ICEA 2026 · {data.team.name.toUpperCase()}</p>
          <h1>Grilla de turnos</h1>
        </div>
        <div className="topbar-actions">
          <button className="ghost-button" onClick={() => void openPlan()}><MapIcon size={17} />Plano</button>
          <button className="ghost-button" onClick={() => void refresh()}><RefreshCw size={17} />Actualizar</button>
          <div className="menu-wrap">
            <button className="ghost-button menu-trigger" aria-label="Más opciones" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
              <MoreHorizontal size={18} />
            </button>
            {menuOpen ? (
              <>
                <button className="menu-backdrop" aria-hidden="true" tabIndex={-1} onClick={() => setMenuOpen(false)} />
                <div className="menu-pop" role="menu">
                  {isAdmin ? <Link className="menu-item" href="/" role="menuitem" onClick={() => setMenuOpen(false)}><Home size={16} />Inicio</Link> : null}
                  <div className="menu-item menu-item-theme">
                    <span>Tema</span>
                    <ThemeToggle />
                  </div>
                  <Link className="menu-item" href={`/equipos/${teamId}/admin`} role="menuitem" onClick={() => setMenuOpen(false)}><Settings size={16} />Admin</Link>
                  {isAdmin ? (
                    <button className="menu-item" role="menuitem" onClick={() => { setMenuOpen(false); leaveAdmin(); }}><LogOut size={16} />Salir admin</button>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main className="page">
        {!hasLoadedData ? (
          <section className="grid-loading">
            <strong>Cargando grilla...</strong>
            <span>Preparando la última información disponible.</span>
          </section>
        ) : null}

        {hasLoadedData ? (
          <>
        <section className="controls">
          <div className="search-combobox">
            <label className="search-field"><Search size={18} /><input value={query} onChange={(event) => { setQuery(event.target.value); setSelectedPersonId(null); }} type="search" placeholder="Buscar servidor por nombre" autoComplete="off" />{query ? <button type="button" aria-label="Limpiar búsqueda" onClick={() => { setQuery(""); setSelectedPersonId(null); }}><X size={16} /></button> : null}</label>
            {search && !selectedPerson ? (
              <div className="search-suggestions" aria-label="Servidores encontrados">
                {matchingPeople.map((person) => (
                  <button key={person.id} type="button" className="search-suggestion" onClick={() => { setSelectedPersonId(person.id); setQuery(person.name); }}>
                    <span className="search-suggestion-avatar" aria-hidden="true">{person.name.charAt(0).toUpperCase()}</span>
                    <span>{person.name}</span>
                  </button>
                ))}
                {!matchingPeople.length ? <p>No hay servidores asignados con ese nombre.</p> : null}
              </div>
            ) : null}
          </div>
        </section>

        {message ? <div className="app-toast" role="status" aria-live="polite"><span className="app-toast-icon">✓</span><strong>{message}</strong></div> : null}

        {selectedPerson ? (
          <section className="person-results">
            {personalShifts.length ? (
              <>
                {grupoDiaActivo ? (
                  <article className="you-card">
                    <span className="you-avatar" aria-hidden="true">{inicialPersona}</span>
                    <div className="you-who">
                      <strong>{nombrePersona}</strong>
                      <span>Tu servicio · {labelDiaActivo} {fechaCortaDia(activeDay, data.team.congressDates)}</span>
                    </div>
                    <div className="you-shifts">
                      {grupoDiaActivo.shifts.map(({ assignment, slot }) => {
                        const esAhora = Boolean(slot && slot.id === slotAhoraId);
                        const turno = turnoPorSlot(slot);
                        return (
                          <div className={esAhora ? "you-chip now" : "you-chip"} key={assignment.id}>
                            <b>{slot?.label}{turno ? <span>Turno {turno}</span> : null}</b>
                            <small>{nombrePuesto(assignment.positionId)}{esAhora ? " · ahora" : ""}</small>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                ) : (
                  <p className="empty-state">{nombrePersona} no tiene turnos el {labelDiaActivo}. Mirá los otros días abajo.</p>
                )}
                {otrosDias.length ? (
                  <div className="results-by-day">
                    <div className="section-heading"><h2>Otros días</h2><span>{personalShifts.length} turnos en total</span></div>
                    {otrosDias.map(({ day, shifts }) => (
                      <section className="result-day-group" key={day.id}>
                        <h3>{day.label} {fechaCortaDia(day.id, data.team.congressDates)}</h3>
                        <article className="result-card result-list-card">
                          <strong>{shifts[0]?.assignment.serverName}</strong>
                          <ul>
                            {shifts.map(({ assignment, slot }) => {
                              const turno = turnoPorSlot(slot);
                              return <li key={assignment.id}><span>{slot?.label}{turno ? <b>Turno {turno}</b> : null}</span><small>{nombrePuesto(assignment.positionId)}</small></li>;
                            })}
                          </ul>
                        </article>
                      </section>
                    ))}
                  </div>
                ) : null}
              </>
            ) : <p className="empty-state">No hay turnos asignados para esa búsqueda.</p>}
          </section>
        ) : null}

        <nav className="day-tabs" aria-label="Días del congreso">
          {data.days.map((day) => (
            <button key={day.id} className={activeDay === day.id ? "active" : ""} onClick={() => setActiveDay(day.id)}>
              <span className="day-name">{day.label}</span>
              <small>{fechaCortaDia(day.id, data.team.congressDates)}</small>
            </button>
          ))}
        </nav>

        {isAdmin ? <div className="schedule-actions">
          <button className="ghost-button" type="button" onClick={() => void copyDayScheduleImage()}><Copy size={17} />Copiar imagen</button>
        </div> : null}

        <section className="schedule-wrap" style={estiloGrilla} aria-label="Grilla de turnos">
          <table className="schedule-grid">
            <thead>
              <tr>
                <th className="position-head">Pos</th>
                {slots.map((slot, index) => (
                  <th key={slot.id} className={slot.id === slotAhoraId ? "time nowcol" : "time"}>
                    <span className="slot-head">
                      <span className="slot-hours">
                        <strong>{slot.start}</strong>
                        <small>{slot.end}{slot.id === slotAhoraId ? " · ahora" : ""}</small>
                      </span>
                      <span className="slot-turn">Turno {index + 1}</span>
                    </span>
                    {isAdmin ? <span className="slot-admin-count"><strong>{assignedCountBySlot.get(slot.id) ?? 0}</strong><small>asignados · ideal {slot.idealCoverage ?? 40} · mín. {slot.minimumCoverage ?? 30}</small></span> : null}
                    {isAdmin ? <button className="clear-slot-button" type="button" disabled={clearingSlotId === slot.id} onClick={() => void clearSlot(slot)} title="Vaciar turno" aria-label={`Vaciar turno ${index + 1}`}><Trash2 size={13} /></button> : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => {
                const custom = positionsById.get(position.id)?.name?.trim();
                const tieneNombre = Boolean(custom && custom.toLowerCase() !== `posicion ${position.id}`);
                return (
                  <tr key={position.id}>
                    <th className="position-cell">
                      <span className="pos-num">{position.id}</span>
                      {tieneNombre ? <span className="pos-name">{custom}</span> : null}
                    </th>
                    {slots.map((slot) => {
                      const id = assignmentId(activeDay, slot.id, position.id);
                      const assignment = assignments.get(id);
                      const assignedServer = assignment?.serverId ? servers.get(assignment.serverId) : undefined;
                      const fit = availabilityFit(assignedServer, slot);
                      const inactive = Boolean(assignment?.serverId && assignedServer && !assignedServer.active);
                      const partial = data.settings.warnPartialAvailability && isPartial(fit);
                      const consecutive = assignment?.serverId ? runLengthFor(assignment.serverId, slot, data.assignments, slotsById) >= data.settings.maxConsecutiveShifts : false;
                      const options = optionsForCell(data, slot, id);
                      const esAhora = slot.id === slotAhoraId;
                      const coincide = Boolean(search && assignment?.serverName && normalizeSearch(assignment.serverName).includes(search));
                      const cellClass = [
                        esAhora ? "nowcol" : "",
                        isAdmin && inactive ? "cell-danger" : "",
                        isAdmin && partial ? "cell-warning" : "",
                        isAdmin && consecutive ? "cell-consecutive" : "",
                      ].filter(Boolean).join(" ");
                      return (
                        <td className={cellClass} key={slot.id}>
                          <div className="cell-assignment">
                            {isAdmin && adminDataReady ? (
                              <select value={assignment?.serverId ?? ""} disabled={savingId === id} onChange={(event) => saveAssignment(activeDay, slot.id, position.id, event.target.value || null)}>
                                <option value="">Sin asignar</option>
                                {assignment?.serverId && assignedServer && !options.some((option) => option.server.id === assignedServer.id) ? <option value={assignedServer.id}>{assignedServer.fullName}</option> : null}
                                {options.map((option) => <option key={option.server.id} value={option.server.id}>{isPartial(option.fit) ? `${partialLabel(option.fit)} ${option.server.fullName}` : option.server.fullName}</option>)}
                              </select>
                            ) : isAdmin ? (
                              <span className="cell-name muted">Cargando datos...</span>
                            ) : (
                              <span className={`cell-name${assignment?.serverName ? "" : " muted"}${coincide ? " me" : ""}`}>{assignment?.serverName || "—"}</span>
                            )}
                            {isAdmin && assignment?.serverId && (inactive || partial || consecutive) ? (
                              <small className="cell-alert">
                                <span className={inactive ? "sdot d-danger" : "sdot d-warn"} aria-hidden="true" />
                                {inactive ? "Inactivo" : partial ? `Parcial ${partialLabel(fit)}` : "2 seguidos"}
                              </small>
                            ) : null}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <p className="footer-verse"><span>Sirvan de buena voluntad, como quien sirve al Señor y no a los hombres.</span><strong>Efesios 6:7</strong></p>
          </>
        ) : null}
      </main>

      {planOpen ? (
        <div className="modal-backdrop" onClick={() => setPlanOpen(false)}>
          <section className="modal" onClick={(event) => event.stopPropagation()}>
            <header><h2>Plano del salon principal</h2><button onClick={() => setPlanOpen(false)} aria-label="Cerrar plano"><X size={18} /></button></header>
            {data.plan.imageUrl ? <img className="plan-image" src={data.plan.imageUrl} alt="Plano de posiciones" /> : <div className="plan-placeholder"><ImageIcon size={34} /><p>Subí un PNG del plano desde tu escritorio para verlo acá.</p></div>}
            {data.plan.note ? <p className="plan-note">{data.plan.note}</p> : null}
            {isAdmin ? <form className="plan-form" onSubmit={savePlan}><label className="plan-file-field"><span>PNG del plano</span><input name="planFile" type="file" accept="image/png" /></label><textarea name="note" defaultValue={data.plan.note ?? ""} placeholder="Nota visible junto al plano" /><button className="primary-button" type="submit">Guardar plano</button></form> : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
