import { CongressApp } from "@/components/congress-app";
import { getSchedulePayload } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const initialData = await getSchedulePayload();
  return <CongressApp initialData={initialData} />;
}
