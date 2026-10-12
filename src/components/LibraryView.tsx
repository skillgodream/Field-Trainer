import React, { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { Lesson, CategoryType } from '../types';
import LessonCard from './LessonCard';
import { sounds } from '../utils/audio';

interface LibraryViewProps {
  lessons: Lesson[];
  onSelectLesson: (lesson: Lesson) => void;
}

export default function LibraryView({ lessons, onSelectLesson }: LibraryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryType>('All');

  const categories: CategoryType[] = ['All', 'Picking', 'Packing', 'Safety', 'Inventory'];

  const filteredLessons = lessons.filter((lesson) => {
    const matchesCategory = activeCategory === 'All' || lesson.category === activeCategory;
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-5 pt-4 pb-28 text-white relative z-10 animate-in fade-in duration-200">
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Lesson Library</h1>
        <p className="text-sm font-normal text-white/60 mt-1">
          Complete warehouse curriculum & drills
        </p>
      </div>

      {/* Apple Spotlight Style Search Bar */}
      <div className="relative mb-5 group">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search lessons, tools, or procedures..."
          className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.09] focus:bg-white/[0.12] border border-white/10 focus:border-white/30 text-sm font-medium text-white placeholder:text-white/40 focus:outline-none backdrop-blur-xl shadow-inner transition-all"
        />
      </div>

      {/* Apple Segmented Control / Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                sounds.playTap();
                setActiveCategory(cat);
              }}
              className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-all duration-200 active:scale-95 cursor-pointer backdrop-blur-md ${
                isActive
                  ? 'bg-white text-black shadow-[0_4px_14px_rgba(255,255,255,0.25)] font-bold'
                  : 'bg-white/[0.06] text-white/70 hover:text-white hover:bg-white/10 border border-white/[0.08]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Results Grid with Apple Theme Cards */}
      {filteredLessons.length > 0 ? (
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
          {filteredLessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              title={lesson.title}
              subtitle={lesson.subtitle}
              color={lesson.color}
              artType={lesson.artType}
              progress={lesson.progress}
              onClick={() => {
                sounds.playTap();
                onSelectLesson(lesson);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white/[0.04] backdrop-blur-2xl rounded-3xl border border-white/10 p-6">
          <Sparkles className="mx-auto text-white/40 mb-3" size={32} />
          <p className="text-base font-bold text-white">No lessons found</p>
          <p className="text-xs text-white/50 mt-1">Try another search term or select "All"</p>
        </div>
      )}
    </div>
  );
}
