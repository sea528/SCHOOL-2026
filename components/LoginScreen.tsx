import React, { useState } from 'react';
import { School, ArrowRight } from 'lucide-react';
import { User, UserRole } from '../types';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && studentId.trim()) {
      // Special check for teacher login simulation
      const role = studentId === 'admin' || studentId === 'teacher' ? UserRole.TEACHER : UserRole.STUDENT;
      
      onLogin({
        id: studentId,
        name: name,
        role: role
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden animate-fade-in-up">
        <div className="bg-indigo-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-4">
            <School className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-jua text-white mb-1 tracking-wide">갓생스쿨</h1>
          <p className="text-indigo-100 text-lg font-jua">너도해봐 ✨</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">학번 (ID)</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="20260101"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2 font-jua"
          >
            등교하기 <ArrowRight className="w-5 h-5" />
          </button>
          
          <p className="text-center text-xs text-slate-400">
            * 선생님은 ID에 'teacher'를 입력하세요.
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;