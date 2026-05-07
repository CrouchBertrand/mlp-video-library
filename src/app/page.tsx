import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Globe2, Search } from "lucide-react";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { ResourceCard } from "@/components/resource-card";
import { prisma } from "@/lib/prisma";
import { resourceImage, visibleResourceFormats } from "@/lib/resource-taxonomy";

export default async function Home({
  searchParams
}: {
  searchParams: Promise<{ q?: string; language?: string; category?: string }>;
}) {
  const params = await searchParams;
  const [settings, languages, resources] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    prisma.language.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.video.findMany({
      where: { visibility: "Published", isPublished: true, ...(params.language ? { languageId: params.language } : {}) },
      include: { language: true },
      orderBy: [{ language: { sortOrder: "asc" } }, { category: "asc" }, { orderIndex: "asc" }],
      take: 24
    })
  ]);

  const byLanguage = languages.map((language) => ({
    language,
    resources: resources.filter((resource) => resource.languageId === language.id).slice(0, 4)
  }));

  return (
    <main className="mlp-page">
      <PublicHeader />
      <section className="border-b border-[#e5e7eb] bg-[#f2f4f7]">
        <div className="mlp-container flex flex-col items-center py-10 text-center sm:py-12 lg:py-16">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-[#a64026] sm:text-sm">Educator and facilitator resource library</p>
          <h1 className="max-w-4xl text-3xl font-extrabold tracking-tight text-[#243447] sm:text-4xl lg:text-[44px]">
            Marketplace Literacy Project Video Library
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#526579] sm:mt-6 sm:text-lg">
            {settings?.siteDescription ?? "Browse organized Marketplace Literacy resources by language, resource format, and category."}
          </p>
          <div className="mt-6 grid w-full max-w-sm gap-3 sm:flex sm:max-w-none sm:flex-wrap sm:justify-center">
            <Link href="/resources" className="mlp-btn-primary">Browse Resources <ArrowRight className="size-4" /></Link>
            <Link href="/search" className="mlp-btn-outline">Search Library</Link>
          </div>
          <form action="/search" className="mlp-card mt-7 w-full max-w-3xl p-4 sm:mt-9 sm:p-5">
            <div className="grid gap-3 md:grid-cols-[1fr_150px]">
              <label className="relative">
                <Search className="pointer-events-none absolute left-4 top-3.5 size-4 text-[#8b9bad]" />
                <input name="q" placeholder="Search by title, category, format, or tags..." className="mlp-input w-full border-0 bg-[#f7f8fa] pl-11" />
              </label>
              <button className="mlp-btn-primary">Search</button>
            </div>
            <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-center">
              <span className="text-sm font-semibold text-[#526579]">Filter by:</span>
              <select name="language" className="mlp-input h-10 w-full bg-[#f7f8fa] text-sm sm:w-auto sm:min-w-36">
                <option value="">All Languages</option>
                {languages.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <select name="format" className="mlp-input h-10 w-full bg-[#f7f8fa] text-sm sm:w-auto sm:min-w-40">
                <option value="">All Resource Formats</option>
                {visibleResourceFormats.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select name="category" className="mlp-input h-10 w-full bg-[#f7f8fa] text-sm sm:w-auto sm:min-w-36">
                <option value="">All Categories</option>
                {Array.from(new Set(resources.map((item) => item.category))).map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          </form>
        </div>
      </section>

      <section className="mlp-container py-9 sm:py-12">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold sm:text-3xl">Choose a Language</h2>
            <p className="mt-2 text-[#6b7c8f]">Start with the language used by your facilitator or learning group.</p>
          </div>
          <Link href="/resources" className="flex items-center gap-2 text-sm font-extrabold text-[#a64026]">See All <ArrowRight className="size-4" /></Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {languages.map((language) => (
            <Link key={language.id} href={`/resources/${language.code}`} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#edf0f3] transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="relative aspect-video bg-[#f2f4f7]">
                <Image src={language.thumbnailPath || resourceImage({ language })} alt={`${language.name} resource thumbnail`} fill className="object-cover" />
              </div>
              <div className="p-5">
                <span className="mlp-badge">{language.displayName}</span>
                <h3 className="mt-3 text-xl font-extrabold sm:text-2xl">{language.name}</h3>
                <p className="mt-2 text-sm text-[#6b7c8f]">Resources organized by format and category.</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="mlp-container space-y-10 pb-10 sm:space-y-12 sm:pb-12">
        {byLanguage.map(({ language, resources: languageResources }) => {
          if (!languageResources.length) return null;
          return (
            <section key={language.id}>
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-[#243447] sm:text-3xl">
                  <Globe2 className="size-6 text-[#a64026]" /> {language.name} Resources
                </h2>
                <Link href={`/resources/${language.code}`} className="flex items-center gap-2 text-sm font-extrabold text-[#a64026]">See All <ArrowRight className="size-4" /></Link>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {languageResources.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}
              </div>
            </section>
          );
        })}
      </div>
      <PublicFooter />
    </main>
  );
}
