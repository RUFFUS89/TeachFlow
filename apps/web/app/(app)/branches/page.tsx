import { redirect } from "next/navigation";

import { createServerApiClient } from "@/lib/api-server";
import { getMeOrNull } from "@/lib/me";

import { BranchesClient } from "./branches-client";

export default async function BranchesPage() {
  const me = await getMeOrNull();
  if (!me) redirect("/login");

  const isOwner = me.memberships.some((m) => m.role === "owner" && m.status === "active");
  if (!isOwner) redirect("/dashboard");

  const api = await createServerApiClient();
  const branches = await api.branches.listWithStats();

  return <BranchesClient branches={branches} />;
}
