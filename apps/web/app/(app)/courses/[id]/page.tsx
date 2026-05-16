import { redirect } from "next/navigation";

import { createServerApiClient } from "@/lib/api-server";
import { getMeOrNull, highestRole } from "@/lib/me";

import { CourseDetailClient } from "./course-detail-client";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function CourseDetailPage({ params, searchParams }: Props) {
  const me = await getMeOrNull();
  if (!me) redirect("/login");
  const role = highestRole(me);
  if (!role) redirect("/onboarding");
  if (role === "usuario") redirect("/feed");

  const { id } = await params;
  const { tab } = await searchParams;

  const api = await createServerApiClient();
  const course = await api.courses.get(id).catch(() => null);
  if (!course) redirect("/dashboard");

  return <CourseDetailClient course={course} activeTab={tab ?? "content"} />;
}
