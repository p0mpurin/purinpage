import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryClient from "@/components/zine/CategoryClient";
import { categorySummaries } from "@/lib/catalog";
import { categoryLinks } from "@/lib/links";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return categorySummaries.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = categorySummaries.find((c) => c.slug === slug);
  if (!category) return {};
  return {
    title: `${category.title} · WIRED/SYS`,
    description: `${category.tagline}. ${category.count} links.`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const index = categorySummaries.findIndex((c) => c.slug === slug);
  if (index < 0) notFound();

  // Favorites sits outside the page-turn loop of real sections.
  const sections = categorySummaries.filter((c) => c.slug !== "favorites");
  const at = sections.findIndex((c) => c.slug === slug);
  const next = sections[(at + 1) % sections.length];
  const prev = at < 0 ? sections[sections.length - 1] : sections[(at - 1 + sections.length) % sections.length];

  return (
    <CategoryClient
      key={slug}
      category={categorySummaries[index]}
      links={slug === "favorites" ? [] : categoryLinks[slug].links}
      prev={{ slug: prev.slug, title: prev.title }}
      next={{ slug: next.slug, title: next.title }}
    />
  );
}
