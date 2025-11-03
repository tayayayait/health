
import React, { useState } from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import { ThumbsUpIcon, ThumbsDownIcon, CopyIcon, CheckIcon } from './icons';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
  onFeedback: (id: string, feedback: 'positive' | 'negative') => void;
  onCopy: (text: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isStreaming, onFeedback, onCopy }) => {
  const isUser = message.sender === 'user';
  const [isCopied, setIsCopied] = useState(false);

  const baseBubbleClasses = 'max-w-xl md:max-w-2xl lg:max-w-3xl px-5 py-3 rounded-2xl break-words';
  const userBubbleClasses = 'bg-blue-500 text-white self-end rounded-br-lg';
  const aiBubbleClasses = 'bg-white text-gray-800 self-start rounded-bl-lg shadow-sm';

  const handleCopy = () => {
    if (message.text) {
        onCopy(message.text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-6 animate-fade-in-up`}>
      <div className={`${baseBubbleClasses} ${isUser ? userBubbleClasses : aiBubbleClasses}`}>
        <p className="whitespace-pre-wrap">
            {message.text}
            {isStreaming && <span className="inline-block w-2 h-5 bg-blue-500 rounded-sm animate-pulse ml-1" />}
        </p>
      </div>
      {!isUser && !isStreaming && message.text && (
        <div className="mt-2 text-xs text-gray-500 flex items-center space-x-4 pl-2">
             <div className="flex items-center space-x-2">
               <button 
                 onClick={() => onFeedback(message.id, 'positive')}
                 className={`p-1 rounded-full transition-colors ${message.feedback === 'positive' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-500'}`}
                 aria-label="Good answer"
               >
                 <ThumbsUpIcon className="w-4 h-4" />
               </button>
               <button 
                 onClick={() => onFeedback(message.id, 'negative')}
                 className={`p-1 rounded-full transition-colors ${message.feedback === 'negative' ? 'bg-red-100 text-red-600' : 'hover:bg-gray-200 text-gray-500'}`}
                 aria-label="Bad answer"
               >
                 <ThumbsDownIcon className="w-4 h-4" />
               </button>
               <button onClick={handleCopy} className="p-1 rounded-full hover:bg-gray-200 text-gray-500 transition-colors" aria-label="Copy answer">
                {isCopied ? <CheckIcon className="w-4 h-4 text-green-600" /> : <CopyIcon className="w-4 h-4" />}
               </button>
             </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
