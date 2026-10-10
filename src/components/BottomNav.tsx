import React from 'react';
import { Home, BookOpen, BarChart2, User } from 'lucide-react';
import { TabType } from '../types';
import { sounds } from '../utils/audio';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export default function BottomNav({ activeTab, onSelectTab }: BottomNavProps) {
  const items: { id: TabType; label: string; icon: typeof Home }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'library', label: 'Library', icon: BookOpen },
    { id: 'progress', label: 'Progress', icon: BarChart2 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const isDarkNav = activeTab === 'home';

  return (
    <nav className={`fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md h-[68px] rounded-full shadow-2xl flex items-center justify-around px-3 z-40 backdrop-blur-xl transition-all duration-300 ${
      isDarkNav
        ? 'bg-[#0B0E1E]/85 border border-white/15 text-white shadow-[0_16px_40px_rgba(0,0,0,0.6)]'
        : 'bg-white/95 border border-[#E6E8EC]/80 text-[#0E1116] shadow-[0_8px_32px_rgba(16,24,40,0.12)]'
    }`}>
      {items.map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => {
              sounds.playTap();
              onSelectTab(item.id);
            }}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3.5 rounded-full transition-all duration-200 active:scale-95 cursor-pointer ${
              isActive
                ? isDarkNav
                  ? 'text-white'
                  : 'text-[#0E1116]'
                : isDarkNav
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-[#66726B] hover:text-[#0E1116]'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${
                isActive
                  ? isDarkNav
                    ? 'bg-[#3730a3]/80 text-white border border-indigo-400/30 shadow-[0_0_12px_rgba(99,102,241,0.5)]'
                    : 'bg-[#F7F7F5] text-[#0E1116]'
                  : 'bg-transparent'
              }`}
            >
              <Icon size={19} className={isActive ? 'stroke-[2.5]' : 'stroke-[2]'} />
            </div>
            <span className={`text-[10px] tracking-tight ${
              isActive 
                ? 'font-extrabold text-white' 
                : isDarkNav 
                ? 'font-medium text-slate-400' 
                : 'font-semibold text-[#66726B]'
            }`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
