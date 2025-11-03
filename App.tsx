
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import { ChatMessage } from './types';
import { GoogleGenAI, Chat } from "@google/genai";

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      text: '안녕하세요! 저는 보육 교사님들을 위한 AI 멘토입니다. 관찰일지 작성법, 상호작용 방법 등 궁금한 점을 무엇이든 물어보세요.',
      sender: 'ai',
      feedback: null
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const chat = useMemo(() => {
    if (!apiKey) {
      console.error('Gemini API key is missing. Please set VITE_GEMINI_API_KEY.');
      return null;
    }
    try {
      const ai = new GoogleGenAI({ apiKey });
      return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: 'You are a friendly and helpful AI mentor for childcare teachers in Korea. Your answers should be practical, supportive, and based on established childcare principles. Keep your answers concise and easy to understand.'
        },
      });
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [apiKey]);

  useEffect(() => {
    if (!apiKey) {
      setMessages(prev => [
        ...prev,
        {
          id: 'missing-key',
          text: '현재 AI 기능을 사용할 수 없습니다. 환경 변수 VITE_GEMINI_API_KEY를 설정한 뒤 다시 시도해 주세요.',
          sender: 'ai',
          feedback: null,
        },
      ]);
    }
  }, [apiKey]);


  const handleSendMessage = useCallback(async (text: string) => {
    if (!chat) {
      const errorMessage: ChatMessage = {
          id: `err-${Date.now()}`,
          text: apiKey
            ? "죄송합니다. AI 서비스를 초기화하는 데 실패했습니다. API 키 설정을 확인해 주세요."
            : "현재 AI 서비스를 사용할 수 없습니다. 환경 변수 VITE_GEMINI_API_KEY를 설정해 주세요.",
          sender: 'ai',
          feedback: null
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text,
      sender: 'user',
    };
    
    const aiMessageStub: ChatMessage = {
      id: `ai-${Date.now()}`,
      text: '',
      sender: 'ai',
      feedback: null
    };
    
    setMessages(prev => [...prev, userMessage, aiMessageStub]);
    setIsLoading(true);

    try {
      const stream = await chat.sendMessageStream({ message: text });

      let fullResponse = "";
      for await (const chunk of stream) {
        fullResponse += chunk.text;
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageStub.id ? { ...msg, text: fullResponse } : msg
        ));
      }
    } catch (error) {
        console.error("Error fetching AI response:", error);
        const errorMessageText = "죄송합니다. 답변을 생성하는 중에 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageStub.id ? { ...msg, text: errorMessageText } : msg
        ));
    } finally {
        setIsLoading(false);
    }
  }, [chat, apiKey]);

  const handleFeedback = useCallback((id: string, feedback: 'positive' | 'negative') => {
    setMessages(prevMessages => 
        prevMessages.map(msg => 
            msg.id === id ? { ...msg, feedback: msg.feedback === feedback ? null : feedback } : msg
        )
    );
  }, []);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(err => {
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
