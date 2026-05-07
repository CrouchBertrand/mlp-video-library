import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ListVideo, Play } from "lucide-react";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { prisma } from "@/lib/prisma";

function inAppEmbedUrl(embedUrl: string) {
  if (!embedUrl) return "";
  const separator = embedUrl.includes("?") ? "&" : "?";
  return `${embedUrl}${separator}rel=0&modestbranding=1&playsinline=1`;
}

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

  return (
    <main className="mlp-page">
      <PublicHeader />
      <section className="border-b border-[#e5e7eb] bg-white">
        <div className="mlp-container py-6 sm:py-8">
          <Link href={playlist.language?.code ? `/resources/${playlist.language.code}` : "/resources"} className="mlp-btn-outline mb-5 w-full sm:w-auto">
            <ArrowLeft className="size-4" /> Back to playlists
          </Link>
          <div>
            <p className="mb-3 flex items-center gap-2 font-extrabold uppercase tracking-wide text-[#a64026]"><ListVideo className="size-4" /> Playlist</p>
            <h1 className="max-w-5xl text-3xl font-extrabold sm:text-4xl">{playlist.title}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="mlp-badge">{playlist.language?.name ?? "Language"}</span>
              <span className="mlp-soft-badge">{playlist.visibility || "Public"}</span>
              <span className="mlp-soft-badge">{videos.length} videos</span>
            </div>
            {playlist.description && <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#6b7c8f]">{playlist.description}</p>}
          </div>
        </div>
      </section>
      <section className="mlp-container py-8">
        <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-[#edf0f3] sm:p-5">
          <h2 className="mb-4 text-2xl font-extrabold">Videos</h2>
          {videos.length === 0 ? (
            <div className="grid min-h-40 place-items-center rounded-lg bg-[#f2f4f7] text-sm font-bold text-[#6b7c8f]">No videos in this playlist yet.</div>
          ) : (
            <div className="grid gap-3">
              {videos.map((video, index) => {
                const isSelected = selected?.id === video.id;
                const content = (
                  <>
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 inline-flex min-w-16 justify-center rounded px-2 py-1 text-xs font-extrabold ${isSelected ? "bg-white text-[#a64026]" : "bg-[#f2f4f7] text-[#526579]"}`}>
                        Video {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-extrabold leading-snug text-[#243447] sm:text-lg">{video.resourceTitle || video.title}</h3>
                        {!isSelected && (
                          <div className="mt-2 inline-flex items-center gap-2 text-sm font-extrabold text-[#a64026]">
                            <Play className="size-4 fill-current" /> Play in app
                          </div>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-4">
                        <iframe
                          className="aspect-video w-full rounded-lg bg-black"
                          src={inAppEmbedUrl(video.embedUrl)}
                          title={video.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                        {video.description && <p className="mt-3 text-sm leading-relaxed text-[#6b7c8f]">{video.description}</p>}
                      </div>
                    )}
                  </>
                );
                return isSelected ? (
                  <article key={video.id} className="rounded-xl bg-[#fbeaea] p-3 sm:p-4">
                    {content}
                  </article>
                ) : (
                  <Link key={video.id} href={`/playlists/${playlist.id}?video=${video.id}`} className="rounded-xl p-3 transition hover:bg-[#f7f8fa] sm:p-4">
                    {content}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
