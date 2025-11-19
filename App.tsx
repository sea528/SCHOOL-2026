
import React, { useState } from 'react';
import { User, UserRole, ViewState } from './types';
import MicroLearning from './components/MicroLearning';
import GodSaeng from './components/GodSaeng';
import Ditto from './components/Ditto';
import Navigation from './components/Navigation';
import LoginScreen from './components/LoginScreen';
import { School, LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('MICRO_LEARNING');

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('MICRO_LEARNING');
  };

  // If no user is logged in, show the login screen
  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'MICRO_LEARNING':
        return <MicroLearning role={user.role} userId={user.id} userName={user.name} />;
      case 'GOD_SAENG':
        return <GodSaeng userId={user.id} role={user.role} />;
      case 'DITTO':
        return <Ditto userId={user.id} userName={user.name} role={user.role} />;
      default:
        return <MicroLearning role={user.role} userId={user.id} userName={user.name} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 h-14 flex items-center justify-between max-w-md mx-auto w-full">
        <div className="flex items-center gap-2 text-indigo-700">
          <School className="w-6 h-6" />
          <span className="font-jua text-xl pt-1">갓생스쿨</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
            {user.role === UserRole.TEACHER ? '👨‍🏫' : '🧑‍🎓'} {user.name}
          </span>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            title="로그아웃"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-md mx-auto p-4 w-full min-h-[calc(100vh-3.5rem)] relative">
        {/* View Transition Wrapper */}
        <div className="animate-fade-in">
          {renderContent()}
        </div>
      </main>

      {/* Bottom Nav */}
      <Navigation currentView={currentView} setView={setCurrentView} />

      {/* Helper Styles for Animation */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
