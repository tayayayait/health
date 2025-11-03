export type MessageSender = 'user' | 'ai';
export type FeedbackStatus = 'positive' | 'negative' | null;

export interface GroundingEvidence {
  id: string;
  title: string;
  citation: string;
  uri?: string;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: MessageSender;
  feedback?: FeedbackStatus;
  sources?: GroundingEvidence[];
  isComplete?: boolean;
}
