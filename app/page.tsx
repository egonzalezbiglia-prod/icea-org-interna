import Link from "next/link";
import { Plus, Shield } from "lucide-react";
import { listTeams } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const teams = (await listTeams()).filter((team) => team.active);
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-title"><p className="eyebrow">ICEA 2026</p><h1>Equipos</h1></div>
        <div className="topbar-actions"><Link className="ghost-button" href="/master"><Shield size={17} />Panel master</Link></div>
      </header>
      <main className="page home-page">
        <section className="team-picker">
          <div className="section-heading"><h2>Seleccioná un equipo</h2><span>{teams.length} disponibles</span></div>
          <div className="team-grid">
            {teams.map((team) => <Link className="team-card" href={'/equipos/' + team.id} key={team.id}><strong>{team.name}</strong>{team.description ? <span>{team.description}</span> : null}</Link>)}
            <Link className="team-card add-team-card" href="/master"><Plus size={18} /><strong>Crear otro equipo</strong><span>Desde Panel Master</span></Link>
          </div>
        </section>
      </main>
    </div>
  );
}
