import { CheckCircle, XCircle, RotateCcw, X } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  score: number;
  passed: boolean;
  passingScore: number;
  onRetake: () => void;
  onClose: () => void;
}

export function QuizResult({ score, passed, passingScore, onRetake, onClose }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center text-center px-6 py-10 gap-6"
    >
      {passed ? (
        <>
          <div className="w-20 h-20 rounded-full bg-cyan-500/20 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Parabéns! Você foi aprovado!</h2>
            <p className="text-gray-400">Sua nota: <span className="text-cyan-400 font-bold text-xl">{score}%</span></p>
            <p className="text-sm text-gray-500 mt-1">O certificado deste módulo foi desbloqueado.</p>
          </div>
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-xl bg-cyan-500 text-gray-950 font-bold hover:bg-cyan-400 transition-colors"
          >
            Ver Certificado
          </button>
        </>
      ) : (
        <>
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
            <XCircle className="w-12 h-12 text-red-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Não foi dessa vez…</h2>
            <p className="text-gray-400">
              Sua nota: <span className="text-red-400 font-bold text-xl">{score}%</span>
              <span className="text-gray-500 text-sm ml-2">(mínimo: {passingScore}%)</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">Revise o material e tente novamente.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onRetake}
              className="px-6 py-3 rounded-xl bg-pink-500 text-white font-bold hover:bg-pink-400 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Tentar Novamente
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-gray-800 text-gray-300 font-medium hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Fechar
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}
