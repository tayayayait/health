
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChatMessage as ChatMessageType,
  DifficultyLevelId,
  LEARNING_STAGE_LABELS,
  LEARNING_STAGE_ORDER,
  LearningStage,
  Scenario,
  SendMessageOptions,
  TrainingModule,
} from '../types';
import ChatMessage from './ChatMessage';
import { CheckIcon, SendIcon } from './icons';

interface ChatInterfaceProps {
  messages: ChatMessageType[];
  onSendMessage: (text: string, options?: SendMessageOptions) => void;
  onFeedback: (id: string, feedback: 'positive' | 'negative') => void;
  onCopy: (text: string) => void;
  isLoading: boolean;
  modules: TrainingModule[];
  selectedModuleId: string;
  onSelectModule: (moduleId: string) => void;
  selectedScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  selectedDifficultyId: DifficultyLevelId | null;
  onSelectDifficulty: (difficultyId: DifficultyLevelId) => void;
  selectedStage: LearningStage;
  onSelectStage: (stage: LearningStage) => void;
  selectedRubricId: string | null;
  onSelectRubric: (rubricId: string | null) => void;
  completedStages: LearningStage[];
}

const SuggestionChip: React.FC<{text: string; onClick: (text: string) => void;}> = ({ text, onClick }) => (
    <button
        onClick={() => onClick(text)}
        className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all text-left"
    >
        {text}
    </button>
);

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onFeedback,
  onCopy,
  isLoading,
  modules,
  selectedModuleId,
  onSelectModule,
  selectedScenarioId,
  onSelectScenario,
  selectedDifficultyId,
  onSelectDifficulty,
  selectedStage,
  onSelectStage,
  selectedRubricId,
  onSelectRubric,
  completedStages,
}) => {
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedModule = useMemo(
    () => modules.find((module) => module.id === selectedModuleId) ?? modules[0] ?? null,
    [modules, selectedModuleId],
  );

  const selectedScenario: Scenario | null = useMemo(() => {
    if (!selectedModule) {
      return null;
    }
    return selectedModule.scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? selectedModule.scenarios[0] ?? null;
  }, [selectedModule, selectedScenarioId]);

  const difficultyOptions = selectedScenario?.difficultyLevels ?? [];
  const selectedDifficulty = selectedDifficultyId
    ? difficultyOptions.find((option) => option.id === selectedDifficultyId) ?? null
    : difficultyOptions[0] ?? null;

  const stageContent = selectedScenario?.stages[selectedStage] ?? null;

  const stageRubrics = useMemo(() => {
    if (!selectedScenario) {
      return [];
    }
    if (!stageContent || stageContent.rubricFocus.length === 0) {
      return selectedScenario.evaluationRubrics;
    }
    return selectedScenario.evaluationRubrics.filter((rubric) => stageContent.rubricFocus.includes(rubric.id));
  }, [selectedScenario, stageContent]);

  const selectedRubric = stageRubrics.find((rubric) => rubric.id === selectedRubricId) ?? null;

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
      onSendMessage(inputValue.trim(), { stage: selectedStage });
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
    onSendMessage(text, { stage: selectedStage });
  };

  const handleStagePrompt = (prompt: string, stage: LearningStage) => {
    onSelectStage(stage);
    setInputValue('');
    onSendMessage(prompt, { stage });
  };

  const completedStageSet = useMemo(() => new Set(completedStages), [completedStages]);

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <header className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <h1 className="text-xl font-bold text-gray-800 text-center">교사easy AI 멘토</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="flex flex-col space-y-1">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">모듈</span>
              <select
                value={selectedModule?.id ?? ''}
                onChange={(event) => onSelectModule(event.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col space-y-1">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">시나리오</span>
              <select
                value={selectedScenario?.id ?? ''}
                onChange={(event) => onSelectScenario(event.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {selectedModule?.scenarios.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col space-y-1">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">난이도</span>
              <select
                value={selectedDifficulty?.id ?? ''}
                onChange={(event) => onSelectDifficulty(event.target.value as DifficultyLevelId)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {difficultyOptions.map((difficulty) => (
                  <option key={difficulty.id} value={difficulty.id}>
                    {difficulty.label}
                  </option>
                ))}
              </select>
              {selectedDifficulty?.description && (
                <p className="text-xs text-gray-500">{selectedDifficulty.description}</p>
              )}
            </label>
          </div>

          {selectedScenario && (
            <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
              {selectedScenario.summary}
            </p>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">학습 단계</span>
              <span className="text-xs text-gray-500">{LEARNING_STAGE_LABELS[selectedStage]} 단계 진행 중</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {LEARNING_STAGE_ORDER.map((stageKey) => {
                const isActive = selectedStage === stageKey;
                const isCompleted = completedStageSet.has(stageKey);
                return (
                  <button
                    key={stageKey}
                    type="button"
                    onClick={() => onSelectStage(stageKey)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                      isActive
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {isCompleted && <CheckIcon className="w-4 h-4 text-green-500" />}
                    <span>{LEARNING_STAGE_LABELS[stageKey]}</span>
                  </button>
                );
              })}
            </div>
            {stageContent?.description && (
              <p className="text-xs text-gray-500">{stageContent.description}</p>
            )}
          </div>

          {stageContent && stageContent.prompts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">추천 프롬프트</span>
                <span className="text-xs text-gray-400">선택 즉시 전송됩니다</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {stageContent.prompts.map((prompt) => (
                  <SuggestionChip
                    key={prompt}
                    text={prompt}
                    onClick={(value) => handleStagePrompt(value, selectedStage)}
                  />
                ))}
              </div>
            </div>
          )}

          {stageRubrics.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">평가 기준</span>
                <button
                  type="button"
                  onClick={() => onSelectRubric(null)}
                  className={`text-xs underline ${selectedRubricId === null ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                >
                  전체 기준 보기
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {stageRubrics.map((rubric) => {
                  const isSelected = selectedRubricId === rubric.id;
                  return (
                    <button
                      key={rubric.id}
                      type="button"
                      onClick={() => onSelectRubric(rubric.id)}
                      className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {rubric.title}
                    </button>
                  );
                })}
              </div>
              {selectedRubric && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 space-y-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">{selectedRubric.title}</p>
                    <p className="text-xs text-gray-500">{selectedRubric.description}</p>
                  </div>
                  <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                    {selectedRubric.performanceIndicators.map((indicator) => (
                      <li key={indicator}>{indicator}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

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
