import { redirect } from "next/navigation";

import { createServerApiClient } from "@/lib/api-server";
import { getMeOrNull, highestRole } from "@/lib/me";

import { QuizPlayClient } from "./quiz-play-client";

interface Props {
  params: Promise<{ id: string; assignmentId: string }>;
}

export default async function AssignmentPlayPage({ params }: Props) {
  const me = await getMeOrNull();
  if (!me) redirect("/login");
  const role = highestRole(me);
  if (!role) redirect("/onboarding");

  const { id: courseId, assignmentId } = await params;

  const api = await createServerApiClient();
  const playData = await api.assignments.play(assignmentId).catch(() => null);
  if (!playData) redirect(`/courses/${courseId}`);

  return (
    <QuizPlayClient
      playData={playData}
      courseId={courseId}
      profileId={me.profile.id}
    />
  );
}
