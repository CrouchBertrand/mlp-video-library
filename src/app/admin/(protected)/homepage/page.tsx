import { deleteHomepageSectionAction, upsertHomepageSectionAction } from "@/app/admin/actions";
import { Notice } from "@/components/admin-shell";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { FormActions, PageTitle, SelectField, TextArea, TextField, VisibilityField } from "@/components/admin-form";
import { prisma } from "@/lib/prisma";

export default async function HomepageAdminPage({ searchParams }: { searchParams: Promise<{ edit?: string; success?: string; error?: string }> }) {
  const params = await searchParams;
  const [sections, collections, languages, categories, edit] = await Promise.all([
    prisma.homepageSection.findMany({ orderBy: { sortOrder: "asc" }, include: { playlists: { include: { playlist: true } } } }),
    prisma.playlist.findMany({ orderBy: { title: "asc" } }),
    prisma.language.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.module.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    params.edit ? prisma.homepageSection.findUnique({ where: { id: params.edit }, include: { playlists: true } }) : null
  ]);
  const selected = new Set(edit?.playlists.map((item) => item.playlistId) ?? []);
  return (
    <div>
      <PageTitle title="Homepage Sections" description="Control the resource rows and grids visitors see on the public homepage." />
      <Notice success={params.success} error={params.error} />
      <form action={upsertHomepageSectionAction} className="mb-8 grid gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[#edf0f3] md:grid-cols-2">
        <input type="hidden" name="id" value={edit?.id ?? ""} />
        <TextField label="Section title" name="title" defaultValue={edit?.title} required />
        <TextField label="Sort order" name="sortOrder" defaultValue={edit?.sortOrder ?? 0} type="number" />
        <TextArea label="Description optional" name="description" defaultValue={edit?.description} />
        <SelectField label="Language filter optional" name="filterLanguageId" defaultValue={edit?.filterLanguageId}><option value="">No language filter</option>{languages.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField>
        <SelectField label="Category filter optional" name="filterModuleId" defaultValue={edit?.filterModuleId}><option value="">No category filter</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField>
        <SelectField label="Layout" name="layout" defaultValue={edit?.layout ?? "row"}><option value="row">Horizontal row</option><option value="grid">Responsive grid</option></SelectField>
        <VisibilityField value={edit?.visibility} />
        <fieldset className="md:col-span-2 rounded-xl border border-[#edf0f3] p-4">
          <legend className="px-2 font-semibold">Resource collections to show</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => <label key={collection.id} className="flex items-center gap-2 text-sm"><input type="checkbox" name="playlistIds" value={collection.id} defaultChecked={selected.has(collection.id)} className="accent-[#a64026]" /> {collection.title}</label>)}
          </div>
        </fieldset>
        <div className="md:col-span-2"><FormActions submitLabel={edit ? "Save section" : "Create section"} cancelHref="/admin/homepage" /></div>
      </form>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#edf0f3]">
        {sections.map((section) => (
          <div key={section.id} className="grid gap-3 border-b border-[#edf0f3] p-4 last:border-0 md:grid-cols-[1fr_auto_auto] md:items-center">
            <div><strong>{section.title}</strong><div className="text-sm text-[#6b7c8f]">{section.playlists.length} collections - {section.layout} - {section.visibility}</div></div>
            <a href={`/admin/homepage?edit=${section.id}`} className="mlp-btn-outline">Edit</a>
            <form action={deleteHomepageSectionAction}><input type="hidden" name="id" value={section.id} /><ConfirmDeleteButton message={`Delete "${section.title}"? This cannot be undone.`} /></form>
          </div>
        ))}
      </div>
    </div>
  );
}
