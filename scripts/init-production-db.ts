import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  PROGRAM_NAME,
  languageThumbnails,
  resourceCategories,
  resourceFormats,
  resourceLanguages,
  slugify
} from "../src/lib/resource-taxonomy";

function normalizeDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const directUrl = process.env.DIRECT_URL?.trim();
  const isPostgresUrl = (value?: string) => value?.startsWith("postgresql://") || value?.startsWith("postgres://");

  if (databaseUrl && databaseUrl !== process.env.DATABASE_URL) {
    process.env.DATABASE_URL = databaseUrl;
  }

  if (!isPostgresUrl(process.env.DATABASE_URL) && isPostgresUrl(directUrl)) {
    process.env.DATABASE_URL = directUrl;
  }
}

normalizeDatabaseUrl();

const prisma = new PrismaClient();

const sampleVideoIds = ["ysz5S6PUM-U", "ScMzIvxBSi4", "aqz-KE-bpKQ", "jNQXAC9IVRw", "dQw4w9WgXcQ"];

const contentTree: Record<string, string[]> = {
  Introduction: ["Introduction to Marketplace Literacy"],
  "General Marketplace Literacy": [
    "Evolution of Needs",
    "Prioritizing Elements of a Business - Clip 1",
    "Prioritizing Elements of a Business - Clip 2",
    "Prioritizing Elements of a Business - Clip 3",
    "Prioritizing Elements of a Business - Clip 4",
    "Prioritizing Elements of a Business - Clip 5",
    "Physical and Psychological Needs - Clip 1",
    "Physical and Psychological Needs - Clip 2",
    "Types of Customers",
    "Value Chain"
  ],
  "Personal and Professional Aspirations": [
    "Personal Aspirations and Livelihood Goals",
    "Professional Aspirations in the Marketplace",
    "Building Confidence for Marketplace Participation"
  ],
  "Consumer Literacy": ["What Is Value - Clip 1", "What Is Value - Clip 2"],
  "Entrepreneurial Literacy": [
    "Unwrapping a Business",
    "Business Dos and Don'ts",
    "Choosing a Business - Clip 1",
    "Choosing a Business - Clip 2",
    "Choosing a Business - Clip 3",
    "Choosing a Business - Clip 4",
    "Understanding Customers",
    "How to Learn About Customers and Markets - Clip 1",
    "How to Learn About Customers and Markets - Clip 2",
    "What Is Value for Customers",
    "Designing Products",
    "Communicating About Products"
  ],
  "Sustainability Literacy": []
};

function videoId(index: number) {
  return sampleVideoIds[index % sampleVideoIds.length];
}

function formatFor(category: string, index: number) {
  if (category === "Introduction") return "Online";
  if (category === "Consumer Literacy") return "Animations";
  if (category === "Entrepreneurial Literacy") return index % 2 === 0 ? "Doodle" : "Video Scribe";
  return resourceFormats[index % resourceFormats.length];
}

async function ensureDefaults() {
  await prisma.user.upsert({
    where: { email: "admin@marketplaceliteracy.org" },
    update: {},
    create: {
      name: "MLP Admin",
      email: "admin@marketplaceliteracy.org",
      passwordHash: await bcrypt.hash(process.env.INITIAL_ADMIN_PASSWORD || "ChangeMe123!", 12),
      role: "admin"
    }
  });

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      siteTitle: "MLP Video Library",
      siteDescription:
        "A facilitator resource library for organized Marketplace Literacy resources by language, resource format, and category.",
      primaryColor: "#A64026",
      secondaryColor: "#624237",
      youtubeChannelUrl: "https://www.youtube.com/@marketplaceliteracy",
      footerText:
        "The Marketplace Literacy Project supports educators, facilitators, and learning programs with practical resources for subsistence marketplaces."
    }
  });

  for (let i = 0; i < resourceLanguages.length; i++) {
    const language = resourceLanguages[i];
    await prisma.language.upsert({
      where: { name: language.name },
      update: {
        displayName: language.displayName,
        code: language.code,
        color: language.color,
        thumbnailPath: languageThumbnails[language.code],
        sortOrder: i + 1,
        isActive: true
      },
      create: {
        name: language.name,
        displayName: language.displayName,
        code: language.code,
        color: language.color,
        thumbnailPath: languageThumbnails[language.code],
        sortOrder: i + 1,
        isActive: true
      }
    });
  }

  for (let i = 0; i < resourceCategories.length; i++) {
    const category = resourceCategories[i];
    await prisma.module.upsert({
      where: { name: category.name },
      update: {
        description: category.description,
        sortOrder: i + 1,
        isActive: true
      },
      create: {
        name: category.name,
        description: category.description,
        color: i === 0 ? "#FBEAEA" : "#F3E8E6",
        sortOrder: i + 1,
        isActive: true
      }
    });
  }

  await prisma.video.updateMany({ where: { resourceFormat: "Doodle Video" }, data: { resourceFormat: "Doodle" } });
  await prisma.video.updateMany({ where: { resourceFormat: "Image Diary" }, data: { resourceFormat: "Image Diaries" } });
  await prisma.video.updateMany({ where: { resourceFormat: "Animation" }, data: { resourceFormat: "Animations" } });
  await prisma.video.updateMany({ where: { resourceFormat: "VideoScribe" }, data: { resourceFormat: "Video Scribe" } });
  await prisma.video.updateMany({ where: { resourceFormat: "Global" }, data: { resourceFormat: "Online" } });
  await prisma.video.updateMany({ where: { resourceFormat: "Vocations" }, data: { resourceFormat: "Online" } });
}

async function seedStarterResourcesIfEmpty() {
  const existingVideos = await prisma.video.count();
  if (existingVideos > 0) return;

  const languages = await prisma.language.findMany();
  const modules = await prisma.module.findMany();
  const moduleByName = new Map(modules.map((moduleRow) => [moduleRow.name, moduleRow.id]));
  let globalIndex = 0;

  for (const language of languages) {
    for (const category of resourceCategories) {
      const titles = contentTree[category.name] ?? [];
      const playlist = await prisma.playlist.create({
        data: {
          title: `${PROGRAM_NAME} - ${language.name} - ${category.name}`,
          shortTitle: category.name,
          description: `${category.description} These resources are intended for educators and facilitators using Marketplace Literacy in ${language.name}.`,
          thumbnailUrl: language.thumbnailPath,
          languageId: language.id,
          moduleId: moduleByName.get(category.name),
          region: "Global",
          audience: "Trainers",
          tags: `${PROGRAM_NAME}, ${language.name}, ${category.name}, facilitator resources`,
          visibility: "Published",
          featured: category.name !== "Sustainability Literacy",
          sortOrder: resourceCategories.findIndex((item) => item.name === category.name) + 1
        }
      });

      for (let i = 0; i < titles.length; i++) {
        const youtubeVideoId = videoId(globalIndex + i);
        const title = titles[i];
        const format = formatFor(category.name, i);
        const video = await prisma.video.create({
          data: {
            title,
            resourceTitle: title,
            description: `Facilitator resource for ${category.name}. Replace this starter item with the approved ${language.name} resource when ready.`,
            youtubeUrl: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
            youtubeVideoId,
            embedUrl: `https://www.youtube.com/embed/${youtubeVideoId}`,
            thumbnailUrl: language.thumbnailPath,
            program: PROGRAM_NAME,
            category: category.name,
            resourceType: "Video",
            resourceFormat: format,
            transcript: `Starter script notes for ${title}. Replace this sample text with the approved transcript or facilitator script.`,
            orderIndex: i + 1,
            isPublished: true,
            languageId: language.id,
            moduleId: moduleByName.get(category.name),
            region: "Global",
            audience: "Trainers",
            tags: `${slugify(category.name)}, ${language.name}, facilitator, ${PROGRAM_NAME}, ${slugify(format)}`,
            duration: i % 2 === 0 ? "08:45" : "12:10",
            visibility: "Published"
          }
        });
        await prisma.playlistVideo.create({
          data: { playlistId: playlist.id, videoId: video.id, sortOrder: i + 1 }
        });
      }
      globalIndex += titles.length + 1;
    }

    const section = await prisma.homepageSection.create({
      data: {
        title: `${PROGRAM_NAME} - ${language.name}`,
        description: `Educator and facilitator resources in ${language.name}.`,
        filterLanguageId: language.id,
        layout: "row",
        sortOrder: language.sortOrder,
        visibility: "Published"
      }
    });

    const featured = await prisma.playlist.findMany({
      where: { languageId: language.id, featured: true },
      orderBy: { sortOrder: "asc" },
      take: 4
    });

    for (let i = 0; i < featured.length; i++) {
      await prisma.homepageSectionPlaylist.create({
        data: { homepageSectionId: section.id, playlistId: featured[i].id, sortOrder: i + 1 }
      });
    }
  }
}

async function main() {
  await ensureDefaults();
  await seedStarterResourcesIfEmpty();
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
