"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { clearAdminSession, requireAdmin, setAdminSession, verifyLogin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanOptional, cleanText } from "@/lib/sanitize";
import { saveUploadedImage } from "@/lib/uploads";
import { languageThumbnail, normalizeResourceFormat, PROGRAM_NAME } from "@/lib/resource-taxonomy";
import { extractYouTubePlaylistId, extractYouTubeVideoId, youtubeEmbedUrl, youtubePlaylistUrl, youtubeWatchUrl } from "@/lib/youtube";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 8;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

async function loginAttemptKey(email: string) {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || headerList.get("x-real-ip") || "local";
  return `${ip}:${email.toLowerCase().trim()}`;
}

function tooManyLoginAttempts(key: string) {
  const attempt = loginAttempts.get(key);
  if (!attempt) return false;
  if (attempt.resetAt < Date.now()) {
    loginAttempts.delete(key);
    return false;
  }
  return attempt.count >= LOGIN_MAX_ATTEMPTS;
}

function recordFailedLogin(key: string) {
  const now = Date.now();
  const attempt = loginAttempts.get(key);
  if (!attempt || attempt.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }
  attempt.count += 1;
}

async function guard() {
  const user = await requireAdmin();
  if (!user) redirect("/admin/login");
  return user;
}

function visibility(value: FormDataEntryValue | null) {
  const next = cleanText(value);
  return ["Published", "Draft", "Hidden"].includes(next) ? next : "Draft";
}

type YouTubePlaylistItem = {
  snippet?: {
    title?: string;
    description?: string;
    position?: number;
    resourceId?: { videoId?: string };
  };
  contentDetails?: { videoId?: string };
};

type YouTubePlaylistResponse = {
  nextPageToken?: string;
  items?: YouTubePlaylistItem[];
  error?: { message?: string };
  pageInfo?: { totalResults?: number };
};

export async function loginAction(formData: FormData) {
  const email = cleanText(formData.get("email"));
  const password = cleanText(formData.get("password"));
  const attemptKey = await loginAttemptKey(email);
  if (tooManyLoginAttempts(attemptKey)) {
    redirect("/admin/login?error=Too many failed sign-in attempts. Please wait a few minutes and try again.");
  }
  const user = await verifyLogin(email, password);
  if (!user) {
    recordFailedLogin(attemptKey);
    redirect("/admin/login?error=Invalid email or password");
  }
  loginAttempts.delete(attemptKey);
  await setAdminSession(user.id);
  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/");
}

export async function changePasswordAction(formData: FormData) {
  const user = await guard();
  const password = cleanText(formData.get("password"));
  if (password.length < 10) redirect("/admin/settings?error=Password must be at least 10 characters");
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 12) } });
  redirect("/admin/settings?success=Password updated");
}

export async function upsertLanguageAction(formData: FormData) {
  await guard();
  const id = cleanOptional(formData.get("id"));
  const data = {
    name: cleanText(formData.get("name")),
    displayName: cleanText(formData.get("displayName")),
    code: cleanText(formData.get("code")).toLowerCase(),
    color: cleanText(formData.get("color")) || "#7f1d1d",
    thumbnailPath: cleanOptional(formData.get("thumbnailPath")),
    sortOrder: Number(cleanText(formData.get("sortOrder")) || 0),
    isActive: formData.get("isActive") === "on"
  };
  if (!data.name || !data.displayName || !data.code) redirect("/admin/languages?error=Name, display name, and code are required");
  if (id) await prisma.language.update({ where: { id }, data });
  else await prisma.language.create({ data });
  revalidatePath("/");
  redirect("/admin/languages?success=Language saved");
}

export async function deleteLanguageAction(formData: FormData) {
  await guard();
  await prisma.language.delete({ where: { id: cleanText(formData.get("id")) } });
  revalidatePath("/");
  redirect("/admin/languages?success=Language deleted");
}

export async function upsertModuleAction(formData: FormData) {
  await guard();
  const id = cleanOptional(formData.get("id"));
  const data = {
    name: cleanText(formData.get("name")),
    description: cleanOptional(formData.get("description")),
    parentId: cleanOptional(formData.get("parentId")),
    color: cleanText(formData.get("color")) || "#f3e8e6",
    sortOrder: Number(cleanText(formData.get("sortOrder")) || 0),
    isActive: formData.get("isActive") === "on"
  };
  if (!data.name) redirect("/admin/modules?error=Module name is required");
  if (id) await prisma.module.update({ where: { id }, data });
  else await prisma.module.create({ data });
  revalidatePath("/");
  redirect("/admin/modules?success=Category saved");
}

export async function deleteModuleAction(formData: FormData) {
  await guard();
  await prisma.module.delete({ where: { id: cleanText(formData.get("id")) } });
  revalidatePath("/");
  redirect("/admin/modules?success=Module deleted");
}

export async function upsertPlaylistAction(formData: FormData) {
  await guard();
  const id = cleanOptional(formData.get("id"));
  const uploadedThumbnailPath = await saveUploadedImage(formData.get("thumbnailFile") as File | null, "playlist");
  const data = {
    title: cleanText(formData.get("title")),
    shortTitle: cleanOptional(formData.get("shortTitle")),
    description: cleanOptional(formData.get("description")),
    youtubePlaylistUrl: cleanOptional(formData.get("youtubePlaylistUrl")),
    thumbnailUrl: cleanOptional(formData.get("thumbnailUrl")),
    ...(uploadedThumbnailPath ? { uploadedThumbnailPath } : {}),
    languageId: cleanOptional(formData.get("languageId")),
    moduleId: cleanOptional(formData.get("moduleId")),
    region: cleanText(formData.get("region")) || "Global",
    audience: cleanText(formData.get("audience")) || "General",
    tags: cleanText(formData.get("tags")),
    visibility: visibility(formData.get("visibility")),
    featured: formData.get("featured") === "on",
    sortOrder: Number(cleanText(formData.get("sortOrder")) || 0)
  };
  if (!data.title) redirect("/admin/playlists/new?error=Collection title is required");
  if (!data.languageId) redirect("/admin/playlists/new?error=Please choose a language");
  if (!data.moduleId) redirect("/admin/playlists/new?error=Please choose a category");
  const playlist = id ? await prisma.playlist.update({ where: { id }, data }) : await prisma.playlist.create({ data });
  const videoIds = formData.getAll("videoIds").map(String).filter(Boolean);
  if (videoIds.length > 0 || id) {
    await prisma.playlistVideo.deleteMany({ where: { playlistId: playlist.id } });
    for (let i = 0; i < videoIds.length; i++) {
      await prisma.playlistVideo.create({ data: { playlistId: playlist.id, videoId: videoIds[i], sortOrder: i + 1 } });
    }
  }
  revalidatePath("/");
  redirect("/admin/playlists?success=Collection saved");
}

export async function deletePlaylistAction(formData: FormData) {
  await guard();
  await prisma.playlist.delete({ where: { id: cleanText(formData.get("id")) } });
  revalidatePath("/");
  redirect("/admin/playlists?success=Collection deleted");
}

export async function duplicatePlaylistAction(formData: FormData) {
  await guard();
  const id = cleanText(formData.get("id"));
  const playlist = await prisma.playlist.findUnique({ where: { id }, include: { videos: true } });
  if (!playlist) redirect("/admin/playlists?error=Playlist not found");
  const copy = await prisma.playlist.create({
    data: {
      title: `${playlist.title} Copy`,
      shortTitle: playlist.shortTitle,
      description: playlist.description,
      youtubePlaylistUrl: playlist.youtubePlaylistUrl,
      thumbnailUrl: playlist.thumbnailUrl,
      uploadedThumbnailPath: playlist.uploadedThumbnailPath,
      languageId: playlist.languageId,
      moduleId: playlist.moduleId,
      region: playlist.region,
      audience: playlist.audience,
      tags: playlist.tags,
      visibility: "Draft",
      featured: false,
      sortOrder: playlist.sortOrder + 1
    }
  });
  for (const video of playlist.videos) {
    await prisma.playlistVideo.create({ data: { playlistId: copy.id, videoId: video.videoId, sortOrder: video.sortOrder } });
  }
  redirect("/admin/playlists?success=Playlist duplicated");
}

export async function upsertVideoAction(formData: FormData) {
  await guard();
  const id = cleanOptional(formData.get("id"));
  const youtubeUrl = cleanText(formData.get("youtubeUrl"));
  const youtubeVideoId = extractYouTubeVideoId(youtubeUrl);
  const uploadedThumbnailPath = await saveUploadedImage(formData.get("thumbnailFile") as File | null, "video");
  const languageId = cleanOptional(formData.get("languageId"));
  const moduleId = cleanOptional(formData.get("moduleId"));
  const language = languageId ? await prisma.language.findUnique({ where: { id: languageId } }) : null;
  const categoryRow = moduleId ? await prisma.module.findUnique({ where: { id: moduleId } }) : null;
  const title = cleanText(formData.get("resourceTitle")) || cleanText(formData.get("title"));
  const visibilityValue = visibility(formData.get("visibility"));
  const data = {
    title,
    resourceTitle: title,
    description: cleanOptional(formData.get("description")),
    youtubeUrl,
    youtubeVideoId: youtubeVideoId ?? "",
    embedUrl: youtubeVideoId ? youtubeEmbedUrl(youtubeVideoId) : "",
    thumbnailUrl: cleanOptional(formData.get("thumbnailUrl")) || language?.thumbnailPath || languageThumbnail(language?.code),
    ...(uploadedThumbnailPath ? { uploadedThumbnailPath } : {}),
    program: cleanText(formData.get("program")) || PROGRAM_NAME,
    category: cleanText(formData.get("category")) || categoryRow?.name || "General Marketplace Literacy",
    resourceType: cleanText(formData.get("resourceType")) || "Video",
    resourceFormat: normalizeResourceFormat(cleanText(formData.get("resourceFormat")) || "Doodle"),
    transcript: cleanOptional(formData.get("transcript")),
    orderIndex: Number(cleanText(formData.get("orderIndex")) || 0),
    isPublished: visibilityValue === "Published",
    languageId,
    moduleId,
    region: cleanText(formData.get("region")) || "Global",
    audience: cleanText(formData.get("audience")) || "General",
    tags: cleanText(formData.get("tags")),
    duration: cleanOptional(formData.get("duration")),
    visibility: visibilityValue
  };
  if (!data.title) redirect("/admin/videos/new?error=Resource title is required");
  if (!data.languageId) redirect("/admin/videos/new?error=Please choose a language");
  if (!data.moduleId) redirect("/admin/videos/new?error=Please choose a category");
  const playlistIds = formData.getAll("playlistIds").map(String).filter(Boolean);
  const video = id ? await prisma.video.update({ where: { id }, data }) : await prisma.video.create({ data });
  await prisma.playlistVideo.deleteMany({ where: { videoId: video.id } });
  for (let i = 0; i < playlistIds.length; i++) {
    await prisma.playlistVideo.create({ data: { videoId: video.id, playlistId: playlistIds[i], sortOrder: i + 1 } });
  }
  revalidatePath("/");
  redirect("/admin/videos?success=Resource saved");
}

export async function deleteVideoAction(formData: FormData) {
  await guard();
  await prisma.video.delete({ where: { id: cleanText(formData.get("id")) } });
  revalidatePath("/");
  redirect("/admin/videos?success=Resource deleted");
}

export async function bulkManageVideosAction(formData: FormData) {
  await guard();
  const ids = formData.getAll("videoIds").map(String).filter(Boolean);
  if (ids.length === 0) redirect("/admin/videos?error=Select at least one resource first.");

  const action = cleanText(formData.get("bulkAction"));
  if (action === "delete") {
    await prisma.video.deleteMany({ where: { id: { in: ids } } });
    revalidatePath("/");
    redirect(`/admin/videos?success=${ids.length} selected resources deleted`);
  }

  const languageId = cleanOptional(formData.get("bulkLanguageId"));
  const moduleId = cleanOptional(formData.get("bulkModuleId"));
  const categoryRow = moduleId ? await prisma.module.findUnique({ where: { id: moduleId } }) : null;
  const visibilityValue = cleanOptional(formData.get("bulkVisibility"));
  const resourceType = cleanOptional(formData.get("bulkResourceType"));
  const resourceFormat = cleanOptional(formData.get("bulkResourceFormat"));
  const region = cleanOptional(formData.get("bulkRegion"));
  const audience = cleanOptional(formData.get("bulkAudience"));
  const tags = cleanOptional(formData.get("bulkTags"));

  const data: Record<string, string | boolean | null> = {};
  if (languageId) data.languageId = languageId;
  if (moduleId) {
    data.moduleId = moduleId;
    data.category = categoryRow?.name ?? "General Marketplace Literacy";
  }
  if (visibilityValue) {
    data.visibility = visibility(visibilityValue);
    data.isPublished = visibility(visibilityValue) === "Published";
  }
  if (resourceType) data.resourceType = resourceType;
  if (resourceFormat) data.resourceFormat = normalizeResourceFormat(resourceFormat);
  if (region) data.region = region;
  if (audience) data.audience = audience;
  if (tags) data.tags = tags;

  if (Object.keys(data).length > 0) {
    await prisma.video.updateMany({ where: { id: { in: ids } }, data });
  }

  const playlistId = cleanOptional(formData.get("bulkPlaylistId"));
  const playlistMode = cleanText(formData.get("bulkPlaylistMode")) || "add";
  if (playlistId) {
    if (playlistMode === "replace") {
      await prisma.playlistVideo.deleteMany({ where: { videoId: { in: ids } } });
    }
    const existingCount = await prisma.playlistVideo.count({ where: { playlistId } });
    for (let i = 0; i < ids.length; i++) {
      await prisma.playlistVideo.upsert({
        where: { playlistId_videoId: { playlistId, videoId: ids[i] } },
        update: {},
        create: { playlistId, videoId: ids[i], sortOrder: existingCount + i + 1 }
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/admin/videos");
  redirect(`/admin/videos?success=${ids.length} selected resources updated`);
}

export async function bulkImportVideosAction(formData: FormData) {
  await guard();
  const lines = cleanText(formData.get("urls")).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const playlistId = cleanOptional(formData.get("playlistId"));
  const moduleId = cleanOptional(formData.get("moduleId"));
  const categoryRow = moduleId ? await prisma.module.findUnique({ where: { id: moduleId } }) : null;
  const resourceFormat = normalizeResourceFormat(cleanText(formData.get("resourceFormat")) || "Doodle");
  let created = 0;
  for (const line of lines) {
    const id = extractYouTubeVideoId(line);
    if (!id) continue;
    const video = await prisma.video.create({
      data: {
        title: `Imported YouTube Video ${id}`,
        youtubeUrl: line,
        youtubeVideoId: id,
        embedUrl: youtubeEmbedUrl(id),
        thumbnailUrl: languageThumbnail("en"),
        program: PROGRAM_NAME,
        category: categoryRow?.name ?? "General Marketplace Literacy",
        resourceType: "Video",
        resourceFormat,
        isPublished: false,
        languageId: cleanOptional(formData.get("languageId")),
        moduleId,
        region: cleanText(formData.get("region")) || "Global",
        audience: cleanText(formData.get("audience")) || "General",
        tags: cleanText(formData.get("tags")),
        visibility: "Draft"
      }
    });
    if (playlistId) {
      await prisma.playlistVideo.create({ data: { videoId: video.id, playlistId, sortOrder: created + 1 } });
    }
    created++;
  }
  redirect(`/admin/import?success=${created} draft videos imported`);
}

export async function importYouTubePlaylistAction(formData: FormData) {
  await guard();
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    redirect("/admin/import?error=Full playlist import requires a YouTube API key in the environment settings.");
  }

  const playlistInput = cleanText(formData.get("playlistUrl"));
  const sourcePlaylistId = extractYouTubePlaylistId(playlistInput);
  if (!sourcePlaylistId) redirect("/admin/import?error=Please paste a valid YouTube playlist URL.");

  const languageId = cleanOptional(formData.get("languageId"));
  let moduleId = cleanOptional(formData.get("moduleId"));
  if (!languageId) redirect("/admin/import?error=Please choose a language.");

  const [language, categoryRow] = await Promise.all([
    prisma.language.findUnique({ where: { id: languageId } }),
    moduleId
      ? prisma.module.findUnique({ where: { id: moduleId } })
      : prisma.module.findFirst({ where: { name: "General Marketplace Literacy" } })
  ]);
  if (!language) redirect("/admin/import?error=Selected language was not found.");
  if (!moduleId && categoryRow) moduleId = categoryRow.id;

  const program = cleanText(formData.get("program")) || PROGRAM_NAME;
  const category = categoryRow?.name || cleanText(formData.get("category")) || "General Marketplace Literacy";
  const resourceType = cleanText(formData.get("resourceType")) || "Video";
  const resourceFormat = normalizeResourceFormat(cleanText(formData.get("resourceFormat")) || "Doodle");
  const fallbackThumbnail = cleanOptional(formData.get("thumbnailUrl")) || language.thumbnailPath || languageThumbnail(language.code);
  const visibilityValue = visibility(formData.get("visibility"));
  const isPublished = visibilityValue === "Published";
  const sourcePlaylistUrl = youtubePlaylistUrl(sourcePlaylistId);

  let totalFound = 0;
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  let nextPageToken: string | undefined;

  do {
    const query = new URLSearchParams({
      part: "snippet,contentDetails",
      playlistId: sourcePlaylistId,
      maxResults: "50",
      key: apiKey
    });
    if (nextPageToken) query.set("pageToken", nextPageToken);
    const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${query.toString()}`, {
      cache: "no-store"
    });
    const payload = (await response.json()) as YouTubePlaylistResponse;
    if (!response.ok) {
      const message = payload.error?.message || "YouTube playlist import failed.";
      redirect(`/admin/import?error=${encodeURIComponent(message)}`);
    }

    const items = payload.items ?? [];
    totalFound += items.length;
    const pageVideoIds = items
      .map((item) => item.contentDetails?.videoId || item.snippet?.resourceId?.videoId)
      .filter((id): id is string => Boolean(id));
    const existingVideos = pageVideoIds.length
      ? await prisma.video.findMany({
          where: { youtubeVideoId: { in: pageVideoIds }, languageId, resourceFormat, category }
        })
      : [];
    const existingByYoutubeId = new Map(existingVideos.map((video) => [video.youtubeVideoId, video]));

    for (const item of items) {
      const youtubeVideoId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
      const rawTitle = cleanText(item.snippet?.title);
      const title = rawTitle && !["Deleted video", "Private video"].includes(rawTitle) ? rawTitle : "";
      if (!youtubeVideoId || !title) {
        errors++;
        continue;
      }
      const orderIndex = typeof item.snippet?.position === "number" ? item.snippet.position + 1 : totalFound;
      const existing = existingByYoutubeId.get(youtubeVideoId);
      const data = {
        title,
        resourceTitle: title,
        description: cleanOptional(item.snippet?.description) || `Imported from YouTube playlist ${sourcePlaylistId}.`,
        youtubeUrl: youtubeWatchUrl(youtubeVideoId),
        youtubeVideoId,
        embedUrl: youtubeEmbedUrl(youtubeVideoId),
        sourcePlaylistId,
        sourcePlaylistUrl,
        thumbnailUrl: fallbackThumbnail,
        program,
        category,
        resourceType,
        resourceFormat: normalizeResourceFormat(resourceFormat),
        orderIndex,
        isPublished,
        languageId,
        moduleId,
        region: cleanText(formData.get("region")) || "Global",
        audience: cleanText(formData.get("audience")) || "Trainers",
        tags: `${language.name}, ${category}, ${resourceFormat}`,
        visibility: visibilityValue
      };
      const savedVideo = existing
        ? await prisma.video.update({ where: { id: existing.id }, data })
        : await prisma.video.create({ data });
      if (existing) {
        updated++;
        skipped++;
      } else {
        imported++;
      }
      existingByYoutubeId.set(savedVideo.youtubeVideoId, savedVideo);
    }
    nextPageToken = payload.nextPageToken;
  } while (nextPageToken);

  revalidatePath("/");
  revalidatePath("/admin/videos");
  const summary = new URLSearchParams({
    success: `Playlist import complete. Found: ${totalFound}. Imported: ${imported}. Updated duplicates: ${updated}. Skipped duplicates: ${skipped}. Errors: ${errors}.`
  });
  redirect(`/admin/import?${summary.toString()}`);
}

export async function upsertHomepageSectionAction(formData: FormData) {
  await guard();
  const id = cleanOptional(formData.get("id"));
  const data = {
    title: cleanText(formData.get("title")),
    description: cleanOptional(formData.get("description")),
    filterLanguageId: cleanOptional(formData.get("filterLanguageId")),
    filterModuleId: cleanOptional(formData.get("filterModuleId")),
    layout: cleanText(formData.get("layout")) === "grid" ? "grid" : "row",
    sortOrder: Number(cleanText(formData.get("sortOrder")) || 0),
    visibility: visibility(formData.get("visibility"))
  };
  if (!data.title) redirect("/admin/homepage?error=Section title is required");
  const playlistIds = formData.getAll("playlistIds").map(String).filter(Boolean);
  const section = id ? await prisma.homepageSection.update({ where: { id }, data }) : await prisma.homepageSection.create({ data });
  await prisma.homepageSectionPlaylist.deleteMany({ where: { homepageSectionId: section.id } });
  for (let i = 0; i < playlistIds.length; i++) {
    await prisma.homepageSectionPlaylist.create({ data: { homepageSectionId: section.id, playlistId: playlistIds[i], sortOrder: i + 1 } });
  }
  revalidatePath("/");
  redirect("/admin/homepage?success=Homepage section saved");
}

export async function deleteHomepageSectionAction(formData: FormData) {
  await guard();
  await prisma.homepageSection.delete({ where: { id: cleanText(formData.get("id")) } });
  revalidatePath("/");
  redirect("/admin/homepage?success=Homepage section deleted");
}

export async function updateSettingsAction(formData: FormData) {
  await guard();
  const logoPath = await saveUploadedImage(formData.get("logoFile") as File | null, "logo");
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {
      siteTitle: cleanText(formData.get("siteTitle")),
      siteDescription: cleanText(formData.get("siteDescription")),
      ...(logoPath ? { logoPath } : {}),
      primaryColor: cleanText(formData.get("primaryColor")) || "#7f1d1d",
      secondaryColor: cleanText(formData.get("secondaryColor")) || "#1d4ed8",
      contactEmail: cleanText(formData.get("contactEmail")),
      websiteUrl: cleanText(formData.get("websiteUrl")),
      youtubeChannelUrl: cleanText(formData.get("youtubeChannelUrl")),
      supportUrl: cleanOptional(formData.get("supportUrl")),
      footerText: cleanText(formData.get("footerText"))
    },
    create: {
      siteTitle: cleanText(formData.get("siteTitle")),
      siteDescription: cleanText(formData.get("siteDescription")),
      logoPath,
      primaryColor: cleanText(formData.get("primaryColor")) || "#7f1d1d",
      secondaryColor: cleanText(formData.get("secondaryColor")) || "#1d4ed8",
      contactEmail: cleanText(formData.get("contactEmail")),
      websiteUrl: cleanText(formData.get("websiteUrl")),
      youtubeChannelUrl: cleanText(formData.get("youtubeChannelUrl")),
      supportUrl: cleanOptional(formData.get("supportUrl")),
      footerText: cleanText(formData.get("footerText"))
    }
  });
  revalidatePath("/");
  redirect("/admin/settings?success=Settings saved");
}
