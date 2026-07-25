import { MasterApp } from "@/components/master-app";
import { listTeams } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export default async function MasterPage() {
  return <MasterApp initialTeams={await listTeams()} />;
}
