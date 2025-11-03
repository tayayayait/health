import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { KnowledgeDocument } from './knowledgeBase';
import { VectorStore, createVectorStore } from './vectorStore';

const GENERATION_MODEL = 'gemini-2.5-flash';

export interface Evidence {
  id: string;
  title: string;
  citation: string;
  uri?: string;
  snippet: string;
}

export interface RagStreamCallbacks {
  onChunk: (chunkText: string) => void;
  onComplete: (fullText: string, evidences: Evidence[]) => void;
  onError: (error: Error) => void;
}

export class RagPipeline {
  private vectorStore?: VectorStore;

  constructor(private readonly client: GoogleGenAI) {}

  private async ensureVectorStore(): Promise<VectorStore> {
    if (!this.vectorStore) {
      this.vectorStore = await createVectorStore(this.client);
    }
    return this.vectorStore;
  }

  private buildPrompt(question: string, documents: KnowledgeDocument[]): string {
    const context = documents
      .map((doc, index) => `근거 ${index + 1}: ${doc.title}\n- 인용: ${doc.citation}\n- 내용: ${doc.content}`)
      .join('\n\n');

    return [
      '당신은 대한민국 보육 교사를 돕는 전문 AI 멘토입니다.',
      '아래 제공된 근거를 활용하여 질문에 답변하세요.',
      '근거에 없는 내용은 추측하지 말고 부족함을 인정하세요.',
      '친절하고 실천 가능한 조언을 한국어로 작성하세요.',
      '',
      '[근거]',
      context || '관련 근거가 없습니다. 필요한 경우 답변을 제한하세요.',
      '',
      `[질문] ${question}`,
    ].join('\n');
  }

  private toEvidence(documents: KnowledgeDocument[]): Evidence[] {
    return documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      citation: doc.citation,
      uri: doc.uri,
      snippet: doc.content.length > 220 ? `${doc.content.slice(0, 217)}...` : doc.content,
    }));
  }

  async streamAnswer(question: string, callbacks: RagStreamCallbacks): Promise<void> {
    try {
      const store = await this.ensureVectorStore();
      const topDocuments = await store.search(question, 3);
      const prompt = this.buildPrompt(question, topDocuments);

      const responseStream = await this.client.models.generateContentStream({
        model: GENERATION_MODEL,
        contents: [prompt],
        config: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      });

      let accumulated = '';
      for await (const chunk of responseStream as AsyncIterable<GenerateContentResponse>) {
        const text = chunk.text ?? '';
        if (text.length === 0) {
          continue;
        }
        accumulated += text;
        callbacks.onChunk(text);
      }

      callbacks.onComplete(accumulated, this.toEvidence(topDocuments));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      callbacks.onError(err);
    }
  }
}

export function createRagPipeline(apiKey: string): RagPipeline {
  const client = new GoogleGenAI({ apiKey });
  return new RagPipeline(client);
}
