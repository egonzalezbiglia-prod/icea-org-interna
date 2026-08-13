// Next expone este módulo para scripts, aunque no publica sus tipos en el proyecto.
// @ts-expect-error El módulo existe en runtime a través de la dependencia next.
import { loadEnvConfig } from "@next/env";
import { rebuildAssignmentReservations } from "@/lib/repositories";

async function main() {
  loadEnvConfig(process.cwd());
  const teamId = process.argv[2] || "organizacion-interna";
  const total = await rebuildAssignmentReservations(teamId);
  console.log(`Reservas reconstruidas para ${teamId}: ${total}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
