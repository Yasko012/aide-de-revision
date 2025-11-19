export interface UserProfile {
  email: string;
  history: string[];
  learningProfile?: string; // User's self-description
  aiGeneratedLearningStyleSummary?: string; // AI's analysis of the user
}

export interface Flashcard {
  recto: string; // The question or term
  verso: string; // The answer or definition
}

export interface ImageFile {
  data: string; // base64 encoded string
  mimeType: string;
}

// New types for Quiz
export type QuizType = 'mcq' | 'open' | 'true-false';

export interface MCQ {
  type: 'mcq';
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface OpenQuestion {
  type: 'open';
  question: string;
  idealAnswer: string;
}

export interface TrueFalseQuestion {
  type: 'true-false';
  statement: string;
  isTrue: boolean;
  explanation: string;
}

export type QuizQuestion = MCQ | OpenQuestion | TrueFalseQuestion;
