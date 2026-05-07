import Link from "next/link";
import { Eye, Pencil, Plus, Search } from "lucide-react";
import { bulkManageVideosAction, deleteVideoAction } from "@/app/admin/actions";
import { Notice } from "@/components/admin-shell";
import { BulkResourceSelector } from "@/components/bulk-resource-selector";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { SmartImage } from "@/components/smart-image";
import { SelectField, TextField } from "@/components/admin-form";
import { audiences, regions, visibilities } from "@/lib/options";
import { prisma } from "@/lib/prisma";
import { normalizeResourceFormat, resourceFormatAliases, resourceFormats, resourceImage, resourceTypes, slugify, visibleResourceFormats } from "@/lib/resource-taxonomy";

export default async function VideosPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string; q?: string; page?: string; pageSize?: string; languageId?: string; moduleId?: string; format?: string }> }) {
  const params = await searchParams;
  const pageSize = [10, 30, 50].includes(Number(params.pageSize)) ? Number(params.pageSize) : 10;
  const currentPage = Math.max(1, Number(params.page || 1) || 1);
  const formatAliases = params.format ? resourceFormatAliases(params.format) : [];
  const where = params.q
    ? {
        AND: [
          {
            OR: [
              { title: { contains: params.q } },
              { resourceTitle: { contains: params.q } },
              { resourceFormat: { contains: params.q } },
              { category: { contains: params.q } },
              { tags: { contains: params.q } }
            ]
          },
          ...(params.languageId ? [{ languageId: params.languageId }] : []),
          ...(params.moduleId ? [{ moduleId: params.moduleId }] : []),
          ...(params.format ? [{ resourceFormat: { in: formatAliases } }] : [])
        ]
      }
    : {
        ...(params.languageId ? { languageId: params.languageId } : {}),
        ...(params.moduleId ? { moduleId: params.moduleId } : {}),
        ...(params.format ? { resourceFormat: { in: formatAliases } } : {})
      };
  const [resources, languages, categories, collections, total] = await Promise.all([
    prisma.video.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      include: { language: true, module: true, playlists: true },
      skip: (currentPage - 1) * pageSize,
      take: pageSize
    }),
    prisma.language.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.module.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.playlist.findMany({ orderBy: { title: "asc" } }),
    prisma.video.count({ where })
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageHref = (page: number, size = pageSize) => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.languageId) query.set("languageId", params.languageId);
    if (params.moduleId) query.set("moduleId", params.moduleId);
    if (params.format) query.set("format", params.format);
    query.set("page", String(page));
    query.set("pageSize", String(size));
    return `/admin/videos?${query.toString()}`;
  };
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 sm:mb-8">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Manage Resources</h1>
          <p className="mt-2 text-sm text-[#6b7c8f]">Total {total} resources across {languages.length} languages</p>
        </div>
        <Link href="/admin/videos/new" className="mlp-btn-primary w-full sm:w-auto"><Plus className="size-4" /> Add New Resource</Link>
      </div>
      <Notice success={params.success} error={params.error} />
      <form className="mb-6 grid gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#edf0f3] md:grid-cols-2 md:gap-4 xl:grid-cols-[1fr_150px_150px_170px_130px_100px]">
        <label className="flex h-[42px] items-center overflow-hidden rounded-md border border-[#d8dde5] bg-white focus-within:border-[#a64026] focus-within:ring-4 focus-within:ring-[#a64026]/10">
          <span className="grid h-full w-11 shrink-0 place-items-center border-r border-[#edf0f3] text-[#8b9bad]"><Search className="size-4" /></span>
          <input name="q" defaultValue={params.q ?? ""} placeholder="Search resources..." className="h-full min-w-0 flex-1 px-3 text-[#243447] outline-none" />
          <input type="hidden" name="page" value="1" />
        </label>
        <select name="languageId" defaultValue={params.languageId ?? ""} className="mlp-input w-full"><option value="">All Languages</option>{languages.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select name="format" defaultValue={params.format ?? ""} className="mlp-input w-full"><option value="">All Formats</option>{visibleResourceFormats.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <select name="moduleId" defaultValue={params.moduleId ?? ""} className="mlp-input w-full"><option value="">All Categories</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select name="pageSize" defaultValue={pageSize} className="mlp-input w-full" aria-label="Resources per page">
          <option value="10">10 per page</option>
          <option value="30">30 per page</option>
          <option value="50">50 per page</option>
        </select>
        <button className="h-[42px] rounded-lg bg-[#a64026] px-4 font-bold text-white">Apply</button>
      </form>
      <form id="bulk-resource-form" action={bulkManageVideosAction} className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#edf0f3] sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-extrabold">Bulk edit selected resources</h2>
            <p className="mt-1 text-sm text-[#6b7c8f]">Select multiple resources below, then update their category, collection, format, visibility, or delete them together.</p>
          </div>
          <BulkResourceSelector />
        </div>
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <SelectField label="Action" name="bulkAction" defaultValue="update">
            <option value="update">Update selected</option>
            <option value="delete">Delete selected</option>
          </SelectField>
          <SelectField label="Category" name="bulkModuleId">
            <option value="">Leave unchanged</option>
            {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </SelectField>
          <SelectField label="Collection" name="bulkPlaylistId">
            <option value="">Do not change</option>
            {collections.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </SelectField>
          <SelectField label="Collection mode" name="bulkPlaylistMode" defaultValue="add">
            <option value="add">Add to collection</option>
            <option value="replace">Replace collection assignment</option>
          </SelectField>
          <SelectField label="Language" name="bulkLanguageId">
            <option value="">Leave unchanged</option>
            {languages.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </SelectField>
          <SelectField label="Visibility" name="bulkVisibility">
            <option value="">Leave unchanged</option>
            {visibilities.map((item) => <option key={item} value={item}>{item}</option>)}
          </SelectField>
          <SelectField label="Resource type" name="bulkResourceType">
            <option value="">Leave unchanged</option>
            {resourceTypes.map((item) => <option key={item} value={item}>{item}</option>)}
          </SelectField>
          <SelectField label="Resource format" name="bulkResourceFormat">
            <option value="">Leave unchanged</option>
            {resourceFormats.map((item) => <option key={item} value={item}>{item}</option>)}
          </SelectField>
          <SelectField label="Region" name="bulkRegion">
            <option value="">Leave unchanged</option>
            {regions.map((item) => <option key={item} value={item}>{item}</option>)}
          </SelectField>
          <SelectField label="Audience" name="bulkAudience">
            <option value="">Leave unchanged</option>
            {audiences.map((item) => <option key={item} value={item}>{item}</option>)}
          </SelectField>
          <TextField label="Replace tags optional" name="bulkTags" />
          <div className="flex items-end">
            <button className="h-11 w-full rounded-lg bg-[#a64026] px-5 font-bold text-white">Apply to selected</button>
          </div>
        </div>
      </form>
      <div className="grid gap-3 xl:hidden">
        {resources.length > 0 ? resources.map((resource) => (
          <article key={resource.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#edf0f3]">
            <div className="flex items-start gap-3">
              <input form="bulk-resource-form" type="checkbox" name="videoIds" value={resource.id} className="mt-1 size-5 rounded border-[#d8dde5] accent-[#a64026]" aria-label={`Select ${resource.resourceTitle || resource.title}`} />
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-[#f2f4f7]">
                <SmartImage src={resourceImage(resource)} alt="" fill className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="line-clamp-2 font-extrabold">{resource.resourceTitle || resource.title}</h2>
                <p className="mt-1 text-xs font-semibold text-[#6b7c8f]">{resource.language?.name ?? "No language"} - {resource.category || resource.module?.name || "No category"}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="mlp-soft-badge">{resource.resourceFormat}</span>
                  <StatusBadge status={resource.visibility} />
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Link href={`/resources/${resource.language?.code ?? "en"}/${slugify(normalizeResourceFormat(resource.resourceFormat))}/${slugify(resource.category || "General Marketplace Literacy")}?resource=${resource.id}`} className="mlp-btn-outline px-2 text-sm"><Eye className="size-4" /> View</Link>
              <Link href={`/admin/videos/new?edit=${resource.id}`} className="mlp-btn-outline px-2 text-sm"><Pencil className="size-4" /> Edit</Link>
              <form action={deleteVideoAction}><input type="hidden" name="id" value={resource.id} /><ConfirmDeleteButton compact label="Delete resource" message={`Delete "${resource.resourceTitle || resource.title}"? This cannot be undone.`} /></form>
            </div>
          </article>
        )) : (
          <div className="rounded-2xl bg-white p-8 text-center text-[#6b7c8f] shadow-sm ring-1 ring-[#edf0f3]">No resources found. Add a new resource when you are ready.</div>
        )}
      </div>
      <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-[#edf0f3] xl:block">
        <table className="w-full min-w-[880px] text-left">
          <thead className="bg-[#fbfcfd] text-[11px] uppercase tracking-wide text-[#526579]">
            <tr>
              <th className="px-6 py-4">Select</th>
              <th className="px-6 py-4">Resource Title & Category</th>
              <th className="px-6 py-4">Language</th>
              <th className="px-6 py-4">Format</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf0f3]">
            {resources.length > 0 ? resources.map((resource) => (
              <tr key={resource.id}>
                <td className="px-6 py-4 align-middle">
                  <input form="bulk-resource-form" type="checkbox" name="videoIds" value={resource.id} className="size-4 rounded border-[#d8dde5] accent-[#a64026]" aria-label={`Select ${resource.resourceTitle || resource.title}`} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-14 w-24 overflow-hidden rounded-md bg-[#f2f4f7]">
                      <SmartImage src={resourceImage(resource)} alt="" fill className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <div className="font-extrabold">{resource.resourceTitle || resource.title}</div>
                      <div className="mt-1 text-xs font-semibold text-[#6b7c8f]">{resource.category || resource.module?.name || "No category"}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-[#526579]">{resource.language?.name ?? "No language"}</td>
                <td className="px-6 py-4 text-sm font-bold text-[#526579]">{resource.resourceFormat}</td>
                <td className="px-6 py-4"><StatusBadge status={resource.visibility} /></td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-4">
                    <Link href={`/resources/${resource.language?.code ?? "en"}/${slugify(normalizeResourceFormat(resource.resourceFormat))}/${slugify(resource.category || "General Marketplace Literacy")}?resource=${resource.id}`} className="text-[#526579]" title="Preview"><Eye className="size-4" /></Link>
                    <Link href={`/admin/videos/new?edit=${resource.id}`} className="text-[#a64026]" title="Edit"><Pencil className="size-4" /></Link>
                    <form action={deleteVideoAction}><input type="hidden" name="id" value={resource.id} /><ConfirmDeleteButton compact label="Delete resource" message={`Delete "${resource.resourceTitle || resource.title}"? This cannot be undone.`} /></form>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-[#6b7c8f]">No resources found. Add a new resource when you are ready.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-6 grid gap-4 text-sm text-[#526579] sm:flex sm:items-center sm:justify-between">
        <span>Showing {(safePage - 1) * pageSize + (resources.length ? 1 : 0)}-{Math.min(safePage * pageSize, total)} of {total} resources</span>
        <div className="flex flex-wrap items-center gap-2">
          {safePage > 1 ? <Link href={pageHref(safePage - 1)} className="mlp-btn-outline">Previous</Link> : <span className="mlp-btn-outline opacity-50">Previous</span>}
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNumber = i + 1;
            if (totalPages > 7 && safePage > 4) pageNumber = Math.min(totalPages - 6 + i, safePage - 3 + i);
            return pageNumber;
          }).filter((value, index, list) => list.indexOf(value) === index).map((pageNumber) => (
            <Link key={pageNumber} href={pageHref(pageNumber)} className={pageNumber === safePage ? "grid size-10 place-items-center rounded-lg bg-[#a64026] font-bold text-white" : "mlp-btn-outline min-w-10 px-3"}>{pageNumber}</Link>
          ))}
          {safePage < totalPages ? <Link href={pageHref(safePage + 1)} className="mlp-btn-outline">Next</Link> : <span className="mlp-btn-outline opacity-50">Next</span>}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = status === "Published" ? "bg-green-50 text-green-700 border-green-200" : status === "Hidden" ? "bg-stone-100 text-stone-700 border-stone-300" : "bg-[#f7f8fa] text-green-700 border-[#d8dde5]";
  return <span className={`inline-flex min-w-24 justify-center rounded border px-3 py-1 text-xs font-bold ${colors}`}>{status}</span>;
}
