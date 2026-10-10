import React, { useState } from 'react';
import { User, Volume2, VolumeX, Moon, Sun, RotateCcw, Shield, Award, Check, Sparkles } from 'lucide-react';
import { sounds } from '../utils/audio';

interface ProfileViewProps {
  onResetData: () => void;
  onOpenBentoShowcase?: () => void;
  onOpenPassport?: () => void;
}

export default function ProfileView({ onResetData, onOpenBentoShowcase, onOpenPassport }: ProfileViewProps) {
  const [audioEnabled, setAudioEnabled] = useState(sounds.isSoundEnabled());
  const [darkMode, setDarkMode] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const toggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    sounds.setSoundEnabled(next);
    if (next) {
      sounds.playTap();
      sounds.speak('Sound effects enabled');
    }
  };

  const toggleDarkMode = () => {
    sounds.playTap();
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleReset = () => {
    sounds.playTap();
    onResetData();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-6 pt-4 pb-28 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0E1116] tracking-tight">Worker Profile</h1>
        <p className="text-sm font-semibold text-[#66726B] mt-1">
          Shift credentials & device preferences
        </p>
      </div>

      {/* User Card */}
      <div className="bg-white rounded-3xl p-5 border border-[#E6E8EC] shadow-sm flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#0E1116] text-white flex items-center justify-center font-bold text-2xl shadow-md">
          VS
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#0E1116]">Vikram Sharma</h2>
          <p className="text-xs font-bold text-[#1FA55E]">Fulfillment Specialist · Bay A/B</p>
          <span className="text-[11px] font-semibold text-[#66726B] block mt-0.5">
            Badge ID: WMS-88492 · Shift 1
          </span>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-[#E6E8EC] text-center shadow-sm">
          <span className="text-[10px] uppercase font-bold text-[#66726B] block">Drills</span>
          <span className="text-xl font-bold text-[#0E1116] mt-0.5 block">24</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-[#E6E8EC] text-center shadow-sm">
          <span className="text-[10px] uppercase font-bold text-[#66726B] block">Scan Rate</span>
          <span className="text-xl font-bold text-[#1FA55E] mt-0.5 block">99.2%</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-[#E6E8EC] text-center shadow-sm">
          <span className="text-[10px] uppercase font-bold text-[#66726B] block">Tier</span>
          <span className="text-xl font-bold text-[#2F6FED] mt-0.5 block">Level 2</span>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#66726B]">
          Audio & Display Settings
        </h3>

        {/* Audio Toggle */}
        <button
          onClick={toggleAudio}
          className="w-full p-4 bg-white rounded-2xl border border-[#E6E8EC] flex items-center justify-between active:scale-[0.985] transition-all shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </div>
            <div className="text-left">
              <span className="text-sm font-bold text-[#0E1116] block">Audio Sound Effects & Voice</span>
              <span className="text-xs text-[#66726B] font-semibold block">
                {audioEnabled ? 'Voice coach and sound chimes on' : 'Muted'}
              </span>
            </div>
          </div>
          <div
            className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${
              audioEnabled ? 'bg-[#0E1116] justify-end' : 'bg-slate-200 justify-start'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
          </div>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="w-full p-4 bg-white rounded-2xl border border-[#E6E8EC] flex items-center justify-between active:scale-[0.985] transition-all shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              {darkMode ? <Moon size={20} /> : <Sun size={20} />}
            </div>
            <div className="text-left">
              <span className="text-sm font-bold text-[#0E1116]">Dim Floor Lighting Mode</span>
              <span className="text-xs text-[#66726B] font-semibold block">
                {darkMode ? 'High contrast dark theme active' : 'Clean light mode'}
              </span>
            </div>
          </div>
          <div
            className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${
              darkMode ? 'bg-[#0E1116] justify-end' : 'bg-slate-200 justify-start'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
          </div>
        </button>

        {/* Bento Architecture Showcase Launcher */}
        {onOpenBentoShowcase && (
          <button
            onClick={() => {
              sounds.playTap();
              onOpenBentoShowcase();
            }}
            className="w-full p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl border border-white/10 flex items-center justify-between active:scale-[0.985] transition-all shadow-md cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
                <Sparkles size={18} />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold text-white block">Bento Architecture Showcase</span>
                <span className="text-xs text-indigo-200/80 font-medium block">
                  Stripe & Linear UI grade component preview
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-300 bg-white/10 px-3 py-1 rounded-full">
              Preview →
            </span>
          </button>
        )}
      </div>

      {/* Safety Compliance & Reset */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#66726B]">
          Data & Compliance
        </h3>

        <div className="p-3.5 bg-[#DDF3E6] border border-[#DDF3E6] rounded-2xl flex items-center gap-3 text-xs font-bold text-[#14532D]">
          <Shield size={20} className="shrink-0 text-[#16A34A]" />
          <span>Warehouse safety credentials are active and verified.</span>
        </div>

        {/* Process Passport Builder Launcher */}
        {onOpenPassport && (
          <button
            onClick={() => {
              sounds.playTap();
              onOpenPassport();
            }}
            className="w-full p-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-950 rounded-2xl flex items-center justify-between active:scale-[0.985] transition-all cursor-pointer"
          >
            <div className="text-left">
              <span className="text-sm font-bold text-indigo-950 block">Process Passport (P0/P1/P2)</span>
              <span className="text-xs text-indigo-700 font-medium block">
                Trainer review & sign-off basics sheet
              </span>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-white px-3 py-1 rounded-full border border-indigo-200">
              Inspect →
            </span>
          </button>
        )}

        <button
          onClick={handleReset}
          className="w-full h-12 rounded-2xl border border-[#E6E8EC] bg-white text-[#991B1B] font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-50 active:scale-98 transition-all"
        >
          {resetSuccess ? (
            <>
              <Check size={16} className="text-emerald-600" />
              <span className="text-emerald-700">Practice History Reset!</span>
            </>
          ) : (
            <>
              <RotateCcw size={16} /> Reset Practice Scores to Default
            </>
          )}
        </button>
      </div>
    </div>
  );
}
