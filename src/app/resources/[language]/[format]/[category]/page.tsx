import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, FileText, ListVideo, Sparkles } from "lucide-react";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { prisma } from "@/lib/prisma";
import { categoryFromSlug, normalizeResourceFormat, resourceFormatFromSlug } from "@/lib/resource-taxonomy";
import { youtubeWatchUrl } from "@/lib/youtube";

export default async function CategoryPage({
  params,
  searchParams
}: {
  params: Promise<{ language: string; format: string; category: string }>;
  searchParams: Promise<{ resource?: string }>;
}) {
  const [{ language: code, format: formatSlug, category: categorySlug }, query] = await Promise.all([params, searchParams]);
  const [language, format, category] = await Promise.all([
    prisma.language.findUnique({ where: { code } }),
    Promise.resolve(resourceFormatFromSlug(formatSlug)),
    Promise.resolve(categoryFromSlug(categorySlug))
  ]);
  if (!language || !language.isActive || !format || !category) notFound();

  const allResources = await prisma.video.findMany({
    where: { languageId: language.id, category: category.name, visibility: "Published", isPublished: true },
    include: { language: true },
    orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }]
  });
  const resources = allResources.filter((item) => normalizeResourceFormat(item.resourceFormat) === format);
  const selected = resources.find((item) => item.id === query.resource) ?? resources[0] ?? null;
  const index = selected ? resources.findIndex((item) => item.id === selected.id) : -1;
  const previous = index > 0 ? resources[index - 1] : null;
  const next = index >= 0 && index < resources.length - 1 ? resources[index + 1] : null;
  const categoryHref = `/resources/${language.code}/${formatSlug}/${categorySlug}`;

  return (
    <main className="mlp-page">
      <PublicHeader />
      <section className="mlp-container py-6 sm:py-8">
        <Link href={`/resources/${language.code}/${formatSlug}`} className="mlp-btn-outline mb-5 w-full sm:mb-6 sm:w-auto"><ArrowLeft className="size-4" /> Back to Categories</Link>
        <div className="mb-6 sm:mb-8">
          <p className="mb-3 font-extrabold uppercase tracking-wide text-[#a64026]">{language.name} / {format}</p>
          <h1 className="text-3xl font-extrabold sm:text-4xl">{category.name}</h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-[#6b7c8f] sm:text-lg">{category.description}</p>
        </div>

        {selected ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
            <div>
              <div className="overflow-hidden rounded-xl bg-black shadow-sm">
                {selected.embedUrl ? (
                  <iframe src={selected.embedUrl} title={selected.resourceTitle || selected.title} className="aspect-video w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
                ) : (
                  <div className="grid aspect-video place-items-center bg-[#f2f4f7] text-center text-[#6b7c8f]">
                    <div><FileText className="mx-auto mb-3 size-10" />No video link has been added yet.</div>
                  </div>
                )}
              </div>
              <details className="mt-4 rounded-xl bg-white p-3 shadow-sm ring-1 ring-[#edf0f3] lg:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-extrabold text-[#243447] [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-2"><ListVideo className="size-4 text-[#a64026]" /> Resources in this Category</span>
                  <span className="mlp-badge">{resources.length}</span>
                </summary>
                <div className="mt-3 max-h-[52vh] space-y-2 overflow-y-auto">
                  {resources.map((item, itemIndex) => (
                    <Link key={item.id} href={`${categoryHref}?resource=${item.id}`} className={`block rounded-lg p-3 text-sm ${item.id === selected.id ? "bg-[#fbeaea] text-[#a64026]" : "bg-[#f7f8fa]"}`}>
                      <strong className="line-clamp-2">{itemIndex + 1}. {item.resourceTitle || item.title}</strong>
                      <span className="mt-1 block text-xs text-[#6b7c8f]">{normalizeResourceFormat(item.resourceFormat)} {item.duration ? `- ${item.duration}` : ""}</span>
                    </Link>
                  ))}
                </div>
              </details>
              <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap sm:justify-between">
                <div className="grid gap-3 sm:flex">
                  {previous && <Link href={`${categoryHref}?resource=${previous.id}`} className="mlp-btn-outline"><ChevronLeft className="size-4" /> Previous</Link>}
                  {next && <Link href={`${categoryHref}?resource=${next.id}`} className="mlp-btn-primary">Next Resource <ChevronRight className="size-4" /></Link>}
                </div>
                {selected.youtubeVideoId && (
                  <a className="mlp-btn-outline" href={youtubeWatchUrl(selected.youtubeVideoId)} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" /> Open on YouTube
                  </a>
                )}
              </div>
              <h2 className="mt-7 text-3xl font-extrabold tracking-tight sm:text-4xl">{selected.resourceTitle || selected.title}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="mlp-badge">{language.name}</span>
                <span className="mlp-soft-badge">{format}</span>
                <span className="mlp-soft-badge">{category.name}</span>
                <span className="mlp-soft-badge">{selected.resourceType}</span>
              </div>
              {selected.description && (
                <details open className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#edf0f3] sm:p-6">
                  <summary className="cursor-pointer list-none text-xl font-extrabold [&::-webkit-details-marker]:hidden">Description / Facilitator Notes</summary>
                  <p className="mt-3 whitespace-pre-wrap leading-relaxed text-[#526579]">{selected.description}</p>
                </details>
              )}
              <details className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#edf0f3] sm:p-6">
                <summary className="cursor-pointer list-none text-xl font-extrabold [&::-webkit-details-marker]:hidden">Transcript / Script</summary>
                <p className="mt-3 whitespace-pre-wrap leading-relaxed text-[#526579]">{selected.transcript || "No transcript or script has been added yet."}</p>
              </details>
            </div>
            <aside className="hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#edf0f3] lg:sticky lg:top-24 lg:block lg:self-start">
              <h2 className="mb-1 text-xl font-extrabold">Category Resources</h2>
              <p className="mb-4 text-sm text-[#6b7c8f]">{resources.length} playable resources</p>
              <div className="max-h-[680px] space-y-3 overflow-y-auto pr-1">
                {resources.map((item, itemIndex) => (
                  <Link key={item.id} href={`${categoryHref}?resource=${item.id}`} className={`block rounded-lg p-3 text-sm ${item.id === selected.id ? "bg-[#fbeaea] text-[#a64026]" : "hover:bg-[#f7f8fa]"}`}>
                    <strong className="line-clamp-2">{itemIndex + 1}. {item.resourceTitle || item.title}</strong>
                    <span className="mt-1 block text-xs text-[#6b7c8f]">{normalizeResourceFormat(item.resourceFormat)} {item.duration ? `- ${item.duration}` : ""}</span>
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-[#edf0f3]">
            <Sparkles className="mx-auto mb-4 size-10 text-[#a64026]" />
            <h2 className="text-2xl font-extrabold">Future Resources / Coming Soon</h2>
            <p className="mx-auto mt-3 max-w-xl text-[#6b7c8f]">
              No published resources match this language, resource format, and category yet.
            </p>
          </div>
        )}
      </section>
      <PublicFooter />
    </main>
  );
}
