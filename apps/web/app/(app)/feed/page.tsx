import { redirect } from "next/navigation";

import { createServerApiClient } from "@/lib/api-server";
import { getMeOrNull, highestRole } from "@/lib/me";

import { FeedClient } from "./feed-client";

export default async function FeedPage() {
  const me = await getMeOrNull();
  if (!me) redirect("/login");

  const role = highestRole(me);
  if (role !== "usuario") redirect("/dashboard");

  const api = await createServerApiClient();
  const [feedData, streakData] = await Promise.all([
    api.feed.me().catch(() => null),
    api.feed.streak(84).catch(() => []),
  ]);

  return (
    <FeedClient
      userName={me.profile.full_name}
      feed={feedData}
      streak={streakData}
    />
  );
}
