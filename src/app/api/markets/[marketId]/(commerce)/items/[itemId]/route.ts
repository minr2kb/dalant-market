import { err, marketAdminRoute, ok } from "@/lib/api/route-helpers";

export const DELETE = marketAdminRoute<{ marketId: string; itemId: string }>(
  async (_req, { supabase, params }) => {
    const { error } = await supabase
      .from("market_items")
      .delete()
      .eq("id", params.itemId);
    if (error) return err(error.message);
    return ok({ id: params.itemId });
  },
);
