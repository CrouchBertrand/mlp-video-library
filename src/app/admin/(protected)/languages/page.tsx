import Link from "next/link";
import { Download, Pencil, Plus, Search } from "lucide-react";
import { deleteLanguageAction, upsertLanguageAction } from "@/app/admin/actions";
import { Notice } from "@/components/admin-shell";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { FormActions, PageTitle, TextField } from "@/components/admin-form";
import { prisma } from "@/lib/prisma";
import { languageThumbnail } from "@/lib/resource-taxonomy";
import { SmartImage } from "@/components/smart-image";

export default async function LanguagesPage({ searchParams }: { searchParams: Promise<{ edit?: string; success?: string; error?: string }> }) {
  const params = await searchParams;
  const [languages, edit] = await Promise.all([
    prisma.language.findMany({ orderBy: { sortOrder: "asc" } }),
    params.edit ? prisma.language.findUnique({ where: { id: params.edit } }) : null
  ]);
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <PageTitle title="Manage Languages" description="Manage language labels, colors, ordering, and local thumbnails." />
        <Link href="/admin/languages" className="mlp-btn-primary"><Plus className="size-4" /> Add New Language</Link>
      </div>
      <Notice success={params.success} error={params.error} />
      <form action={upsertLanguageAction} className="mb-8 grid gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#edf0f3] md:grid-cols-6">
        <input type="hidden" name="id" value={edit?.id ?? ""} />
        <TextField label="Name" name="name" defaultValue={edit?.name} required />
        <TextField label="Display" name="displayName" defaultValue={edit?.displayName} required />
        <TextField label="Code" name="code" defaultValue={edit?.code} required />
        <TextField label="Color" name="color" defaultValue={edit?.color ?? "#a64026"} type="color" />
        <TextField label="Order" name="sortOrder" defaultValue={edit?.sortOrder ?? 0} type="number" />
        <label className="flex items-center gap-2 pt-7 text-sm font-bold"><input type="checkbox" name="isActive" defaultChecked={edit?.isActive ?? true} className="accent-[#a64026]" /> Active</label>
        <div className="md:col-span-6">
          <TextField label="Thumbnail path" name="thumbnailPath" defaultValue={edit?.thumbnailPath ?? ""} />
          <p className="mt-1 text-sm text-[#6b7c8f]">Use local paths such as /thumbnails/languages/english-b4g.jpg.</p>
        </div>
        <div className="md:col-span-6"><FormActions submitLabel={edit ? "Save language" : "Add language"} cancelHref="/admin/languages" /></div>
      </form>
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#edf0f3]">
        <div className="mb-7 grid gap-4 md:grid-cols-[1fr_170px_150px]">
          <label className="relative"><Search className="pointer-events-none absolute left-4 top-3.5 size-4 text-[#8b9bad]" /><input placeholder="Search languages..." className="mlp-input w-full pl-11" /></label>
          <select className="mlp-input"><option>Sort by Order</option></select>
          <button className="mlp-btn-outline"><Download className="size-4" /> Export CSV</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead className="text-[11px] uppercase tracking-wide text-[#526579]"><tr><th className="px-4 py-4">Name / Display</th><th className="px-4 py-4">Thumbnail</th><th className="px-4 py-4">Badge Color</th><th className="px-4 py-4">Sort Order</th><th className="px-4 py-4">Status</th><th className="px-4 py-4 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-[#edf0f3]">
              {languages.map((language) => (
                <tr key={language.id}>
                  <td className="px-4 py-4"><div className="font-extrabold">{language.name}</div><div className="text-xs text-[#6b7c8f]">{language.displayName} - {language.code}</div></td>
                  <td className="px-4 py-4"><div className="relative h-12 w-20 overflow-hidden rounded bg-[#f2f4f7]"><SmartImage src={language.thumbnailPath || languageThumbnail(language.code)} alt="" fill className="h-full w-full object-cover" /></div></td>
                  <td className="px-4 py-4"><span className="inline-flex items-center gap-2 text-sm"><span className="size-5 rounded" style={{ backgroundColor: language.color }} /> {language.color}</span></td>
                  <td className="px-4 py-4 text-sm font-bold">{language.sortOrder}</td>
                  <td className="px-4 py-4"><span className="rounded border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-700">{language.isActive ? "Active" : "Inactive"}</span></td>
                  <td className="px-4 py-4"><div className="flex justify-end gap-4"><Link href={`/admin/languages?edit=${language.id}`} className="text-[#a64026]"><Pencil className="size-4" /></Link><form action={deleteLanguageAction}><input type="hidden" name="id" value={language.id} /><ConfirmDeleteButton compact label="Delete language" message={`Delete "${language.name}"? Existing resources will remain but lose this language label.`} /></form></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex justify-between text-sm text-[#526579]"><span>Showing {languages.length} languages</span><Link href="/admin/modules" className="font-bold text-[#a64026]">Manage Categories</Link></div>
      </div>
    </div>
  );
}
