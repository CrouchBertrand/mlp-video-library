import Link from "next/link";
import { Save } from "lucide-react";
import { upsertPlaylistAction } from "@/app/admin/actions";
import { Notice } from "@/components/admin-shell";
import { RegionAudienceFields, SelectField, TextArea, TextField, VisibilityField } from "@/components/admin-form";
import { prisma } from "@/lib/prisma";

export default async function CollectionFormPage({ searchParams }: { searchParams: Promise<{ edit?: string; error?: string; success?: string }> }) {
  const params = await searchParams;
  const [languages, categories, resources, edit] = await Promise.all([
    prisma.language.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.module.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.video.findMany({ orderBy: [{ language: { sortOrder: "asc" } }, { category: "asc" }, { orderIndex: "asc" }], include: { language: true, module: true } }),
    params.edit ? prisma.playlist.findUnique({ where: { id: params.edit }, include: { videos: true } }) : null
  ]);
  const selectedResources = new Set(edit?.videos.map((item) => item.videoId) ?? []);
  return (
    <form action={upsertPlaylistAction}>
      <input type="hidden" name="id" value={edit?.id ?? ""} />
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 text-xs font-bold text-[#6b7c8f]">Playlists / <span className="text-[#a64026]">{edit ? "Edit Playlist" : "Add New Playlist"}</span></div>
          <h1 className="text-3xl font-extrabold">{edit ? "Edit Playlist" : "Add New Playlist"}</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/playlists" className="mlp-btn-outline">Cancel</Link>
          <button name="visibility" value="Draft" className="mlp-btn-outline">Save as Draft</button>
          <button name="visibility" value="Published" className="mlp-btn-primary"><Save className="size-4" /> Publish Playlist</button>
        </div>
      </div>
      <Notice success={params.success} error={params.error} />
      <div className="mx-auto grid max-w-4xl gap-5 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-[#edf0f3] md:grid-cols-2">
        <TextField label="Playlist title" name="title" defaultValue={edit?.title} required />
        <TextField label="Short title" name="shortTitle" defaultValue={edit?.shortTitle} />
        <TextArea label="Description" name="description" defaultValue={edit?.description} />
        <TextField label="Optional YouTube playlist URL" name="youtubePlaylistUrl" defaultValue={edit?.youtubePlaylistUrl} />
        <TextField label="Thumbnail URL" name="thumbnailUrl" defaultValue={edit?.thumbnailUrl} />
        <label className="block"><span className="mb-1 block font-semibold">Upload thumbnail placeholder</span><input name="thumbnailFile" type="file" accept="image/*" className="mlp-input h-auto w-full py-2" /></label>
        <SelectField label="Language" name="languageId" defaultValue={edit?.languageId} required><option value="">Select Language</option>{languages.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField>
        <SelectField label="Category" name="moduleId" defaultValue={edit?.moduleId} required><option value="">Select Category</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField>
        <RegionAudienceFields region={edit?.region} audience={edit?.audience} />
        <TextField label="Tags" name="tags" defaultValue={edit?.tags} />
        <VisibilityField value={edit?.visibility} />
        <TextField label="Sort order" name="sortOrder" type="number" defaultValue={edit?.sortOrder ?? 0} />
        <label className="flex items-center gap-2 pt-7 font-semibold"><input type="checkbox" name="featured" defaultChecked={edit?.featured ?? true} className="accent-[#a64026]" /> Featured on homepage</label>
        <fieldset className="md:col-span-2 rounded-xl border border-[#edf0f3] p-4">
          <legend className="px-2 font-semibold">Videos in this playlist</legend>
          <p className="mb-4 text-sm text-[#6b7c8f]">Check videos to add them. The order shown here is the saved playlist order.</p>
          <div className="grid max-h-72 gap-2 overflow-y-auto pr-2 sm:grid-cols-2">
            {resources.map((resource) => (
              <label key={resource.id} className="flex items-start gap-2 rounded-lg p-2 text-sm hover:bg-[#f7f8fa]">
                <input type="checkbox" name="videoIds" value={resource.id} defaultChecked={selectedResources.has(resource.id)} className="mt-1 accent-[#a64026]" />
                <span><strong className="block">{resource.resourceTitle || resource.title}</strong><small className="text-[#6b7c8f]">{resource.language?.name ?? "No language"} - {(resource.category || resource.module?.name) ?? "No category"}</small></span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="md:col-span-2 mt-4 flex justify-end gap-4 border-t border-[#edf0f3] pt-7"><Link href="/admin/playlists" className="mlp-btn-outline">Cancel</Link><button className="mlp-btn-primary">Save Changes</button></div>
      </div>
    </form>
  );
}
