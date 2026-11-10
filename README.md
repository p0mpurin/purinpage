This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Cinema sources

`/watch` now reads source catalogs through `/api/cinema`:

- **MovieBox** supplies movie, anime, and Asian drama catalogs, searches, episode details, direct video files, and subtitles. The public JSON flow was inspected with [reverse-api-engineer](https://github.com/kalil0321/reverse-api-engineer) and the [Moviebox API reference](https://github.com/faisaljs/Moviebox-API). The app adapter is `src/lib/moviebox-api.ts`. Cinema uses its own player and does not load the source site's ads or scripts.
- **Internet Archive** supplies a separate classic-film catalog and playable video files. Its TypeScript client was generated from a public site capture with `reverse-api-engineer`; the reference is in `scripts/internet_archive_movies_client/` and the app copy is `src/lib/archive-api.ts`.

Miruro and KissKH were removed from the live Cinema path after both returned HTTP 403 to the Vercel deployment. Their earlier API capture remains in `scripts/miruro_anime_api/` for reference. Playback availability still varies by title and region; upstream APIs and signed video URLs can change.

MovieBox MP4s are fetched in 1 MiB byte ranges through `/api/cinema/moviebox/media` because the CDN rejects Cinema as a direct referrer. This uses Vercel function bandwidth for playback. Subtitles are converted from signed SRT files to VTT through `/api/cinema/moviebox/subtitle`.

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
