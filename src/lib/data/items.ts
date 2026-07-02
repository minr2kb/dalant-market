import type { SupabaseClient } from "@supabase/supabase-js";
import { mapItem } from "@/lib/db";

export async function listItems(supabase: SupabaseClient, marketId: string) {
  const { data, error } = await supabase
    .from("market_items")
    .select("*")
    .eq("market_id", marketId)
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapItem);
}
