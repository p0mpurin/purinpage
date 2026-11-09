type PageHeadProps = {
  kanji: string;
  romaji: string;
  title: string;
  deck?: string;
};

/** Magazine-style page opener: romaji label, big title, italic deck and a vertical kanji. */
export default function PageHead({ kanji, romaji, title, deck }: PageHeadProps) {
  return (
    <header className="p-head">
      <span className="c-romaji">{romaji}</span>
      <h1>{title}</h1>
      {deck && <p>{deck}</p>}
      <span className="p-kanji" aria-hidden="true">
        {kanji}
      </span>
    </header>
  );
}
