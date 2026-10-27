import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onHome,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-30 select-none">
      <div className="w-full max-w-sm max-h-[92dvh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col items-center text-center">
        <h2 className="text-2xl font-black italic tracking-wide text-white uppercase mb-1">
          GAME PAUSED
        </h2>
        <p className="text-xs text-slate-400 mb-6">Take a breather before dodging more traffic</p>

        {/* Buttons List */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            tabIndex={-1}
            onClick={(e) => {
              (e.currentTarget as HTMLButtonElement).blur();
              onResume();
            }}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all focus:outline-none"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>RESUME (ESC)</span>
          </button>

          <button
            tabIndex={-1}
            onClick={(e) => {
              (e.currentTarget as HTMLButtonElement).blur();
              onRestart();
            }}
            className="w-full py-3 px-6 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all focus:outline-none"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART RUN</span>
          </button>

          <button
            tabIndex={-1}
            onClick={(e) => {
              (e.currentTarget as HTMLButtonElement).blur();
              onToggleMute();
            }}
            className="w-full py-3 px-6 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all focus:outline-none"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
            <span>{isMuted ? 'UNMUTE AUDIO' : 'MUTE AUDIO'}</span>
          </button>

          <button
            tabIndex={-1}
            onClick={(e) => {
              (e.currentTarget as HTMLButtonElement).blur();
              onHome();
            }}
            className="w-full py-2.5 px-6 text-slate-400 hover:text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2 focus:outline-none"
          >
            <Home className="w-3.5 h-3.5" />
            <span>QUIT TO MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
