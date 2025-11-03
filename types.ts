
export type MessageSender = 'user' | 'ai';
export type FeedbackStatus = 'positive' | 'negative' | null;
export type LearningStage = 'diagnosis' | 'deepening' | 'coaching';

export const LEARNING_STAGE_LABELS: Record<LearningStage, string> = {
  diagnosis: '진단',
  deepening: '심화',
  coaching: '코칭',
};

export const LEARNING_STAGE_ORDER: LearningStage[] = ['diagnosis', 'deepening', 'coaching'];

export type DifficultyLevelId = 'basic' | 'intermediate' | 'advanced';

export interface DifficultyLevel {
  id: DifficultyLevelId;
  label: string;
  description: string;
}

export interface EvaluationRubric {
  id: string;
  title: string;
  description: string;
  performanceIndicators: string[];
  applicableStages: LearningStage[];
}

export interface StageContent {
  description: string;
  prompts: string[];
  selfAssessmentChecklist: string[];
  followUpQuestions: string[];
  rubricFocus: string[];
}

export interface Scenario {
  id: string;
  title: string;
  summary: string;
  difficultyLevels: DifficultyLevel[];
  evaluationRubrics: EvaluationRubric[];
  stages: Record<LearningStage, StageContent>;
}

export interface TrainingModule {
  id: string;
  name: string;
  description: string;
  focusArea: string;
  scenarios: Scenario[];
}

export interface ScenarioProgress {
  completedStages: LearningStage[];
  feedbackDelivered: LearningStage[];
}

export interface SendMessageOptions {
  stage?: LearningStage;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: MessageSender;
  feedback?: FeedbackStatus;
}
