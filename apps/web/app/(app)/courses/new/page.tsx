import { redirect } from "next/navigation";

import { getMeOrNull, highestRole } from "@/lib/me";

import { NewCourseClient } from "./new-course-client";

interface Props {
  searchParams: Promise<{ branch_id?: string }>;
}

export default async function NewCoursePage({ searchParams }: Props) {
  const me = await getMeOrNull();
  if (!me) redirect("/login");
  const role = highestRole(me);
  if (!role) redirect("/onboarding");
  if (role === "usuario") redirect("/feed");

  const { branch_id } = await searchParams;

  // Resolve branchId: usa query param ou detecta automaticamente da membership
  const branchId =
    branch_id ??
    (me.memberships.find((m) => m.role === "owner" && m.status === "active") ??
      me.memberships.find((m) => m.role === "admin" && m.status === "active"))?.branch_id;

  if (!branchId) redirect("/onboarding");

  return <NewCourseClient branchId={branchId} />;
}
