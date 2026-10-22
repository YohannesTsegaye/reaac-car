import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Home, Trophy, Gauge, Flag, Zap, Skull } from 'lucide-react';
import { GameStats } from '../game/types';

interface GameOverModalProps {
  stats: GameStats;
  onRestart: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onRestart,
  onHome,
}) => {
  const isNewHighScore = stats.score >= stats.highScore && stats.score > 0;

  useEffect(() => {
    if (isNewHighScore) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#f59e0b', '#ec4899', '#22c55e'],
        });
      } catch {}
    }
  }, [isNewHighScore]);

  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-30 select-none">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-red-500/40 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(239,68,68,0.3)] flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
        {/* Crash Icon Banner */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center mb-4">
          <Skull className="w-9 h-9 text-rose-500 animate-pulse" />
        </div>

        {/* Title */}
        <h2 className="text-3xl md:text-4xl font-black italic tracking-wide text-white uppercase mb-1">
          HEAD-ON COLLISION!
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          You crashed into oncoming traffic. Keep your eyes on the road!
        </p>

        {/* New Record Banner if applicable */}
        {isNewHighScore && (
          <div className="w-full py-2 px-4 mb-4 bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border border-amber-500/50 rounded-2xl text-amber-300 font-bold text-sm flex items-center justify-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>NEW ALL-TIME RECORD SET!</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 w-full mb-6">
          {/* Final Score */}
          <div className="col-span-2 p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col items-center">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Total Score</span>
            <span className="text-3xl font-black font-mono-numbers text-amber-300">
              {stats.score.toLocaleString()}
            </span>
          </div>

          {/* Distance */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-0.5">
              <Flag className="w-3.5 h-3.5 text-sky-400" />
              <span>Distance</span>
            </div>
            <span className="text-xl font-bold font-mono-numbers text-white">
              {stats.distance}m
            </span>
          </div>

          {/* Near Misses */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-0.5">
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span>Near-Misses</span>
            </div>
            <span className="text-xl font-bold font-mono-numbers text-sky-400">
              {stats.nearMissCount}
            </span>
          </div>

          {/* Top Speed */}
          <div className="col-span-2 p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between px-6">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <span>Peak Velocity Reached</span>
            </div>
            <span className="text-lg font-bold font-mono-numbers text-emerald-400">
              {stats.topSpeedKmh} KM/H
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={onRestart}
            className="flex-1 py-3.5 px-6 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-base rounded-2xl shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>TRY AGAIN (SPACE)</span>
          </button>

          <button
            onClick={onHome}
            className="py-3.5 px-5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>GARAGE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
