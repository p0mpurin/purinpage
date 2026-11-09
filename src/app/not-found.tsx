import Link from "next/link";
import PageHead from "@/components/zine/PageHead";

export default function NotFound() {
  return (
    <main className="z-page">
      <div className="z-wrap z-pad">
        <PageHead kanji="迷子" romaji="Maigo / Lost" title="Page not found" deck="This page isn't in the vault. It may have moved, or the address has a typo." />
        <section className="z-soon">
          <div className="z-btn-row">
            <Link href="/" className="z-btn">
              Back to the contents
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
