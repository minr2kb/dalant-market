import { ScanContent } from "./ScanContent";

export default async function ScanPage(
  props: PageProps<"/markets/[id]/admin/scan">,
) {
  const { id: marketId } = await props.params;
  return <ScanContent marketId={marketId} />;
}
