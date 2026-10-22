import React from 'react';
import { Volume2, VolumeX, Eye, Flame, ShieldAlert, Award } from 'lucide-react';
import { CarCustomization } from '../game/types';

interface TitleScreenProps {
  onStart: () => void;
  highScore: number;
  currentColor: string;
  onSelectColor: (color: string) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

const CAR_COLORS: CarCustomization[] = [
  { color: '#0284c7', name: 'Cyber Azure', accent: 'border-sky-400' },
  { color: '#ef4444', name: 'Inferno Red', accent: 'border-red-500' },
  { color: '#eab308', name: 'Neon Volt', accent: 'border-yellow-400' },
  { color: '#10b981', name: 'Emerald Flux', accent: 'border-emerald-400' },
  { color: '#a855f7', name: 'Hyper Violet', accent: 'border-purple-400' },
  { color: '#f97316', name: 'Solar Flare', accent: 'border-orange-500' },
];

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  highScore,
  currentColor,
  onSelectColor,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-10 pointer-events-none select-none z-20">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between w-full">
        {/* High Score Badge */}
        <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-900/85 border border-slate-700/60 rounded-xl text-slate-200">
          <Award className="w-5 h-5 text-amber-400 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[10px] tracking-wider uppercase text-slate-400 font-semibold">High Score</span>
            <span className="text-base font-bold font-mono-numbers text-amber-300">
              {highScore.toLocaleString()} PTS
            </span>
          </div>
        </div>

        {/* Audio Mute Button */}
        <button
          onClick={onToggleMute}
          className="pointer-events-auto flex items-center justify-center w-11 h-11 bg-slate-900/85 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-slate-300 transition-colors"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-sky-400" />}
        </button>
      </div>

      {/* Hero Title Lockup & Bespoke Inline SVG */}
      <div className="flex flex-col items-center text-center my-auto max-w-2xl mx-auto">
        {/* Title Lockup SVG */}
        <div className="w-full max-w-md mb-2">
          <svg viewBox="0 0 500 110" className="w-full drop-shadow-[0_10px_25px_rgba(2,132,199,0.35)]">
            <defs>
              <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
              <linearGradient id="strokeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            {/* Speed lines */}
            <path d="M 20 20 L 160 20" stroke="url(#strokeGrad)" strokeWidth="3" strokeDasharray="12 6" />
            <path d="M 340 90 L 480 90" stroke="url(#strokeGrad)" strokeWidth="3" strokeDasharray="12 6" />
            {/* Main Text */}
            <text
              x="50%"
              y="58"
              textAnchor="middle"
              className="font-extrabold italic tracking-wider fill-white text-[52px]"
              style={{ fontFamily: "'Chakra Petch', sans-serif" }}
            >
              HIGHWAY RUSH
            </text>
            <text
              x="50%"
              y="90"
              textAnchor="middle"
              className="font-bold tracking-[0.25em] text-[15px]"
              fill="url(#titleGrad)"
              style={{ fontFamily: "'Chakra Petch', sans-serif" }}
            >
              ONCOMING TRAFFIC SURVIVAL
            </text>
          </svg>
        </div>

        {/* Core Objective Tagline */}
        <div className="flex items-center gap-2 px-4 py-1.5 mb-6 bg-rose-500/15 border border-rose-500/40 rounded-full text-rose-300 text-xs md:text-sm font-semibold tracking-wide">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>DO NOT CRASH INTO ONCOMING TRAFFIC · THREAD NEAR-MISSES FOR NITRO</span>
        </div>

        {/* Color Customizer Swatches */}
        <div className="pointer-events-auto flex items-center gap-2.5 p-2 bg-slate-900/80 border border-slate-700/60 rounded-2xl mb-8">
          <span className="text-xs uppercase text-slate-400 font-bold px-2">Paint:</span>
          {CAR_COLORS.map((item) => (
            <button
              key={item.color}
              onClick={() => onSelectColor(item.color)}
              className={`w-7 h-7 rounded-lg transition-all transform hover:scale-110 ${
                currentColor === item.color
                  ? `scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900 shadow-lg`
                  : 'opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: item.color }}
              title={item.name}
            />
          ))}
        </div>

        {/* Primary Start CTA Button */}
        <button
          onClick={onStart}
          className="pointer-events-auto group relative px-10 py-4 bg-gradient-to-r from-sky-500 via-indigo-600 to-rose-600 hover:from-sky-400 hover:to-rose-500 text-white font-black text-xl md:text-2xl italic tracking-wider rounded-2xl shadow-[0_0_35px_rgba(56,189,248,0.45)] hover:shadow-[0_0_50px_rgba(244,63,94,0.6)] transform hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Flame className="w-6 h-6 text-yellow-300 group-hover:scale-125 transition-transform" />
            <span>HIT THE HIGHWAY</span>
          </div>
        </button>

        <span className="text-xs text-slate-400 mt-3 font-mono-numbers">
          PRESS <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-600 text-slate-200">SPACE</kbd> OR <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-600 text-slate-200">ENTER</kbd> TO LAUNCH
        </span>
      </div>

      {/* Bottom Flat Control Hint Line */}
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 text-xs text-slate-400 bg-slate-950/80 py-3 px-6 rounded-2xl border border-slate-800/80 mx-auto max-w-3xl">
        <span className="flex items-center gap-1.5">
          <span className="font-bold text-sky-400">A / D</span> or <span className="font-bold text-sky-400">← / →</span> Steer
        </span>
        <span className="text-slate-600">·</span>
        <span className="flex items-center gap-1.5">
          <span className="font-bold text-amber-400">SPACE</span> Nitro Boost
        </span>
        <span className="text-slate-600">·</span>
        <span className="flex items-center gap-1.5">
          <span className="font-bold text-indigo-400">C</span> Switch View
        </span>
        <span className="text-slate-600">·</span>
        <span className="flex items-center gap-1.5">
          <span className="font-bold text-rose-400">ESC</span> Pause
        </span>
      </div>
    </div>
  );
};
