export const PROGRAM_NAME = "Marketplace Literacy";

export const languageThumbnails: Record<string, string> = {
  en: "/thumbnails/languages/english-b4g.jpg",
  fr: "/thumbnails/languages/french-b4g.jpg",
  hi: "/thumbnails/languages/hindi-b4g.jpg",
  es: "/thumbnails/languages/spanish-b4g.jpg",
  sw: "/thumbnails/languages/swahili-b4g.jpg",
  te: "/thumbnails/languages/telugu-b4g.jpg"
};

export const resourceLanguages = [
  { name: "English", displayName: "English", code: "en", color: "#A64026" },
  { name: "French", displayName: "Francais", code: "fr", color: "#8A3B2A" },
  { name: "Hindi", displayName: "Hindi", code: "hi", color: "#A64026" },
  { name: "Spanish", displayName: "Espanol", code: "es", color: "#9B3C25" },
  { name: "Swahili", displayName: "Kiswahili", code: "sw", color: "#7F3B2C" },
  { name: "Telugu", displayName: "Telugu", code: "te", color: "#A64026" }
];

export const resourceCategories = [
  {
    name: "Introduction",
    description: "Start here for a short orientation to Marketplace Literacy resources."
  },
  {
    name: "General Marketplace Literacy",
    description: "Foundational concepts for understanding needs, customers, value, and markets."
  },
  {
    name: "Personal and Professional Aspirations",
    description: "Resources that help facilitators discuss learner goals, livelihoods, confidence, and professional growth."
  },
  {
    name: "Consumer Literacy",
    description: "Resources that help facilitators discuss value and consumer decision-making."
  },
  {
    name: "Entrepreneurial Literacy",
    description: "Resources for business choice, customers, products, and communication."
  },
  {
    name: "Sustainability Literacy",
    description: "Future sustainability resources for facilitators and learning groups."
  }
];

export const resourceTypes = ["Video", "Document", "Activity", "Script", "Audio"];

export const resourceFormats = [
  "Image Diaries",
  "Animations",
  "Doodle",
  "Video Scribe",
  "Online"
];

export const visibleResourceFormats = resourceFormats;

export function normalizeResourceFormat(value?: string | null) {
  if (!value) return "Doodle";
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "doodle video" || lower === "doodle") return "Doodle";
  if (lower === "image diary" || lower === "image diaries") return "Image Diaries";
  if (lower === "animation" || lower === "animations") return "Animations";
  if (lower === "videoscribe" || lower === "video scribe") return "Video Scribe";
  return trimmed;
}

export function resourceFormatAliases(value?: string | null) {
  const normalized = normalizeResourceFormat(value);
  if (normalized === "Doodle") return ["Doodle", "Doodle Video"];
  if (normalized === "Image Diaries") return ["Image Diaries", "Image Diary"];
  if (normalized === "Animations") return ["Animations", "Animation"];
  if (normalized === "Video Scribe") return ["Video Scribe", "VideoScribe"];
  return [normalized];
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function categoryFromSlug(slug: string) {
  return resourceCategories.find((category) => slugify(category.name) === slug) ?? null;
}

export function resourceFormatFromSlug(slug: string) {
  const direct = resourceFormats.find((format) => slugify(format) === slug);
  if (direct) return normalizeResourceFormat(direct);
  if (slug === "doodle-video") return "Doodle";
  if (slug === "image-diary") return "Image Diaries";
  if (slug === "animation") return "Animations";
  if (slug === "video-scribe" || slug === "videoscribe") return "Video Scribe";
  return null;
}

export function languageThumbnail(code?: string | null) {
  if (!code) return "/placeholder.svg";
  return languageThumbnails[code] ?? "/placeholder.svg";
}

export function resourceImage(resource: {
  uploadedThumbnailPath?: string | null;
  thumbnailUrl?: string | null;
  language?: { thumbnailPath?: string | null; code?: string | null } | null;
}) {
  return resource.uploadedThumbnailPath || resource.thumbnailUrl || resource.language?.thumbnailPath || languageThumbnail(resource.language?.code);
}
