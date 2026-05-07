import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PROGRAM_NAME, languageThumbnails, resourceCategories, resourceLanguages, slugify } from "../src/lib/resource-taxonomy";

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
  if (category === "Introduction") return "Facilitator Video";
  if (category === "Consumer Literacy") return "Animation";
  if (category === "Entrepreneurial Literacy") return index % 2 === 0 ? "Doodle" : "VideoScribe";
  return index % 3 === 0 ? "Image Diaries" : "Doodle";
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

  let globalIndex = 0;
  for (const language of resourceLanguages) {
    const languageInfo = languages.get(language.name);
    if (!languageInfo) continue;

    for (const category of resourceCategories) {
      const titles = contentTree[category.name] ?? [];
      const playlist = await prisma.playlist.create({
        data: {
          title: `${PROGRAM_NAME} - ${language.name} - ${category.name}`,
          shortTitle: category.name,
          description: `${category.description} These resources are intended for educators and facilitators using Marketplace Literacy in ${language.name}.`,
          thumbnailUrl: languageInfo.thumbnailPath,
          languageId: languageInfo.id,
          moduleId: modules.get(category.name),
          region: "Global",
          audience: "Trainers",
          tags: `${PROGRAM_NAME}, ${language.name}, ${category.name}, facilitator resources`,
          visibility: "Published",
          featured: category.name !== "Sustainability Literacy",
          sortOrder: resourceCategories.findIndex((item) => item.name === category.name) + 1
        }
      });

      for (let i = 0; i < titles.length; i++) {
        const id = videoId(globalIndex + i);
        const title = titles[i];
        const video = await prisma.video.create({
          data: {
            title,
            resourceTitle: title,
            description: `Facilitator resource for ${category.name}. Use this item to support group discussion, examples, and program delivery in ${language.name}.`,
            youtubeUrl: `https://www.youtube.com/watch?v=${id}`,
            youtubeVideoId: id,
            embedUrl: `https://www.youtube.com/embed/${id}`,
            thumbnailUrl: languageInfo.thumbnailPath,
            program: PROGRAM_NAME,
            category: category.name,
            resourceType: "Video",
            resourceFormat: formatFor(category.name, i),
            transcript: `Script notes for ${title}. Replace this sample text with the approved ${language.name} transcript or facilitator script when available.`,
            orderIndex: i + 1,
            isPublished: true,
            languageId: languageInfo.id,
            moduleId: modules.get(category.name),
            region: "Global",
            audience: "Trainers",
            tags: `${slugify(category.name)}, ${language.name}, facilitator, ${PROGRAM_NAME}`,
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
        filterLanguageId: languageInfo.id,
        layout: "row",
        sortOrder: resourceLanguages.findIndex((item) => item.name === language.name) + 1,
        visibility: "Published"
      }
    });

    const featured = await prisma.playlist.findMany({
      where: { languageId: languageInfo.id, featured: true },
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

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
