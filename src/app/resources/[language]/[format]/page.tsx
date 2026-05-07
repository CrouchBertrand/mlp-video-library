import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, FolderOpen, Layers3 } from "lucide-react";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { prisma } from "@/lib/prisma";
import { normalizeResourceFormat, resourceCategories, resourceFormatFromSlug, resourceImage, slugify } from "@/lib/resource-taxonomy";

export default async function ResourceFormatPage({ params }: { params: Promise<{ language: string; format: string }> }) {
  const { language: code, format: formatSlug } = await params;
  const [language, format] = await Promise.all([
    prisma.language.findUnique({ where: { code } }),
    Promise.resolve(resourceFormatFromSlug(formatSlug))
  ]);
  if (!language || !language.isActive || !format) notFound();

  const resources = await prisma.video.findMany({
    where: { languageId: language.id, visibility: "Published", isPublished: true },
    select: { category: true, resourceFormat: true }
  });
  const countMap = new Map<string, number>();
  for (const resource of resources) {
    if (normalizeResourceFormat(resource.resourceFormat) !== format) continue;
    countMap.set(resource.category, (countMap.get(resource.category) ?? 0) + 1);
  }

  return (
    <main className="mlp-page">
      <PublicHeader />
      <section className="border-b border-[#e5e7eb] bg-white">
        <div className="mlp-container py-6 sm:py-8">
          <Link href={`/resources/${language.code}`} className="mlp-btn-outline mb-5 w-full sm:mb-6 sm:w-auto"><ArrowLeft className="size-4" /> Back to Resource Formats</Link>
          <div className="grid gap-5 md:grid-cols-[260px_1fr] lg:grid-cols-[360px_1fr] lg:items-center">
            <div className="relative aspect-video overflow-hidden rounded-xl bg-[#f2f4f7] shadow-sm ring-1 ring-[#edf0f3]">
              <Image src={language.thumbnailPath || resourceImage({ language })} alt="" fill className="object-cover" />
            </div>
            <div>
              <p className="mb-3 flex items-center gap-2 font-extrabold uppercase tracking-wide text-[#a64026]"><Layers3 className="size-4" /> Resource Format</p>
              <h1 className="text-3xl font-extrabold sm:text-4xl">{language.name} / {format}</h1>
              <p className="mt-3 text-base leading-relaxed text-[#6b7c8f] sm:text-lg">Choose a category to view all matching resources for this language and resource format.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="mlp-container py-12">
        <h2 className="mb-6 flex items-center gap-3 text-2xl font-extrabold sm:text-3xl"><FolderOpen className="size-6 text-[#a64026]" /> Categories</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {resourceCategories.map((category) => {
            const count = countMap.get(category.name) ?? 0;
            return (
              <Link key={category.name} href={`/resources/${language.code}/${formatSlug}/${slugify(category.name)}`} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#edf0f3] transition hover:-translate-y-0.5 hover:shadow-md">
                <span className="mlp-badge">{count > 0 ? `${count} Resources` : "Coming Soon"}</span>
                <h3 className="mt-4 text-xl font-extrabold sm:text-2xl">{category.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#6b7c8f] sm:min-h-16">{category.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 font-extrabold text-[#a64026]">Open Category <ArrowRight className="size-4" /></span>
              </Link>
            );
          })}
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
