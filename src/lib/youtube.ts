export function extractYouTubeVideoId(input: string): string | null {
  try {
    const trimmed = input.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be")) return url.pathname.split("/").filter(Boolean)[0] ?? null;
    if (url.searchParams.get("v")) return url.searchParams.get("v");
    const parts = url.pathname.split("/").filter(Boolean);
    const embedIndex = parts.findIndex((part) => ["embed", "shorts", "live"].includes(part));
    if (embedIndex >= 0) return parts[embedIndex + 1] ?? null;
    return null;
  } catch {
    return null;
  }
}

export function youtubeEmbedUrl(videoId: string) {
  return `https://www.youtube.com/embed/${videoId}`;
}

export function youtubeThumbnailUrl(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function youtubeWatchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function extractYouTubePlaylistId(input: string): string | null {
  try {
    const trimmed = input.trim();
    if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed) && !trimmed.includes("http")) return trimmed;
    const url = new URL(trimmed);
    const list = url.searchParams.get("list");
    if (list) return list;
    const parts = url.pathname.split("/").filter(Boolean);
    const playlistIndex = parts.findIndex((part) => part === "playlist");
    if (playlistIndex >= 0) return parts[playlistIndex + 1] ?? null;
    return null;
  } catch {
    return null;
  }
}

export function youtubePlaylistUrl(playlistId: string) {
  return `https://www.youtube.com/playlist?list=${playlistId}`;
}
