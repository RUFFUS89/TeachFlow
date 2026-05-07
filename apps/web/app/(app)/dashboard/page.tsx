import { redirect } from "next/navigation";

import { getMeOrNull, highestRole } from "@/lib/me";

import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  // Defesa em profundidade: se aluno chegou aqui, manda pro feed.
  const me = await getMeOrNull();
  if (!me) redirect("/login");
  const role = highestRole(me);
  if (!role) redirect("/onboarding");
  if (role === "usuario") redirect("/feed");

  return <DashboardClient />;
}
