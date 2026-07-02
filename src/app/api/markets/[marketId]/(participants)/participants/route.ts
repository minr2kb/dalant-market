import { authRoute, err, ok } from "@/lib/api/route-helpers";
import { joinMarket, listParticipants } from "@/lib/data/participants";

export const GET = authRoute<{ marketId: string }>(
  async (_req, { supabase, params }) => {
    try {
      return ok(await listParticipants(supabase, params.marketId));
    } catch (e) {
      return err(e instanceof Error ? e.message : "Error");
    }
  },
);

export const POST = authRoute<{ marketId: string }>(
  async (_req, { supabase, params, userId }) => {
    try {
      const result = await joinMarket(supabase, params.marketId, userId);
      return ok(result);
    } catch (e) {
      return err(e instanceof Error ? e.message : "Error");
    }
  },
);
