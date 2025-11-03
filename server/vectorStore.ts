import { GoogleGenAI } from '@google/genai';
import { KNOWLEDGE_BASE, KnowledgeDocument } from './knowledgeBase';

export interface RetrievedDocument extends KnowledgeDocument {
  embedding: number[];
}

const DEFAULT_EMBEDDING_MODEL = 'text-embedding-004';

function cosineSimilarity(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < length; i += 1) {
    const valueA = a[i];
    const valueB = b[i];
    dot += valueA * valueB;
    normA += valueA * valueA;
    normB += valueB * valueB;
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class VectorStore {
  private documents: RetrievedDocument[] = [];

  constructor(private readonly client: GoogleGenAI) {}

  async initialize(): Promise<void> {
    const embeddings = await this.client.models.embedContent({
      model: DEFAULT_EMBEDDING_MODEL,
      contents: KNOWLEDGE_BASE.map((doc) => doc.content),
    });

    const vectors = embeddings.embeddings?.map((item) => item.values ?? []) ?? [];
    this.documents = KNOWLEDGE_BASE.map((doc, index) => ({
      ...doc,
      embedding: vectors[index] ?? [],
    }));
  }

  async search(query: string, topK = 3): Promise<KnowledgeDocument[]> {
    const response = await this.client.models.embedContent({
      model: DEFAULT_EMBEDDING_MODEL,
      contents: [query],
    });

    const queryVector = response.embeddings?.[0]?.values ?? [];
    const scored = this.documents
      .map((doc) => ({
        doc,
        score: cosineSimilarity(queryVector, doc.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((item) => item.doc);

    return scored;
  }
}

export async function createVectorStore(client: GoogleGenAI): Promise<VectorStore> {
  const store = new VectorStore(client);
  await store.initialize();
  return store;
}
