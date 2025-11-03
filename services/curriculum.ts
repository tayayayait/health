import {
  DifficultyLevelId,
  LEARNING_STAGE_LABELS,
  LEARNING_STAGE_ORDER,
  LearningStage,
  Scenario,
  StageContent,
  TrainingModule,
} from '../types';

const makeDifficulty = (
  id: DifficultyLevelId,
  label: string,
  description: string,
) => ({ id, label, description });

const withStage = (config: StageContent, overrides?: Partial<StageContent>): StageContent => ({
  ...config,
  ...overrides,
});

const baseStageContent: Record<LearningStage, StageContent> = {
  diagnosis: {
    description: '상황을 명확히 진단하고 관찰 포인트를 정리합니다.',
    prompts: [],
    selfAssessmentChecklist: [],
    followUpQuestions: [],
    rubricFocus: [],
  },
  deepening: {
    description: '핵심 원인을 분석하고 전략을 정교화합니다.',
    prompts: [],
    selfAssessmentChecklist: [],
    followUpQuestions: [],
    rubricFocus: [],
  },
  coaching: {
    description: '현장 적용 후 피드백과 코칭 전략을 설계합니다.',
    prompts: [],
    selfAssessmentChecklist: [],
    followUpQuestions: [],
    rubricFocus: [],
  },
};

const observationScenario: Scenario = {
  id: 'transition-support',
  title: '전이 활동이 어려운 유아 지원',
  summary:
    '만 3세 반에서 전이 활동 시 산만해지는 유아 A를 지원하기 위해 관찰과 기록, 상호작용 전략을 설계합니다.',
  difficultyLevels: [
    makeDifficulty('basic', '기초', '사실 중심으로 상황을 파악하고 기본적인 지원 전략을 수립합니다.'),
    makeDifficulty('intermediate', '중급', '원인을 다각도로 분석하고 맞춤형 중재안을 구성합니다.'),
    makeDifficulty('advanced', '심화', '동료 코칭과 가정 연계를 포함한 다층적 지원을 설계합니다.'),
  ],
  evaluationRubrics: [
    {
      id: 'clarity',
      title: '관찰 기록의 명확성',
      description: '관찰 내용을 사실 기반으로 구체적으로 기록했는가?',
      performanceIndicators: [
        '시간, 상황, 행동을 객관적으로 분리하여 서술한다.',
        '주관적 판단이나 추측을 최소화한다.',
      ],
      applicableStages: ['diagnosis', 'deepening'],
    },
    {
      id: 'strategy-fit',
      title: '전략의 적합성',
      description: '전이 활동 맥락과 유아 특성에 맞는 지원 전략을 제시했는가?',
      performanceIndicators: [
        '관찰된 행동 원인을 토대로 전략을 연결한다.',
        '교실 환경, 동료 관계, 가정 연계 요소를 고려한다.',
      ],
      applicableStages: ['deepening', 'coaching'],
    },
    {
      id: 'reflection',
      title: '성찰과 코칭 계획',
      description: '실행 결과를 성찰하고 후속 코칭 계획을 수립했는가?',
      performanceIndicators: [
        '성과와 어려움을 구체적으로 분석한다.',
        '동료 또는 학부모와 공유할 코칭 전략을 제안한다.',
      ],
      applicableStages: ['coaching'],
    },
  ],
  stages: {
    diagnosis: withStage(baseStageContent.diagnosis, {
      prompts: [
        '전이 활동 중 A의 행동을 사실 중심으로 정리해줘.',
        '관찰 일지에 포함해야 할 핵심 요소를 알려줘.',
      ],
      selfAssessmentChecklist: [
        '관찰 내용을 사실과 해석으로 구분했는가?',
        '전이 활동의 흐름과 교사의 상호작용을 함께 기록했는가?',
        'A의 행동 빈도와 강도를 수치 또는 객관적 표현으로 제시했는가?',
      ],
      followUpQuestions: [
        '추가로 관찰해야 할 시간대나 상황은 어디인가?',
        '교실 환경 요인 중 영향을 주는 요소는 무엇일까?',
      ],
      rubricFocus: ['clarity'],
    }),
    deepening: withStage(baseStageContent.deepening, {
      prompts: [
        'A의 전이 활동 어려움의 원인을 다각도로 분석해줘.',
        '관찰 내용을 바탕으로 전이 활동 전략을 제안해줘.',
      ],
      selfAssessmentChecklist: [
        '원인 분석에 환경, 상호작용, 유아 특성을 모두 고려했는가?',
        '전략이 실행 가능하고 단계적으로 제시되었는가?',
        '예상되는 유아 반응과 교사의 피드백 계획을 포함했는가?',
      ],
      followUpQuestions: [
        'A의 강점을 활용한 전이 활동 도입 방법은 무엇인가?',
        '다른 교실 자원이나 동료 교사와의 협력을 어떻게 설계할 수 있을까?',
      ],
      rubricFocus: ['clarity', 'strategy-fit'],
    }),
    coaching: withStage(baseStageContent.coaching, {
      prompts: [
        '전략 실행 후 관찰된 변화를 점검할 코칭 질문을 만들어줘.',
        '동료 교사와 공유할 피드백 계획을 정리해줘.',
      ],
      selfAssessmentChecklist: [
        '실행 결과에서 긍정적 변화와 추가 과제를 모두 기록했는가?',
        '코칭 대상에게 제공할 구체적 피드백 문장을 준비했는가?',
        '가정과 연계할 커뮤니케이션 계획을 포함했는가?',
      ],
      followUpQuestions: [
        '전략을 유지하거나 확장하기 위해 필요한 지원은 무엇인가?',
        '학부모와 공유할 체크 포인트는 무엇일까?',
      ],
      rubricFocus: ['strategy-fit', 'reflection'],
    }),
  },
};

const familyScenario: Scenario = {
  id: 'family-partnership',
  title: '학부모와의 파트너십 구축',
  summary:
    '의사소통이 부족한 학부모와 긍정적 관계를 형성하고 가정 연계를 강화하는 상담 전략을 개발합니다.',
  difficultyLevels: [
    makeDifficulty('basic', '기초', '기초 상담 구조를 파악하고 공감적 소통을 연습합니다.'),
    makeDifficulty('intermediate', '중급', '상황별 상담 전략과 자료를 설계합니다.'),
    makeDifficulty('advanced', '심화', '가정-기관 공동 프로젝트와 코칭 플랜을 수립합니다.'),
  ],
  evaluationRubrics: [
    {
      id: 'empathy',
      title: '공감적 경청',
      description: '학부모의 감정과 요구를 정확히 파악하고 반영했는가?',
      performanceIndicators: [
        '감정과 사실을 구분하여 재진술한다.',
        '학부모의 우려를 인정하고 공감적 언어로 응답한다.',
      ],
      applicableStages: ['diagnosis', 'deepening'],
    },
    {
      id: 'collaboration',
      title: '공동 해결 전략',
      description: '학부모와 함께 실행 가능한 해결 전략을 수립했는가?',
      performanceIndicators: [
        '교실 관찰과 학부모 의견을 통합해 목표를 설정한다.',
        '가정과 기관이 함께 수행할 활동을 제안한다.',
      ],
      applicableStages: ['deepening', 'coaching'],
    },
    {
      id: 'follow-through',
      title: '후속 지원 계획',
      description: '상담 이후 모니터링과 피드백 계획을 마련했는가?',
      performanceIndicators: [
        '진행 상황을 점검할 일정과 방법을 제시한다.',
        '학부모가 체감할 수 있는 성과 지표를 정의한다.',
      ],
      applicableStages: ['coaching'],
    },
  ],
  stages: {
    diagnosis: withStage(baseStageContent.diagnosis, {
      prompts: [
        '학부모 상담에서 사용할 개방형 질문을 추천해줘.',
        '학부모 우려를 파악하기 위한 사전 체크리스트를 만들어줘.',
      ],
      selfAssessmentChecklist: [
        '학부모의 감정을 인정하는 표현을 준비했는가?',
        '사실 확인을 위한 질문과 공감 반응을 구분했는가?',
        '상담 목표와 기대 결과를 명확히 설명할 수 있는가?',
      ],
      followUpQuestions: [
        '학부모의 선호하는 소통 채널은 무엇인가?',
        '상담 후 제공할 자료나 안내문은 어떤 내용이어야 할까?',
      ],
      rubricFocus: ['empathy'],
    }),
    deepening: withStage(baseStageContent.deepening, {
      prompts: [
        '학부모와 공동으로 설정할 상담 목표를 제안해줘.',
        '상담 내용을 정리한 피드백 노트를 작성해줘.',
      ],
      selfAssessmentChecklist: [
        '목표가 구체적이고 측정 가능한가?',
        '가정에서 실천 가능한 활동을 함께 제시했는가?',
        '학부모의 강점을 활용한 협력 방안을 포함했는가?',
      ],
      followUpQuestions: [
        '학부모의 참여 동기를 높이기 위한 동기유발 질문은?',
        '상담 중 발생할 수 있는 갈등을 어떻게 완화할 수 있을까?',
      ],
      rubricFocus: ['empathy', 'collaboration'],
    }),
    coaching: withStage(baseStageContent.coaching, {
      prompts: [
        '상담 후 점검할 체크리스트와 피드백 루틴을 설계해줘.',
        '학부모에게 전달할 코칭 메시지 예시를 만들어줘.',
      ],
      selfAssessmentChecklist: [
        '점검 일정과 책임 주체가 명확한가?',
        '학부모의 피드백을 수집할 방법을 포함했는가?',
        '다음 상담까지의 지원 계획이 제시되었는가?',
      ],
      followUpQuestions: [
        '상담 결과를 교직원과 어떻게 공유할까?',
        '추가적으로 필요한 외부 자원은 무엇일까?',
      ],
      rubricFocus: ['collaboration', 'follow-through'],
    }),
  },
};

export const trainingModules: TrainingModule[] = [
  {
    id: 'observation-documentation',
    name: '관찰 및 기록 역량 강화',
    description: '영유아 행동을 면밀히 관찰하고 체계적으로 기록하는 역량을 강화합니다.',
    focusArea: 'Observation & Documentation',
    scenarios: [observationScenario],
  },
  {
    id: 'family-communication',
    name: '가정 연계 소통 역량 강화',
    description: '학부모와의 파트너십을 구축하고 지속 가능한 소통 전략을 개발합니다.',
    focusArea: 'Family Engagement',
    scenarios: [familyScenario],
  },
];

export const getScenarioById = (moduleId: string, scenarioId: string) => {
  const module = trainingModules.find((item) => item.id === moduleId);
  return module?.scenarios.find((scenario) => scenario.id === scenarioId) ?? null;
};

export const getStageLabel = (stage: LearningStage) => LEARNING_STAGE_LABELS[stage];

export const getDefaultStageDescription = (stage: LearningStage) =>
  baseStageContent[stage].description;

export const getStageOrder = () => [...LEARNING_STAGE_ORDER];
