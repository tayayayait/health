import type { GroundingEvidence } from '../types';

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onComplete: (payload: { text: string; evidences: GroundingEvidence[] }) => void;
  onError: (message: string) => void;
}

export interface StreamRagResponseParams {
  question: string;
  sessionId?: string;
  signal?: AbortSignal;
  callbacks: StreamCallbacks;
}

function parseEventBlock(block: string): { event: string; data: string } | null {
  const lines = block.split('\n');
  let event = 'message';
  const dataLines: string[] = [];
  lines.forEach((line) => {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim());
    }
  });

  if (dataLines.length === 0) {
    return null;
  }

  return { event, data: dataLines.join('') };
}

async function readEventStream(response: Response, callbacks: StreamCallbacks, abortController: AbortController) {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('스트리밍 응답을 읽을 수 없습니다.');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let isCompleted = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });

    let separatorIndex = buffer.indexOf('\n\n');
    while (separatorIndex !== -1) {
      const rawEvent = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);
      const parsed = parseEventBlock(rawEvent.trim());
      if (parsed) {
        try {
          const payload = parsed.data ? JSON.parse(parsed.data) : {};
          switch (parsed.event) {
            case 'answer':
              if (typeof payload.text === 'string') {
                callbacks.onChunk(payload.text);
              }
              break;
            case 'complete':
              callbacks.onComplete({
                text: typeof payload.text === 'string' ? payload.text : '',
                evidences: Array.isArray(payload.evidences) ? payload.evidences : [],
              });
              isCompleted = true;
              break;
            case 'error':
              callbacks.onError(typeof payload.message === 'string' ? payload.message : '알 수 없는 오류가 발생했습니다.');
              abortController.abort();
              return;
            case 'end':
              if (!isCompleted) {
                callbacks.onComplete({ text: '', evidences: [] });
              }
              abortController.abort();
              return;
            default:
              break;
          }
        } catch (error) {
          console.warn('이벤트 스트림을 파싱하는 중 오류가 발생했습니다.', error);
        }
      }
      separatorIndex = buffer.indexOf('\n\n');
    }
  }
}

export const geminiRagClient = {
  async streamRagResponse({ question, sessionId, signal, callbacks }: StreamRagResponseParams): Promise<void> {
    const controller = new AbortController();
    if (signal) {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, sessionId }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorMessage = '답변을 가져오는 중 오류가 발생했습니다.';
      try {
        const body = await response.json();
        if (body?.error) {
          errorMessage = body.error;
        }
      } catch (error) {
        console.warn('오류 응답 본문을 파싱하지 못했습니다.', error);
      }
      callbacks.onError(errorMessage);
      return;
    }

    await readEventStream(response, callbacks, controller);
  },
};
