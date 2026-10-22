import * as THREE from 'three';

export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type CameraViewMode = 'CHASE' | 'HOOD' | 'TOP_ANGLED';

export type EnemyType = 'sedan' | 'sport' | 'truck' | 'erratic';

export interface EnemyCar {
  id: number;
  type: EnemyType;
  mesh: THREE.Group;
  lane: number;
  x: number;
  z: number;
  speed: number; // oncoming velocity towards player
  width: number;
  length: number;
  height: number;
  color: string;
  // Lane changing logic for erratic cars
  isChangingLane: boolean;
  targetLane: number;
  changeLaneProgress: number;
  changeLaneSpeed: number;
  blinkerTimer: number;
  leftBlinker?: THREE.Mesh;
  rightBlinker?: THREE.Mesh;
  nearMissScored: boolean;
  honkCooldown: number;
}

export interface PickupItem {
  id: number;
  type: 'nitro' | 'coin';
  mesh: THREE.Group;
  lane: number;
  x: number;
  z: number;
  collected: boolean;
}

export interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  scaleSpeed: number;
  colorFade: boolean;
}

export interface GameStats {
  score: number;
  highScore: number;
  distance: number; // meters
  speedKmh: number;
  topSpeedKmh: number;
  nitro: number; // 0 to 100
  isBoosting: boolean;
  combo: number;
  comboTimer: number;
  nearMissCount: number;
  multiplier: number;
}

export interface NearMissEvent {
  id: number;
  text: string;
  points: number;
  combo: number;
  timestamp: number;
}

export interface CarCustomization {
  color: string;
  name: string;
  accent: string;
}
