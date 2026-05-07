import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Languages, Search } from "lucide-react";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { prisma } from "@/lib/prisma";
import { resourceImage } from "@/lib/resource-taxonomy";

export default async function Home() {
  const [settings, languages] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.language.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { playlists: true } } }
    })
  ]);

  return (
    <main className="mlp-page">
      <PublicHeader />
      <section className="border-b border-[#e5e7eb] bg-[#f7f8fa]">
        <div className="mlp-container py-9 sm:py-12 lg:py-16">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-[#a64026] sm:text-sm">Marketplace Literacy Project</p>
          <h1 className="max-w-4xl text-[34px] font-extrabold leading-tight tracking-tight text-[#243447] sm:text-4xl lg:text-[44px]">
            MLP Video Library
          </h1>
          <p className="mt-4 max-w-3xl text-[17px] leading-relaxed text-[#526579] sm:text-lg">
            {settings?.siteDescription ?? "Browse Marketplace Literacy playlists by language."}
          </p>
          <div className="mt-6 grid max-w-3xl gap-3 sm:flex sm:flex-wrap">
            <Link href="/playlists" className="mlp-btn-primary">Browse Playlists <ArrowRight className="size-4" /></Link>
            <Link href="/search" className="mlp-btn-outline"><Search className="size-4" /> Search Library</Link>
          </div>
        </div>
      </section>

      <section className="mlp-container py-10 sm:py-12">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 flex items-center gap-2 font-extrabold uppercase tracking-wide text-[#a64026]"><Languages className="size-4" /> Choose a language</p>
            <h2 className="text-2xl font-extrabold sm:text-3xl">Language Shelves</h2>
            <p className="mt-2 max-w-2xl text-[#6b7c8f]">Start with a language, then open a playlist. No extra folders or category tree.</p>
          </div>
          <Link href="/playlists" className="flex items-center gap-2 text-sm font-extrabold text-[#a64026]">All playlists <ArrowRight className="size-4" /></Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {languages.map((language) => (
            <Link key={language.id} href={`/resources/${language.code}`} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#edf0f3] transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="relative aspect-video bg-[#f2f4f7]">
                <Image src={language.thumbnailPath || resourceImage({ language })} alt={`${language.name} thumbnail`} fill className="object-cover" />
              </div>
              <div className="p-5">
                <span className="mlp-badge">{language.displayName}</span>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <h3 className="text-xl font-extrabold sm:text-2xl">{language.name}</h3>
                  <ArrowRight className="size-5 text-[#a64026]" />
                </div>
                <p className="mt-2 text-sm text-[#6b7c8f]">{language._count.playlists} playlists</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
