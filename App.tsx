
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import {
  ChatMessage,
  DifficultyLevelId,
  LEARNING_STAGE_LABELS,
  LearningStage,
  Scenario,
  ScenarioProgress,
  SendMessageOptions,
} from './types';
import { GoogleGenAI } from "@google/genai";
import { trainingModules } from './services/curriculum';

const App: React.FC = () => {
  const modules = useMemo(() => trainingModules, []);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      text: '안녕하세요! 저는 보육 교사님들을 위한 AI 멘토입니다. 관찰일지 작성법, 상호작용 방법 등 궁금한 점을 무엇이든 물어보세요.',
      sender: 'ai',
      feedback: null
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string>(() => modules[0]?.id ?? '');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(() => modules[0]?.scenarios[0]?.id ?? '');
  const [selectedDifficultyId, setSelectedDifficultyId] = useState<DifficultyLevelId | null>(
    () => modules[0]?.scenarios[0]?.difficultyLevels[0]?.id ?? null,
  );
  const [selectedStage, setSelectedStage] = useState<LearningStage>('diagnosis');
  const [selectedRubricId, setSelectedRubricId] = useState<string | null>(
    () => modules[0]?.scenarios[0]?.evaluationRubrics[0]?.id ?? null,
  );
  const [progress, setProgress] = useState<Record<string, ScenarioProgress>>({});

  const selectedModule = useMemo(() => {
    if (!modules.length) {
      return null;
    }
    return modules.find((module) => module.id === selectedModuleId) ?? modules[0];
  }, [modules, selectedModuleId]);

  const selectedScenario: Scenario | null = useMemo(() => {
    if (!selectedModule) {
      return null;
    }
    return selectedModule.scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? selectedModule.scenarios[0] ?? null;
  }, [selectedModule, selectedScenarioId]);

  const selectedDifficulty = useMemo(() => {
    if (!selectedScenario) {
      return null;
    }
    if (!selectedScenario.difficultyLevels.length) {
      return null;
    }
    return selectedScenario.difficultyLevels.find((level) => level.id === selectedDifficultyId) ?? selectedScenario.difficultyLevels[0];
  }, [selectedScenario, selectedDifficultyId]);

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

  const selectedRubric = useMemo(() => {
    if (!selectedScenario || !selectedRubricId) {
      return null;
    }
    return selectedScenario.evaluationRubrics.find((rubric) => rubric.id === selectedRubricId) ?? null;
  }, [selectedScenario, selectedRubricId]);

  useEffect(() => {
    if (!selectedModule) {
      return;
    }
    if (!selectedModule.scenarios.some((scenario) => scenario.id === selectedScenarioId)) {
      const fallbackScenario = selectedModule.scenarios[0];
      if (fallbackScenario) {
        setSelectedScenarioId(fallbackScenario.id);
        setSelectedDifficultyId(fallbackScenario.difficultyLevels[0]?.id ?? null);
        setSelectedRubricId(fallbackScenario.evaluationRubrics[0]?.id ?? null);
        setSelectedStage('diagnosis');
      }
    }
  }, [selectedModule, selectedScenarioId]);

  useEffect(() => {
    if (!selectedScenario) {
      setSelectedDifficultyId(null);
      setSelectedRubricId(null);
      return;
    }
    if (!selectedScenario.difficultyLevels.some((level) => level.id === selectedDifficultyId)) {
      setSelectedDifficultyId(selectedScenario.difficultyLevels[0]?.id ?? null);
    }
    if (selectedRubricId && !selectedScenario.evaluationRubrics.some((rubric) => rubric.id === selectedRubricId)) {
      setSelectedRubricId(selectedScenario.evaluationRubrics[0]?.id ?? null);
    }
  }, [selectedScenario, selectedDifficultyId, selectedRubricId]);

  useEffect(() => {
    if (!selectedScenario || !stageContent || !stageContent.rubricFocus.length) {
      return;
    }
    if (selectedRubricId === null) {
      return;
    }
    if (!stageContent.rubricFocus.includes(selectedRubricId)) {
      setSelectedRubricId(stageContent.rubricFocus[0]);
    }
  }, [selectedScenario, stageContent, selectedRubricId]);

  const chat = useMemo(() => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const instructionParts: string[] = [
        'You are a professional AI mentor supporting childcare teachers in Korea. Provide evidence-informed, culturally relevant guidance.',
      ];

      if (selectedModule) {
        instructionParts.push(
          `Training module: ${selectedModule.name} (${selectedModule.focusArea}). Focus on ${selectedModule.description}.`,
        );
      }

      if (selectedScenario) {
        instructionParts.push(
          `Scenario: ${selectedScenario.title}. Summary: ${selectedScenario.summary}`,
        );
      }

      if (selectedDifficulty) {
        instructionParts.push(
          `Difficulty level: ${selectedDifficulty.label} - ${selectedDifficulty.description}. Adjust explanations to match this depth.`,
        );
      }

      if (stageContent) {
        instructionParts.push(
          `Current learning stage: ${LEARNING_STAGE_LABELS[selectedStage]} - ${stageContent.description}. Provide responses that align with this stage's objectives.`,
        );
      }

      const rubricForInstruction = selectedRubric ?? (stageRubrics.length ? stageRubrics[0] : null);
      if (rubricForInstruction) {
        instructionParts.push(
          `Key evaluation focus: ${rubricForInstruction.title} (${rubricForInstruction.description}). Indicators: ${rubricForInstruction.performanceIndicators.join(', ')}. Reference these in feedback.`,
        );
      }

      return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: instructionParts.join('\n'),
        },
      });
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [selectedModule, selectedScenario, selectedDifficulty, selectedStage, selectedRubric, stageRubrics]);
  const handleModuleChange = useCallback((moduleId: string) => {
    setSelectedModuleId(moduleId);
    const module = modules.find((item) => item.id === moduleId);
    if (module && module.scenarios.length) {
      const firstScenario = module.scenarios[0];
      setSelectedScenarioId(firstScenario.id);
      setSelectedDifficultyId(firstScenario.difficultyLevels[0]?.id ?? null);
      setSelectedRubricId(firstScenario.evaluationRubrics[0]?.id ?? null);
    } else {
      setSelectedScenarioId('');
      setSelectedDifficultyId(null);
      setSelectedRubricId(null);
    }
    setSelectedStage('diagnosis');
  }, [modules]);

  const handleScenarioChange = useCallback((scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    if (!selectedModule) {
      return;
    }
    const scenario = selectedModule.scenarios.find((item) => item.id === scenarioId);
    if (scenario) {
      setSelectedDifficultyId(scenario.difficultyLevels[0]?.id ?? null);
      setSelectedRubricId(scenario.evaluationRubrics[0]?.id ?? null);
    } else {
      setSelectedDifficultyId(null);
      setSelectedRubricId(null);
    }
    setSelectedStage('diagnosis');
  }, [selectedModule]);

  const handleDifficultyChange = useCallback((difficultyId: DifficultyLevelId) => {
    setSelectedDifficultyId(difficultyId);
  }, []);

  const handleStageChange = useCallback((stage: LearningStage) => {
    setSelectedStage(stage);
  }, []);

  const handleRubricChange = useCallback((rubricId: string | null) => {
    setSelectedRubricId(rubricId);
  }, []);

  const handleSendMessage = useCallback(async (text: string, options?: SendMessageOptions) => {
    const activeStage = options?.stage ?? selectedStage;

    if (!chat || !selectedModule || !selectedScenario) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        text: "죄송합니다. AI 서비스를 초기화하는 데 실패했습니다. API 키와 커리큘럼 선택을 확인해 주세요.",
        sender: 'ai',
        feedback: null,
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    const scenarioStageContent = selectedScenario.stages[activeStage];
    const stageRubricIds = scenarioStageContent?.rubricFocus ?? [];
    const availableRubrics = stageRubricIds.length
      ? selectedScenario.evaluationRubrics.filter((rubric) => stageRubricIds.includes(rubric.id))
      : selectedScenario.evaluationRubrics;

    const explicitRubric = selectedRubricId
      ? selectedScenario.evaluationRubrics.find((rubric) => rubric.id === selectedRubricId) ?? null
      : null;

    const contextRubrics = selectedRubricId === null
      ? availableRubrics
      : explicitRubric
        ? [explicitRubric]
        : availableRubrics.slice(0, 1);

    const progressForScenario = progress[selectedScenario.id];
    const completedStageNames = progressForScenario?.completedStages?.length
      ? progressForScenario.completedStages.map((stage) => LEARNING_STAGE_LABELS[stage]).join(', ')
      : '없음';

    const contextParts: string[] = [];
    contextParts.push(`모듈: ${selectedModule.name} (${selectedModule.focusArea}) - ${selectedModule.description}`);
    contextParts.push(`시나리오: ${selectedScenario.title} | ${selectedScenario.summary}`);
    if (selectedDifficulty) {
      contextParts.push(`난이도: ${selectedDifficulty.label} - ${selectedDifficulty.description}`);
    }
    const stageLabel = LEARNING_STAGE_LABELS[activeStage];
    if (scenarioStageContent) {
      contextParts.push(`학습 단계: ${stageLabel} - ${scenarioStageContent.description}`);
    } else {
      contextParts.push(`학습 단계: ${stageLabel}`);
    }
    if (contextRubrics.length) {
      contextParts.push(
        `평가 기준: ${contextRubrics
          .map((rubric) => `${rubric.title} - ${rubric.description} (지표: ${rubric.performanceIndicators.join(', ')})`)
          .join(' | ')}`,
      );
    }
    contextParts.push(`완료된 단계: ${completedStageNames}`);

    const payload = `${contextParts.join('\n')}` + `\n\n사용자 질문: ${text}`;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text,
      sender: 'user',
    };

    const aiMessageStub: ChatMessage = {
      id: `ai-${Date.now()}`,
      text: '',
      sender: 'ai',
      feedback: null,
    };

    setMessages((prev) => [...prev, userMessage, aiMessageStub]);
    setIsLoading(true);

    try {
      const stream = await chat.sendMessageStream({ message: payload });

      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk.text;
        setMessages((prev) =>
          prev.map((msg) => (msg.id === aiMessageStub.id ? { ...msg, text: fullResponse } : msg)),
        );
      }

      let shouldAppendFeedback = false;
      setProgress((prev) => {
        const scenarioProgress = prev[selectedScenario.id] ?? { completedStages: [], feedbackDelivered: [] };
        const completedStages = scenarioProgress.completedStages.includes(activeStage)
          ? scenarioProgress.completedStages
          : [...scenarioProgress.completedStages, activeStage];
        let feedbackDelivered = scenarioProgress.feedbackDelivered;
        const hasFeedbackMaterial = !!(
          scenarioStageContent &&
          (scenarioStageContent.selfAssessmentChecklist.length || scenarioStageContent.followUpQuestions.length)
        );
        if (hasFeedbackMaterial && !scenarioProgress.feedbackDelivered.includes(activeStage)) {
          feedbackDelivered = [...scenarioProgress.feedbackDelivered, activeStage];
          shouldAppendFeedback = true;
        }
        return {
          ...prev,
          [selectedScenario.id]: {
            completedStages,
            feedbackDelivered,
          },
        };
      });

      if (shouldAppendFeedback && scenarioStageContent) {
        const checklistText = scenarioStageContent.selfAssessmentChecklist
          .map((item, index) => `${index + 1}. ${item}`)
          .join('\n');
        const followUpText = scenarioStageContent.followUpQuestions
          .map((question, index) => `${index + 1}. ${question}`)
          .join('\n');
        const rubricText = contextRubrics.length
          ? contextRubrics.map((rubric) => `- ${rubric.title}: ${rubric.performanceIndicators.join(', ')}`).join('\n')
          : '';

        const feedbackSections: string[] = [];
        if (checklistText) {
          feedbackSections.push(`자가 평가 체크리스트\n${checklistText}`);
        }
        if (followUpText) {
          feedbackSections.push(`후속 질문 제안\n${followUpText}`);
        }
        if (rubricText) {
          feedbackSections.push(`평가 기준 리마인드\n${rubricText}`);
        }

        if (feedbackSections.length) {
          const feedbackMessage: ChatMessage = {
            id: `ai-feedback-${Date.now()}`,
            text: `${stageLabel} 단계 피드백 루프 제안\n\n${feedbackSections.join('\n\n')}`,
            sender: 'ai',
            feedback: null,
          };
          setMessages((prev) => [...prev, feedbackMessage]);
        }
      }
    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessageText = '죄송합니다. 답변을 생성하는 중에 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
      setMessages((prev) =>
        prev.map((msg) => (msg.id === aiMessageStub.id ? { ...msg, text: errorMessageText } : msg)),
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    chat,
    selectedModule,
    selectedScenario,
    selectedDifficulty,
    selectedRubricId,
    progress,
    selectedStage,
  ]);

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

  const selectedScenarioProgress = selectedScenario ? progress[selectedScenario.id] : undefined;
  const completedStages = selectedScenarioProgress?.completedStages ?? [];
  const scenarioIdForProps = selectedScenario?.id ?? selectedScenarioId;
  const moduleIdForProps = selectedModule?.id ?? selectedModuleId;
  const difficultyIdForProps = selectedDifficulty?.id ?? null;

  return (
    <div className="h-screen w-screen font-sans">
      <ChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        onFeedback={handleFeedback}
        onCopy={handleCopy}
        isLoading={isLoading}
        modules={modules}
        selectedModuleId={moduleIdForProps}
        onSelectModule={handleModuleChange}
        selectedScenarioId={scenarioIdForProps}
        onSelectScenario={handleScenarioChange}
        selectedDifficultyId={difficultyIdForProps}
        onSelectDifficulty={handleDifficultyChange}
        selectedStage={selectedStage}
        onSelectStage={handleStageChange}
        selectedRubricId={selectedRubricId}
        onSelectRubric={handleRubricChange}
        completedStages={completedStages}
      />
    </div>
  );
};

export default App;
