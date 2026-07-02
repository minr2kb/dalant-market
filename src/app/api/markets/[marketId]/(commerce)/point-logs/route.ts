import { authRoute, err, ok } from "@/lib/api/route-helpers";
import { listPointLogs } from "@/lib/data/point-logs";

export const GET = authRoute<{ marketId: string }>(
  async (req, { supabase, params }) => {
    const userId = req.nextUrl.searchParams.get("userId") ?? undefined;
    try {
      return ok(await listPointLogs(supabase, params.marketId, { userId }));
    } catch (e) {
      return err(e instanceof Error ? e.message : "Error");
    }
  },
);
