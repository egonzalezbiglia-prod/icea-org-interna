"use client";

import type React from "react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, BarChart3, CalendarClock, Check, Copy, Home, Lock, Download, LogOut, Menu, MessageCircle, MoreHorizontal, Pencil, Plus, RefreshCw, Rows3, SlidersHorizontal, Trash2, Upload, Users, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { COUNTRIES, DEFAULT_IDEAL_COVERAGE, DEFAULT_MINIMUM_COVERAGE, cleanPhone, fechaCortaDia, hoursBetween, normalizeSearch, whatsappUrl } from "@/lib/domain";
import type { Assignment, AvailabilityRange, CountryCode, DayId, Position, SchedulePayload, Server, Slot } from "@/lib/types";

const ADMIN_KEY = "1icea2026";
const ADMIN_SESSION_KEY = "icea-admin-ok";
const NEW_SERVER_AVAILABILITY_TEMPLATE = "jueves 13:00-22:00\nviernes 08:00-23:00\nsabado 08:00-23:00";

type AdminTab = "servers" | "slots" | "positions" | "rules";

type ImportedServer = {
  fullName: string;
  whatsapp: string;
  countryCode: CountryCode;
  active: boolean;
  availability: AvailabilityRange[];
};

type CellValue = string | number | boolean | null | undefined;

const COVERAGE_COMPOSITION = [
  { position: "Auditorio", ideal: 20, minimum: 18 },
  { position: "Escalera", ideal: 8, minimum: 6 },
  { position: "Ascensor", ideal: 4, minimum: 2 },
  { position: "VIP", ideal: 2, minimum: 1 },
  { position: "Accesos", ideal: 6, minimum: 4 },
];

function normalizeTimeToken(value: string) {
  const clean = value.trim().replace(/\./g, ":");
  if (/^\d{1,2}$/.test(clean)) return clean.padStart(2, "0") + ":00";
  if (/^\d{3,4}$/.test(clean)) {
    const padded = clean.padStart(4, "0");
    return padded.slice(0, 2) + ":" + padded.slice(2);
  }
  const match = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "";
  return match[1].padStart(2, "0") + ":" + match[2];
}

function parseDayAvailability(value: CellValue, dayId: DayId): AvailabilityRange[] {
  const text = String(value ?? "").toLowerCase();
  const ranges: AvailabilityRange[] = [];
  const matcher = /(\d{1,2}(?::|\.)?\d{0,2})\s*(?:-|–|—|a|al|hasta)\s*(\d{1,2}(?::|\.)?\d{0,2})/gi;
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(text))) {
    const start = normalizeTimeToken(match[1]);
    const end = normalizeTimeToken(match[2]);
    if (/^\d{2}:\d{2}$/.test(start) && /^\d{2}:\d{2}$/.test(end) && hoursBetween(start, end) > 0) {
      ranges.push({ id: `${dayId}-${start.replace(":", "")}-${ranges.length}`, dayId, start, end });
    }
  }
  return ranges;
}

function parseCsvRows(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function looksLikeImportHeader(row: CellValue[]) {
  const first = normalizeSearch(String(row[0] ?? ""));
  const second = normalizeSearch(String(row[1] ?? ""));
  return first.includes("nombre") || second.includes("celular") || second.includes("telefono");
}

function rowsToServers(rows: CellValue[][]): ImportedServer[] {
  const dataRows = rows.filter((row) => row.some((cell) => String(cell ?? "").trim())).slice(0, 501);
  const withoutHeader = dataRows[0] && looksLikeImportHeader(dataRows[0]) ? dataRows.slice(1) : dataRows;
  return withoutHeader
    .map((row) => {
      const fullName = String(row[0] ?? "").trim();
      const whatsapp = cleanPhone(String(row[1] ?? ""));
      const availability = [
        ...parseDayAvailability(row[2], "jueves"),
        ...parseDayAvailability(row[3], "viernes"),
        ...parseDayAvailability(row[4], "sabado"),
      ];
      return { fullName, whatsapp, countryCode: "AR" as CountryCode, active: true, availability };
    })
    .filter((server) => server.fullName);
}


async function downloadServerImportTemplate() {
  const XLSX = await import("xlsx");
  const rows = [
    ["Nombre completo", "celular", "franja jueves", "franja viernes", "franja sábado"],
    ["Ejemplo Servidor", "1140815476", "13:00-18:00", "08:00-13:00 y 18:00-23:00", ""],
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet["!cols"] = [{ wch: 28 }, { wch: 16 }, { wch: 22 }, { wch: 34 }, { wch: 22 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Servidores");
  XLSX.writeFile(workbook, "modelo-importar-servidores.xlsx");
}

function redondearRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function etiquetaDia(dayId: DayId, fallback: string) {
  const etiquetas: Record<DayId, string> = { jueves: "Jueves", viernes: "Viernes", sabado: "Sábado" };
  return etiquetas[dayId] ?? fallback;
}

function firmaTurnos(slots: Slot[]) {
  return slots.map((slot) => `${slot.start}-${slot.end}`).join("|");
}

async function copiarBlobPng(blob: Blob) {
  if (!navigator.clipboard?.write || !("ClipboardItem" in window)) {
    throw new Error("Este navegador no permite copiar imágenes al portapapeles.");
  }
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}

async function copiarHorariosPng(data: SchedulePayload) {
  const ancho = 1100;
  const margen = 56;
  const espacio = 24;
  const turnosPorDia = data.days.map((day) => ({
    day,
    slots: data.slots.filter((slot) => slot.dayId === day.id),
  }));
  const gruposDeTurnos = turnosPorDia.reduce<Array<{ days: typeof data.days; slots: Slot[]; signature: string }>>((groups, current) => {
    const signature = firmaTurnos(current.slots);
    const existing = groups.find((group) => group.signature === signature);
    if (existing) {
      existing.days.push(current.day);
    } else {
      groups.push({ days: [current.day], slots: current.slots, signature });
    }
    return groups;
  }, []);
  const anchoColumna = (ancho - margen * 2 - espacio * (gruposDeTurnos.length - 1)) / gruposDeTurnos.length;
  const maximoTurnos = Math.max(1, ...gruposDeTurnos.map((group) => group.slots.length));
  const altoTarjeta = 100;
  const alto = Math.max(820, 440 + maximoTurnos * (altoTarjeta + 18));
  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo preparar la imagen.");

  ctx.fillStyle = "#f8fbf2";
  ctx.fillRect(0, 0, ancho, alto);
  const fondo = ctx.createLinearGradient(0, 0, ancho, alto);
  fondo.addColorStop(0, "#123328");
  fondo.addColorStop(1, "#214f3e");
  ctx.fillStyle = fondo;
  redondearRect(ctx, 26, 26, ancho - 52, alto - 52, 30);
  ctx.fill();

  ctx.fillStyle = "#f6f3e8";
  ctx.font = "800 44px Georgia, serif";
  ctx.fillText("Distribución de turnos", margen, 96);
  ctx.fillStyle = "rgba(246, 243, 232, 0.76)";
  ctx.font = "700 17px Arial, sans-serif";
  ctx.fillText(data.team.name.toUpperCase(), margen, 132);
  ctx.font = "500 18px Arial, sans-serif";
  ctx.fillText("Días, turnos y rangos horarios para organizar el servicio.", margen, 166);

  gruposDeTurnos.forEach(({ days, slots }, dayIndex) => {
    const x = margen + dayIndex * (anchoColumna + espacio);
    const y = 218;
    redondearRect(ctx, x, y, anchoColumna, 82, 20);
    ctx.fillStyle = "#d8ff6a";
    ctx.fill();
    ctx.fillStyle = "#10241d";
    ctx.font = "900 29px Arial, sans-serif";
    ctx.fillText(days.map((day) => etiquetaDia(day.id, day.label)).join(" y "), x + 22, y + 38);
    ctx.font = "800 17px Arial, sans-serif";
    ctx.fillText(days.map((day) => fechaCortaDia(day.id, data.team.congressDates)).join(" y "), x + 24, y + 64);

    slots.forEach((slot, slotIndex) => {
      const cardY = y + 108 + slotIndex * (altoTarjeta + 18);
      redondearRect(ctx, x, cardY, anchoColumna, altoTarjeta, 18);
      ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
      ctx.fill();
      ctx.strokeStyle = "rgba(16, 36, 29, 0.12)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#1f7a58";
      ctx.font = "900 21px Arial, sans-serif";
      ctx.fillText(`Turno ${slotIndex + 1}`, x + 22, cardY + 36);
      ctx.fillStyle = "#10241d";
      ctx.font = "900 32px Arial, sans-serif";
      ctx.fillText(`${slot.start} - ${slot.end}`, x + 22, cardY + 78);
    });

    if (!slots.length) {
      redondearRect(ctx, x, y + 108, anchoColumna, altoTarjeta, 18);
      ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
      ctx.fill();
      ctx.fillStyle = "#476158";
      ctx.font = "700 21px Arial, sans-serif";
      ctx.fillText("Sin turnos cargados", x + 22, y + 166);
    }
  });

  ctx.fillStyle = "rgba(246, 243, 232, 0.72)";
  ctx.font = "700 22px Arial, sans-serif";
  ctx.fillText("ICEA 2026", margen, alto - 64);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error("No se pudo generar el PNG.")), "image/png");
  });
  await copiarBlobPng(blob);
}

async function copiarReporteCoberturaPng(data: SchedulePayload) {
  const rows = coverageRows(data);
  const margen = 56;
  const paddingTabla = 22;
  const colWidths = [94, 84, 128, 62, 58, 94, 100, 126, 92, 118, 112, 104];
  const anchoTabla = colWidths.reduce((sum, width) => sum + width, 0) + paddingTabla * 2;
  const ancho = Math.max(anchoTabla + margen * 2, 1380);
  const altoFila = 44;
  const alto = Math.max(760, 390 + rows.length * altoFila);
  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo preparar la imagen.");

  ctx.fillStyle = "#f8fbf2";
  ctx.fillRect(0, 0, ancho, alto);
  const fondo = ctx.createLinearGradient(0, 0, ancho, alto);
  fondo.addColorStop(0, "#123328");
  fondo.addColorStop(1, "#214f3e");
  ctx.fillStyle = fondo;
  redondearRect(ctx, 28, 28, ancho - 56, alto - 56, 30);
  ctx.fill();

  ctx.fillStyle = "#f6f3e8";
  ctx.font = "800 44px Georgia, serif";
  ctx.fillText("Reporte de cobertura", margen, 96);
  ctx.fillStyle = "rgba(246, 243, 232, 0.76)";
  ctx.font = "700 17px Arial, sans-serif";
  ctx.fillText(data.team.name.toUpperCase(), margen, 132);
  ctx.font = "500 18px Arial, sans-serif";
  ctx.fillText("Simulación por orden de sugerencia, sin superar turnos consecutivos por día.", margen, 166);

  const compositionX = ancho - margen - 392;
  const compositionY = 54;
  const compositionRowHeight = 20;
  redondearRect(ctx, compositionX, compositionY, 392, 168, 18);
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.fill();
  ctx.strokeStyle = "rgba(216, 255, 106, 0.22)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "rgba(246, 243, 232, 0.82)";
  ctx.font = "800 13px Arial, sans-serif";
  ctx.fillText("Composición por puesto", compositionX + 18, compositionY + 26);
  ctx.fillStyle = "rgba(216, 255, 106, 0.94)";
  ctx.font = "900 12px Arial, sans-serif";
  ctx.fillText("Puesto", compositionX + 18, compositionY + 52);
  ctx.fillText("Ideal", compositionX + 238, compositionY + 52);
  ctx.fillText("Mínimo", compositionX + 306, compositionY + 52);
  ctx.fillStyle = "rgba(246, 243, 232, 0.82)";
  ctx.font = "700 13px Arial, sans-serif";
  COVERAGE_COMPOSITION.forEach((item, index) => {
    const y = compositionY + 76 + index * compositionRowHeight;
    ctx.fillText(item.position, compositionX + 18, y);
    ctx.fillText(String(item.ideal), compositionX + 248, y);
    ctx.fillText(String(item.minimum), compositionX + 322, y);
  });

  const tableX = margen;
  const tableY = 236;
  const headers = ["Día", "Turno", "Horario", "Ideal", "Mín.", "Full bruto", "Neto ideal", "Estado ideal", "Neto mín.", "Estado mín.", "Llegan dps.", "Se van ant."];
  redondearRect(ctx, tableX, tableY, anchoTabla, 50, 18);
  ctx.fillStyle = "#d8ff6a";
  ctx.fill();
  ctx.fillStyle = "#10241d";
  ctx.font = "900 15px Arial, sans-serif";
  let x = tableX + 22;
  headers.forEach((header, index) => {
    ctx.fillText(header, x, tableY + 32);
    x += colWidths[index];
  });

  rows.forEach((row, rowIndex) => {
    const y = tableY + 62 + rowIndex * altoFila;
    redondearRect(ctx, tableX, y, anchoTabla, 36, 12);
    ctx.fillStyle = rowIndex % 2 === 0 ? "rgba(255, 255, 255, 0.94)" : "rgba(255, 255, 255, 0.86)";
    ctx.fill();
    const values = [
      etiquetaDia(row.day.id, row.day.label),
      `Turno ${row.turn}`,
      `${row.slot.start} - ${row.slot.end}`,
      String(row.idealTarget),
      String(row.minimumTarget),
      String(row.grossFull),
      String(row.idealNet),
      "",
      String(row.minimumNet),
      "",
      String(row.arrivesAfter),
      String(row.leavesBefore),
    ];
    ctx.fillStyle = "#10241d";
    ctx.font = "800 16px Arial, sans-serif";
    let cellX = tableX + paddingTabla;
    values.forEach((value, index) => {
      ctx.fillText(value, cellX, y + 24);
      cellX += colWidths[index];
    });

    const tones = {
      ok: ["#d8f0e5", "#115331"],
      mild: ["#fff1a6", "#5c4a00"],
      serious: ["#ffd6c9", "#7f2d15"],
      critical: ["#f8b8b8", "#7e1717"],
    } as Record<string, [string, string]>;
    [
      { status: row.idealStatus, index: 7 },
      { status: row.minimumStatus, index: 9 },
    ].forEach(({ status, index }) => {
      const statusX = tableX + paddingTabla + colWidths.slice(0, index).reduce((sum, width) => sum + width, 0);
      const [bg, fg] = tones[status.tone] ?? tones.critical;
      redondearRect(ctx, statusX, y + 5, 78, 26, 13);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.fillStyle = fg;
      ctx.font = "900 14px Arial, sans-serif";
      ctx.fillText(status.label, statusX + 14, y + 23);
    });
  });

  ctx.fillStyle = "rgba(246, 243, 232, 0.72)";
  ctx.font = "700 22px Arial, sans-serif";
  ctx.fillText("ICEA 2026", margen, alto - 64);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error("No se pudo generar el PNG.")), "image/png");
  });
  await copiarBlobPng(blob);
}

async function readServerImportFile(file: File): Promise<ImportedServer[]> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "xlsx" || extension === "xls") {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = sheetName ? workbook.Sheets[sheetName] : null;
    if (!sheet) return [];
    const rows = XLSX.utils.sheet_to_json<CellValue[]>(sheet, { header: 1, defval: "" });
    return rowsToServers(rows);
  }
  return rowsToServers(parseCsvRows(await file.text()));
}

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

function slotMap(slots: Slot[]) {
  return new Map(slots.map((slot) => [slot.id, slot]));
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

function minutesFromTime(value: string) {
  const [hours = "0", minutes = "0"] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
}

function slotAvailabilityFit(server: Server, slot: Slot) {
  const slotStart = minutesFromTime(slot.start);
  const slotEnd = minutesFromTime(slot.end);
  const ranges = server.availability.filter((range) => range.dayId === slot.dayId);
  const full = ranges.some((range) => minutesFromTime(range.start) <= slotStart && minutesFromTime(range.end) >= slotEnd);
  if (full) return "full";
  const partial = ranges.find((range) => minutesFromTime(range.start) < slotEnd && minutesFromTime(range.end) > slotStart);
  if (!partial) return "none";
  const arrivesAfter = minutesFromTime(partial.start) > slotStart;
  const leavesBefore = minutesFromTime(partial.end) < slotEnd;
  if (arrivesAfter && leavesBefore) return "partial-both";
  if (arrivesAfter) return "arrives-after";
  if (leavesBefore) return "leaves-before";
  return "none";
}

function slotIdealTarget(slot: Slot) {
  return Number(slot.idealCoverage ?? DEFAULT_IDEAL_COVERAGE);
}

function slotMinimumTarget(slot: Slot) {
  return Number(slot.minimumCoverage ?? DEFAULT_MINIMUM_COVERAGE);
}

function idealCoverageStatus(full: number, idealTarget: number, minimumTarget: number) {
  if (full >= Math.ceil(idealTarget * 0.9)) return { label: "Ok", tone: "ok" };
  if (full >= minimumTarget) return { label: "Leve", tone: "mild" };
  if (full >= Math.max(1, minimumTarget - 4)) return { label: "Grave", tone: "serious" };
  return { label: "Crítico", tone: "critical" };
}

function minimumCoverageStatus(full: number, minimumTarget: number) {
  if (full >= minimumTarget) return { label: "Ok", tone: "ok" };
  if (full >= Math.max(1, minimumTarget - 2)) return { label: "Leve", tone: "mild" };
  if (full >= Math.max(1, minimumTarget - 6)) return { label: "Grave", tone: "serious" };
  return { label: "Crítico", tone: "critical" };
}

function isFullAvailable(server: Server, slot: Slot) {
  const slotStart = minutesFromTime(slot.start);
  const slotEnd = minutesFromTime(slot.end);
  return server.availability.some((range) => range.dayId === slot.dayId && minutesFromTime(range.start) <= slotStart && minutesFromTime(range.end) >= slotEnd);
}

function simulatedNetFullBySlot(data: SchedulePayload, targetForSlot: (slot: Slot) => number) {
  const activeServers = data.servers.filter((server) => server.active);
  const simulatedLoad = new Map(activeServers.map((server) => [server.id, { occupiedHours: 0, shiftCount: 0 }]));
  const netBySlot = new Map<string, number>();
  const assignmentsBySlot = new Map<string, Server[]>();

  data.days.forEach((day) => {
    const streakByServer = new Map(activeServers.map((server) => [server.id, 0]));
    data.slots
      .filter((slot) => slot.dayId === day.id)
      .forEach((slot) => {
        const eligible = activeServers
          .filter((server) => isFullAvailable(server, slot))
          .filter((server) => (streakByServer.get(server.id) ?? 0) < data.settings.maxConsecutiveShifts);
        netBySlot.set(slot.id, eligible.length);

        const chosen = eligible
          .sort((a, b) => {
            const availabilityDiff = availabilityHours(a) - availabilityHours(b);
            if (availabilityDiff !== 0) return availabilityDiff;
            const loadA = simulatedLoad.get(a.id) ?? { occupiedHours: 0, shiftCount: 0 };
            const loadB = simulatedLoad.get(b.id) ?? { occupiedHours: 0, shiftCount: 0 };
            if (loadA.occupiedHours !== loadB.occupiedHours) return loadA.occupiedHours - loadB.occupiedHours;
            if (loadA.shiftCount !== loadB.shiftCount) return loadA.shiftCount - loadB.shiftCount;
            return a.fullName.localeCompare(b.fullName, "es");
          })
          .slice(0, targetForSlot(slot));
        assignmentsBySlot.set(slot.id, chosen);
        const chosenIds = new Set(chosen.map((server) => server.id));
        activeServers.forEach((server) => {
          streakByServer.set(server.id, chosenIds.has(server.id) ? (streakByServer.get(server.id) ?? 0) + 1 : 0);
        });
        chosen.forEach((server) => {
          const load = simulatedLoad.get(server.id) ?? { occupiedHours: 0, shiftCount: 0 };
          simulatedLoad.set(server.id, { occupiedHours: load.occupiedHours + hoursBetween(slot.start, slot.end), shiftCount: load.shiftCount + 1 });
        });
      });
  });

  return { netBySlot, assignmentsBySlot };
}

async function downloadCoverageSuggestion(data: SchedulePayload) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();

  [
    { label: "Objetivo ideal", targetForSlot: slotIdealTarget },
    { label: "Objetivo mínimo", targetForSlot: slotMinimumTarget },
  ].forEach(({ label, targetForSlot }) => {
    const simulation = simulatedNetFullBySlot(data, targetForSlot);
    const assignedCountByServerDay = new Map<string, number>();
    simulation.assignmentsBySlot.forEach((servers, slotId) => {
      const slot = data.slots.find((item) => item.id === slotId);
      if (!slot) return;
      servers.forEach((server) => {
        const key = `${server.id}:${slot.dayId}`;
        assignedCountByServerDay.set(key, (assignedCountByServerDay.get(key) ?? 0) + 1);
      });
    });
    const rows = [
      ["Día", "Turno", "Horario", "Objetivo turno", "Orden", "Servidor", "WhatsApp", "Disponibilidad del día", "Turnos completos totales", "Turnos asignados", "% cobertura persona"],
      ...data.days.flatMap((day) => data.slots
        .filter((slot) => slot.dayId === day.id)
        .flatMap((slot, slotIndex) => {
          const assigned = simulation.assignmentsBySlot.get(slot.id) ?? [];
          return assigned.map((server, serverIndex) => {
            const completeTurns = data.slots.filter((daySlot) => daySlot.dayId === day.id && isFullAvailable(server, daySlot)).length;
            const assignedTurns = assignedCountByServerDay.get(`${server.id}:${day.id}`) ?? 0;
            const coveragePercent = Math.round((assignedTurns / Math.max(1, completeTurns)) * 100);
            return [
              etiquetaDia(day.id, day.label),
              `Turno ${slotIndex + 1}`,
              `${slot.start} - ${slot.end}`,
              targetForSlot(slot),
              serverIndex + 1,
              server.fullName,
              server.whatsapp,
              availabilityToText(server.availability.filter((range) => range.dayId === day.id)),
              completeTurns,
              assignedTurns,
              `${coveragePercent}%`,
            ];
          });
        })),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet["!cols"] = [{ wch: 12 }, { wch: 10 }, { wch: 16 }, { wch: 14 }, { wch: 8 }, { wch: 30 }, { wch: 18 }, { wch: 28 }, { wch: 22 }, { wch: 18 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, worksheet, label);
  });

  XLSX.writeFile(workbook, "sugerencia-asignacion-servidores.xlsx");
}

function coverageRows(data: SchedulePayload) {
  const activeServers = data.servers.filter((server) => server.active);
  const idealNetBySlot = simulatedNetFullBySlot(data, slotIdealTarget).netBySlot;
  const minimumNetBySlot = simulatedNetFullBySlot(data, slotMinimumTarget).netBySlot;
  return data.days.flatMap((day) => data.slots
    .filter((slot) => slot.dayId === day.id)
    .map((slot, index) => {
      const metrics = activeServers.reduce((counts, server) => {
        const fit = slotAvailabilityFit(server, slot);
        if (fit === "full") counts.grossFull += 1;
        if (fit === "arrives-after" || fit === "partial-both") counts.arrivesAfter += 1;
        if (fit === "leaves-before" || fit === "partial-both") counts.leavesBefore += 1;
        return counts;
      }, { grossFull: 0, arrivesAfter: 0, leavesBefore: 0 });
      const idealTarget = slotIdealTarget(slot);
      const minimumTarget = slotMinimumTarget(slot);
      const idealNet = idealNetBySlot.get(slot.id) ?? metrics.grossFull;
      const minimumNet = minimumNetBySlot.get(slot.id) ?? metrics.grossFull;
      return { day, slot, turn: index + 1, idealTarget, minimumTarget, idealNet, minimumNet, idealStatus: idealCoverageStatus(idealNet, idealTarget, minimumTarget), minimumStatus: minimumCoverageStatus(minimumNet, minimumTarget), ...metrics };
    }));
}

function availabilityToText(ranges: AvailabilityRange[]) {
  return ranges.map((range) => range.dayId + " " + range.start + "-" + range.end).join("\n");
}

function parseAvailabilityText(value: string): AvailabilityRange[] {
  return value
    .split("\n")
    .map((line) => line.trim().toLowerCase())
    .filter(Boolean)
    .map((line, index) => {
      const [dayRaw, timeRaw] = line.split(/\s+/, 2);
      const [start = "", end = ""] = (timeRaw ?? "").split("-");
      return {
        id: dayRaw + "-" + start.replace(":", "") + "-" + index,
        dayId: dayRaw as DayId,
        start,
        end,
      };
    })
    .filter((range) => ["jueves", "viernes", "sabado"].includes(range.dayId) && /^\d{2}:\d{2}$/.test(range.start) && /^\d{2}:\d{2}$/.test(range.end));
}

export function AdminApp({ initialData }: { initialData: SchedulePayload }) {
  const [data, setData] = useState(initialData);
  const teamId = initialData.team.id;
  const adminSessionKey = `${ADMIN_SESSION_KEY}:${teamId}`;
  const [adminKey, setAdminKey] = useState(() => (typeof window !== "undefined" && window.sessionStorage.getItem(adminSessionKey) === "1" ? ADMIN_KEY : ""));
  const [adminInput, setAdminInput] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("servers");
  const [message, setMessage] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const isAdmin = adminKey === ADMIN_KEY;

  function enterAdmin(event: React.FormEvent) {
    event.preventDefault();
    if (adminInput === ADMIN_KEY) {
      setAdminKey(ADMIN_KEY);
      window.sessionStorage.setItem(adminSessionKey, "1");
      setAdminInput("");
      setMessage("");
      return;
    }
    setMessage("Clave de admin incorrecta.");
  }

  function leaveAdmin() {
    setAdminKey("");
    window.sessionStorage.removeItem(adminSessionKey);
    setMessage("Sesion admin cerrada.");
  }

  async function mutateConfig(body: Record<string, unknown>) {
    setMessage("");
    try {
      const next = await apiJson<SchedulePayload>("/api/config", {
        method: "PATCH",
        body: JSON.stringify({ ...body, teamId, editKey: adminKey }),
      });
      setData(next);
      setMessage("Cambios guardados.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo actualizar.");
    }
  }

  async function refreshData() {
    setMessage("");
    try {
      const next = await apiJson<SchedulePayload>(`/api/schedule?teamId=${encodeURIComponent(teamId)}`);
      setData(next);
      setMessage("Info actualizada.");
      return next;
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo actualizar.";
      setMessage(message);
      throw new Error(message);
    }
  }

  const tabs: Array<{ id: AdminTab; label: string; icon: React.ReactNode; count: number }> = [
    { id: "servers", label: "Servidores", icon: <Users size={17} />, count: data.servers.length },
    { id: "slots", label: "Horarios", icon: <CalendarClock size={17} />, count: data.slots.length },
    { id: "positions", label: "Posiciones", icon: <Rows3 size={17} />, count: data.positions.length },
    { id: "rules", label: "Reglas", icon: <SlidersHorizontal size={17} />, count: data.settings.maxConsecutiveShifts },
  ];

  if (!isAdmin) {
    return (
      <div className="app-shell">
        <header className="topbar">
          <div className="topbar-title"><p className="eyebrow">ICEA 2026 · {data.team.name.toUpperCase()}</p><h1>Admin</h1></div>
          <div className="topbar-actions">
            <div className="menu-wrap">
              <button className="ghost-button menu-trigger" type="button" aria-label="Más opciones" aria-haspopup="menu" aria-expanded={navMenuOpen} onClick={() => setNavMenuOpen((open) => !open)}><MoreHorizontal size={18} /></button>
              {navMenuOpen ? (
                <>
                  <button className="menu-backdrop" aria-hidden="true" tabIndex={-1} onClick={() => setNavMenuOpen(false)} />
                  <div className="menu-pop" role="menu">
                    <Link className="menu-item" href="/" role="menuitem" onClick={() => setNavMenuOpen(false)}><Home size={16} />Inicio</Link>
                    <Link className="menu-item" href={`/equipos/${teamId}`} role="menuitem" onClick={() => setNavMenuOpen(false)}><ArrowLeft size={16} />Grilla</Link>
                    <div className="menu-item menu-item-theme"><span>Tema</span><ThemeToggle /></div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </header>
        <main className="admin-page">
          <form className="admin-login-card" onSubmit={enterAdmin}>
            <Lock size={22} />
            <h2>Acceso admin</h2>
            <p>Gestiona servidores, horarios, posiciones y reglas del equipo.</p>
            <input autoFocus value={adminInput} onChange={(event) => setAdminInput(event.target.value)} type="password" placeholder="Clave admin" />
            {message ? <span className="form-error">{message}</span> : null}
            <button className="primary-button" type="submit">Entrar</button>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-title"><p className="eyebrow">ICEA 2026 · {data.team.name.toUpperCase()}</p><h1>Admin</h1></div>
        <div className="topbar-actions">
          <button className="admin-menu-toggle ghost-button" type="button" onClick={() => setMobileMenuOpen((open) => !open)} aria-expanded={mobileMenuOpen} aria-controls="admin-sections"><Menu size={17} />Menu</button>
          <div className="menu-wrap">
            <button className="ghost-button menu-trigger" type="button" aria-label="Más opciones" aria-haspopup="menu" aria-expanded={navMenuOpen} onClick={() => setNavMenuOpen((open) => !open)}><MoreHorizontal size={18} /></button>
            {navMenuOpen ? (
              <>
                <button className="menu-backdrop" aria-hidden="true" tabIndex={-1} onClick={() => setNavMenuOpen(false)} />
                <div className="menu-pop" role="menu">
                  <Link className="menu-item" href="/" role="menuitem" onClick={() => setNavMenuOpen(false)}><Home size={16} />Inicio</Link>
                  <Link className="menu-item" href={`/equipos/${teamId}`} role="menuitem" onClick={() => setNavMenuOpen(false)}><ArrowLeft size={16} />Grilla</Link>
                  <div className="menu-item menu-item-theme"><span>Tema</span><ThemeToggle /></div>
                  <button className="menu-item" type="button" role="menuitem" onClick={() => { setNavMenuOpen(false); leaveAdmin(); }}><LogOut size={16} />Salir admin</button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </header>
      <main className="admin-page">
        <section className="admin-workspace">
          {mobileMenuOpen ? <button className="admin-sidebar-backdrop" type="button" aria-label="Cerrar menu" onClick={() => setMobileMenuOpen(false)} /> : null}
          <aside id="admin-sections" className={"admin-sidebar " + (mobileMenuOpen ? "open" : "")} aria-label="Secciones admin">
            <div className="admin-sidebar-mobile-head"><strong>Menu</strong><button className="icon-button" type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Cerrar menu"><X size={17} /></button></div>
            {tabs.map((tab) => <button key={tab.id} className={activeTab === tab.id ? "active" : ""} onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}>{tab.icon}<span>{tab.label}</span><strong>{tab.count}</strong></button>)}
          </aside>
          <div className="admin-main">
            {message ? <section className="edit-strip"><p>{message}</p></section> : null}
            {activeTab === "servers" ? <ServersAdmin data={data} onMutate={mutateConfig} onRefresh={refreshData} /> : null}
            {activeTab === "slots" ? <SlotsAdmin data={data} onMutate={mutateConfig} /> : null}
            {activeTab === "positions" ? <PositionsAdmin data={data} onMutate={mutateConfig} /> : null}
            {activeTab === "rules" ? <RulesAdmin data={data} onMutate={mutateConfig} /> : null}
          </div>
        </section>
      </main>
    </div>
  );
}

function confirmDelete(label: string) {
  return window.confirm("Eliminar " + label + "? Tambien se borraran sus asignaciones relacionadas.");
}

function dayAvailabilityPercent(server: Server, dayId: DayId, slots: Slot[]) {
  const total = slots.filter((slot) => slot.dayId === dayId).reduce((sum, slot) => sum + hoursBetween(slot.start, slot.end), 0);
  const available = server.availability.filter((range) => range.dayId === dayId).reduce((sum, range) => sum + hoursBetween(range.start, range.end), 0);
  return total ? Math.min(100, Math.round((available / total) * 100)) : 0;
}

function availabilityTone(percent: number) {
  if (percent <= 0) return "none";
  if (percent < 20) return "low";
  if (percent < 50) return "medium";
  if (percent <= 75) return "good";
  return "full";
}

function ServersAdmin({ data, onMutate, onRefresh }: { data: SchedulePayload; onMutate: (body: Record<string, unknown>) => Promise<void>; onRefresh: () => Promise<SchedulePayload> }) {
  const slotsById = useMemo(() => slotMap(data.slots), [data.slots]);
  const [coverageData, setCoverageData] = useState<SchedulePayload | null>(null);
  const coverageSource = coverageData ?? data;
  const coverage = useMemo(() => coverageRows(coverageSource), [coverageSource]);
  const [editingServer, setEditingServer] = useState<Server | null>(null);
  const [creatingServer, setCreatingServer] = useState(false);
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [coverageCopyMessage, setCoverageCopyMessage] = useState("");
  const [refreshingCoverage, setRefreshingCoverage] = useState(false);
  const [downloadingSuggestion, setDownloadingSuggestion] = useState(false);
  const [importingServers, setImportingServers] = useState(false);
  const [importMessage, setImportMessage] = useState("");


  async function importServersFromFile(file: File) {
    setImportingServers(true);
    setImportMessage("");
    try {
      const servers = await readServerImportFile(file);
      if (!servers.length) {
        setImportMessage("No encontré servidores válidos para importar.");
        return;
      }
      await onMutate({ type: "importServers", servers });
      setImportMessage(`Importación enviada: ${servers.length} servidor${servers.length === 1 ? "" : "es"}. Los existentes se omiten por nombre o celular.`);
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : "No se pudo importar el archivo.");
    } finally {
      setImportingServers(false);
    }
  }

  async function saveServer(event: React.FormEvent<HTMLFormElement>, server?: Server) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const countryCode = String(form.get("countryCode") ?? "AR") as CountryCode;
    const country = COUNTRIES.find((item) => item.code === countryCode) ?? COUNTRIES[0];
    await onMutate({
      type: "upsertServer",
      server: {
        id: server?.id,
        fullName: String(form.get("fullName") ?? ""),
        whatsapp: cleanPhone(String(form.get("whatsapp") ?? "")),
        countryCode,
        dialCode: country.dialCode,
        active: form.get("active") === "on",
        availability: parseAvailabilityText(String(form.get("availability") ?? "")),
      },
    });
    formElement.reset();
    setEditingServer(null);
    setCreatingServer(false);
  }

  async function copyCoverageImage() {
    setCoverageCopyMessage("");
    try {
      await copiarReporteCoberturaPng(coverageSource);
      setCoverageCopyMessage("Reporte copiado. Ya podés pegarlo donde quieras compartirlo.");
    } catch (error) {
      setCoverageCopyMessage(error instanceof Error ? error.message : "No se pudo copiar el reporte.");
    }
  }

  async function refreshCoverage() {
    setRefreshingCoverage(true);
    setCoverageCopyMessage("");
    try {
      const next = await onRefresh();
      setCoverageData(next);
      setCoverageCopyMessage("Reporte actualizado con la información más reciente.");
    } catch (error) {
      setCoverageCopyMessage(error instanceof Error ? error.message : "No se pudo actualizar el reporte.");
    } finally {
      setRefreshingCoverage(false);
    }
  }

  async function downloadSuggestion() {
    setDownloadingSuggestion(true);
    setCoverageCopyMessage("");
    try {
      await downloadCoverageSuggestion(coverageSource);
      setCoverageCopyMessage("Sugerencia descargada con objetivos por turno.");
    } catch (error) {
      setCoverageCopyMessage(error instanceof Error ? error.message : "No se pudo descargar la sugerencia.");
    } finally {
      setDownloadingSuggestion(false);
    }
  }

  const editorServer = creatingServer ? null : editingServer;
  const editorOpen = creatingServer || Boolean(editingServer);

  return (
    <section className="admin-card">
      <div className="admin-card-head"><div><h3>Servidores</h3><span>{data.servers.length} cargados</span></div><div className="admin-card-actions"><button className="ghost-button" type="button" onClick={() => { setCoverageData(data); setCoverageOpen(true); setCoverageCopyMessage(""); }}><BarChart3 size={16} />Reporte</button><button className="ghost-button" type="button" onClick={() => void downloadServerImportTemplate()}><Download size={16} />Modelo</button><label className={importingServers ? "ghost-button disabled" : "ghost-button"}><Upload size={16} />Importar<input type="file" accept=".xlsx,.xls,.csv,text/csv" disabled={importingServers} onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void importServersFromFile(file); event.currentTarget.value = ""; }} /></label><button className="primary-button" type="button" onClick={() => { setCreatingServer(true); setEditingServer(null); }}><Plus size={16} />Nuevo</button></div></div>
      {importMessage ? <p className="import-note">{importMessage}</p> : null}

      {coverageOpen ? (
        <div className="modal-backdrop" onClick={() => setCoverageOpen(false)}>
          <section className="coverage-report coverage-report-modal" aria-label="Reporte de cobertura por turno" onClick={(event) => event.stopPropagation()}>
            <div className="coverage-report-head"><div><h4>Reporte de cobertura</h4><span>Simulación por orden de sugerencia, sin superar turnos consecutivos por día.</span></div><div className="coverage-actions"><button className="ghost-button" type="button" disabled={refreshingCoverage} onClick={() => void refreshCoverage()}><RefreshCw size={16} />{refreshingCoverage ? "Actualizando" : "Actualizar info"}</button><button className="ghost-button" type="button" disabled={downloadingSuggestion} onClick={() => void downloadSuggestion()}><Download size={16} />{downloadingSuggestion ? "Descargando" : "Descargar sugerencia"}</button><button className="ghost-button" type="button" onClick={() => void copyCoverageImage()}><Copy size={16} />Copiar imagen</button><button className="icon-button" type="button" onClick={() => setCoverageOpen(false)} aria-label="Cerrar reporte"><X size={17} /></button></div></div>
            <div className="coverage-legend"><span className="coverage-status ok">Ok</span><span className="coverage-status mild">Leve</span><span className="coverage-status serious">Grave</span><span className="coverage-status critical">Crítico</span></div>
            {coverageCopyMessage ? <p className="import-note">{coverageCopyMessage}</p> : null}
            <div className="admin-table coverage-table">
              <div className="admin-table-head"><span>Día</span><span>Turno</span><span>Horario</span><span>Ideal</span><span>Mín.</span><span>Full bruto</span><span>Neto ideal</span><span>Estado ideal</span><span>Neto mín.</span><span>Estado mín.</span><span>Llegan dps.</span><span>Se van ant.</span></div>
              {coverage.map((row) => (
                <div className="admin-table-row coverage-row" key={`${row.day.id}-${row.slot.id}`}>
                  <strong>{etiquetaDia(row.day.id, row.day.label)}</strong>
                  <span>Turno {row.turn}</span>
                  <span>{row.slot.start} - {row.slot.end}</span>
                  <strong>{row.idealTarget}</strong>
                  <strong>{row.minimumTarget}</strong>
                  <strong>{row.grossFull}</strong>
                  <strong>{row.idealNet}</strong>
                  <span className={"coverage-status " + row.idealStatus.tone}>{row.idealStatus.label}</span>
                  <strong>{row.minimumNet}</strong>
                  <span className={"coverage-status " + row.minimumStatus.tone}>{row.minimumStatus.label}</span>
                  <span>{row.arrivesAfter}</span>
                  <span>{row.leavesBefore}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {editorOpen ? (
        <div className="modal-backdrop" onClick={() => { setEditingServer(null); setCreatingServer(false); }}>
          <form className="server-editor" onSubmit={(event) => saveServer(event, editorServer ?? undefined)} onClick={(event) => event.stopPropagation()}>
            <div className="server-editor-head"><div><h4>{editorServer ? "Editar servidor" : "Nuevo servidor"}</h4><span>{editorServer?.fullName || "Carga los datos principales"}</span></div><button className="icon-button" type="button" onClick={() => { setEditingServer(null); setCreatingServer(false); }} aria-label="Cerrar editor"><X size={17} /></button></div>
            <div className="server-editor-grid">
              <label><span>Nombre completo</span><input name="fullName" defaultValue={editorServer?.fullName ?? ""} placeholder="Nombre completo" /></label>
              <label><span>Pais</span><select name="countryCode" defaultValue={editorServer?.countryCode ?? "AR"}>{COUNTRIES.map((country) => <option key={country.code} value={country.code}>{country.label} +{country.dialCode}</option>)}</select></label>
              <label><span>Telefono</span><input name="whatsapp" defaultValue={editorServer?.whatsapp ?? ""} placeholder="WhatsApp" /></label>
              <label className="server-active-edit"><input name="active" type="checkbox" defaultChecked={editorServer?.active ?? true} />Activo</label>
              <label className="server-availability-edit"><span>Disponibilidad</span><textarea name="availability" defaultValue={editorServer ? availabilityToText(editorServer.availability) : NEW_SERVER_AVAILABILITY_TEMPLATE} /></label>
            </div>
            <div className="row-actions"><button className="ghost-button" type="button" onClick={() => { setEditingServer(null); setCreatingServer(false); }}>Cancelar</button><button className="primary-button" type="submit">Guardar</button></div>
          </form>
        </div>
      ) : null}

      <div className="admin-table servers-table server-summary-table">
        <div className="admin-table-head"><span>Nombre completo</span><span>WhatsApp</span><span>Capacidad</span><span>Disponibilidad</span><span>Estado</span><span>Acciones</span></div>
        {data.servers.map((server) => {
          const available = availabilityHours(server);
          const { occupiedHours } = occupiedStats(server.id, data.assignments, slotsById);
          const percent = available ? Math.round((occupiedHours / available) * 100) : 0;
          const wa = whatsappUrl(server.dialCode, server.whatsapp);
          return (
            <div className={"admin-table-row server-summary-row " + (server.active ? "" : "inactive")} key={server.id}>
              <strong>{server.fullName}</strong>
              <div className="server-phone-cell">{server.whatsapp ? <span>+{server.dialCode} {server.whatsapp}</span> : <span className="muted">Sin telefono</span>}{wa ? <a className="whatsapp-icon" href={wa} target="_blank" rel="noreferrer" aria-label={`Abrir WhatsApp de ${server.fullName}`}><MessageCircle size={17} /></a> : null}</div>
              <span className="capacity-pill">{occupiedHours}h / {available}h · {percent}%</span>
              <div className="availability-days">
                {data.days.map((day) => {
                  const dayPercent = dayAvailabilityPercent(server, day.id, data.slots);
                  return <span className={"availability-day " + availabilityTone(dayPercent)} key={day.id}><strong>{day.label.slice(0, 1)}</strong>{dayPercent}%</span>;
                })}
              </div>
              <span className={"status-check " + (server.active ? "active" : "inactive")} aria-label={server.active ? "Activo" : "Inactivo"}>{server.active ? <Check size={13} /> : "-"}</span>
              <div className="row-actions"><button className="ghost-icon-button" type="button" onClick={() => { setEditingServer(server); setCreatingServer(false); }} aria-label="Editar servidor"><Pencil size={16} /></button><button className="icon-danger" type="button" onClick={() => confirmDelete(server.fullName) && onMutate({ type: "deleteServer", serverId: server.id })} aria-label="Eliminar servidor"><Trash2 size={16} /></button></div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SlotsAdmin({ data, onMutate }: { data: SchedulePayload; onMutate: (body: Record<string, unknown>) => Promise<void> }) {
  const [newSlotOpen, setNewSlotOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  async function saveSlot(event: React.FormEvent<HTMLFormElement>, slot?: Slot) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    await onMutate({
      type: "upsertSlot",
      slot: {
        id: slot?.id,
        dayId: String(form.get("dayId") ?? slot?.dayId),
        start: String(form.get("start") ?? slot?.start),
        end: String(form.get("end") ?? slot?.end),
        idealCoverage: Number(form.get("idealCoverage") ?? slot?.idealCoverage ?? DEFAULT_IDEAL_COVERAGE),
        minimumCoverage: Number(form.get("minimumCoverage") ?? slot?.minimumCoverage ?? DEFAULT_MINIMUM_COVERAGE),
      },
    });
    if (!slot) {
      formElement.reset();
      setNewSlotOpen(false);
    }
  }

  async function copySlotsImage() {
    setCopyMessage("");
    try {
      await copiarHorariosPng(data);
      setCopyMessage("Imagen copiada. Ya podés pegarla donde quieras compartirla.");
    } catch (error) {
      setCopyMessage(error instanceof Error ? error.message : "No se pudo copiar la imagen.");
    }
  }

  return (
    <section className="admin-card">
      <div className="admin-card-head"><div><h3>Horarios</h3><span>{data.slots.length} turnos</span></div><div className="admin-card-actions"><button className="ghost-button" type="button" onClick={() => void copySlotsImage()}><Copy size={16} />Copiar imagen</button><button className="primary-button" type="button" onClick={() => setNewSlotOpen((open) => !open)}><Plus size={16} />Nuevo</button></div></div>
      {copyMessage ? <p className="import-note">{copyMessage}</p> : null}
      {newSlotOpen ? (
        <form className="admin-new-form slot-new-form" onSubmit={(event) => saveSlot(event)}><select name="dayId" defaultValue={data.days[0]?.id}>{data.days.map((day) => <option key={day.id} value={day.id}>{day.label}</option>)}</select><input name="start" type="time" defaultValue="08:00" /><input name="end" type="time" defaultValue="10:00" /><input name="idealCoverage" type="number" min="1" max="200" defaultValue={DEFAULT_IDEAL_COVERAGE} aria-label="Ideal cobertura" /><input name="minimumCoverage" type="number" min="1" max="200" defaultValue={DEFAULT_MINIMUM_COVERAGE} aria-label="Minimo cobertura" /><button className="primary-button" type="submit">Guardar horario</button></form>
      ) : null}
      <div className="admin-table slots-table">
        <div className="admin-table-head"><span>Dia</span><span>Inicio</span><span>Fin</span><span>Ideal</span><span>Mín.</span><span>Acciones</span></div>
        {data.slots.map((slot) => <form className="admin-table-row slot-data-row" key={slot.id} onSubmit={(event) => saveSlot(event, slot)}><select name="dayId" defaultValue={slot.dayId} aria-label="Dia">{data.days.map((day) => <option key={day.id} value={day.id}>{day.label}</option>)}</select><input name="start" type="time" defaultValue={slot.start} aria-label="Inicio" /><input name="end" type="time" defaultValue={slot.end} aria-label="Fin" /><input name="idealCoverage" type="number" min="1" max="200" defaultValue={slotIdealTarget(slot)} aria-label="Ideal cobertura" /><input name="minimumCoverage" type="number" min="1" max="200" defaultValue={slotMinimumTarget(slot)} aria-label="Minimo cobertura" /><div className="row-actions"><button className="ghost-button" type="submit">Guardar</button><button className="icon-danger" type="button" onClick={() => confirmDelete("el horario " + slot.label) && onMutate({ type: "deleteSlot", slotId: slot.id })} aria-label="Eliminar horario"><Trash2 size={16} /></button></div></form>)}
      </div>
    </section>
  );
}

function PositionsAdmin({ data, onMutate }: { data: SchedulePayload; onMutate: (body: Record<string, unknown>) => Promise<void> }) {
  const [newPositionOpen, setNewPositionOpen] = useState(false);

  async function savePosition(event: React.FormEvent<HTMLFormElement>, position?: Position) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    await onMutate({ type: "upsertPosition", position: { id: position?.id, name: String(form.get("name") ?? position?.name) } });
    if (!position) {
      formElement.reset();
      setNewPositionOpen(false);
    }
  }

  return (
    <section className="admin-card">
      <div className="admin-card-head"><div><h3>Posiciones</h3><span>{data.positions.length} posiciones</span></div><button className="primary-button" type="button" onClick={() => setNewPositionOpen((open) => !open)}><Plus size={16} />Nuevo</button></div>
      {newPositionOpen ? (
        <form className="admin-new-form position-new-form" onSubmit={(event) => savePosition(event)}><input name="name" placeholder={"Posicion " + (data.positions.length + 1)} /><button className="primary-button" type="submit">Guardar posicion</button></form>
      ) : null}
      <div className="admin-table positions-table">
        <div className="admin-table-head"><span>#</span><span>Nombre</span><span>Acciones</span></div>
        {data.positions.map((position) => <form className="admin-table-row position-data-row" key={position.id} onSubmit={(event) => savePosition(event, position)}><strong>{position.id}</strong><input name="name" defaultValue={position.name} aria-label="Nombre de posicion" /><div className="row-actions"><button className="ghost-button" type="submit">Guardar</button><button className="icon-danger" type="button" onClick={() => confirmDelete("la posicion " + position.id) && onMutate({ type: "deletePosition", positionId: position.id })} aria-label="Eliminar posicion"><Trash2 size={16} /></button></div></form>)}
      </div>
    </section>
  );
}

function RulesAdmin({ data, onMutate }: { data: SchedulePayload; onMutate: (body: Record<string, unknown>) => Promise<void> }) {
  async function saveRules(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onMutate({
      type: "updateSettings",
      settings: {
        maxConsecutiveShifts: Number(form.get("maxConsecutiveShifts") ?? data.settings.maxConsecutiveShifts),
        blockAfterMaxConsecutive: form.get("blockAfterMaxConsecutive") === "on",
        allowPartialAvailability: form.get("allowPartialAvailability") === "on",
        warnPartialAvailability: form.get("warnPartialAvailability") === "on",
        preventSameSlotDuplicate: form.get("preventSameSlotDuplicate") === "on",
      },
    });
  }

  return (
    <section className="admin-card">
      <div className="admin-card-head"><div><h3>Reglas</h3><span>Configuración exclusiva de {data.team.name}</span></div></div>
      <form className="rules-form" onSubmit={saveRules}>
        <label><span>Máximo de turnos consecutivos</span><input name="maxConsecutiveShifts" type="number" min="1" max="12" defaultValue={data.settings.maxConsecutiveShifts} /></label>
        <label className="switch-row"><input name="blockAfterMaxConsecutive" type="checkbox" defaultChecked={data.settings.blockAfterMaxConsecutive} /><span>Bloquear cuando supera el máximo</span></label>
        <label className="switch-row"><input name="allowPartialAvailability" type="checkbox" defaultChecked={data.settings.allowPartialAvailability} /><span>Permitir disponibilidad parcial</span></label>
        <label className="switch-row"><input name="warnPartialAvailability" type="checkbox" defaultChecked={data.settings.warnPartialAvailability} /><span>Marcar disponibilidad parcial con alerta</span></label>
        <label className="switch-row"><input name="preventSameSlotDuplicate" type="checkbox" defaultChecked={data.settings.preventSameSlotDuplicate} /><span>Evitar repetir servidor en el mismo turno</span></label>
        <div className="row-actions"><button className="primary-button" type="submit">Guardar reglas</button></div>
      </form>
    </section>
  );
}
