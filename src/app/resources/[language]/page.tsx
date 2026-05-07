import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpenCheck, Layers3 } from "lucide-react";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { prisma } from "@/lib/prisma";
import { normalizeResourceFormat, resourceImage, slugify, visibleResourceFormats } from "@/lib/resource-taxonomy";

export default async function LanguageResourceFormatsPage({ params }: { params: Promise<{ language: string }> }) {
  const { language: code } = await params;
  const language = await prisma.language.findUnique({ where: { code }, include: { videos: true } });
  if (!language || !language.isActive) notFound();

  const counts = await prisma.video.groupBy({
    by: ["resourceFormat"],
    where: { languageId: language.id, visibility: "Published", isPublished: true },
    _count: { _all: true }
  });
  const countMap = new Map<string, number>();
  for (const item of counts) {
    const format = normalizeResourceFormat(item.resourceFormat);
    countMap.set(format, (countMap.get(format) ?? 0) + item._count._all);
  }

  return (
    <main className="mlp-page">
      <PublicHeader />
      <section className="border-b border-[#e5e7eb] bg-white">
        <div className="mlp-container py-6 sm:py-8">
          <Link href="/resources" className="mlp-btn-outline mb-5 w-full sm:mb-6 sm:w-auto"><ArrowLeft className="size-4" /> Back to Languages</Link>
          <div className="grid gap-5 md:grid-cols-[260px_1fr] lg:grid-cols-[360px_1fr] lg:items-center">
            <div className="relative aspect-video overflow-hidden rounded-xl bg-[#f2f4f7] shadow-sm ring-1 ring-[#edf0f3]">
              <Image src={language.thumbnailPath || resourceImage({ language })} alt="" fill className="object-cover" />
            </div>
            <div>
              <p className="mb-3 flex items-center gap-2 font-extrabold uppercase tracking-wide text-[#a64026]"><BookOpenCheck className="size-4" /> Selected Language</p>
              <h1 className="text-3xl font-extrabold sm:text-4xl">{language.name} Resources</h1>
              <p className="mt-3 text-base leading-relaxed text-[#6b7c8f] sm:text-lg">
                Choose a resource format first, then select a category. The public library now follows: Language to Resource Format to Category to Resource.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="mlp-container py-12">
        <h2 className="mb-6 flex items-center gap-3 text-2xl font-extrabold sm:text-3xl"><Layers3 className="size-6 text-[#a64026]" /> Resource Formats</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleResourceFormats.map((format) => {
            const count = countMap.get(format) ?? 0;
            return (
              <Link key={format} href={`/resources/${language.code}/${slugify(format)}`} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#edf0f3] transition hover:-translate-y-0.5 hover:shadow-md">
                <span className="mlp-badge">{count > 0 ? `${count} Resources` : "Coming Soon"}</span>
                <h3 className="mt-4 text-xl font-extrabold sm:text-2xl">{format}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#6b7c8f] sm:min-h-16">{language.name} resources grouped by {format}.</p>
                <span className="mt-5 inline-flex items-center gap-2 font-extrabold text-[#a64026]">Choose Format <ArrowRight className="size-4" /></span>
              </Link>
            );
          })}
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
