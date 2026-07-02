import { err, marketAdminRoute, ok, route } from "@/lib/api/route-helpers";
import { listItems } from "@/lib/data/items";
import { mapItem } from "@/lib/db";

export const GET = route<{ marketId: string }>(
  async (_req, { supabase, params }) => {
    try {
      return ok(await listItems(supabase, params.marketId));
    } catch (e) {
      return err(e instanceof Error ? e.message : "Error");
    }
  },
);

export const POST = marketAdminRoute<{ marketId: string }>(
  async (req, { supabase, params }) => {
    const body = (await req.json()) as { name: string; price: number };
    const { data, error } = await supabase
      .from("market_items")
      .insert({
        market_id: params.marketId,
        name: body.name,
        price: body.price,
      })
      .select()
      .single();
    if (error || !data) return err(error?.message ?? "Error");
    return ok(mapItem(data), 201);
  },
);
