
import React, { useState, useEffect } from 'react';
import { Course, UserRole } from '../types';
import { CheckCircle, PlayCircle, BarChart2, Plus, Trash2, ExternalLink, Loader2, Flame, Sparkles, ImageIcon, Users, X } from 'lucide-react';
import { fetchCourses, fetchUserProgress, saveCourseToSupabase, deleteCourseFromSupabase, updateUserProgress } from '../services/storageService';
import { generateThumbnail } from '../services/geminiService';

interface MicroLearningProps {
  role: UserRole;
  userId: string;
  userName: string;
}

const MicroLearning: React.FC<MicroLearningProps> = ({ role, userId, userName }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Video Player State
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  
  // Form state for new course
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseSubject, setNewCourseSubject] = useState('수학');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  
  // Thumbnail state
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      // 1. Fetch shared courses (now sorted by popularity from service)
      const sharedCourses = await fetchCourses();
      // 2. Fetch user progress
      const myCompletedIds = await fetchUserProgress(userId);

      // 3. Merge
      const mergedCourses = sharedCourses.map(course => ({
        ...course,
        completed: myCompletedIds.includes(course.id)
      }));

      setCourses(mergedCourses);
      setIsLoading(false);
    };

    loadData();
  }, [userId]);

  const toggleComplete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const course = courses.find(c => c.id === id);
    if (course) {
      // Optimistic Update
      const newStatus = !course.completed;
      setCourses(prev => prev.map(c => c.id === id ? { ...c, completed: newStatus } : c));
      
      // DB Update
      await updateUserProgress(userId, id, newStatus);
    }
  };

  const handleDeleteCourse = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault(); 
    
    if (role !== UserRole.TEACHER) return;

    if (window.confirm('정말 이 강의를 삭제하시겠습니까? 모든 학생들의 목록에서 사라집니다.')) {
      await deleteCourseFromSupabase(id);
      setCourses(prev => prev.filter(c => c.id !== id));
    }
  };

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getVideoSrc = (url?: string) => {
    if (!url) return '';
    const videoId = getYouTubeId(url);
    if (videoId) {
      // Construct a robust embed URL with origin to fix "Configuration Error" (Error 153)
      // enablejsapi=1 and origin are crucial for some environments
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&enablejsapi=1&origin=${window.location.origin}`;
    }
    return url;
  };

  const handleGenerateThumbnail = async () => {
    if (!newCourseTitle) return;
    setIsGeneratingThumbnail(true);
    const imageUrl = await generateThumbnail(newCourseTitle);
    if (imageUrl) {
      setGeneratedThumbnail(imageUrl);
    } else {
      alert("이미지를 생성하지 못했습니다. 다시 시도해주세요.");
    }
    setIsGeneratingThumbnail(false);
  };

  const handleAddCourse = async () => {
    if (!newCourseTitle.trim()) return;
    
    let thumbnail = '';
    let videoUrl = '';
    
    // 1. Process Video URL
    if (newVideoUrl.trim()) {
      const videoId = getYouTubeId(newVideoUrl);
      if (videoId) {
        videoUrl = `https://www.youtube.com/embed/${videoId}`;
        // Set default YouTube thumbnail only if we don't have a generated one
        if (!generatedThumbnail) {
           thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        }
      } else {
        videoUrl = newVideoUrl;
      }
    }

    // 2. Set Thumbnail: Priority is Generated -> YouTube -> Random
    if (generatedThumbnail) {
      thumbnail = generatedThumbnail;
    } else if (!thumbnail) {
      // Fallback to random if no youtube thumb and no generated thumb
      thumbnail = `https://picsum.photos/400/225?random=${Date.now()}`;
    }

    const newCourse: Course = {
      id: Date.now().toString(),
      title: newCourseTitle,
      subject: newCourseSubject,
      duration: '05:00',
      thumbnail: thumbnail,
      completed: false,
      videoUrl: videoUrl
    };

    // DB Save
    await saveCourseToSupabase(newCourse);

    setCourses(prev => [newCourse, ...prev]);

    // Reset Form
    setNewCourseTitle('');
    setNewVideoUrl('');
    setGeneratedThumbnail(null);
    setShowAddModal(false);
  };

  const handlePlayVideo = (course: Course) => {
    if (!course.videoUrl) {
      alert("재생할 수 있는 동영상 링크가 없습니다.");
      return;
    }
    setSelectedCourse(course);
  };

  const filteredCourses = activeFilter === 'All' 
    ? courses 
    : courses.filter(c => c.subject === activeFilter);

  const progress = courses.length > 0 
    ? Math.round((courses.filter(c => c.completed).length / courses.length) * 100) 
    : 0;

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600 w-8 h-8" /></div>;
  }

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
        {/* Teacher stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-indigo-50 p-4 rounded-xl">
            <p className="text-sm text-indigo-600 font-medium">등록된 강의 수</p>
            <p className="text-3xl font-bold text-indigo-900">{courses.length}개</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-xl">
            <p className="text-sm text-purple-600 font-medium">과목 수</p>
            <p className="text-3xl font-bold text-purple-900">{new Set(courses.map(c => c.subject)).size}개</p>
          </div>
        </div>

        <h3 className="font-semibold text-slate-700 mt-4">전체 강의 목록 (인기순 정렬됨)</h3>
        <div className="space-y-3">
          {courses.length === 0 ? (
            <p className="text-slate-400 text-sm">등록된 강의가 없습니다. 학생들을 위해 강의를 올려주세요!</p>
          ) : (
            courses.map((course, index) => (
               <div key={course.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg group border border-slate-100 hover:border-indigo-200 transition-colors relative">
                 {index < 3 && (
                    <div className="absolute -top-2 -left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm z-10">
                      <Flame className="w-3 h-3 fill-current" /> HOT
                    </div>
                 )}
                 <div className="w-24 h-14 bg-slate-300 rounded overflow-hidden flex-shrink-0 relative cursor-pointer group-hover:ring-2 ring-indigo-200" onClick={() => handlePlayVideo(course)}>
                   <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                     <PlayCircle className="w-6 h-6 text-white" />
                   </div>
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="font-bold text-sm truncate text-slate-800 cursor-pointer hover:text-indigo-600" onClick={() => handlePlayVideo(course)}>{course.title}</div>
                   <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span>{course.subject} • {course.duration}</span>
                      {course.completionCount !== undefined && course.completionCount > 0 && (
                          <span className="flex items-center text-indigo-500 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">
                              <Users className="w-3 h-3 mr-1" /> {course.completionCount}명
                          </span>
                      )}
                   </div>
                 </div>
                 {/* Teacher Only Delete Button */}
                 <button 
                    onClick={(e) => handleDeleteCourse(e, course.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="강의 삭제 (모든 학생에게서 삭제됨)"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
               </div>
            ))
          )}
        </div>
        
        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-fade-in-up shadow-2xl max-h-[90vh] overflow-y-auto">
               <h3 className="font-bold text-lg mb-4 text-slate-800">새 강의 업로드</h3>
               <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">강의 제목</label>
                    <input 
                        value={newCourseTitle}
                        onChange={(e) => setNewCourseTitle(e.target.value)}
                        className="w-full p-3 bg-slate-50 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500" 
                        placeholder="강의 제목"
                    />
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">썸네일 이미지</label>
                    <div className="space-y-2">
                      {generatedThumbnail ? (
                        <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-100 border border-indigo-200">
                           <img src={generatedThumbnail} alt="Generated Thumbnail" className="w-full h-full object-cover" />
                           <button 
                             onClick={() => setGeneratedThumbnail(null)} 
                             className="absolute top-2 right-2 bg-white/80 p-1 rounded-full text-slate-600 hover:text-red-500"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 aspect-video bg-slate-50 text-slate-400">
                          <div className="text-center">
                            <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-50" />
                            <span className="text-xs">이미지 미리보기</span>
                          </div>
                        </div>
                      )}
                      
                      <button 
                        onClick={handleGenerateThumbnail}
                        disabled={!newCourseTitle || isGeneratingThumbnail}
                        className={`w-full py-2 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                          !newCourseTitle 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-pink-500 to-orange-500 text-white hover:opacity-90 shadow-md'
                        }`}
                      >
                        {isGeneratingThumbnail ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> 생성 중...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" /> AI 썸네일 생성
                          </>
                        )}
                      </button>
                      {!newCourseTitle && <p className="text-[10px] text-slate-400 text-center">제목을 입력하면 AI 이미지를 생성할 수 있습니다.</p>}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">유튜브 링크</label>
                    <input 
                        value={newVideoUrl}
                        onChange={(e) => setNewVideoUrl(e.target.value)}
                        className="w-full p-3 bg-slate-50 rounded-xl border outline-none focus:ring-2 focus:ring-indigo-500" 
                        placeholder="https://youtu.be/..."
                    />
                </div>
                  <select 
                    value={newCourseSubject}
                    onChange={(e) => setNewCourseSubject(e.target.value)}
                    className="w-full p-3 bg-slate-50 rounded-xl border outline-none"
                  >
                    {['국어', '수학', '영어', '한국사', '과학', '사회'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => { setShowAddModal(false); setGeneratedThumbnail(null); }} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600">취소</button>
                    <button onClick={handleAddCourse} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">업로드</button>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Video Player Modal for Teacher */}
        {selectedCourse && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedCourse(null)}>
            <div className="w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl relative aspect-video" onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelectedCourse(null)} className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors">
                <X className="w-6 h-6" />
              </button>
              <iframe
                src={getVideoSrc(selectedCourse.videoUrl)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Student View
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
                <h1 className="text-2xl font-bold">{userName}님의 숏-클래스 ⚡</h1>
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
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border-dashed border-2 border-slate-200">
          <PlayCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-bold">등록된 강의가 없습니다.</p>
          <p className="text-slate-400 text-sm mt-1">선생님이 곧 강의를 올려주실 거예요!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCourses.map((course) => {
            // Check if this course is in the top 3 of the ORIGINAL sorted list (before filter)
            const isPopular = courses.findIndex(c => c.id === course.id) < 3 && courses.length > 0;

            return (
              <div 
                key={course.id} 
                className={`group relative bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 transition-all hover:shadow-md ${course.completed ? 'opacity-90' : ''}`}
              >
                <div className="relative aspect-video bg-slate-200 cursor-pointer" onClick={() => handlePlayVideo(course)}>
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  
                  {/* HOT Badge */}
                  {isPopular && (
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg z-10 animate-pulse">
                        <Flame className="w-3 h-3 fill-current" /> HOT
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full group-hover:scale-110 transition-transform">
                      <PlayCircle className="w-8 h-8 text-white drop-shadow-md" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-md">
                    {course.duration}
                  </span>
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-indigo-600 mb-1 block">{course.subject}</span>
                      <h3 
                          className="font-bold text-slate-800 leading-tight text-sm truncate cursor-pointer hover:text-indigo-600"
                          onClick={() => handlePlayVideo(course)}
                      >
                          {course.title}
                      </h3>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                        {course.completionCount !== undefined && course.completionCount > 0 && (
                            <span className="flex items-center text-indigo-500 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">
                                <Users className="w-3 h-3 mr-1" /> {course.completionCount}명
                            </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button 
                        onClick={(e) => toggleComplete(e, course.id)}
                        className={`p-1 rounded-full transition-colors ${course.completed ? 'text-green-500 bg-green-50' : 'text-slate-300 hover:text-indigo-500 hover:bg-indigo-50'}`}
                        title={course.completed ? "학습 완료 취소" : "학습 완료 체크"}
                      >
                        <CheckCircle className="w-6 h-6 fill-current" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Player Modal for Student */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedCourse(null)}>
          <div className="w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl relative aspect-video" onClick={e => e.stopPropagation()}>
             <button onClick={() => setSelectedCourse(null)} className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors">
               <X className="w-6 h-6" />
             </button>
             <iframe
               src={getVideoSrc(selectedCourse.videoUrl)}
               className="w-full h-full"
               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
               allowFullScreen
             />
          </div>
        </div>
      )}
    </div>
  );
};

export default MicroLearning;
