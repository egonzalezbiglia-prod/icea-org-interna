import Link from "next/link";
import { ChevronRight, Shield } from "lucide-react";
import { listTeams } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const teams = (await listTeams()).filter((team) => team.active);
  return (
    <div className="app-shell">
      <header className="topbar">
        <p className="eyebrow">ICEA 2026</p>
        <div className="topbar-actions">
          <Link className="ghost-button" href="/master"><Shield size={17} />Panel master</Link>
        </div>
      </header>
      <main className="page home-page">
        <section className="team-picker">
          <div className="picker-head">
            <h2>Seleccioná tu equipo</h2>
            <p className="picker-sub">Entrá al espacio donde vas a servir hoy.</p>
            <span className="picker-count">{teams.length} equipos disponibles</span>
          </div>
          <div className="team-list">
            {teams.map((team) => (
              <Link className="team-row-card" href={`/equipos/${team.id}`} key={team.id}>
                <span className="team-row-mono" aria-hidden="true">{team.name.charAt(0)}</span>
                <span className="team-row-body">
                  <strong>{team.name}</strong>
                  {team.description ? <span>{team.description}</span> : null}
                </span>
                <ChevronRight size={20} className="team-row-chevron" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
