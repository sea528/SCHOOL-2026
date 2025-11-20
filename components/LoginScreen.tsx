
import React, { useState } from 'react';
import { School, ArrowRight, Loader2, User as UserIcon, CreditCard, Sparkles } from 'lucide-react';
import { User, UserRole } from '../types';
import { loginUserToSupabase } from '../services/storageService';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && studentId.trim()) {
      setIsLoggingIn(true);
      
      // Determine role based on ID convention
      const role = studentId === 'admin' || studentId === 'teacher' ? UserRole.TEACHER : UserRole.STUDENT;
      
      // Login/Signup via Supabase
      const user = await loginUserToSupabase(studentId, name, role);
      
      setIsLoggingIn(false);
      
      if (user) {
        onLogin(user);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      
      <div className="max-w-md w-full bg-white/80 backdrop-blur-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in-up border border-white/50 relative z-10">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/school.png')]"></div>
          
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md mb-4 shadow-lg animate-[float_3s_ease-in-out_infinite]">
            <School className="w-10 h-10 text-white" />
          </div>
          <div className="relative">
            <h1 className="text-4xl font-jua text-white mb-1 tracking-wide drop-shadow-md">갓생스쿨</h1>
            <div className="flex items-center justify-center gap-1 text-indigo-100 font-jua text-lg">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>너도해봐 프로젝트</span>
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white">
          <div className="space-y-5">
            <div className="relative group">
              <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">이름</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
                  required
                  disabled={isLoggingIn}
                />
              </div>
            </div>
            
            <div className="relative group">
              <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase tracking-wider">학번 (ID)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <CreditCard className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="예: 20260101"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
                  required
                  disabled={isLoggingIn}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 ml-1 flex items-center gap-1">
                * 선생님은 ID에 <span className="font-bold text-indigo-500 bg-indigo-50 px-1 rounded">*******</span>를 입력하세요.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="relative w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 font-jua disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none group overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> 로그인 중...
                </>
              ) : (
                <>
                  등교하기 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
          
          <div className="text-center space-y-2 pt-2">
            <p className="text-xs text-slate-400">
              처음 로그인하면 자동으로 계정이 생성됩니다.
            </p>
          </div>
        </form>
      </div>
      
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
};

export default LoginScreen;
