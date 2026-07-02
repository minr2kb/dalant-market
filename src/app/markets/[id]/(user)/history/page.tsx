import { Suspense } from "react";
import { getCurrentUserId } from "@/lib/auth";
import { HistoryClient } from "./HistoryClient";

function Skeleton() {
  return (
    <div className="px-4 max-w-lg mx-auto space-y-5">
      <div className="flex items-baseline justify-between">
        <div className="h-7 w-28 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        <div className="h-5 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
          />
        ))}
      </div>
    </div>
  );
}

export default async function HistoryPage(
  props: PageProps<"/markets/[id]/history">,
) {
  const { id: marketId } = await props.params;
  const userId = await getCurrentUserId();
  if (!userId) return null;

  return (
    <Suspense fallback={<Skeleton />}>
      <HistoryClient marketId={marketId} userId={userId} />
    </Suspense>
  );
}
