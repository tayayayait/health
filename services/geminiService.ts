export interface ModulePayload {
  id?: string;
  name?: string;
  focusArea?: string;
  description?: string;
}

export interface ScenarioPayload {
  id?: string;
  title?: string;
  summary?: string;
}

export interface DifficultyPayload {
  id?: string;
  label?: string;
  description?: string;
}

export interface StagePayload {
  id: string;
  label: string;
  description?: string;
}

export interface ChatContextPayload {
  module?: ModulePayload;
  scenario?: ScenarioPayload;
  difficulty?: DifficultyPayload | null;
  stage?: StagePayload;
  rubrics?: string[];
  progressSummary?: string;
}

export interface ChatRequestPayload {
  message: string;
  context: ChatContextPayload;
}

export type ChatStreamEvent =
  | { type: 'chunk'; text: string }
  | { type: 'done'; text: string; citations: string[] }
  | { type: 'error'; message: string };

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_CHAT_API_BASE_URL) || '';

const buildUrl = (path: string) => {
  if (!API_BASE_URL) {
    return path;
  }
  return `${API_BASE_URL.replace(/\/$/, '')}${path}`;
};

const parseEvent = (rawEvent: string): ChatStreamEvent | null => {
  const dataLines = rawEvent
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.replace(/^data:\s*/, '').trim())
    .filter(Boolean);

  if (!dataLines.length) {
    return null;
  }

  try {
    const payload = dataLines.join('');
    return JSON.parse(payload) as ChatStreamEvent;
  } catch (error) {
    console.warn('Failed to parse SSE payload', error);
    return null;
  }
};

export async function* streamChatCompletion(
  request: ChatRequestPayload,
  init?: { signal?: AbortSignal },
): AsyncGenerator<ChatStreamEvent> {
  const response = await fetch(buildUrl('/api/chat'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(request),
    signal: init?.signal,
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    yield {
      type: 'error',
      message: errorMessage || 'AI 서버 호출에 실패했습니다.',
    };
    return;
  }

  if (!response.body) {
    yield {
      type: 'error',
      message: 'AI 서버의 스트리밍 응답을 읽을 수 없습니다.',
    };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        buffer += decoder.decode();
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        const rawEvent = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const parsed = parseEvent(rawEvent);
        if (parsed) {
          yield parsed;
        }
        boundary = buffer.indexOf('\n\n');
      }
    }

    if (buffer.trim()) {
      const parsed = parseEvent(buffer);
      if (parsed) {
        yield parsed;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
