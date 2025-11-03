
// NOTE: This is a mock service for the MVP to simulate a RAG backend.
// It does not make actual calls to the Gemini API but instead returns
// hardcoded responses based on keywords to fulfill the PRD's acceptance criteria.
// This allows for full frontend development and testing of the user experience.

// Represents a call to a logging service (e.g., Google Spreadsheet API)
const logFeedback = (
    question: string,
    answer: string,
    feedback: 'Positive' | 'Negative',
    sessionId: string
) => {
    console.log('--- FEEDBACK LOGGED ---');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Session ID:', sessionId);
    console.log('Question:', question);
    console.log('Answer:', answer);
    console.log('Feedback:', feedback);
    console.log('-----------------------');
    // In a real application, this would be an API call.
    return Promise.resolve();
};

export const simulatedGeminiService = {
    getGroundedResponse: async (prompt: string): Promise<{ text: string; source: string; }> => {
        // Simulate network delay
        await new Promise(res => setTimeout(res, 1000));

        const lowerCasePrompt = prompt.toLowerCase();

        // Test Case 1: Relevant, In-Domain Question
        if (lowerCasePrompt.includes('관찰일지')) {
            return {
                text: "관찰일지에는 관찰 아동, 날짜 및 시간, 관찰 장면 및 상황, 해석 및 평가, 그리고 교사의 지원 계획이 포함되어야 합니다. 이는 아동의 발달을 종합적으로 이해하고 지원하기 위한 필수 요소입니다.",
                source: "Source: 표준보육과정 해설서, p.34"
            };
        }

        // Test Case 2: Irrelevant, Out-of-Domain Question
        if (lowerCasePrompt.includes('맛집') || lowerCasePrompt.includes('식당')) {
            return {
                text: "죄송합니다, 저는 보육 관련 질문에만 답변할 수 있어요.",
                source: ""
            };
        }

        // Generic in-domain response for other childcare-related questions
        if (lowerCasePrompt.includes('보육') || lowerCasePrompt.includes('교사') || lowerCasePrompt.includes('아이')) {
            return {
                text: "영유아의 발달 특성을 고려한 상호작용은 매우 중요합니다. 교사는 영유아의 놀이를 지지하고 확장하며, 긍정적인 또래 관계를 형성할 수 있도록 도와야 합니다.",
                source: "Source: 제4차 어린이집 표준보육과정, p.12"
            };
        }

        // Default out-of-domain response
        return {
            text: "죄송합니다, 저는 보육 관련 질문에만 답변할 수 있어요. 보육, 영유아, 교사 역할 등과 관련된 질문을 해주세요.",
            source: ""
        };
    },
    logFeedback
};
   