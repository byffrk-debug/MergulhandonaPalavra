import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { QuizAttempt } from '../types/quiz';

export function useQuizAttempts(userId: string, quizId: string | null) {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [hasPassed, setHasPassed] = useState(false);

  const load = useCallback(async () => {
    if (!userId || !quizId) return;
    const { data } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('quiz_id', quizId)
      .order('created_at', { ascending: false });

    const all = data ?? [];
    setAttempts(all);
    setHasPassed(all.some(a => a.passed));
  }, [userId, quizId]);

  useEffect(() => { load(); }, [load]);

  return { attempts, hasPassed, reload: load };
}
