import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';
import { createRagPipeline, Evidence } from './ragPipeline';

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '').split(',').filter(Boolean);

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('GEMINI_API_KEY is not defined. The RAG pipeline will not be available.');
}

const pipelinePromise = (async () => {
  if (!apiKey) {
    throw new Error('Gemini API key is missing.');
  }
  return createRagPipeline(apiKey);
})();

const app = express();
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, origin);
      return;
    }
    callback(new Error('Origin not allowed by CORS policy'));
  },
  credentials: true,
}));
app.use(express.json());

function sendEvent(res: Response, event: string, payload: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

app.post('/api/chat', async (req: Request, res: Response) => {
  const { question, sessionId } = req.body ?? {};

  if (typeof question !== 'string' || question.trim().length === 0) {
    res.status(400).json({ error: '질문이 필요합니다.' });
    return;
  }

  let pipeline;
  try {
    pipeline = await pipelinePromise;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'RAG 파이프라인을 초기화할 수 없습니다.';
    res.status(500).json({ error: message });
    return;
  }

  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  console.info('[chat] session=%s question="%s"', sessionId ?? 'anonymous', question);

  await pipeline.streamAnswer(question, {
    onChunk: (chunkText: string) => {
      sendEvent(res, 'answer', { text: chunkText });
    },
    onComplete: (fullText: string, evidences: Evidence[]) => {
      sendEvent(res, 'complete', { text: fullText, evidences });
      sendEvent(res, 'end', {});
      res.end();
    },
    onError: (error: Error) => {
      console.error('[chat] error', error);
      sendEvent(res, 'error', { message: error.message });
      res.end();
    },
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`RAG server is running on port ${PORT}`);
  });
}

export default app;
