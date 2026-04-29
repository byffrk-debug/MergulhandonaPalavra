import { ClipboardList, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useQuiz } from '../../hooks/useQuiz';
import { useQuizAttempts } from '../../hooks/useQuizAttempts';

interface Props {
  moduleName: string;
  userId: string;
  onTakeQuiz: () => void;
}

export function QuizBadge({ moduleName, userId, onTakeQuiz }: Props) {
  const { quiz, questions, loading } = useQuiz(moduleName);
  const { hasPassed } = useQuizAttempts(userId, quiz?.id ?? null);

  if (loading || !quiz || !quiz.published || questions.length === 0) return null;

  if (hasPassed) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30"
      >
        <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-cyan-400">Quiz Concluído</p>
          <p className="text-xs text-gray-500">Você foi aprovado neste módulo.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-between px-5 py-4 rounded-2xl bg-pink-500/10 border border-pink-500/30"
    >
      <div className="flex items-center gap-3">
        <ClipboardList className="w-5 h-5 text-pink-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-pink-400">Avaliação disponível</p>
          <p className="text-xs text-gray-500">{questions.length} perguntas · Nota mínima: {quiz.passing_score}%</p>
        </div>
      </div>
      <button
        onClick={onTakeQuiz}
        className="px-4 py-2 rounded-xl bg-pink-500 text-white text-sm font-bold hover:bg-pink-400 transition-colors flex-shrink-0"
      >
        Fazer Quiz
      </button>
    </motion.div>
  );
}
