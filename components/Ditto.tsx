
import React, { useState, useEffect } from 'react';
import { GradeRecord, Challenge, UserRole } from '../types';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Sparkles, Edit3, MessageCircle, Save, BookOpen, User as UserIcon, Loader2, Bot, Settings, FileSpreadsheet, X, HelpCircle } from 'lucide-react';
import { generateFeedback, summarizeStudentReflection } from '../services/geminiService';
import { fetchUserProgress, fetchChallenges, fetchReflection, saveReflectionToSupabase, getAllStudentGrowthData } from '../services/storageService';

interface DittoProps {
  userId: string;
  userName: string;
  role?: UserRole;
}

const baseHistory: GradeRecord[] = [
  { term: '입학', score: 40, subject: '종합' },
  { term: '1학기', score: 55, subject: '종합' },
  { term: '여름방학', score: 62, subject: '종합' },
];

// Sub-component for Teacher View to handle individual AI summaries
const ReflectionCard: React.FC<{ student: { id: string; reflection: string } }> = ({ student }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const handleSummarize = async () => {
    if (isSummarizing) return;
    setIsSummarizing(true);
    const result = await summarizeStudentReflection(student.reflection);
    setSummary(result);
    setIsSummarizing(false);
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
            <UserIcon className="w-4 h-4 text-slate-500" />
          </div>
          <span className="font-bold text-slate-900">{student.id}</span>
        </div>
        <button
          onClick={handleSummarize}
          disabled={isSummarizing || !!summary}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
            summary 
              ? 'bg-indigo-50 text-indigo-600 cursor-default' 
              : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90'
          }`}
        >
          {isSummarizing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Bot className="w-3 h-3" />
          )}
          {summary ? '요약 완료' : 'AI 요약'}
        </button>
      </div>

      {summary && (
        <div className="mb-3 bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex gap-3 animate-fade-in">
          <div className="mt-0.5">
             <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-800 mb-1">AI 요약 리포트</p>
            <p className="text-sm text-indigo-900 font-medium leading-snug">{summary}</p>
          </div>
        </div>
      )}

      <div className="bg-slate-50 p-4 rounded-xl text-slate-700 text-sm leading-relaxed relative">
        <span className="absolute top-2 left-2 text-3xl text-slate-200 font-serif">"</span>
        <p className="relative z-10 px-2">{student.reflection}</p>
        <span className="absolute bottom-[-10px] right-4 text-3xl text-slate-200 font-serif">"</span>
      </div>
    </div>
  );
};

const Ditto: React.FC<DittoProps> = ({ userId, userName, role }) => {
  const [graphData, setGraphData] = useState<GradeRecord[]>(baseHistory);
  const [reflection, setReflection] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Teacher View State
  const [studentGrowthStats, setStudentGrowthStats] = useState<{ id: string; courseCount: number; reflection: string }[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      if (role === UserRole.TEACHER) {
        const stats = await getAllStudentGrowthData();
        setStudentGrowthStats(stats);
        
        // Load saved sheet URL
        const savedUrl = localStorage.getItem('TEACHER_SHEET_URL');
        if (savedUrl) setSheetUrl(savedUrl);
      } else {
        // Student Data Loading
        const savedReflectionData = await fetchReflection(userId);
        setReflection(savedReflectionData.reflection || '');
        setFeedback(savedReflectionData.feedback || null);

        const completedCourseIds = await fetchUserProgress(userId);
        const challenges = await fetchChallenges(userId);

        const courseScore = completedCourseIds.length * 5;
        const challengeScore = challenges.reduce((acc, c) => acc + c.daysCompleted, 0) * 1;
        
        const currentScore = 62 + courseScore + challengeScore;
        const cappedScore = Math.min(currentScore, 100);

        const currentDataPoint = {
          term: '현재',
          score: cappedScore,
          subject: '종합'
        };

        setGraphData([...baseHistory, currentDataPoint]);
      }
      setIsLoading(false);
    };
    loadData();
  }, [userId, role]);

  const handleSave = async () => {
    await saveReflectionToSupabase(userId, reflection, feedback);
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
    
    await saveReflectionToSupabase(userId, reflection, aiResponse);
  };

  const handleSaveSettings = () => {
    localStorage.setItem('TEACHER_SHEET_URL', sheetUrl);
    setShowSettings(false);
    alert("구글 시트 URL이 저장되었습니다.");
  };

  const handleExportToSheet = async () => {
    if (!sheetUrl) {
      alert("설정 버튼을 눌러 Google Apps Script URL을 먼저 등록해주세요.");
      return;
    }

    if (studentGrowthStats.length === 0) {
      alert("전송할 데이터가 없습니다.");
      return;
    }

    setIsExporting(true);
    try {
      // Prepare data payload
      const payload = {
        timestamp: new Date().toLocaleString(),
        teacherName: userName,
        students: studentGrowthStats.map(s => ({
          name: s.id,
          courseCount: s.courseCount,
          reflection: s.reflection
        }))
      };

      // Use no-cors mode to send data without reading response (standard for GAS Web App POSTs from client)
      await fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      alert("✅ 구글 시트로 데이터가 전송되었습니다! (잠시 후 시트를 확인하세요)");
    } catch (error) {
      console.error("Export Error", error);
      alert("전송 중 오류가 발생했습니다. URL을 확인해주세요.");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600 w-8 h-8" /></div>;
  }

  // Teacher View
  if (role === UserRole.TEACHER) {
    const reflectionList = studentGrowthStats.filter(s => s.reflection && s.reflection.trim() !== '');

    return (
      <div className="space-y-8 pb-20 relative">
        <header className="text-center space-y-2 relative">
           {/* Settings Button */}
           <button 
            onClick={() => setShowSettings(true)}
            className="absolute right-0 top-0 p-2 text-slate-400 hover:text-indigo-600 bg-white rounded-full shadow-sm border border-slate-200 transition-all"
            title="구글 시트 연결 설정"
           >
             <Settings className="w-5 h-5" />
           </button>

          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 mb-2">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">학급 성장 리포트</h1>
          <p className="text-slate-500 text-sm">학생들의 수강 현황과 성장 에세이를 확인하세요.</p>
        </header>
        
        {/* Action Bar */}
        <div className="flex justify-end">
          <button 
            onClick={handleExportToSheet}
            disabled={isExporting}
            className="flex items-center gap-2 bg-[#1D6F42] text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-[#155a33] transition-colors disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            구글 시트로 전송
          </button>
        </div>

        {/* 1. Course Completion Graph */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" /> 학생별 강의 시청 횟수 비교
          </h2>
          {studentGrowthStats.length > 0 ? (
             <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studentGrowthStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="id" tick={{fontSize: 12}} interval={0} />
                  <YAxis allowDecimals={false} label={{ value: '수강 수', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="courseCount" name="수강 완료" radius={[4, 4, 0, 0]} barSize={30}>
                    {studentGrowthStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index < 3 ? '#4f46e5' : '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
             </div>
          ) : (
            <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border-dashed border-2 border-slate-200">
              아직 강의를 들은 학생이 없습니다.
            </div>
          )}
        </div>

        {/* 2. Student Stories Feed */}
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 px-2">
            <Edit3 className="w-5 h-5 text-pink-500" /> 학생들의 성장 스토리
          </h2>
          <div className="space-y-4">
            {reflectionList.length > 0 ? (
              reflectionList.map((student) => (
                <ReflectionCard key={student.id} student={student} />
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border-dashed border-2 border-slate-200">
                아직 작성된 성장 스토리가 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-slate-500" /> 구글 시트 연결 설정
                </h3>
                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-600 space-y-2 leading-relaxed border border-slate-100">
                  <p className="font-bold text-indigo-600 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" /> 설정 방법 (App Script)
                  </p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>구글 스프레드시트를 새로 만듭니다.</li>
                    <li><strong>확장 프로그램 {'>'} Apps Script</strong>를 엽니다.</li>
                    <li>기존 코드를 지우고 <strong>아래 코드를 복사/붙여넣기</strong> 합니다.</li>
                    <li><strong>배포 {'>'} 새 배포</strong>를 클릭합니다.</li>
                    <li>유형: <strong>웹 앱</strong> 선택</li>
                    <li>액세스 권한: <strong>'모든 사용자' (필수)</strong></li>
                    <li>생성된 <strong>웹 앱 URL</strong>을 아래에 붙여넣으세요.</li>
                  </ol>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">웹 앱 URL (Web App URL)</label>
                  <input 
                    type="text"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/..."
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                </div>

                <button 
                  onClick={handleSaveSettings}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                >
                  설정 저장
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Student View
  const currentScore = graphData[graphData.length - 1]?.score || 0;
  const growth = currentScore - graphData[0].score;

  return (
    <div className="space-y-8 pb-20">
      <header className="space-y-2">
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-black text-slate-900">Ditto 성장 <span className="text-indigo-600 text-lg align-middle font-medium">#나도_그래</span></h1>
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
              placeholder="처음 시작했을 때와 지금, 무엇이 달라졌나요?"
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Ditto;
