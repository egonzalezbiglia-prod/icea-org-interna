import { CongressApp } from "@/components/congress-app";

export const dynamic = "force-dynamic";

export default async function TeamPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  return <CongressApp teamId={teamId} />;
}
