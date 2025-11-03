import 'dotenv/config';
import cors from 'cors';
import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { retrieveRelevantDocuments } from './rag/retrieval';

interface ModuleContext {
  id?: string;
  name?: string;
  focusArea?: string;
  description?: string;
}

interface ScenarioContext {
  id?: string;
  title?: string;
  summary?: string;
}

interface StageContext {
  id: string;
  label: string;
  description?: string;
}

interface ChatRequestBody {
  message?: string;
  context?: {
    module?: ModuleContext;
    scenario?: ScenarioContext;
    stage?: StageContext;
    difficulty?: {
      id?: string;
      label?: string;
      description?: string;
    } | null;
    rubrics?: string[];
    progressSummary?: string;
  };
}

type ChatStreamEvent =
  | { type: 'chunk'; text: string }
  | { type: 'done'; text: string; citations: string[] }
  | { type: 'error'; message: string };

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

const port = Number(process.env.PORT ?? 8787);

const initSse = (res: Response) => {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  const anyRes = res as Response & { flushHeaders?: () => void };
  if (anyRes.flushHeaders) {
    anyRes.flushHeaders();
  }
  res.write(': connected\n\n');
  return (event: ChatStreamEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };
};

const buildContextLines = (bodyContext: ChatRequestBody['context']): string[] => {
  if (!bodyContext) {
    return [];
  }
  const lines: string[] = [];
  if (bodyContext.module?.name) {
    lines.push(`모듈: ${bodyContext.module.name} (${bodyContext.module.focusArea ?? '초점 미지정'})`);
    if (bodyContext.module.description) {
      lines.push(`모듈 설명: ${bodyContext.module.description}`);
    }
  }
  if (bodyContext.scenario?.title) {
    lines.push(`시나리오: ${bodyContext.scenario.title}`);
    if (bodyContext.scenario.summary) {
      lines.push(`시나리오 개요: ${bodyContext.scenario.summary}`);
    }
  }
  if (bodyContext.difficulty?.label) {
    lines.push(
      `난이도: ${bodyContext.difficulty.label}${bodyContext.difficulty.description ? ` - ${bodyContext.difficulty.description}` : ''}`,
    );
  }
  if (bodyContext.stage) {
    lines.push(`학습 단계: ${bodyContext.stage.label}${bodyContext.stage.description ? ` - ${bodyContext.stage.description}` : ''}`);
  }
  if (bodyContext.rubrics?.length) {
    lines.push(`평가 루브릭 강조: ${bodyContext.rubrics.join(', ')}`);
  }
  if (bodyContext.progressSummary) {
    lines.push(`학습 진행 요약: ${bodyContext.progressSummary}`);
  }
  return lines;
};

app.post('/api/chat', async (req: Request<unknown, unknown, ChatRequestBody>, res: Response) => {
  const sendEvent = initSse(res);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    sendEvent({ type: 'error', message: '서버에 Gemini API 키가 설정되어 있지 않습니다.' });
    return res.end();
  }

  const { message, context } = req.body ?? {};
  if (!message || !message.trim()) {
    sendEvent({ type: 'error', message: '질문이 비어 있습니다. 질문을 입력해 주세요.' });
    return res.end();
  }

  try {
    const contextLines = buildContextLines(context);
    const focusHints = [
      context?.module?.focusArea ?? '',
      context?.stage?.label ?? '',
      ...(context?.rubrics ?? []),
    ].filter(Boolean);
    const retrieved = retrieveRelevantDocuments(message, focusHints, 3);

    const evidenceText = retrieved.length
      ? retrieved
          .map(
            (doc, index) =>
              `출처 ${index + 1}: ${doc.title}\n요약: ${doc.summary}\n핵심 내용: ${doc.content}`,
          )
          .join('\n\n')
      : '관련 근거 자료를 찾지 못했습니다. 전문 지식과 윤리 기준에 따라 신중하게 답변하세요.';

    const promptSegments: string[] = [];
    if (contextLines.length) {
      promptSegments.push('훈련 컨텍스트:', ...contextLines);
    }
    promptSegments.push('근거 자료:', evidenceText, `사용자 질문: ${message}`);
    const prompt = promptSegments.join('\n\n');

    const systemInstructionParts = [
      '당신은 대한민국 상위 0.1% 보육교사 연수생을 지원하는 AI 멘토입니다.',
      '모든 답변은 한국어로 하며, 과학적 근거와 보육 정책을 기반으로 한 실행 가능한 전략을 제시하세요.',
      '응답에는 제시된 근거 자료를 인용하여 [출처1], [출처2]와 같은 형식으로 명시하고, 근거가 없으면 신중하게 응답을 보류하세요.',
      '질문이 보육 및 영유아 교육과 무관하면 정중하게 답변을 거절하세요.',
    ];
    if (context?.stage?.description) {
      systemInstructionParts.push(`현재 학습 단계의 목표: ${context.stage.description}`);
    }
    if (context?.rubrics?.length) {
      systemInstructionParts.push(`평가 루브릭 관점: ${context.rubrics.join(', ')}`);
    }

    const ai = new GoogleGenAI({ apiKey });
    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      config: {
        systemInstruction: systemInstructionParts.join('\n'),
      },
    });

    let fullText = '';
    for await (const chunk of stream) {
      const chunkText = chunk.text ?? '';
      if (!chunkText) {
        continue;
      }
      fullText += chunkText;
      sendEvent({ type: 'chunk', text: chunkText });
    }

    const citations = retrieved.map((doc, index) => `[출처${index + 1}] ${doc.citation}`);
    sendEvent({ type: 'done', text: fullText, citations });
  } catch (error) {
    console.error('Gemini proxy error', error);
    sendEvent({ type: 'error', message: 'AI 응답을 생성하는 중 문제가 발생했습니다.' });
  } finally {
    res.end();
  }
});

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Gemini proxy server listening on port ${port}`);
});
