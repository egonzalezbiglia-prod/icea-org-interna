"use client";

import type React from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Home, ImageIcon, Map as MapIcon, LogOut, MoreHorizontal, RefreshCw, Search, Settings, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { assignmentId, fechaCortaDia, hoursBetween, minutesFromTime, normalizeSearch, slotEnCurso } from "@/lib/domain";
import type { Assignment, DayId, SchedulePayload, Server, Slot } from "@/lib/types";

const ADMIN_KEY = "1icea2026";
const ADMIN_SESSION_KEY = "icea-admin-ok";

type AvailabilityFit = "complete" | "partial-before" | "partial-after" | "partial-both" | "none";

type ServerOption = {
  server: Server;
  fit: AvailabilityFit;
  availableHours: number;
  occupiedHours: number;
  occupiedPercent: number;
  shiftCount: number;
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


export function CongressApp({ initialData }: { initialData: SchedulePayload }) {
  const [data, setData] = useState(initialData);
  const [activeDay, setActiveDay] = useState<DayId>(initialData.days[0]?.id ?? "jueves");
  const [query, setQuery] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const teamId = initialData.team.id;
  const adminSessionKey = `${ADMIN_SESSION_KEY}:${teamId}`;
  const [message, setMessage] = useState("");
  const [planOpen, setPlanOpen] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const isAdmin = adminKey === ADMIN_KEY;
  const assignments = useMemo(() => assignmentMap(data.assignments), [data.assignments]);
  const servers = useMemo(() => serverMap(data.servers), [data.servers]);
  const slotsById = useMemo(() => slotMap(data.slots), [data.slots]);
  const slots = useMemo(() => data.slots.filter((slot) => slot.dayId === activeDay), [activeDay, data.slots]);
  const positions = data.positions;
  const search = normalizeSearch(query);

  const personalShifts = useMemo(() => {
    if (!search) return [];
    return data.assignments
      .filter((assignment) => normalizeSearch(assignment.serverName).includes(search))
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
  }, [data, search]);

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

  const nombrePersona = personalShifts[0]?.assignment.serverName ?? "";
  const inicialPersona = nombrePersona.trim().charAt(0).toUpperCase();
  const labelDiaActivo = data.days.find((day) => day.id === activeDay)?.label ?? "";
  const grupoDiaActivo = personalShiftsByDay.find((group) => group.day.id === activeDay) ?? null;
  const otrosDias = personalShiftsByDay.filter((group) => group.day.id !== activeDay);

  useEffect(() => {
    if (window.sessionStorage.getItem(adminSessionKey) === "1") setAdminKey(ADMIN_KEY);
  }, [adminSessionKey]);

  useEffect(() => {
    const interval = window.setInterval(() => refresh().catch(() => undefined), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  async function refresh() {
    setMessage("");
    try {
      const next = await apiJson<SchedulePayload>(`/api/schedule?teamId=${encodeURIComponent(teamId)}`);
      setData(next);
      if (isAdmin) setMessage("Grilla actualizada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo actualizar.");
    }
  }

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
        return { ...current, assignments: next };
      });
      setMessage("Cambio guardado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar.");
    } finally {
      setSavingId(null);
    }
  }

  async function savePlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await mutatePlan(String(formData.get("imageUrl") ?? ""), String(formData.get("note") ?? ""));
  }

  async function mutatePlan(imageUrl: string, note: string) {
    setMessage("");
    try {
      const result = await apiJson<{ plan: SchedulePayload["plan"] }>("/api/plan", {
        method: "PATCH",
        body: JSON.stringify({ teamId, imageUrl, note, editKey: adminKey }),
      });
      setData((current) => ({ ...current, plan: result.plan }));
      setMessage("Plano actualizado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo actualizar el plano.");
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
          <button className="ghost-button" onClick={() => setPlanOpen(true)}><MapIcon size={17} />Plano</button>
          <button className="ghost-button" onClick={refresh}><RefreshCw size={17} />Actualizar</button>
          <div className="menu-wrap">
            <button className="ghost-button menu-trigger" aria-label="Más opciones" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
              <MoreHorizontal size={18} />
            </button>
            {menuOpen ? (
              <>
                <button className="menu-backdrop" aria-hidden="true" tabIndex={-1} onClick={() => setMenuOpen(false)} />
                <div className="menu-pop" role="menu">
                  <Link className="menu-item" href="/" role="menuitem" onClick={() => setMenuOpen(false)}><Home size={16} />Inicio</Link>
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
        <section className="controls">
          <label className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Buscar servidor por nombre" />{query ? <button type="button" aria-label="Limpiar busqueda" onClick={() => setQuery("")}><X size={16} /></button> : null}</label>
        </section>

        {message ? <section className="edit-strip"><p>{message}</p></section> : null}

        {search ? (
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
                        return (
                          <div className={esAhora ? "you-chip now" : "you-chip"} key={assignment.id}>
                            <b>{slot?.label}</b>
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
                            {shifts.map(({ assignment, slot }) => <li key={assignment.id}><span>{slot?.label}</span><small>{nombrePuesto(assignment.positionId)}</small></li>)}
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

        <section className="schedule-wrap" style={estiloGrilla} aria-label="Grilla de turnos">
          <table className="schedule-grid">
            <thead>
              <tr>
                <th className="position-head">Pos</th>
                {slots.map((slot) => (
                  <th key={slot.id} className={slot.id === slotAhoraId ? "time nowcol" : "time"}>
                    {slot.start}
                    <small>{slot.end}{slot.id === slotAhoraId ? " · ahora" : ""}</small>
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
                      const cellClass = [esAhora ? "nowcol" : "", inactive ? "cell-danger" : "", partial ? "cell-warning" : "", consecutive ? "cell-consecutive" : ""].filter(Boolean).join(" ");
                      return (
                        <td className={cellClass} key={slot.id}>
                          <div className="cell-assignment">
                            {isAdmin ? (
                              <select value={assignment?.serverId ?? ""} disabled={savingId === id} onChange={(event) => saveAssignment(activeDay, slot.id, position.id, event.target.value || null)}>
                                <option value="">Sin asignar</option>
                                {assignment?.serverId && assignedServer && !options.some((option) => option.server.id === assignedServer.id) ? <option value={assignedServer.id}>{assignedServer.fullName}</option> : null}
                                {options.map((option) => <option key={option.server.id} value={option.server.id}>{isPartial(option.fit) ? `${partialLabel(option.fit)} ${option.server.fullName}` : option.server.fullName}</option>)}
                              </select>
                            ) : (
                              <span className={`cell-name${assignment?.serverName ? "" : " muted"}${coincide ? " me" : ""}`}>{assignment?.serverName || "—"}</span>
                            )}
                            {assignment?.serverId && (inactive || partial || consecutive) ? (
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
      </main>

      {planOpen ? (
        <div className="modal-backdrop" onClick={() => setPlanOpen(false)}>
          <section className="modal" onClick={(event) => event.stopPropagation()}>
            <header><h2>Plano del salon principal</h2><button onClick={() => setPlanOpen(false)} aria-label="Cerrar plano"><X size={18} /></button></header>
            {data.plan.imageUrl ? <img className="plan-image" src={data.plan.imageUrl} alt="Plano de posiciones" /> : <div className="plan-placeholder"><ImageIcon size={34} /><p>Cuando este listo, pega aqui el enlace publico de la imagen del plano.</p></div>}
            {data.plan.note ? <p className="plan-note">{data.plan.note}</p> : null}
            {isAdmin ? <form className="plan-form" onSubmit={savePlan}><input name="imageUrl" defaultValue={data.plan.imageUrl ?? ""} placeholder="URL publica de la imagen del plano" /><textarea name="note" defaultValue={data.plan.note ?? ""} placeholder="Nota visible junto al plano" /><button className="primary-button" type="submit">Guardar plano</button></form> : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
