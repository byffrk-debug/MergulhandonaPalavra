import { useState } from 'react';
import { X, ClipboardList, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { useQuiz } from '../../hooks/useQuiz';
import { QuizResult } from './QuizResult';

interface Props {
  moduleName: string;
  userId: string;
  onClose: () => void;
  onPassed: () => void;
}

type Phase = 'loading' | 'intro' | 'taking' | 'result';

export function QuizTaker({ moduleName, userId, onClose, onPassed }: Props) {
  const { quiz, questions, loading } = useQuiz(moduleName);

  const [phase, setPhase] = useState<Phase>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleStart = () => {
    setAnswers([]);
    setCurrentIndex(0);
    setSelected(null);
    setPhase('taking');
  };

  const handleNext = () => {
    const newAnswers = [...answers, selected!];
    setAnswers(newAnswers);
    setSelected(null);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleSubmit(newAnswers);
    }
  };

  const handleSubmit = async (finalAnswers: number[]) => {
    if (!quiz) return;
    setSubmitting(true);

    const correct = finalAnswers.filter(
      (ans, i) => ans === questions[i].correct_index
    ).length;
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= quiz.passing_score;

    await supabase.from('quiz_attempts').insert([{
      user_id: userId,
      quiz_id: quiz.id,
      score,
      passed,
      answers: finalAnswers,
    }]);

    setResult({ score, passed });
    setSubmitting(false);
    setPhase('result');

    if (passed) onPassed();
  };

  const handleRetake = () => {
    setPhase('intro');
    setResult(null);
    setAnswers([]);
    setCurrentIndex(0);
    setSelected(null);
  };

  const isLast = currentIndex === questions.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
    >
      <div className="relative w-full max-w-xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold">
            <ClipboardList className="w-5 h-5" />
            Quiz: {moduleName}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-[320px]">
          {loading && (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500" />
            </div>
          )}

          {!loading && phase === 'intro' && quiz && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 flex flex-col items-center text-center gap-5"
            >
              <ClipboardList className="w-12 h-12 text-cyan-400" />
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Avaliação do Módulo</h3>
                <p className="text-gray-400 text-sm">{questions.length} perguntas · Nota mínima: <span className="text-cyan-400 font-semibold">{quiz.passing_score}%</span></p>
              </div>
              <p className="text-gray-500 text-sm">Responda uma pergunta por vez. Você pode tentar quantas vezes quiser.</p>
              <button
                onClick={handleStart}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all"
              >
                Iniciar Quiz
              </button>
            </motion.div>
          )}

          {!loading && phase === 'taking' && questions[currentIndex] && (
            <div className="p-6 flex flex-col gap-5">
              {/* Progress bar */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Pergunta {currentIndex + 1} de {questions.length}</span>
                <span>{Math.round(((currentIndex) / questions.length) * 100)}% concluído</span>
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-400 to-pink-500 rounded-full"
                  animate={{ width: `${((currentIndex) / questions.length) * 100}%` }}
                />
              </div>

              {/* Question */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <p className="text-white font-medium text-base mb-4 leading-relaxed">
                    {questions[currentIndex].question_text}
                  </p>
                  <div className="space-y-3">
                    {questions[currentIndex].options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => setSelected(i)}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${
                          selected === i
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                            : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-800'
                        }`}
                      >
                        <span className="font-bold mr-2 text-gray-400">{String.fromCharCode(65 + i)}.</span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              <button
                onClick={handleNext}
                disabled={selected === null || submitting}
                className="self-end px-6 py-2.5 rounded-xl bg-cyan-500 text-gray-950 font-bold hover:bg-cyan-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLast ? 'Enviar Respostas' : 'Próxima'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {phase === 'result' && result && quiz && (
            <QuizResult
              score={result.score}
              passed={result.passed}
              passingScore={quiz.passing_score}
              onRetake={handleRetake}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
