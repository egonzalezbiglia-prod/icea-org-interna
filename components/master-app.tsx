"use client";

import type React from "react";
import Link from "next/link";
import { ArrowLeft, Lock, Plus } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Team } from "@/lib/types";

const MASTER_KEY = "Ezequiel#1993";
const MASTER_SESSION_KEY = "icea-master-ok";

function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  return fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } }).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error ?? "Error inesperado");
    return data;
  });
}

export function MasterApp({ initialTeams }: { initialTeams: Team[] }) {
  const [masterKey, setMasterKey] = useState(() => (typeof window !== "undefined" && window.sessionStorage.getItem(MASTER_SESSION_KEY) === "1" ? MASTER_KEY : ""));
  const [input, setInput] = useState("");
  const [teams, setTeams] = useState(initialTeams);
  const [message, setMessage] = useState("");
  const isMaster = masterKey === MASTER_KEY;

  function enter(event: React.FormEvent) {
    event.preventDefault();
    if (input === MASTER_KEY) {
      setMasterKey(MASTER_KEY);
      window.sessionStorage.setItem(MASTER_SESSION_KEY, "1");
      setInput("");
      setMessage("");
      return;
    }
    setMessage("Clave master incorrecta.");
  }

  async function saveTeam(event: React.FormEvent<HTMLFormElement>, team?: Team) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await apiJson<{ teams: Team[] }>("/api/master", {
      method: "PATCH",
      body: JSON.stringify({
        type: "upsertTeam",
        masterKey,
        team: {
          id: team?.id,
          name: String(form.get("name") ?? ""),
          description: String(form.get("description") ?? ""),
          active: form.get("active") === "on",
        },
      }),
    });
    setTeams(result.teams);
    if (!team) event.currentTarget.reset();
    setMessage("Equipo guardado.");
  }

  if (!isMaster) {
    return (
      <div className="app-shell">
        <header className="topbar"><div className="topbar-title"><p className="eyebrow">ICEA 2026</p><h1>Panel master</h1></div><div className="topbar-actions"><ThemeToggle /><Link className="ghost-button" href="/"><ArrowLeft size={17} />Equipos</Link></div></header>
        <main className="admin-page"><form className="admin-login-card" onSubmit={enter}><Lock size={22} /><h2>Acceso master</h2><p>Crea y gestiona equipos independientes.</p><input autoFocus value={input} onChange={(event) => setInput(event.target.value)} type="password" placeholder="Clave master" />{message ? <span className="form-error">{message}</span> : null}<button className="primary-button" type="submit">Entrar</button></form></main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar"><div className="topbar-title"><p className="eyebrow">ICEA 2026</p><h1>Panel master</h1></div><div className="topbar-actions"><ThemeToggle /><Link className="ghost-button" href="/"><ArrowLeft size={17} />Equipos</Link></div></header>
      <main className="admin-page">
        {message ? <section className="edit-strip"><p>{message}</p></section> : null}
        <section className="admin-card master-card">
          <div className="admin-card-head"><div><h3>Equipos</h3><span>{teams.length} creados</span></div></div>
          <form className="admin-new-form master-team-form" onSubmit={(event) => saveTeam(event)}><input name="name" placeholder="Nombre del equipo" /><input name="description" placeholder="Descripción breve" /><label className="active-toggle"><input name="active" type="checkbox" defaultChecked />Activo</label><button className="primary-button" type="submit"><Plus size={16} />Crear equipo</button></form>
          <div className="team-list-table">
            {teams.map((team) => <form className="team-row" key={team.id} onSubmit={(event) => saveTeam(event, team)}><div className="team-row-fields"><strong>{team.id}</strong><input name="name" defaultValue={team.name} aria-label="Nombre del equipo" /><input name="description" defaultValue={team.description ?? ""} aria-label="Descripción del equipo" /><label className="active-toggle"><input name="active" type="checkbox" defaultChecked={team.active} />Activo</label></div><div className="row-actions"><Link className="ghost-button" href={'/equipos/' + team.id}>Grilla</Link><Link className="ghost-button" href={'/equipos/' + team.id + '/admin'}>Admin</Link><button className="primary-button" type="submit">Guardar</button></div></form>)}
          </div>
        </section>
      </main>
    </div>
  );
}
