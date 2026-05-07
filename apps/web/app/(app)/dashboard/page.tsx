import { redirect } from "next/navigation";

import { getMeOrNull, highestRole } from "@/lib/me";

import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const me = await getMeOrNull();
  if (!me) redirect("/login");
  const role = highestRole(me);
  if (!role) redirect("/onboarding");
  if (role === "usuario") redirect("/feed");

  // Seleciona a membership de staff mais alta (owner > admin)
  const staffMembership =
    me.memberships.find((m) => m.role === "owner" && m.status === "active") ??
    me.memberships.find((m) => m.role === "admin" && m.status === "active");

  if (!staffMembership) redirect("/onboarding");

  return <DashboardClient branchId={staffMembership.branch_id} />;
}
