export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  citation: string;
  uri?: string;
}

export const KNOWLEDGE_BASE: KnowledgeDocument[] = [
  {
    id: 'doc-1',
    title: '표준보육과정: 관찰일지 작성 지침',
    content:
      '관찰일지에는 관찰 대상 영유아, 날짜와 시간, 관찰 장면의 구체적 묘사, 교사의 해석과 평가, 이후 지원 계획이 포함되어야 한다. 정기적으로 기록하여 발달을 추적하고 가정과 공유한다.',
    citation: '표준보육과정 해설서, p.34',
  },
  {
    id: 'doc-2',
    title: '긍정적 상호작용과 놀이 지원',
    content:
      '교사는 영유아의 놀이에 민감하게 반응하고 언어적·정서적 지지를 제공해야 한다. 놀이 확장을 돕고 또래 간 협력과 의사소통을 촉진하며, 개별 발달 수준을 고려한 질문을 던진다.',
    citation: '제4차 어린이집 표준보육과정, p.12',
  },
  {
    id: 'doc-3',
    title: '학부모 소통과 관찰 공유',
    content:
      '관찰 결과는 학부모와 정기적으로 공유하여 가정과의 협력을 강화한다. 긍정적 사례를 중심으로 전달하되, 필요 시 행동 지원 전략을 함께 제안한다.',
    citation: '보육교직원 역량 강화 매뉴얼, p.58',
  },
];
