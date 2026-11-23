import { Injectable, OnModuleInit } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import OpenAI from 'openai';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export type RagHit = {
  title: string;
  snippet: string;
  sourceKey: string;
  score: number;
};

@Injectable()
export class RagService implements OnModuleInit {
  private qdrant: QdrantClient;
  private openai: OpenAI | null;
  private collection = process.env.QDRANT_COLLECTION || 'brightpath_knowledge';

  constructor(private prisma: PrismaService) {
    this.qdrant = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
    });
    this.openai = process.env.OPENAI_API_KEY
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;
  }

  async ensureCollection() {
    const collections = await this.qdrant.getCollections();
    const exists = collections.collections.some((c) => c.name === this.collection);
    if (!exists) {
      await this.qdrant.createCollection(this.collection, {
        vectors: { size: 1536, distance: 'Cosine' },
      });
    }
  }

  async onModuleInit() {
    try {
      await this.ensureCollection();
    } catch {
      // Qdrant may be unavailable during tests
    }
  }

  chunkText(text: string, chunkSize = 600, overlap = 80): string[] {
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
      chunks.push(text.slice(i, i + chunkSize));
      i += chunkSize - overlap;
    }
    return chunks.filter((c) => c.trim().length > 0);
  }

  async embed(text: string): Promise<number[]> {
    if (!this.openai) {
      const hash = createHash('sha256').update(text).digest();
      const vec: number[] = [];
      for (let i = 0; i < 1536; i++) {
        vec.push((hash[i % hash.length] / 255) * 2 - 1);
      }
      return vec;
    }
    const res = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return res.data[0].embedding;
  }

  async ingestDocument(input: {
    sourceKey: string;
    title: string;
    content: string;
    courseId?: string;
  }) {
    const chunks = this.chunkText(input.content);
    const points = [];
    for (let idx = 0; idx < chunks.length; idx++) {
      const vector = await this.embed(chunks[idx]);
      points.push({
        id: randomUUID(),
        vector,
        payload: {
          sourceKey: input.sourceKey,
          title: input.title,
          courseId: input.courseId ?? null,
          chunkIndex: idx,
          text: chunks[idx],
        },
      });
    }
    try {
      await this.ensureCollection();
      await this.qdrant.upsert(this.collection, { wait: true, points });
    } catch (err) {
      console.warn('Qdrant ingest skipped:', err instanceof Error ? err.message : err);
    }
    await this.prisma.knowledgeSource.upsert({
      where: { sourceKey: input.sourceKey },
      create: {
        sourceKey: input.sourceKey,
        title: input.title,
        chunkCount: chunks.length,
        status: 'published',
      },
      update: {
        title: input.title,
        chunkCount: chunks.length,
        version: { increment: 1 },
      },
    });
    return { sourceKey: input.sourceKey, chunks: chunks.length };
  }

  async search(query: string, courseIds: string[]): Promise<RagHit[]> {
    try {
      const vector = await this.embed(query);
      const results = await this.qdrant.search(this.collection, {
        vector,
        limit: 8,
        filter:
          courseIds.length > 0
            ? {
                should: courseIds.map((courseId) => ({
                  key: 'courseId',
                  match: { value: courseId },
                })),
              }
            : undefined,
      });
      const scoped = results.filter((r) => {
        const cid = r.payload?.courseId;
        if (cid == null || cid === '') return true;
        return courseIds.length === 0 || courseIds.includes(String(cid));
      });
      return scoped.slice(0, 5).map((r) => ({
        title: String(r.payload?.title ?? 'Knowledge'),
        snippet: String(r.payload?.text ?? '').slice(0, 400),
        sourceKey: String(r.payload?.sourceKey ?? ''),
        score: r.score ?? 0,
      }));
    } catch {
      const local = await this.prisma.faqDocument.findMany({
        where: {
          OR: [
            { courseId: { in: courseIds } },
            { courseId: null },
          ],
        },
        take: 3,
      });
      return local.map((doc) => ({
        title: doc.title,
        snippet: doc.content.slice(0, 400),
        sourceKey: doc.sourceKey,
        score: 0.5,
      }));
    }
  }
}