export interface Note {
  id: string;
  title: string;
  content: string; // The sensitive data
  createdAt: number;
  color?: string; // Optional nice background color for the note
}

export type ViewState = 'setup' | 'locked' | 'dashboard' | 'reset-verification';

export interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface SecurityQA {
  question: string;
  answerHash: string; // Store hash of the answer
}

export type Theme = 'light' | 'dark';