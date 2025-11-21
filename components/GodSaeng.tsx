
import React, { useState, useEffect } from 'react';
import { Challenge, UserRole } from '../types';
import { Award, Calendar, Camera, Flame, Zap, Plus, X, Trash2, BarChart2, Loader2, RefreshCw, PenTool, Check, Palette, Sparkles } from 'lucide-react';
import { fetchChallenges, saveChallengeToSupabase, deleteChallengeFromSupabase, getAllStudentChallengeStats, fetchHandwritingLogs, saveHandwritingLog } from '../services/storageService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, Legend } from 'recharts';

interface GodSaengProps {
  userId: string;
  role?: UserRole;
}

const CSAT_QUOTES = [
  "저 넓은 세상에서 큰 꿈을 펼쳐라",
  "가장 넓은 길은 언제나 내 마음속에",
  "나의 꿈은 맑은 바람이 되어서",
  "많고 많은 사람 중에 그대 한 사람",
  "너무 맑고 초롱한 그 중 하나 별이여",
  "그대만큼 사랑스러운 사람을 본 일이 없다",
  "흙에서 자란 내 마음 파아란 하늘빛",
  "어둠 속에서도 빛나는 별이 되어라",
  "당신의 꿈은 반드시 이루어진다"
];

const THEME_COLORS = [
  'bg-pink-500', 'bg-purple-500', 'bg-indigo-500', 'bg-teal-500', 
  'bg-blue-500', 'bg-orange-500', 'bg-rose-500', 'bg-emerald-500', 'bg-cyan-500'
];

const GodSaeng: React.FC<GodSaengProps> = ({ userId, role }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [slogan, setSlogan] = useState<string>("당신의 갓생을 응원합니다!");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Handwriting State
  const [currentQuote, setCurrentQuote] = useState('');
  const [handwritingInput, setHandwritingInput] = useState('');
  const [isHandwritingDone, setIsHandwritingDone] = useState(false);
  const [handwritingDate, setHandwritingDate] = useState<string | null>(null);
  
  // Teacher View Data
  const [studentStats, setStudentStats] = useState<{ name: string; totalDays: number; challengeCount: number }[]>([]);

  // New Challenge Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDays, setNewDays] = useState(30);
  const [newIcon, setNewIcon] = useState('');
  const [newColor, setNewColor] = useState('bg-indigo-500');

  const loadData = async () => {
    setIsLoading(true);
    
    if (role === UserRole.TEACHER) {
      // Teacher Logic: Load aggregated stats from DB
      const stats = await getAllStudentChallengeStats();
      setStudentStats(stats);
    } else {
      // Student Logic: Load personal data from DB
      const loadedData = await fetchChallenges(userId);
      setChallenges(loadedData);

      // Handwriting Logic
      const logs = await fetchHandwritingLogs(userId);
      const now = new Date();
      
      // Determine this week's quote (simple rotation based on week number to keep it consistent for everyone)
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const weekNumber = Math.ceil((((now.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7);
      const quoteIndex = weekNumber % CSAT_QUOTES.length;
      setCurrentQuote(CSAT_QUOTES[quoteIndex]);

      // Check if done this week (last 7 days is a simple check, or check same week number)
      // Ideally, check if the last log was created in the current week.
      // Simplified: check if there is a log within the last 6 days.
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 6); // Allow once every weekish
      
      const recentLog = logs.find(log => new Date(log.createdAt) > oneWeekAgo);
      if (recentLog) {
        setIsHandwritingDone(true);
        setHandwritingDate(recentLog.createdAt);
        setCurrentQuote(recentLog.phrase); // Show the one they did
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [userId, role]);

  useEffect(() => {
    if (role !== UserRole.TEACHER) {
      // Static motivational slogans instead of AI
      const slogans = [
        "작은 습관이 미래를 바꿉니다 ✨",
        "오늘도 1% 더 성장하는 나 🔥",
        "꾸준함이 재능을 이깁니다 🚀",
        "갓생 살기 딱 좋은 날씨네요 ☀️",
        "나를 믿고 끝까지 가봅시다 💪"
      ];
      setSlogan(slogans[Math.floor(Math.random() * slogans.length)]);
    }
  }, [role]);

  const handleRefreshStats = () => {
    loadData();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProofImage(url);
    }
  };

  const handleCertify = async () => {
    if (!selectedChallenge || !proofImage) return;
    
    // Optimistic UI update
    const updatedChallenge = { 
      ...selectedChallenge, 
      daysCompleted: Math.min(selectedChallenge.daysCompleted + 1, selectedChallenge.daysTotal) 
    };

    setChallenges(prev => prev.map(c => c.id === selectedChallenge.id ? updatedChallenge : c));
    
    // DB Update
    await saveChallengeToSupabase(userId, updatedChallenge);
    
    alert(`🎉 ${selectedChallenge.title} 인증 완료! 경험치가 상승했습니다.`);
    setSelectedChallenge(null);
    setProofImage(null);
  };

  const handleDeleteChallenge = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (window.confirm('정말 이 챌린지를 삭제하시겠습니까?')) {
      await deleteChallengeFromSupabase(id);
      setChallenges(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleAddChallenge = async () => {
    if (!newTitle.trim()) return;
    
    const icons = ['🎯', '🚀', '💎', '🍀'];
    const finalIcon = newIcon || icons[Math.floor(Math.random() * icons.length)];
    
    const newChallenge: Challenge = {
      id: Date.now().toString(),
      title: newTitle,
      description: newDesc || '나만의 멋진 챌린지',
      daysTotal: newDays,
      daysCompleted: 0,
      badgeIcon: finalIcon,
      color: newColor
    };

    // DB Save
    await saveChallengeToSupabase(userId, newChallenge);
    
    setChallenges(prev => [...prev, newChallenge]);
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDesc('');
    setNewDays(30);
    setNewIcon('');
    setNewColor('bg-indigo-500');
  };

  const handleHandwritingSubmit = async () => {
    if (handwritingInput.trim() === currentQuote) {
      await saveHandwritingLog(userId, currentQuote);
      setIsHandwritingDone(true);
      setHandwritingDate(new Date().toISOString());
      alert("필적 확인 완료! 마음가짐이 기록되었습니다.");
    } else {
      alert("문구가 일치하지 않습니다. 띄어쓰기를 포함하여 정확히 입력해주세요.");
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600 w-8 h-8" /></div>;
  }

  // Teacher View
  if (role === UserRole.TEACHER) {
    return (
      <div className="space-y-8 pb-20">
        <header className="flex flex-col items-center justify-center space-y-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-50 text-indigo-600 mb-1">
            <BarChart2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">갓생 챌린지 리더보드</h1>
          <p className="text-slate-500 text-sm text-center">
            학생들의 챌린지 참여 현황을 한눈에 확인하세요.
          </p>
          <button 
            onClick={handleRefreshStats}
            className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 bg-slate-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> 데이터 새로고침
          </button>
        </header>

        {studentStats.length === 0 ? (
           <div className="text-center py-16 bg-white rounded-2xl border-dashed border-2 border-slate-200">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-bold">아직 챌린지에 참여한 학생이 없습니다.</p>
              <p className="text-xs text-slate-400 mt-1">학생들이 챌린지를 시작하면 이곳에 그래프가 나타납니다.</p>
           </div>
        ) : (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-6 pl-2 border-l-4 border-indigo-500">
              학생별 누적 달성일 비교
            </h2>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={studentStats} 
                  layout="vertical" 
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    tick={{ fontSize: 12, fill: '#475569', fontWeight: '600' }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value}일`, '총 인증일']}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="totalDays" name="총 인증 달성일" radius={[0, 6, 6, 0]} barSize={24}>
                    {studentStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index < 3 ? '#6366f1' : '#cbd5e1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
              <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                📊 상위 3명의 학생은 보라색으로 표시됩니다.
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Student View
  const totalBadges = challenges.filter(c => c.daysCompleted === c.daysTotal).length;
  const currentStreak = challenges.length > 0 ? Math.max(...challenges.map(c => c.daysCompleted > 0 ? c.daysCompleted : 0)) : 0;
  const level = Math.floor(challenges.reduce((acc, cur) => acc + cur.daysCompleted, 0) / 5) + 1;

  return (
    <div className="space-y-8 pb-20">
      <header className="text-center space-y-2">
        <div className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold mb-2 animate-bounce">
          GOD-SAENG PROJECT
        </div>
        <h1 className="text-3xl font-black text-slate-900 italic">#오늘도_갓생산다</h1>
        <p className="text-slate-500 text-sm">{slogan}</p>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center transform hover:scale-105 transition-transform">
          <div className="flex justify-center mb-2 text-orange-500"><Flame /></div>
          <div className="text-2xl font-bold text-slate-800">{currentStreak}일</div>
          <div className="text-xs text-slate-400">최고 기록</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center transform hover:scale-105 transition-transform">
          <div className="flex justify-center mb-2 text-blue-500"><Award /></div>
          <div className="text-2xl font-bold text-slate-800">{totalBadges}개</div>
          <div className="text-xs text-slate-400">획득 뱃지</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center transform hover:scale-105 transition-transform">
          <div className="flex justify-center mb-2 text-purple-500"><Zap /></div>
          <div className="text-2xl font-bold text-slate-800">Lv.{level}</div>
          <div className="text-xs text-slate-400">현재 레벨</div>
        </div>
      </div>

      {/* Handwriting Section (OMR Style) */}
      <div className="bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden max-w-md mx-auto">
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-300 flex justify-between items-center">
           <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
             <PenTool className="w-3 h-3" /> 주간 필적 확인란
           </span>
           <span className="text-[10px] text-slate-400 tracking-widest">2026학년도 대학수학능력시험 대비</span>
        </div>
        <div className="p-6 flex flex-col items-center space-y-4 bg-[#fffbf0]">
          <p className="text-sm text-slate-500 font-medium mb-2">아래 문구를 정자로 기재하시오.</p>
          
          <div className="font-serif text-xl md:text-2xl text-slate-800 text-center leading-relaxed tracking-wide px-2 py-4 border-y-2 border-slate-200 w-full">
            "{currentQuote}"
          </div>

          {isHandwritingDone ? (
            <div className="w-full pt-2 relative">
               <div className="w-full p-3 bg-transparent border-b border-slate-400 text-center font-serif text-lg text-slate-600">
                 {currentQuote}
               </div>
               <div className="absolute top-[-10px] right-4 rotate-[-12deg] border-4 border-red-500 text-red-500 rounded-full w-16 h-16 flex items-center justify-center opacity-80 animate-fade-in">
                  <span className="font-bold text-xs transform scale-110">확인됨</span>
               </div>
               <p className="text-[10px] text-center text-slate-400 mt-2">
                 {new Date(handwritingDate || '').toLocaleDateString()} 기록 완료
               </p>
            </div>
          ) : (
            <div className="w-full space-y-3">
              <input 
                type="text" 
                value={handwritingInput}
                onChange={(e) => setHandwritingInput(e.target.value)}
                placeholder="문구를 똑같이 입력하세요"
                className="w-full p-3 bg-white border border-slate-300 focus:border-slate-800 outline-none text-center font-serif text-lg placeholder:font-sans placeholder:text-sm placeholder:text-slate-300"
              />
              <button 
                onClick={handleHandwritingSubmit}
                disabled={!handwritingInput}
                className="w-full py-2 bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-colors disabled:bg-slate-300"
              >
                확인
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Challenge List Header */}
      <div className="flex justify-between items-center pt-4">
        <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
          <Calendar className="w-5 h-5" /> 진행 중인 챌린지
        </h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" /> 추가
        </button>
      </div>
        
      <div className="space-y-4">
        {challenges.map((challenge) => (
          <div key={challenge.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden transition-all hover:shadow-md group">
            <div className={`absolute top-0 left-0 w-1 h-full ${challenge.color}`}></div>
            
            <button 
              type="button"
              onClick={(e) => handleDeleteChallenge(e, challenge.id)}
              className="absolute top-2 right-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full p-2 transition-all z-20"
              title="챌린지 삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl bg-slate-50 w-12 h-12 flex items-center justify-center rounded-xl border border-slate-100">
                  {challenge.badgeIcon}
                </div>
                <div className="pr-8">
                  <h3 className="font-bold text-slate-900">{challenge.title}</h3>
                  <p className="text-xs text-slate-500">{challenge.description}</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
               <div className="flex-1 pr-4">
                <div className="relative">
                  <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
                    <span>진행률</span>
                    <span>{Math.round((challenge.daysCompleted / challenge.daysTotal) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${challenge.color} transition-all duration-700 ease-out`} 
                      style={{ width: `${Math.min((challenge.daysCompleted / challenge.daysTotal) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
               </div>
               
               <div>
                {challenge.daysCompleted >= challenge.daysTotal ? (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold border border-yellow-200">
                    COMPLETED
                  </span>
                ) : (
                  <button 
                    onClick={() => setSelectedChallenge(challenge)}
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg active:scale-95 transition-transform flex items-center gap-2 shadow-lg shadow-slate-200 z-10 relative"
                  >
                    <Camera className="w-3 h-3" /> 인증
                  </button>
                )}
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Logic Remains Same */}
      {selectedChallenge && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-6 animate-fade-in-up shadow-2xl">
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900">{selectedChallenge.title} 인증</h3>
              <p className="text-slate-500 text-sm mt-1">오늘 하루도 고생했어요! 📸</p>
            </div>

            <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 flex flex-col items-center justify-center relative group hover:bg-slate-100 transition-colors">
              {proofImage ? (
                <img src={proofImage} alt="Proof" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Camera className="w-12 h-12 text-slate-300 mb-2 group-hover:text-indigo-400 transition-colors" />
                  <span className="text-slate-400 text-sm group-hover:text-indigo-500 font-medium">사진을 탭하여 업로드</span>
                </>
              )}
              <input 
                type="file" 
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileUpload}
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => { setSelectedChallenge(null); setProofImage(null); }}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
              >
                취소
              </button>
              <button 
                onClick={handleCertify}
                disabled={!proofImage}
                className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors shadow-lg ${proofImage ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-slate-300 cursor-not-allowed'}`}
              >
                인증 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm animate-fade-in-up shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-xl text-slate-800">새 챌린지 도전</h3>
               <button onClick={() => setShowAddModal(false)} className="p-1 bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">챌린지 이름</label>
                <div className="flex gap-2">
                  <input 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="flex-1 p-4 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
                    placeholder="예: 하루 물 2L 마시기"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">테마 설정 (아이콘 & 색상)</label>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                   <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm ${newColor} text-white transition-colors duration-300`}>
                        {newIcon || '✨'}
                      </div>
                      <input 
                        value={newIcon}
                        onChange={(e) => setNewIcon(e.target.value)}
                        className="flex-1 p-3 bg-white rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-500"
                        placeholder="아이콘 (이모지)"
                      />
                   </div>
                   
                   <div>
                     <span className="text-xs font-bold text-slate-400 mb-2 block">대표 색상 선택</span>
                     <div className="flex flex-wrap gap-2">
                        {THEME_COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => setNewColor(color)}
                            className={`w-8 h-8 rounded-full ${color} transition-transform hover:scale-110 ${newColor === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110 shadow-md' : 'opacity-70 hover:opacity-100'}`}
                          />
                        ))}
                     </div>
                   </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">설명</label>
                <input 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                  placeholder="인증 방법 간단 설명"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">목표 기간 ({newDays}일)</label>
                <input 
                  type="range" 
                  min="3" 
                  max="100" 
                  value={newDays} 
                  onChange={(e) => setNewDays(parseInt(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
              <button 
                onClick={handleAddChallenge}
                disabled={!newTitle.trim()}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg shadow-lg shadow-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
              >
                도전 시작하기 🔥
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GodSaeng;
