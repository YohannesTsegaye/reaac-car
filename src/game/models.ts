import * as THREE from 'three';
import { EnemyType } from './types';

// Procedural texture generators
export function createAsphaltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base dark asphalt
  ctx.fillStyle = '#181b22';
  ctx.fillRect(0, 0, 512, 512);

  // Micro grain noise
  for (let i = 0; i < 24000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const brightness = Math.floor(Math.random() * 30);
    ctx.fillStyle = `rgb(${24 + brightness}, ${27 + brightness}, ${34 + brightness})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  // Road lines
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Common shared materials for performance and visual consistency
const tireRubberMaterial = new THREE.MeshStandardMaterial({
  color: 0x1a1a1a,
  roughness: 0.85,
  metalness: 0.1,
});

const rimChromeMaterial = new THREE.MeshStandardMaterial({
  color: 0xd8d8d8,
  roughness: 0.2,
  metalness: 0.9,
});

const glassTintedMaterial = new THREE.MeshStandardMaterial({
  color: 0x0f172a,
  roughness: 0.1,
  metalness: 0.8,
  transparent: true,
  opacity: 0.85,
});

const headlightGlowMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
});

const taillightGlowMaterial = new THREE.MeshBasicMaterial({
  color: 0xff1e27,
});

const amberBlinkerOffMaterial = new THREE.MeshStandardMaterial({
  color: 0x664400,
  roughness: 0.6,
});

const amberBlinkerOnMaterial = new THREE.MeshBasicMaterial({
  color: 0xffaa00,
});

/**
 * Creates a detailed wheel assembly (Tire + Rim + Center Cap)
 */
function createWheel(radius: number = 0.35, width: number = 0.24): THREE.Group {
  const wheelGroup = new THREE.Group();

  // Rubber tire
  const tireGeom = new THREE.CylinderGeometry(radius, radius, width, 16);
  tireGeom.rotateZ(Math.PI / 2);
  const tireMesh = new THREE.Mesh(tireGeom, tireRubberMaterial);
  tireMesh.castShadow = true;
  wheelGroup.add(tireMesh);

  // Chrome rim inner
  const rimGeom = new THREE.CylinderGeometry(radius * 0.65, radius * 0.65, width + 0.02, 12);
  rimGeom.rotateZ(Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeom, rimChromeMaterial);
  wheelGroup.add(rimMesh);

  // Rim spokes accent
  const spokeGeom = new THREE.BoxGeometry(width + 0.03, radius * 1.1, radius * 0.15);
  const spokeMesh = new THREE.Mesh(spokeGeom, rimChromeMaterial);
  wheelGroup.add(spokeMesh);

  return wheelGroup;
}

/**
 * Creates the high-performance Player Supercar
 * Composed of 8 distinct visual parts across scales:
 * 1. Chassis/Diffuser
 * 2. Painted Aerodynamic Shell
 * 3. Glass Cockpit Canopy
 * 4. Front Splitter & LED Headlights
 * 5. 4 Wheels
 * 6. Rear Wing/Spoiler
 * 7. Full-width Neon Taillight bar
 * 8. Dual Nitro Exhausts with dynamic flame meshes
 */
export function createPlayerCar(bodyColorHex: string = '#38bdf8'): {
  carGroup: THREE.Group;
  wheels: THREE.Group[];
  nitroFlames: THREE.Mesh[];
  headlightLamps: THREE.Group;
  setBodyColor: (hex: string) => void;
} {
  const carGroup = new THREE.Group();

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(bodyColorHex),
    roughness: 0.25,
    metalness: 0.8,
  });

  const underbodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.7,
    metalness: 0.5,
  });

  // 1. Lower chassis / floor pan (Y offset so pivot sits flush at bottom)
  const chassisGeom = new THREE.BoxGeometry(1.85, 0.2, 4.2);
  const chassis = new THREE.Mesh(chassisGeom, underbodyMaterial);
  chassis.position.set(0, 0.25, 0);
  chassis.castShadow = true;
  carGroup.add(chassis);

  // 2. Main aerodynamic body shell
  const bodyGeom = new THREE.BoxGeometry(1.9, 0.5, 4.0);
  const body = new THREE.Mesh(bodyGeom, bodyMaterial);
  body.position.set(0, 0.5, 0);
  body.castShadow = true;
  carGroup.add(body);

  // Hood wedge slope (front of car is at +Z)
  const hoodGeom = new THREE.BoxGeometry(1.82, 0.22, 1.4);
  const hood = new THREE.Mesh(hoodGeom, bodyMaterial);
  hood.position.set(0, 0.65, 1.1);
  hood.rotation.x = -0.08;
  carGroup.add(hood);

  // 3. Cabin cockpit glass canopy
  const cabinGeom = new THREE.BoxGeometry(1.5, 0.45, 1.8);
  const cabin = new THREE.Mesh(cabinGeom, glassTintedMaterial);
  cabin.position.set(0, 0.88, -0.15);
  carGroup.add(cabin);

  // 4. Front Splitter (at +Z)
  const splitterGeom = new THREE.BoxGeometry(1.92, 0.06, 0.3);
  const splitter = new THREE.Mesh(splitterGeom, underbodyMaterial);
  splitter.position.set(0, 0.16, 2.1);
  carGroup.add(splitter);

  // 5. LED Headlights (facing forward into the road ahead +Z)
  const headlightLamps = new THREE.Group();
  const hlGeom = new THREE.BoxGeometry(0.35, 0.1, 0.1);
  const hlLeft = new THREE.Mesh(hlGeom, headlightGlowMaterial);
  hlLeft.position.set(0.7, 0.52, 2.01);
  const hlRight = new THREE.Mesh(hlGeom, headlightGlowMaterial);
  hlRight.position.set(-0.7, 0.52, 2.01);
  headlightLamps.add(hlLeft);
  headlightLamps.add(hlRight);
  carGroup.add(headlightLamps);

  // 6. Rear Taillight Lightbar (facing camera behind at -Z)
  const tlGeom = new THREE.BoxGeometry(1.7, 0.08, 0.08);
  const taillight = new THREE.Mesh(tlGeom, taillightGlowMaterial);
  taillight.position.set(0, 0.58, -2.01);
  carGroup.add(taillight);

  // 7. Rear Spoiler / Wing (at -Z)
  const wingGroup = new THREE.Group();
  const wingBladeGeom = new THREE.BoxGeometry(1.85, 0.06, 0.35);
  const wingBlade = new THREE.Mesh(wingBladeGeom, underbodyMaterial);
  wingBlade.position.set(0, 1.05, -1.85);

  const strutGeom = new THREE.BoxGeometry(0.08, 0.35, 0.1);
  const strutL = new THREE.Mesh(strutGeom, underbodyMaterial);
  strutL.position.set(0.6, 0.85, -1.85);
  const strutR = new THREE.Mesh(strutGeom, underbodyMaterial);
  strutR.position.set(-0.6, 0.85, -1.85);

  wingGroup.add(wingBlade, strutL, strutR);
  carGroup.add(wingGroup);

  // 8. Four wheels (+X is screen Left, -X is screen Right, +Z is front, -Z is rear)
  const wheels: THREE.Group[] = [];
  const wheelPositions = [
    { x: 0.98, y: 0.35, z: 1.3 },   // Front Left
    { x: -0.98, y: 0.35, z: 1.3 },  // Front Right
    { x: 0.98, y: 0.35, z: -1.3 },  // Rear Left
    { x: -0.98, y: 0.35, z: -1.3 }, // Rear Right
  ];

  wheelPositions.forEach((pos) => {
    const wheel = createWheel(0.35, 0.24);
    wheel.position.set(pos.x, pos.y, pos.z);
    carGroup.add(wheel);
    wheels.push(wheel);
  });

  // 9. Nitro flame meshes (cones at rear exhausts shooting backward towards camera -Z)
  const nitroFlames: THREE.Mesh[] = [];
  // Cone default has apex at +Y. Rotating by -Math.PI / 2 points the apex straight along -Z (behind the car)
  const outerFlameGeom = new THREE.ConeGeometry(0.20, 1.3, 10);
  outerFlameGeom.rotateX(-Math.PI / 2);
  const outerFlameMaterial = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.88,
  });

  const innerFlameGeom = new THREE.ConeGeometry(0.10, 0.9, 8);
  innerFlameGeom.rotateX(-Math.PI / 2);
  const innerFlameMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.95,
  });

  const flameL = new THREE.Mesh(outerFlameGeom, outerFlameMaterial);
  flameL.position.set(0.35, 0.28, -2.4);
  flameL.visible = false;
  const flameLInner = new THREE.Mesh(innerFlameGeom, innerFlameMaterial);
  flameL.add(flameLInner);

  const flameR = new THREE.Mesh(outerFlameGeom, outerFlameMaterial);
  flameR.position.set(-0.35, 0.28, -2.4);
  flameR.visible = false;
  const flameRInner = new THREE.Mesh(innerFlameGeom, innerFlameMaterial);
  flameR.add(flameRInner);

  carGroup.add(flameL);
  carGroup.add(flameR);
  nitroFlames.push(flameL, flameR);

  // Contact shadow fake grounding plane beneath car
  const shadowGeom = new THREE.PlaneGeometry(2.3, 4.6);
  shadowGeom.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const shadowPlane = new THREE.Mesh(shadowGeom, shadowMat);
  shadowPlane.position.set(0, 0.02, 0);
  carGroup.add(shadowPlane);

  return {
    carGroup,
    wheels,
    nitroFlames,
    headlightLamps,
    setBodyColor: (hex: string) => {
      bodyMaterial.color.set(hex);
    },
  };
}

/**
 * Creates oncoming enemy vehicles based on type
 */
export function createEnemyVehicle(type: EnemyType, colorHex: string): {
  group: THREE.Group;
  width: number;
  length: number;
  height: number;
  leftBlinker?: THREE.Mesh;
  rightBlinker?: THREE.Mesh;
} {
  const group = new THREE.Group();

  const paintMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness: 0.35,
    metalness: 0.65,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.75,
    metalness: 0.2,
  });

  // Soft contact shadow underneath
  const addShadow = (w: number, l: number) => {
    const shadowGeom = new THREE.PlaneGeometry(w + 0.3, l + 0.3);
    shadowGeom.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    const sMesh = new THREE.Mesh(shadowGeom, shadowMat);
    sMesh.position.set(0, 0.02, 0);
    group.add(sMesh);
  };

  let width = 1.9;
  let length = 4.2;
  let height = 1.4;
  let leftBlinker: THREE.Mesh | undefined;
  let rightBlinker: THREE.Mesh | undefined;

  if (type === 'truck') {
    // Heavy Big Rig / Semi-Truck
    width = 2.4;
    length = 8.5;
    height = 3.2;

    addShadow(width, length);

    // Front Cab
    const cabGeom = new THREE.BoxGeometry(2.3, 2.6, 2.5);
    const cab = new THREE.Mesh(cabGeom, paintMat);
    cab.position.set(0, 1.5, -2.8);
    cab.castShadow = true;
    group.add(cab);

    // Windshield
    const cabGlassGeom = new THREE.BoxGeometry(2.1, 0.9, 0.1);
    const cabGlass = new THREE.Mesh(cabGlassGeom, glassTintedMaterial);
    cabGlass.position.set(0, 2.1, -4.06);
    group.add(cabGlass);

    // Chrome Grille
    const grilleGeom = new THREE.BoxGeometry(1.6, 1.2, 0.1);
    const grille = new THREE.Mesh(grilleGeom, rimChromeMaterial);
    grille.position.set(0, 0.9, -4.06);
    group.add(grille);

    // Huge Cargo Trailer
    const trailerGeom = new THREE.BoxGeometry(2.35, 2.8, 5.6);
    const trailerMat = new THREE.MeshStandardMaterial({
      color: 0xededed,
      roughness: 0.5,
      metalness: 0.3,
    });
    const trailer = new THREE.Mesh(trailerGeom, trailerMat);
    trailer.position.set(0, 1.7, 1.3);
    trailer.castShadow = true;
    group.add(trailer);

    // Roof Clearance Lights (Amber)
    for (let i = -0.8; i <= 0.8; i += 0.4) {
      const beaconGeom = new THREE.BoxGeometry(0.12, 0.08, 0.1);
      const beacon = new THREE.Mesh(beaconGeom, amberBlinkerOnMaterial);
      beacon.position.set(i, 2.85, -4.0);
      group.add(beacon);
    }

    // High Headlights facing oncoming towards player (+Z direction if flipped or -Z)
    // In our coordinate system, oncoming cars travel from positive Z towards negative Z,
    // so their front faces -Z (towards player at Z=0).
    const hlGeom = new THREE.BoxGeometry(0.35, 0.25, 0.1);
    const hlL = new THREE.Mesh(hlGeom, headlightGlowMaterial);
    hlL.position.set(-0.9, 0.8, -4.06);
    const hlR = new THREE.Mesh(hlGeom, headlightGlowMaterial);
    hlR.position.set(0.9, 0.8, -4.06);
    group.add(hlL, hlR);

    // 8 Truck Wheels
    const truckWheelPositions = [
      { x: -1.15, z: -3.2 },
      { x: 1.15, z: -3.2 },
      { x: -1.15, z: 0.5 },
      { x: 1.15, z: 0.5 },
      { x: -1.15, z: 2.5 },
      { x: 1.15, z: 2.5 },
      { x: -1.15, z: 3.6 },
      { x: 1.15, z: 3.6 },
    ];
    truckWheelPositions.forEach((pos) => {
      const w = createWheel(0.48, 0.28);
      w.position.set(pos.x, 0.48, pos.z);
      group.add(w);
    });
  } else if (type === 'sport') {
    // Sleek, low-slung, fast oncoming sports car
    width = 2.0;
    length = 4.3;
    height = 1.25;

    addShadow(width, length);

    const bodyGeom = new THREE.BoxGeometry(1.95, 0.42, 4.2);
    const body = new THREE.Mesh(bodyGeom, paintMat);
    body.position.set(0, 0.45, 0);
    body.castShadow = true;
    group.add(body);

    const roofGeom = new THREE.BoxGeometry(1.4, 0.38, 1.8);
    const roof = new THREE.Mesh(roofGeom, glassTintedMaterial);
    roof.position.set(0, 0.8, 0.2);
    group.add(roof);

    // Aggressive spoiler
    const wingGeom = new THREE.BoxGeometry(1.8, 0.05, 0.3);
    const wing = new THREE.Mesh(wingGeom, trimMat);
    wing.position.set(0, 0.95, 1.9);
    group.add(wing);

    // Bright Headlights facing player
    const hlGeom = new THREE.BoxGeometry(0.35, 0.1, 0.08);
    const hlL = new THREE.Mesh(hlGeom, headlightGlowMaterial);
    hlL.position.set(-0.7, 0.48, -2.11);
    const hlR = new THREE.Mesh(hlGeom, headlightGlowMaterial);
    hlR.position.set(0.7, 0.48, -2.11);
    group.add(hlL, hlR);

    // Wheels
    [-1.3, 1.3].forEach((z) => {
      [-1.0, 1.0].forEach((x) => {
        const w = createWheel(0.34, 0.24);
        w.position.set(x, 0.34, z);
        group.add(w);
      });
    });
  } else {
    // Standard Sedan or Erratic car
    width = 1.85;
    length = 4.1;
    height = 1.4;

    addShadow(width, length);

    // Body
    const bodyGeom = new THREE.BoxGeometry(1.82, 0.48, 4.0);
    const body = new THREE.Mesh(bodyGeom, paintMat);
    body.position.set(0, 0.48, 0);
    body.castShadow = true;
    group.add(body);

    // Cabin
    const cabinGeom = new THREE.BoxGeometry(1.5, 0.46, 2.1);
    const cabin = new THREE.Mesh(cabinGeom, glassTintedMaterial);
    cabin.position.set(0, 0.9, 0.1);
    group.add(cabin);

    // Headlights
    const hlGeom = new THREE.BoxGeometry(0.32, 0.14, 0.08);
    const hlL = new THREE.Mesh(hlGeom, headlightGlowMaterial);
    hlL.position.set(-0.65, 0.5, -2.01);
    const hlR = new THREE.Mesh(hlGeom, headlightGlowMaterial);
    hlR.position.set(0.65, 0.5, -2.01);
    group.add(hlL, hlR);

    // Blinker lights on front corners (crucial for erratic lane-changer telegraph!)
    const blinkerGeom = new THREE.BoxGeometry(0.14, 0.1, 0.08);
    leftBlinker = new THREE.Mesh(blinkerGeom, amberBlinkerOffMaterial);
    leftBlinker.position.set(0.85, 0.5, -2.01);
    rightBlinker = new THREE.Mesh(blinkerGeom, amberBlinkerOffMaterial);
    rightBlinker.position.set(-0.85, 0.5, -2.01);
    group.add(leftBlinker, rightBlinker);

    // Wheels
    [-1.25, 1.25].forEach((z) => {
      [-0.94, 0.94].forEach((x) => {
        const w = createWheel(0.35, 0.22);
        w.position.set(x, 0.35, z);
        group.add(w);
      });
    });
  }

  // Forward headlight projection beams on asphalt facing -Z towards player
  // Makes oncoming vehicles instantly visible and dramatic from over 150m away!
  const beamGeom = new THREE.PlaneGeometry(width * 1.25, 15);
  beamGeom.rotateX(-Math.PI / 2);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xfff3c4,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
  });
  const beamMesh = new THREE.Mesh(beamGeom, beamMat);
  beamMesh.position.set(0, 0.02, -(length / 2 + 7.5));
  group.add(beamMesh);

  // Scale up traffic vehicles slightly for improved silhouette visibility
  const trafficScale = 1.15;
  group.scale.set(trafficScale, trafficScale, trafficScale);
  width *= trafficScale;
  length *= trafficScale;
  height *= trafficScale;

  return {
    group,
    width,
    length,
    height,
    leftBlinker,
    rightBlinker,
  };
}

/**
 * Creates Collectible Pickups: Nitro Tank or Score Coin
 */
export function createPickupMesh(type: 'nitro' | 'coin'): THREE.Group {
  const group = new THREE.Group();

  if (type === 'nitro') {
    // Glowing cyan/blue futuristic nitro cell
    const capsuleGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.7, 12);
    const capsuleMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    });
    const cylinder = new THREE.Mesh(capsuleGeom, capsuleMat);
    group.add(cylinder);

    // Outer rotating energy halo
    const ringGeom = new THREE.TorusGeometry(0.38, 0.04, 8, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
  } else {
    // Gold Arcade Coin
    const coinGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 16);
    coinGeom.rotateX(Math.PI / 2);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.6,
      roughness: 0.25,
      metalness: 0.85,
    });
    const coin = new THREE.Mesh(coinGeom, coinMat);
    group.add(coin);
  }

  group.position.y = 0.8;
  return group;
}

/**
 * Creates highway road segment with lanes, side guard rails, and streetlight poles
 */
export function createRoadChunk(
  chunkLength: number = 80,
  roadWidth: number = 20,
  laneCount: number = 4
): THREE.Group {
  const group = new THREE.Group();

  // 1. Asphalt Road Bed
  const roadGeom = new THREE.PlaneGeometry(roadWidth, chunkLength);
  roadGeom.rotateX(-Math.PI / 2);
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x1f242e,
    roughness: 0.8,
    metalness: 0.15,
  });
  const road = new THREE.Mesh(roadGeom, roadMat);
  road.receiveShadow = true;
  group.add(road);

  // 2. Road Markings (Crisp, high-contrast dashed white lines + bright golden yellow shoulder lines)
  const laneWidth = roadWidth / laneCount;
  // Dashed lane dividers (wider and crisper for high-speed road readability)
  for (let l = 1; l < laneCount; l++) {
    const laneX = -roadWidth / 2 + l * laneWidth;
    for (let z = -chunkLength / 2 + 3; z < chunkLength / 2; z += 8) {
      const stripeGeom = new THREE.PlaneGeometry(0.35, 4.8);
      stripeGeom.rotateX(-Math.PI / 2);
      const stripeMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
      const stripe = new THREE.Mesh(stripeGeom, stripeMat);
      stripe.position.set(laneX, 0.016, z);
      group.add(stripe);
    }
  }

  // Solid shoulder edge lines (Bright vibrant amber gold)
  [-roadWidth / 2 + 0.45, roadWidth / 2 - 0.45].forEach((edgeX) => {
    const edgeGeom = new THREE.PlaneGeometry(0.48, chunkLength);
    edgeGeom.rotateX(-Math.PI / 2);
    const edgeMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const edgeLine = new THREE.Mesh(edgeGeom, edgeMat);
    edgeLine.position.set(edgeX, 0.017, 0);
    group.add(edgeLine);
  });

  // 3. Side Guardrails
  const railMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.4,
    metalness: 0.8,
  });

  [-roadWidth / 2 - 0.6, roadWidth / 2 + 0.6].forEach((rx) => {
    // Horizontal beam
    const railGeom = new THREE.BoxGeometry(0.2, 0.4, chunkLength);
    const rail = new THREE.Mesh(railGeom, railMat);
    rail.position.set(rx, 0.5, 0);
    group.add(rail);

    // Support posts every 10m
    for (let pz = -chunkLength / 2 + 5; pz <= chunkLength / 2; pz += 10) {
      const postGeom = new THREE.BoxGeometry(0.18, 0.6, 0.18);
      const post = new THREE.Mesh(postGeom, railMat);
      post.position.set(rx, 0.3, pz);
      group.add(post);

      // Reflective amber cat-eye reflector
      const refGeom = new THREE.BoxGeometry(0.08, 0.12, 0.08);
      const refMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
      const reflector = new THREE.Mesh(refGeom, refMat);
      reflector.position.set(rx + (rx > 0 ? -0.12 : 0.12), 0.5, pz);
      group.add(reflector);
    }
  });

  // 4. Streetlight Poles with overhead light arm
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.5,
    metalness: 0.7,
  });
  const lampGlowMat = new THREE.MeshBasicMaterial({
    color: 0xffeedd,
  });

  for (let lz = -chunkLength / 2 + 15; lz < chunkLength / 2; lz += 40) {
    [-roadWidth / 2 - 1.8, roadWidth / 2 + 1.8].forEach((lx) => {
      const lightPole = new THREE.Group();
      // Vertical mast
      const mastGeom = new THREE.CylinderGeometry(0.12, 0.18, 7.5, 8);
      const mast = new THREE.Mesh(mastGeom, poleMat);
      mast.position.set(0, 3.75, 0);
      lightPole.add(mast);

      // Horizontal arch arm extending over road
      const armLength = 3.5;
      const armGeom = new THREE.CylinderGeometry(0.08, 0.08, armLength, 8);
      armGeom.rotateZ(lx > 0 ? -Math.PI / 4 : Math.PI / 4);
      const arm = new THREE.Mesh(armGeom, poleMat);
      arm.position.set(lx > 0 ? -1.2 : 1.2, 7.0, 0);
      lightPole.add(arm);

      // Lamp head
      const headGeom = new THREE.BoxGeometry(0.4, 0.15, 0.8);
      const head = new THREE.Mesh(headGeom, lampGlowMat);
      head.position.set(lx > 0 ? -2.2 : 2.2, 6.8, 0);
      lightPole.add(head);

      lightPole.position.set(lx, 0, lz);
      group.add(lightPole);
    });
  }

  // 5. Surrounding ground / desert / highway embankment outside rails
  const groundGeom = new THREE.PlaneGeometry(160, chunkLength);
  groundGeom.rotateX(-Math.PI / 2);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.95,
    metalness: 0.05,
  });
  const ground = new THREE.Mesh(groundGeom, groundMat);
  ground.position.set(0, -0.05, 0);
  group.add(ground);

  return group;
}
