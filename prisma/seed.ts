import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PROGRAM_NAME, languageThumbnails, resourceCategories, resourceLanguages, slugify, youtubeStylePlaylists, youtubeStyleShelves } from "../src/lib/resource-taxonomy";

const prisma = new PrismaClient();

const sampleVideoIds = ["ysz5S6PUM-U", "ScMzIvxBSi4", "aqz-KE-bpKQ", "jNQXAC9IVRw", "dQw4w9WgXcQ"];

function videoId(index: number) {
  return sampleVideoIds[index % sampleVideoIds.length];
}

async function main() {
  await prisma.homepageSectionPlaylist.deleteMany();
  await prisma.playlistVideo.deleteMany();
  await prisma.homepageSection.deleteMany();
  await prisma.video.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.module.deleteMany();
  await prisma.language.deleteMany();

  await prisma.user.upsert({
    where: { email: "admin@marketplaceliteracy.org" },
    update: {},
    create: {
      name: "MLP Admin",
      email: "admin@marketplaceliteracy.org",
      passwordHash: await bcrypt.hash("ChangeMe123!", 12),
      role: "admin"
    }
  });

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {
      siteTitle: "MLP Video Library",
      siteDescription: "A facilitator resource library for organized Marketplace Literacy videos, scripts, prompts, and training materials by language and category.",
      primaryColor: "#A64026",
      secondaryColor: "#624237",
      youtubeChannelUrl: "https://www.youtube.com/@marketplaceliteracy",
      footerText: "The Marketplace Literacy Project supports educators, facilitators, and learning programs with practical resources for subsistence marketplaces."
    },
    create: {
      siteTitle: "MLP Video Library",
      siteDescription: "A facilitator resource library for organized Marketplace Literacy videos, scripts, prompts, and training materials by language and category.",
      primaryColor: "#A64026",
      secondaryColor: "#624237",
      youtubeChannelUrl: "https://www.youtube.com/@marketplaceliteracy",
      footerText: "The Marketplace Literacy Project supports educators, facilitators, and learning programs with practical resources for subsistence marketplaces."
    }
  });

  const languages = new Map<string, { id: string; thumbnailPath: string }>();
  for (let i = 0; i < resourceLanguages.length; i++) {
    const seed = resourceLanguages[i];
    const language = await prisma.language.create({
      data: {
        name: seed.name,
        displayName: seed.displayName,
        code: seed.code,
        color: seed.color,
        thumbnailPath: languageThumbnails[seed.code],
        sortOrder: i + 1,
        isActive: true
      }
    });
    languages.set(seed.name, { id: language.id, thumbnailPath: language.thumbnailPath ?? "" });
  }

  const modules = new Map<string, string>();
  for (let i = 0; i < resourceCategories.length; i++) {
    const category = resourceCategories[i];
    const categoryRow = await prisma.module.create({
      data: {
        name: category.name,
        description: category.description,
        color: i === 0 ? "#FBEAEA" : "#F3E8E6",
        sortOrder: i + 1,
        isActive: true
      }
    });
    modules.set(category.name, categoryRow.id);
  }

  for (let shelfIndex = 0; shelfIndex < youtubeStyleShelves.length; shelfIndex++) {
    const shelf = youtubeStyleShelves[shelfIndex];
    const languageInfo = languages.get(shelf.language);
    if (!languageInfo) continue;
    await prisma.homepageSection.create({
      data: {
        title: shelf.title,
        description: `Marketplace Literacy playlists in ${shelf.language}.`,
        filterLanguageId: languageInfo.id,
        layout: "row",
        sortOrder: shelfIndex + 1,
        visibility: "Published"
      }
    });
  }

  for (let playlistIndex = 0; playlistIndex < youtubeStylePlaylists.length; playlistIndex++) {
    const item = youtubeStylePlaylists[playlistIndex];
    const languageInfo = languages.get(item.language);
    if (!languageInfo) continue;
    const playlist = await prisma.playlist.create({
      data: {
        title: item.title,
        shortTitle: item.title,
        description: `YouTube-style playlist shelf item for ${item.language}. Replace sample videos with the exact YouTube playlist videos when ready.`,
        thumbnailUrl: languageInfo.thumbnailPath,
        languageId: languageInfo.id,
        moduleId: modules.get("General Marketplace Literacy"),
        region: "Global",
        audience: "General",
        tags: `${item.language}, ${item.shelf}, Playlist`,
        visibility: "Public",
        featured: true,
        sortOrder: playlistIndex + 1
      }
    });
    for (let i = 0; i < 3; i++) {
      const id = videoId(playlistIndex + i);
      const title = `${item.title} - Video ${i + 1}`;
      const video = await prisma.video.create({
        data: {
          title,
          resourceTitle: title,
          description: `Video placeholder for ${item.title}.`,
          youtubeUrl: `https://www.youtube.com/watch?v=${id}`,
          youtubeVideoId: id,
          embedUrl: `https://www.youtube.com/embed/${id}`,
          thumbnailUrl: languageInfo.thumbnailPath,
          program: PROGRAM_NAME,
          category: "Playlist",
          resourceType: "Video",
          resourceFormat: "Online",
          orderIndex: i + 1,
          isPublished: true,
          languageId: languageInfo.id,
          moduleId: modules.get("General Marketplace Literacy"),
          region: "Global",
          audience: "General",
          tags: `${slugify(item.title)}, ${item.language}`,
          duration: "08:45",
          visibility: "Published"
        }
      });
      await prisma.playlistVideo.create({ data: { playlistId: playlist.id, videoId: video.id, sortOrder: i + 1 } });
    }
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
