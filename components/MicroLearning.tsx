import React, { useState, useEffect } from 'react';
import { Course, UserRole } from '../types';
import { CheckCircle, PlayCircle, BarChart2, Plus, X } from 'lucide-react';
import { loadUserData, saveUserData } from '../services/storageService';

interface MicroLearningProps {
  role: UserRole;
  userId: string;
  userName: string;
}

const initialCourses: Course[] = [
  { id: '1', title: '미적분: 3분 만에 이해하는 도함수', duration: '03:12', thumbnail: 'https://picsum.photos/400/225?random=1', completed: true, subject: '수학' },
  { id: '2', title: '영어 독해: 빈칸 추론 필승법', duration: '04:50', thumbnail: 'https://picsum.photos/400/225?random=2', completed: false, subject: '영어' },
  { id: '3', title: '물리: 뉴턴 법칙 실생활 예시', duration: '03:30', thumbnail: 'https://picsum.photos/400/225?random=3', completed: false, subject: '과학' },
  { id: '4', title: '현대시: 시적 화자의 정서 찾기', duration: '05:00', thumbnail: 'https://picsum.photos/400/225?random=4', completed: false, subject: '국어' },
  { id: '5', title: '한국사: 개화기 흐름 한눈에', duration: '04:15', thumbnail: 'https://picsum.photos/400/225?random=5', completed: false, subject: '한국사' },
];

const MicroLearning: React.FC<MicroLearningProps> = ({ role, userId, userName }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state for new course
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseSubject, setNewCourseSubject] = useState('수학');

  // Load data on mount or when userId changes
  useEffect(() => {
    setIsLoading(true);
    const loadedData = loadUserData(userId, 'micro_learning', initialCourses);
    setCourses(loadedData);
    setIsLoading(false);
  }, [userId]);

  // Save data whenever courses change
  useEffect(() => {
    if (!isLoading && courses.length > 0) {
      saveUserData(userId, 'micro_learning', courses);
    }
  }, [courses, userId, isLoading]);

  const toggleComplete = (id: string) => {
    if (role === UserRole.TEACHER) return;
    setCourses(prev => prev.map(c => c.id === id ? { ...c, completed: !c.completed } : c));
  };

  const handleAddCourse = () => {
    if (!newCourseTitle.trim()) return;
    
    const newCourse: Course = {
      id: Date.now().toString(),
      title: newCourseTitle,
      subject: newCourseSubject,
      duration: '05:00', // Default duration
      thumbnail: `https://picsum.photos/400/225?random=${courses.length + 10}`,
      completed: false
    };

    setCourses([newCourse, ...courses]);
    setNewCourseTitle('');
    setShowAddModal(false);
  };

  const filteredCourses = activeFilter === 'All' 
    ? courses 
    : courses.filter(c => c.subject === activeFilter);

  const progress = Math.round((courses.filter(c => c.completed).length / courses.length) * 100) || 0;

  if (role === UserRole.TEACHER) {
    return (
      <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-indigo-600" />
            학급 학습 현황
          </h2>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> 강의 업로드
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-indigo-50 p-4 rounded-xl">
            <p className="text-sm text-indigo-600 font-medium">평균 진도율</p>
            <p className="text-3xl font-bold text-indigo-900">78%</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl">
            <p className="text-sm text-emerald-600 font-medium">가장 많이 들은 강의</p>
            <p className="text-xl font-bold text-emerald-900 truncate">미적분: 도함수</p>
          </div>
          <div className="bg-rose-50 p-4 rounded-xl">
            <p className="text-sm text-rose-600 font-medium">학습 부진 학생</p>
            <p className="text-xl font-bold text-rose-900">3명</p>
          </div>
        </div>

        <h3 className="font-semibold text-slate-700">최근 업로드된 강의</h3>
        <div className="space-y-3">
          {courses.slice(0, 3).map(course => (
             <div key={course.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
               <div className="w-16 h-9 bg-slate-300 rounded overflow-hidden flex-shrink-0">
                 <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
               </div>
               <div className="flex-1">
                 <div className="font-bold text-sm">{course.title}</div>
                 <div className="text-xs text-slate-500">{course.subject} • {course.duration}</div>
               </div>
             </div>
          ))}
        </div>

        {/* Add Modal for Teacher */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-fade-in-up">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">새 강의 업로드</h3>
                <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">강의 제목</label>
                  <input 
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                    className="w-full p-3 bg-slate-50 rounded-xl border focus:border-indigo-500 outline-none" 
                    placeholder="예: 문학의 이해 1강"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">과목</label>
                  <select 
                    value={newCourseSubject}
                    onChange={(e) => setNewCourseSubject(e.target.value)}
                    className="w-full p-3 bg-slate-50 rounded-xl border focus:border-indigo-500 outline-none"
                  >
                    {['국어', '수학', '영어', '한국사', '과학', '사회'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={handleAddCourse}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                >
                  업로드 하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
         {/* Background pattern decoration */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
                <h1 className="text-2xl font-bold">{userName}님의 숏-클래스 ⚡</h1>
                {/* Assuming teachers might also view this screen or we allow students to add self-study links */}
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
                  title="강의 추가"
                >
                  <Plus className="w-5 h-5" />
                </button>
            </div>
            <p className="text-indigo-100 mb-4 text-sm">이동 시간에 딱 3분! 핵심만 쏙쏙 뽑아먹자.</p>
            
            <div className="flex items-center gap-4">
            <div className="flex-1 bg-white/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                <div 
                className="bg-green-400 h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(74,222,128,0.5)]" 
                style={{ width: `${progress}%` }} 
                />
            </div>
            <span className="font-bold text-sm">{progress}% 달성</span>
            </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {['All', '수학', '영어', '과학', '국어', '한국사'].map(subject => (
          <button
            key={subject}
            onClick={() => setActiveFilter(subject)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              activeFilter === subject 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {subject}
          </button>
        ))}
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCourses.map((course) => (
          <div 
            key={course.id} 
            className={`group relative bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 transition-all hover:shadow-md ${course.completed ? 'opacity-80' : ''}`}
          >
            <div className="relative aspect-video bg-slate-200 cursor-pointer" onClick={() => toggleComplete(course.id)}>
              <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <PlayCircle className="w-12 h-12 text-white/90 drop-shadow-lg group-hover:scale-110 transition-transform" />
              </div>
              <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-md">
                {course.duration}
              </span>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <span className="text-xs font-bold text-indigo-600 mb-1 block">{course.subject}</span>
                  <h3 className="font-bold text-slate-800 leading-tight text-sm">{course.title}</h3>
                </div>
                <button 
                  onClick={() => toggleComplete(course.id)}
                  className={`flex-shrink-0 p-1 rounded-full transition-colors ${course.completed ? 'text-green-500 bg-green-50' : 'text-slate-300 hover:text-indigo-500 hover:bg-indigo-50'}`}
                >
                  <CheckCircle className="w-6 h-6 fill-current" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal (Shared logic for simplicity in prototype) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm animate-fade-in-up shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-slate-800">새 강의 추가</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">강의 제목</label>
                <input 
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
                  placeholder="강의 제목을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">과목 선택</label>
                <div className="grid grid-cols-3 gap-2">
                  {['국어', '수학', '영어', '한국사', '과학', '사회'].map(s => (
                    <button
                      key={s}
                      onClick={() => setNewCourseSubject(s)}
                      className={`py-2 rounded-lg text-sm font-bold transition-colors ${
                        newCourseSubject === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                onClick={handleAddCourse}
                disabled={!newCourseTitle.trim()}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
              >
                강의 추가하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MicroLearning;