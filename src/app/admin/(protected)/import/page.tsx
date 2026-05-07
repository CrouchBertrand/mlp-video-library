import { bulkImportVideosAction, importYouTubePlaylistAction, upsertVideoAction } from "@/app/admin/actions";
import { Notice } from "@/components/admin-shell";
import { FormActions, PageTitle, RegionAudienceFields, SelectField, TextArea, TextField, VisibilityField } from "@/components/admin-form";
import { prisma } from "@/lib/prisma";
import { PROGRAM_NAME, resourceFormats } from "@/lib/resource-taxonomy";

export default async function ImportPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const params = await searchParams;
  const [languages, categories, playlists] = await Promise.all([
    prisma.language.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.module.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.playlist.findMany({ orderBy: { title: "asc" } })
  ]);
  const apiKey = Boolean(process.env.YOUTUBE_API_KEY);
  return (
    <div>
      <PageTitle title="Import YouTube Playlist" description="Import YouTube links as Marketplace Literacy resources. No video files are downloaded, uploaded, or hosted." />
      <Notice success={params.success} error={params.error} />

      <form action={importYouTubePlaylistAction} className="mb-8 grid gap-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#edf0f3] sm:p-6 md:grid-cols-2 lg:p-7">
        <div className="md:col-span-2">
          <h2 className="text-xl font-extrabold">Full playlist import</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#6b7c8f]">
            The app uses the YouTube Data API on the server, saves each video as a resource link, preserves playlist order, and uses the selected local thumbnail fallback.
          </p>
          {!apiKey && (
            <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-[#a64026]">
              Full playlist import requires a YouTube API key in <code>YOUTUBE_API_KEY</code>. You can still add videos manually or paste multiple video links below.
            </div>
          )}
        </div>
        <TextField label="YouTube playlist URL" name="playlistUrl" required />
        <TextField label="Default thumbnail/fallback thumbnail" name="thumbnailUrl" />
        <SelectField label="Language" name="languageId" required>
          <option value="">Choose language</option>{languages.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </SelectField>
        <input type="hidden" name="program" value={PROGRAM_NAME} />
        <SelectField label="Resource Format" name="resourceFormat" defaultValue="Doodle">
          {resourceFormats.map((item) => <option key={item} value={item}>{item}</option>)}
        </SelectField>
        <SelectField label="Category" name="moduleId" required>
          <option value="">Choose category</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </SelectField>
        <SelectField label="Import into app collection optional" name="targetPlaylistId">
          <option value="">Do not assign to a collection</option>
          {playlists.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </SelectField>
        <SelectField label="Collection import behavior" name="targetPlaylistMode" defaultValue="add">
          <option value="add">Add imported resources to selected collection</option>
          <option value="replace">Replace resources in selected collection</option>
        </SelectField>
        <SelectField label="Resource Type" name="resourceType" defaultValue="Video">
          <option value="Video">Video</option>
        </SelectField>
        <VisibilityField value="Draft" />
        <RegionAudienceFields audience="Trainers" />
        <TextField label="Tags" name="tags" />
        <div className="md:col-span-2">
          <FormActions submitLabel={apiKey ? "Import YouTube Playlist" : "Import requires API key"} cancelHref="/admin" />
        </div>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        <form action={upsertVideoAction} className="grid gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#edf0f3] sm:p-6">
          <h2 className="text-xl font-bold">Single video import</h2>
          <TextField label="Resource title" name="resourceTitle" required />
          <TextField label="YouTube video URL" name="youtubeUrl" required />
          <TextArea label="Description" name="description" />
          <SelectField label="Language" name="languageId" required><option value="">Choose language</option>{languages.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField>
          <SelectField label="Resource Format" name="resourceFormat" defaultValue="Doodle">{resourceFormats.map((item) => <option key={item} value={item}>{item}</option>)}</SelectField>
          <SelectField label="Category" name="moduleId" required><option value="">Choose category</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField>
          <SelectField label="Assign to collection" name="playlistIds"><option value="">No collection yet</option>{playlists.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</SelectField>
          <RegionAudienceFields audience="Trainers" />
          <TextField label="Tags" name="tags" />
          <input type="hidden" name="visibility" value="Draft" />
          <FormActions submitLabel="Create draft resource" cancelHref="/admin/import" />
        </form>
        <form action={bulkImportVideosAction} className="grid gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#edf0f3] sm:p-6">
          <h2 className="text-xl font-bold">Bulk import video links</h2>
          <TextArea label="YouTube video URLs, one per line" name="urls" />
          <SelectField label="Assign to collection optional" name="playlistId"><option value="">No collection yet</option>{playlists.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</SelectField>
          <SelectField label="Language" name="languageId"><option value="">Choose language</option>{languages.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField>
          <SelectField label="Resource Format" name="resourceFormat" defaultValue="Doodle">{resourceFormats.map((item) => <option key={item} value={item}>{item}</option>)}</SelectField>
          <SelectField label="Category" name="moduleId"><option value="">Choose category</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField>
          <RegionAudienceFields audience="Trainers" />
          <TextField label="Tags" name="tags" />
          <FormActions submitLabel="Create draft resources" cancelHref="/admin/import" />
        </form>
      </div>
    </div>
  );
}
