"use client";

import { useMemo, useState } from "react";
import { Upload } from "lucide-react";
import { SmartImage } from "@/components/smart-image";
import { extractYouTubeVideoId, youtubeThumbnailUrl } from "@/lib/youtube";

export function YouTubeVideoFields({
  defaultUrl,
  defaultThumbnail
}: {
  defaultUrl?: string | null;
  defaultThumbnail?: string | null;
}) {
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [manualThumbnail, setManualThumbnail] = useState(defaultThumbnail ?? "");
  const videoId = useMemo(() => extractYouTubeVideoId(url), [url]);
  const autoThumbnail = videoId ? youtubeThumbnailUrl(videoId) : "";
  const preview = manualThumbnail;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-[1fr_180px]">
        <label className="block">
          <span className="mb-1 block font-semibold">YouTube URL</span>
          <input
            name="youtubeUrl"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="mlp-input w-full"
          />
        </label>
        <label className="block">
          <span className="mb-1 block font-semibold">Video ID</span>
          <input value={videoId ?? ""} readOnly placeholder="Auto-detected" className="mlp-input w-full bg-[#f7f8fa]" />
        </label>
      </div>
      <input type="hidden" name="thumbnailUrl" value={preview} />
      <label className="block">
        <span className="mb-1 block font-semibold">Custom thumbnail URL optional</span>
        <input
          value={manualThumbnail}
          onChange={(event) => setManualThumbnail(event.target.value)}
          placeholder={autoThumbnail ? "Leave blank to use the language thumbnail" : "Leave blank to use the selected language thumbnail"}
          className="mlp-input w-full"
        />
      </label>
      <div className="relative grid aspect-video max-w-sm place-items-center overflow-hidden rounded-lg bg-[#f7f8fa] ring-1 ring-[#edf0f3]">
        {preview ? (
          <SmartImage src={preview} alt="Thumbnail preview" fill className="h-full w-full object-cover" />
        ) : (
          <div className="text-center text-xs font-bold text-[#526579]">
            <Upload className="mx-auto mb-2 size-6" />
            Thumbnail Preview
          </div>
        )}
      </div>
    </>
  );
}
