import { redirect } from "next/navigation";
import { DEFAULT_TEAM_ID } from "@/lib/domain";

export default function AdminPage() {
  redirect('/equipos/' + DEFAULT_TEAM_ID + '/admin');
}
