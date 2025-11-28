import React from 'react';
import { PlaySquare, Target, TrendingUp } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'classes' | 'challenges' | 'growth';
  onTabChange: (tab: 'classes' | 'challenges' | 'growth') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const getIconColor = (tab: string) => activeTab === tab ? '#0066FF' : '#666666';
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-card-border h-[64px] pb-safe flex justify-around items-center z-40 max-w-[480px] mx-auto">
      <button 
        onClick={() => onTabChange('classes')}
        className="flex flex-col items-center justify-center w-full h-full"
        aria-label="갓생클래스 탭"
      >
        <PlaySquare size={24} color={getIconColor('classes')} />
        <span className={`text-[12px] mt-1 ${activeTab === 'classes' ? 'text-primary font-medium' : 'text-muted-text'}`}>
          갓생클래스
        </span>
      </button>
      
      <button 
        onClick={() => onTabChange('challenges')}
        className="flex flex-col items-center justify-center w-full h-full"
        aria-label="갓생챌린지 탭"
      >
        <Target size={24} color={getIconColor('challenges')} />
        <span className={`text-[12px] mt-1 ${activeTab === 'challenges' ? 'text-primary font-medium' : 'text-muted-text'}`}>
          갓생챌린지
        </span>
      </button>

      <button 
        onClick={() => onTabChange('growth')}
        className="flex flex-col items-center justify-center w-full h-full"
        aria-label="성장기록 탭"
      >
        <TrendingUp size={24} color={getIconColor('growth')} />
        <span className={`text-[12px] mt-1 ${activeTab === 'growth' ? 'text-primary font-medium' : 'text-muted-text'}`}>
          성장기록
        </span>
      </button>
    </nav>
  );
};