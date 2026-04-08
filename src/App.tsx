import React, { useState, useEffect, useRef } from 'react';
import { Play, CheckCircle, Circle, Plus, Award, Download, Trash2, Video as VideoIcon, Sparkles, LogOut, X, Lock, Mail, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import ReactPlayer from 'react-player';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from './lib/supabase';

type User = {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
};

type Video = {
  id: string;
  title: string;
  url: string;
  module: string;
};

const getYouTubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const getYouTubeThumbnail = (url: string) => {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
};

const CertificateModal = ({ moduleName, progress, user, onClose }: any) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const bgImageRef = useRef<HTMLImageElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [base64Bg, setBase64Bg] = useState<string | null>(null);

  useEffect(() => {
    // Load image into canvas and convert to JPEG for maximum jsPDF compatibility
    const prepareImage = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          setBase64Bg(canvas.toDataURL('image/jpeg', 1.0));
        }
      };
      img.onerror = (err) => {
        console.error("Error loading image for PDF", err);
      };
      img.src = "/certificado-bg.png";
    };
    prepareImage();
  }, []);

  const handleDownload = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    const loadingToast = toast.loading('Gerando certificado...');
    
    try {
      if (!base64Bg) {
        throw new Error("Imagem de fundo ainda está carregando.");
      }

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // 1. Add background image (JPEG is much more reliable in jsPDF)
      pdf.addImage(base64Bg, 'JPEG', 0, 0, pdfWidth, pdfHeight);

      // 2. Add Student Name (Y: ~31.5%)
      pdf.setFont('times', 'normal');
      pdf.setFontSize(36);
      pdf.setTextColor(17, 24, 39);
      pdf.text(user.name, pdfWidth / 2, pdfHeight * 0.315, { align: 'center' });

      // 3. Add Module Name (Y: ~44%)
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(18);
      pdf.setTextColor(31, 41, 55);
      pdf.text(moduleName.toUpperCase(), pdfWidth / 2, pdfHeight * 0.44, { align: 'center' });

      // 4. Add Date (X: ~23.1%, Y: ~64.2%)
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(14);
      pdf.text(new Date().toLocaleDateString('pt-BR'), pdfWidth * 0.231, pdfHeight * 0.642, { align: 'center' });

      pdf.save(`Certificado_${moduleName.replace(/\s+/g, '_')}.pdf`);
      toast.success('Certificado baixado com sucesso!', { id: loadingToast });
    } catch (error) {
      console.error('Error generating PDF', error);
      toast.error('Aguarde a imagem carregar e tente novamente.', { id: loadingToast });
    } finally {
      setIsGenerating(false);
    }
  };

  const isComplete = progress.percent === 100;
  const remaining = progress.total - progress.completed;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl my-8">
        <button onClick={onClose} className="absolute -top-12 right-0 text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors z-10">
          <X className="w-8 h-8" />
        </button>

        <div className="relative rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 shadow-2xl">
          
          {/* Certificate Container */}
          <div className="relative">
            {/* The Certificate itself */}
            <div 
              ref={certificateRef}
              className={`w-full aspect-[1.414/1] relative flex flex-col items-center justify-center overflow-hidden bg-white`}
            >
              {/* Background Image */}
              <img 
                ref={bgImageRef}
                src="/certificado-bg.png" 
                alt="Certificado Background" 
                className="absolute inset-0 w-full h-full object-cover z-0"
              />

              {/* Overlay Text - Absolute positioning for precise alignment */}
              <div className="absolute inset-0 z-10">
                
                {/* Student Name */}
                <div className="absolute w-full text-center px-12" style={{ top: '31.5%' }}>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-normal text-gray-900 tracking-wide" style={{ fontFamily: 'serif' }}>
                    {user.name}
                  </h2>
                </div>
                
                {/* Module Name */}
                <div className="absolute w-full text-center px-12" style={{ top: '44%' }}>
                  <h3 className="text-lg md:text-xl lg:text-2xl font-medium text-gray-800 uppercase tracking-wider">
                    {moduleName}
                  </h3>
                </div>
                
                {/* Date */}
                <div className="absolute text-center w-48" style={{ top: '64.2%', left: '23.1%', transform: 'translateX(-50%)' }}>
                  <p className="font-normal text-gray-800 text-sm md:text-base">{new Date().toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="bg-gray-950 p-6 flex justify-center border-t border-gray-800">
            <button 
              onClick={handleDownload}
              className="px-8 py-4 rounded-xl font-bold text-gray-950 bg-cyan-400 hover:bg-cyan-300 transition-colors flex items-center shadow-[0_0_20px_rgba(34,211,238,0.4)]"
            >
              <Download className="w-6 h-6 mr-3" />
              Baixar Certificado em PDF
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [videos, setVideos] = useState<Video[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, boolean>>({});
  
  // Auth States
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register States
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [city, setCity] = useState('');
  const [church, setChurch] = useState('');
  const [hasCell, setHasCell] = useState('nao');
  const [cellGroup, setCellGroup] = useState('');
  const [hasMinistry, setHasMinistry] = useState('nao');
  const [ministry, setMinistry] = useState('');
  const [conversionTime, setConversionTime] = useState('');

  // Admin States
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newModule, setNewModule] = useState('');

  // Player States
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [activeCertificateModule, setActiveCertificateModule] = useState<string | null>(null);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [lastPlayedSeconds, setLastPlayedSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Supabase Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'Aluno',
          email: session.user.email || '',
          isAdmin: session.user.email === 'byffrk@gmail.com'
        });
      }
      setLoadingAuth(false);
    }).catch((error) => {
      console.error('Error getting session:', error);
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'Aluno',
          email: session.user.email || '',
          isAdmin: session.user.email === 'byffrk@gmail.com'
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Data from Supabase
  useEffect(() => {
    if (user) {
      fetchVideos();
      fetchProgress(user.id);
    }
  }, [user]);

  const fetchVideos = async () => {
    const { data, error } = await supabase.from('videos').select('*').order('created_at', { ascending: true });
    if (error) {
      console.error('Erro ao buscar vídeos:', error);
    } else if (data) {
      setVideos(data);
    }
  };

  const fetchProgress = async (userId: string) => {
    const { data, error } = await supabase.from('user_progress').select('video_id, completed').eq('user_id', userId);
    if (error) {
      console.error('Erro ao buscar progresso:', error);
    } else if (data) {
      const progressMap: Record<string, boolean> = {};
      data.forEach(p => {
        progressMap[p.video_id] = p.completed;
      });
      setUserProgress(progressMap);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error('Erro ao fazer login: ' + error.message);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          birthDate,
          city,
          church,
          cellGroup: hasCell === 'sim' ? cellGroup : '',
          ministry: hasMinistry === 'sim' ? ministry : '',
          conversionTime
        }
      }
    });

    if (error) {
      toast.error('Erro ao cadastrar: ' + error.message);
    } else {
      toast.success('Cadastro realizado com sucesso! Você já pode fazer login.');
      setAuthMode('login');
      setPassword('');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProgress({});
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim() || !newModule.trim()) return;
    
    const { data, error } = await supabase.from('videos').insert([{
      title: newTitle,
      url: newUrl,
      module: newModule
    }]).select();

    if (error) {
      toast.error('Erro ao adicionar aula: ' + error.message);
    } else if (data) {
      setVideos([...videos, data[0]]);
      setNewTitle('');
      setNewUrl('');
      toast.success('Aula adicionada com sucesso!');
    }
  };

  const deleteVideo = async (id: string) => {
    // Custom confirm using toast
    toast('Tem certeza que deseja excluir esta aula?', {
      action: {
        label: 'Excluir',
        onClick: async () => {
          const { error } = await supabase.from('videos').delete().eq('id', id);
          if (error) {
            toast.error('Erro ao excluir aula: ' + error.message);
          } else {
            setVideos(videos.filter(v => v.id !== id));
            toast.success('Aula excluída com sucesso!');
          }
        }
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {}
      }
    });
  };

  const openVideo = (video: Video) => {
    setActiveVideo(video);
    setWatchedSeconds(0);
    setLastPlayedSeconds(0);
    setDuration(0);
  };

  const closeVideo = () => {
    setActiveVideo(null);
  };

  const completedCount = videos.filter(v => userProgress[v.id]).length;
  const totalVideos = videos.length;
  const progressPercent = totalVideos === 0 ? 0 : Math.round((completedCount / totalVideos) * 100);

  const modules = Array.from(new Set(videos.map(v => v.module)));

  const getModuleProgress = (moduleName: string) => {
    const moduleVideos = videos.filter(v => v.module === moduleName);
    const completed = moduleVideos.filter(v => userProgress[v.id]).length;
    return {
      total: moduleVideos.length,
      completed,
      percent: moduleVideos.length === 0 ? 0 : Math.round((completed / moduleVideos.length) * 100)
    };
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-4 selection:bg-cyan-500/30">
        <Toaster theme="dark" position="top-center" />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-600/10 blur-[120px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-3xl p-8 shadow-2xl relative z-10"
        >
          <div className="text-center mb-8">
            <img src="https://lh3.googleusercontent.com/d/1pJASlSKVV2jccAQOE1X4UYVgQd1m6k1q" alt="Mergulhando na Palavra" className="h-24 mx-auto mb-4 object-contain" referrerPolicy="no-referrer" />
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-pink-500">
              Mergulhando na Palavra
            </h1>
            <p className="text-gray-400 mt-2">Plataforma de Estudo Online</p>
          </div>

          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">E-mail</label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-gray-950 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" placeholder="seu@email.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Senha</label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-gray-950 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" placeholder="••••••••" />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => setAuthMode('forgot')} className="text-sm text-cyan-400 hover:underline">Esqueceu a senha?</button>
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium py-3 rounded-xl hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all">
                Entrar
              </button>
              <div className="text-center mt-4">
                <span className="text-gray-400">Não tem uma conta? </span>
                <button type="button" onClick={() => setAuthMode('register')} className="text-pink-400 hover:underline font-medium">Cadastre-se aqui</button>
              </div>
            </form>
          )}

          {authMode === 'forgot' && (
            <form onSubmit={(e) => { e.preventDefault(); toast.success('Link de recuperação enviado (simulação).'); setAuthMode('login'); }} className="space-y-4">
              <p className="text-gray-300 text-sm text-center mb-4">Digite seu e-mail para receber o link de recuperação de senha.</p>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">E-mail</label>
                <input type="email" required className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" placeholder="seu@email.com" />
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium py-3 rounded-xl hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all">
                Recuperar Senha
              </button>
              <button type="button" onClick={() => setAuthMode('login')} className="w-full text-gray-400 hover:text-white py-2">Voltar ao Login</button>
            </form>
          )}

          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nome Completo (para certificado)</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">E-mail</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Senha</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Data de Nascimento</label>
                <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} required className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Cidade que reside</label>
                <input type="text" value={city} onChange={e => setCity(e.target.value)} required className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Igreja que frequenta</label>
                <input type="text" value={church} onChange={e => setChurch(e.target.value)} required className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Frequenta célula?</label>
                <select value={hasCell} onChange={e => setHasCell(e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500">
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </select>
              </div>
              {hasCell === 'sim' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Qual célula?</label>
                  <input type="text" value={cellGroup} onChange={e => setCellGroup(e.target.value)} required className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Serve em algum ministério?</label>
                <select value={hasMinistry} onChange={e => setHasMinistry(e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500">
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </select>
              </div>
              {hasMinistry === 'sim' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Qual ministério?</label>
                  <input type="text" value={ministry} onChange={e => setMinistry(e.target.value)} required className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Quanto tempo de convertido?</label>
                <input type="text" value={conversionTime} onChange={e => setConversionTime(e.target.value)} required placeholder="Ex: 2 anos" className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-cyan-500" />
              </div>

              <button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium py-3 rounded-xl hover:shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all mt-4">
                Finalizar Cadastro
              </button>
              <button type="button" onClick={() => setAuthMode('login')} className="w-full text-gray-400 hover:text-white py-2">Já tenho uma conta</button>
            </form>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-cyan-500/30 pb-20">
      <Toaster theme="dark" position="top-center" />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-600/10 blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center text-cyan-400 font-bold text-xl">
            <img src="https://lh3.googleusercontent.com/d/1pJASlSKVV2jccAQOE1X4UYVgQd1m6k1q" alt="Logo" className="h-8 mr-3 object-contain" referrerPolicy="no-referrer" />
            Mergulhando na Palavra
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center text-sm text-gray-300 bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700">
              <UserIcon className="w-4 h-4 mr-2 text-pink-400" />
              {user.name} {user.isAdmin && <span className="ml-2 text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded">ADM</span>}
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors" title="Sair">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        
        {/* Progress Section */}
        {!user.isAdmin && (
          <motion.section 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12 p-6 rounded-2xl bg-gray-900/50 border border-gray-800 backdrop-blur-sm relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-800">
              <motion.div 
                className="h-full bg-gradient-to-r from-cyan-400 to-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2 flex items-center">
                  Seu Progresso
                  {progressPercent === 100 && <Award className="w-6 h-6 ml-2 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />}
                </h2>
                <p className="text-gray-400">
                  {completedCount} de {totalVideos} aulas concluídas
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  * Assista pelo menos 75% da aula para registrar como concluída.
                </p>
              </div>
              
              <div className="flex items-center justify-center w-24 h-24 rounded-full border-4 border-gray-800 relative">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-800" />
                  <motion.circle 
                    cx="50" cy="50" r="46" fill="none" stroke="url(#gradient)" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray="289.026"
                    initial={{ strokeDashoffset: 289.026 }}
                    animate={{ strokeDashoffset: 289.026 - (289.026 * progressPercent) / 100 }}
                    transition={{ duration: 0.8 }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="text-2xl font-bold text-white relative z-10">{progressPercent}%</span>
              </div>
            </div>
          </motion.section>
        )}

        {/* Admin Add Video Form */}
        {user.isAdmin && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <form onSubmit={handleAddVideo} className="p-6 rounded-2xl bg-gray-900/80 border border-cyan-900/50 shadow-[0_0_15px_rgba(34,211,238,0.1)] backdrop-blur-md">
              <h3 className="text-lg font-medium text-cyan-400 mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Painel ADM: Adicionar Nova Aula
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Módulo</label>
                  <input type="text" value={newModule} onChange={(e) => setNewModule(e.target.value)} required placeholder="Ex: Módulo da Criação" className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Título da Aula</label>
                  <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Link do Vídeo (YouTube)</label>
                  <input type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} required className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-pink-500/50 outline-none" />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button type="submit" className="bg-cyan-500 text-gray-950 px-6 py-3 rounded-xl font-bold hover:bg-cyan-400 transition-colors flex items-center">
                  <Plus className="w-5 h-5 mr-2" /> Adicionar Aula
                </button>
              </div>
            </form>
          </motion.section>
        )}

        {/* Video List */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
            <VideoIcon className="w-6 h-6 mr-3 text-pink-400" />
            Trilha de Aulas
          </h3>
          
          <div className="space-y-8">
            {modules.length === 0 ? (
              <div className="text-center py-12 bg-gray-900/30 rounded-2xl border border-gray-800 border-dashed">
                <p className="text-gray-500">Nenhuma aula disponível no momento.</p>
              </div>
            ) : (
              modules.map((moduleName, moduleIndex) => {
                const moduleVideos = videos.filter(v => v.module === moduleName);
                const progress = getModuleProgress(moduleName);
                
                return (
                  <div key={moduleName} className="mb-8">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <Sparkles className="w-5 h-5 mr-2 text-cyan-400" />
                      {moduleName}
                    </h3>
                    <div className="space-y-3">
                      {moduleVideos.map((video, index) => {
                        const isCompleted = userProgress[video.id];
                        return (
                          <motion.div
                            key={video.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`group flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                              isCompleted 
                                ? 'bg-gray-900/40 border-cyan-900/50 shadow-[0_0_10px_rgba(34,211,238,0.05)]' 
                                : 'bg-gray-900/80 border-gray-800 hover:border-gray-700'
                            }`}
                          >
                            <div className="flex items-center flex-1 min-w-0 mr-4">
                              <div className="flex-shrink-0 mr-4 relative w-32 h-20 rounded-lg overflow-hidden bg-gray-800 border border-gray-700 flex items-center justify-center">
                                {getYouTubeThumbnail(video.url) ? (
                                  <img 
                                    src={getYouTubeThumbnail(video.url)!} 
                                    alt="Thumbnail" 
                                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-90 transition-opacity"
                                  />
                                ) : (
                                  <VideoIcon className="w-8 h-8 text-gray-600 absolute" />
                                )}
                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                  {isCompleted ? (
                                    <CheckCircle className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] bg-gray-900/60 rounded-full" />
                                  ) : (
                                    <Play className="w-8 h-8 text-white drop-shadow-lg opacity-0 group-hover:opacity-100 transition-opacity bg-cyan-500/80 rounded-full p-1.5" />
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h4 className={`text-lg font-medium truncate ${isCompleted ? 'text-gray-400' : 'text-gray-100'}`}>
                                  {video.title}
                                </h4>
                                <button 
                                  onClick={() => openVideo(video)}
                                  className="text-sm text-pink-400 hover:text-pink-300 hover:underline inline-flex items-center mt-1"
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  Assistir Aula
                                </button>
                              </div>
                            </div>
                            
                            {user.isAdmin && (
                              <button onClick={() => deleteVideo(video.id)} className="p-2 text-gray-600 hover:text-red-400 bg-gray-800 hover:bg-red-400/10 rounded-lg transition-colors">
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </motion.div>
                        );
                      })}
                      
                      {/* Certificate Item */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: moduleVideos.length * 0.05 }}
                        onClick={() => progress.percent === 100 && setActiveCertificateModule(moduleName)}
                        className={`cursor-pointer group flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                          progress.percent === 100 
                            ? 'bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]' 
                            : 'bg-gray-900/80 border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center flex-1 min-w-0 mr-4">
                          <div className="flex-shrink-0 mr-4">
                            <Award className={`w-8 h-8 ${progress.percent === 100 ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]' : 'text-gray-600'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-lg font-medium truncate ${progress.percent === 100 ? 'text-yellow-400' : 'text-gray-400'}`}>
                              Certificado: {moduleName}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {progress.percent === 100 ? 'Disponível para visualizar/baixar' : `Progresso: ${progress.percent}%`}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.section>

      </div>

      {/* Video Player Modal */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
          >
            <div className="w-full max-w-5xl bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
              <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-950">
                <h3 className="text-lg font-medium text-white truncate pr-4">{activeVideo.title}</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 hidden sm:inline">Velocidade:</span>
                    <select 
                      value={playbackRate} 
                      onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                      className="bg-gray-800 text-white text-sm rounded-lg px-2 py-1 border border-gray-700 outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value={0.5}>0.5x</option>
                      <option value={0.75}>0.75x</option>
                      <option value={1}>1x (Normal)</option>
                      <option value={1.25}>1.25x</option>
                      <option value={1.5}>1.5x</option>
                      <option value={1.75}>1.75x</option>
                      <option value={2}>2x</option>
                    </select>
                  </div>
                  <button onClick={closeVideo} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="relative pt-[56.25%] bg-black">
                <ReactPlayer
                  src={activeVideo.url}
                  className="absolute top-0 left-0"
                  width="100%"
                  height="100%"
                  controls
                  playing
                  playbackRate={playbackRate}
                  onDurationChange={(e) => {
                    const duration = (e.target as HTMLVideoElement).duration;
                    if (duration) setDuration(duration);
                  }}
                  onTimeUpdate={(e) => {
                    const playedSeconds = (e.target as HTMLVideoElement).currentTime;
                    const diff = playedSeconds - lastPlayedSeconds;
                    if (diff > 0 && diff < 2) {
                      setWatchedSeconds(prev => prev + diff);
                    }
                    setLastPlayedSeconds(playedSeconds);

                    if (duration > 0 && activeVideo && user) {
                      const percentWatched = watchedSeconds / duration;
                      if (percentWatched >= 0.75 && !userProgress[activeVideo.id]) {
                        setUserProgress(prev => ({ ...prev, [activeVideo.id]: true }));
                        supabase.from('user_progress').insert([{
                          user_id: user.id,
                          video_id: activeVideo.id,
                          completed: true
                        }]).then(({ error }) => {
                          if (error) {
                            console.error('Erro ao salvar progresso:', error);
                            setUserProgress(prev => {
                              const newProgress = { ...prev };
                              delete newProgress[activeVideo.id];
                              return newProgress;
                            });
                          }
                        });
                      }
                    }
                  }}
                />
              </div>
              
              <div className="p-4 bg-gray-950 flex justify-between items-center text-sm">
                <div className="text-gray-400">
                  Progresso da visualização: <span className="text-cyan-400 font-mono">{duration > 0 ? Math.round((watchedSeconds / duration) * 100) : 0}%</span>
                  <span className="ml-2 text-xs text-gray-500">(Necessário 75% para concluir)</span>
                </div>
                {userProgress[activeVideo.id] && (
                  <div className="flex items-center text-cyan-400 font-medium">
                    <CheckCircle className="w-4 h-4 mr-1" /> Aula Concluída
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Certificate Modal */}
      <AnimatePresence>
        {activeCertificateModule && (
          <CertificateModal 
            moduleName={activeCertificateModule} 
            progress={getModuleProgress(activeCertificateModule)} 
            user={user} 
            onClose={() => setActiveCertificateModule(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
