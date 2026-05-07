import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, ListVideo } from "lucide-react";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { SmartImage } from "@/components/smart-image";
import { prisma } from "@/lib/prisma";
import { resourceImage } from "@/lib/resource-taxonomy";

export default async function PlaylistDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ video?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const playlist = await prisma.playlist.findUnique({
    where: { id },
    include: {
      language: true,
      videos: { include: { video: true }, orderBy: { sortOrder: "asc" } }
    }
  });
  if (!playlist || playlist.visibility === "Hidden") notFound();
  const videos = playlist.videos.map((item) => item.video).filter((video) => video.visibility !== "Hidden");
  const selected = videos.find((video) => video.id === query.video) ?? videos[0];
  const thumbnail = playlist.uploadedThumbnailPath || playlist.thumbnailUrl || resourceImage({ language: playlist.language });

  return (
    <main className="mlp-page">
      <PublicHeader />
      <section className="border-b border-[#e5e7eb] bg-white">
        <div className="mlp-container py-6 sm:py-8">
          <Link href={playlist.language?.code ? `/resources/${playlist.language.code}` : "/resources"} className="mlp-btn-outline mb-5 w-full sm:w-auto">
            <ArrowLeft className="size-4" /> Back to playlists
          </Link>
          <div className="grid gap-5 lg:grid-cols-[360px_1fr] lg:items-center">
            <div className="relative aspect-video overflow-hidden rounded-lg bg-[#f2f4f7] shadow-sm ring-1 ring-[#edf0f3]">
              <SmartImage src={thumbnail} alt="" fill className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="mb-3 flex items-center gap-2 font-extrabold uppercase tracking-wide text-[#a64026]"><ListVideo className="size-4" /> Playlist</p>
              <h1 className="text-3xl font-extrabold sm:text-4xl">{playlist.title}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="mlp-badge">{playlist.language?.name ?? "Language"}</span>
                <span className="mlp-soft-badge">{playlist.visibility || "Public"}</span>
                <span className="mlp-soft-badge">{videos.length} videos</span>
              </div>
              {playlist.description && <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#6b7c8f]">{playlist.description}</p>}
              {playlist.youtubePlaylistUrl && (
                <a href={playlist.youtubePlaylistUrl} target="_blank" rel="noreferrer" className="mlp-btn-primary mt-5 w-full sm:w-auto">
                  <ExternalLink className="size-4" /> Open on YouTube
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
      <section className="mlp-container grid gap-6 py-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-[#edf0f3] sm:p-4">
          {selected ? (
            <iframe
              className="aspect-video w-full rounded-lg bg-black"
              src={selected.embedUrl}
              title={selected.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="grid aspect-video place-items-center rounded-lg bg-[#f2f4f7] text-sm font-bold text-[#6b7c8f]">No videos in this playlist yet.</div>
          )}
          {selected && (
            <div className="p-2 sm:p-4">
              <h2 className="text-2xl font-extrabold">{selected.resourceTitle || selected.title}</h2>
              {selected.description && <p className="mt-3 text-sm leading-relaxed text-[#6b7c8f]">{selected.description}</p>}
            </div>
          )}
        </div>
        <aside className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-[#edf0f3] sm:p-4">
          <h2 className="mb-3 text-lg font-extrabold">Videos</h2>
          <div className="grid gap-2">
            {videos.map((video, index) => (
              <Link key={video.id} href={`/playlists/${playlist.id}?video=${video.id}`} className={`grid grid-cols-[84px_1fr] gap-3 rounded-lg p-2 ${selected?.id === video.id ? "bg-[#fbeaea]" : "hover:bg-[#f7f8fa]"}`}>
                <div className="relative aspect-video overflow-hidden rounded bg-[#f2f4f7]">
                  <SmartImage src={resourceImage({ ...video, language: playlist.language })} alt="" fill className="h-full w-full object-cover" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-[#a64026]">Video {index + 1}</div>
                  <div className="line-clamp-2 text-sm font-extrabold text-[#243447]">{video.resourceTitle || video.title}</div>
                </div>
              </Link>
            ))}
          </div>
        </aside>
      </section>
      <PublicFooter />
    </main>
  );
}
