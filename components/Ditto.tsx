import React, { useState, useEffect } from 'react';
import { GradeRecord } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Sparkles, Edit3, MessageCircle, Save } from 'lucide-react';
import { generateFeedback } from '../services/geminiService';
import { loadUserData, saveUserData } from '../services/storageService';

interface DittoProps {
  userId: string;
}

const initialGrades: GradeRecord[] = [
  { term: '3월 모의', score: 68, subject: '수학' },
  { term: '6월 모의', score: 74, subject: '수학' },
  { term: '9월 모의', score: 82, subject: '수학' },
  { term: '11월 모의', score: 88, subject: '수학' },
];

const Ditto: React.FC<DittoProps> = ({ userId }) => {
  const [grades] = useState<GradeRecord[]>(initialGrades); // Grades are mock for now, or could be loaded similarly
  const [reflection, setReflection] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved reflection/feedback
  useEffect(() => {
    setIsLoading(true);
    const savedData = loadUserData(userId, 'ditto_reflection', { reflection: '', feedback: null });
    setReflection(savedData.reflection || '');
    setFeedback(savedData.feedback || null);
    setIsLoading(false);
  }, [userId]);

  // Save helper
  const handleSave = () => {
    saveUserData(userId, 'ditto_reflection', { reflection, feedback });
    alert("저장되었습니다!");
  };

  const handleGenerateFeedback = async () => {
    if (!reflection.trim()) {
      alert("변화에 대한 이야기를 먼저 적어주세요!");
      return;
    }
    setIsGenerating(true);
    const gradeSummary = `3월 ${grades[0].score}점에서 11월 ${grades[grades.length-1].score}점으로 상승`;
    const aiResponse = await generateFeedback(reflection, gradeSummary);
    setFeedback(aiResponse);
    setIsGenerating(false);
    
    // Auto save after generation
    saveUserData(userId, 'ditto_reflection', { reflection, feedback: aiResponse });
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900">Ditto 소비 <span className="text-indigo-600 text-lg align-middle font-medium">#나도_그래</span></h1>
        <p className="text-slate-500">나의 변화 과정을 기록하고 친구들과 공유해보세요.</p>
      </header>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-3xl shadow-lg shadow-indigo-50 border border-indigo-50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="text-rose-500" /> 성적 변화 그래프
          </h2>
          <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-xs font-bold">
            +20점 상승 🔥
          </span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={grades}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="term" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
              <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#4f46e5" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} 
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Before & After Storytelling */}
      <div className="bg-gradient-to-b from-white to-slate-50 p-6 rounded-3xl border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Edit3 className="text-indigo-500" /> 나의 성장 스토리
          </h2>
          <button onClick={handleSave} className="text-slate-400 hover:text-indigo-600">
            <Save className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="relative">
            <textarea
              className="w-full p-4 rounded-2xl bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none outline-none text-slate-700 h-40"
              placeholder="처음 시작했을 때와 지금, 무엇이 달라졌나요? 솔직한 감정을 기록해보세요. (예: 처음엔 수학 문제만 보면 졸렸는데, 이제는 풀리는 재미를 알게 되었다.)"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
            />
            <button
              onClick={handleGenerateFeedback}
              disabled={isGenerating}
              className="absolute bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:bg-slate-400 transition-colors flex items-center gap-2 shadow-md"
            >
              {isGenerating ? 'AI 분석중...' : <><Sparkles className="w-4 h-4" /> 선생님 피드백 받기</>}
            </button>
          </div>

          {/* AI Feedback Card */}
          {feedback && (
            <div className="animate-fade-in mt-6">
              <div className="relative bg-indigo-600 text-white p-6 rounded-2xl rounded-tl-none shadow-xl">
                <div className="absolute -top-3 left-0 bg-indigo-600 text-xs font-bold px-3 py-1 rounded-t-lg">
                  AI 선생님의 편지 💌
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 bg-white/20 p-2 rounded-full h-fit">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-indigo-50 leading-relaxed text-sm font-medium">
                      {feedback}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <button className="text-slate-400 text-xs underline hover:text-indigo-500 transition-colors">
                  이 스토리 인스타그램에 공유하기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Ditto;