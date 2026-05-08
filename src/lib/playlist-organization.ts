import { slugify, youtubeStylePlaylists, youtubeStyleShelves } from "@/lib/resource-taxonomy";

type PlaylistLanguage = {
  name: string;
  code?: string | null;
};

type PlaylistLike = {
  id: string;
  title: string;
  youtubePlaylistUrl?: string | null;
  featured?: boolean | null;
  sortOrder?: number | null;
  visibility?: string | null;
  language?: PlaylistLanguage | null;
  videos?: Array<{ video?: { visibility?: string | null } }>;
  _count?: { videos?: number | null } | null;
};

const firstShelfByLanguage = new Map<string, string>();
for (const shelf of youtubeStyleShelves) {
  if (!firstShelfByLanguage.has(shelf.language)) firstShelfByLanguage.set(shelf.language, shelf.title);
}

const publicPlaylistMeta = new Map(
  youtubeStylePlaylists.map((playlist, index) => [
    playlistKey(playlist.language, playlist.title),
    {
      ...playlist,
      sortOrder: index + 1,
      canonicalId: `playlist_${index + 1}_${slugify(`${playlist.language}-${playlist.title}`)}`
    }
  ])
);

function playlistKey(languageName: string | null | undefined, title: string) {
  return `${languageName ?? ""}:${title.trim()}`;
}

function playlistVideoCount(playlist: PlaylistLike) {
  return playlist.videos?.filter((item) => item.video?.visibility !== "Hidden").length ?? playlist._count?.videos ?? 0;
}

function playlistPreferenceScore(playlist: PlaylistLike) {
  const meta = publicPlaylistMeta.get(playlistKey(playlist.language?.name, playlist.title));
  let score = 0;
  if (playlist.youtubePlaylistUrl) score += 400;
  if (playlist.id.startsWith("yt_")) score += 300;
  if (meta?.canonicalId === playlist.id) score += 200;
  if (playlist.featured) score += 20;
  if (playlist.visibility && playlist.visibility !== "Hidden") score += 10;
  score += Math.min(playlistVideoCount(playlist), 100);
  return score;
}

export function isPublicPlaylistRecord(playlist: PlaylistLike) {
  if (playlist.visibility === "Hidden") return false;
  const hasLanguage = Boolean(playlist.language?.name);
  const isCanonicalPublicPlaylist = publicPlaylistMeta.has(playlistKey(playlist.language?.name, playlist.title));
  const isImportedLanguagePlaylist = hasLanguage && (playlist.id.startsWith("yt_") || Boolean(playlist.youtubePlaylistUrl));
  return isCanonicalPublicPlaylist || isImportedLanguagePlaylist;
}

export function publicPlaylistShelfTitle(playlist: PlaylistLike) {
  const meta = publicPlaylistMeta.get(playlistKey(playlist.language?.name, playlist.title));
  if (meta) return meta.shelf;
  if (playlist.language?.name) return firstShelfByLanguage.get(playlist.language.name);
  return undefined;
}

export function publicPlaylistSortOrder(playlist: PlaylistLike) {
  const meta = publicPlaylistMeta.get(playlistKey(playlist.language?.name, playlist.title));
  if (meta) return meta.sortOrder;
  return 10000 + (playlist.sortOrder ?? 0);
}

export function selectPublicPlaylists<T extends PlaylistLike>(playlists: T[]) {
  const selected = new Map<string, T>();
  for (const playlist of playlists) {
    if (!isPublicPlaylistRecord(playlist)) continue;
    const key = playlistKey(playlist.language?.name, playlist.title);
    const existing = selected.get(key);
    if (!existing || playlistPreferenceScore(playlist) > playlistPreferenceScore(existing)) {
      selected.set(key, playlist);
    }
  }
  return Array.from(selected.values()).sort((a, b) => {
    const orderDelta = publicPlaylistSortOrder(a) - publicPlaylistSortOrder(b);
    if (orderDelta !== 0) return orderDelta;
    return a.title.localeCompare(b.title);
  });
}

export function publicPlaylistOptionLabel(playlist: PlaylistLike) {
  return `${playlist.title}${playlist.language?.name ? ` - ${playlist.language.name}` : ""}`;
}
