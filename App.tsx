import React, { useState, useCallback, useRef } from 'react';
import ChatInterface from './components/ChatInterface';
import { ChatMessage } from './types';
import { geminiRagClient } from './services/geminiService';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      text: '안녕하세요! 저는 보육 교사님들을 위한 AI 멘토입니다. 관찰일지 작성법, 상호작용 방법 등 궁금한 점을 무엇이든 물어보세요.',
      sender: 'ai',
      feedback: null,
      isComplete: true,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session-${crypto.randomUUID?.() ?? Date.now().toString(36)}`);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) {
        return;
      }

      abortControllerRef.current?.abort();

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        text: trimmed,
        sender: 'user',
        isComplete: true,
      };

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        text: '',
        sender: 'ai',
        feedback: null,
        sources: [],
        isComplete: false,
      };

      setMessages((prev) => [...prev, userMessage, aiMessage]);
      setIsLoading(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      let accumulated = '';

      const finalizeMessage = (update: Partial<ChatMessage>) => {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === aiMessage.id ? { ...msg, ...update } : msg))
        );
      };

      try {
        await geminiRagClient.streamRagResponse({
          question: trimmed,
          sessionId,
          signal: controller.signal,
          callbacks: {
            onChunk: (chunk) => {
              accumulated += chunk;
              finalizeMessage({ text: accumulated });
            },
            onComplete: ({ text: fullText, evidences }) => {
              const finalText = fullText || accumulated || '답변을 생성하지 못했습니다.';
              finalizeMessage({
                text: finalText,
                sources: evidences,
                isComplete: true,
              });
              setIsLoading(false);
              abortControllerRef.current = null;
            },
            onError: (message) => {
              finalizeMessage({
                text: message,
                isComplete: true,
              });
              setIsLoading(false);
              abortControllerRef.current = null;
            },
          },
        });
      } catch (error) {
        console.error('Error streaming AI response:', error);
        finalizeMessage({
          text: '죄송합니다. 답변을 생성하는 중에 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
          isComplete: true,
        });
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [isLoading, sessionId]
  );

  const handleFeedback = useCallback((id: string, feedback: 'positive' | 'negative') => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === id ? { ...msg, feedback: msg.feedback === feedback ? null : feedback } : msg
      )
    );
  }, []);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch((err) => {
      console.error('Failed to copy text: ', err);
    });
  }, []);

  return (
    <div className="h-screen w-screen font-sans">
      <ChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        onFeedback={handleFeedback}
        onCopy={handleCopy}
        isLoading={isLoading}
      />
    </div>
  );
};

export default App;
