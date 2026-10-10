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
    <div className="flex-1 flex flex-col overflow-y-auto px-6 pt-4 pb-28">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0E1116] tracking-tight">Lesson Library</h1>
        <p className="text-sm font-semibold text-[#66726B] mt-1">
          Complete warehouse curriculum & drills
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative mb-5">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#66726B]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search lessons, tools, or procedures..."
          className="w-full h-13 pl-11 pr-4 rounded-full bg-white border border-[#E6E8EC] text-sm font-semibold text-[#0E1116] placeholder:text-[#66726B] focus:outline-none focus:border-[#0E1116] shadow-sm"
        />
      </div>

      {/* Category Filter Chips */}
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
              className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all active:scale-95 ${
                isActive
                  ? 'bg-[#0E1116] text-white shadow-md'
                  : 'bg-white text-[#3D4652] border border-[#E6E8EC] hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Results Grid */}
      {filteredLessons.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
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
        <div className="text-center py-12 bg-white rounded-3xl border border-[#E6E8EC] p-6">
          <Sparkles className="mx-auto text-slate-400 mb-2" size={32} />
          <p className="text-base font-bold text-[#0E1116]">No lessons found</p>
          <p className="text-xs text-[#66726B] mt-1">Try another search term or select "All"</p>
        </div>
      )}
    </div>
  );
}
