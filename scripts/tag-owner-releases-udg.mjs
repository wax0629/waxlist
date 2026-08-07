#!/usr/bin/env node
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const releases = await prisma.release.findMany({
    where: {
      status: "published",
      OR: [
        { source: "owner" },
        {
          recommendations: {
            some: { status: "published", user: { role: "owner" } },
          },
        },
      ],
    },
    select: { id: true, tags: true },
  });

  let updated = 0;
  for (const release of releases) {
    const hasUdg = release.tags.some(
      (tag) => tag.trim().toLocaleLowerCase() === "udg",
    );
    if (hasUdg) continue;
    await prisma.release.update({
      where: { id: release.id },
      data: { tags: [...release.tags, "UDG"] },
    });
    updated += 1;
  }

  console.log(
    `UDG backfill complete: matched=${releases.length} updated=${updated}`,
  );
} finally {
  await prisma.$disconnect();
}
