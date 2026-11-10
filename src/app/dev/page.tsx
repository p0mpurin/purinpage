import DevClient from "@/components/zine/DevClient";
import { SECTION_COUNT, TOTAL_LINKS } from "@/lib/catalog";

export default function DevPage() {
  return <DevClient totalLinks={TOTAL_LINKS} sections={SECTION_COUNT} />;
}
