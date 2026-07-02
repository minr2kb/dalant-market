import { PosContent } from "./PosContent";

export default async function PosPage(
  props: PageProps<"/markets/[id]/admin/pos">,
) {
  const { id: marketId } = await props.params;
  return <PosContent marketId={marketId} />;
}
