import { knowledgeBase, KnowledgeDocument } from './knowledgeBase';

export interface RetrievalResult extends KnowledgeDocument {
  score: number;
}

const normalize = (text: string): string => text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ');

const keywordWeight = 2;
const summaryWeight = 1;

export const retrieveRelevantDocuments = (query: string, focusHints: string[] = [], limit = 3): RetrievalResult[] => {
  if (!query.trim()) {
    return [];
  }
  const normalizedQuery = normalize(query);
  const queryTokens = new Set(normalizedQuery.split(/\s+/).filter(Boolean));
  const normalizedFocus = focusHints.map((hint) => normalize(hint));

  const scored = knowledgeBase
    .map((doc) => {
      const normalizedContent = normalize(doc.content);
      const normalizedSummary = normalize(doc.summary);
      let score = 0;

      doc.keywords.forEach((keyword) => {
        const normalizedKeyword = normalize(keyword);
        if (normalizedQuery.includes(normalizedKeyword)) {
          score += keywordWeight;
        }
      });

      normalizedFocus.forEach((focus) => {
        if (focus && doc.focusAreas.some((area) => normalize(area).includes(focus))) {
          score += keywordWeight;
        }
      });

      queryTokens.forEach((token) => {
        if (token.length < 2) {
          return;
        }
        if (normalizedContent.includes(token)) {
          score += summaryWeight;
        } else if (normalizedSummary.includes(token)) {
          score += summaryWeight * 0.5;
        }
      });

      return {
        ...doc,
        score,
      } as RetrievalResult;
    })
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
};
