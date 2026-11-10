import { NextResponse } from "next/server";
import { InternetArchiveClient } from "@/lib/archive-api";

const client = new InternetArchiveClient();

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!/^[\w.-]{1,160}$/.test(id)) return NextResponse.json({ error: "Invalid film ID" }, { status: 400 });
  try {
    const data = await client.getItemMetadata(id);
    const videos = (data.files || [])
      .filter((file) => /\.(mp4|webm|ogv)$/i.test(file.name) && file.source !== "metadata")
      .sort((a, b) => {
        const height = (file: typeof a) => Number(file.height || 0);
        const bitrate = (file: typeof a) => Number(file.bitrate || 0);
        const format = (file: typeof a) => /\.mp4$/i.test(file.name) ? 1 : 0;
        return height(b) - height(a) || bitrate(b) - bitrate(a) || format(b) - format(a);
      })
      .map((file) => ({ name: file.name, format: file.format || "Video", url: `https://archive.org/download/${encodeURIComponent(id)}/${file.name.split("/").map(encodeURIComponent).join("/")}` }));
    return NextResponse.json({ id, title: data.metadata.title || id, description: typeof data.metadata.description === "string" ? data.metadata.description.replace(/<[^>]+>/g, " ") : "", year: data.metadata.year || "", videos });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Film unavailable" }, { status: 502 });
  }
}
