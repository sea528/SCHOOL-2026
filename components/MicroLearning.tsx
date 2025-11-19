
import React, { useState, useEffect } from 'react';
import { Course, UserRole } from '../types';
import { CheckCircle, PlayCircle, BarChart2, Plus, X, Trash2, Youtube } from 'lucide-react';
import { loadUserData, saveUserData } from '../services/storageService';

interface MicroLearningProps {
  role: UserRole;
  userId: string;
  userName: string;
}

const initialCourses: Course[] = [
  { 
    id: '1', 
    title: '미적분: 3분 만에 이해하는 도함수', 
    duration: '03:12', 
    thumbnail: 'https://img.youtube.com/vi/greWQbI61N4/mqdefault.jpg', 
    completed: true, 
    subject: '수학',
    videoUrl: 'https://www.youtube.com/embed/greWQbI61N4' 
  },
  { 
    id: '2', 
    title: '영어 독해: 빈칸 추론 필승법', 
    duration: '04:50', 
    thumbnail: 'https://img.youtube.com/vi/MultiuKj8vM/mqdefault.jpg', 
    completed: false, 
    subject: '영어',
    videoUrl: 'https://www.youtube.com/embed/MultiuKj8vM'
  },
  { 
    id: '3', 
    title: '물리: 뉴턴 법칙 실생활 예시', 
    duration: '03:30', 
    thumbnail: 'https://img.youtube.com/vi/T0W0n2Y6_bM/mqdefault.jpg', 
    completed: false, 
    subject: '과학',
    videoUrl: 'https://www.youtube.com/embed/T0W0n2Y6_bM'
  },
  { 
    id: '4', 
    title: '현대시: 시적 화자의 정서 찾기', 
    duration: '05:00', 
    thumbnail: 'https://img.youtube.com/vi/Xm3h3r3W5jE/mqdefault.jpg', 
    completed: false, 
    subject: '국어',
    videoUrl: 'https://www.youtube.com/embed/Xm3h3r3W5jE'
  },
  { 
    id: '5', 
    title: '한국사: 개화기 흐름 한눈에', 
    duration: '04:15', 
    thumbnail: 'https://img.youtube.com/vi/S5rL4p0Q2jE/mqdefault.jpg', 
    completed: false, 
    subject: '한국사',
    videoUrl: 'https://www.youtube.com/embed/S5rL4p0Q2jE'
  },
];

const MicroLearning: React.FC<MicroLearningProps> = ({ role, userId, userName }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Video Player State
  const [playingCourse, setPlayingCourse] = useState<Course | null>(null);

  // Form state for new course
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseSubject, setNewCourseSubject] = useState('수학');
  const [newVideoUrl, setNewVideoUrl] = useState('');

  // Load data on mount or when userId changes
  useEffect(() => {
    setIsLoading(true);
    const loadedData = loadUserData(userId, 'micro_learning', initialCourses);
    setCourses(loadedData);
    setIsLoading(false);
  }, [userId]);

  // Save data whenever courses change
  useEffect(() => {
    // Only save if we have finished loading. 
    // Removed 'courses.length > 0' check so empty lists can be saved (e.g. after deleting all).
    if (!isLoading) {
      saveUserData(userId, 'micro_learning', courses);
    }
  }, [courses, userId, isLoading]);

  const toggleComplete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (role === UserRole.TEACHER) return;
    setCourses(prev => prev.map(c => c.id === id ? { ...c, completed: !c.completed } : c));
  };

  const handleDeleteCourse = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault(); 
    if (window.confirm('정말 이 강의를 삭제하시겠습니까?')) {
      setCourses(prev => prev.filter(c => c.id !== id));
    }
  };

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleAddCourse = () => {
    if (!newCourseTitle.trim()) return;
    
    let thumbnail = `https://picsum.photos/400/225?random=${courses.length + 10}`;
    let videoUrl = '';
    
    // Process YouTube URL if provided
    if (newVideoUrl.trim()) {
      const videoId = getYouTubeId(newVideoUrl);
      if (videoId) {
        thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        // Construct embed URL
        videoUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    }

    const newCourse: Course = {
      id: Date.now().toString(),
      title: newCourseTitle,
      subject: newCourseSubject,
      duration: '05:00', // Default duration
      thumbnail: thumbnail,
      completed: false,
      videoUrl: videoUrl
    };

    setCourses([newCourse, ...courses]);
    setNewCourseTitle('');
    setNewVideoUrl('');
    setShowAddModal(false);
  };

  const handlePlayVideo = (course: Course) => {
    setPlayingCourse(course);
  };

  // Helper to get safe video URL with origin
  const getSafeVideoUrl = (url: string) => {
    if (!url) return '';
    const origin = window.location.origin;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}autoplay=1&mute=0&origin=${origin}`;
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
        {/* Teacher stats omitted for brevity, reusing existing layout logic in real app */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-indigo-50 p-4 rounded-xl">
            <p className="text-sm text-indigo-600 font-medium">평균 진도율</p>
            <p className="text-3xl font-bold text-indigo-900">78%</p>
          </div>
          {/* ... other stats ... */}
        </div>
        <h3 className="font-semibold text-slate-700">최근 업로드된 강의</h3>
        <div className="space-y-3">
          {courses.slice(0, 3).map(course => (
             <div key={course.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg group">
               <div className="w-16 h-9 bg-slate-300 rounded overflow-hidden flex-shrink-0 relative cursor-pointer" onClick={() => handlePlayVideo(course)}>
                 <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                   <PlayCircle className="w-4 h-4 text-white" />
                 </div>
               </div>
               <div className="flex-1">
                 <div className="font-bold text-sm truncate">{course.title}</div>
                 <div className="text-xs text-slate-500">{course.subject} • {course.duration}</div>
               </div>
               <button 
                  onClick={(e) => handleDeleteCourse(e, course.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
               >
                 <Trash2 className="w-4 h-4" />
               </button>
             </div>
          ))}
        </div>
        
        {/* Add Modal Reuse */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-fade-in-up">
               {/* Same Modal Content as Student View but tailored */}
               <h3 className="font-bold text-lg mb-4">새 강의 업로드</h3>
               <div className="space-y-4">
                <input 
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                    className="w-full p-3 bg-slate-50 rounded-xl border outline-none" 
                    placeholder="강의 제목"
                  />
                  <input 
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    className="w-full p-3 bg-slate-50 rounded-xl border outline-none" 
                    placeholder="유튜브 링크 (https://youtu.be/...)"
                  />
                  <select 
                    value={newCourseSubject}
                    onChange={(e) => setNewCourseSubject(e.target.value)}
                    className="w-full p-3 bg-slate-50 rounded-xl border outline-none"
                  >
                    {['국어', '수학', '영어', '한국사', '과학', '사회'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600">취소</button>
                    <button onClick={handleAddCourse} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">업로드</button>
                  </div>
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
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
                <h1 className="text-2xl font-bold">{userName}님의 숏-클래스 ⚡</h1>
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
            className={`group relative bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 transition-all hover:shadow-md ${course.completed ? 'opacity-90' : ''}`}
          >
            {/* Thumbnail Area - Triggers Video */}
            <div className="relative aspect-video bg-slate-200 cursor-pointer" onClick={() => handlePlayVideo(course)}>
              <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <PlayCircle className="w-12 h-12 text-white/90 drop-shadow-lg group-hover:scale-110 transition-transform" />
              </div>
              <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-md">
                {course.duration}
              </span>
            </div>
            
            {/* Content Area */}
            <div className="p-4">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-indigo-600 mb-1 block">{course.subject}</span>
                  <h3 className="font-bold text-slate-800 leading-tight text-sm truncate">{course.title}</h3>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button 
                    onClick={(e) => toggleComplete(e, course.id)}
                    className={`p-1 rounded-full transition-colors ${course.completed ? 'text-green-500 bg-green-50' : 'text-slate-300 hover:text-indigo-500 hover:bg-indigo-50'}`}
                    title={course.completed ? "학습 완료 취소" : "학습 완료 체크"}
                  >
                    <CheckCircle className="w-6 h-6 fill-current" />
                  </button>
                  <button 
                    onClick={(e) => handleDeleteCourse(e, course.id)}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
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
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                  <Youtube className="w-4 h-4 text-red-500" /> 유튜브 링크 (선택)
                </label>
                <input 
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  className="w-full p-4 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
                  placeholder="https://youtu.be/..."
                />
                <p className="text-xs text-slate-400 mt-1">링크 입력 시 썸네일이 자동 생성됩니다.</p>
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

      {/* Video Player Modal */}
      {playingCourse && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setPlayingCourse(null)}>
          <div className="w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="absolute top-4 right-4 z-10">
              <button 
                onClick={() => setPlayingCourse(null)}
                className="bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-md transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="aspect-video w-full bg-black flex items-center justify-center">
              {playingCourse.videoUrl ? (
                <iframe 
                  src={getSafeVideoUrl(playingCourse.videoUrl)}
                  title={playingCourse.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="text-center text-white">
                  <p className="text-lg font-bold mb-2">동영상을 재생할 수 없습니다.</p>
                  <p className="text-sm text-gray-400">유효한 동영상 URL이 없습니다.</p>
                </div>
              )}
            </div>
            
            <div className="bg-slate-900 p-4 text-white">
              <h3 className="font-bold text-lg">{playingCourse.title}</h3>
              <p className="text-slate-400 text-sm">{playingCourse.subject} • {playingCourse.duration}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MicroLearning;
