import type { SupabaseClient } from "@supabase/supabase-js";
import { mapMarket } from "@/lib/db";

export async function getMarket(supabase: SupabaseClient, marketId: string) {
  const { data, error } = await supabase
    .from("markets")
    .select("*")
    .eq("id", marketId)
    .single();
  if (error || !data) throw new Error("Not found");
  return mapMarket(data as Record<string, unknown>);
}
