import Link from "next/link";
import { Home, Pencil, Plus, RefreshCw, Search } from "lucide-react";
import { deletePlaylistAction } from "@/app/admin/actions";
import { Notice } from "@/components/admin-shell";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { SmartImage } from "@/components/smart-image";
import { prisma } from "@/lib/prisma";
import { resourceImage } from "@/lib/resource-taxonomy";

export default async function CollectionsPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string; q?: string }> }) {
  const params = await searchParams;
  const [collections, languages, categories, total] = await Promise.all([
    prisma.playlist.findMany({ orderBy: { sortOrder: "asc" }, include: { language: true, module: true, videos: true }, take: 8 }),
    prisma.language.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.module.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.playlist.count()
  ]);
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-3xl font-extrabold">Resource Collections</h1><p className="mt-2 text-sm text-[#6b7c8f]">Optional groups used for homepage rows and curated resource sets.</p></div>
        <Link href="/admin/playlists/new" className="mlp-btn-primary"><Plus className="size-4" /> Add New Collection</Link>
      </div>
      <Notice success={params.success} error={params.error} />
      <div className="mb-6 grid gap-4 md:grid-cols-[1fr_170px_170px_44px]">
        <label className="relative"><Search className="pointer-events-none absolute left-4 top-3.5 size-4 text-[#8b9bad]" /><input placeholder="Search collections..." className="mlp-input w-full pl-11" /></label>
        <select className="mlp-input"><option>Language</option>{languages.map((item) => <option key={item.id}>{item.name}</option>)}</select>
        <select className="mlp-input"><option>Category</option>{categories.map((item) => <option key={item.id}>{item.name}</option>)}</select>
        <button className="grid h-[42px] place-items-center rounded-lg border border-[#d8dde5] bg-white" title="Refresh"><RefreshCw className="size-4" /></button>
      </div>
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-[#edf0f3]">
        <table className="w-full min-w-[860px] text-left">
          <thead className="bg-[#fbfcfd] text-[11px] uppercase tracking-wide text-[#526579]"><tr><th className="px-6 py-4">Collection Details</th><th className="px-6 py-4">Statistics</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Featured</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-[#edf0f3]">
            {collections.map((collection) => (
              <tr key={collection.id}>
                <td className="px-6 py-4"><div className="flex items-center gap-4"><div className="relative h-14 w-24 overflow-hidden rounded-md bg-[#f2f4f7]"><SmartImage src={collection.uploadedThumbnailPath || collection.thumbnailUrl || resourceImage({ language: collection.language })} alt="" fill className="h-full w-full object-cover" /></div><div><div className="font-extrabold">{collection.title}</div><div className="mt-1 text-xs font-semibold text-[#6b7c8f]">{collection.language?.name ?? "No language"} - {collection.module?.name ?? "No category"}</div></div></div></td>
                <td className="px-6 py-4 text-sm text-[#526579]"><strong>{collection.videos.length} Resources</strong><br />Order: {collection.sortOrder}</td>
                <td className="px-6 py-4"><StatusBadge status={collection.visibility} /></td>
                <td className="px-6 py-4"><Home className={`size-4 ${collection.featured ? "fill-[#a64026] text-[#a64026]" : "text-[#8b9bad]"}`} /></td>
                <td className="px-6 py-4"><div className="flex justify-end gap-5"><Link href={`/admin/playlists/new?edit=${collection.id}`} className="text-[#a64026]"><Pencil className="size-4" /></Link><form action={deletePlaylistAction}><input type="hidden" name="id" value={collection.id} /><ConfirmDeleteButton compact label="Delete collection" message={`Delete "${collection.title}"? Resources will not be deleted.`} /></form></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex items-center justify-between text-sm text-[#526579]"><span>Showing {collections.length} of {total} collections</span><div className="flex gap-2"><button className="mlp-btn-outline">Previous</button><button className="mlp-btn-outline">Next</button></div></div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <span className="inline-flex min-w-24 justify-center rounded border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-700">{status}</span>;
}
