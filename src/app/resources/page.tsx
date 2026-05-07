import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Languages } from "lucide-react";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { prisma } from "@/lib/prisma";
import { resourceImage } from "@/lib/resource-taxonomy";

export default async function ResourceLanguagesPage() {
  const languages = await prisma.language.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { videos: true } } }
  });

  return (
    <main className="mlp-page">
      <PublicHeader />
      <section className="mlp-container py-9 sm:py-12">
        <div className="mb-8 max-w-3xl">
          <p className="mb-3 flex items-center gap-2 font-extrabold uppercase tracking-wide text-[#a64026]"><Languages className="size-4" /> Language Selection</p>
          <h1 className="text-3xl font-extrabold sm:text-4xl">Browse Resources by Language</h1>
          <p className="mt-3 text-base leading-relaxed text-[#6b7c8f] sm:text-lg">
            Choose a language, then select a resource format and category prepared for educators and facilitators.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {languages.map((language) => (
            <Link key={language.id} href={`/resources/${language.code}`} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#edf0f3] transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="relative aspect-video bg-[#f2f4f7]">
                <Image src={language.thumbnailPath || resourceImage({ language })} alt="" fill className="object-cover" />
              </div>
              <div className="p-5">
                <span className="mlp-badge">{language.displayName}</span>
                <div className="mt-3 flex items-center justify-between gap-4">
                <h2 className="text-xl font-extrabold sm:text-2xl">{language.name}</h2>
                  <ArrowRight className="size-5 text-[#a64026]" />
                </div>
                <p className="mt-2 text-sm text-[#6b7c8f]">{language._count.videos} published resources</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
