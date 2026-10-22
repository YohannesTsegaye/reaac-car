import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/engine';
import { GameState, CameraViewMode, GameStats, NearMissEvent } from './game/types';
import { soundEngine } from './game/audio';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('CHASE');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playerColor, setPlayerColor] = useState<string>('#0284c7');
  const [nearMissEvent, setNearMissEvent] = useState<NearMissEvent | null>(null);

  const [stats, setStats] = useState<GameStats>({
    score: 0,
    highScore: 0,
    distance: 0,
    speedKmh: 100,
    topSpeedKmh: 100,
    nitro: 100,
    isBoosting: false,
    combo: 0,
    comboTimer: 0,
    nearMissCount: 0,
    multiplier: 1,
  });

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize Game Engine once
    const engine = new GameEngine(mountRef.current, {
      onStatsUpdate: (newStats) => {
        setStats(newStats);
      },
      onNearMiss: (event) => {
        setNearMissEvent(event);
      },
      onStateChange: (newState) => {
        setGameState(newState);
      },
      onCrash: (finalStats) => {
        setStats(finalStats);
      },
      onCameraChange: (newCam) => {
        setCameraMode(newCam);
      },
    });

    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleStart = () => {
    engineRef.current?.startGame();
  };

  const handleRestart = () => {
    engineRef.current?.restartGame();
  };

  const handlePause = () => {
    engineRef.current?.pauseGame();
  };

  const handleHome = () => {
    // Return to title screen
    setGameState('TITLE');
    engineRef.current?.restartGame();
    // Re-set state back to TITLE so engine orbits car
    // (Restart brings it to playing, so we switch state in engine by calling dispose or pause)
    window.location.reload();
  };

  const handleCycleCamera = () => {
    engineRef.current?.cycleCamera();
  };

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleSelectColor = (colorHex: string) => {
    setPlayerColor(colorHex);
    engineRef.current?.setPlayerColor(colorHex);
  };

  const handleSteerTouchStart = (dir: number) => {
    engineRef.current?.setSteerInput(dir);
  };

  const handleSteerTouchEnd = () => {
    engineRef.current?.setSteerInput(0);
  };

  const handleBoostTouchStart = () => {
    engineRef.current?.setBoostInput(true);
  };

  const handleBoostTouchEnd = () => {
    engineRef.current?.setBoostInput(false);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Isolated Three.js WebGL Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Title Screen View */}
      {gameState === 'TITLE' && (
        <TitleScreen
          onStart={handleStart}
          highScore={stats.highScore}
          currentColor={playerColor}
          onSelectColor={handleSelectColor}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Active Gameplay HUD */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <GameHUD
          stats={stats}
          nearMissEvent={nearMissEvent}
          cameraMode={cameraMode}
          isMuted={isMuted}
          onCycleCamera={handleCycleCamera}
          onToggleMute={handleToggleMute}
          onPause={handlePause}
          onSteerTouchStart={handleSteerTouchStart}
          onSteerTouchEnd={handleSteerTouchEnd}
          onBoostTouchStart={handleBoostTouchStart}
          onBoostTouchEnd={handleBoostTouchEnd}
        />
      )}

      {/* Paused Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={handlePause}
          onRestart={handleRestart}
          onHome={handleHome}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'GAME_OVER' && (
        <GameOverModal
          stats={stats}
          onRestart={handleRestart}
          onHome={handleHome}
        />
      )}
    </div>
  );
}
