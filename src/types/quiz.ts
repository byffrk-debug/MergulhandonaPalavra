export interface Quiz {
  id: string;
  module_name: string;
  passing_score: number;
  published: boolean;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  options: string[];
  correct_index: number;
  position: number;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  passed: boolean;
  answers: number[];
  created_at: string;
}
