import { redirect } from "next/navigation";

import { createServerApiClient } from "@/lib/api-server";
import { getMeOrNull, highestRole } from "@/lib/me";

import { QuizBuilderClient } from "./quiz-builder-client";

interface Props {
  params: Promise<{ id: string; assignmentId: string }>;
}

export default async function AssignmentEditPage({ params }: Props) {
  const me = await getMeOrNull();
  if (!me) redirect("/login");
  const role = highestRole(me);
  if (!role) redirect("/onboarding");
  if (role === "usuario") redirect("/feed");

  const { id: courseId, assignmentId } = await params;

  const api = await createServerApiClient();
  const [assignment, questions] = await Promise.all([
    api.assignments.get(assignmentId).catch(() => null),
    api.assignments.questions.list(assignmentId).catch(() => []),
  ]);

  if (!assignment) redirect(`/courses/${courseId}`);

  return (
    <QuizBuilderClient
      assignment={assignment}
      initialQuestions={questions}
      courseId={courseId}
    />
  );
}
