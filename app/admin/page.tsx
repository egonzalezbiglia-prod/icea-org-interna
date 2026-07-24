import { AdminApp } from "@/components/admin-app";
import { getSchedulePayload } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const initialData = await getSchedulePayload();
  return <AdminApp initialData={initialData} />;
}
