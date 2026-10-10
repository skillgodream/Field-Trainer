import React from 'react';
import { motion } from 'framer-motion';
import { Target, Zap, TrendingUp, Star } from 'lucide-react';
const gurujiImg = "/Coachguru.png";

interface MeetGurujiScreenProps {
  onContinue: () => void;
}

export const MeetGurujiScreen: React.FC<MeetGurujiScreenProps> = ({ onContinue }) => {
  return (
    <div 
      className="relative w-full min-h-[100dvh] sm:min-h-[780px] bg-[#070A14] text-white overflow-hidden flex flex-col justify-between p-4 sm:p-6 selection:bg-indigo-500 selection:text-white"
      onClick={onContinue}
    >
      {/* 1. Premium Blurred Background Image with Vignette & Glowing Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[#070A14]">
        {/* Dynamic, CSS-Only Premium Mesh Gradient Fallback */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#02040a] via-[#070a1e] to-[#120822] opacity-100" />
        
        {/* Ambient Glowing Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-indigo-600/15 blur-[120px]" />
        <div className="absolute top-1/3 right-[-10%] w-[380px] h-[380px] rounded-full bg-[#3B82F6]/20 blur-[100px]" />
        <div className="absolute bottom-1/4 left-[-10%] w-[380px] h-[380px] rounded-full bg-[#8B5CF6]/15 blur-[110px]" />

        {/* High-res harbor / city dusk background heavily blurred */}
        <img
          src="https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80"
          alt="Premium Background"
          className="w-full h-full object-cover filter blur-[90px] scale-125 opacity-25 brightness-50 transition-opacity duration-1000"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).style.opacity = '0';
          }}
        />
        {/* Dark Vignette Overlay for perfect footers blending */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#070A14] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#070A14]/40 to-[#070A14]" />
      </div>

      {/* 2. Center Hero Koala Coach Visual (30% Larger Avatar) */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center py-4 shrink-0">
        <div className="relative w-84 h-84 sm:w-[480px] sm:h-[480px] flex items-center justify-center">
          {/* Glowing Shield / Teardrop Organic Contour Badge */}
          <div className="absolute inset-0 rounded-[72px] bg-gradient-to-br from-indigo-500/15 via-blue-600/10 to-purple-600/15 border border-white/10 shadow-[0_0_100px_rgba(79,70,229,0.3)] backdrop-blur-md transform rotate-[-1.5deg]" />
          
          {/* 3D Koala Coach Avatar (30% Bigger & Perfectly Proportioned) */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="relative z-10 w-full h-full flex items-center justify-center p-2 scale-135 sm:scale-145"
          >
            <img
              src="/Coachguru.png"
              alt="Guruji Koala Coach"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain filter drop-shadow-[0_30px_60px_rgba(0,0,0,0.7)]"
              onError={(e) => {
                (e.target as HTMLImageElement).src = gurujiImg || "/guruji 1.png";
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* 3. Bottom Content Block: Blended Footer & CTA */}
      <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col items-center text-center space-y-4 pb-4 shrink-0 bg-transparent">
        {/* Headline & Subtitle */}
        <div className="space-y-1">
          <span className="text-base sm:text-lg font-light text-slate-300 tracking-tight block drop-shadow-sm">
            Welcome to
          </span>
          <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent tracking-tight leading-none drop-shadow-md">
            Guruji
          </h1>
          <p className="text-[13px] text-slate-300/80 font-normal leading-relaxed max-w-[290px] sm:max-w-[320px] mx-auto pt-1 drop-shadow-sm">
            Your autonomous frontline coach for high-stakes operational decisions.
          </p>
        </div>

        {/* 4. Small Feature Indicators (Icons Made Small with Less Text) */}
        <div className="flex items-center justify-center gap-3 w-full py-1">
          {/* Indicator 1 */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5 backdrop-blur-md shadow-inner">
            <Target className="w-3 h-3 text-sky-400" />
            <span className="text-[10px] font-semibold text-slate-300">Learn</span>
          </div>

          {/* Indicator 2 */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5 backdrop-blur-md shadow-inner">
            <Zap className="w-3 h-3 text-indigo-400" />
            <span className="text-[10px] font-semibold text-slate-300">Guide</span>
          </div>

          {/* Indicator 3 */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5 backdrop-blur-md shadow-inner">
            <TrendingUp className="w-3 h-3 text-violet-400" />
            <span className="text-[10px] font-semibold text-slate-300">Track</span>
          </div>

          {/* Indicator 4 */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5 backdrop-blur-md shadow-inner">
            <Star className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-semibold text-slate-300">Grow</span>
          </div>
        </div>

        {/* 5. Primary CTA Button: Fluid Glass Translucent Tap to explore */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.stopPropagation();
            onContinue();
          }}
          className="w-full h-12 sm:h-13 rounded-full bg-gradient-to-r from-[#2563EB]/40 via-[#4F46E5]/35 to-[#7C3AED]/40 backdrop-blur-2xl text-white font-semibold text-sm sm:text-base shadow-[0_8px_32px_0_rgba(31,38,135,0.25)] border border-white/20 hover:from-[#2563EB]/55 hover:to-[#7C3AED]/55 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
        >
          <span>Tap to explore</span>
          <span className="text-lg">→</span>
        </motion.button>
      </div>
    </div>
  );
};

