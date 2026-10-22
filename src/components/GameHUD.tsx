import React from 'react';
import { Camera, Volume2, VolumeX, Pause, Flame, Zap, Compass, Sparkles } from 'lucide-react';
import { GameStats, NearMissEvent, CameraViewMode } from '../game/types';

interface GameHUDProps {
  stats: GameStats;
  nearMissEvent: NearMissEvent | null;
  cameraMode: CameraViewMode;
  isMuted: boolean;
  onCycleCamera: () => void;
  onToggleMute: () => void;
  onPause: () => void;
  onSteerTouchStart: (dir: number) => void;
  onSteerTouchEnd: () => void;
  onBoostTouchStart: () => void;
  onBoostTouchEnd: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  nearMissEvent,
  cameraMode,
  isMuted,
  onCycleCamera,
  onToggleMute,
  onPause,
  onSteerTouchStart,
  onSteerTouchEnd,
  onBoostTouchStart,
  onBoostTouchEnd,
}) => {
  // Gear estimation based on speed
  const getGear = (speed: number) => {
    if (speed < 90) return 'D2';
    if (speed < 120) return 'D3';
    if (speed < 155) return 'D4';
    if (speed < 190) return 'D5';
    return 'D6';
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-4 md:p-6">
      {/* Speed lines overlay when boosting */}
      {stats.isBoosting && <div className="absolute inset-0 nitro-vignette" />}

      {/* TOP PERIMETER CLUSTER */}
      <div className="flex items-start justify-between w-full">
        {/* Top-Left: Score, Combo & Near-Miss count */}
        <div className="flex flex-col gap-2">
          {/* Score Display */}
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/85 border border-slate-700/60 rounded-2xl shadow-lg">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Score</span>
              <span className="text-xl md:text-2xl font-black font-mono-numbers text-white tracking-tight">
                {stats.score.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Combo Multiplier Pill (shows when active combo) */}
          {stats.combo > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-amber-500/90 to-rose-600/90 rounded-xl border border-amber-300/40 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)] transform -rotate-1">
              <Zap className="w-4 h-4 text-yellow-200 fill-yellow-200" />
              <span className="text-xs font-black tracking-wider uppercase">
                COMBO x{stats.combo} ({stats.multiplier.toFixed(1)}x)
              </span>
              {/* Combo timer bar */}
              <div className="w-12 h-1.5 bg-black/40 rounded-full overflow-hidden ml-1">
                <div
                  className="h-full bg-white transition-all duration-100 ease-linear"
                  style={{ width: `${Math.max(0, Math.min(100, (stats.comboTimer / 3.5) * 100))}%` }}
                />
              </div>
            </div>
          )}

          {/* Near-Miss Counter */}
          <div className="text-[11px] font-bold text-slate-300 px-3 py-1 bg-slate-900/70 border border-slate-800 rounded-lg w-fit">
            NEAR-MISSES: <span className="text-sky-400 font-mono-numbers">{stats.nearMissCount}</span>
          </div>
        </div>

        {/* Top-Center: Floating Near Miss Alert Popup */}
        <div className="flex flex-col items-center">
          {nearMissEvent && Date.now() - nearMissEvent.timestamp < 1600 && (
            <div className="animate-bounce flex flex-col items-center px-4 py-2 bg-gradient-to-r from-rose-600 via-amber-500 to-sky-500 text-white rounded-2xl border-2 border-white/60 shadow-[0_0_30px_rgba(244,63,94,0.7)]">
              <div className="text-sm md:text-base font-black italic tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-yellow-200 fill-yellow-200" />
                <span>{nearMissEvent.text}</span>
              </div>
              <span className="text-xs font-bold font-mono-numbers text-yellow-100">
                +{nearMissEvent.points} PTS
              </span>
            </div>
          )}
        </div>

        {/* Top-Right: Nitro Energy Bar & Controls Buttons */}
        <div className="flex flex-col items-end gap-3">
          {/* Quick HUD Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onCycleCamera}
              className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/85 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-xs font-bold text-slate-200 transition-colors"
              title="Change Camera View (C)"
            >
              <Camera className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">{cameraMode}</span>
            </button>

            <button
              onClick={onToggleMute}
              className="pointer-events-auto flex items-center justify-center w-9 h-9 bg-slate-900/85 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-slate-200 transition-colors"
              title="Toggle Audio (M)"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
            </button>

            <button
              onClick={onPause}
              className="pointer-events-auto flex items-center justify-center w-9 h-9 bg-slate-900/85 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-slate-200 transition-colors"
              title="Pause Game (ESC)"
            >
              <Pause className="w-4 h-4 text-amber-400" />
            </button>
          </div>

          {/* Nitro Gauge */}
          <div className="w-44 md:w-52 p-2.5 bg-slate-900/85 border border-slate-700/60 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase mb-1">
              <span className="flex items-center gap-1 text-sky-400">
                <Flame className="w-3.5 h-3.5 text-cyan-400" />
                NITRO BOOST
              </span>
              <span className={`font-mono-numbers ${stats.isBoosting ? 'text-cyan-300 font-extrabold' : 'text-slate-400'}`}>
                {stats.nitro}%
              </span>
            </div>
            {/* Energy bar fill */}
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  stats.isBoosting
                    ? 'bg-gradient-to-r from-sky-400 via-cyan-300 to-white shadow-[0_0_12px_rgba(6,182,212,0.8)]'
                    : stats.nitro > 25
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-400'
                    : 'bg-gradient-to-r from-rose-600 to-amber-500'
                }`}
                style={{ width: `${stats.nitro}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-400 mt-1 block text-right font-medium">
              HOLD [SPACE] TO BOOST
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM PERIMETER CLUSTER: Speedometer & Mobile Controls */}
      <div className="flex items-end justify-between w-full mt-auto">
        {/* Mobile Left/Right Steer Pedals */}
        <div className="pointer-events-auto flex items-center gap-3 md:hidden">
          <button
            onPointerDown={() => onSteerTouchStart(-1)}
            onPointerUp={onSteerTouchEnd}
            onPointerLeave={onSteerTouchEnd}
            className="w-16 h-16 rounded-2xl bg-slate-900/90 active:bg-sky-600 border border-slate-700 text-white font-black text-2xl flex items-center justify-center shadow-xl active:scale-95 transition-transform"
          >
            ◀
          </button>
          <button
            onPointerDown={() => onSteerTouchStart(1)}
            onPointerUp={onSteerTouchEnd}
            onPointerLeave={onSteerTouchEnd}
            className="w-16 h-16 rounded-2xl bg-slate-900/90 active:bg-sky-600 border border-slate-700 text-white font-black text-2xl flex items-center justify-center shadow-xl active:scale-95 transition-transform"
          >
            ▶
          </button>
        </div>

        {/* Center: Cyber Digital Speedometer */}
        <div className="flex flex-col items-center mx-auto">
          <div className="flex items-center gap-4 px-6 py-3 bg-slate-900/90 border border-slate-700/80 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
            {/* Gear indicator */}
            <div className="flex flex-col items-center pr-3 border-r border-slate-700/80">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Gear</span>
              <span className="text-xl font-black font-mono-numbers text-sky-400">
                {getGear(stats.speedKmh)}
              </span>
            </div>

            {/* Speed Readout */}
            <div className="flex flex-col items-center">
              <span className="text-4xl md:text-5xl font-black font-mono-numbers tracking-tight text-white leading-none">
                {stats.speedKmh}
              </span>
              <span className="text-[10px] tracking-widest font-extrabold uppercase text-slate-400 mt-1">
                KM / H
              </span>
            </div>

            {/* Distance Odometer */}
            <div className="flex flex-col items-center pl-3 border-l border-slate-700/80">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Distance</span>
              <span className="text-base font-bold font-mono-numbers text-amber-300">
                {stats.distance}m
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Boost Pedal */}
        <div className="pointer-events-auto flex items-center md:hidden">
          <button
            onPointerDown={onBoostTouchStart}
            onPointerUp={onBoostTouchEnd}
            onPointerLeave={onBoostTouchEnd}
            className={`w-20 h-20 rounded-2xl font-black text-xs flex flex-col items-center justify-center shadow-xl active:scale-95 transition-transform border ${
              stats.isBoosting
                ? 'bg-cyan-500 border-white text-slate-950'
                : 'bg-slate-900/90 border-cyan-500/50 text-cyan-400 active:bg-cyan-600 active:text-white'
            }`}
          >
            <Flame className="w-6 h-6 mb-1" />
            <span>BOOST</span>
          </button>
        </div>
      </div>
    </div>
  );
};
