"use client";

import type React from "react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, CalendarClock, Lock, MessageCircle, Plus, Rows3, Trash2, Users } from "lucide-react";
import { COUNTRIES, cleanPhone, hoursBetween, whatsappUrl } from "@/lib/domain";
import type { Assignment, AvailabilityRange, CountryCode, DayId, Position, SchedulePayload, Server, Slot } from "@/lib/types";

const ADMIN_KEY = "1icea2026";
const ADMIN_SESSION_KEY = "icea-admin-ok";

type AdminTab = "servers" | "slots" | "positions";

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
  const [adminKey, setAdminKey] = useState(() => (typeof window !== "undefined" && window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "1" ? ADMIN_KEY : ""));
  const [adminInput, setAdminInput] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("servers");
  const [message, setMessage] = useState("");
  const isAdmin = adminKey === ADMIN_KEY;

  function enterAdmin(event: React.FormEvent) {
    event.preventDefault();
    if (adminInput === ADMIN_KEY) {
      setAdminKey(ADMIN_KEY);
      window.sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
      setAdminInput("");
      setMessage("");
      return;
    }
    setMessage("Clave de admin incorrecta.");
  }

  function leaveAdmin() {
    setAdminKey("");
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setMessage("Sesion admin cerrada.");
  }

  async function mutateConfig(body: Record<string, unknown>) {
    setMessage("");
    try {
      const next = await apiJson<SchedulePayload>("/api/config", {
        method: "PATCH",
        body: JSON.stringify({ ...body, editKey: adminKey }),
      });
      setData(next);
      setMessage("Cambios guardados.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo actualizar.");
    }
  }

  const tabs: Array<{ id: AdminTab; label: string; icon: React.ReactNode; count: number }> = [
    { id: "servers", label: "Servidores", icon: <Users size={17} />, count: data.servers.length },
    { id: "slots", label: "Horarios", icon: <CalendarClock size={17} />, count: data.slots.length },
    { id: "positions", label: "Posiciones", icon: <Rows3 size={17} />, count: data.positions.length },
  ];

  if (!isAdmin) {
    return (
      <div className="app-shell">
        <header className="topbar">
          <div className="topbar-title"><p className="eyebrow">ICEA 2026 · ORGANIZACIÓN INTERNA</p><h1>Admin</h1></div>
          <div className="topbar-actions"><Link className="ghost-button" href="/"><ArrowLeft size={17} />Grilla</Link></div>
        </header>
        <main className="admin-page">
          <form className="admin-login-card" onSubmit={enterAdmin}>
            <Lock size={22} />
            <h2>Acceso admin</h2>
            <p>Gestiona servidores, horarios y posiciones de organizacion interna.</p>
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
        <div className="topbar-title"><p className="eyebrow">ICEA 2026 · ORGANIZACIÓN INTERNA</p><h1>Admin</h1></div>
        <div className="topbar-actions"><Link className="ghost-button" href="/"><ArrowLeft size={17} />Grilla</Link><button className="primary-button" onClick={leaveAdmin}>Salir admin</button></div>
      </header>
      <main className="admin-page">
        <section className="admin-workspace">
          <aside className="admin-sidebar" aria-label="Secciones admin">
            {tabs.map((tab) => <button key={tab.id} className={activeTab === tab.id ? "active" : ""} onClick={() => setActiveTab(tab.id)}>{tab.icon}<span>{tab.label}</span><strong>{tab.count}</strong></button>)}
          </aside>
          <div className="admin-main">
            {message ? <section className="edit-strip"><p>{message}</p></section> : null}
            {activeTab === "servers" ? <ServersAdmin data={data} onMutate={mutateConfig} /> : null}
            {activeTab === "slots" ? <SlotsAdmin data={data} onMutate={mutateConfig} /> : null}
            {activeTab === "positions" ? <PositionsAdmin data={data} onMutate={mutateConfig} /> : null}
          </div>
        </section>
      </main>
    </div>
  );
}

function confirmDelete(label: string) {
  return window.confirm("Eliminar " + label + "? Tambien se borraran sus asignaciones relacionadas.");
}

function ServersAdmin({ data, onMutate }: { data: SchedulePayload; onMutate: (body: Record<string, unknown>) => Promise<void> }) {
  const slotsById = useMemo(() => slotMap(data.slots), [data.slots]);
  const [newServerOpen, setNewServerOpen] = useState(false);

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
    if (!server) {
      formElement.reset();
      setNewServerOpen(false);
    }
  }

  return (
    <section className="admin-card">
      <div className="admin-card-head"><div><h3>Servidores</h3><span>{data.servers.length} cargados</span></div><button className="primary-button" type="button" onClick={() => setNewServerOpen((open) => !open)}><Plus size={16} />Nuevo</button></div>
      {newServerOpen ? (
        <form className="admin-new-form server-new-form" onSubmit={(event) => saveServer(event)}>
          <input name="fullName" placeholder="Nombre completo" />
          <select name="countryCode" defaultValue="AR">{COUNTRIES.map((country) => <option key={country.code} value={country.code}>{country.label} +{country.dialCode}</option>)}</select>
          <input name="whatsapp" placeholder="WhatsApp" />
          <label><input name="active" type="checkbox" defaultChecked />Activo</label>
          <textarea name="availability" placeholder="jueves 13:00-18:00&#10;viernes 08:00-13:00&#10;viernes 18:00-23:00" />
          <div className="row-actions"><button className="ghost-button" type="button" onClick={() => setNewServerOpen(false)}>Cancelar</button><button className="primary-button" type="submit">Guardar servidor</button></div>
        </form>
      ) : null}
      <div className="admin-table servers-table">
        <div className="admin-table-head"><span>Servidor</span><span>WhatsApp</span><span>Capacidad</span><span>Disponible</span><span>Estado</span><span>Acciones</span></div>
        {data.servers.map((server) => {
          const available = availabilityHours(server);
          const { occupiedHours } = occupiedStats(server.id, data.assignments, slotsById);
          const percent = available ? Math.round((occupiedHours / available) * 100) : 0;
          const wa = whatsappUrl(server.dialCode, server.whatsapp);
          return (
            <form className={"admin-table-row server-data-row " + (server.active ? "" : "inactive")} key={server.id} onSubmit={(event) => saveServer(event, server)}>
              <input name="fullName" defaultValue={server.fullName} aria-label="Nombre completo" />
              <div className="phone-cell"><select name="countryCode" defaultValue={server.countryCode} aria-label="Pais">{COUNTRIES.map((country) => <option key={country.code} value={country.code}>+{country.dialCode}</option>)}</select><input name="whatsapp" defaultValue={server.whatsapp} aria-label="WhatsApp" />{wa ? <a href={wa} target="_blank" rel="noreferrer" aria-label="Abrir WhatsApp"><MessageCircle size={17} /></a> : null}</div>
              <span className="capacity-pill">{occupiedHours}h / {available}h · {percent}%</span>
              <textarea name="availability" defaultValue={availabilityToText(server.availability)} aria-label="Disponibilidad" />
              <label className="active-toggle"><input name="active" type="checkbox" defaultChecked={server.active} />Activo</label>
              <div className="row-actions"><button className="ghost-button" type="submit">Guardar</button><button className="icon-danger" type="button" onClick={() => confirmDelete(server.fullName) && onMutate({ type: "deleteServer", serverId: server.id })} aria-label="Eliminar servidor"><Trash2 size={16} /></button></div>
            </form>
          );
        })}
      </div>
    </section>
  );
}

function SlotsAdmin({ data, onMutate }: { data: SchedulePayload; onMutate: (body: Record<string, unknown>) => Promise<void> }) {
  const [newSlotOpen, setNewSlotOpen] = useState(false);

  async function saveSlot(event: React.FormEvent<HTMLFormElement>, slot?: Slot) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    await onMutate({ type: "upsertSlot", slot: { id: slot?.id, dayId: String(form.get("dayId") ?? slot?.dayId), start: String(form.get("start") ?? slot?.start), end: String(form.get("end") ?? slot?.end) } });
    if (!slot) {
      formElement.reset();
      setNewSlotOpen(false);
    }
  }

  return (
    <section className="admin-card">
      <div className="admin-card-head"><div><h3>Horarios</h3><span>{data.slots.length} turnos</span></div><button className="primary-button" type="button" onClick={() => setNewSlotOpen((open) => !open)}><Plus size={16} />Nuevo</button></div>
      {newSlotOpen ? (
        <form className="admin-new-form slot-new-form" onSubmit={(event) => saveSlot(event)}><select name="dayId" defaultValue={data.days[0]?.id}>{data.days.map((day) => <option key={day.id} value={day.id}>{day.label}</option>)}</select><input name="start" type="time" defaultValue="08:00" /><input name="end" type="time" defaultValue="10:00" /><button className="primary-button" type="submit">Guardar horario</button></form>
      ) : null}
      <div className="admin-table slots-table">
        <div className="admin-table-head"><span>Dia</span><span>Inicio</span><span>Fin</span><span>Acciones</span></div>
        {data.slots.map((slot) => <form className="admin-table-row slot-data-row" key={slot.id} onSubmit={(event) => saveSlot(event, slot)}><select name="dayId" defaultValue={slot.dayId} aria-label="Dia">{data.days.map((day) => <option key={day.id} value={day.id}>{day.label}</option>)}</select><input name="start" type="time" defaultValue={slot.start} aria-label="Inicio" /><input name="end" type="time" defaultValue={slot.end} aria-label="Fin" /><div className="row-actions"><button className="ghost-button" type="submit">Guardar</button><button className="icon-danger" type="button" onClick={() => confirmDelete("el horario " + slot.label) && onMutate({ type: "deleteSlot", slotId: slot.id })} aria-label="Eliminar horario"><Trash2 size={16} /></button></div></form>)}
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
