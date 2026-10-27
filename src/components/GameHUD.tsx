import React, { useRef, useState, useEffect } from 'react';
import { Camera, Volume2, VolumeX, Pause, Flame, Zap, Sparkles } from 'lucide-react';
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
  // Temporary hint shown for 3.5s then smoothly faded out
  const [showHint, setShowHint] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  const activeTouchesRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const steerTouchIdRef = useRef<number | null>(null);
  const isTouchBoostingRef = useRef<boolean>(false);

  // Helper to unfocus buttons so Spacebar won't trigger them
  const handleButtonClick = (action: () => void) => (e: React.MouseEvent<HTMLButtonElement>) => {
    (e.currentTarget as HTMLButtonElement).blur();
    action();
  };

  // Gear estimation based on speed
  const getGear = (speed: number) => {
    if (speed < 90) return 'D2';
    if (speed < 120) return 'D3';
    if (speed < 155) return 'D4';
    if (speed < 190) return 'D5';
    return 'D6';
  };

  // Centered Steering calculation:
  // Swiping or dragging left/right relative to center of screen smoothly steers
  const updateCenteredSteering = (clientX: number) => {
    const screenWidth = window.innerWidth;
    const centerX = screenWidth / 2;
    const offset = clientX - centerX;
    const deadzone = 14; // 14px deadzone at the center for effortless straight driving
    const maxRange = Math.max(75, screenWidth * 0.36);

    let steerRatio = 0;
    if (offset > deadzone) {
      steerRatio = Math.min(1, (offset - deadzone) / maxRange);
    } else if (offset < -deadzone) {
      steerRatio = Math.max(-1, (offset + deadzone) / maxRange);
    }

    onSteerTouchStart(steerRatio);
  };

  // Touch anywhere on screen (outside steering buttons) triggers instant Nitro hold & swipe steering
  const handleBackdropTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      activeTouchesRef.current.set(touch.identifier, { x: touch.clientX, y: touch.clientY });

      if (steerTouchIdRef.current === null) {
        steerTouchIdRef.current = touch.identifier;
        updateCenteredSteering(touch.clientX);
      }
    }

    // Touching and holding screen fires Nitro instantly!
    if (!isTouchBoostingRef.current) {
      isTouchBoostingRef.current = true;
      onBoostTouchStart();
    }
  };

  const handleBackdropTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      activeTouchesRef.current.set(touch.identifier, { x: touch.clientX, y: touch.clientY });

      if (touch.identifier === steerTouchIdRef.current) {
        updateCenteredSteering(touch.clientX);
      }
    }
  };

  const handleBackdropTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      activeTouchesRef.current.delete(touch.identifier);

      if (touch.identifier === steerTouchIdRef.current) {
        steerTouchIdRef.current = null;
        onSteerTouchEnd();
      }
    }

    // Release boost when touches are gone
    if (activeTouchesRef.current.size === 0 && isTouchBoostingRef.current) {
      isTouchBoostingRef.current = false;
      onBoostTouchEnd();
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-2.5 sm:p-4 overflow-hidden opacity-90 hover:opacity-100 transition-opacity duration-300">
      {/* Speed lines & vignette overlay when boosting */}
      {stats.isBoosting && <div className="absolute inset-0 nitro-vignette" />}

      {/* FULL-SCREEN TOUCH BACKDROP: Hold anywhere on screen for instant Nitro + swipe steering */}
      <div
        className="pointer-events-auto absolute inset-0 z-0 touch-none md:hidden"
        onTouchStart={handleBackdropTouchStart}
        onTouchMove={handleBackdropTouchMove}
        onTouchEnd={handleBackdropTouchEnd}
        onTouchCancel={handleBackdropTouchEnd}
      />

      {/* TOP PERIMETER CLUSTER: Score on left, Speedometer in center, Nitro & buttons on right */}
      <div className="relative z-10 flex items-start justify-between w-full">
        {/* Top-Left: Combined Score & Near-Misses in one sleek block */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-950/70 border border-slate-700/60 rounded-xl shadow-md text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] uppercase text-slate-400 font-bold">Score</span>
              <span className="text-sm font-bold font-mono-numbers text-white tracking-tight">
                {stats.score.toLocaleString()}
              </span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase text-slate-400 font-bold">Near-Miss</span>
              <span className="text-sm font-bold font-mono-numbers text-sky-400">
                {stats.nearMissCount}
              </span>
            </div>
          </div>

          {/* Active Combo Multiplier Pill */}
          {stats.combo > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-gradient-to-r from-amber-500/90 to-rose-600/90 rounded-lg border border-amber-300/40 text-white shadow-md w-fit">
              <Zap className="w-3 h-3 text-yellow-200 fill-yellow-200" />
              <span className="text-[10px] font-black tracking-wider uppercase">
                COMBO x{stats.combo} ({stats.multiplier.toFixed(1)}x)
              </span>
            </div>
          )}
        </div>

        {/* Top-Center: Speed, Gear, Distance readout (NEVER covers the player car below!) */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 bg-slate-950/75 border border-slate-700/60 rounded-xl shadow-lg">
            {/* Gear indicator */}
            <div className="flex flex-col items-center pr-2 border-r border-slate-700/50">
              <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Gear</span>
              <span className="text-xs sm:text-sm font-black font-mono-numbers text-sky-400">
                {getGear(stats.speedKmh)}
              </span>
            </div>

            {/* Speed Readout */}
            <div className="flex flex-col items-center px-1">
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black font-mono-numbers tracking-tight text-white leading-none">
                  {stats.speedKmh}
                </span>
                <span className="text-[8px] tracking-wider font-extrabold uppercase text-slate-400">
                  KM/H
                </span>
              </div>
            </div>

            {/* Distance Odometer */}
            <div className="flex flex-col items-center pl-2 border-l border-slate-700/50">
              <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Dist</span>
              <span className="text-xs sm:text-sm font-bold font-mono-numbers text-amber-300">
                {stats.distance}m
              </span>
            </div>
          </div>

          {/* Floating Near Miss Alert Popup right under the speedometer */}
          {nearMissEvent && Date.now() - nearMissEvent.timestamp < 1500 && (
            <div className="animate-bounce flex flex-col items-center px-3 py-0.5 bg-gradient-to-r from-rose-600 via-amber-500 to-sky-500 text-white rounded-lg border border-white/60 shadow-lg">
              <div className="text-[11px] sm:text-xs font-black italic tracking-wider flex items-center gap-1">
                <Flame className="w-3 h-3 text-yellow-200 fill-yellow-200" />
                <span>{nearMissEvent.text}</span>
                <span className="text-yellow-100 font-mono-numbers ml-1">+{nearMissEvent.points} PTS</span>
              </div>
            </div>
          )}
        </div>

        {/* Top-Right: Thin Nitro Bar & compact control buttons */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5">
            <button
              tabIndex={-1}
              onClick={handleButtonClick(onCycleCamera)}
              className="pointer-events-auto flex items-center gap-1 px-2 py-1 bg-slate-950/70 hover:bg-slate-800 border border-slate-700/50 rounded-lg text-[11px] font-bold text-slate-200 transition-colors focus:outline-none"
              title="Camera Mode (C)"
            >
              <Camera className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">{cameraMode}</span>
            </button>

            <button
              tabIndex={-1}
              onClick={handleButtonClick(onToggleMute)}
              className="pointer-events-auto flex items-center justify-center w-7 h-7 bg-slate-950/70 hover:bg-slate-800 border border-slate-700/50 rounded-lg text-slate-200 transition-colors focus:outline-none"
              title="Mute Audio (M)"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-sky-400" />}
            </button>

            <button
              tabIndex={-1}
              onClick={handleButtonClick(onPause)}
              className="pointer-events-auto flex items-center justify-center w-7 h-7 bg-slate-950/70 hover:bg-slate-800 border border-slate-700/50 rounded-lg text-slate-200 transition-colors focus:outline-none"
              title="Pause Game (ESC)"
            >
              <Pause className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>

          {/* Thin, Minimal Nitro Bar */}
          <div className="w-28 sm:w-36 px-2 py-1 bg-slate-950/70 border border-slate-700/50 rounded-lg shadow-sm">
            <div className="flex items-center justify-between text-[10px] font-bold mb-0.5">
              <span className="flex items-center gap-0.5 text-cyan-400 text-[9px]">
                <Flame className="w-3 h-3 text-cyan-400" />
                NITRO
              </span>
              <span className={`font-mono-numbers text-[9px] ${stats.isBoosting ? 'text-cyan-300 font-extrabold' : 'text-slate-400'}`}>
                {stats.nitro}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  stats.isBoosting
                    ? 'bg-gradient-to-r from-sky-400 via-cyan-300 to-white shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                    : stats.nitro > 25
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-400'
                    : 'bg-gradient-to-r from-rose-600 to-amber-500'
                }`}
                style={{ width: `${stats.nitro}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Temporary Mobile Hint - Fades out after 3.5 seconds */}
      {showHint && (
        <div className="relative z-10 md:hidden flex justify-center w-full my-auto animate-in fade-in duration-300">
          <div className="px-3.5 py-1.5 bg-slate-950/80 border border-slate-700/60 rounded-full text-xs text-slate-200 shadow-lg">
            Tap arrows to steer · Hold screen for Nitro
          </div>
        </div>
      )}

      {/* BOTTOM DUAL-THUMB STEERING ARROWS:
          Left arrow at bottom-left corner, Right arrow at bottom-right corner.
          The entire middle is completely unobstructed for the player car! */}
      <div className="relative z-20 flex items-end justify-between w-full mt-auto md:hidden pointer-events-none">
        {/* Left Arrow Button (Bottom-Left) */}
        <div className="pointer-events-auto">
          <button
            tabIndex={-1}
            onPointerDown={(e) => {
              e.stopPropagation();
              (e.currentTarget as HTMLButtonElement).blur();
              onSteerTouchStart(-1);
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              (e.currentTarget as HTMLButtonElement).blur();
              onSteerTouchEnd();
            }}
            onPointerCancel={(e) => {
              e.stopPropagation();
              onSteerTouchEnd();
            }}
            onPointerLeave={(e) => {
              e.stopPropagation();
              onSteerTouchEnd();
            }}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-950/85 active:bg-sky-600 border border-slate-700/90 text-white font-black text-2xl flex items-center justify-center shadow-2xl active:scale-95 transition-all focus:outline-none"
            title="Steer Left"
          >
            ◀
          </button>
        </div>

        {/* Middle is 100% clear - NO elements covering the player car */}
        <div className="flex-1" />

        {/* Right Arrow Button (Bottom-Right) */}
        <div className="pointer-events-auto">
          <button
            tabIndex={-1}
            onPointerDown={(e) => {
              e.stopPropagation();
              (e.currentTarget as HTMLButtonElement).blur();
              onSteerTouchStart(1);
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              (e.currentTarget as HTMLButtonElement).blur();
              onSteerTouchEnd();
            }}
            onPointerCancel={(e) => {
              e.stopPropagation();
              onSteerTouchEnd();
            }}
            onPointerLeave={(e) => {
              e.stopPropagation();
              onSteerTouchEnd();
            }}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-950/85 active:bg-sky-600 border border-slate-700/90 text-white font-black text-2xl flex items-center justify-center shadow-2xl active:scale-95 transition-all focus:outline-none"
            title="Steer Right"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
};
