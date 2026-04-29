import { useState } from 'react';
import { Plus, Trash2, Sparkles, ChevronDown, ChevronUp, CheckCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '../../lib/supabase';
import { useQuiz } from '../../hooks/useQuiz';
import type { QuizQuestion } from '../../types/quiz';

interface Props {
  moduleName: string;
  moduleVideos: { title: string; content?: string }[];
}

interface DraftQuestion {
  question_text: string;
  options: string[];
  correct_index: number;
}

const emptyDraft = (): DraftQuestion => ({
  question_text: '',
  options: ['', '', '', ''],
  correct_index: 0,
});

export function QuizManager({ moduleName, moduleVideos }: Props) {
  const { quiz, questions, loading, refetch } = useQuiz(moduleName);

  const [expanded, setExpanded] = useState(false);
  const [creating, setCreating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [addingManual, setAddingManual] = useState(false);
  const [draft, setDraft] = useState<DraftQuestion>(emptyDraft());
  const [aiDraft, setAiDraft] = useState<DraftQuestion[]>([]);
  const [showAiReview, setShowAiReview] = useState(false);

  const handleCreateQuiz = async () => {
    setCreating(true);
    const { error } = await supabase.from('quizzes').insert([{
      module_name: moduleName,
      passing_score: 70,
      published: false,
    }]);
    if (error) toast.error('Erro ao criar quiz: ' + error.message);
    else { toast.success('Quiz criado!'); refetch(); }
    setCreating(false);
  };

  const handleAddManual = async () => {
    if (!quiz || !draft.question_text.trim() || draft.options.some(o => !o.trim())) {
      toast.error('Preencha a pergunta e todas as opções.');
      return;
    }
    const { error } = await supabase.from('quiz_questions').insert([{
      quiz_id: quiz.id,
      question_text: draft.question_text,
      options: draft.options,
      correct_index: draft.correct_index,
      position: questions.length,
    }]);
    if (error) toast.error('Erro ao salvar pergunta: ' + error.message);
    else { toast.success('Pergunta adicionada!'); setDraft(emptyDraft()); setAddingManual(false); refetch(); }
  };

  const handleDeleteQuestion = async (id: string) => {
    const { error } = await supabase.from('quiz_questions').delete().eq('id', id);
    if (error) toast.error('Erro ao excluir: ' + error.message);
    else { toast.success('Pergunta removida.'); refetch(); }
  };

  const handleGenerateAI = async () => {
    if (!quiz) return;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) { toast.error('Chave da API Gemini não configurada.'); return; }

    const videosContent = moduleVideos
      .map(v => `Título: ${v.title}\n${v.content ? `Conteúdo:\n${v.content}` : ''}`)
      .join('\n\n---\n\n');

    if (!videosContent.trim()) {
      toast.error('Os vídeos deste módulo não têm material complementar para gerar perguntas.');
      return;
    }

    setGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Você é um assistente educacional cristão. Com base no conteúdo abaixo dos vídeos do módulo "${moduleName}", crie 8 perguntas de múltipla escolha para avaliar o aprendizado dos alunos.

Conteúdo dos vídeos:
${videosContent}

Retorne APENAS um JSON válido (sem markdown, sem explicações) com este formato exato:
[
  {
    "question_text": "Pergunta aqui?",
    "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
    "correct_index": 0
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-lite',
        contents: prompt,
      });

      const text = response.text ?? '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Resposta inválida da IA');

      const parsed: DraftQuestion[] = JSON.parse(jsonMatch[0]);
      setAiDraft(parsed);
      setShowAiReview(true);
      toast.success(`${parsed.length} perguntas geradas! Revise antes de salvar.`);
    } catch (err: any) {
      toast.error('Erro ao gerar perguntas: ' + (err.message ?? 'Tente novamente'));
    }
    setGenerating(false);
  };

  const handleSaveAiDraft = async () => {
    if (!quiz) return;
    const rows = aiDraft.map((q, i) => ({
      quiz_id: quiz.id,
      question_text: q.question_text,
      options: q.options,
      correct_index: q.correct_index,
      position: questions.length + i,
    }));
    const { error } = await supabase.from('quiz_questions').insert(rows);
    if (error) toast.error('Erro ao salvar: ' + error.message);
    else { toast.success('Perguntas salvas!'); setAiDraft([]); setShowAiReview(false); refetch(); }
  };

  const handlePublish = async () => {
    if (!quiz) return;
    if (questions.length === 0) { toast.error('Adicione pelo menos uma pergunta antes de publicar.'); return; }
    setPublishing(true);
    const { error } = await supabase.from('quizzes').update({ published: !quiz.published }).eq('id', quiz.id);
    if (error) toast.error('Erro: ' + error.message);
    else { toast.success(quiz.published ? 'Quiz ocultado dos alunos.' : 'Quiz publicado!'); refetch(); }
    setPublishing(false);
  };

  return (
    <div className="mt-3 rounded-xl border border-gray-700 bg-gray-900/50 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-300 hover:bg-gray-800/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span>Quiz: {moduleName}</span>
          {quiz && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${quiz.published ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-700 text-gray-400'}`}>
              {quiz.published ? 'Publicado' : 'Rascunho'}
            </span>
          )}
          {quiz && <span className="text-xs text-gray-500">({questions.length} perguntas)</span>}
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-gray-800 pt-4">

              {loading && <p className="text-sm text-gray-500">Carregando...</p>}

              {/* Create quiz if doesn't exist */}
              {!loading && !quiz && (
                <button
                  onClick={handleCreateQuiz}
                  disabled={creating}
                  className="px-4 py-2 rounded-lg bg-cyan-500 text-gray-950 text-sm font-bold hover:bg-cyan-400 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Criando...' : '+ Criar Quiz para este Módulo'}
                </button>
              )}

              {/* Quiz controls */}
              {!loading && quiz && (
                <>
                  {/* AI Generation */}
                  {!showAiReview && (
                    <button
                      onClick={handleGenerateAI}
                      disabled={generating}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {generating ? 'Gerando com IA...' : 'Gerar Perguntas com IA (Gemini)'}
                    </button>
                  )}

                  {/* AI Draft Review */}
                  {showAiReview && aiDraft.length > 0 && (
                    <div className="space-y-3 bg-purple-900/20 border border-purple-700/40 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Revise as perguntas geradas pela IA
                        </p>
                        <button onClick={() => setShowAiReview(false)} className="text-xs text-gray-400 hover:text-white">Descartar</button>
                      </div>
                      {aiDraft.map((q, qi) => (
                        <div key={qi} className="bg-gray-900 rounded-lg p-3 space-y-2">
                          <p className="text-sm text-white font-medium">{qi + 1}. {q.question_text}</p>
                          <div className="space-y-1">
                            {q.options.map((opt, oi) => (
                              <p key={oi} className={`text-xs px-2 py-1 rounded ${oi === q.correct_index ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400'}`}>
                                {String.fromCharCode(65 + oi)}. {opt} {oi === q.correct_index && '✓'}
                              </p>
                            ))}
                          </div>
                          <button
                            onClick={() => setAiDraft(aiDraft.filter((_, i) => i !== qi))}
                            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Remover esta pergunta
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={handleSaveAiDraft}
                        className="w-full py-2 rounded-lg bg-cyan-500 text-gray-950 text-sm font-bold hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Salvar {aiDraft.length} Perguntas
                      </button>
                    </div>
                  )}

                  {/* Existing questions */}
                  {questions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Perguntas salvas</p>
                      {questions.map((q, i) => (
                        <div key={q.id} className="flex items-start justify-between gap-3 bg-gray-800/60 rounded-lg px-3 py-2">
                          <p className="text-sm text-gray-300 flex-1">{i + 1}. {q.question_text}</p>
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Manual add */}
                  {!addingManual ? (
                    <button
                      onClick={() => setAddingManual(true)}
                      className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Adicionar pergunta manualmente
                    </button>
                  ) : (
                    <div className="space-y-3 bg-gray-800/40 rounded-xl p-4">
                      <p className="text-sm font-medium text-gray-300">Nova Pergunta</p>
                      <textarea
                        value={draft.question_text}
                        onChange={e => setDraft({ ...draft, question_text: e.target.value })}
                        placeholder="Texto da pergunta..."
                        className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500 resize-none min-h-[60px]"
                      />
                      {draft.options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="correct"
                            checked={draft.correct_index === i}
                            onChange={() => setDraft({ ...draft, correct_index: i })}
                            className="accent-cyan-500"
                          />
                          <input
                            value={opt}
                            onChange={e => {
                              const opts = [...draft.options];
                              opts[i] = e.target.value;
                              setDraft({ ...draft, options: opts });
                            }}
                            placeholder={`Opção ${String.fromCharCode(65 + i)}`}
                            className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm outline-none focus:border-cyan-500"
                          />
                        </div>
                      ))}
                      <p className="text-xs text-gray-500">Selecione o botão ao lado da opção correta.</p>
                      <div className="flex gap-2">
                        <button onClick={handleAddManual} className="px-4 py-1.5 rounded-lg bg-cyan-500 text-gray-950 text-sm font-bold hover:bg-cyan-400 transition-colors">
                          Salvar
                        </button>
                        <button onClick={() => { setAddingManual(false); setDraft(emptyDraft()); }} className="px-4 py-1.5 rounded-lg bg-gray-700 text-gray-300 text-sm hover:bg-gray-600 transition-colors">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Publish toggle */}
                  <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {quiz.published ? 'Alunos podem ver este quiz.' : 'Quiz em rascunho — invisível para os alunos.'}
                    </p>
                    <button
                      onClick={handlePublish}
                      disabled={publishing}
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                        quiz.published
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-cyan-500 text-gray-950 hover:bg-cyan-400'
                      }`}
                    >
                      {publishing ? '...' : quiz.published ? 'Ocultar Quiz' : 'Publicar Quiz'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
