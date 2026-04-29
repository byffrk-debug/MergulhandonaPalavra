import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Quiz, QuizQuestion } from '../types/quiz';

export function useQuiz(moduleName: string) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!moduleName) return;
    setLoading(true);

    const { data: quizData } = await supabase
      .from('quizzes')
      .select('*')
      .eq('module_name', moduleName)
      .single();

    if (quizData) {
      setQuiz(quizData);
      const { data: qData } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizData.id)
        .order('position', { ascending: true });
      setQuestions(qData ?? []);
    } else {
      setQuiz(null);
      setQuestions([]);
    }

    setLoading(false);
  }, [moduleName]);

  useEffect(() => { load(); }, [load]);

  return { quiz, questions, loading, refetch: load };
}
