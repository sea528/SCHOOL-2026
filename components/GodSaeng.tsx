import React, { useState, useEffect } from 'react';
import { Challenge } from '../types';
import { Award, Calendar, Camera, Flame, Zap, Plus, X } from 'lucide-react';
import { generateChallengeSummary } from '../services/geminiService';
import { loadUserData, saveUserData } from '../services/storageService';

interface GodSaengProps {
  userId: string;
}

const initialChallenges: Challenge[] = [
  { id: '1', title: '미라클 모닝 6AM', description: '아침 6시 기상 인증샷 찍기', daysTotal: 30, daysCompleted: 12, badgeIcon: '🌅', color: 'bg-orange-500' },
  { id: '2', title: '야자 2시간 순공', description: '타임랩스 촬영하여 인증', daysTotal: 14, daysCompleted: 14, badgeIcon: '🔥', color: 'bg-red-500' },
  { id: '3', title: '영단어 50개 암기', description: '퀴즈 점수 90점 이상 인증', daysTotal: 30, daysCompleted: 5, badgeIcon: '🧠', color: 'bg-blue-500' },
];

const GodSaeng: React.FC<GodSaengProps> = ({ userId }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [aiSlogan, setAiSlogan] = useState<string>("당신의 갓생을 응원합니다!");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New Challenge Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDays, setNewDays] = useState(30);

  useEffect(() => {
    setIsLoading(true);
    const loadedData = loadUserData(userId, 'god_saeng', initialChallenges);
    setChallenges(loadedData);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!isLoading && challenges.length > 0) {
      saveUserData(userId, 'god_saeng', challenges);
    }
  }, [challenges, userId, isLoading]);

  useEffect(() => {
    if (challenges.length > 0) {
      generateChallengeSummary(challenges.map(c => c.title)).then(setAiSlogan);
    }
  }, [challenges]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProofImage(url);
    }
  };

  const handleCertify = () => {
    if (!selectedChallenge || !proofImage) return;
    
    setChallenges(prev => prev.map(c => 
      c.id === selectedChallenge.id 
        ? { ...c, daysCompleted: Math.min(c.daysCompleted + 1, c.daysTotal) } 
        : c
    ));
    
    alert(`🎉 ${selectedChallenge.title} 인증 완료! 경험치가 상승했습니다.`);
    setSelectedChallenge(null);
    setProofImage(null);
  };

  const handleAddChallenge = () => {
    if (!newTitle.trim()) return;
    
    const colors = ['bg-pink-500', 'bg-purple-500', 'bg-indigo-500', 'bg-teal-500'];
    const icons = ['🎯', '🚀', '💎', '🍀'];
    
    const newChallenge: Challenge = {
      id: Date.now().toString(),
      title: newTitle,
      description: newDesc || '나만의 멋진 챌린지',
      daysTotal: newDays,
      daysCompleted: 0,
      badgeIcon: icons[Math.floor(Math.random() * icons.length)],
      color: colors[Math.floor(Math.random() * colors.length)]
    };

    setChallenges([...challenges, newChallenge]);
    setShowAddModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewDays(30);
  };

  // Calculate stats based on real data
  const totalBadges = challenges.filter(c => c.daysCompleted === c.daysTotal).length;
  const currentStreak = Math.max(...challenges.map(c => c.daysCompleted > 0 ? c.daysCompleted : 0));
  const level = Math.floor(challenges.reduce((acc, cur) => acc + cur.daysCompleted, 0) / 5) + 1;

  return (
    <div className="space-y-8 pb-20">
      <header className="text-center space-y-2">
        <div className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold mb-2 animate-bounce">
          GOD-SAENG PROJECT
        </div>
        <h1 className="text-3xl font-black text-slate-900 italic">#오늘도_갓생산다</h1>
        <p className="text-slate-500 text-sm">{aiSlogan}</p>
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

      {/* Challenge List Header */}
      <div className="flex justify-between items-center">
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
          <div key={challenge.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden transition-all hover:shadow-md">
            <div className={`absolute top-0 left-0 w-1 h-full ${challenge.color}`}></div>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl bg-slate-50 w-12 h-12 flex items-center justify-center rounded-xl border border-slate-100">
                  {challenge.badgeIcon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{challenge.title}</h3>
                  <p className="text-xs text-slate-500">{challenge.description}</p>
                </div>
              </div>
              {challenge.daysCompleted >= challenge.daysTotal ? (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold border border-yellow-200">
                  COMPLETED
                </span>
              ) : (
                <button 
                  onClick={() => setSelectedChallenge(challenge)}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg active:scale-95 transition-transform flex items-center gap-2 shadow-lg shadow-slate-200"
                >
                  <Camera className="w-3 h-3" /> 인증하기
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="relative pt-2">
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
              <div className="mt-2 text-xs text-right text-slate-500">
                <span className="font-bold text-slate-900">{challenge.daysCompleted}</span> / {challenge.daysTotal}일
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Certification Modal */}
      {selectedChallenge && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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

      {/* Add Challenge Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm animate-fade-in-up shadow-2xl">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-xl text-slate-800">새 챌린지 도전</h3>
               <button onClick={() => setShowAddModal(false)} className="p-1 bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">챌린지 이름</label>
                <input 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
                  placeholder="예: 하루 물 2L 마시기"
                />
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
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>3일</span>
                  <span>100일</span>
                </div>
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