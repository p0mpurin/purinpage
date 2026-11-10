import HomeClient from "@/components/zine/HomeClient";
import { categorySummaries } from "@/lib/catalog";

export default function Home() {
  return <HomeClient categories={categorySummaries} />;
}
