
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import ChatMessage from './ChatMessage';
import { SendIcon } from './icons';

interface ChatInterfaceProps {
  messages: ChatMessageType[];
  onSendMessage: (text: string) => void;
  onFeedback: (id: string, feedback: 'positive' | 'negative') => void;
  onCopy: (text: string) => void;
  isLoading: boolean;
}

const SuggestionChip: React.FC<{text: string; onClick: (text: string) => void;}> = ({ text, onClick }) => (
    <button 
        onClick={() => onClick(text)}
        className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all text-left"
    >
        {text}
    </button>
);


const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, onFeedback, onCopy, isLoading }) => {
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInputValue(''); // Clear just in case
    onSendMessage(text);
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <header className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <h1 className="text-xl font-bold text-gray-800 text-center">교사easy AI 멘토</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg, index) => (
          <ChatMessage 
            key={msg.id} 
            message={msg} 
            onFeedback={onFeedback} 
            onCopy={onCopy} 
            isStreaming={isLoading && msg.sender === 'ai' && index === messages.length - 1}
          />
        ))}
         {messages.length === 1 && (
            <div className="p-4 flex flex-col items-center animate-fade-in-up space-y-4">
                 <h2 className="text-lg font-semibold text-gray-700">시작해 보세요!</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl w-full">
                    <SuggestionChip text="관찰일지 쓰는 법 알려줘" onClick={handleSuggestionClick} />
                    <SuggestionChip text="칭찬 스티커, 언제 어떻게 써야 효과적일까?" onClick={handleSuggestionClick} />
                    <SuggestionChip text="주의가 산만한 아이, 어떻게 지도해야 할까?" onClick={handleSuggestionClick} />
                    <SuggestionChip text="학부모와 긍정적인 관계를 쌓는 법" onClick={handleSuggestionClick} />
                 </div>
            </div>
        )}
        {isLoading && messages[messages.length - 1]?.sender === 'user' && (
            <div className="flex items-start mb-6 animate-fade-in-up">
                <div className="bg-white text-gray-800 self-start rounded-bl-lg shadow-sm px-5 py-3 rounded-2xl flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-300"></span>
                </div>
            </div>
        )}
        <div ref={chatEndRef} />
      </main>
      
      <footer className="bg-white border-t border-gray-200 p-2 md:p-4 sticky bottom-0">
        <form onSubmit={handleSubmit} className="flex items-end max-w-4xl mx-auto bg-white rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 transition-shadow">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="보육 관련 질문을 입력하세요..."
            className="flex-1 p-3 bg-transparent border-none focus:ring-0 resize-none max-h-40"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="p-3 text-blue-500 disabled:text-gray-400 disabled:cursor-not-allowed hover:text-blue-600 transition-colors"
            aria-label="Send message"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatInterface;
