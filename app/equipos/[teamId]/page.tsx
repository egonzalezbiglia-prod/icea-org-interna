import { CongressApp } from "@/components/congress-app";
import { getSchedulePayload } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export default async function TeamPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const initialData = await getSchedulePayload(teamId);
  return <CongressApp initialData={initialData} />;
}
