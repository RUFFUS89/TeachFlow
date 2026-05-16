import { redirect } from "next/navigation";

import { createServerApiClient } from "@/lib/api-server";
import { getMeOrNull, highestRole } from "@/lib/me";

import { LessonEditClient } from "./lesson-edit-client";

interface Props {
  params: Promise<{ id: string; lessonId: string }>;
}

export default async function LessonEditPage({ params }: Props) {
  const me = await getMeOrNull();
  if (!me) redirect("/login");
  const role = highestRole(me);
  if (!role) redirect("/onboarding");
  if (role === "usuario") redirect("/feed");

  const { id: courseId, lessonId } = await params;

  const api = await createServerApiClient();
  const lesson = await api.lessons.get(lessonId).catch(() => null);
  if (!lesson) redirect(`/courses/${courseId}`);

  return <LessonEditClient lesson={lesson} courseId={courseId} />;
}
