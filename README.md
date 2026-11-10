This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Cinema sources

`/watch` now reads source catalogs through `/api/cinema`:

- **Internet Archive** film listings and video files use a TypeScript client generated from a public site capture with [reverse-api-engineer](https://github.com/kalil0321/reverse-api-engineer). The capture output is in `scripts/internet_archive_movies_client/`; the application copy is `src/lib/archive-api.ts`. Browser playable files open in Cinema's own player.
- **KissKH** supplies Asian drama listings, search, and episode metadata. The episode player URL is extracted server-side and its HLS and subtitle files are served through Cinema's media route; the external player's scripts are not loaded in the browser. The app adapter is `src/lib/kisskh-api.ts`.
- **Miruro** anime listings, episodes, HLS sources, and subtitles come from its SvelteKit page data. The public flow was captured with `reverse-api-engineer` (run `040832f2f158`); the generated reference client is in `scripts/miruro_anime_api/`, and the app adapter is `src/lib/miruro-data.ts`. Cinema plays the stream through its own HLS player without loading Miruro's page or ad scripts.

Anime, Asian dramas with available sources, and playable Archive films open inside Cinema. Source availability varies by title and region; upstream APIs and signed stream URLs can change. Drama video traffic passes through the app server because the source permits playback only from its own origin, so deployment bandwidth usage may be substantial.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
