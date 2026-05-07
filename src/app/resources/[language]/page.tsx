import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ListVideo } from "lucide-react";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { YouTubePlaylistCard } from "@/components/youtube-playlist-card";
import { prisma } from "@/lib/prisma";
import { youtubeStylePlaylists, youtubeStyleShelves } from "@/lib/resource-taxonomy";

export default async function LanguagePlaylistsPage({ params }: { params: Promise<{ language: string }> }) {
  const { language: code } = await params;
  const language = await prisma.language.findUnique({ where: { code } });
  if (!language || !language.isActive) notFound();
  const playlists = await prisma.playlist.findMany({
    where: { languageId: language.id, visibility: { not: "Hidden" } },
    include: { language: true, _count: { select: { videos: true } } },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }]
  });
  const youtubeTitleSet = new Set<string>(youtubeStylePlaylists.map((playlist) => playlist.title));
  const shelfByLanguageTitle = new Map(youtubeStylePlaylists.map((playlist) => [`${playlist.language}:${playlist.title}`, playlist.shelf]));
  const visiblePlaylists = playlists.filter((playlist) => youtubeTitleSet.has(playlist.title) || playlist.id.startsWith("yt_"));
  const shelves = youtubeStyleShelves.filter((shelf) => shelf.language === language.name);

  return (
    <main className="mlp-page">
      <PublicHeader />
      <section className="border-b border-[#e5e7eb] bg-white">
        <div className="mlp-container py-6 sm:py-8">
          <Link href="/resources" className="mlp-btn-outline mb-5 w-full sm:w-auto"><ArrowLeft className="size-4" /> Back to all playlists</Link>
          <p className="mb-3 flex items-center gap-2 font-extrabold uppercase tracking-wide text-[#a64026]"><ListVideo className="size-4" /> Language shelf</p>
          <h1 className="text-3xl font-extrabold sm:text-4xl">Marketplace Literacy - {language.name}</h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-[#6b7c8f] sm:text-lg">
            Browse playlists in {language.name}. Open any playlist to see its videos.
          </p>
        </div>
      </section>
      <div className="mlp-container space-y-10 py-10">
        {(shelves.length ? shelves : [{ title: `Marketplace Literacy - ${language.name}`, language: language.name }]).map((shelf) => (
          <section key={shelf.title}>
            <h2 className="mb-4 text-2xl font-extrabold text-[#243447]">{shelf.title}</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visiblePlaylists
                .filter((playlist) => playlist.id.startsWith("yt_") ? shelf.title === shelves[0]?.title : shelfByLanguageTitle.get(`${language.name}:${playlist.title}`) === shelf.title)
                .map((playlist) => <YouTubePlaylistCard key={`${shelf.title}-${playlist.id}`} playlist={playlist} />)}
            </div>
          </section>
        ))}
      </div>
      <PublicFooter />
    </main>
  );
}
