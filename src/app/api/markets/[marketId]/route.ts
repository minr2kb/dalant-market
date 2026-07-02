import { err, ok, route } from "@/lib/api/route-helpers";
import { getMarket } from "@/lib/data/markets";

export const GET = route<{ marketId: string }>(
  async (_req, { supabase, params }) => {
    try {
      return ok(await getMarket(supabase, params.marketId));
    } catch {
      return err("Not found", 404);
    }
  },
);
