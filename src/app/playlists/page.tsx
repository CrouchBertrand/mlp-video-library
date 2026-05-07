import Link from "next/link";
import { ArrowRight, ListVideo } from "lucide-react";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { YouTubePlaylistCard } from "@/components/youtube-playlist-card";
import { prisma } from "@/lib/prisma";
import { youtubeStylePlaylists, youtubeStyleShelves } from "@/lib/resource-taxonomy";

export default async function PlaylistsPage() {
  const [languages, playlists] = await Promise.all([
    prisma.language.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.playlist.findMany({
      where: { visibility: { not: "Hidden" } },
      include: { language: true, _count: { select: { videos: true } } },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }]
    })
  ]);
  const codeByLanguage = new Map(languages.map((language) => [language.name, language.code]));
  const youtubeTitleSet = new Set<string>(youtubeStylePlaylists.map((playlist) => playlist.title));
  const shelfByLanguageTitle = new Map(youtubeStylePlaylists.map((playlist) => [`${playlist.language}:${playlist.title}`, playlist.shelf]));
  const shelfPlaylistsOnly = playlists.filter((playlist) => youtubeTitleSet.has(playlist.title) || playlist.id.startsWith("yt_") || Boolean(playlist.youtubePlaylistUrl));

  return (
    <main className="mlp-page">
      <PublicHeader />
      <section className="mlp-container py-8 sm:py-12">
        <p className="mb-3 flex items-center gap-2 font-extrabold uppercase tracking-wide text-[#a64026]"><ListVideo className="size-4" /> Playlists</p>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Browse YouTube-Style Playlists</h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-[#6b7c8f] sm:text-lg">
          Language shelves with playlist cards underneath. Open a playlist to see its videos.
        </p>
      </section>
      <div className="mlp-container space-y-10 pb-12">
        {youtubeStyleShelves.map((shelf) => {
          const firstShelfForLanguage = youtubeStyleShelves.find((item) => item.language === shelf.language)?.title;
          const shelfPlaylists = shelfPlaylistsOnly.filter((playlist) => {
            if (playlist.language?.name !== shelf.language) return false;
            if (playlist.id.startsWith("yt_") || playlist.youtubePlaylistUrl) return shelf.title === firstShelfForLanguage;
            return shelfByLanguageTitle.get(`${shelf.language}:${playlist.title}`) === shelf.title;
          });
          const code = codeByLanguage.get(shelf.language);
          if (!shelfPlaylists.length) return null;
          return (
            <section key={shelf.title}>
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-2xl font-extrabold text-[#243447]">{shelf.title}</h2>
                {code && <Link href={`/resources/${code}`} className="inline-flex items-center gap-2 text-sm font-extrabold text-[#a64026]">Language page <ArrowRight className="size-4" /></Link>}
              </div>
              <div className="flex gap-4 overflow-x-auto pb-3">
                {shelfPlaylists.map((playlist) => <YouTubePlaylistCard key={`${shelf.title}-${playlist.id}`} playlist={playlist} />)}
              </div>
            </section>
          );
        })}
      </div>
      <PublicFooter />
    </main>
  );
}
