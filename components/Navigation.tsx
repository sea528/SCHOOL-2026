import React from 'react';
import { ViewState } from '../types';
import { Home, BookOpen, Trophy, PenTool } from 'lucide-react';

interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView }) => {
  const navItems = [
    // { id: 'DASHBOARD', icon: Home, label: '홈' }, // Optional home
    { id: 'MICRO_LEARNING', icon: BookOpen, label: '숏클래스' },
    { id: 'GOD_SAENG', icon: Trophy, label: '갓생챌린지' },
    { id: 'DITTO', icon: PenTool, label: '성장기록' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe safe-area-inset-bottom z-40">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewState)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${
                isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <item.icon 
                className={`w-6 h-6 transition-transform duration-200 ${isActive ? '-translate-y-1' : ''}`} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-[10px] font-medium ${isActive ? 'opacity-100 font-bold' : 'opacity-70'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Navigation;