import { redirect } from "next/navigation";

import { getMeOrNull, highestRole } from "@/lib/me";

import { ActivitiesClient } from "./activities-client";

export default async function ActivitiesPage() {
  const me = await getMeOrNull();
  if (!me) redirect("/login");
  const role = highestRole(me);
  if (!role) redirect("/onboarding");
  if (role === "usuario") redirect("/feed");

  const staffMembership =
    me.memberships.find((m) => m.role === "owner" && m.status === "active") ??
    me.memberships.find((m) => m.role === "admin" && m.status === "active");

  if (!staffMembership) redirect("/onboarding");

  return <ActivitiesClient branchId={staffMembership.branch_id} />;
}
