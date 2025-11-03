
export type MessageSender = 'user' | 'ai';
export type FeedbackStatus = 'positive' | 'negative' | null;

export interface ChatMessage {
  id: string;
  text: string;
  sender: MessageSender;
  feedback?: FeedbackStatus;
}
