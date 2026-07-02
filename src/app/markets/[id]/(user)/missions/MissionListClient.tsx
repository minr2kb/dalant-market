"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { MissionList } from "@/components/MissionList";
import { missionsQuery } from "@/lib/query/queries";

export function MissionListClient({
  marketId,
  userId,
}: {
  marketId: string;
  userId: string;
}) {
  const { data: missions } = useSuspenseQuery(
    missionsQuery.list({ marketId, userId: userId || undefined }),
  );
  return (
    <MissionList
      missions={missions.filter((m) => m.isActive)}
      marketId={marketId}
    />
  );
}
