"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Filter, ImageIcon, Map as MapIcon, Lock, LogOut, MessageCircle, Plus, RefreshCw, Search, Settings, Trash2, X } from "lucide-react";
import { COUNTRIES, POSITION_AREAS, assignmentId, cleanPhone, hoursBetween, minutesFromTime, normalizeSearch, whatsappUrl } from "@/lib/domain";
import type { Assignment, AvailabilityRange, CountryCode, DayId, Position, PositionArea, SchedulePayload, Server, Slot } from "@/lib/types";

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

function serverAlreadyInSlot(serverId: string, slotId: string, assignments: Assignment[], currentAssignmentId: string) {
  return assignments.some((assignment) => assignment.id !== currentAssignmentId && assignment.slotId === slotId && assignment.serverId === serverId);
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
    .filter((option) => option.fit !== "none")
    .filter((option) => !serverAlreadyInSlot(option.server.id, slot.id, data.assignments, currentAssignmentId))
    .filter((option) => runLengthFor(option.server.id, slot, data.assignments, slotsById, currentAssignmentId) <= 2)
    .sort((a, b) => {
      if (isPartial(a.fit) !== isPartial(b.fit)) return isPartial(a.fit) ? 1 : -1;
      if (a.availableHours !== b.availableHours) return a.availableHours - b.availableHours;
      if (a.occupiedPercent !== b.occupiedPercent) return a.occupiedPercent - b.occupiedPercent;
      if (a.occupiedHours !== b.occupiedHours) return a.occupiedHours - b.occupiedHours;
      if (a.shiftCount !== b.shiftCount) return a.shiftCount - b.shiftCount;
      return a.server.fullName.localeCompare(b.server.fullName, "es");
    });
}

function availabilityToText(ranges: AvailabilityRange[]) {
  return ranges.map((range) => `${range.dayId} ${range.start}-${range.end}`).join("\n");
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
        id: `${dayRaw}-${start.replace(":", "")}-${index}`,
        dayId: dayRaw as DayId,
        start,
        end,
      };
    })
    .filter((range) => ["jueves", "viernes", "sabado"].includes(range.dayId) && /^\d{2}:\d{2}$/.test(range.start) && /^\d{2}:\d{2}$/.test(range.end));
}

export function CongressApp({ initialData }: { initialData: SchedulePayload }) {
  const [data, setData] = useState(initialData);
  const [activeDay, setActiveDay] = useState<DayId>(initialData.days[0]?.id ?? "jueves");
  const [query, setQuery] = useState("");
  const [area, setArea] = useState<"Todas" | PositionArea>("Todas");
  const [adminKey, setAdminKey] = useState("");
  const [adminInput, setAdminInput] = useState("");
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [actorName, setActorName] = useState("");
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [planOpen, setPlanOpen] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const isAdmin = adminKey === ADMIN_KEY;
  const assignments = useMemo(() => assignmentMap(data.assignments), [data.assignments]);
  const servers = useMemo(() => serverMap(data.servers), [data.servers]);
  const slotsById = useMemo(() => slotMap(data.slots), [data.slots]);
  const slots = useMemo(() => data.slots.filter((slot) => slot.dayId === activeDay), [activeDay, data.slots]);
  const positions = useMemo(() => area === "Todas" ? data.positions : data.positions.filter((position) => position.area === area), [area, data.positions]);
  const search = normalizeSearch(query);

  const personalShifts = useMemo(() => {
    if (!search) return [];
    return data.assignments
      .filter((assignment) => normalizeSearch(assignment.serverName).includes(search))
      .map((assignment) => ({
        assignment,
        day: data.days.find((day) => day.id === assignment.dayId),
        slot: data.slots.find((slot) => slot.id === assignment.slotId),
        position: data.positions.find((position) => position.id === assignment.positionId),
      }))
      .sort((a, b) => {
        const dayOrder = data.days.findIndex((day) => day.id === a.assignment.dayId) - data.days.findIndex((day) => day.id === b.assignment.dayId);
        if (dayOrder !== 0) return dayOrder;
        if (a.assignment.slotId !== b.assignment.slotId) return a.assignment.slotId.localeCompare(b.assignment.slotId);
        return a.assignment.positionId - b.assignment.positionId;
      });
  }, [data, search]);

  useEffect(() => {
    if (window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "1") setAdminKey(ADMIN_KEY);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => refresh().catch(() => undefined), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  async function refresh() {
    setMessage("");
    try {
      const next = await apiJson<SchedulePayload>("/api/schedule");
      setData(next);
      if (isAdmin) setMessage("Grilla actualizada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo actualizar.");
    }
  }

  function enterAdmin(event: React.FormEvent) {
    event.preventDefault();
    if (adminInput === ADMIN_KEY) {
      setAdminKey(ADMIN_KEY);
      window.sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
      setAdminLoginOpen(false);
      setAdminInput("");
      setMessage("Modo admin activo.");
      return;
    }
    setMessage("Clave de admin incorrecta.");
  }

  function leaveAdmin() {
    setAdminKey("");
    setAdminPanelOpen(false);
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
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
        body: JSON.stringify({ dayId, slotId, positionId, serverId, editKey: adminKey, actorName }),
      });
      setData((current) => {
        const next = current.assignments.filter((assignment) => assignment.id !== id);
        if (result.assignment) next.push(result.assignment);
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
        body: JSON.stringify({ imageUrl, note, editKey: adminKey }),
      });
      setData((current) => ({ ...current, plan: result.plan }));
      setMessage("Plano actualizado.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo actualizar el plano.");
    }
  }

  async function mutateConfig(body: Record<string, unknown>) {
    setMessage("");
    try {
      const next = await apiJson<SchedulePayload>("/api/config", {
        method: "PATCH",
        body: JSON.stringify({ ...body, editKey: adminKey }),
      });
      setData(next);
      setMessage("Configuracion actualizada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo actualizar.");
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-title">
          <p className="eyebrow">ICEA 2026 · ORGANIZACIÓN INTERNA</p>
          <h1>Grilla de turnos</h1>
        </div>
        <div className="topbar-actions">
          <button className="ghost-button" onClick={() => setPlanOpen(true)}><MapIcon size={17} />Plano</button>
          <button className="ghost-button" onClick={refresh}><RefreshCw size={17} />Actualizar</button>
          {isAdmin ? (
            <>
              <button className="ghost-button" onClick={() => setAdminPanelOpen((open) => !open)}><Settings size={17} />Config</button>
              <button className="primary-button" onClick={leaveAdmin}><LogOut size={17} />Salir admin</button>
            </>
          ) : <button className="primary-button" onClick={() => setAdminLoginOpen(true)}><Lock size={17} />Admin</button>}
        </div>
      </header>

      <main className="page">
        <section className="controls">
          <label className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Buscar servidor por nombre" />{query ? <button type="button" aria-label="Limpiar busqueda" onClick={() => setQuery("")}><X size={16} /></button> : null}</label>
          <label className="select-field"><Filter size={18} /><select value={area} onChange={(event) => setArea(event.target.value as typeof area)}>{POSITION_AREAS.map((item) => <option key={item}>{item}</option>)}</select></label>
        </section>

        {isAdmin || message ? (
          <section className="edit-strip">
            {isAdmin ? <strong>Modo admin activo</strong> : null}
            {isAdmin ? <input value={actorName} onChange={(event) => setActorName(event.target.value)} placeholder="Tu nombre" /> : null}
            {message ? <p>{message}</p> : null}
          </section>
        ) : null}

        {isAdmin && adminPanelOpen ? <AdminPanel data={data} onMutate={mutateConfig} /> : null}

        {search ? (
          <section className="person-results">
            <div className="section-heading"><h2>Turnos encontrados</h2><span>{personalShifts.length} coincidencias</span></div>
            {personalShifts.length ? (
              <div className="results-grid">
                {personalShifts.map(({ assignment, day, slot, position }) => <article className="result-card" key={assignment.id}><strong>{assignment.serverName}</strong><span>{day?.label} · {slot?.label}</span><small>Pos. {assignment.positionId} · {position?.area}</small></article>)}
              </div>
            ) : <p className="empty-state">No hay turnos asignados para esa busqueda.</p>}
          </section>
        ) : null}

        <nav className="day-tabs" aria-label="Dias del congreso">{data.days.map((day) => <button key={day.id} className={activeDay === day.id ? "active" : ""} onClick={() => setActiveDay(day.id)}>{day.label}</button>)}</nav>

        <section className="schedule-wrap" aria-label="Grilla de turnos">
          <table className="schedule-grid">
            <thead><tr><th className="position-head">Posicion</th>{slots.map((slot) => <th key={slot.id}>{slot.label}</th>)}</tr></thead>
            <tbody>
              {positions.map((position) => (
                <tr key={position.id}>
                  <th className="position-cell"><span>{position.id}</span></th>
                  {slots.map((slot) => {
                    const id = assignmentId(activeDay, slot.id, position.id);
                    const assignment = assignments.get(id);
                    const assignedServer = assignment?.serverId ? servers.get(assignment.serverId) : undefined;
                    const fit = availabilityFit(assignedServer, slot);
                    const inactive = Boolean(assignment?.serverId && assignedServer && !assignedServer.active);
                    const partial = isPartial(fit);
                    const consecutive = assignment?.serverId ? runLengthFor(assignment.serverId, slot, data.assignments, slotsById) >= 2 : false;
                    const options = optionsForCell(data, slot, id);
                    const cellClass = [inactive ? "cell-danger" : "", partial ? "cell-warning" : "", consecutive ? "cell-consecutive" : ""].filter(Boolean).join(" ");
                    return (
                      <td className={cellClass} key={slot.id}>
                        {isAdmin ? (
                          <select value={assignment?.serverId ?? ""} disabled={savingId === id} onChange={(event) => saveAssignment(activeDay, slot.id, position.id, event.target.value || null)}>
                            <option value="">Sin asignar</option>
                            {assignment?.serverId && assignedServer && !options.some((option) => option.server.id === assignedServer.id) ? <option value={assignedServer.id}>{assignedServer.fullName}</option> : null}
                            {options.map((option) => <option key={option.server.id} value={option.server.id}>{isPartial(option.fit) ? `${partialLabel(option.fit)} ${option.server.fullName}` : option.server.fullName}</option>)}
                          </select>
                        ) : <span className={assignment ? "" : "muted"}>{assignment?.serverName || "Sin asignar"}</span>}
                        {assignment?.serverId && (inactive || partial || consecutive) ? <small className="cell-alert"><AlertTriangle size={13} />{inactive ? "Inactivo" : partial ? `Parcial ${partialLabel(fit)}` : "2 seguidos"}</small> : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <p className="footer-verse">Servid con buena voluntad, como al Senor y no a los hombres.</p>
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

      {adminLoginOpen ? (
        <div className="modal-backdrop" onClick={() => setAdminLoginOpen(false)}>
          <form className="login-modal" onSubmit={enterAdmin} onClick={(event) => event.stopPropagation()}>
            <h2>Acceso admin</h2><p>Habilita edicion de turnos, horarios, posiciones, servidores y plano.</p><input autoFocus value={adminInput} onChange={(event) => setAdminInput(event.target.value)} type="password" placeholder="Clave admin" />
            <div><button className="ghost-button" type="button" onClick={() => setAdminLoginOpen(false)}>Cancelar</button><button className="primary-button" type="submit">Entrar</button></div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function AdminPanel({ data, onMutate }: { data: SchedulePayload; onMutate: (body: Record<string, unknown>) => Promise<void> }) {
  const slotsById = useMemo(() => slotMap(data.slots), [data.slots]);

  async function saveSlot(event: React.FormEvent<HTMLFormElement>, slot?: Slot) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onMutate({ type: "upsertSlot", slot: { id: slot?.id, dayId: String(form.get("dayId") ?? slot?.dayId), start: String(form.get("start") ?? slot?.start), end: String(form.get("end") ?? slot?.end) } });
  }

  async function savePosition(event: React.FormEvent<HTMLFormElement>, position?: Position) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onMutate({ type: "upsertPosition", position: { id: position?.id, name: String(form.get("name") ?? position?.name), area: String(form.get("area") ?? position?.area), note: String(form.get("note") ?? position?.note) } });
  }

  async function saveServer(event: React.FormEvent<HTMLFormElement>, server?: Server) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
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
  }

  return (
    <section className="admin-panel">
      <div className="section-heading"><h2>Configuracion admin</h2><span>Servidores, horarios y posiciones</span></div>
      <div className="admin-grid servers-admin">
        <div>
          <h3>Servidores</h3>
          <form className="server-form" onSubmit={(event) => saveServer(event)}>
            <input name="fullName" placeholder="Nombre completo" />
            <select name="countryCode" defaultValue="AR">{COUNTRIES.map((country) => <option key={country.code} value={country.code}>{country.label} +{country.dialCode}</option>)}</select>
            <input name="whatsapp" placeholder="WhatsApp" />
            <label><input name="active" type="checkbox" defaultChecked />Activo</label>
            <textarea name="availability" placeholder="jueves 13:00-18:00&#10;viernes 08:00-13:00&#10;viernes 18:00-23:00" />
            <button className="primary-button" type="submit"><Plus size={16} />Agregar servidor</button>
          </form>
          <div className="server-list">
            {data.servers.map((server) => {
              const available = availabilityHours(server);
              const { occupiedHours } = occupiedStats(server.id, data.assignments, slotsById);
              const percent = available ? Math.round((occupiedHours / available) * 100) : 0;
              const wa = whatsappUrl(server.dialCode, server.whatsapp);
              return (
                <form className={`server-row ${server.active ? "" : "inactive"}`} key={server.id} onSubmit={(event) => saveServer(event, server)}>
                  <div className="server-row-head"><strong>{server.fullName}</strong><span>{available}h disp · {occupiedHours}h ocup · {percent}%</span>{wa ? <a href={wa} target="_blank" rel="noreferrer"><MessageCircle size={16} />WhatsApp</a> : null}</div>
                  <input name="fullName" defaultValue={server.fullName} />
                  <select name="countryCode" defaultValue={server.countryCode}>{COUNTRIES.map((country) => <option key={country.code} value={country.code}>{country.label} +{country.dialCode}</option>)}</select>
                  <input name="whatsapp" defaultValue={server.whatsapp} />
                  <label><input name="active" type="checkbox" defaultChecked={server.active} />Activo</label>
                  <textarea name="availability" defaultValue={availabilityToText(server.availability)} />
                  <button className="ghost-button" type="submit">Guardar servidor</button>
                </form>
              );
            })}
          </div>
        </div>

        <div>
          <h3>Horarios</h3>
          <form className="compact-form" onSubmit={(event) => saveSlot(event)}><select name="dayId" defaultValue={data.days[0]?.id}>{data.days.map((day) => <option key={day.id} value={day.id}>{day.label}</option>)}</select><input name="start" type="time" defaultValue="08:00" /><input name="end" type="time" defaultValue="10:00" /><button className="primary-button" type="submit"><Plus size={16} />Agregar</button></form>
          <div className="config-list">{data.slots.map((slot) => <form className="config-row" key={slot.id} onSubmit={(event) => saveSlot(event, slot)}><strong>{data.days.find((day) => day.id === slot.dayId)?.label}</strong><input name="start" type="time" defaultValue={slot.start} /><input name="end" type="time" defaultValue={slot.end} /><input name="dayId" type="hidden" value={slot.dayId} /><button className="ghost-button" type="submit">Guardar</button><button className="icon-danger" type="button" onClick={() => onMutate({ type: "deleteSlot", slotId: slot.id })} aria-label="Eliminar horario"><Trash2 size={16} /></button></form>)}</div>

          <h3 className="positions-title">Posiciones</h3>
          <form className="compact-form" onSubmit={(event) => savePosition(event)}><input name="name" placeholder={`Posicion ${data.positions.length + 1}`} /><select name="area" defaultValue="Auditorio">{POSITION_AREAS.filter((item) => item !== "Todas").map((item) => <option key={item}>{item}</option>)}</select><input name="note" placeholder="Nota breve" /><button className="primary-button" type="submit"><Plus size={16} />Agregar</button></form>
          <div className="config-list">{data.positions.map((position) => <form className="config-row position-config" key={position.id} onSubmit={(event) => savePosition(event, position)}><strong>{position.id}</strong><input name="name" defaultValue={position.name} /><select name="area" defaultValue={position.area}>{POSITION_AREAS.filter((item) => item !== "Todas").map((item) => <option key={item}>{item}</option>)}</select><input name="note" defaultValue={position.note} /><button className="ghost-button" type="submit">Guardar</button><button className="icon-danger" type="button" onClick={() => onMutate({ type: "deletePosition", positionId: position.id })} aria-label="Eliminar posicion"><Trash2 size={16} /></button></form>)}</div>
        </div>
      </div>
    </section>
  );
}
