import React, { useState, useEffect } from 'react';
import { Course, UserRole } from '../types';
import { CheckCircle, PlayCircle, BarChart2 } from 'lucide-react';
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

  const filteredCourses = activeFilter === 'All' 
    ? courses 
    : courses.filter(c => c.subject === activeFilter);

  const progress = Math.round((courses.filter(c => c.completed).length / courses.length) * 100);

  if (role === UserRole.TEACHER) {
    return (
      <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-indigo-600" />
          학급 학습 현황 대시보드
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
        <h3 className="font-semibold text-slate-700 mb-3">학생별 상세 로그</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">학생명</th>
                <th className="px-4 py-3">수강 강의 수</th>
                <th className="px-4 py-3">최근 접속</th>
                <th className="px-4 py-3 rounded-r-lg">상태</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4].map((i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">학생 {i}</td>
                  <td className="px-4 py-3">{10 - i} / 20</td>
                  <td className="px-4 py-3">방금 전</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${i === 1 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {i === 1 ? '완료' : '진행중'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-2">{userName}님의 숏-클래스 ⚡</h1>
        <p className="text-indigo-100 mb-4">이동 시간에 딱 3분! 핵심만 쏙쏙 뽑아먹자.</p>
        
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-white/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
            <div 
              className="bg-green-400 h-full transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }} 
            />
          </div>
          <span className="font-bold">{progress}% 달성</span>
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
                ? 'bg-indigo-600 text-white' 
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
            className={`group relative bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 transition-all hover:shadow-md ${course.completed ? 'opacity-75' : ''}`}
          >
            <div className="relative aspect-video bg-slate-200">
              <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <PlayCircle className="w-12 h-12 text-white/90 drop-shadow-lg group-hover:scale-110 transition-transform" />
              </div>
              <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-md">
                {course.duration}
              </span>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="text-xs font-bold text-indigo-600 mb-1 block">{course.subject}</span>
                  <h3 className="font-bold text-slate-800 leading-tight">{course.title}</h3>
                </div>
                <button 
                  onClick={() => toggleComplete(course.id)}
                  className={`flex-shrink-0 p-1 rounded-full transition-colors ${course.completed ? 'text-green-500' : 'text-slate-300 hover:text-indigo-500'}`}
                >
                  <CheckCircle className="w-6 h-6 fill-current" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MicroLearning;