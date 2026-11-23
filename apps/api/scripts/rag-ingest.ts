import { PrismaClient } from '@prisma/client';
import { RagService } from '../src/rag/rag.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function main() {
  const prisma = new PrismaClient();
  const prismaService = new PrismaService();
  await prismaService.$connect();
  const rag = new RagService(prismaService);

  const docs = await prisma.faqDocument.findMany();
  for (const doc of docs) {
    const result = await rag.ingestDocument({
      sourceKey: doc.sourceKey,
      title: doc.title,
      content: doc.content,
      courseId: doc.courseId ?? undefined,
    });
    console.log('Ingested', result);
  }

  await prisma.$disconnect();
  await prismaService.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});