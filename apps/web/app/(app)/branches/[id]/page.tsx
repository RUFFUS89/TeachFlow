import { redirect } from "next/navigation";

import { createServerApiClient } from "@/lib/api-server";
import { getMeOrNull } from "@/lib/me";

import { BranchDetailClient } from "./branch-detail-client";

export default async function BranchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const me = await getMeOrNull();
  if (!me) redirect("/login");

  const isOwner = me.memberships.some((m) => m.role === "owner" && m.status === "active");
  if (!isOwner) redirect("/dashboard");

  const { id } = await params;
  const { tab } = await searchParams;

  const api = await createServerApiClient();
  const branch = await api.branches.get(id);

  return (
    <BranchDetailClient branch={branch} initialTab={(tab as string) || "members"} />
  );
}
