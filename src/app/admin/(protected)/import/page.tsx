import { bulkImportVideosAction, importYouTubePlaylistAction, updateImportedPlaylistFormatAction, upsertVideoAction } from "@/app/admin/actions";
import { Notice } from "@/components/admin-shell";
import { FormActions, PageTitle, RegionAudienceFields, SelectField, TextArea, TextField, VisibilityField } from "@/components/admin-form";
import { prisma } from "@/lib/prisma";
import { PROGRAM_NAME, resourceCategories, resourceFormats } from "@/lib/resource-taxonomy";

export default async function ImportPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const params = await searchParams;
  const [languages, categories, playlists, importedResources] = await Promise.all([
    prisma.language.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.module.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.playlist.findMany({ orderBy: { title: "asc" } }),
    prisma.video.findMany({
      where: { sourcePlaylistId: { not: null } },
      orderBy: [{ sourcePlaylistId: "asc" }, { orderIndex: "asc" }],
      select: {
        id: true,
        title: true,
        sourcePlaylistId: true,
        sourcePlaylistUrl: true,
        resourceFormat: true,
        language: { select: { name: true } }
      }
    })
  ]);
  const importedCollections = playlists.filter((playlist) => playlist.id.startsWith("yt_"));
  const collectionBySourceId = new Map(importedCollections.map((playlist) => [playlist.id.replace(/^yt_/, ""), playlist]));
  const importedGroups = Array.from(
    importedResources.reduce((groups, resource) => {
      if (!resource.sourcePlaylistId) return groups;
      const group = groups.get(resource.sourcePlaylistId) ?? {
        sourcePlaylistId: resource.sourcePlaylistId,
        sourcePlaylistUrl: resource.sourcePlaylistUrl,
        title: collectionBySourceId.get(resource.sourcePlaylistId)?.title ?? `YouTube Playlist ${resource.sourcePlaylistId}`,
        language: resource.language?.name ?? "No language",
        count: 0,
        formats: new Set<string>(),
        firstTitles: [] as string[]
      };
      group.count += 1;
      group.formats.add(resource.resourceFormat);
      if (group.firstTitles.length < 3) group.firstTitles.push(resource.title);
      groups.set(resource.sourcePlaylistId, group);
      return groups;
    }, new Map<string, {
      sourcePlaylistId: string;
      sourcePlaylistUrl: string | null;
      title: string;
      language: string;
      count: number;
      formats: Set<string>;
      firstTitles: string[];
    }>())
  ).map(([, group]) => group);
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
        <input type="hidden" name="moduleId" value={categories.find((item) => item.name === "General Marketplace Literacy")?.id ?? ""} />
        <input type="hidden" name="category" value={resourceCategories.find((item) => item.name === "General Marketplace Literacy")?.name ?? "General Marketplace Literacy"} />
        <SelectField label="Resource Type" name="resourceType" defaultValue="Video">
          <option value="Video">Video</option>
        </SelectField>
        <VisibilityField value="Draft" />
        <RegionAudienceFields audience="Trainers" />
        <div className="md:col-span-2">
          <FormActions submitLabel={apiKey ? "Import YouTube Playlist" : "Import requires API key"} cancelHref="/admin" />
        </div>
      </form>

      <section className="mb-8 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#edf0f3] sm:p-6 lg:p-7">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold">Imported YouTube playlists</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#6b7c8f]">
              Each imported playlist stays grouped under its original YouTube playlist name. Move the whole imported group into a resource format with one click.
            </p>
          </div>
        </div>
        {importedGroups.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#d8dde5] bg-[#fbfcfd] px-4 py-8 text-sm font-bold text-[#6b7c8f]">
            No YouTube playlists have been imported yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {importedGroups.map((group) => (
              <div key={group.sourcePlaylistId} className="grid gap-4 rounded-xl border border-[#edf0f3] p-4 lg:grid-cols-[1fr_260px] lg:items-center">
                <div>
                  <div className="text-lg font-extrabold text-[#243447]">{group.title}</div>
                  <div className="mt-1 text-sm font-semibold text-[#6b7c8f]">
                    {group.language} - {group.count} resources - Current format{group.formats.size === 1 ? "" : "s"}: {Array.from(group.formats).join(", ")}
                  </div>
                  {group.sourcePlaylistUrl && (
                    <a href={group.sourcePlaylistUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-bold text-[#a64026]">
                      Open original YouTube playlist
                    </a>
                  )}
                  <div className="mt-3 text-xs leading-relaxed text-[#6b7c8f]">
                    Sample resources: {group.firstTitles.join("; ")}
                  </div>
                </div>
                <form action={updateImportedPlaylistFormatAction} className="grid gap-3">
                  <input type="hidden" name="sourcePlaylistId" value={group.sourcePlaylistId} />
                  <SelectField label="Move entire playlist to" name="resourceFormat" defaultValue={Array.from(group.formats)[0] ?? "Image Diaries"}>
                    {resourceFormats.map((item) => <option key={item} value={item}>{item}</option>)}
                  </SelectField>
                  <button type="submit" className="mlp-btn-primary w-full">Apply to all {group.count}</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

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
