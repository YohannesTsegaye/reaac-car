import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  createPlayerCar,
  createEnemyVehicle,
  createPickupMesh,
  createRoadChunk,
} from './models';
import { soundEngine } from './audio';
import {
  GameState,
  CameraViewMode,
  EnemyType,
  EnemyCar,
  PickupItem,
  Particle,
  GameStats,
  NearMissEvent,
} from './types';

// Pre-allocated math objects to guarantee 0 GC pauses in the render loop
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _boxPlayer = new THREE.Box3();
const _boxEnemy = new THREE.Box3();

export interface EngineCallbacks {
  onStatsUpdate: (stats: GameStats) => void;
  onNearMiss: (event: NearMissEvent) => void;
  onStateChange: (state: GameState) => void;
  onCrash: (finalStats: GameStats) => void;
  onCameraChange: (mode: CameraViewMode) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;

  // Three.js Core
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean = false;
  private frameId: number = 0;
  private lastTime: number = 0;

  // Game State
  private state: GameState = 'TITLE';
  private cameraMode: CameraViewMode = 'CHASE';

  // Road configuration
  private readonly roadWidth = 20;
  private readonly laneCount = 4;
  private readonly laneWidth = 5; // 20 / 4
  private laneXCoords: number[] = [7.5, 2.5, -2.5, -7.5];

  // Road chunks for infinite scrolling illusion
  private roadChunks: THREE.Group[] = [];
  private readonly chunkLength = 80;
  private readonly numChunks = 4;

  // Player Entity
  private playerCarGroup!: THREE.Group;
  private playerWheels: THREE.Group[] = [];
  private playerNitroFlames: THREE.Mesh[] = [];
  private playerHeadlights!: THREE.Group;
  private playerSetColor!: (hex: string) => void;

  // Player Physics
  private playerX: number = 0;
  private playerTargetX: number = 0;
  private playerZ: number = 0;
  private playerSpeed: number = 100; // km/h (minimum highway speed)
  private readonly minSpeed = 80;
  private readonly maxNormalSpeed = 160;
  private readonly maxBoostSpeed = 230;
  private currentSteerTilt: number = 0;

  // Boost & Scoring Stats
  private nitroEnergy: number = 100;
  private isBoosting: boolean = false;
  private score: number = 0;
  private highScore: number = 0;
  private distance: number = 0;
  private topSpeedKmh: number = 0;
  private combo: number = 0;
  private comboTimer: number = 0;
  private nearMissCount: number = 0;
  private nextNearMissId: number = 1;

  // Oncoming Enemies & Pickups
  private enemies: EnemyCar[] = [];
  private pickups: PickupItem[] = [];
  private nextEnemyId: number = 1;
  private nextPickupId: number = 1;
  private enemySpawnTimer: number = 0;
  private pickupSpawnTimer: number = 0;

  // Particles
  private particles: Particle[] = [];
  private particlePool: THREE.Mesh[] = [];

  // Hitstop & Camera Shake
  private hitstopDuration: number = 0;
  private cameraShakeIntensity: number = 0;

  // Input states
  private keysHeld: { [key: string]: boolean } = {};
  private steerInput: number = 0; // -1 to 1 (touch or analog)
  private boostInput: boolean = false;

  // Title screen camera orbit angle
  private titleOrbitAngle: number = 0;

  // 3D Speed streak lines
  private speedLines!: THREE.LineSegments;
  private statsUpdateTimer: number = 0;

  constructor(container: HTMLElement, callbacks: EngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // Load highscore from localStorage
    try {
      const saved = localStorage.getItem('highway_rush_highscore');
      if (saved) this.highScore = parseInt(saved, 10) || 0;
    } catch {}

    this.detectSoftwareGl();
    this.initThree();
    this.initAtmosphereAndSky();
    this.initRoad();
    this.initPlayer();
    this.initParticlePool();
    this.bindEvents();

    this.lastTime = performance.now();
    this.tick = this.tick.bind(this);
    this.frameId = requestAnimationFrame(this.tick);
  }

  private detectSoftwareGl() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      this.isSoftwareGl = !gl;
    } catch {
      this.isSoftwareGl = false;
    }
  }

  private initThree() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // Renderer setup matching Three.js skill
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // Scene with dark midnight cyberpunk atmosphere and smooth horizon fog
    this.scene = new THREE.Scene();
    const skyColor = new THREE.Color(0x070b19);
    this.scene.background = skyColor;
    this.scene.fog = new THREE.FogExp2(0x0c1328, 0.0075);

    // Camera
    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.5, 300);
    this.camera.position.set(0, 4.5, -9);
    this.camera.lookAt(0, 1.2, 5);

    // Studio Environment reflection map
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // Studio Lighting Rig
    // 1. Cool Hemisphere Fill
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.9);
    this.scene.add(hemiLight);

    // 2. Warm Key Directional Light (Front-angled street lighting)
    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    dirLight.position.set(15, 30, -20);
    dirLight.castShadow = !this.isSoftwareGl;
    if (!this.isSoftwareGl) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 1;
      dirLight.shadow.camera.far = 120;
      dirLight.shadow.camera.left = -25;
      dirLight.shadow.camera.right = 25;
      dirLight.shadow.camera.top = 25;
      dirLight.shadow.camera.bottom = -25;
      dirLight.shadow.bias = -0.0005;
      dirLight.shadow.normalBias = 0.02;
    }
    this.scene.add(dirLight);

    // 3. Subtle ambient light
    const ambLight = new THREE.AmbientLight(0x1e293b, 0.6);
    this.scene.add(ambLight);
  }

  private initAtmosphereAndSky() {
    // 1. Twinkling Starfield in the upper night sky
    const starCount = 300;
    const starGeom = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 260;
      starPositions[i * 3 + 1] = 14 + Math.random() * 85;
      starPositions[i * 3 + 2] = -40 + Math.random() * 280;
    }
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xc8ddff,
      size: 1.4,
      transparent: true,
      opacity: 0.85,
    });
    const stars = new THREE.Points(starGeom, starMat);
    this.scene.add(stars);

    // 2. Distant Horizon Glow Backdrop (cyberpunk neon gradient blending the road into infinity)
    const horizonCanvas = document.createElement('canvas');
    horizonCanvas.width = 256;
    horizonCanvas.height = 256;
    const hctx = horizonCanvas.getContext('2d')!;
    const grad = hctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, 'rgba(8, 12, 26, 0)');
    grad.addColorStop(0.45, 'rgba(49, 46, 129, 0.4)');
    grad.addColorStop(0.8, 'rgba(236, 72, 153, 0.45)');
    grad.addColorStop(1, 'rgba(245, 158, 11, 0.7)');
    hctx.fillStyle = grad;
    hctx.fillRect(0, 0, 256, 256);

    const horizonTex = new THREE.CanvasTexture(horizonCanvas);
    const horizonGeom = new THREE.PlaneGeometry(320, 75);
    const horizonMat = new THREE.MeshBasicMaterial({
      map: horizonTex,
      transparent: true,
      depthWrite: false,
    });
    const horizonMesh = new THREE.Mesh(horizonGeom, horizonMat);
    horizonMesh.position.set(0, 24, 235);
    this.scene.add(horizonMesh);

    // 3. Distant City Skyline Silhouettes with illuminated windows
    const cityGroup = new THREE.Group();
    const bldgMat = new THREE.MeshStandardMaterial({
      color: 0x090e1f,
      roughness: 0.8,
    });
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
    for (let i = 0; i < 28; i++) {
      const bx = -140 + i * 10 + (Math.random() - 0.5) * 4;
      const bw = 6 + Math.random() * 5;
      const bh = 14 + Math.random() * 32;
      const bz = 224 + Math.random() * 14;
      const bldg = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 6), bldgMat);
      bldg.position.set(bx, bh / 2, bz);
      cityGroup.add(bldg);

      // Lit skyscraper window dots
      if (Math.random() < 0.75) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), windowMat);
        win.position.set(bx + (Math.random() - 0.5) * (bw - 2), bh * 0.7 + Math.random() * 4, bz - 3.01);
        cityGroup.add(win);
      }
    }
    this.scene.add(cityGroup);

    // 4. Dynamic 3D Speed Streak Lines
    const numLines = 36;
    const lineGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(numLines * 2 * 3);
    for (let i = 0; i < numLines; i++) {
      const lx = (Math.random() - 0.5) * 22;
      const ly = 0.5 + Math.random() * 5.0;
      const lz = -10 + Math.random() * 80;
      const len = 4.5;
      positions[i * 6] = lx;
      positions[i * 6 + 1] = ly;
      positions[i * 6 + 2] = lz;
      positions[i * 6 + 3] = lx;
      positions[i * 6 + 4] = ly;
      positions[i * 6 + 5] = lz + len;
    }
    lineGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
    });
    this.speedLines = new THREE.LineSegments(lineGeom, lineMat);
    this.scene.add(this.speedLines);
  }

  private initRoad() {
    // Spawn contiguous road chunks extending ahead of and behind player
    for (let i = 0; i < this.numChunks; i++) {
      const chunk = createRoadChunk(this.chunkLength, this.roadWidth, this.laneCount);
      // chunks centered around Z = (i - 1) * chunkLength
      chunk.position.z = (i - 1) * this.chunkLength;
      this.scene.add(chunk);
      this.roadChunks.push(chunk);
    }
  }

  private initPlayer() {
    const player = createPlayerCar('#0284c7');
    this.playerCarGroup = player.carGroup;
    this.playerWheels = player.wheels;
    this.playerNitroFlames = player.nitroFlames;
    this.playerHeadlights = player.headlightLamps;
    this.playerSetColor = player.setBodyColor;

    this.playerCarGroup.position.set(0, 0, 0);
    this.scene.add(this.playerCarGroup);
  }

  private initParticlePool() {
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const geom = new THREE.SphereGeometry(0.08, 4, 4);
    for (let i = 0; i < 60; i++) {
      const m = new THREE.Mesh(geom, sparkMat);
      m.visible = false;
      this.scene.add(m);
      this.particlePool.push(m);
    }
  }

  private spawnParticle(x: number, y: number, z: number, vx: number, vy: number, vz: number, maxLife: number = 0.5) {
    const available = this.particlePool.find((p) => !p.visible);
    if (!available) return;

    available.position.set(x, y, z);
    available.scale.set(1, 1, 1);
    available.visible = true;

    this.particles.push({
      mesh: available,
      velocity: new THREE.Vector3(vx, vy, vz),
      life: 0,
      maxLife,
      scaleSpeed: 0.94,
      colorFade: true,
    });
  }

  public setPlayerColor(hex: string) {
    if (this.playerSetColor) {
      this.playerSetColor(hex);
    }
  }

  public setSteerInput(val: number) {
    this.steerInput = Math.max(-1, Math.min(1, val));
  }

  public setBoostInput(boosting: boolean) {
    this.boostInput = boosting;
  }

  public cycleCamera() {
    if (this.cameraMode === 'CHASE') this.cameraMode = 'HOOD';
    else if (this.cameraMode === 'HOOD') this.cameraMode = 'TOP_ANGLED';
    else this.cameraMode = 'CHASE';

    this.callbacks.onCameraChange(this.cameraMode);
  }

  public startGame() {
    this.state = 'PLAYING';
    this.resetGameplayState();
    soundEngine.init();
    soundEngine.startEngine();
    this.callbacks.onStateChange(this.state);
  }

  public pauseGame() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      soundEngine.stopEngine();
      soundEngine.setNitroActive(false);
      this.callbacks.onStateChange(this.state);
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      soundEngine.startEngine();
      this.callbacks.onStateChange(this.state);
    }
  }

  public restartGame() {
    this.clearEnemiesAndPickups();
    this.resetGameplayState();
    this.state = 'PLAYING';
    soundEngine.startEngine();
    this.callbacks.onStateChange(this.state);
  }

  private resetGameplayState() {
    this.playerX = 0;
    this.playerTargetX = 0;
    this.playerZ = 0;
    this.playerSpeed = 100;
    this.nitroEnergy = 100;
    this.isBoosting = false;
    this.score = 0;
    this.distance = 0;
    this.topSpeedKmh = 100;
    this.combo = 0;
    this.comboTimer = 0;
    this.nearMissCount = 0;
    this.enemySpawnTimer = 0.5;
    this.pickupSpawnTimer = 3.0;
    this.hitstopDuration = 0;
    this.cameraShakeIntensity = 0;

    if (this.playerCarGroup) {
      this.playerCarGroup.position.set(0, 0, 0);
      this.playerCarGroup.rotation.set(0, 0, 0);
    }
  }

  private clearEnemiesAndPickups() {
    this.enemies.forEach((e) => this.scene.remove(e.mesh));
    this.enemies = [];
    this.pickups.forEach((p) => this.scene.remove(p.mesh));
    this.pickups = [];
    this.particles.forEach((p) => (p.mesh.visible = false));
    this.particles = [];
  }

  private bindEvents() {
    window.addEventListener('keydown', (e) => {
      // Prevent browser default on Space (prevents spacebar from activating focused buttons like Camera)
      if (e.code === 'Space') {
        e.preventDefault();
        (document.activeElement as HTMLElement)?.blur();
      }

      this.keysHeld[e.code] = true;

      // Handle edge-triggered actions
      if (e.code === 'KeyC') {
        this.cycleCamera();
      }
      if (e.code === 'KeyM') {
        soundEngine.toggleMute();
      }
      if (e.code === 'Escape' || e.code === 'KeyP') {
        this.pauseGame();
      }
      if ((e.code === 'Space' || e.code === 'Enter') && (this.state === 'TITLE' || this.state === 'GAME_OVER')) {
        this.startGame();
      }
      if (e.code === 'KeyR' && this.state === 'GAME_OVER') {
        this.restartGame();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
      }
      this.keysHeld[e.code] = false;
    });

    window.addEventListener('blur', () => {
      this.keysHeld = {};
      this.steerInput = 0;
      this.boostInput = false;
    });

    window.addEventListener('resize', () => {
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
  }

  /**
   * Spawns an oncoming enemy car from in front of player (high +Z coordinates)
   */
  private spawnEnemy() {
    // Choose lane (0 to 3)
    const laneIndex = Math.floor(Math.random() * this.laneCount);
    const laneX = this.laneXCoords[laneIndex];

    // Pick enemy type with weighted distribution
    const roll = Math.random();
    let type: EnemyType = 'sedan';
    if (roll < 0.35) {
      type = 'sedan';
    } else if (roll < 0.60) {
      type = 'sport';
    } else if (roll < 0.85) {
      type = 'truck';
    } else {
      type = 'erratic';
    }

    // Palette per vehicle
    const colors = [
      '#ef4444', '#f97316', '#eab308', '#22c55e',
      '#a855f7', '#ec4899', '#f8fafc', '#334155'
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const { group, width, length, height, leftBlinker, rightBlinker } = createEnemyVehicle(type, color);

    // Oncoming car speed:
    // Because they come from in front of the player, their world speed moves towards -Z!
    // Relative speed between player and oncoming car = playerSpeed + oncomingSpeed!
    let speed = 70; // km/h
    if (type === 'sport') speed = 110;
    if (type === 'truck') speed = 55;
    if (type === 'erratic') speed = 80;

    // Position well ahead of player (+140 to +180 meters)
    const spawnZ = 160 + Math.random() * 30;
    group.position.set(laneX, 0, spawnZ);
    // Oncoming cars face towards the player (rotation.y = 0 since headlight faces -Z)
    this.scene.add(group);

    // Target lane for erratic cars
    let targetLane = laneIndex;
    if (type === 'erratic') {
      // Pick adjacent lane to swerve into
      if (laneIndex === 0) targetLane = 1;
      else if (laneIndex === this.laneCount - 1) targetLane = this.laneCount - 2;
      else targetLane = Math.random() > 0.5 ? laneIndex + 1 : laneIndex - 1;
    }

    this.enemies.push({
      id: this.nextEnemyId++,
      type,
      mesh: group,
      lane: laneIndex,
      x: laneX,
      z: spawnZ,
      speed,
      width,
      length,
      height,
      color,
      isChangingLane: false,
      targetLane,
      changeLaneProgress: 0,
      changeLaneSpeed: 0.7,
      blinkerTimer: 0,
      leftBlinker,
      rightBlinker,
      nearMissScored: false,
      honkCooldown: 0,
    });
  }

  /**
   * Spawns nitro refill or coin pickup on a random lane
   */
  private spawnPickup() {
    const laneIndex = Math.floor(Math.random() * this.laneCount);
    const laneX = this.laneXCoords[laneIndex];
    const type: 'nitro' | 'coin' = Math.random() < 0.4 ? 'nitro' : 'coin';

    const mesh = createPickupMesh(type);
    const spawnZ = 150 + Math.random() * 40;
    mesh.position.set(laneX, 0.8, spawnZ);
    this.scene.add(mesh);

    this.pickups.push({
      id: this.nextPickupId++,
      type,
      mesh,
      lane: laneIndex,
      x: laneX,
      z: spawnZ,
      collected: false,
    });
  }

  /**
   * Main game loop tick
   */
  private tick(now: number) {
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    // Strict dt clamping as required by skill guidelines
    const dt = Math.min(rawDt, 0.05);

    if (this.state === 'TITLE') {
      this.updateTitleScreen(dt);
    } else if (this.state === 'PLAYING') {
      this.updatePlaying(dt);
    } else if (this.state === 'PAUSED') {
      // Keep static camera, wait for resume
    } else if (this.state === 'GAME_OVER') {
      this.updateGameOver(dt);
    }

    this.renderer.render(this.scene, this.camera);
    this.frameId = requestAnimationFrame(this.tick);
  }

  private updateTitleScreen(dt: number) {
    this.titleOrbitAngle += dt * 0.4;
    const isPortrait = this.camera.aspect < 1.0;
    // Smooth cinematic camera orbit around hero car, framed for desktop and mobile portrait
    const radius = isPortrait ? 11.2 : 8.5;
    this.camera.position.x = Math.sin(this.titleOrbitAngle) * radius;
    this.camera.position.z = Math.cos(this.titleOrbitAngle) * radius;
    this.camera.position.y = (isPortrait ? 4.2 : 3.2) + Math.sin(this.titleOrbitAngle * 0.5) * 0.5;
    this.camera.lookAt(0, isPortrait ? 0.6 : 0.8, 0);

    // Gently rotate wheels
    this.playerWheels.forEach((w) => (w.rotation.x += dt * 2));
  }

  private updateGameOver(dt: number) {
    const isPortrait = this.camera.aspect < 1.0;
    // Camera slowly drifts back while crash smoke rises
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, isPortrait ? 7.5 : 6.0, 1.5, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, isPortrait ? -12.5 : -10.0, 1.2, dt);
    this.camera.lookAt(this.playerCarGroup.position);

    this.updateParticles(dt);
  }

  private updatePlaying(dt: number) {
    // Check hitstop (brief simulation freeze on heavy impact)
    if (this.hitstopDuration > 0) {
      this.hitstopDuration -= dt;
      return;
    }

    // 1. Process Inputs (Keyboard + Touch)
    let steerDir = 0;
    if (this.keysHeld['KeyA'] || this.keysHeld['ArrowLeft']) steerDir -= 1;
    if (this.keysHeld['KeyD'] || this.keysHeld['ArrowRight']) steerDir += 1;
    if (this.steerInput !== 0) steerDir = this.steerInput;

    const wantBoost = this.keysHeld['Space'] || this.boostInput;
    let throttle = 0;
    if (this.keysHeld['KeyW'] || this.keysHeld['ArrowUp']) throttle += 1;
    if (this.keysHeld['KeyS'] || this.keysHeld['ArrowDown']) throttle -= 1;

    // 2. Nitro Boost logic
    if (wantBoost && this.nitroEnergy > 0) {
      this.isBoosting = true;
      this.nitroEnergy = Math.max(0, this.nitroEnergy - dt * 25);
      soundEngine.setNitroActive(true);
      // Spawn nitro flame particles behind player car
      if (Math.random() < 0.7) {
        this.spawnParticle(
          this.playerX + (Math.random() * 0.4 - 0.2),
          0.3,
          -2.2,
          (Math.random() - 0.5) * 0.8,
          Math.random() * 0.4,
          -2.5 - Math.random() * 2,
          0.25
        );
      }
    } else {
      this.isBoosting = false;
      soundEngine.setNitroActive(false);
      // Slowly regenerate nitro when not boosting
      this.nitroEnergy = Math.min(100, this.nitroEnergy + dt * 4);
    }

    // Toggle nitro flame meshes with dynamic fiery pulse
    this.playerNitroFlames.forEach((flame) => {
      flame.visible = this.isBoosting;
      if (this.isBoosting) {
        const flicker = 0.9 + Math.random() * 0.5;
        flame.scale.set(0.9 + Math.random() * 0.3, flicker, 0.9 + Math.random() * 0.3);
      }
    });

    // 3. Player Speed physics
    const targetSpeed = this.isBoosting
      ? this.maxBoostSpeed
      : throttle > 0
      ? this.maxNormalSpeed
      : throttle < 0
      ? this.minSpeed * 0.7
      : this.maxNormalSpeed * 0.85;

    this.playerSpeed = THREE.MathUtils.damp(this.playerSpeed, targetSpeed, 2.5, dt);
    if (this.playerSpeed > this.topSpeedKmh) {
      this.topSpeedKmh = this.playerSpeed;
    }

    // Distance & Score progression
    const metersPerSec = (this.playerSpeed * 1000) / 3600;
    const distanceStep = metersPerSec * dt;
    this.distance += distanceStep;
    this.score += Math.floor(distanceStep * (1 + (this.combo > 0 ? this.combo * 0.5 : 0)));

    // Update sound engine pitch
    const speedRatio = (this.playerSpeed - this.minSpeed) / (this.maxBoostSpeed - this.minSpeed);
    soundEngine.updateEnginePitch(Math.max(0, Math.min(1, speedRatio)), this.isBoosting);

    // 4. Player Steering Physics: Touching Left moves car Left, Touching Right moves car Right
    const steerSpeed = 16.0 * (1 + (this.isBoosting ? 0.2 : 0));
    this.playerX -= steerDir * steerSpeed * dt;
    // Clamp within highway guardrails
    const maxRoadX = this.roadWidth / 2 - 1.4;
    this.playerX = Math.max(-maxRoadX, Math.min(maxRoadX, this.playerX));

    this.playerCarGroup.position.x = this.playerX;

    // Body roll/tilt and turn yaw when steering
    const targetTilt = -steerDir * 0.08;
    this.currentSteerTilt = THREE.MathUtils.damp(this.currentSteerTilt, targetTilt, 8.0, dt);
    this.playerCarGroup.rotation.z = this.currentSteerTilt;
    this.playerCarGroup.rotation.y = -steerDir * 0.06;

    // Spin player wheels
    const wheelSpin = (metersPerSec / 0.35) * dt;
    this.playerWheels.forEach((w) => {
      w.rotation.x += wheelSpin;
    });

    // 5. Scroll Road Chunks for Infinite Highway illusion
    // Road chunks move towards -Z (since player is driving forward towards +Z)
    this.roadChunks.forEach((chunk) => {
      chunk.position.z -= distanceStep;
      // When chunk is behind the camera (z < -chunkLength), recycle to the far front
      if (chunk.position.z < -this.chunkLength * 1.5) {
        chunk.position.z += this.chunkLength * this.numChunks;
      }
    });

    // 5b. Stream 3D Speed Lines past camera
    if (this.speedLines) {
      const lineSpeed = (metersPerSec * (this.isBoosting ? 2.6 : 1.4)) * dt;
      const lineLen = this.isBoosting ? 10.0 : 5.0;
      const posAttr = this.speedLines.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < 36; i++) {
        arr[i * 6 + 2] -= lineSpeed;
        arr[i * 6 + 5] = arr[i * 6 + 2] + lineLen;
        if (arr[i * 6 + 2] < -15) {
          arr[i * 6 + 2] += 95;
          arr[i * 6 + 5] = arr[i * 6 + 2] + lineLen;
        }
      }
      posAttr.needsUpdate = true;
      (this.speedLines.material as THREE.LineBasicMaterial).opacity = this.isBoosting ? 0.75 : 0.25;
    }

    // Continuous rumble camera shake during Nitro boost for intense speed feel
    if (this.isBoosting) {
      this.cameraShakeIntensity = Math.max(this.cameraShakeIntensity, 0.22);
    }

    // 6. Spawn Oncoming Enemies
    // Spawns become slightly faster as distance increases (difficulty ramp)
    this.enemySpawnTimer -= dt;
    if (this.enemySpawnTimer <= 0) {
      this.spawnEnemy();
      const baseInterval = Math.max(0.65, 1.8 - (this.distance / 2500) * 0.6);
      this.enemySpawnTimer = baseInterval + Math.random() * 0.7;
    }

    // Spawn Pickups
    this.pickupSpawnTimer -= dt;
    if (this.pickupSpawnTimer <= 0) {
      this.spawnPickup();
      this.pickupSpawnTimer = 6.0 + Math.random() * 4.0;
    }

    // 7. Update Oncoming Enemies
    // Enemy speed relative to player:
    // They are travelling toward negative Z at enemySpeed + playerSpeed (closing velocity!)
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      const enemyMetersPerSec = (enemy.speed * 1000) / 3600;
      // Closing distance step
      const closingZStep = (metersPerSec + enemyMetersPerSec) * dt;
      enemy.z -= closingZStep;
      enemy.mesh.position.z = enemy.z;

      // Spin enemy wheels
      enemy.mesh.children.forEach((child) => {
        if (child instanceof THREE.Group && child.children.length >= 2) {
          child.rotation.x += (enemyMetersPerSec / 0.35) * dt;
        }
      });

      // Erratic enemy lane changing behavior
      if (enemy.type === 'erratic') {
        enemy.blinkerTimer += dt;
        // Flash blinker light every 0.25s
        const isBlinkerOn = Math.floor(enemy.blinkerTimer * 4) % 2 === 0;
        const targetBlinker = enemy.targetLane < enemy.lane ? enemy.leftBlinker : enemy.rightBlinker;
        if (targetBlinker) {
          (targetBlinker.material as THREE.MeshBasicMaterial).color.setHex(
            isBlinkerOn ? 0xffaa00 : 0x442200
          );
        }

        // Start lane change when within 80m of player
        if (enemy.z < 90 && !enemy.isChangingLane) {
          enemy.isChangingLane = true;
        }

        if (enemy.isChangingLane && enemy.changeLaneProgress < 1.0) {
          enemy.changeLaneProgress += dt * enemy.changeLaneSpeed;
          const targetX = this.laneXCoords[enemy.targetLane];
          const startX = this.laneXCoords[enemy.lane];
          enemy.x = THREE.MathUtils.lerp(startX, targetX, Math.min(1, enemy.changeLaneProgress));
          enemy.mesh.position.x = enemy.x;
        }
      }

      // Truck horn telegraph: if player is in truck's lane and within 70m, truck honks!
      if (enemy.type === 'truck' && Math.abs(enemy.x - this.playerX) < 2.0 && enemy.z < 70 && enemy.z > 20) {
        enemy.honkCooldown -= dt;
        if (enemy.honkCooldown <= 0) {
          soundEngine.playHorn();
          enemy.honkCooldown = 2.5;
        }
      }

      // Check Near-Miss:
      // Player threads the needle close to an oncoming car without colliding!
      // Near miss threshold: lateral distance < 2.5m, Z passes player (enemy.z < 2 and enemy.z > -4)
      if (!enemy.nearMissScored && enemy.z <= 2.5 && enemy.z >= -3.5) {
        const dx = Math.abs(enemy.x - this.playerX);
        const nearMissThreshold = (this.playerCarGroup.scale.x * 1.9 + enemy.width) / 2 + 1.2;
        if (dx < nearMissThreshold) {
          enemy.nearMissScored = true;
          this.triggerNearMiss(enemy);
        }
      }

      // Check Collision
      if (this.checkCarCollision(enemy)) {
        this.triggerCrash(enemy);
        return;
      }

      // Remove car once it has passed far behind player
      if (enemy.z < -40) {
        this.scene.remove(enemy.mesh);
        this.enemies.splice(i, 1);
      }
    }

    // 8. Update Pickups
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pickup = this.pickups[i];
      // Move toward player with highway scroll
      pickup.z -= distanceStep;
      pickup.mesh.position.z = pickup.z;
      // Rotate pickup
      pickup.mesh.rotation.y += dt * 3;

      // Check collection
      if (!pickup.collected && Math.abs(pickup.z) < 2.2 && Math.abs(pickup.x - this.playerX) < 1.6) {
        pickup.collected = true;
        soundEngine.playPickup();
        if (pickup.type === 'nitro') {
          this.nitroEnergy = Math.min(100, this.nitroEnergy + 45);
        } else {
          this.score += 500;
        }
        // Burst collection particles
        for (let p = 0; p < 8; p++) {
          this.spawnParticle(
            pickup.x,
            0.8,
            pickup.z,
            (Math.random() - 0.5) * 3,
            Math.random() * 2 + 1,
            (Math.random() - 0.5) * 3,
            0.4
          );
        }
        this.scene.remove(pickup.mesh);
        this.pickups.splice(i, 1);
        continue;
      }

      // Remove if behind player
      if (pickup.z < -30) {
        this.scene.remove(pickup.mesh);
        this.pickups.splice(i, 1);
      }
    }

    // 9. Update Combo Timer
    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
      }
    }

    // 10. Update Particles
    this.updateParticles(dt);

    // 11. Update Camera with Shake
    this.updateCamera(dt);

    // 12. Send Stats Update to UI (throttled to 20Hz / 50ms to prevent React re-render warnings)
    this.statsUpdateTimer += dt;
    if (this.statsUpdateTimer >= 0.05) {
      this.statsUpdateTimer = 0;
      this.callbacks.onStatsUpdate({
        score: this.score,
        highScore: Math.max(this.highScore, this.score),
        distance: Math.floor(this.distance),
        speedKmh: Math.floor(this.playerSpeed),
        topSpeedKmh: Math.floor(this.topSpeedKmh),
        nitro: Math.floor(this.nitroEnergy),
        isBoosting: this.isBoosting,
        combo: this.combo,
        comboTimer: this.comboTimer,
        nearMissCount: this.nearMissCount,
        multiplier: 1 + this.combo * 0.5,
      });
    }
  }

  private triggerNearMiss(enemy: EnemyCar) {
    this.nearMissCount++;
    this.combo++;
    this.comboTimer = 3.5; // combo window
    const basePts = 250;
    const pts = basePts * this.combo;
    this.score += pts;
    // Extra boost reward for threading the needle
    this.nitroEnergy = Math.min(100, this.nitroEnergy + 15);

    soundEngine.playNearMiss(this.combo);

    // Dispatch event to UI overlay
    this.callbacks.onNearMiss({
      id: this.nextNearMissId++,
      text: this.combo > 1 ? `NEAR MISS x${this.combo}!` : 'NEAR MISS!',
      points: pts,
      combo: this.combo,
      timestamp: Date.now(),
    });

    // Slight thrill camera nudge
    this.cameraShakeIntensity = Math.min(0.25, 0.08 * this.combo);
  }

  private checkCarCollision(enemy: EnemyCar): boolean {
    // Player bounding box (centered at 0, 0, 0 with x=playerX)
    _boxPlayer.min.set(this.playerX - 0.9, 0.1, -1.9);
    _boxPlayer.max.set(this.playerX + 0.9, 1.4, 1.9);

    // Enemy bounding box
    const hw = enemy.width / 2;
    const hl = enemy.length / 2;
    _boxEnemy.min.set(enemy.x - hw, 0.1, enemy.z - hl);
    _boxEnemy.max.set(enemy.x + hw, enemy.height, enemy.z + hl);

    return _boxPlayer.intersectsBox(_boxEnemy);
  }

  private triggerCrash(enemy: EnemyCar) {
    this.state = 'GAME_OVER';
    soundEngine.stopEngine();
    soundEngine.setNitroActive(false);
    soundEngine.playCrash();

    // Hitstop freeze (50ms) to give massive weight to the crash
    this.hitstopDuration = 0.06;
    this.cameraShakeIntensity = 0.8;

    // Spawn massive cloud of collision sparks & debris
    for (let i = 0; i < 35; i++) {
      this.spawnParticle(
        (this.playerX + enemy.x) / 2 + (Math.random() - 0.5) * 1.5,
        0.8 + Math.random(),
        (this.playerZ + enemy.z) / 2 + (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 9,
        Math.random() * 6 + 2,
        (Math.random() - 0.5) * 9,
        0.8
      );
    }

    // Tumble player car slightly
    this.playerCarGroup.rotation.z = (Math.random() - 0.5) * 0.4;
    this.playerCarGroup.rotation.y = (Math.random() - 0.5) * 0.6;
    this.playerCarGroup.position.y = 0.3;

    // Save high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem('highway_rush_highscore', this.highScore.toString());
      } catch {}
    }

    const finalStats: GameStats = {
      score: this.score,
      highScore: this.highScore,
      distance: Math.floor(this.distance),
      speedKmh: Math.floor(this.playerSpeed),
      topSpeedKmh: Math.floor(this.topSpeedKmh),
      nitro: Math.floor(this.nitroEnergy),
      isBoosting: false,
      combo: this.combo,
      comboTimer: 0,
      nearMissCount: this.nearMissCount,
      multiplier: 1,
    };

    this.callbacks.onCrash(finalStats);
    this.callbacks.onStateChange(this.state);
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.mesh.visible = false;
        this.particles.splice(i, 1);
        continue;
      }
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.velocity.y -= 9.8 * dt; // gravity
      p.mesh.scale.multiplyScalar(p.scaleSpeed);
    }
  }

  private updateCamera(dt: number) {
    // Decaying camera shake
    let shakeX = 0;
    let shakeY = 0;
    if (this.cameraShakeIntensity > 0) {
      shakeX = (Math.random() - 0.5) * this.cameraShakeIntensity;
      shakeY = (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - dt * 2.5);
    }

    // Check if device/viewport is in portrait orientation
    const isPortrait = this.camera.aspect < 1.0;

    // Dynamic FOV when boosting (warp speed feeling)
    const baseFov = isPortrait ? 68 : 65;
    const targetFov = this.isBoosting ? (isPortrait ? 78 : 74) : baseFov;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 4.0, dt);
    this.camera.updateProjectionMatrix();

    if (this.cameraMode === 'CHASE') {
      // Third-person smooth chase behind player car
      // Elevate camera slightly and tilt downward so player's entire supercar is cleanly framed
      // higher up on screen, with full visibility of rear spoiler and nitro exhaust flames
      const targetCamX = this.playerX * 0.75 + shakeX;
      const targetCamY = (isPortrait ? 6.2 : 4.8) + shakeY;
      const targetCamZ = isPortrait ? -11.5 : -8.5;

      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 9.0, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamY, 9.0, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ, 9.0, dt);

      // Pitching lookAt: when lookAt Y is 0.05 at Z=26, the car at (playerX, 0, 0)
      // sits comfortably in the lower third (~25% above the bottom edge) with zero clipping!
      _vec3A.set(this.playerX * 0.3, isPortrait ? 0.05 : 0.4, isPortrait ? 26 : 24);
      this.camera.lookAt(_vec3A);
    } else if (this.cameraMode === 'HOOD') {
      // First-person bumper/hood perspective: highest adrenaline!
      this.camera.position.set(this.playerX + shakeX, 1.05 + shakeY, 0.4);
      _vec3A.set(this.playerX, 1.0, 40);
      this.camera.lookAt(_vec3A);
    } else if (this.cameraMode === 'TOP_ANGLED') {
      // Classic arcade top-down angled camera
      const targetCamX = this.playerX * 0.5 + shakeX;
      const targetCamY = (isPortrait ? 13.5 : 10.0) + shakeY;
      const targetCamZ = isPortrait ? -13.0 : -9.5;
      this.camera.position.set(targetCamX, targetCamY, targetCamZ);
      _vec3A.set(this.playerX * 0.5, 0.2, isPortrait ? 16 : 13);
      this.camera.lookAt(_vec3A);
    }
  }

  public dispose() {
    cancelAnimationFrame(this.frameId);
    soundEngine.stopEngine();
    soundEngine.setNitroActive(false);

    // Dispose Three.js objects
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
