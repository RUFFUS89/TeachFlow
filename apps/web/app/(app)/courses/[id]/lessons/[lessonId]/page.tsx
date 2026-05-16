import { redirect } from "next/navigation";

import { createServerApiClient } from "@/lib/api-server";
import { getMeOrNull, highestRole } from "@/lib/me";

import { LessonPlayerClient } from "./lesson-player-client";

interface Props {
  params: Promise<{ id: string; lessonId: string }>;
}

export default async function LessonPage({ params }: Props) {
  const me = await getMeOrNull();
  if (!me) redirect("/login");
  const role = highestRole(me);
  if (!role) redirect("/onboarding");

  const { id: courseId, lessonId } = await params;

  const api = await createServerApiClient();
  const [lesson, course] = await Promise.all([
    api.lessons.get(lessonId).catch(() => null),
    api.courses.get(courseId).catch(() => null),
  ]);

  if (!lesson || !course) redirect(`/courses/${courseId}`);

  const isStaff = role === "owner" || role === "admin";

  return (
    <LessonPlayerClient
      lesson={lesson}
      course={course}
      isStaff={isStaff}
      profileId={me.profile.id}
    />
  );
}
