import Link from "next/link";
import { Home, Pencil, Plus, RefreshCw, Search } from "lucide-react";
import { deletePlaylistAction } from "@/app/admin/actions";
import { Notice } from "@/components/admin-shell";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { SmartImage } from "@/components/smart-image";
import { selectPublicPlaylists } from "@/lib/playlist-organization";
import { prisma } from "@/lib/prisma";
import { resourceImage } from "@/lib/resource-taxonomy";

export default async function CollectionsPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string; q?: string }> }) {
  const params = await searchParams;
  const [allPlaylists, languages, categories] = await Promise.all([
    prisma.playlist.findMany({
      where: { visibility: { not: "Hidden" } },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      include: { language: true, module: true, _count: { select: { videos: true } } }
    }),
    prisma.language.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.module.findMany({ orderBy: { sortOrder: "asc" } })
  ]);
  const playlists = selectPublicPlaylists(allPlaylists);
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-3xl font-extrabold">Playlists</h1><p className="mt-2 text-sm text-[#6b7c8f]">Add, edit, delete, and organize app playlists.</p></div>
        <Link href="/admin/playlists/new" className="mlp-btn-primary"><Plus className="size-4" /> Add New Playlist</Link>
      </div>
      <Notice success={params.success} error={params.error} />
      <div className="mb-6 grid gap-4 md:grid-cols-[1fr_170px_170px_44px]">
        <label className="relative"><Search className="pointer-events-none absolute left-4 top-3.5 size-4 text-[#8b9bad]" /><input placeholder="Search playlists..." className="mlp-input w-full pl-11" /></label>
        <select className="mlp-input"><option>Language</option>{languages.map((item) => <option key={item.id}>{item.name}</option>)}</select>
        <select className="mlp-input"><option>Category</option>{categories.map((item) => <option key={item.id}>{item.name}</option>)}</select>
        <button className="grid h-[42px] place-items-center rounded-lg border border-[#d8dde5] bg-white" title="Refresh"><RefreshCw className="size-4" /></button>
      </div>
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-[#edf0f3]">
        <table className="w-full min-w-[860px] text-left">
          <thead className="bg-[#fbfcfd] text-[11px] uppercase tracking-wide text-[#526579]"><tr><th className="px-6 py-4">Playlist Details</th><th className="px-6 py-4">Statistics</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Featured</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-[#edf0f3]">
            {playlists.map((playlist) => (
              <tr key={playlist.id}>
                <td className="px-6 py-4"><div className="flex items-center gap-4"><div className="relative h-14 w-24 overflow-hidden rounded-md bg-[#f2f4f7]"><SmartImage src={playlist.uploadedThumbnailPath || playlist.thumbnailUrl || resourceImage({ language: playlist.language })} alt="" fill className="h-full w-full object-cover" /></div><div><div className="font-extrabold">{playlist.title}</div><div className="mt-1 text-xs font-semibold text-[#6b7c8f]">{playlist.language?.name ?? "No language"} - {playlist.module?.name ?? "No category"}</div></div></div></td>
                <td className="px-6 py-4 text-sm text-[#526579]"><strong>{playlist._count.videos} Resources</strong><br />Order: {playlist.sortOrder}</td>
                <td className="px-6 py-4"><StatusBadge status={playlist.visibility} /></td>
                <td className="px-6 py-4"><Home className={`size-4 ${playlist.featured ? "fill-[#a64026] text-[#a64026]" : "text-[#8b9bad]"}`} /></td>
                <td className="px-6 py-4"><div className="flex justify-end gap-5"><Link href={`/admin/playlists/new?edit=${playlist.id}`} className="text-[#a64026]"><Pencil className="size-4" /></Link><form action={deletePlaylistAction}><input type="hidden" name="id" value={playlist.id} /><ConfirmDeleteButton compact label="Delete playlist" message={`Delete "${playlist.title}"? Videos will not be deleted.`} /></form></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 text-sm text-[#526579]">Showing {playlists.length} public playlists</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <span className="inline-flex min-w-24 justify-center rounded border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-700">{status}</span>;
}
