import Link from "next/link";
import { AlertTriangle, BookOpen, Clapperboard, FileText, Globe2, Plus, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { resourceImage } from "@/lib/resource-taxonomy";
import { SmartImage } from "@/components/smart-image";

export default async function AdminDashboard() {
  const [collections, resources, languages, drafts, recentResources, missingThumbs] = await Promise.all([
    prisma.playlist.count(),
    prisma.video.count(),
    prisma.language.count({ where: { isActive: true } }),
    prisma.video.count({ where: { visibility: { not: "Published" } } }),
    prisma.video.findMany({ orderBy: { createdAt: "desc" }, take: 4, include: { language: true, module: true } }),
    prisma.video.count({ where: { AND: [{ thumbnailUrl: null }, { uploadedThumbnailPath: null }] } })
  ]);
  const stats = [
    ["Total Resources", resources, "Ready to use", Clapperboard, "#a64026"],
    ["Collections", collections, "Optional grouping", BookOpen, "#624237"],
    ["Languages", languages, "Active", Globe2, "#2f7d3c"],
    ["Drafts", drafts, drafts > 0 ? "Needs review" : "All clear", FileText, "#f18701"]
  ] as const;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4 sm:mb-10">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Dashboard</h1>
          <p className="mt-2 text-sm font-extrabold">Admin overview</p>
          <p className="mt-1 text-sm text-[#6b7c8f]">Here is what is happening in the MLP resource library today.</p>
        </div>
        <div className="grid w-full gap-3 sm:w-auto sm:flex sm:items-center sm:gap-4">
          <Link href="/admin/videos/new" className="mlp-btn-primary"><Plus className="size-4" /> Add Resource</Link>
          <div className="hidden items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-[#edf0f3] sm:flex"><span className="grid size-8 place-items-center rounded-full bg-[#624237] text-xs font-bold text-white">AD</span><span className="text-sm font-bold">Admin User</span></div>
        </div>
      </div>
      <div className="mb-8 grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#edf0f3] sm:grid-cols-2 xl:grid-cols-5">
        <Link className="mlp-btn-outline w-full" href="/admin/videos/new"><Plus className="size-4" /> Add Resource</Link>
        <Link className="mlp-btn-outline w-full" href="/admin/import">Import YouTube Playlist</Link>
        <Link className="mlp-btn-outline w-full" href="/admin/videos">Manage Resources</Link>
        <Link className="mlp-btn-outline w-full" href="/admin/modules">Manage Categories</Link>
        <Link className="mlp-btn-outline w-full" href="/resources">Public Library</Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
        {stats.map(([label, value, note, Icon, color]) => (
          <div key={label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#edf0f3] sm:p-7">
            <div className="flex items-start justify-between">
              <span className="grid size-8 place-items-center rounded-sm text-white" style={{ backgroundColor: color }}><Icon className="size-4" /></span>
              <span className="text-xs font-bold text-green-700">{note}</span>
            </div>
            <div className="mt-5 text-3xl font-extrabold">{value}</div>
            <div className="mt-1 text-sm text-[#6b7c8f]">{label}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-6 xl:mt-10 xl:grid-cols-[1fr_320px] xl:gap-8">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#edf0f3] sm:p-7">
          <div className="mb-6 flex items-center justify-between"><h2 className="text-xl font-extrabold">Recently Added Resources</h2><Link href="/admin/videos" className="text-sm font-bold text-[#a64026]">View All</Link></div>
          <div className="divide-y divide-[#edf0f3]">
            {recentResources.map((resource) => (
              <Link href={`/admin/videos/new?edit=${resource.id}`} key={resource.id} className="grid grid-cols-[46px_1fr] items-center gap-3 py-4 sm:grid-cols-[54px_1fr_auto] sm:gap-4">
                <div className="relative aspect-square overflow-hidden rounded-md bg-[#f2f4f7]"><SmartImage src={resourceImage(resource)} alt="" fill className="h-full w-full object-cover" /></div>
                <div><div className="font-bold">{resource.resourceTitle || resource.title}</div><div className="mt-1 text-xs font-semibold text-[#6b7c8f]">{resource.language?.name ?? "No language"} - {(resource.category || resource.module?.name) ?? "No category"}</div></div>
                <span className="hidden text-xs text-[#6b7c8f] sm:block">{resource.resourceFormat}</span>
              </Link>
            ))}
          </div>
        </section>
        <aside className="space-y-6">
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6 text-[#a64026]">
            <h2 className="flex items-center gap-2 font-extrabold"><AlertTriangle className="size-4" /> Missing Thumbnails</h2>
            <p className="mt-3 text-sm leading-relaxed">{missingThumbs} resources need a thumbnail. If none is added, assign a language thumbnail to keep the library polished.</p>
            <Link href="/admin/videos" className="mlp-btn-outline mt-5 w-full bg-transparent">Review Resources</Link>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#edf0f3]">
            <h2 className="mb-5 font-extrabold">Quick Actions</h2>
            <div className="grid gap-3">
              <Link className="mlp-btn-outline w-full" href="/admin/videos/new"><Clapperboard className="size-4" /> New Resource</Link>
              <Link className="mlp-btn-outline w-full" href="/admin/modules"><FileText className="size-4" /> Manage Categories</Link>
              <button className="mlp-btn-outline w-full"><Users className="size-4" /> Manage Users</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
