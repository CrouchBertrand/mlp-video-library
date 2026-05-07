import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { YouTubePlaylistCard } from "@/components/youtube-playlist-card";
import { prisma } from "@/lib/prisma";
import { youtubeStylePlaylists, youtubeStyleShelves } from "@/lib/resource-taxonomy";

export default async function Home() {
  const [settings, languages, playlists] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
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
  const shelfPlaylistsOnly = playlists.filter((playlist) => youtubeTitleSet.has(playlist.title) || playlist.id.startsWith("yt_"));

  return (
    <main className="mlp-page">
      <PublicHeader />
      <section className="border-b border-[#e5e7eb] bg-[#f7f8fa]">
        <div className="mlp-container py-8 sm:py-12">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-[#a64026] sm:text-sm">Marketplace Literacy Project</p>
          <h1 className="max-w-4xl text-[34px] font-extrabold leading-tight tracking-tight text-[#243447] sm:text-4xl lg:text-[44px]">
            MLP Video Library
          </h1>
          <p className="mt-4 max-w-3xl text-[17px] leading-relaxed text-[#526579] sm:text-lg">
            {settings?.siteDescription ?? "Browse Marketplace Literacy playlists by language, just like the YouTube playlist page."}
          </p>
          <form action="/search" className="mt-6 grid max-w-3xl gap-3 sm:grid-cols-[1fr_140px]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-4 top-3.5 size-4 text-[#8b9bad]" />
              <input name="q" placeholder="Search playlists and videos..." className="mlp-input w-full bg-white pl-12" />
            </label>
            <button className="mlp-btn-primary">Search</button>
          </form>
        </div>
      </section>

      <div className="mlp-container space-y-10 py-10">
        {youtubeStyleShelves.map((shelf) => {
          const shelfPlaylists = shelfPlaylistsOnly.filter((playlist) => {
            if (playlist.language?.name !== shelf.language) return false;
            if (playlist.id.startsWith("yt_")) return shelf.title === youtubeStyleShelves.find((item) => item.language === shelf.language)?.title;
            return shelfByLanguageTitle.get(`${shelf.language}:${playlist.title}`) === shelf.title;
          });
          if (!shelfPlaylists.length) return null;
          return (
            <section key={shelf.title}>
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-2xl font-extrabold text-[#243447]">{shelf.title}</h2>
                {codeByLanguage.get(shelf.language) && (
                  <Link href={`/resources/${codeByLanguage.get(shelf.language)}`} className="inline-flex items-center gap-2 text-sm font-extrabold text-[#a64026]">
                    View all <ArrowRight className="size-4" />
                  </Link>
                )}
              </div>
              <div className="flex gap-4 overflow-x-auto pb-3">
                {shelfPlaylists.slice(0, 12).map((playlist) => <YouTubePlaylistCard key={`${shelf.title}-${playlist.id}`} playlist={playlist} />)}
              </div>
            </section>
          );
        })}
      </div>
      <PublicFooter />
    </main>
  );
}
