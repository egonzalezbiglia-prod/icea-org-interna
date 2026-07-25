import { AdminApp } from "@/components/admin-app";
import { getSchedulePayload } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export default async function TeamAdminPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const initialData = await getSchedulePayload(teamId);
  return <AdminApp initialData={initialData} />;
}
