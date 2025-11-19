
import React, { useState, useEffect } from 'react';
import { GradeRecord, Course, Challenge } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Sparkles, Edit3, MessageCircle, Save, FileSpreadsheet, Copy } from 'lucide-react';
import { generateFeedback } from '../services/geminiService';
import { loadUserData, saveUserData, downloadUserDataAsExcel } from '../services/storageService';

interface DittoProps {
  userId: string;
  userName: string;
}

// Simulate past history
const baseHistory: GradeRecord[] = [
  { term: '입학', score: 40, subject: '종합' },
  { term: '1학기', score: 55, subject: '종합' },
  { term: '여름방학', score: 62, subject: '종합' },
];

const Ditto: React.FC<DittoProps> = ({ userId, userName }) => {
  const [graphData, setGraphData] = useState<GradeRecord[]>(baseHistory);
  const [reflection, setReflection] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load everything to calculate the dynamic "Current" growth score
  useEffect(() => {
    setIsLoading(true);
    
    // Load Reflection
    const savedReflectionData = loadUserData(userId, 'ditto_reflection', { reflection: '', feedback: null });
    setReflection(savedReflectionData.reflection || '');
    setFeedback(savedReflectionData.feedback || null);

    // Load Activities for Score Calculation
    const courses: Course[] = loadUserData(userId, 'micro_learning', []);
    const challenges: Challenge[] = loadUserData(userId, 'god_saeng', []);

    // Calculate Score
    // 1 completed course = 5 points
    // 1 challenge day = 1 point
    const courseScore = courses.filter(c => c.completed).length * 5;
    const challengeScore = challenges.reduce((acc, c) => acc + c.daysCompleted, 0) * 1;
    
    // Base score starts at 62 (last history point)
    const currentScore = 62 + courseScore + challengeScore;
    const cappedScore = Math.min(currentScore, 100); // Max 100

    const currentDataPoint = {
      term: '현재',
      score: cappedScore,
      subject: '종합'
    };

    setGraphData([...baseHistory, currentDataPoint]);
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
    
    const startScore = graphData[0].score;
    const currentScore = graphData[graphData.length - 1].score;
    const gradeChangeSummary = `입학 당시 ${startScore}점에서 현재 ${currentScore}점으로 성장`;
    
    const aiResponse = await generateFeedback(reflection, gradeChangeSummary);
    setFeedback(aiResponse);
    setIsGenerating(false);
    
    // Auto save after generation
    saveUserData(userId, 'ditto_reflection', { reflection, feedback: aiResponse });
  };

  const handleCopyToSheets = () => {
    const header = "시기\t점수\t과목";
    const rows = graphData.map(d => `${d.term}\t${d.score}\t${d.subject}`).join('\n');
    const text = `${header}\n${rows}`;
    
    navigator.clipboard.writeText(text).then(() => {
      alert("성장 그래프 데이터가 복사되었습니다!\n구글 스프레드시트를 열고 Ctrl+V (붙여넣기) 하세요.");
    }).catch(() => {
      alert("복사에 실패했습니다.");
    });
  };

  const currentScore = graphData[graphData.length - 1]?.score || 0;
  const growth = currentScore - graphData[0].score;

  return (
    <div className="space-y-8 pb-20">
      <header className="space-y-2">
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-black text-slate-900">Ditto 성장 <span className="text-indigo-600 text-lg align-middle font-medium">#나도_그래</span></h1>
          <div className="flex gap-2">
            <button 
              onClick={handleCopyToSheets}
              className="flex items-center gap-1 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg hover:bg-slate-900 transition-colors"
              title="구글 스프레드시트에 붙여넣기 좋게 복사합니다"
            >
              <Copy className="w-4 h-4" /> 구글 시트 복사
            </button>
            <button 
              onClick={() => downloadUserDataAsExcel(userId, userName, graphData)}
              className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" /> 엑셀 저장
            </button>
          </div>
        </div>
        <p className="text-slate-500">나의 변화 과정을 기록하고 친구들과 공유해보세요.</p>
      </header>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-3xl shadow-lg shadow-indigo-50 border border-indigo-50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="text-rose-500" /> 나의 성장 그래프
          </h2>
          <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-xs font-bold animate-pulse">
            +{growth}점 성장중 🚀
          </span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={graphData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="term" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
              <YAxis hide domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#4f46e5" 
                strokeWidth={4} 
                dot={{ r: 6, fill: '#4f46e5', strokeWidth: 3, stroke: '#fff' }} 
                activeDot={{ r: 8, fill: '#ec4899', stroke: '#fff' }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-slate-400 text-center mt-4 bg-slate-50 py-2 rounded-lg">
          💡 숏클래스 수강과 갓생챌린지 인증을 통해 성장 점수를 올릴 수 있습니다.
        </p>
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
              {isGenerating ? 'AI 선생님께 전송중...' : <><Sparkles className="w-4 h-4" /> 선생님 피드백 받기</>}
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
