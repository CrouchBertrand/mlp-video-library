import Link from "next/link";
import { ArrowRight, ListVideo } from "lucide-react";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { YouTubePlaylistCard } from "@/components/youtube-playlist-card";
import { publicPlaylistShelfTitle, selectPublicPlaylists } from "@/lib/playlist-organization";
import { prisma } from "@/lib/prisma";
import { youtubeStyleShelves } from "@/lib/resource-taxonomy";

export default async function PlaylistsPage() {
  const [languages, playlists] = await Promise.all([
    prisma.language.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.playlist.findMany({
      where: { visibility: { not: "Hidden" } },
      include: {
        language: true,
        videos: {
          where: { video: { visibility: { not: "Hidden" } } },
          select: { videoId: true }
        }
      },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }]
    })
  ]);
  const codeByLanguage = new Map(languages.map((language) => [language.name, language.code]));
  const publicPlaylists = selectPublicPlaylists(playlists);

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
          const shelfPlaylists = publicPlaylists.filter((playlist) => playlist.language?.name === shelf.language && publicPlaylistShelfTitle(playlist) === shelf.title);
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
