// SECURESHIFT — v9 build
// Difficulty system added: Easy (5q/2min), Medium (10q/4min), Hard (60q/no limit, auto-fail on wrong).
// HR escalation disabled on all difficulties.
// Run ends when: answer cap reached OR timer hits 0 (Easy/Medium) OR wrong answer on Hard.

// =========================================================
// Scene setup
// =========================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xcfd8e3);
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.7, 10);
camera.rotation.order = "YXZ";
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.domElement.id = "game-canvas";
document.body.appendChild(renderer.domElement);

const ROOM_WIDTH = 24, ROOM_LENGTH = 32, WALL_HEIGHT = 4, WALL_THICKNESS = 0.2, FLOOR_THICKNESS = 0.2;
const colliders = [];
function addCollider(minX, maxX, minY, maxY, minZ, maxZ) { colliders.push({ minX, maxX, minY, maxY, minZ, maxZ }); }

function createLabelTexture(text, { bg = "#1F2937", color = "#FFFFFF", accent = "#2563EB", width = 512, height = 256, fontSize = 64 } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = accent; ctx.fillRect(0, height - 14, width, 14);
  ctx.fillStyle = color;
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, height / 2 - 8);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const office = new THREE.Group(); scene.add(office);
const architecture = new THREE.Group(); office.add(architecture);
const furniture = new THREE.Group(); office.add(furniture);
const workDesks = new THREE.Group(), chairs = new THREE.Group(), receptionDesk = new THREE.Group(), filingCabinets = new THREE.Group(), meetingTable = new THREE.Group(), breakRoomFurniture = new THREE.Group();
furniture.add(workDesks, chairs, receptionDesk, filingCabinets, meetingTable, breakRoomFurniture);

const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.9 });
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xe5e7eb });
const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0xf3f4f6 });
const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x374151 });
const glassMaterial = new THREE.MeshStandardMaterial({ color: 0xbfd7ea, transparent: true, opacity: 0.35 });
const doorPanelMaterial = new THREE.MeshStandardMaterial({ color: 0x374151 });

const floor = new THREE.Mesh(new THREE.BoxGeometry(ROOM_WIDTH, FLOOR_THICKNESS, ROOM_LENGTH), floorMaterial);
floor.position.set(0, -FLOOR_THICKNESS / 2, 0); architecture.add(floor);
const ceiling = new THREE.Mesh(new THREE.BoxGeometry(ROOM_WIDTH, FLOOR_THICKNESS, ROOM_LENGTH), ceilingMaterial);
ceiling.position.set(0, WALL_HEIGHT, 0); architecture.add(ceiling);

function addWallBox(width, height, depth, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMaterial);
  mesh.position.set(x, y, z); architecture.add(mesh);
  addCollider(x - width / 2, x + width / 2, y - height / 2, y + height / 2, z - depth / 2, z + depth / 2);
  return mesh;
}
function addFrameBox(width, height, depth, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), frameMaterial);
  mesh.position.set(x, y, z); architecture.add(mesh);
  addCollider(x - width / 2, x + width / 2, y - height / 2, y + height / 2, z - depth / 2, z + depth / 2);
  return mesh;
}

const SOUTH_DOOR_WIDTH = 2.0, SOUTH_DOOR_HEIGHT = 2.5, SOUTH_Z = ROOM_LENGTH / 2;
addWallBox(ROOM_WIDTH / 2 - SOUTH_DOOR_WIDTH / 2, WALL_HEIGHT, WALL_THICKNESS, -(ROOM_WIDTH / 4 + SOUTH_DOOR_WIDTH / 4), WALL_HEIGHT / 2, SOUTH_Z);
addWallBox(ROOM_WIDTH / 2 - SOUTH_DOOR_WIDTH / 2, WALL_HEIGHT, WALL_THICKNESS, ROOM_WIDTH / 4 + SOUTH_DOOR_WIDTH / 4, WALL_HEIGHT / 2, SOUTH_Z);
addWallBox(SOUTH_DOOR_WIDTH, WALL_HEIGHT - SOUTH_DOOR_HEIGHT, WALL_THICKNESS, 0, SOUTH_DOOR_HEIGHT + (WALL_HEIGHT - SOUTH_DOOR_HEIGHT) / 2, SOUTH_Z);
const SOUTH_FRAME_WIDTH = 2.2, SOUTH_FRAME_HEIGHT = 2.7;
const framePostWidth = (SOUTH_FRAME_WIDTH - SOUTH_DOOR_WIDTH) / 2;
const frameLintelHeight = SOUTH_FRAME_HEIGHT - SOUTH_DOOR_HEIGHT;
addFrameBox(framePostWidth, SOUTH_FRAME_HEIGHT, WALL_THICKNESS, -(SOUTH_DOOR_WIDTH / 2 + framePostWidth / 2), SOUTH_FRAME_HEIGHT / 2, SOUTH_Z);
addFrameBox(framePostWidth, SOUTH_FRAME_HEIGHT, WALL_THICKNESS, SOUTH_DOOR_WIDTH / 2 + framePostWidth / 2, SOUTH_FRAME_HEIGHT / 2, SOUTH_Z);
addFrameBox(SOUTH_FRAME_WIDTH, frameLintelHeight, WALL_THICKNESS, 0, SOUTH_DOOR_HEIGHT + frameLintelHeight / 2, SOUTH_Z);
const doorPanelDepth = 0.06;
const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(SOUTH_DOOR_WIDTH - 0.05, SOUTH_DOOR_HEIGHT - 0.05, doorPanelDepth), doorPanelMaterial);
doorPanel.position.set(0, (SOUTH_DOOR_HEIGHT - 0.05) / 2, SOUTH_Z - WALL_THICKNESS / 2 - doorPanelDepth / 2);
architecture.add(doorPanel);
const doorGlass = new THREE.Mesh(new THREE.PlaneGeometry(SOUTH_DOOR_WIDTH - 0.5, SOUTH_DOOR_HEIGHT - 0.6), glassMaterial);
doorGlass.position.set(0, (SOUTH_DOOR_HEIGHT - 0.05) / 2 + 0.1, SOUTH_Z - WALL_THICKNESS / 2 - doorPanelDepth - 0.01);
architecture.add(doorGlass);
const entranceSignTexture = createLabelTexture("SECURESHIFT", { bg: "#E5E7EB", color: "#1F2937", accent: "#2563EB", fontSize: 60 });
const entranceSign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshBasicMaterial({ map: entranceSignTexture }));
entranceSign.rotation.y = Math.PI;
entranceSign.position.set(0, 3.1, SOUTH_Z - WALL_THICKNESS / 2 - 0.01);
architecture.add(entranceSign);

const NORTH_DOOR_WIDTH = 1.2, NORTH_DOOR_HEIGHT = 2.2, NORTH_Z = -ROOM_LENGTH / 2;
addWallBox(ROOM_WIDTH / 2 - NORTH_DOOR_WIDTH / 2, WALL_HEIGHT, WALL_THICKNESS, -(ROOM_WIDTH / 4 + NORTH_DOOR_WIDTH / 4), WALL_HEIGHT / 2, NORTH_Z);
addWallBox(ROOM_WIDTH / 2 - NORTH_DOOR_WIDTH / 2, WALL_HEIGHT, WALL_THICKNESS, ROOM_WIDTH / 4 + NORTH_DOOR_WIDTH / 4, WALL_HEIGHT / 2, NORTH_Z);
addWallBox(NORTH_DOOR_WIDTH, WALL_HEIGHT - NORTH_DOOR_HEIGHT, WALL_THICKNESS, 0, NORTH_DOOR_HEIGHT + (WALL_HEIGHT - NORTH_DOOR_HEIGHT) / 2, NORTH_Z);
const northDoorPanel = new THREE.Mesh(new THREE.BoxGeometry(NORTH_DOOR_WIDTH - 0.05, NORTH_DOOR_HEIGHT - 0.05, doorPanelDepth), doorPanelMaterial);
northDoorPanel.position.set(0, (NORTH_DOOR_HEIGHT - 0.05) / 2, NORTH_Z + WALL_THICKNESS / 2 + doorPanelDepth / 2);
architecture.add(northDoorPanel);

const WINDOW_WIDTH = 3.0, WINDOW_HEIGHT = 2.0, WINDOW_BOTTOM = 1.2, WINDOW_TOP = WINDOW_BOTTOM + WINDOW_HEIGHT;
const windowCentersZ = [-9, 0, 9];
function addWindow(xPos, zCenter) {
  const frameThickness = 0.08;
  const centerY = WINDOW_BOTTOM + WINDOW_HEIGHT / 2;
  addFrameBox(WALL_THICKNESS + 0.02, frameThickness, WINDOW_WIDTH + frameThickness, xPos, WINDOW_TOP, zCenter);
  addFrameBox(WALL_THICKNESS + 0.02, frameThickness, WINDOW_WIDTH + frameThickness, xPos, WINDOW_BOTTOM, zCenter);
  addFrameBox(WALL_THICKNESS + 0.02, WINDOW_HEIGHT, frameThickness, xPos, centerY, zCenter - WINDOW_WIDTH / 2);
  addFrameBox(WALL_THICKNESS + 0.02, WINDOW_HEIGHT, frameThickness, xPos, centerY, zCenter + WINDOW_WIDTH / 2);
  addFrameBox(WALL_THICKNESS + 0.02, WINDOW_HEIGHT, frameThickness, xPos, centerY, zCenter);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(WINDOW_WIDTH - frameThickness, WINDOW_HEIGHT - frameThickness), glassMaterial);
  glass.rotation.y = Math.PI / 2; glass.position.set(xPos, centerY, zCenter); architecture.add(glass);
}
function buildSideWall(xPos) {
  addWallBox(WALL_THICKNESS, WINDOW_BOTTOM, ROOM_LENGTH, xPos, WINDOW_BOTTOM / 2, 0);
  const topBandHeight = WALL_HEIGHT - WINDOW_TOP;
  addWallBox(WALL_THICKNESS, topBandHeight, ROOM_LENGTH, xPos, WINDOW_TOP + topBandHeight / 2, 0);
  const half = WINDOW_WIDTH / 2;
  const openings = windowCentersZ.map(z => [z - half, z + half]);
  const boundaries = [-ROOM_LENGTH / 2, ...openings.flat(), ROOM_LENGTH / 2];
  for (let i = 0; i < boundaries.length; i += 2) {
    const zStart = boundaries[i], zEnd = boundaries[i + 1];
    const segLength = zEnd - zStart;
    if (segLength > 0.001) addWallBox(WALL_THICKNESS, WINDOW_HEIGHT, segLength, xPos, WINDOW_BOTTOM + WINDOW_HEIGHT / 2, zStart + segLength / 2);
  }
  windowCentersZ.forEach(z => addWindow(xPos, z));
}
buildSideWall(-ROOM_WIDTH / 2); buildSideWall(ROOM_WIDTH / 2);

const deskMaterial = new THREE.MeshStandardMaterial({ color: 0x374151 });
const deskLegMaterial = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
const deskAccentMaterial = new THREE.MeshStandardMaterial({ color: 0x2563eb });
const chairSeatMaterial = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
const chairBackMaterial = new THREE.MeshStandardMaterial({ color: 0x111827 });
const chairBaseMaterial = new THREE.MeshStandardMaterial({ color: 0x374151 });
const cabinetMaterial = new THREE.MeshStandardMaterial({ color: 0x6b7280 });
const cabinetHandleMaterial = new THREE.MeshStandardMaterial({ color: 0x374151 });
const receptionPanelMaterial = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
const receptionCounterMaterial = new THREE.MeshStandardMaterial({ color: 0xd1d5db });
const meetingTableMaterial = new THREE.MeshStandardMaterial({ color: 0xa16207 });
const breakTableMaterial = new THREE.MeshStandardMaterial({ color: 0xb7791f });
const carpetAccentMaterial = new THREE.MeshStandardMaterial({ color: 0x4b5563 });
const plantPotMaterial = new THREE.MeshStandardMaterial({ color: 0xf3f4f6 });
const plantLeafMaterial = new THREE.MeshStandardMaterial({ color: 0x2f6b3a });

function addPlant(x, z, parentGroup = architecture) {
  const plant = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.25, 10), plantPotMaterial);
  pot.position.set(0, 0.125, 0); plant.add(pot);
  for (let i = 0; i < 4; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.45, 6), plantLeafMaterial);
    const angle = (i / 4) * Math.PI * 2;
    leaf.position.set(Math.cos(angle) * 0.08, 0.25 + 0.22, Math.sin(angle) * 0.08);
    leaf.rotation.z = Math.cos(angle) * 0.25;
    leaf.rotation.x = Math.sin(angle) * 0.25;
    plant.add(leaf);
  }
  plant.position.set(x, 0, z); parentGroup.add(plant); return plant;
}

const DESK_WIDTH = 1.8, DESK_DEPTH = 0.8, DESK_HEIGHT = 0.75, DESK_LEG_SIZE = 0.06;
function createDesk(x, z) {
  const desk = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(DESK_DEPTH, 0.05, DESK_WIDTH), deskMaterial);
  top.position.set(0, DESK_HEIGHT, 0); desk.add(top);
  const accent = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.01, DESK_WIDTH), deskAccentMaterial);
  accent.position.set(DESK_DEPTH / 2 - 0.02, DESK_HEIGHT + 0.03, 0); desk.add(accent);
  const legOffsetX = DESK_DEPTH / 2 - DESK_LEG_SIZE / 2;
  const legOffsetZ = DESK_WIDTH / 2 - DESK_LEG_SIZE / 2;
  const legHeight = DESK_HEIGHT - 0.05;
  [[-legOffsetX, -legOffsetZ], [-legOffsetX, legOffsetZ], [legOffsetX, -legOffsetZ], [legOffsetX, legOffsetZ]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(DESK_LEG_SIZE, legHeight, DESK_LEG_SIZE), deskLegMaterial);
    leg.position.set(lx, legHeight / 2, lz); desk.add(leg);
  });
  desk.position.set(x, 0, z); workDesks.add(desk);
  addCollider(x - DESK_DEPTH / 2, x + DESK_DEPTH / 2, 0, DESK_HEIGHT + 0.05, z - DESK_WIDTH / 2, z + DESK_WIDTH / 2);
  return desk;
}
function createChair(x, z, facing) {
  const chair = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.05, 0.45), chairSeatMaterial);
  seat.position.set(0, 0.45, 0); chair.add(seat);
  const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 0.05), chairBackMaterial);
  backrest.position.set(0, 0.7, -0.2); chair.add(backrest);
  [-0.24, 0.24].forEach(armX => {
    const armrest = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.35), chairBaseMaterial);
    armrest.position.set(armX, 0.58, 0); chair.add(armrest);
  });
  const support = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8), chairBaseMaterial);
  support.position.set(0, 0.225, 0); chair.add(support);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.03, 5), chairBaseMaterial);
  base.position.set(0, 0.015, 0); chair.add(base);
  chair.rotation.y = -facing * (Math.PI / 2);
  chair.position.set(x, 0, z); chairs.add(chair);
  addCollider(x - 0.25, x + 0.25, 0, 0.75, z - 0.25, z + 0.25);
  return chair;
}
const DESK_ROW_Z = [-8, -4.8, -1.6, 1.6, 4.8, 8];
DESK_ROW_Z.forEach(z => { createDesk(-7, z); createChair(-6.4, z, 1); });
DESK_ROW_Z.forEach(z => { createDesk(7, z); createChair(6.4, z, -1); });

const RECEPTION_WIDTH = 2.5, RECEPTION_DEPTH = 0.9, RECEPTION_HEIGHT = 1.0;
(function createReception() {
  const desk = new THREE.Group();
  const counter = new THREE.Mesh(new THREE.BoxGeometry(RECEPTION_WIDTH, 0.05, RECEPTION_DEPTH), receptionCounterMaterial);
  counter.position.set(0, RECEPTION_HEIGHT, 0); desk.add(counter);
  const frontPanel = new THREE.Mesh(new THREE.BoxGeometry(RECEPTION_WIDTH, RECEPTION_HEIGHT - 0.05, 0.05), receptionPanelMaterial);
  frontPanel.position.set(0, (RECEPTION_HEIGHT - 0.05) / 2, RECEPTION_DEPTH / 2 - 0.025); desk.add(frontPanel);
  const signTexture = createLabelTexture("SECURESHIFT", { bg: "#1F2937", color: "#FFFFFF", accent: "#2563EB", fontSize: 70 });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(RECEPTION_WIDTH - 0.4, 0.35), new THREE.MeshBasicMaterial({ map: signTexture, transparent: true }));
  sign.position.set(0, (RECEPTION_HEIGHT - 0.05) / 2, RECEPTION_DEPTH / 2 - 0.001);
  desk.add(sign);
  desk.position.set(-5, 0, 13); receptionDesk.add(desk);
  addCollider(-5 - RECEPTION_WIDTH / 2, -5 + RECEPTION_WIDTH / 2, 0, RECEPTION_HEIGHT, 13 - RECEPTION_DEPTH / 2, 13 + RECEPTION_DEPTH / 2);
  addPlant(-5 - RECEPTION_WIDTH / 2 - 0.3, 13 + 0.2, receptionDesk);
})();

const CABINET_WIDTH = 0.5, CABINET_DEPTH = 0.6, CABINET_HEIGHT = 1.3;
function createFilingCabinet(x, z) {
  const cabinet = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(CABINET_WIDTH, CABINET_HEIGHT, CABINET_DEPTH), cabinetMaterial);
  body.position.set(0, CABINET_HEIGHT / 2, 0); cabinet.add(body);
  for (let i = 0; i < 3; i++) {
    const drawerY = CABINET_HEIGHT * (0.2 + i * 0.3);
    const line = new THREE.Mesh(new THREE.BoxGeometry(CABINET_WIDTH + 0.005, 0.01, CABINET_DEPTH + 0.005), cabinetHandleMaterial);
    line.position.set(0, drawerY, 0); cabinet.add(line);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 0.03), cabinetHandleMaterial);
    handle.position.set(0, drawerY + 0.08, CABINET_DEPTH / 2 + 0.015); cabinet.add(handle);
  }
  cabinet.position.set(x, 0, z); filingCabinets.add(cabinet);
  addCollider(x - CABINET_WIDTH / 2, x + CABINET_WIDTH / 2, 0, CABINET_HEIGHT, z - CABINET_DEPTH / 2, z + CABINET_DEPTH / 2);
}
createFilingCabinet(-11, -15); createFilingCabinet(11, -15); createFilingCabinet(-11, 15); createFilingCabinet(11, 3);

const MEETING_LENGTH = 4, MEETING_WIDTH = 1.5, MEETING_HEIGHT = 0.75;
(function createMeeting() {
  const table = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(MEETING_WIDTH, 0.06, MEETING_LENGTH), meetingTableMaterial);
  top.position.set(0, MEETING_HEIGHT, 0); table.add(top);
  const legSize = 0.08;
  const legHeight = MEETING_HEIGHT - 0.06;
  const legOffsetX = MEETING_WIDTH / 2 - 0.2;
  const legOffsetZ = MEETING_LENGTH / 2 - 0.2;
  [[-legOffsetX, -legOffsetZ], [-legOffsetX, legOffsetZ], [legOffsetX, -legOffsetZ], [legOffsetX, legOffsetZ]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(legSize, legHeight, legSize), deskLegMaterial);
    leg.position.set(lx, legHeight / 2, lz); table.add(leg);
  });
  table.position.set(0, 0, -12); meetingTable.add(table);
  addCollider(0 - MEETING_WIDTH / 2, 0 + MEETING_WIDTH / 2, 0, MEETING_HEIGHT, -12 - MEETING_LENGTH / 2, -12 + MEETING_LENGTH / 2);
})();
function createMeetingChair(x, z, angle) {
  const chair = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.42), chairSeatMaterial);
  seat.position.set(0, 0.44, 0); chair.add(seat);
  const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.05), chairBackMaterial);
  backrest.position.set(0, 0.68, -0.19); chair.add(backrest);
  const support = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.44, 8), chairBaseMaterial);
  support.position.set(0, 0.22, 0); chair.add(support);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.03, 5), chairBaseMaterial);
  base.position.set(0, 0.015, 0); chair.add(base);
  chair.rotation.y = angle;
  chair.position.set(x, 0, z);
  meetingTable.add(chair);
  addCollider(x - 0.24, x + 0.24, 0, 0.7, z - 0.24, z + 0.24);
}
[-13.2, -12, -10.8].forEach(z => {
  createMeetingChair(-1.3, z, Math.PI / 2);
  createMeetingChair(1.3, z, -Math.PI / 2);
});
const meetingCarpet = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), carpetAccentMaterial);
meetingCarpet.rotation.x = -Math.PI / 2;
meetingCarpet.position.set(0, 0.001, -12); architecture.add(meetingCarpet);
const meetingDisplayTexture = createLabelTexture("SECURESHIFT", { bg: "#111827", color: "#FFFFFF", accent: "#06B6D4", fontSize: 60 });
const meetingDisplay = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.2), new THREE.MeshBasicMaterial({ map: meetingDisplayTexture }));
meetingDisplay.position.set(0, 2.4, -ROOM_LENGTH / 2 + 0.11); architecture.add(meetingDisplay);
addPlant(-2.8, -14.5, architecture);

const BREAK_TABLE_SIZE = 1.0, BREAK_TABLE_HEIGHT = 0.72;
(function createBreakTable() {
  const table = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(BREAK_TABLE_SIZE / 2, BREAK_TABLE_SIZE / 2, 0.05, 16), breakTableMaterial);
  top.position.set(0, BREAK_TABLE_HEIGHT, 0); table.add(top);
  const support = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, BREAK_TABLE_HEIGHT - 0.05, 8), deskLegMaterial);
  support.position.set(0, (BREAK_TABLE_HEIGHT - 0.05) / 2, 0); table.add(support);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 16), deskLegMaterial);
  base.position.set(0, 0.015, 0); table.add(base);
  table.position.set(9, 0, 12.5); breakRoomFurniture.add(table);
  addCollider(9 - BREAK_TABLE_SIZE / 2, 9 + BREAK_TABLE_SIZE / 2, 0, BREAK_TABLE_HEIGHT, 12.5 - BREAK_TABLE_SIZE / 2, 12.5 + BREAK_TABLE_SIZE / 2);
})();
function createBreakChair(x, z, angle) {
  const chair = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.4), chairSeatMaterial);
  seat.position.set(0, 0.42, 0); chair.add(seat);
  const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 0.05), chairBackMaterial);
  backrest.position.set(0, 0.65, -0.18); chair.add(backrest);
  const accent = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.01), deskAccentMaterial);
  accent.position.set(0, 0.65, -0.155); chair.add(accent);
  const support = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.42, 8), chairBaseMaterial);
  support.position.set(0, 0.21, 0); chair.add(support);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 5), chairBaseMaterial);
  base.position.set(0, 0.015, 0); chair.add(base);
  chair.rotation.y = angle;
  chair.position.set(x, 0, z);
  breakRoomFurniture.add(chair);
  addCollider(x - 0.22, x + 0.22, 0, 0.65, z - 0.22, z + 0.22);
}
const breakTableX = 9, breakTableZ = 12.5;
createBreakChair(breakTableX, breakTableZ - 0.8, 0);
createBreakChair(breakTableX, breakTableZ + 0.8, Math.PI);
createBreakChair(breakTableX - 0.8, breakTableZ, Math.PI / 2);
createBreakChair(breakTableX + 0.8, breakTableZ, -Math.PI / 2);
const breakCabinetMaterial = new THREE.MeshStandardMaterial({ color: 0xf3f4f6 });
const breakCabinet = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.45), breakCabinetMaterial);
breakCabinet.position.set(11.3, 0.45, breakTableZ); breakRoomFurniture.add(breakCabinet);
addCollider(11.0, 11.6, 0, 0.9, breakTableZ - 0.225, breakTableZ + 0.225);
addPlant(6.5, 15, breakRoomFurniture);

const equipment = new THREE.Group(); office.add(equipment);
const monitors = new THREE.Group(), keyboards = new THREE.Group(), mice = new THREE.Group(), computerTowers = new THREE.Group();
equipment.add(monitors, keyboards, mice, computerTowers);

const monitorFrameMaterial = new THREE.MeshStandardMaterial({ color: 0x111827 });
const monitorStandMaterial = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
const keyboardMaterial = new THREE.MeshStandardMaterial({ color: 0x111827 });
const mouseMaterial = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
const towerMaterial = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
const monitorLogoTexture = createLabelTexture("SECURESHIFT", { bg: "#172554", color: "#F3F4F6", accent: "#06B6D4", fontSize: 46, width: 512, height: 300 });

const MONITOR_WIDTH = 1.0, MONITOR_HEIGHT = 0.6, MONITOR_DEPTH = 0.08;
const KEYBOARD_WIDTH = 0.45, KEYBOARD_DEPTH = 0.18, KEYBOARD_HEIGHT = 0.04;
const MOUSE_WIDTH = 0.08, MOUSE_DEPTH = 0.12, MOUSE_HEIGHT = 0.04;
const TOWER_WIDTH = 0.2, TOWER_DEPTH = 0.45, TOWER_HEIGHT = 0.45;
const deskTopY = DESK_HEIGHT + 0.025;

function createMonitor(x, z, facing) {
  const monitor = new THREE.Group();
  const standHeight = 0.12;
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.1, standHeight, 0.15), monitorStandMaterial);
  stand.position.set(0, deskTopY + standHeight / 2, 0); monitor.add(stand);
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(MONITOR_DEPTH, MONITOR_HEIGHT, MONITOR_WIDTH), monitorFrameMaterial);
  bezel.position.set(0, deskTopY + standHeight + MONITOR_HEIGHT / 2, 0); monitor.add(bezel);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(MONITOR_WIDTH - 0.08, MONITOR_HEIGHT - 0.08), new THREE.MeshBasicMaterial({ map: monitorLogoTexture }));
  screen.rotation.y = facing > 0 ? Math.PI / 2 : -Math.PI / 2;
  screen.position.set(facing * (MONITOR_DEPTH / 2 + 0.005), deskTopY + standHeight + MONITOR_HEIGHT / 2, 0);
  monitor.add(screen); monitor.position.set(x, 0, z); monitors.add(monitor);
}
function createKeyboard(x, z) {
  const kb = new THREE.Mesh(new THREE.BoxGeometry(KEYBOARD_DEPTH, KEYBOARD_HEIGHT, KEYBOARD_WIDTH), keyboardMaterial);
  kb.position.set(x, deskTopY + KEYBOARD_HEIGHT / 2, z); keyboards.add(kb);
}
function createMouse(x, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(MOUSE_DEPTH, MOUSE_HEIGHT, MOUSE_WIDTH), mouseMaterial);
  m.position.set(x, deskTopY + MOUSE_HEIGHT / 2, z); mice.add(m);
}
function createTower(x, z) {
  const t = new THREE.Mesh(new THREE.BoxGeometry(TOWER_WIDTH, TOWER_HEIGHT, TOWER_DEPTH), towerMaterial);
  t.position.set(x, TOWER_HEIGHT / 2, z); computerTowers.add(t);
}
function createWorkstationEquipment(deskX, z, side) {
  const facing = side === "west" ? 1 : -1;
  createMonitor(deskX + -facing * (DESK_DEPTH / 2 - 0.12), z, facing);
  createKeyboard(deskX + facing * (DESK_DEPTH / 2 - 0.18), z);
  createMouse(deskX + facing * (DESK_DEPTH / 2 - 0.18), z + facing * 0.28);
  createTower(deskX - facing * 0.05, z + DESK_WIDTH / 2 - 0.35);
}
DESK_ROW_Z.forEach(z => createWorkstationEquipment(-7, z, "west"));
DESK_ROW_Z.forEach(z => createWorkstationEquipment(7, z, "east"));

const employees = new THREE.Group(); employees.name = "Employees"; office.add(employees);
const skinTones = [0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac, 0xa9744f];
const employeeShirtColors = [0x1e3a8a, 0x60a5fa, 0x4b5563, 0x3f6212, 0xf3f4f6, 0x7f1d1d, 0x2563eb, 0x4b5563, 0xd6b98c, 0x1e3a8a, 0x60a5fa, 0x374151];
const hairColors = [0x000000, 0x2b1b12, 0x5a3825, 0xd9c08a];
const CHAIR_SEAT_HEIGHT = 0.45;

function createEmployee(name, x, z, facing, variantIndex) {
  const employee = new THREE.Group();
  employee.name = name;
  const scale = 0.95 + (variantIndex % 4) * 0.03;
  const skinMaterial = new THREE.MeshStandardMaterial({ color: skinTones[variantIndex % skinTones.length] });
  const shirtMaterial = new THREE.MeshStandardMaterial({ color: employeeShirtColors[variantIndex % employeeShirtColors.length] });
  const hairMaterial = new THREE.MeshStandardMaterial({ color: hairColors[variantIndex % hairColors.length] });
  const pantsMaterial = new THREE.MeshStandardMaterial({ color: 0x2f3236 });
  const shoeMaterial = new THREE.MeshStandardMaterial({ color: 0x111827 });
  const hipY = CHAIR_SEAT_HEIGHT + 0.05;

  function buildLeg(sideX) {
    const leg = new THREE.Group();
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.4), pantsMaterial);
    thigh.position.set(sideX, hipY - 0.075, 0.2); leg.add(thigh);
    const kneeY = hipY - 0.15;
    const shin = new THREE.Mesh(new THREE.BoxGeometry(0.1, kneeY, 0.1), pantsMaterial);
    shin.position.set(sideX, kneeY / 2, 0.4); leg.add(shin);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.2), shoeMaterial);
    foot.position.set(sideX, 0.025, 0.45); leg.add(foot);
    return leg;
  }
  employee.add(buildLeg(-0.1), buildLeg(0.1));

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.25), shirtMaterial);
  torso.position.set(0, hipY + 0.225, 0); employee.add(torso);
  const shoulderY = hipY + 0.45;

  function buildArm(sideX) {
    const arm = new THREE.Group();
    const upperArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.1), shirtMaterial);
    upperArm.position.set(sideX, shoulderY - 0.14, 0.05); arm.add(upperArm);
    const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.4), skinMaterial);
    forearm.position.set(sideX, shoulderY - 0.25, 0.3); arm.add(forearm);
    return { group: arm, upperArm };
  }
  const leftArm = buildArm(-0.225); const rightArm = buildArm(0.225);
  employee.add(leftArm.group, rightArm.group);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), skinMaterial);
  head.position.set(0, shoulderY + 0.16, 0.02); employee.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.135, 12, 10, 0, Math.PI * 2, 0, Math.PI / 1.9), hairMaterial);
  hair.position.copy(head.position); employee.add(hair);

  employee.scale.setScalar(scale);
  employee.position.set(x, 0, z);
  employee.rotation.y = -facing * (Math.PI / 2);
  employees.add(employee);
  return { group: employee, head, arms: [leftArm.upperArm, rightArm.upperArm] };
}

const employeeInstances = [];
DESK_ROW_Z.forEach((z, i) => {
  const num = String(i + 1).padStart(2, "0");
  employeeInstances.push(createEmployee(`Employee${num}`, -6.4, z, 1, i));
});
DESK_ROW_Z.forEach((z, i) => {
  const num = String(i + 7).padStart(2, "0");
  employeeInstances.push(createEmployee(`Employee${num}`, 6.4, z, -1, i + 6));
});

// =========================================================
// TASK POOL (unchanged)
// =========================================================
function senderDetail({ from, replyTo, returnPath, spf, dkim, origin }) {
  return { from, replyTo, returnPath, spf, dkim, origin };
}

const TASK_POOL = [
  {
    id: "MAIL_001", type: "mail", difficulty: 2,
    title: "Unusual sign-in activity on your Microsoft account",
    senderName: "Microsoft account team", senderAvatar: "MS",
    senderChip: { text: "External", class: "chip-external" },
    recipient: "m.chen@secureshift.com", time: "09:42",
    subject: "Unusual sign-in activity on your Microsoft account",
    preview: "We detected something unusual about a recent sign-in…",
    senderDetails: senderDetail({ from: "Microsoft account team <no-reply@rnicrosoft.com>", replyTo: "verify@rnicrosoft-support.com", returnPath: "bounce@rnicrosoft-support.com", spf: "FAIL (rnicrosoft.com does not authorize 185.220.101.45)", dkim: "FAIL (no valid signature)", origin: "185.220.101.45 (Amsterdam, NL)" }),
    bodyHtml: `Dear Customer,

We detected something unusual about a recent sign-in to your Microsoft account.

Country/region: London, United Kingdom
IP address: 185.220.101.45
Date: 14 November 2024 09:38 (GMT)

If this was you, no action is needed. If this was not you, someone may have accessed your account.

Please verify your identity to secure your account:
hxxps://rnicrosoft.com/account/verify?token=a83b2f19

Microsoft account team

---
This message was sent from an unmonitored mailbox.`,
    correctDecision: "report", incorrectDecision: "open",
    correctFeedback: `Correct.\n\nThe email looks like a genuine Microsoft security alert — but look closer:\n\n• The sender domain is "rnicrosoft.com" (rn instead of m) — a homoglyph attack\n• SPF and DKIM both FAIL — Microsoft always passes these\n• The reply-to goes to rnicrosoft-support.com, a domain Microsoft does not own\n• The sign-in location (Amsterdam) and the link don't match Microsoft's real infrastructure\n\nThis is a textbook Microsoft impersonation phishing email. Report it as phishing.`,
    incorrectFeedback: `This was a phishing email.\n\nWarning signs you should have caught:\n\n• The sender domain is "rnicrosoft.com" — an "rn" that looks like an "m"\n• SPF: FAIL, DKIM: FAIL — genuine Microsoft mail always passes authentication\n• The link goes to rnicrosoft.com, not microsoft.com\n• The message pushes you to "verify your identity" from an unmonitored mailbox\n\nClicking the link would have sent your credentials to an attacker-controlled site.`
  },
  {
    id: "MAIL_002", type: "mail", difficulty: 3,
    title: "Invoice INV-2024-0842 from Meridian Supplies Ltd",
    senderName: "Jane Okafor — Meridian Supplies", senderAvatar: "JO",
    senderChip: { text: "External", class: "chip-external" },
    recipient: "m.chen@secureshift.com", time: "09:15",
    subject: "Invoice INV-2024-0842 — payment due 15 Nov",
    preview: "Hi, attached is invoice INV-2024-0842…",
    senderDetails: senderDetail({ from: "Jane Okafor <jane.okafor@meridian-supplies.co.uk>", replyTo: "accounts@meridian-supplies.co.uk", returnPath: "jane.okafor@meridian-supplies.co.uk", spf: "PASS (meridian-supplies.co.uk)", dkim: "PASS (meridian-supplies.co.uk)", origin: "85.214.132.117 (Berlin, DE)" }),
    bodyHtml: `Hi Michael,

I hope you're well. Attached is invoice INV-2024-0842 for last month's order of packaging materials (£4,820.50). Payment terms are 30 days, so the due date is 15 November.

Please arrange payment via the usual method.

Let me know if the PDF doesn't open properly.

Best regards,
Jane Okafor
Accounts Receivable
Meridian Supplies Ltd
+44 20 7946 0958`,
    correctDecision: "report", incorrectDecision: "open",
    correctFeedback: `Correct.\n\nThis is a fake-invoice attachment attack. Even though the sender details look legitimate (SPF and DKIM pass), several things are off:\n\n• You have no record of Meridian Supplies Ltd as an approved vendor\n• The invoice amount (£4,820.50) is suspiciously just below the threshold that typically requires dual approval\n• Attachments from unknown vendors should never be opened directly\n• The phone number is a UK premium-rate pattern\n\nThe PDF almost certainly contains malware.`,
    incorrectFeedback: `This was a fake-invoice attack.\n\nEven though SPF/DKIM passed, this invoice was not legitimate:\n\n• Meridian Supplies Ltd is not on your approved vendor list\n• The amount was carefully chosen to slip under financial approval thresholds\n• The PDF attachment likely contains malware\n\nNever open invoice attachments from unfamiliar senders.`
  },
  {
    id: "MAIL_003", type: "mail", difficulty: 2,
    title: "Sarah Whitfield shared 'Q4_Budget_Final.xlsx' with you",
    senderName: "Sarah Whitfield (via SharePoint)", senderAvatar: "SW",
    senderChip: { text: "External", class: "chip-external" },
    recipient: "m.chen@secureshift.com", time: "08:58",
    subject: "Sarah Whitfield shared 'Q4_Budget_Final.xlsx' with you",
    preview: "Sarah Whitfield has shared a file with you…",
    senderDetails: senderDetail({ from: "SharePoint <sharepoint@office365-sharepoint.com>", replyTo: "sarah.whitfield.q4budget@gmail.com", returnPath: "bounce@office365-sharepoint.com", spf: "FAIL (office365-sharepoint.com does not authorize 45.153.160.12)", dkim: "FAIL", origin: "45.153.160.12 (Moscow, RU)" }),
    bodyHtml: `Sarah Whitfield has shared a file with you.

Document: Q4_Budget_Final.xlsx
Owner: sarah.whitfield.q4budget@gmail.com

Click below to open in SharePoint:

    Open Document

If you weren't expecting this file, please ignore this email.

© 2024 Microsoft Corporation.`,
    correctDecision: "report", incorrectDecision: "open",
    correctFeedback: `Correct.\n\nThis is a fake SharePoint share notification.\n\nRed flags:\n• The real SharePoint domain is sharepoint.com — "office365-sharepoint.com" is not Microsoft-owned\n• The reply-to address is a personal Gmail account\n• SPF and DKIM both FAIL\n• The origin IP is in Russia\n\nReport it — clicking the link would have sent you to a credential-harvesting page.`,
    incorrectFeedback: `This was a fake SharePoint phishing attempt.\n\nThe clues:\n• "office365-sharepoint.com" is not a Microsoft-owned domain\n• Reply-to goes to a personal Gmail address\n• SPF/DKIM both FAIL\n• Origin IP is in Russia\n\nNever trust file-share notifications that don't originate from your own tenant.`
  },
  {
    id: "MAIL_004", type: "mail", difficulty: 3,
    title: "REMINDER: Company Handbook Update — Acknowledgment Required",
    senderName: "HR Department", senderAvatar: "HR",
    senderChip: { text: "External", class: "chip-external" },
    recipient: "m.chen@secureshift.com", time: "09:10",
    subject: "REMINDER: Company Handbook Update — Acknowledgment Required",
    preview: "All staff must acknowledge the updated handbook by Friday…",
    senderDetails: senderDetail({ from: "HR Department <hr@secureshift-hr.co>", replyTo: "compliance@secureshift-hr.co", returnPath: "hr@secureshift-hr.co", spf: "FAIL (secureshift-hr.co is not your organization's domain)", dkim: "FAIL", origin: "91.219.236.55 (Kyiv, UA)" }),
    bodyHtml: `Dear Employee,

This is a reminder that our updated Company Handbook for 2024 requires acknowledgment from all staff by Friday 15 November.

To review and acknowledge the changes, please sign in through the HR portal:

    [ Acknowledge on HR Portal ]

The updated sections cover:
  • Remote work policy
  • Data protection responsibilities
  • Acceptable use of company equipment

Failure to acknowledge by the deadline will be escalated to your line manager.

Kind regards,
HR Department
SecureShift Ltd`,
    correctDecision: "report", incorrectDecision: "open",
    correctFeedback: `Correct.\n\nThis is a classic HR-themed phishing attempt.\n\nWarning signs:\n• Sender domain is "secureshift-hr.co" — note the ".co" TLD\n• The message creates urgency\n• SPF/DKIM both FAIL\n• Origin IP is in Ukraine\n• It asks you to sign in via an external HR portal\n\nPhishing campaigns often use HR/IT themes. Report as phishing.`,
    incorrectFeedback: `This was a phishing email disguised as HR communication.\n\nThe clues:\n• Domain "secureshift-hr.co" is fake\n• Creates false urgency\n• SPF/DKIM FAIL\n• Origin IP is in Ukraine\n\nHR-themed phishing is one of the most effective attacks.`
  },
  {
    id: "MAIL_005", type: "mail", difficulty: 3,
    title: "Quick favour",
    senderName: "David Reeves (CEO)", senderAvatar: "DR",
    senderChip: { text: "External", class: "chip-external" },
    recipient: "m.chen@secureshift.com", time: "08:47",
    subject: "Quick favour",
    preview: "Michael — are you at your desk? I need you to handle something discreetly…",
    senderDetails: senderDetail({ from: "David Reeves <david.reeves.ceo@gmail.com>", replyTo: "david.reeves.ceo@gmail.com", returnPath: "david.reeves.ceo@gmail.com", spf: "PASS (gmail.com)", dkim: "PASS (gmail.com)", origin: "209.85.128.42 (Google LLC)" }),
    bodyHtml: `Michael,

Are you at your desk? I need you to handle something for me but I can't talk right now — I'm in back-to-back meetings.

I need you to buy 5 x £200 Apple gift cards for a client thank-you gift. I'll reimburse you as soon as I'm out of this meeting.

Please scratch the back off and send me photos of the codes. Do it today if you can.

Don't discuss this with anyone else — it's a surprise for the client.

Thanks,
David`,
    correctDecision: "report", incorrectDecision: "open",
    correctFeedback: `Correct.\n\nThis is a CEO impersonation scam (also called "whaling" or "BEC").\n\nRed flags:\n• The CEO is using a personal Gmail address, not his corporate one\n• Asks for gift cards — the single most common BEC scam\n• Requests secrecy\n• Creates urgency\n\nReport this immediately to IT and your manager.`,
    incorrectFeedback: `This was a CEO impersonation scam.\n\nYou should have caught:\n• Sender used a personal Gmail address\n• Gift card requests are the #1 form of BEC\n• "Don't discuss with anyone" is a red flag\n• Time pressure\n\nIf you had replied, you'd be out £1000 and the company would have no recourse.`
  },
  {
    id: "MAIL_006", type: "mail", difficulty: 3,
    title: "Reminder: Q4 All-Hands is Thursday at 4 PM",
    senderName: "Priya Raman — Communications", senderAvatar: "PR",
    senderChip: { text: "Internal", class: "chip-internal" },
    recipient: "m.chen@secureshift.com", time: "08:22",
    subject: "Reminder: Q4 All-Hands is Thursday at 4 PM",
    preview: "Quick reminder about the Q4 all-hands this Thursday…",
    senderDetails: senderDetail({ from: "Priya Raman <priya.raman@secureshift.com>", replyTo: "priya.raman@secureshift.com", returnPath: "priya.raman@secureshift.com", spf: "PASS (secureshift.com)", dkim: "PASS (secureshift.com)", origin: "Internal (secureshift.com mail server)" }),
    bodyHtml: `Hi everyone,

Quick reminder that the Q4 all-hands is this Thursday at 4 PM in the Aurora room (and on Teams for the remote folks).

Agenda:
  • Q3 recap and Q4 priorities — David
  • New product launch update — Product team
  • Office move logistics — Facilities
  • Q&A

Please add any questions to the shared doc beforehand if you can.

See you Thursday.

Priya
Internal Comms`,
    correctDecision: "safe", incorrectDecision: "report",
    correctFeedback: `Correct — this is a legitimate internal email.\n\nClues that it's real:\n• Sender is an internal @secureshift.com address\n• SPF and DKIM both PASS\n• Origin is your own mail server\n• No urgency, no external links, no credential requests\n\nNot every email is phishing.`,
    incorrectFeedback: `This was actually a legitimate internal email.\n\nIt's easy to become paranoid, but:\n• Sender domain is your real corporate domain\n• SPF and DKIM both PASS\n• No urgency, no suspicious links, no credential requests\n\nReporting legitimate internal messages creates noise.`
  },
  {
    id: "MAIL_007", type: "mail", difficulty: 1,
    title: "Your Dropbox password was reset",
    senderName: "Dropbox", senderAvatar: "DB",
    senderChip: { text: "External", class: "chip-external" },
    recipient: "m.chen@secureshift.com", time: "07:55",
    subject: "Your Dropbox password was reset",
    preview: "We received a request to reset your password…",
    senderDetails: senderDetail({ from: "Dropbox <no-reply@dropbox-account.com>", replyTo: "help@dropbox-account.com", returnPath: "bounce@dropbox-account.com", spf: "FAIL (dropbox-account.com is not dropbox.com)", dkim: "FAIL", origin: "196.251.73.20 (Lagos, NG)" }),
    bodyHtml: `Hi there,

We received a request to reset your Dropbox password.

If you made this request, click the button below to reset your password:

    Reset Password

If you did not request a password reset, please secure your account here:
    Secure Account

Dropbox will never ask for your password via email.

Thanks,
The Dropbox Team`,
    correctDecision: "report", incorrectDecision: "open",
    correctFeedback: `Correct.\n\nYou didn't request a Dropbox password reset.\n\nRed flags:\n• Sender domain is "dropbox-account.com", not "dropbox.com"\n• SPF and DKIM both FAIL\n• Origin IP is in Nigeria\n• Two links, both pointing at non-Dropbox domains\n\nReport it.`,
    incorrectFeedback: `This was a phishing email.\n\nThe clues:\n• Domain "dropbox-account.com" is not Dropbox\n• SPF/DKIM FAIL\n• Origin is Lagos, Nigeria\n• You never requested a password reset\n\nNever click password-reset links you didn't ask for.`
  },
  {
    id: "MAIL_008", type: "mail", difficulty: 1,
    title: "DHL: Your parcel is being held at our depot",
    senderName: "DHL Express", senderAvatar: "DH",
    senderChip: { text: "External", class: "chip-external" },
    recipient: "m.chen@secureshift.com", time: "07:30",
    subject: "DHL: Your parcel is being held at our depot",
    preview: "We attempted to deliver your parcel today but nobody was available…",
    senderDetails: senderDetail({ from: "DHL Express <tracking@dhl-parcel-uk.com>", replyTo: "support@dhl-parcel-uk.com", returnPath: "bounce@dhl-parcel-uk.com", spf: "FAIL (dhl-parcel-uk.com not authorized)", dkim: "FAIL", origin: "45.153.160.9 (St Petersburg, RU)" }),
    bodyHtml: `Dear Customer,

We attempted to deliver your parcel (tracking number: JD0140023948271) to 42 Bishopsgate, London EC2N 4AY today but nobody was available to sign for it.

Your parcel is currently being held at our local depot. To reschedule delivery, please pay the small re-delivery fee of £2.99:

    Reschedule & Pay £2.99

If the parcel is not rescheduled within 72 hours, it will be returned to the sender.

DHL Express Customer Service`,
    correctDecision: "report", incorrectDecision: "open",
    correctFeedback: `Correct.\n\nThis is a fake-DHL delivery scam.\n\nRed flags:\n• Domain is "dhl-parcel-uk.com" — DHL's real domain is dhl.com\n• Asking for a small "re-delivery fee" is the classic hook\n• SPF/DKIM FAIL\n• Origin IP is in Russia\n• "Act within 72 hours" is false urgency\n\nReport it.`,
    incorrectFeedback: `This was a phishing scam.\n\nWarning signs:\n• "dhl-parcel-uk.com" is not DHL\n• Asking for a small fee is how attackers capture card details\n• SPF/DKIM FAIL\n• Origin IP is Russian\n\nYou would have handed your credit card to cybercriminals.`
  },
  {
    id: "MAIL_009", type: "mail", difficulty: 2,
    title: "ACTION REQUIRED: Update your bank details for payroll",
    senderName: "Payroll Department", senderAvatar: "PY",
    senderChip: { text: "External", class: "chip-external" },
    recipient: "m.chen@secureshift.com", time: "09:27",
    subject: "ACTION REQUIRED: Update your bank details for payroll",
    preview: "Due to a system migration, we need you to re-enter your bank details…",
    senderDetails: senderDetail({ from: "Payroll Department <payroll@secureshift-payroll.net>", replyTo: "payroll@secureshift-payroll.net", returnPath: "payroll@secureshift-payroll.net", spf: "FAIL (secureshift-payroll.net is not secureshift.com)", dkim: "FAIL", origin: "103.87.131.42 (Hanoi, VN)" }),
    bodyHtml: `Hi Michael,

As part of our migration to a new payroll system, all employees need to re-enter their bank account details through the new self-service portal.

Please complete this before Friday 15 November so your November salary is not delayed.

    Update Bank Details Now

You'll need:
  • Your national insurance number
  • Bank account number and sort code
  • Your latest payslip (for verification)

Thanks,
Payroll Department
SecureShift Ltd`,
    correctDecision: "report", incorrectDecision: "open",
    correctFeedback: `Correct.\n\nThis is a payroll-redirection phishing attack.\n\nRed flags:\n• Domain "secureshift-payroll.net" is not your company's real domain\n• Claims of a "system migration"\n• Requests full bank details\n• Creates urgency via the salary deadline\n• SPF/DKIM FAIL\n• Origin IP is in Vietnam\n\nReport immediately.`,
    incorrectFeedback: `This was a serious phishing attempt targeting your salary.\n\nThe clues:\n• Domain is "secureshift-payroll.net"\n• The "system migration" pretext is a classic excuse\n• Urgency around payday\n• SPF/DKIM FAIL\n\nIf you'd entered your details, your next salary could have been redirected.`
  },
  {
    id: "MAIL_010", type: "mail", difficulty: 3,
    title: "Thursday 1:1 with Sarah",
    senderName: "Sarah Kim", senderAvatar: "SK",
    senderChip: { text: "Internal", class: "chip-internal" },
    recipient: "m.chen@secureshift.com", time: "08:05",
    subject: "Thursday 1:1 with Sarah",
    preview: "Moving our 1:1 to Thursday 2 PM if that still works…",
    senderDetails: senderDetail({ from: "Sarah Kim <sarah.kim@secureshift.com>", replyTo: "sarah.kim@secureshift.com", returnPath: "sarah.kim@secureshift.com", spf: "PASS (secureshift.com)", dkim: "PASS (secureshift.com)", origin: "Internal (secureshift.com mail server)" }),
    bodyHtml: `Hi Michael,

Moving our 1:1 from Wednesday to Thursday 2 PM — same room as usual (the small one by the window). I've updated the calendar invite.

Topics I want to cover:
  • Your Q4 objectives
  • Training budget for next year
  • The new on-call rotation

Let me know if Thursday 2 PM doesn't work and we'll find something else.

Sarah`,
    correctDecision: "safe", incorrectDecision: "report",
    correctFeedback: `Correct — legitimate internal email.\n\nWhy it's safe:\n• Sent from @secureshift.com\n• SPF and DKIM PASS\n• Reply-to matches the sender\n• No external links, no urgency\n\nRecognising legitimate emails is just as important as spotting phishing.`,
    incorrectFeedback: `This was a legitimate internal email.\n\nYou reported:\n• An internal @secureshift.com address\n• SPF/DKIM PASS\n• No urgency, no external links\n\nOver-reporting legitimate messages creates noise.`
  },
  {
    id: "CHAT_001", type: "chat", difficulty: 2,
    title: "IT Support asking to verify your credentials",
    chatContactName: "IT Support", chatContactHandle: "@it_support_secureshift",
    senderAvatar: "IT",
    chatContactChip: { text: "External contact", class: "chip-external" },
    chatContactDetails: senderDetail({ handle: "@it_support_secureshift", profileDomain: "External tenant — no verified domain", accountCreated: "3 days ago", mutualGroups: "0", reportCount: "Reported 2 times by other users" }),
    chatStatus: "External contact — not verified",
    preview: "Hi Michael — we detected an issue with your account",
    bodyHtml: `Hi Michael — this is IT Support.

We detected an issue with your account earlier today. Our system shows an unusual login attempt and we need to verify your credentials before the account gets locked.

Please reply with:
  • your username
  • your current password

We'll re-authenticate you on our side and you'll be fine within 5 minutes.

— IT Support`,
    correctDecision: "report", incorrectDecision: "follow",
    correctFeedback: `Correct.\n\nThis is a classic chat-based credential phishing attack.\n\nRed flags:\n• Real IT Support never asks for your password\n• The handle "@it_support_secureshift" is not a corporate verified account\n• Account was created 3 days ago with 0 mutual groups\n• It's already been reported by other users\n• Creates false urgency\n\nReport the contact and block them.`,
    incorrectFeedback: `This was a phishing attempt.\n\nYou should never share your credentials with anyone.\n\nReal IT teams:\n• Never ask for your password\n• Don't use personal handles\n• Won't pressure you with fake account-lock warnings\n\nIf you had replied, an attacker would now have your username and password.`
  },
  {
    id: "CHAT_002", type: "chat", difficulty: 1,
    title: "Unknown contact asking for your password",
    chatContactName: "Marcus Bennett", chatContactHandle: "@marcus.bennett1147",
    senderAvatar: "MB",
    chatContactChip: { text: "Unknown contact", class: "chip-unknown" },
    chatContactDetails: senderDetail({ handle: "@marcus.bennett1147", profileDomain: "No verified domain", accountCreated: "Yesterday", mutualGroups: "0", reportCount: "No reports" }),
    chatStatus: "Unknown contact",
    preview: "Hi, are you the IT guy? I need help with my account",
    bodyHtml: `Hi, are you the IT guy?

I'm locked out of my corporate account and I need to get in before a client call in 10 minutes. Can you just share the admin password so I can log in? I'll change it back right after, promise.

— Marcus`,
    correctDecision: "report", incorrectDecision: "follow",
    correctFeedback: `Correct.\n\nNobody should ask for an admin password over chat.\n\nRed flags:\n• Unknown contact\n• Asking for the admin password\n• Time pressure ("client call in 10 minutes")\n• "I'll change it back right after, promise"\n\nReport and block.`,
    incorrectFeedback: `This was obviously a phishing attempt.\n\nYou would never share an admin password over chat. Even if someone genuinely has an account problem, the correct action is:\n• Verify their identity through HR\n• Have them submit a ticket\n• Never share credentials\n\nIf you had replied, the entire corporate network could be compromised.`
  },
  {
    id: "CHAT_003", type: "chat", difficulty: 3,
    title: "Manager asking for client list on WhatsApp",
    chatContactName: "David Reeves (CEO)", chatContactHandle: "+44 7700 900 912",
    senderAvatar: "DR",
    chatContactChip: { text: "Unsaved number", class: "chip-unknown" },
    chatContactDetails: senderDetail({ handle: "+44 7700 900 912", profileDomain: "WhatsApp — no verified business account", accountCreated: "Unknown", mutualGroups: "Not on WhatsApp", reportCount: "Not available" }),
    chatStatus: "WhatsApp — unknown number",
    preview: "Michael, it's David — need the client list ASAP",
    bodyHtml: `Michael, it's David. I'm in a board meeting and can't use my work phone.

I need you to send me the full client contact list — names, emails, phone numbers, contract values. Send it to this number now, we have a call with investors in 20 minutes and I need it on hand.

Don't email it, just WhatsApp is fine. Thanks.`,
    correctDecision: "report", incorrectDecision: "follow",
    correctFeedback: `Correct.\n\nThis is executive-impersonation on WhatsApp.\n\nRed flags:\n• CEO messaging from an unsaved mobile number\n• Asking for sensitive data\n• Time pressure and "don't email it"\n• "Can't use my work phone"\n\nNever send sensitive data through WhatsApp. Verify by calling the CEO's office directly.`,
    incorrectFeedback: `This was an executive impersonation attack.\n\nYou nearly leaked your company's entire client list.\n\nThe giveaways:\n• CEO contacted you via an unknown number\n• Asked for sensitive data over an unapproved channel\n• Used time pressure and requested no logging\n\nReal executives use approved corporate channels.`
  },
  {
    id: "CHAT_004", type: "chat", difficulty: 2,
    title: "Urgent link from an unknown contact",
    chatContactName: "Elena Rostova", chatContactHandle: "@elena.r0stova",
    senderAvatar: "ER",
    chatContactChip: { text: "Unknown contact", class: "chip-unknown" },
    chatContactDetails: senderDetail({ handle: "@elena.r0stova", profileDomain: "External tenant — no verified domain", accountCreated: "1 day ago", mutualGroups: "1 (Recruitment)", reportCount: "No reports" }),
    chatStatus: "External contact",
    preview: "Hi! You were recommended to me for a great role…",
    bodyHtml: `Hi!

You were recommended to me by a colleague in your team for an exciting senior security role at a fintech in Zurich — £120k base, fully remote.

I can only keep the opening for 24 hours though. Please review the job description and apply here:

   https://secureshift-careers.info/senior-security-role

Let me know once you've applied!

Elena`,
    correctDecision: "report", incorrectDecision: "follow",
    correctFeedback: `Correct.\n\nThis is a recruitment-themed phishing scam.\n\nRed flags:\n• Too-good-to-be-true offer\n• External domain "secureshift-careers.info"\n• 24-hour deadline\n• Unsolicited contact from an unverified account\n\nReport it.`,
    incorrectFeedback: `This was a recruitment phishing scam.\n\nThe link would have taken you to a fake site that harvests corporate credentials.\n\nRed flags:\n• "secureshift-careers.info" is not your company domain\n• Too-good-to-be-true salary\n• 24-hour pressure`
  },
  {
    id: "CHAT_005", type: "chat", difficulty: 3,
    title: "Teammate asking about tomorrow's sync",
    chatContactName: "Michael Chen", chatContactHandle: "@michael.chen (Colleague)",
    senderAvatar: "MC",
    chatContactChip: { text: "Internal", class: "chip-internal" },
    chatContactDetails: senderDetail({ handle: "@michael.chen", profileDomain: "secureshift.com (verified tenant)", accountCreated: "2 years ago", mutualGroups: "Engineering, IT, Product, Security", reportCount: "No reports" }),
    chatStatus: "Internal — verified tenant",
    preview: "Hey — quick one about the sync tomorrow",
    bodyHtml: `Hey,

Quick one about the sync tomorrow — are we still on for 10 AM? I want to add a small item about the new vulnerability dashboard before we lock the agenda.

Also did you finish reviewing the access-control PR? No rush if not.

Thanks,
Michael`,
    correctDecision: "safe", incorrectDecision: "report",
    correctFeedback: `Correct — legitimate teammate message.\n\nWhy it's safe:\n• Handle is a verified internal account\n• Account is 2 years old\n• Content is normal work chatter\n• No links, no urgency\n\nGood job not over-reporting.`,
    incorrectFeedback: `This was a legitimate internal message.\n\nYou reported a colleague from a verified internal tenant.\n\nOver-reporting wastes the security team's time.`
  },
  {
    id: "CHAT_006", type: "chat", difficulty: 2,
    title: "Message from 'Security Operations' asking you to click",
    chatContactName: "Security Operations", chatContactHandle: "@sec_ops_notification",
    senderAvatar: "SO",
    chatContactChip: { text: "External", class: "chip-external" },
    chatContactDetails: senderDetail({ handle: "@sec_ops_notification", profileDomain: "External tenant — no verified domain", accountCreated: "5 days ago", mutualGroups: "0", reportCount: "No reports" }),
    chatStatus: "Unverified external contact",
    preview: "Security alert: click to re-verify your account",
    bodyHtml: `⚠ SECURITY ALERT ⚠

Our monitoring system has flagged your account for unusual access patterns. Your session will expire in 30 minutes unless you re-verify.

Click here immediately:
   https://secureshift-secops-verify.info

If you do not act, your account will be suspended pending review.

— Security Operations`,
    correctDecision: "report", incorrectDecision: "follow",
    correctFeedback: `Correct.\n\nThis is a phishing message impersonating your internal security team.\n\nRed flags:\n• Handle is an external account\n• Real Security Ops would never DM you with a link\n• Creates false urgency\n• The domain "secureshift-secops-verify.info" is fake\n\nReport immediately.`,
    incorrectFeedback: `This was a phishing attack impersonating Security Operations.\n\nYou should have caught:\n• The handle is not on your internal tenant\n• Real Security Ops doesn't DM with "click here immediately"\n• Domain "secureshift-secops-verify.info" is fake\n• 30-minute pressure was designed to make you click`
  },
  {
    id: "BROWSER_001", type: "browser", difficulty: 2,
    title: "Suspicious sign-in page — micros0ft-login.com",
    browserUrl: "https://micros0ft-login.com/signin",
    browserPageTitle: "Sign in to your Microsoft account",
    senderAvatar: "MS",
    browserContentHtml: `
      <div class="fake-logo logo-microsoft">Microsoft</div>
      <h1>Sign in</h1>
      <p>to continue to Outlook</p>
      <input class="fake-input" type="text" placeholder="Email, phone, or Skype" value="" readonly />
      <input class="fake-input" type="password" placeholder="Password" value="" readonly />
      <button class="fake-btn">Sign in</button>
      <p style="margin-top:18px; font-size:11px; color:#6b7280;">Trouble signing in? Contact your admin.</p>
    `,
    correctDecision: "report", incorrectDecision: "verify",
    correctFeedback: `Correct.\n\nThe URL is "micros0ft-login.com"\n\n• "micros0ft" uses a zero (0) instead of the letter "o"\n• Microsoft's real login is login.microsoftonline.com or login.live.com\n• Any credentials entered here go to an attacker\n\nAlways check the domain carefully.`,
    incorrectFeedback: `This was a phishing page impersonating Microsoft sign-in.\n\nThe URL "micros0ft-login.com" uses the digit 0.\n\nReal Microsoft sign-in:\n  • login.microsoftonline.com\n  • login.live.com\n\nNever enter credentials unless you can verify the domain.`
  },
  {
    id: "BROWSER_002", type: "browser", difficulty: 3,
    title: "Corporate portal look-alike — portal-secureshift.net",
    browserUrl: "https://portal-secureshift.net/login",
    browserPageTitle: "SecureShift Employee Portal — Sign In",
    senderAvatar: "SS",
    browserContentHtml: `
      <div class="fake-logo" style="color:#2563eb;">SECURESHIFT</div>
      <h2>Employee Portal — Sign In</h2>
      <p>Please sign in with your corporate credentials to continue.</p>
      <input class="fake-input" type="text" placeholder="Corporate email" value="" readonly />
      <input class="fake-input" type="password" placeholder="Password" value="" readonly />
      <button class="fake-btn">Sign In</button>
      <p style="margin-top:18px; font-size:11px; color:#6b7280;">© 2024 SecureShift Ltd. All rights reserved.</p>
    `,
    correctDecision: "report", incorrectDecision: "verify",
    correctFeedback: `Correct.\n\nThe URL is "portal-secureshift.net"\n\nYour real portal is on "secureshift.com". The attacker bought "portal-secureshift.net" — ".net" TLD, reordered words.\n\nAlways check the domain.`,
    incorrectFeedback: `This was a phishing page impersonating your corporate portal.\n\n"portal-secureshift.net" is fake — your real domain is "secureshift.com".\n\nEntering credentials would have handed them to an attacker.`
  },
  {
    id: "BROWSER_003", type: "browser", difficulty: 1,
    title: "Adobe Flash update required",
    browserUrl: "https://flash-update-required.com/latest",
    browserPageTitle: "Update Required — Adobe Flash Player",
    senderAvatar: "AD",
    browserContentHtml: `
      <div class="fake-logo logo-adobe">Adobe</div>
      <h2>Your Flash Player is out of date</h2>
      <p>A new critical security update is available. Please update to continue viewing this content.</p>
      <p>This version of Flash Player is no longer supported and must be updated immediately.</p>
      <button class="fake-btn" style="background:#eb1000;">Update Now</button>
    `,
    correctDecision: "report", incorrectDecision: "verify",
    correctFeedback: `Correct.\n\nAdobe Flash Player was discontinued in December 2020.\n\nRed flags:\n• Flash has been end-of-life for years\n• Real Adobe updates come only from adobe.com\n• "Must be updated immediately" is false urgency\n\nReport the page.`,
    incorrectFeedback: `This was a malware delivery page.\n\nAny "Flash update" is malware.\n\nLegitimate software updates:\n• Come from the vendor's official domain\n• Are pushed automatically\n• Never use urgency language`
  },
  {
    id: "BROWSER_004", type: "browser", difficulty: 2,
    title: "Dropbox storage full alert",
    browserUrl: "https://dropbox-account-check.com/storage",
    browserPageTitle: "Dropbox — Storage Almost Full",
    senderAvatar: "DB",
    browserContentHtml: `
      <div class="fake-logo logo-dropbox">Dropbox</div>
      <h2>Your storage is almost full</h2>
      <p>You have used 99% of your 2 GB storage. New files cannot be uploaded until you upgrade or remove files.</p>
      <p>Sign in to your account to manage your storage:</p>
      <input class="fake-input" type="text" placeholder="Email" value="" readonly />
      <input class="fake-input" type="password" placeholder="Password" value="" readonly />
      <button class="fake-btn" style="background:#0061ff;">Sign In</button>
    `,
    correctDecision: "report", incorrectDecision: "verify",
    correctFeedback: `Correct.\n\nThis is a fake Dropbox page.\n\nRed flags:\n• URL "dropbox-account-check.com" is not dropbox.com\n• You received no legitimate notification\n• Real Dropbox warnings link back to dropbox.com\n\nClose the page and report.`,
    incorrectFeedback: `This was a phishing page.\n\n"dropbox-account-check.com" is not Dropbox.\n\nAlways:\n• Check the domain before entering credentials\n• Navigate directly to the service\n• Never trust unsolicited pages`
  },
  {
    id: "BROWSER_005", type: "browser", difficulty: 3,
    title: "SecureShift intranet homepage",
    browserUrl: "https://intranet.secureshift.com/",
    browserPageTitle: "SecureShift Intranet — Home",
    senderAvatar: "SS",
    browserContentHtml: `
      <div class="fake-logo" style="color:#2563eb;">SECURESHIFT</div>
      <h2>Welcome to the SecureShift Intranet</h2>
      <p>Quick links:</p>
      <ul style="margin-left: 20px; line-height: 1.9;">
        <li>Employee directory</li>
        <li>IT Help Desk — submit a ticket</li>
        <li>HR policies and handbook</li>
        <li>Weekly company news</li>
        <li>Security awareness training</li>
      </ul>
      <p style="margin-top:16px; font-size:12px; color:#6b7280;">You are signed in as m.chen@secureshift.com</p>
    `,
    correctDecision: "safe", incorrectDecision: "report",
    correctFeedback: `Correct — legitimate internal page.\n\nWhy it's safe:\n• URL is intranet.secureshift.com\n• You're signed in with SSO\n• Content is normal intranet links\n• No urgency\n\nNot every page is a threat.`,
    incorrectFeedback: `This was a legitimate page — your intranet homepage.\n\nYou reported a page on your own corporate domain that loaded with your SSO session.\n\nOver-reporting legitimate pages wastes time.`
  },
  {
    id: "BROWSER_006", type: "browser", difficulty: 2,
    title: "Careers portal ask — hr-secureshift-careers.info",
    browserUrl: "https://hr-secureshift-careers.info/portal",
    browserPageTitle: "SecureShift HR Portal — Verify Your Identity",
    senderAvatar: "HR",
    browserContentHtml: `
      <div class="fake-logo" style="color:#7f1d1d;">SECURESHIFT HR</div>
      <h2>Verify Your Identity</h2>
      <p>To continue to the HR portal, please confirm your corporate email address and password.</p>
      <input class="fake-input" type="text" placeholder="Corporate email" value="" readonly />
      <input class="fake-input" type="password" placeholder="Password" value="" readonly />
      <button class="fake-btn" style="background:#7f1d1d;">Verify & Continue</button>
      <p style="margin-top:18px; font-size:11px; color:#6b7280;">© SecureShift Ltd — Confidential</p>
    `,
    correctDecision: "report", incorrectDecision: "verify",
    correctFeedback: `Correct.\n\nThe URL is "hr-secureshift-careers.info":\n• Your real domain is secureshift.com\n• ".info" is a cheap TLD\n• HR doesn't use external .info domains\n\nReport the page.`,
    incorrectFeedback: `This was a phishing page.\n\nReal HR systems live on secureshift.com behind SSO.\n\nEntering credentials would have sent them to an attacker.`
  },
  {
    id: "SECURITY_001", type: "security", difficulty: 2,
    title: "Unrecognized process attempting to modify hosts file",
    secAlertText: `Process:        svhost.exe  (note: "svhost", not "svchost")\nFull path:      C:\\Users\\m.chen\\AppData\\Local\\Temp\\svhost.exe\nParent:         explorer.exe\nCommand line:   svhost.exe -install -quiet\nBehavior:       Attempting to write to C:\\Windows\\System32\\drivers\\etc\\hosts\nDetected:       14 Nov 2024 09:41:27\nSignature:      Not signed`,
    secSeverity: "High",
    correctDecision: "report", incorrectDecision: "ignore",
    correctFeedback: `Correct.\n\nThe process name is "svhost.exe" — one letter short of the legitimate "svchost.exe".\n\nAdditional red flags:\n• Located in Temp\n• Launched from explorer.exe\n• No digital signature\n• Trying to modify the hosts file\n\nThis is almost certainly malware. Report it.`,
    incorrectFeedback: `This was malware.\n\nThe giveaway: "svhost.exe" vs "svchost.exe". The missing "c" is a classic masquerading technique.\n\nDismissing alerts like this can allow malware to persist.`
  },
  {
    id: "SECURITY_002", type: "security", difficulty: 3,
    title: "Windows Defender — Protection definitions updated",
    secAlertText: `Event:          Protection definitions updated successfully\nNew version:    1.417.642.0\nPrevious:       1.417.638.0\nSource:         Microsoft Update\nSigned by:      Microsoft Corporation\nTime:           14 Nov 2024 09:22:11`,
    secSeverity: "Informational",
    correctDecision: "safe", incorrectDecision: "report",
    correctFeedback: `Correct.\n\nThis is a routine signature update from Microsoft.\n\nNothing suspicious:\n• Signed by Microsoft Corporation\n• Source is Microsoft Update\n• No abnormal behaviour\n\nNot every alert is a threat.`,
    incorrectFeedback: `This was a legitimate Windows Defender update.\n\nYou flagged a routine definition update signed by Microsoft Corporation.\n\nReporting normal system events creates noise.`
  },
  {
    id: "SECURITY_003", type: "security", difficulty: 1,
    title: "14 failed sign-in attempts on your Microsoft account",
    secAlertText: `Account:        m.chen@secureshift.com\nAttempts:       14 failed sign-ins\nTime window:    09:34 – 09:38 (4 minutes)\nIP:             185.220.101.45 (Amsterdam, NL)\nClient:         Python-requests/2.31 (not a browser)\nStatus:         Account temporarily locked\nAction needed:  Review and confirm ownership`,
    secSeverity: "High",
    correctDecision: "report", incorrectDecision: "ignore",
    correctFeedback: `Correct.\n\n14 failed sign-ins in 4 minutes, from a single IP, using a scripted client (Python-requests) is a textbook brute-force attack.\n\nWhy report:\n• IP is in Amsterdam\n• Python-requests means automated tooling\n• Reporting lets security block the source IP\n\nReport it.`,
    incorrectFeedback: `You dismissed a real attack signal.\n\nRepeated failed sign-ins from a single foreign IP is a brute-force attempt.\n\nDismissing the alert means:\n• The attacker keeps trying\n• No IP block is applied\n\nReport all anomalous authentication activity.`
  },
  {
    id: "SECURITY_004", type: "security", difficulty: 2,
    title: "Unapproved USB device connected",
    secAlertText: `Device:         SanDisk Cruzer Blade 32 GB\nSerial:         4C530001120408117382\nVendor ID:      0781\nStatus:         NOT on approved device list\nTime connected: 14 Nov 2024 09:39:52\nPort:           USB-A front panel`,
    secSeverity: "High",
    correctDecision: "report", incorrectDecision: "ignore",
    correctFeedback: `Correct.\n\nYour organization has a device allowlist — this SanDisk Cruzer is not on it.\n\nWhy report:\n• Unapproved USB drives are a classic malware vector\n• Corporate policy requires all removable devices to be registered\n• The drive may contain a BadUSB payload\n\nAlways treat unrecognised devices as potentially hostile.`,
    incorrectFeedback: `You dismissed an unapproved device.\n\nUnapproved USBs can:\n• Carry BadUSB firmware\n• Auto-run malware\n• Exfiltrate data silently\n\nYour device allowlist exists for exactly this reason.`
  },
  {
    id: "SECURITY_005", type: "security", difficulty: 3,
    title: "Scheduled quick scan completed — no threats found",
    secAlertText: `Scan type:      Scheduled quick scan\nStarted:        14 Nov 2024 03:00:00\nCompleted:      14 Nov 2024 03:14:52\nResult:         No threats found\nItems scanned:  82,419\nSigned by:      Microsoft Defender Antivirus`,
    secSeverity: "Informational",
    correctDecision: "safe", incorrectDecision: "report",
    correctFeedback: `Correct.\n\nThis is a routine scheduled scan that ran overnight and found nothing.\n\nNothing here should raise concern.\n\nNot every security event is a threat.`,
    incorrectFeedback: `You flagged a routine Defender scan.\n\nThe scan ran on schedule and found nothing, signed by Microsoft Defender Antivirus.\n\nReporting routine events adds noise to the queue.`
  },
  {
    id: "SECURITY_006", type: "security", difficulty: 2,
    title: "Unusual outbound traffic to 203.0.113.42",
    secAlertText: `Process:        chrome.exe\nUser:           m.chen@secureshift.com\nDestination:    203.0.113.42:8443\nProtocol:       TLS\nData volume:    118 MB in last 8 minutes\nReputation:     Known-bad — listed on internal blocklist\nTime:           14 Nov 2024 09:41:05`,
    secSeverity: "High",
    correctDecision: "report", incorrectDecision: "ignore",
    correctFeedback: `Correct.\n\n118 MB of outbound TLS traffic from Chrome to an IP on your internal blocklist is a major red flag.\n\nWhy report:\n• The destination has a known-malicious reputation\n• The volume suggests bulk data exfiltration\n• Chrome may have been hijacked\n\nEscalate immediately.`,
    incorrectFeedback: `You dismissed a serious threat.\n\nYou should have reported:\n• Traffic to an IP on your internal blocklist\n• Large outbound volume\n• Unusual port\n\nThis has the hallmarks of active data exfiltration.`
  }
];

// =========================================================
// Employee state
// =========================================================
const employeeTaskStates = {};

function initializeEmployeeTaskState(empName) {
  employeeTaskStates[empName] = {
    assignedTasks: [],
    completedTaskIds: [],
    currentTaskIndex: 0,
    allTasksCompleted: false,
    strikes: 0,
    fired: false,
    firedByPlayer: false,
    taskCompletionLocked: false,
    health: 100,
    lastReaction: "none",
    lastTaskTitle: null,
    hasActiveRequest: false,
    currentOpenTaskId: null,
    correctCount: 0,
    wrongCount: 0,
    history: []
  };
}

function getAvailableTasksForEmployee(empName) {
  const state = employeeTaskStates[empName];
  if (!state) return [];
  return TASK_POOL.filter(task =>
    !state.completedTaskIds.includes(task.id) &&
    !state.assignedTasks.some(t => t.id === task.id)
  );
}
function assignTasksToEmployee(empName) {
  if (!employeeTaskStates[empName]) initializeEmployeeTaskState(empName);
  const empState = employeeTaskStates[empName];
  const available = getAvailableTasksForEmployee(empName);
  const shuffled = [...available];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  empState.assignedTasks = shuffled.slice(0, 5);
  empState.currentTaskIndex = 0;
  empState.allTasksCompleted = false;
  empState.taskCompletionLocked = false;
  empState.currentOpenTaskId = null;
}
function getCurrentTaskForEmployee(empName) {
  const state = employeeTaskStates[empName];
  if (!state) return null;
  if (state.fired) return null;
  if (state.allTasksCompleted) return null;
  if (state.currentTaskIndex >= state.assignedTasks.length) {
    state.allTasksCompleted = true;
    return null;
  }
  return state.assignedTasks[state.currentTaskIndex] || null;
}
function completeCurrentTaskForEmployee(empName) {
  const state = employeeTaskStates[empName];
  if (!state || state.fired || state.taskCompletionLocked || state.allTasksCompleted) return false;
  const currentTask = getCurrentTaskForEmployee(empName);
  if (!currentTask) { state.allTasksCompleted = true; return false; }
  if (state.completedTaskIds.includes(currentTask.id)) return false;
  state.taskCompletionLocked = true;
  state.completedTaskIds.push(currentTask.id);
  state.currentTaskIndex++;
  state.taskCompletionLocked = false;
  if (state.currentTaskIndex >= state.assignedTasks.length) state.allTasksCompleted = true;
  return true;
}
function getTaskProgress(empName) {
  const state = employeeTaskStates[empName];
  if (!state) return { current: 0, total: 5, allCompleted: false };
  return {
    current: Math.min(state.currentTaskIndex + 1, 5),
    total: 5,
    allCompleted: state.allTasksCompleted || state.currentTaskIndex >= state.assignedTasks.length
  };
}
function isTaskFromSystem(task) { return task && task.id !== undefined && TASK_POOL.some(t => t.id === task.id); }
function getStrikes(empName) {
  const s = employeeTaskStates[empName];
  return s ? (s.strikes || 0) : 0;
}
function isEmployeeFired(empName) { return employeeTaskStates[empName]?.fired === true; }
function addStrike(empName) {
  const state = employeeTaskStates[empName];
  if (!state || state.fired || state.strikes >= 3) return false;
  state.strikes = (state.strikes || 0) + 1;
  return state.strikes;
}
function getStrikeDisplay(empName) { return `${getStrikes(empName)} / 3`; }
function getApplicationDisplayName(task) {
  if (!task) return "Unknown";
  const appMap = { mail: "MAIL", chat: "CHAT", browser: "BROWSER", security: "SECURITY CENTRE" };
  return appMap[task.type] || task.type.toUpperCase();
}
function getDifficultyLabel(task) {
  if (!task) return "";
  const diffMap = { 1: "Easy", 2: "Moderate", 3: "Challenging" };
  return diffMap[task.difficulty] || "";
}
function getDifficultyClass(task) {
  if (!task) return "";
  return `ws-task-difficulty-${(getDifficultyLabel(task) || "easy").toLowerCase()}`;
}

function getHealth(empName) { return employeeTaskStates[empName]?.health ?? 100; }
function setHealth(empName, value) {
  const state = employeeTaskStates[empName];
  if (!state) return;
  state.health = Math.max(0, Math.min(100, value));
}
function getHealthState(health) {
  if (health >= 80) return { label: "CONFIDENT", emoji: "😊", key: "confident" };
  if (health >= 60) return { label: "OKAY", emoji: "🙂", key: "okay" };
  if (health >= 40) return { label: "UNCERTAIN", emoji: "😐", key: "uncertain" };
  if (health >= 20) return { label: "STRESSED", emoji: "😟", key: "stressed" };
  return { label: "OVERWHELMED", emoji: "😰", key: "overwhelmed" };
}
const MOOD_LINES = {
  confident: ["Doing fine, thanks.", "Feeling good today!", "All good here — no worries."],
  okay: ["I'm okay, just busy.", "Things are fine, I guess.", "Can't complain."],
  uncertain: ["I'm a little unsure about some of this…", "Hmm, I hope I'm doing this right.", "Not sure what to think, honestly."],
  stressed: ["I hope this is the last one…", "This is getting a bit much.", "I just want to get through today."],
  overwhelmed: ["I can't keep up with all this…", "Please… I just need things to be safe.", "I don't know how much more of this I can take."]
};
function getMoodLine(health) {
  const s = getHealthState(health);
  const pool = MOOD_LINES[s.key] || MOOD_LINES.okay;
  return pool[Math.floor(Math.random() * pool.length)];
}
function updateHealth(empName, isCorrect) {
  const state = employeeTaskStates[empName];
  if (!state) return;
  setHealth(empName, getHealth(empName) + (isCorrect ? 10 : -10));
  if (isCorrect) state.correctCount = (state.correctCount || 0) + 1;
  else state.wrongCount = (state.wrongCount || 0) + 1;
}
function getTotalWrong() {
  let total = 0;
  Object.values(employeeTaskStates).forEach(s => { total += (s.wrongCount || 0); });
  return total;
}
function getFocusStatus() {
  const wrong = getTotalWrong();
  const fired = getFiredEmployeeCount();
  if (fired >= 2 || wrong >= 6) return { label: "CRITICAL", key: "critical" };
  if (wrong >= 3) return { label: "SLIPPING", key: "slipping" };
  if (wrong >= 1) return { label: "DISTRACTED", key: "distracted" };
  return { label: "FOCUSED", key: "focused" };
}

// =========================================================
// RUN STATE (difficulty system)
// =========================================================
const DIFFICULTY_CONFIG = {
  easy:   { key: "easy",   label: "EASY",   answerCap: 5,  timeLimit: 120, hasTimer: true,  autoFailOnWrong: false },
  medium: { key: "medium", label: "MEDIUM", answerCap: 10, timeLimit: 240, hasTimer: true,  autoFailOnWrong: false },
  hard:   { key: "hard",   label: "HARD",   answerCap: 60, timeLimit: 0,   hasTimer: false, autoFailOnWrong: true  }
};

const runState = {
  active: false,
  difficulty: null,      // "easy" | "medium" | "hard"
  config: null,
  answersGiven: 0,
  correctCount: 0,
  wrongCount: 0,
  firedByPlayer: [],     // employee names fired because of a wrong answer
  timeRemaining: 0,
  runEnded: false,
  endedAs: null          // "win" | "fail"
};

function resetRunState() {
  runState.active = false;
  runState.difficulty = null;
  runState.config = null;
  runState.answersGiven = 0;
  runState.correctCount = 0;
  runState.wrongCount = 0;
  runState.firedByPlayer = [];
  runState.timeRemaining = 0;
  runState.runEnded = false;
  runState.endedAs = null;
}

function startRun(difficultyKey) {
  const cfg = DIFFICULTY_CONFIG[difficultyKey];
  if (!cfg) return;
  runState.active = true;
  runState.difficulty = cfg.key;
  runState.config = cfg;
  runState.answersGiven = 0;
  runState.correctCount = 0;
  runState.wrongCount = 0;
  runState.firedByPlayer = [];
  runState.timeRemaining = cfg.timeLimit;
  runState.runEnded = false;
  runState.endedAs = null;
}

function recordAnswer(empName, isCorrect, taskTitle) {
  if (!runState.active || runState.runEnded) return;
  runState.answersGiven++;
  if (isCorrect) runState.correctCount++;
  else {
    runState.wrongCount++;
    // Rule 1b: a wrong answer marks that employee as fired for the end screen
    if (!runState.firedByPlayer.includes(empName)) runState.firedByPlayer.push(empName);
  }
  updateHud();
  // Hard auto-fails on first wrong answer
  if (runState.config.autoFailOnWrong && !isCorrect) {
    endRun("fail", "Wrong decision on Hard difficulty.");
    return;
  }
  // Answer cap reached?
  if (runState.answersGiven >= runState.config.answerCap) {
    if (runState.correctCount === runState.config.answerCap) endRun("win");
    else endRun("fail", "Not all answers were correct.");
    return;
  }
}

function updateRunTimer(deltaTime) {
  if (!runState.active || runState.runEnded) return;
  if (!runState.config.hasTimer) return;
  if (!gameStarted || isPaused || isInspecting) return;
  runState.timeRemaining -= deltaTime;
  if (runState.timeRemaining <= 0) {
    runState.timeRemaining = 0;
    endRun("fail", "Time ran out.");
    return;
  }
  updateHudTimer();
}

function updateHudTimer() {
  if (!runState.config) return;
  if (!runState.config.hasTimer) return;
  const total = runState.config.timeLimit;
  const remaining = Math.max(0, runState.timeRemaining);
  const elapsed = total - remaining;
  if (hudShiftTimeEl) hudShiftTimeEl.textContent = `${formatTimeMmSs(elapsed)} / ${formatTimeMmSs(remaining)}`;
}

function endRun(outcome, reason) {
  if (runState.runEnded) return;
  runState.runEnded = true;
  runState.endedAs = outcome;
  runState.active = false;
  isPaused = false;
  pauseMenuScreenEl.style.display = "none";
  if (isInspecting) closeComputerInspection();
  if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
  rosterSidePanelEl.style.display = "none";
  hideInteractionPrompt();
  clearAllSpeechBubbles();
  clearAllHelpMarkers();
  currentActiveRequest = null;
  showEndScreen(outcome, reason);
}

// =========================================================
// SINGLE ACTIVE TASK SYSTEM
// =========================================================
let currentActiveRequest = null;
let nextTaskCooldown = 0;
const FIRST_REQUEST_DELAY = 3;
const BETWEEN_TASKS_DELAY = 3;
let requestSystemInitialized = false;

function getEligibleEmployeesForTask() {
  return employeeInstances.filter(emp => {
    const name = emp.group.name;
    const state = employeeTaskStates[name];
    if (!state) return false;
    if (state.fired) return false;
    if (state.allTasksCompleted) return false;
    return !!getCurrentTaskForEmployee(name);
  });
}

function getDialogueForTask(task) {
  const pools = {
    mail: ["Hey, can you take a look at this email for me?", "I got this email and I'm not sure if it's real.", "Something feels off about this one. Can you check?"],
    chat: ["Can you check this message I just got?", "Someone messaged me something strange.", "I don't know if I should reply to this person."],
    browser: ["This page just popped up. Is it safe?", "I got sent to this site — can you check it?", "Does this login page look right to you?"],
    security: ["There's a security alert on my machine. Can you check it?", "Windows Defender is showing something odd.", "Something showed up in security centre. Can you look?"]
  };
  const pool = pools[task.type] || ["Hey, can you help me with something?"];
  return pool[Math.floor(Math.random() * pool.length)];
}

function createRequestForEmployee(empInstance, task) {
  const empName = empInstance.group.name;
  const state = employeeTaskStates[empName];
  if (!state || state.fired) return false;
  const dialogue = getDialogueForTask(task);
  currentActiveRequest = {
    employee: empName,
    employeeInstance: empInstance,
    task: task,
    dialogue: dialogue,
    createdAt: performance.now()
  };
  state.hasActiveRequest = true;
  showSpeechBubble(empInstance, dialogue);
  renderRosterSidePanel();
  updateHelpMarkers();
  return true;
}

function tryAssignNextTask() {
  if (currentActiveRequest) return;
  if (!runState.active || runState.runEnded) return;
  const eligible = getEligibleEmployeesForTask();
  if (eligible.length === 0) return;
  const empInstance = eligible[Math.floor(Math.random() * eligible.length)];
  const empName = empInstance.group.name;
  const task = getCurrentTaskForEmployee(empName);
  if (!task) return;
  createRequestForEmployee(empInstance, task);
}

function clearCurrentRequest() {
  if (currentActiveRequest) {
    const state = employeeTaskStates[currentActiveRequest.employee];
    if (state) state.hasActiveRequest = false;
    currentActiveRequest = null;
  }
  renderRosterSidePanel();
  updateHelpMarkers();
}

function getRequestForEmployee(empName) {
  if (currentActiveRequest && currentActiveRequest.employee === empName) return currentActiveRequest;
  return null;
}

function updateRequestTimer(deltaTime) {
  if (!gameStarted || isPaused) return;
  if (runState.runEnded) return;
  if (isInspecting) return;
  if (!requestSystemInitialized) {
    requestSystemInitialized = true;
    nextTaskCooldown = FIRST_REQUEST_DELAY;
    return;
  }
  if (currentActiveRequest) return;
  nextTaskCooldown -= deltaTime;
  if (nextTaskCooldown <= 0) {
    tryAssignNextTask();
    if (currentActiveRequest) nextTaskCooldown = 99999;
    else nextTaskCooldown = 1;
  }
}

function startNextTaskCooldown() {
  nextTaskCooldown = BETWEEN_TASKS_DELAY;
}

// =========================================================
// Speech bubbles / Help markers
// =========================================================
const speechBubbles = new Map();
function showSpeechBubble(empInstance, text, durationMs = 6000) {
  const empName = empInstance.group.name;
  hideSpeechBubble(empName);
  const el = document.createElement("div");
  el.className = "npc-speech-bubble";
  el.textContent = text;
  document.body.appendChild(el);
  speechBubbles.set(empName, { element: el, expiresAt: performance.now() + durationMs });
  updateSpeechBubblePositions();
}
function hideSpeechBubble(empName) {
  const entry = speechBubbles.get(empName);
  if (entry?.element?.parentNode) entry.element.parentNode.removeChild(entry.element);
  speechBubbles.delete(empName);
}
function clearAllSpeechBubbles() {
  speechBubbles.forEach(e => { if (e.element?.parentNode) e.element.parentNode.removeChild(e.element); });
  speechBubbles.clear();
}
const _bubbleVec = new THREE.Vector3();
function updateSpeechBubblePositions() {
  const now = performance.now();
  speechBubbles.forEach((entry, empName) => {
    if (now >= entry.expiresAt) { if (entry.element?.parentNode) entry.element.parentNode.removeChild(entry.element); speechBubbles.delete(empName); return; }
    const emp = employeeInstances.find(e => e.group.name === empName);
    if (!emp || !emp.group.visible) { if (entry.element?.parentNode) entry.element.parentNode.removeChild(entry.element); speechBubbles.delete(empName); return; }
    _bubbleVec.set(emp.group.position.x, emp.group.position.y + 1.5, emp.group.position.z);
    _bubbleVec.project(camera);
    const x = (_bubbleVec.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-_bubbleVec.y * 0.5 + 0.5) * window.innerHeight;
    if (_bubbleVec.z > 1) entry.element.style.display = "none";
    else { entry.element.style.display = "block"; entry.element.style.left = x + "px"; entry.element.style.top = y + "px"; }
  });
}

const helpMarkers = new Map();
function updateHelpMarkers() {
  helpMarkers.forEach((el, empName) => {
    if (!currentActiveRequest || currentActiveRequest.employee !== empName) {
      if (el.parentNode) el.parentNode.removeChild(el);
      helpMarkers.delete(empName);
    }
  });
  if (currentActiveRequest && !helpMarkers.has(currentActiveRequest.employee)) {
    const el = document.createElement("div");
    el.className = "npc-help-marker";
    el.textContent = "HELP";
    document.body.appendChild(el);
    helpMarkers.set(currentActiveRequest.employee, el);
  }
  updateHelpMarkerPositions();
}
const _markerVec = new THREE.Vector3();
function updateHelpMarkerPositions() {
  helpMarkers.forEach((el, empName) => {
    const emp = employeeInstances.find(e => e.group.name === empName);
    if (!emp || !emp.group.visible) { el.style.display = "none"; return; }
    _markerVec.set(emp.group.position.x, emp.group.position.y + 1.85, emp.group.position.z);
    _markerVec.project(camera);
    const x = (_markerVec.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-_markerVec.y * 0.5 + 0.5) * window.innerHeight;
    if (_markerVec.z > 1) el.style.display = "none";
    else { el.style.display = "block"; el.style.left = x + "px"; el.style.top = y + "px"; }
  });
}
function clearAllHelpMarkers() {
  helpMarkers.forEach(el => { if (el.parentNode) el.parentNode.removeChild(el); });
  helpMarkers.clear();
}

// =========================================================
// Roster side panel
// =========================================================
const rosterSidePanelEl = document.getElementById("roster-side-panel");
const rosterSideListEl = document.getElementById("roster-side-list");
const rosterCardBtnEl = document.getElementById("roster-card-btn");
const rosterCloseBtnEl = document.getElementById("roster-close-btn");
const rspStaffValEl = document.getElementById("rsp-staff-val");
const rspFiredValEl = document.getElementById("rsp-fired-val");
const rspTaskValEl = document.getElementById("rsp-task-val");
const rspMiniProgressFillEl = document.getElementById("rsp-mini-progress-fill");
let rosterExpanded = false;

function renderRosterSidePanel() {
  if (!rosterSidePanelEl) return;
  if (!rosterExpanded) { rosterSidePanelEl.style.display = "none"; return; }
  rosterSidePanelEl.style.display = "flex";
  const firedCount = getFiredEmployeeCount();
  const activeCount = 12 - firedCount;
  const cap = runState.config ? runState.config.answerCap : 5;
  if (rspStaffValEl) rspStaffValEl.textContent = `${activeCount}/12 (A)`;
  if (rspFiredValEl) rspFiredValEl.textContent = `${firedCount}`;
  if (rspTaskValEl) rspTaskValEl.textContent = `${runState.answersGiven}/${cap}`;
  if (rspMiniProgressFillEl) rspMiniProgressFillEl.style.width = `${Math.min(100, (runState.answersGiven / cap) * 100)}%`;
  rosterSideListEl.innerHTML = "";
  Object.keys(employeeTaskStates).sort().forEach(name => {
    const state = employeeTaskStates[name];
    if (!state) return;
    const health = state.fired ? 0 : getHealth(name);
    const healthState = getHealthState(health);
    const currentTask = getCurrentTaskForEmployee(name);
    const hasTask = currentActiveRequest && currentActiveRequest.employee === name;
    const row = document.createElement("div");
    row.className = "rsp-row";
    if (state.fired) row.classList.add("rsp-row-fired");
    if (hasTask) row.classList.add("rsp-row-has-task");
    const statusText = state.fired ? "⛔ REMOVED" : `${healthState.emoji} ${healthState.label}`;
    const statusClass = state.fired ? "status-removed" : `status-${healthState.key}`;
    const healthClass = health < 20 ? "health-critical" : (health < 50 ? "health-low" : "");
    let taskText;
    if (state.fired) taskText = `<span class="rsp-row-task-none">— removed —</span>`;
    else if (hasTask && currentTask) {
      const progress = getTaskProgress(name);
      taskText = `<span class="rsp-row-task-app">${getApplicationDisplayName(currentTask)}</span> Task ${progress.current}/${progress.total}`;
    } else if (currentTask) {
      const progress = getTaskProgress(name);
      taskText = `<span class="rsp-row-task-app">${getApplicationDisplayName(currentTask)}</span> Task ${progress.current}/${progress.total}`;
    } else if (state.allTasksCompleted) taskText = `<span class="rsp-row-task-none">All tasks done</span>`;
    else taskText = `<span class="rsp-row-task-none">No active task</span>`;
    row.innerHTML = `
      <div class="rsp-row-name">${name}</div>
      <div class="rsp-row-status ${statusClass}">${statusText}</div>
      <div class="rsp-row-health">
        <div class="rsp-row-health-bar"><div class="rsp-row-health-fill ${healthClass}" style="width:${health}%"></div></div>
        <div class="rsp-row-health-num">${health}/100</div>
      </div>
      <div class="rsp-row-task">${taskText}</div>
    `;
    row.addEventListener("click", () => openEmployeeDetail(name));
    rosterSideListEl.appendChild(row);
  });
}
rosterCardBtnEl.addEventListener("click", () => { rosterExpanded = !rosterExpanded; renderRosterSidePanel(); });
rosterCloseBtnEl.addEventListener("click", () => { rosterExpanded = false; renderRosterSidePanel(); });

// =========================================================
// Employee detail
// =========================================================
const employeeDetailOverlayEl = document.getElementById("employee-detail-overlay");
const employeeDetailNameEl = document.getElementById("employee-detail-name");
const employeeDetailStatusEl = document.getElementById("employee-detail-status");
const employeeDetailHealthEl = document.getElementById("employee-detail-health");
const employeeDetailHealthBarEl = document.getElementById("employee-detail-healthbar");
const employeeDetailStrikesEl = document.getElementById("employee-detail-strikes");
const employeeDetailTasksEl = document.getElementById("employee-detail-tasks");
const employeeDetailCorrectEl = document.getElementById("employee-detail-correct");
const employeeDetailWrongEl = document.getElementById("employee-detail-wrong");
const employeeDetailMoodTextEl = document.getElementById("employee-detail-mood-text");
const employeeDetailHistoryEl = document.getElementById("employee-detail-history");
const employeeDetailCloseBtn = document.getElementById("employee-detail-close-btn");
const employeeDetailCloseBtn2 = document.getElementById("employee-detail-close-btn-2");
const employeeDetailLocateBtn = document.getElementById("employee-detail-locate-btn");
let employeeDetailCurrentName = null;

function openEmployeeDetail(empName) {
  const state = employeeTaskStates[empName];
  if (!state) return;
  employeeDetailCurrentName = empName;
  const health = state.fired ? 0 : getHealth(empName);
  const healthState = getHealthState(health);
  const strikes = getStrikes(empName);
  const progress = getTaskProgress(empName);
  employeeDetailNameEl.textContent = empName.toUpperCase();
  if (state.fired) {
    employeeDetailStatusEl.textContent = "⛔ REMOVED";
    employeeDetailHealthEl.textContent = `0 / 100`;
    employeeDetailHealthBarEl.style.width = "0%";
    employeeDetailHealthBarEl.classList.add("health-critical");
  } else {
    employeeDetailStatusEl.textContent = `${healthState.emoji} ${healthState.label}`;
    employeeDetailHealthEl.textContent = `${health} / 100`;
    employeeDetailHealthBarEl.style.width = `${health}%`;
    employeeDetailHealthBarEl.classList.remove("health-low", "health-critical");
    if (health < 20) employeeDetailHealthBarEl.classList.add("health-critical");
    else if (health < 50) employeeDetailHealthBarEl.classList.add("health-low");
  }
  employeeDetailStrikesEl.textContent = `${strikes} / 3`;
  employeeDetailTasksEl.textContent = `${Math.min(state.currentTaskIndex, 5)} / 5`;
  employeeDetailCorrectEl.textContent = `${state.correctCount || 0}`;
  employeeDetailWrongEl.textContent = `${state.wrongCount || 0}`;
  employeeDetailMoodTextEl.textContent = `"${getMoodLine(health)}"`;
  employeeDetailHistoryEl.innerHTML = "";
  if (!state.history || state.history.length === 0) {
    employeeDetailHistoryEl.innerHTML = '<div class="employee-detail-history-empty">No tasks done yet.</div>';
  } else {
    [...state.history].reverse().forEach(h => {
      const entry = document.createElement("div");
      entry.className = "employee-detail-history-entry " + (h.result === "correct" ? "entry-correct" : "entry-wrong");
      entry.innerHTML = `
        <div class="employee-detail-history-top">
          <span class="employee-detail-history-title-text">${h.taskTitle}</span>
          <span class="employee-detail-history-app">${h.appName}</span>
        </div>
        <div class="employee-detail-history-dialogue">"${h.dialogue}"</div>
        <div class="employee-detail-history-result ${h.result === "correct" ? "result-correct" : "result-wrong"}">
          ${h.result === "correct" ? "✓ You answered correctly" : "✗ You answered incorrectly"}
        </div>
      `;
      employeeDetailHistoryEl.appendChild(entry);
    });
  }
  employeeDetailOverlayEl.classList.add("active");
  employeeDetailOverlayEl.style.display = "flex";
}
function closeEmployeeDetail() {
  employeeDetailOverlayEl.classList.remove("active");
  employeeDetailOverlayEl.style.display = "none";
  employeeDetailCurrentName = null;
}
employeeDetailCloseBtn.addEventListener("click", closeEmployeeDetail);
employeeDetailCloseBtn2.addEventListener("click", closeEmployeeDetail);

const locateHighlights = new Map();
employeeDetailLocateBtn.addEventListener("click", () => {
  if (!employeeDetailCurrentName) return;
  const emp = employeeInstances.find(e => e.group.name === employeeDetailCurrentName);
  if (!emp || !emp.group.visible) return;
  const meshes = [];
  emp.group.traverse(child => {
    if (child.isMesh && child.material?.emissive) {
      meshes.push({ mesh: child, prevEmissive: child.material.emissive.getHex() });
      child.material.emissive.setHex(0x06b6d4);
    }
  });
  const prior = locateHighlights.get(employeeDetailCurrentName);
  if (prior) clearTimeout(prior);
  const timer = setTimeout(() => {
    meshes.forEach(({ mesh, prevEmissive }) => {
      if (mesh.material?.emissive) mesh.material.emissive.setHex(prevEmissive);
    });
    locateHighlights.delete(employeeDetailCurrentName);
  }, 2000);
  locateHighlights.set(employeeDetailCurrentName, timer);
});

// Reaction bubbles
const POSITIVE_REACTIONS = ["Thanks! That was really helpful.", "Good catch. I wasn't sure.", "Nice work — glad I checked with you.", "Thanks for spotting that.", "Great, that clears it up."];
const NEGATIVE_REACTIONS = ["Oh... I didn't realize that could be dangerous.", "I'm not sure that was the safest choice.", "That doesn't seem right. I should contact IT.", "Okay... I'll be more careful next time.", "That could have caused a problem."];
function showReactionBubble(empName, isCorrect) {
  const emp = employeeInstances.find(e => e.group.name === empName);
  if (!emp || !emp.group.visible) return;
  const pool = isCorrect ? POSITIVE_REACTIONS : NEGATIVE_REACTIONS;
  showSpeechBubble(emp, pool[Math.floor(Math.random() * pool.length)], 7000);
}

// =========================================================
// Firing
// =========================================================
const firedEmployees = new Set();
let pendingConsequence = null;
const consequenceOverlayEl = document.getElementById("consequence-overlay");
const consequenceTitleEl = document.getElementById("consequence-title");
const consequenceBodyEl = document.getElementById("consequence-body");
const consequenceStrikesEl = document.getElementById("consequence-strikes");
const consequenceContinueBtn = document.getElementById("consequence-continue-btn");

function fireEmployee(empName, byPlayer = false) {
  const state = employeeTaskStates[empName];
  if (!state) return;
  if (state.fired) return;
  state.fired = true;
  state.health = 0;
  state.hasActiveRequest = false;
  if (byPlayer) state.firedByPlayer = true;
  firedEmployees.add(empName);

  const empInstance = employeeInstances.find(e => e.group && e.group.name === empName);
  if (empInstance) {
    empInstance.group.visible = false;
    setEmployeeHighlight(empInstance, false);
  }
  if (currentActiveRequest && currentActiveRequest.employee === empName) {
    clearCurrentRequest();
    startNextTaskCooldown();
  }
  hideSpeechBubble(empName);
  const marker = helpMarkers.get(empName);
  if (marker) {
    if (marker.parentNode) marker.parentNode.removeChild(marker);
    helpMarkers.delete(empName);
  }
  if (nearbyEmployee?.group.name === empName) {
    nearbyEmployee = null;
    hideInteractionPrompt();
  }
  if (inspectedEmployee?.group.name === empName) {
    const existing = workstationMainPanelEl.querySelector(".workstation-fired-notice");
    if (!existing) {
      const notice = document.createElement("div");
      notice.className = "workstation-fired-notice";
      notice.textContent = "VACANT";
      workstationMainPanelEl.appendChild(notice);
    }
  }
  updateHud();
  renderRosterSidePanel();
}

// Strikes now fire the employee silently (no HR escalation, no modal) so the run continues.
function processStrikeConsequence(empName, newStrikeCount) {
  const state = employeeTaskStates[empName];
  if (!state || newStrikeCount < 1 || newStrikeCount > 3) return;
  if (state.fired && newStrikeCount === 3) return;
  if (newStrikeCount === 3) {
    fireEmployee(empName, false);
  }
}
consequenceContinueBtn.addEventListener("click", () => {
  const consequence = pendingConsequence;
  pendingConsequence = null;
  consequenceOverlayEl.classList.remove("active");
  consequenceOverlayEl.style.display = "none";
  if (!consequence) return;
  if (consequence.fired && inspectedEmployee?.group.name === consequence.empName) {
    closeComputerInspection();
    return;
  }
});

// =========================================================
// Player movement
// =========================================================
const EYE_HEIGHT = 1.7, PLAYER_RADIUS = 0.3, MOVE_SPEED = 4.5, MOUSE_SENSITIVITY = 0.0022, MAX_PITCH = Math.PI / 2 - 0.05;
let yaw = 0, pitch = 0;
const playerPos = { x: 0, z: 10 };
let isInspecting = false;
const keysPressed = {};
window.addEventListener("keydown", e => { keysPressed[e.code] = true; });
window.addEventListener("keyup", e => { keysPressed[e.code] = false; });
renderer.domElement.addEventListener("click", () => {
  if (runState.runEnded || shiftComplete) return;
  renderer.domElement.requestPointerLock();
});
document.addEventListener("mousemove", e => {
  if (isInspecting || isPaused) return;
  if (runState.runEnded || shiftComplete) return;
  if (document.pointerLockElement !== renderer.domElement) return;
  yaw -= e.movementX * MOUSE_SENSITIVITY;
  pitch -= e.movementY * MOUSE_SENSITIVITY;
  pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch));
});
function checkCollision(x, z) {
  for (let i = 0; i < colliders.length; i++) {
    const c = colliders[i];
    if (c.maxY < 0.05 || c.minY > EYE_HEIGHT) continue;
    const closestX = Math.max(c.minX, Math.min(x, c.maxX));
    const closestZ = Math.max(c.minZ, Math.min(z, c.maxZ));
    const dx = x - closestX, dz = z - closestZ;
    if (dx * dx + dz * dz < PLAYER_RADIUS * PLAYER_RADIUS) return true;
  }
  return false;
}
function updatePlayer(deltaTime) {
  const forward = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
  const right = { x: Math.cos(yaw), z: -Math.sin(yaw) };
  let moveX = 0, moveZ = 0;
  if (keysPressed["KeyW"]) { moveX += forward.x; moveZ += forward.z; }
  if (keysPressed["KeyS"]) { moveX -= forward.x; moveZ -= forward.z; }
  if (keysPressed["KeyD"]) { moveX += right.x; moveZ += right.z; }
  if (keysPressed["KeyA"]) { moveX -= right.x; moveZ -= right.z; }
  const len = Math.hypot(moveX, moveZ);
  if (len > 0) {
    moveX = (moveX / len) * MOVE_SPEED * deltaTime;
    moveZ = (moveZ / len) * MOVE_SPEED * deltaTime;
    const cx = playerPos.x + moveX;
    if (!checkCollision(cx, playerPos.z)) playerPos.x = cx;
    const cz = playerPos.z + moveZ;
    if (!checkCollision(playerPos.x, cz)) playerPos.z = cz;
  }
  camera.position.set(playerPos.x, EYE_HEIGHT, playerPos.z);
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
}

const interactionDistance = 2.5;
let nearbyEmployee = null;
const interactionPromptEl = document.getElementById("interaction-prompt");
function showInteractionPrompt(text) { interactionPromptEl.textContent = text || "Press E to interact"; interactionPromptEl.style.display = "block"; }
function hideInteractionPrompt() { interactionPromptEl.style.display = "none"; }
function setEmployeeHighlight(emp, on) {
  if (!emp) return;
  emp.group.traverse(child => {
    if (child.isMesh && child.material?.emissive) child.material.emissive.setHex(on ? 0x3a4a5c : 0x000000);
  });
}
function updateEmployeeInteraction() {
  let closest = null, closestDist = Infinity;
  employeeInstances.forEach(emp => {
    if (!emp.group.visible) return;
    if (isEmployeeFired(emp.group.name)) return;
    const dist = Math.hypot(playerPos.x - emp.group.position.x, playerPos.z - emp.group.position.z);
    if (dist <= interactionDistance && dist < closestDist) { closest = emp; closestDist = dist; }
  });
  if (closest !== nearbyEmployee) {
    setEmployeeHighlight(nearbyEmployee, false);
    setEmployeeHighlight(closest, true);
    nearbyEmployee = closest;
  }
  if (nearbyEmployee) {
    const name = nearbyEmployee.group.name;
    showInteractionPrompt(getRequestForEmployee(name) ? `Press E to help ${name}` : "Press E to interact");
  } else hideInteractionPrompt();
}
window.addEventListener("keydown", e => {
  if (e.code === "KeyE" && nearbyEmployee && !isInspecting && !isPaused && !runState.runEnded && !shiftComplete) {
    openComputerInspection(nearbyEmployee);
  }
});

// =========================================================
// Workstation
// =========================================================
let inspectedEmployee = null;
const workstationOverlayEl = document.getElementById("workstation-overlay");
const workstationMainPanelEl = document.getElementById("workstation-main-panel");
const workstationEmployeeNameEl = document.getElementById("workstation-employee-name");
const workstationAppMessageEl = document.getElementById("workstation-app-message");
const workstationTaskBarEl = document.getElementById("workstation-task-bar");
const workstationExitBtn = document.getElementById("workstation-exit-btn");
const workstationAppButtons = document.querySelectorAll(".workstation-app-btn");
const desktopInertIcons = document.querySelectorAll(".desktop-icon-inert");
const bootScreenEl = document.getElementById("boot-screen");
const taskbarAppsEl = document.getElementById("taskbar-apps");
const taskbarClockEl = document.getElementById("taskbar-clock");
const securityPanelEl = document.getElementById("security-panel");
let uiState = "workstation";
let isBooting = false;
let bootTimeoutId = null;

function setTaskbarApp(name) { taskbarAppsEl.innerHTML = name ? `<span class="taskbar-app-indicator">${name}</span>` : ""; }
function updateTaskbarClock() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const suffix = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  taskbarClockEl.textContent = `${hours}:${minutes} ${suffix}`;
}
updateTaskbarClock();
setInterval(updateTaskbarClock, 15000);

function renderWorkstationTaskBar() {
  if (!inspectedEmployee) { workstationTaskBarEl.style.display = "none"; return; }
  if (uiState !== "workstation" || isBooting) { workstationTaskBarEl.style.display = "none"; return; }

  const empName = inspectedEmployee.group.name;
  const state = employeeTaskStates[empName];
  if (!state) { workstationTaskBarEl.style.display = "none"; return; }

  if (state.fired) {
    workstationAppMessageEl.textContent = `⛔ Employee removed — workstation vacant`;
    workstationTaskBarEl.style.display = "none";
    return;
  }

  const progress = getTaskProgress(empName);
  if (progress.allCompleted) {
    workstationAppMessageEl.textContent = `✅ All tasks for ${empName} are complete.`;
    workstationTaskBarEl.style.display = "none";
    return;
  }

  if (state.currentOpenTaskId && state.completedTaskIds.includes(state.currentOpenTaskId)) {
    workstationAppMessageEl.textContent = `✓ Task complete — return to the desktop and close this PC.`;
    workstationTaskBarEl.style.display = "none";
    return;
  }

  const currentTask = getCurrentTaskForEmployee(empName);
  if (!currentTask) {
    workstationAppMessageEl.textContent = "";
    workstationTaskBarEl.style.display = "none";
    return;
  }

  const appName = getApplicationDisplayName(currentTask);
  const diffLabel = getDifficultyLabel(currentTask);
  const diffClass = getDifficultyClass(currentTask);
  const strikes = getStrikes(empName);

  workstationAppMessageEl.textContent = "";
  workstationTaskBarEl.style.display = "flex";
  const strikesHtml = strikes > 0 ? `<span class="ws-task-sep">|</span><span class="ws-task-strikes">⚠️ Strikes: ${strikes}/3</span>` : "";
  workstationTaskBarEl.innerHTML = `
    <span class="ws-task-emp">👤 ${empName}</span>
    <span class="ws-task-sep">|</span>
    <span class="ws-task-count">📋 Task ${progress.current} of ${progress.total}</span>
    <span class="ws-task-sep">|</span>
    <span class="ws-task-hint">🖥️ Check the</span>
    <span class="ws-task-app">${appName}</span>
    <span class="ws-task-sep">|</span>
    <span class="${diffClass}">🎯 Difficulty: ${diffLabel}</span>
    ${strikesHtml}
  `;

  state.currentOpenTaskId = currentTask.id;
  const strikeMsg = strikes > 0 ? ` ⚠️ Strikes: ${strikes}/3` : "";
  workstationEmployeeNameEl.textContent = `${empName}${strikeMsg}`;
}

function openComputerInspection(employee) {
  if (!employee || isEmployeeFired(employee.group.name)) return;
  if (runState.runEnded) return;
  inspectedEmployee = employee;
  isInspecting = true; isBooting = true; uiState = "workstation";
  const empName = employee.group.name;
  const state = employeeTaskStates[empName];
  if (state) state.currentOpenTaskId = null;
  workstationEmployeeNameEl.textContent = empName;
  workstationAppMessageEl.textContent = "";
  workstationTaskBarEl.style.display = "none";
  setTaskbarApp(null);
  const oldNotice = workstationMainPanelEl.querySelector(".workstation-fired-notice");
  if (oldNotice) oldNotice.remove();
  workstationMainPanelEl.style.display = "none";
  mailPanelEl.style.display = "none";
  chatPanelEl.style.display = "none";
  browserPanelEl.style.display = "none";
  securityPanelEl.style.display = "none";
  bootScreenEl.style.display = "flex";
  workstationOverlayEl.style.display = "flex";
  if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
  hideInteractionPrompt();
  if (bootTimeoutId) clearTimeout(bootTimeoutId);
  bootTimeoutId = setTimeout(() => {
    if (runState.runEnded) { closeComputerInspection(); return; }
    bootScreenEl.style.display = "none";
    workstationMainPanelEl.style.display = "flex";
    isBooting = false;
    renderWorkstationTaskBar();
  }, 1000);
}

function closeComputerInspection() {
  const empName = inspectedEmployee ? inspectedEmployee.group.name : null;
  isInspecting = false; isBooting = false;
  if (bootTimeoutId) { clearTimeout(bootTimeoutId); bootTimeoutId = null; }
  uiState = "workstation";
  workstationOverlayEl.style.display = "none";
  bootScreenEl.style.display = "none";
  workstationTaskBarEl.style.display = "none";
  const notice = workstationMainPanelEl.querySelector(".workstation-fired-notice");
  if (notice) notice.remove();

  let shouldStartCooldown = false;
  if (empName) {
    const state = employeeTaskStates[empName];
    if (state && state.currentOpenTaskId && state.completedTaskIds.includes(state.currentOpenTaskId)) {
      shouldStartCooldown = true;
      state.currentOpenTaskId = null;
    }
  }
  inspectedEmployee = null;
  renderRosterSidePanel();

  if (shouldStartCooldown) {
    clearCurrentRequest();
    startNextTaskCooldown();
  }

  if (!runState.runEnded && !shiftComplete) renderer.domElement.requestPointerLock();
}
workstationExitBtn.addEventListener("click", closeComputerInspection);
desktopInertIcons.forEach(btn => btn.addEventListener("click", () => { workstationAppMessageEl.textContent = "This application is unavailable in the simulation."; }));

const appCloseHandlers = {
  mail: () => closeMailToWorkstation(),
  chat: () => closeChatToWorkstation(),
  browser: () => closeBrowserToWorkstation(),
  security: () => closeSecurityToWorkstation(),
};
document.querySelectorAll("[data-close-target]").forEach(btn => {
  btn.addEventListener("click", () => {
    const h = appCloseHandlers[btn.dataset.closeTarget];
    if (h) h();
  });
});
document.querySelectorAll("[data-maximize-target]").forEach(btn => {
  btn.addEventListener("click", () => {
    const panel = document.getElementById(btn.dataset.maximizeTarget);
    if (panel) panel.classList.toggle("app-window-maximized");
  });
});

workstationAppButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    if (inspectedEmployee) {
      const empName = inspectedEmployee.group.name;
      if (isEmployeeFired(empName)) { renderWorkstationTaskBar(); return; }
      const state = employeeTaskStates[empName];
      const progress = getTaskProgress(empName);
      if (progress.allCompleted || (state?.currentOpenTaskId && state.completedTaskIds.includes(state.currentOpenTaskId))) {
        renderWorkstationTaskBar();
        return;
      }
    }
    if (btn.dataset.app === "MAIL") openMail();
    else if (btn.dataset.app === "CHAT") openChat();
    else if (btn.dataset.app === "BROWSER") openBrowser();
    else if (btn.dataset.app === "SECURITY") openSecurityCentre();
  });
});

// ============ MAIL ============
const mailPanelEl = document.getElementById("mail-panel");
const mailInboxViewEl = document.getElementById("mail-inbox-view");
const mailEmailViewEl = document.getElementById("mail-email-view");
const mailResultViewEl = document.getElementById("mail-result-view");
const mailItemBtn = document.getElementById("mail-item");
const mailBackBtn = document.getElementById("mail-back-btn");
const mailRowAvatarEl = document.getElementById("mail-row-avatar");
const mailRowSenderEl = document.getElementById("mail-row-sender");
const mailRowSubjectEl = document.getElementById("mail-row-subject");
const mailRowPreviewEl = document.getElementById("mail-row-preview");
const mailRowTimeEl = document.getElementById("mail-row-time");
const mailEmailSubjectEl = document.getElementById("mail-email-subject-el");
const mailEmailAvatarEl = document.getElementById("mail-email-avatar");
const mailEmailSenderNameEl = document.getElementById("mail-email-sender-name");
const mailEmailSenderChipEl = document.getElementById("mail-email-sender-chip");
const mailEmailRecipientEl = document.getElementById("mail-email-recipient");
const mailEmailTimeEl = document.getElementById("mail-email-time");
const mailEmailBodyEl = document.getElementById("mail-email-body-el");
const mailSenderDetailsEl = document.getElementById("mail-sender-details");
const mailDetailFromEl = document.getElementById("mail-detail-from");
const mailDetailReplyToEl = document.getElementById("mail-detail-replyto");
const mailDetailReturnPathEl = document.getElementById("mail-detail-returnpath");
const mailDetailSpfEl = document.getElementById("mail-detail-spf");
const mailDetailDkimEl = document.getElementById("mail-detail-dkim");
const mailDetailOriginEl = document.getElementById("mail-detail-origin");
const mailReportBtn = document.getElementById("mail-report-btn");
const mailOpenLinkBtn = document.getElementById("mail-open-link-btn");
const mailResultTitleEl = document.getElementById("mail-result-title");
const mailResultBodyEl = document.getElementById("mail-result-body");
const mailContinueBtn = document.getElementById("mail-continue-btn");
const mailBackToInboxBtn = document.getElementById("mail-back-to-inbox-btn");
const mailComposeBtn = document.getElementById("mail-compose-btn");
const mailComposeMessageEl = document.getElementById("mail-compose-message");
const mailRefreshBtn = document.getElementById("mail-refresh-btn");
let mailSenderRevealed = false;

function showMailView(view) {
  mailInboxViewEl.style.display = view === "inbox" ? "flex" : "none";
  mailEmailViewEl.style.display = view === "email" ? "flex" : "none";
  mailResultViewEl.style.display = view === "result" ? "flex" : "none";
}
function populateMailInboxRow(task) {
  if (!task) return;
  mailRowAvatarEl.textContent = task.senderAvatar || "??";
  mailRowSenderEl.textContent = task.senderName || "Unknown Sender";
  mailRowSubjectEl.textContent = task.subject || task.title || "(no subject)";
  mailRowPreviewEl.textContent = "— " + (task.preview || "Open to read");
  mailRowTimeEl.textContent = task.time || "09:42";
}
function populateMailEmailView(task) {
  if (!task) return;
  mailSenderRevealed = false;
  mailSenderDetailsEl.style.display = "none";
  mailEmailSubjectEl.textContent = task.subject || task.title || "(no subject)";
  mailEmailAvatarEl.textContent = task.senderAvatar || "??";
  mailEmailSenderNameEl.textContent = task.senderName || "Unknown Sender";
  mailEmailSenderChipEl.textContent = task.senderChip?.text || "";
  mailEmailSenderChipEl.className = "mail-sender-chip " + (task.senderChip?.class || "");
  mailEmailRecipientEl.textContent = task.recipient || (inspectedEmployee ? inspectedEmployee.group.name : "Employee01");
  mailEmailTimeEl.textContent = task.time || "09:42";
  mailEmailBodyEl.innerHTML = (task.bodyHtml || "").replace(/\n/g, "<br/>");
  const sd = task.senderDetails || {};
  mailDetailFromEl.textContent = sd.from || "—";
  mailDetailReplyToEl.textContent = sd.replyTo || "—";
  mailDetailReturnPathEl.textContent = sd.returnPath || "—";
  mailDetailSpfEl.textContent = sd.spf || "—";
  mailDetailDkimEl.textContent = sd.dkim || "—";
  mailDetailOriginEl.textContent = sd.origin || "—";
  mailDetailSpfEl.className = "mail-sender-details-value " + (sd.spf?.startsWith("PASS") ? "val-good" : "val-bad");
  mailDetailDkimEl.className = "mail-sender-details-value " + (sd.dkim?.startsWith("PASS") ? "val-good" : "val-bad");
}
function openMail() {
  uiState = "mail-inbox";
  workstationMainPanelEl.style.display = "none";
  mailPanelEl.style.display = "flex";
  setTaskbarApp("Mail");
  mailComposeMessageEl.textContent = "";
  showMailView("inbox");
  workstationTaskBarEl.style.display = "none";
  if (inspectedEmployee) {
    const currentTask = getCurrentTaskForEmployee(inspectedEmployee.group.name);
    if (currentTask?.type === "mail") populateMailInboxRow(currentTask);
  }
}
function closeMailToWorkstation() {
  uiState = "workstation";
  mailPanelEl.style.display = "none";
  workstationMainPanelEl.style.display = "flex";
  setTaskbarApp(null);
  renderWorkstationTaskBar();
}
function openEmail() {
  uiState = "mail-email";
  if (inspectedEmployee) {
    const currentTask = getCurrentTaskForEmployee(inspectedEmployee.group.name);
    if (currentTask?.type === "mail") populateMailEmailView(currentTask);
  }
  showMailView("email");
  workstationTaskBarEl.style.display = "none";
}
mailEmailSenderNameEl.addEventListener("click", () => {
  mailSenderRevealed = !mailSenderRevealed;
  mailSenderDetailsEl.style.display = mailSenderRevealed ? "block" : "none";
});
mailEmailAvatarEl.addEventListener("click", () => {
  mailSenderRevealed = !mailSenderRevealed;
  mailSenderDetailsEl.style.display = mailSenderRevealed ? "block" : "none";
});
function getDialogueForCurrentTask(empName) {
  const req = getRequestForEmployee(empName);
  if (req?.dialogue) return req.dialogue;
  const state = employeeTaskStates[empName];
  if (state && state.history.length > 0) return state.history[state.history.length - 1].dialogue;
  return "Hey, can you check this for me?";
}
function handleGenericTaskCompletion(empName, isCorrect, currentTask, dialogue, appLabel) {
  const state = employeeTaskStates[empName];
  if (!state) return;
  completeCurrentTaskForEmployee(empName);
  if (!isCorrect) {
    const newStrikes = addStrike(empName);
    if (typeof newStrikes === "number" && newStrikes > 0) processStrikeConsequence(empName, newStrikes);
  }
  updateHealth(empName, isCorrect);
  state.lastTaskTitle = currentTask ? currentTask.title : null;
  state.lastReaction = isCorrect ? "correct" : "incorrect";
  state.history.push({
    taskTitle: currentTask ? currentTask.title : "Task",
    appName: appLabel || (currentTask ? getApplicationDisplayName(currentTask) : "APP"),
    dialogue: dialogue || "—",
    result: isCorrect ? "correct" : "incorrect"
  });
  renderRosterSidePanel();
  setTimeout(() => showReactionBubble(empName, isCorrect), 400);
  // Record answer in runState (may end the run)
  recordAnswer(empName, isCorrect, currentTask ? currentTask.title : "Task");
}
function showMailResult(decision) {
  if (runState.runEnded) return;
  uiState = "mail-result";
  let isCorrect = false, taskForCompletion = null, dialogue = "—";
  if (inspectedEmployee) {
    const empName = inspectedEmployee.group.name;
    if (isEmployeeFired(empName)) { showMailView("inbox"); return; }
    const currentTask = getCurrentTaskForEmployee(empName);
    if (currentTask?.type === "mail") {
      taskForCompletion = currentTask;
      isCorrect = decision === currentTask.correctDecision;
      dialogue = getDialogueForCurrentTask(empName);
    }
  }
  if (inspectedEmployee && taskForCompletion) {
    const empName = inspectedEmployee.group.name;
    const state = employeeTaskStates[empName];
    const progress = getTaskProgress(empName);
    if (isTaskFromSystem(taskForCompletion) && !progress.allCompleted) {
      if (!state.completedTaskIds.includes(taskForCompletion.id)) {
        handleGenericTaskCompletion(empName, isCorrect, taskForCompletion, dialogue, "MAIL");
      }
    }
  }
  if (isCorrect) {
    mailResultTitleEl.textContent = "✓ GOOD DECISION";
    mailResultTitleEl.className = "mail-result-title mail-result-good";
    mailResultBodyEl.innerHTML = (taskForCompletion?.correctFeedback || "Correct.").replace(/\n/g, "<br/>");
  } else {
    mailResultTitleEl.textContent = "⚠ UNSAFE DECISION";
    mailResultTitleEl.className = "mail-result-title mail-result-bad";
    mailResultBodyEl.innerHTML = (taskForCompletion?.incorrectFeedback || "Unsafe decision.").replace(/\n/g, "<br/>");
  }
  showMailView("result");
  workstationTaskBarEl.style.display = "none";
}
mailItemBtn.addEventListener("click", openEmail);
mailBackBtn.addEventListener("click", closeMailToWorkstation);
mailBackToInboxBtn.addEventListener("click", () => { uiState = "mail-inbox"; showMailView("inbox"); });
mailComposeBtn.addEventListener("click", () => { mailComposeMessageEl.textContent = "Compose is unavailable in this simulation."; });
mailRefreshBtn.addEventListener("click", () => { mailRefreshBtn.classList.add("gmail-spin"); setTimeout(() => mailRefreshBtn.classList.remove("gmail-spin"), 500); });
mailReportBtn.addEventListener("click", () => showMailResult("report"));
mailOpenLinkBtn.addEventListener("click", () => showMailResult("open"));
mailContinueBtn.addEventListener("click", () => {
  const empName = inspectedEmployee ? inspectedEmployee.group.name : null;
  const state = empName ? employeeTaskStates[empName] : null;
  const done = state?.currentOpenTaskId && state.completedTaskIds.includes(state.currentOpenTaskId);
  if (done || (inspectedEmployee && getTaskProgress(inspectedEmployee.group.name).allCompleted)) closeMailToWorkstation();
  else { uiState = "mail-inbox"; showMailView("inbox"); }
});

// ============ CHAT ============
const chatPanelEl = document.getElementById("chat-panel");
const chatMainViewEl = document.getElementById("chat-main-view");
const chatConversationViewEl = document.getElementById("chat-conversation-view");
const chatResultViewEl = document.getElementById("chat-result-view");
const chatEmployeeNameEl = document.getElementById("chat-employee-name");
const chatContactListEl = document.getElementById("chat-contact-list");
const chatBackBtn = document.getElementById("chat-back-btn");
const chatConversationBackBtn = document.getElementById("chat-conversation-back-btn");
const chatConversationNameEl = document.getElementById("chat-conversation-name");
const chatConversationStatusEl = document.getElementById("chat-conversation-status");
const chatMessageAreaEl = document.getElementById("chat-message-area");
const chatResultTitleEl = document.getElementById("chat-result-title");
const chatResultBodyEl = document.getElementById("chat-result-body");
const chatContinueBtn = document.getElementById("chat-continue-btn");

function showChatView(view) {
  chatMainViewEl.style.display = view === "main" ? "flex" : "none";
  chatConversationViewEl.style.display = view === "conversation" ? "flex" : "none";
  chatResultViewEl.style.display = view === "result" ? "flex" : "none";
}
function renderChatContacts(task) {
  chatContactListEl.innerHTML = "";
  if (!task) {
    chatContactListEl.innerHTML = '<div style="font-size:12px;color:#6b7280;padding:8px;">No contacts.</div>';
    return;
  }
  const btn = document.createElement("button");
  btn.className = "mail-item";
  btn.innerHTML = `
    <span class="avatar-circle">${(task.senderAvatar || "?")}</span>
    <div class="mail-item-text">
      <div class="mail-item-subject">${task.chatContactName || "Unknown"}</div>
      <div class="mail-item-preview">${task.preview || ""}</div>
    </div>
    <span class="mail-unread-badge">1</span>
  `;
  btn.addEventListener("click", () => openChatConversation(task));
  chatContactListEl.appendChild(btn);
}
function openChat() {
  uiState = "chat";
  const recipientName = inspectedEmployee ? inspectedEmployee.group.name : "Employee01";
  chatEmployeeNameEl.textContent = recipientName;
  workstationMainPanelEl.style.display = "none";
  chatPanelEl.style.display = "flex";
  setTaskbarApp("Chat");
  showChatView("main");
  workstationTaskBarEl.style.display = "none";
  if (inspectedEmployee) {
    const currentTask = getCurrentTaskForEmployee(inspectedEmployee.group.name);
    if (currentTask?.type === "chat") renderChatContacts(currentTask);
    else renderChatContacts(null);
  }
}
function closeChatToWorkstation() {
  uiState = "workstation";
  chatPanelEl.style.display = "none";
  workstationMainPanelEl.style.display = "flex";
  setTaskbarApp(null);
  renderWorkstationTaskBar();
}
function openChatConversation(task) {
  uiState = "chat-conversation";
  chatConversationNameEl.textContent = task.chatContactName || "Unknown";
  chatConversationStatusEl.textContent = task.chatStatus || "";
  const bodyLines = (task.bodyHtml || "").split("\n").map(l => l.trim()).filter(Boolean);
  chatMessageAreaEl.innerHTML = `
    <div class="chat-bubble">
      <div class="chat-bubble-meta">
        <span class="mail-meta-label">${task.chatContactName || "Unknown"} <span style="color:#9ca3af;font-size:11px;">${task.chatContactHandle || ""}</span></span>
        <span class="chat-bubble-time">${task.time || "09:42"}</span>
      </div>
      ${bodyLines.map(l => `<p>${l}</p>`).join("")}
    </div>
    <div class="mail-sender-details" id="chat-contact-details" style="display:none;">
      <div class="mail-sender-details-row"><span class="mail-sender-details-label">Handle:</span><span class="mail-sender-details-value">${task.chatContactDetails?.handle || "—"}</span></div>
      <div class="mail-sender-details-row"><span class="mail-sender-details-label">Tenant:</span><span class="mail-sender-details-value">${task.chatContactDetails?.profileDomain || "—"}</span></div>
      <div class="mail-sender-details-row"><span class="mail-sender-details-label">Account age:</span><span class="mail-sender-details-value">${task.chatContactDetails?.accountCreated || "—"}</span></div>
      <div class="mail-sender-details-row"><span class="mail-sender-details-label">Mutual groups:</span><span class="mail-sender-details-value">${task.chatContactDetails?.mutualGroups || "—"}</span></div>
      <div class="mail-sender-details-row"><span class="mail-sender-details-label">Reports:</span><span class="mail-sender-details-value">${task.chatContactDetails?.reportCount || "—"}</span></div>
    </div>
    <div style="margin-top:6px;">
      <button class="gmail-back-link" id="chat-reveal-btn">Show contact details</button>
    </div>
    <div class="mail-decision-buttons">
      <button id="chat-report-btn" class="mail-decision-btn mail-decision-btn-primary">REPORT MESSAGE</button>
      <button id="chat-follow-btn" class="mail-decision-btn mail-decision-btn-secondary">FOLLOW INSTRUCTIONS</button>
    </div>
  `;
  const revealBtn = document.getElementById("chat-reveal-btn");
  const detailsEl = document.getElementById("chat-contact-details");
  revealBtn.addEventListener("click", () => {
    const vis = detailsEl.style.display !== "none";
    detailsEl.style.display = vis ? "none" : "block";
  });
  document.getElementById("chat-report-btn").addEventListener("click", () => showChatResult("report"));
  document.getElementById("chat-follow-btn").addEventListener("click", () => showChatResult("follow"));
  showChatView("conversation");
  workstationTaskBarEl.style.display = "none";
}
function showChatResult(decision) {
  if (runState.runEnded) return;
  uiState = "chat-result";
  let isCorrect = false, taskForCompletion = null, dialogue = "—";
  if (inspectedEmployee) {
    const empName = inspectedEmployee.group.name;
    if (isEmployeeFired(empName)) { showChatView("main"); return; }
    const currentTask = getCurrentTaskForEmployee(empName);
    if (currentTask?.type === "chat") {
      taskForCompletion = currentTask;
      isCorrect = decision === currentTask.correctDecision;
      dialogue = getDialogueForCurrentTask(empName);
      const state = employeeTaskStates[empName];
      const progress = getTaskProgress(empName);
      if (isTaskFromSystem(currentTask) && !progress.allCompleted) {
        if (!state.completedTaskIds.includes(currentTask.id)) {
          handleGenericTaskCompletion(empName, isCorrect, currentTask, dialogue, "CHAT");
        }
      }
    }
  }
  if (isCorrect) {
    chatResultTitleEl.textContent = "✓ GOOD DECISION";
    chatResultTitleEl.className = "mail-result-title mail-result-good";
    chatResultBodyEl.innerHTML = (taskForCompletion?.correctFeedback || "Correct.").replace(/\n/g, "<br/>");
  } else {
    chatResultTitleEl.textContent = "⚠ UNSAFE DECISION";
    chatResultTitleEl.className = "mail-result-title mail-result-bad";
    chatResultBodyEl.innerHTML = (taskForCompletion?.incorrectFeedback || "Unsafe.").replace(/\n/g, "<br/>");
  }
  showChatView("result");
  workstationTaskBarEl.style.display = "none";
}
chatBackBtn.addEventListener("click", closeChatToWorkstation);
chatConversationBackBtn.addEventListener("click", () => { uiState = "chat"; showChatView("main"); });
chatContinueBtn.addEventListener("click", () => {
  const empName = inspectedEmployee ? inspectedEmployee.group.name : null;
  const state = empName ? employeeTaskStates[empName] : null;
  const done = state?.currentOpenTaskId && state.completedTaskIds.includes(state.currentOpenTaskId);
  if (done || (inspectedEmployee && getTaskProgress(inspectedEmployee.group.name).allCompleted)) closeChatToWorkstation();
  else { uiState = "chat"; showChatView("main"); }
});

// ============ BROWSER ============
const browserPanelEl = document.getElementById("browser-panel");
const browserMainViewEl = document.getElementById("browser-main-view");
const browserResultViewEl = document.getElementById("browser-result-view");
const browserEmployeeNameEl = document.getElementById("browser-employee-name");
const browserAddressBarEl = document.getElementById("browser-address-bar-el");
const browserPageContentEl = document.getElementById("browser-page-content");
const browserSecurityActionEl = document.getElementById("browser-security-action-el");
const browserSecurityQuestionEl = document.getElementById("browser-security-question-el");
const browserReportBtn = document.getElementById("browser-report-btn");
const browserVerifyBtn = document.getElementById("browser-verify-btn");
const browserBackBtn = document.getElementById("browser-back-btn");
const browserResultTitleEl = document.getElementById("browser-result-title");
const browserResultBodyEl = document.getElementById("browser-result-body");
const browserContinueBtn = document.getElementById("browser-continue-btn");

function showBrowserView(view) {
  browserMainViewEl.style.display = view === "main" ? "flex" : "none";
  browserResultViewEl.style.display = view === "result" ? "flex" : "none";
}
function openBrowser() {
  uiState = "browser";
  const recipientName = inspectedEmployee ? inspectedEmployee.group.name : "Employee01";
  browserEmployeeNameEl.textContent = recipientName;
  workstationMainPanelEl.style.display = "none";
  browserPanelEl.style.display = "flex";
  setTaskbarApp("Browser");
  showBrowserView("main");
  workstationTaskBarEl.style.display = "none";
  if (inspectedEmployee) {
    const currentTask = getCurrentTaskForEmployee(inspectedEmployee.group.name);
    if (currentTask?.type === "browser") {
      browserAddressBarEl.textContent = currentTask.browserUrl || "about:blank";
      browserPageContentEl.innerHTML = currentTask.browserContentHtml || "<p>Page could not be loaded.</p>";
      browserSecurityActionEl.style.display = "block";
      browserSecurityQuestionEl.textContent = `You are viewing: ${currentTask.browserPageTitle || currentTask.title}`;
    } else {
      browserAddressBarEl.textContent = "https://intranet.secureshift.com/";
      browserPageContentEl.innerHTML = `<div class="fake-logo" style="color:#2563eb;">SECURESHIFT</div><h2>Intranet Home</h2><p>Quick links: Employee directory · IT Help Desk · HR policies · Security awareness</p>`;
      browserSecurityActionEl.style.display = "none";
    }
  }
}
function closeBrowserToWorkstation() {
  uiState = "workstation";
  browserPanelEl.style.display = "none";
  workstationMainPanelEl.style.display = "flex";
  setTaskbarApp(null);
  renderWorkstationTaskBar();
}
function showBrowserResult(decision) {
  if (runState.runEnded) return;
  uiState = "browser-result";
  let isCorrect = false, taskForCompletion = null, dialogue = "—";
  if (inspectedEmployee) {
    const empName = inspectedEmployee.group.name;
    if (isEmployeeFired(empName)) { showBrowserView("main"); return; }
    const currentTask = getCurrentTaskForEmployee(empName);
    if (currentTask?.type === "browser") {
      taskForCompletion = currentTask;
      isCorrect = decision === currentTask.correctDecision;
      dialogue = getDialogueForCurrentTask(empName);
      const state = employeeTaskStates[empName];
      const progress = getTaskProgress(empName);
      if (isTaskFromSystem(currentTask) && !progress.allCompleted) {
        if (!state.completedTaskIds.includes(currentTask.id)) {
          handleGenericTaskCompletion(empName, isCorrect, currentTask, dialogue, "BROWSER");
        }
      }
    }
  }
  if (isCorrect) {
    browserResultTitleEl.textContent = "✓ GOOD DECISION";
    browserResultTitleEl.className = "mail-result-title mail-result-good";
    browserResultBodyEl.innerHTML = (taskForCompletion?.correctFeedback || "Correct.").replace(/\n/g, "<br/>");
  } else {
    browserResultTitleEl.textContent = "⚠ UNSAFE DECISION";
    browserResultTitleEl.className = "mail-result-title mail-result-bad";
    browserResultBodyEl.innerHTML = (taskForCompletion?.incorrectFeedback || "Unsafe.").replace(/\n/g, "<br/>");
  }
  showBrowserView("result");
  workstationTaskBarEl.style.display = "none";
}
browserReportBtn.addEventListener("click", () => showBrowserResult("report"));
browserVerifyBtn.addEventListener("click", () => showBrowserResult("verify"));
browserBackBtn.addEventListener("click", closeBrowserToWorkstation);
browserContinueBtn.addEventListener("click", () => {
  const empName = inspectedEmployee ? inspectedEmployee.group.name : null;
  const state = empName ? employeeTaskStates[empName] : null;
  const done = state?.currentOpenTaskId && state.completedTaskIds.includes(state.currentOpenTaskId);
  if (done || (inspectedEmployee && getTaskProgress(inspectedEmployee.group.name).allCompleted)) closeBrowserToWorkstation();
  else { uiState = "browser"; showBrowserView("main"); }
});

// ============ SECURITY CENTRE ============
const securityEmployeeNameEl = document.getElementById("security-employee-name");
const securityBackBtn = document.getElementById("security-back-btn");
const securityMessageEl = document.getElementById("security-message");
const secDeviceIdEl = document.getElementById("sec-device-id");
const secScanBtn = document.getElementById("sec-scan-btn");
const secLogBtn = document.getElementById("sec-log-btn");
const secReportBtn = document.getElementById("sec-report-btn");
const secPendingViewEl = document.getElementById("sec-pending-view");
const secClearViewEl = document.getElementById("sec-clear-view");
const secResultViewEl = document.getElementById("sec-result-view");
const secAlertTitleEl = document.getElementById("sec-alert-title");
const secAlertTextEl = document.getElementById("sec-alert-text");
const secAlertMetaEl = document.getElementById("sec-alert-meta");
const secAlertReportBtn = document.getElementById("sec-alert-report-btn");
const secAlertIgnoreBtn = document.getElementById("sec-alert-ignore-btn");
const secResultTitleEl = document.getElementById("sec-result-title");
const secResultBodyEl = document.getElementById("sec-result-body");
const secResultContinueBtn = document.getElementById("sec-result-continue-btn");

function getSecurityTaskForEmployee(empName) {
  const task = getCurrentTaskForEmployee(empName);
  return (task && task.type === "security") ? task : null;
}
function refreshSecurityCentreView() {
  const empName = inspectedEmployee ? inspectedEmployee.group.name : null;
  const task = empName ? getSecurityTaskForEmployee(empName) : null;
  const state = empName ? employeeTaskStates[empName] : null;
  const taskDone = state?.currentOpenTaskId && state.completedTaskIds.includes(state.currentOpenTaskId);
  if (task && !taskDone) {
    secPendingViewEl.style.display = "block";
    secClearViewEl.style.display = "none";
    secResultViewEl.style.display = "none";
    secAlertTitleEl.textContent = task.title;
    secAlertTextEl.textContent = task.secAlertText || "";
    secAlertMetaEl.textContent = `Severity: ${task.secSeverity || "Moderate"} · Detected: 14 Nov 2024 09:41`;
  } else {
    secPendingViewEl.style.display = "none";
    secClearViewEl.style.display = "block";
    secResultViewEl.style.display = "none";
  }
}
function openSecurityCentre() {
  uiState = "security";
  const empName = inspectedEmployee ? inspectedEmployee.group.name : "Employee01";
  if (securityEmployeeNameEl) securityEmployeeNameEl.textContent = empName;
  if (secDeviceIdEl) {
    const numMatch = empName.match(/\d+/);
    secDeviceIdEl.textContent = numMatch ? numMatch[0].padStart(2, "0") : "01";
  }
  if (securityMessageEl) securityMessageEl.textContent = "";
  workstationMainPanelEl.style.display = "none";
  securityPanelEl.style.display = "flex";
  setTaskbarApp("Security Centre");
  workstationTaskBarEl.style.display = "none";
  refreshSecurityCentreView();
}
function closeSecurityToWorkstation() {
  uiState = "workstation";
  securityPanelEl.style.display = "none";
  workstationMainPanelEl.style.display = "flex";
  setTaskbarApp(null);
  renderWorkstationTaskBar();
}
securityBackBtn.addEventListener("click", closeSecurityToWorkstation);
function showSecurityMessage(msg) {
  if (securityMessageEl) {
    securityMessageEl.textContent = msg;
    setTimeout(() => { if (securityMessageEl) securityMessageEl.textContent = ""; }, 3000);
  }
}
secScanBtn.addEventListener("click", () => showSecurityMessage("Quick scan started. This may take a few minutes."));
secLogBtn.addEventListener("click", () => showSecurityMessage("Protection history opened."));
secReportBtn.addEventListener("click", () => showSecurityMessage("Incident reported. Security team notified."));

function handleSecurityDecision(decision) {
  if (runState.runEnded) return;
  const empName = inspectedEmployee ? inspectedEmployee.group.name : null;
  if (!empName) return;
  const task = getSecurityTaskForEmployee(empName);
  if (!task) return;
  const state = employeeTaskStates[empName];
  if (!state || state.completedTaskIds.includes(task.id)) return;
  const isCorrect = decision === task.correctDecision;
  const dialogue = getDialogueForCurrentTask(empName);
  completeCurrentTaskForEmployee(empName);
  if (!isCorrect) {
    const newStrikes = addStrike(empName);
    if (typeof newStrikes === "number" && newStrikes > 0) processStrikeConsequence(empName, newStrikes);
  }
  updateHealth(empName, isCorrect);
  state.lastTaskTitle = task.title;
  state.lastReaction = isCorrect ? "correct" : "incorrect";
  state.history.push({ taskTitle: task.title, appName: "SECURITY CENTRE", dialogue, result: isCorrect ? "correct" : "incorrect" });
  renderRosterSidePanel();
  setTimeout(() => showReactionBubble(empName, isCorrect), 400);
  secPendingViewEl.style.display = "none";
  secClearViewEl.style.display = "none";
  secResultViewEl.style.display = "block";
  if (isCorrect) {
    secResultTitleEl.textContent = "✓ GOOD DECISION";
    secResultTitleEl.className = "mail-result-title mail-result-good";
    secResultBodyEl.innerHTML = (task.correctFeedback || "Correct.").replace(/\n/g, "<br/>");
  } else {
    secResultTitleEl.textContent = "⚠ UNSAFE DECISION";
    secResultTitleEl.className = "mail-result-title mail-result-bad";
    secResultBodyEl.innerHTML = (task.incorrectFeedback || "Unsafe.").replace(/\n/g, "<br/>");
  }
  workstationTaskBarEl.style.display = "none";
  recordAnswer(empName, isCorrect, task.title);
}
secAlertReportBtn.addEventListener("click", () => handleSecurityDecision("report"));
secAlertIgnoreBtn.addEventListener("click", () => handleSecurityDecision("ignore"));
secResultContinueBtn.addEventListener("click", () => {
  const empName = inspectedEmployee ? inspectedEmployee.group.name : null;
  const state = empName ? employeeTaskStates[empName] : null;
  const done = state?.currentOpenTaskId && state.completedTaskIds.includes(state.currentOpenTaskId);
  if (done || (inspectedEmployee && getTaskProgress(inspectedEmployee.group.name).allCompleted)) closeSecurityToWorkstation();
  else refreshSecurityCentreView();
});

// Escape key
window.addEventListener("keydown", e => {
  if (e.code !== "Escape" || !isInspecting || isBooting) return;
  if (runState.runEnded) return;
  if (uiState === "mail-result" || uiState === "mail-email") { uiState = "mail-inbox"; showMailView("inbox"); }
  else if (uiState === "mail-inbox") closeMailToWorkstation();
  else if (uiState === "chat-result") { uiState = "chat-conversation"; showChatView("conversation"); }
  else if (uiState === "chat-conversation") { uiState = "chat"; showChatView("main"); }
  else if (uiState === "chat") closeChatToWorkstation();
  else if (uiState === "browser-result") { uiState = "browser"; showBrowserView("main"); }
  else if (uiState === "browser") closeBrowserToWorkstation();
  else if (uiState === "security") closeSecurityToWorkstation();
  else closeComputerInspection();
});

// Lighting
const hemiLight = new THREE.HemisphereLight(0xf3f4f6, 0x6b7280, 0.55); scene.add(hemiLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7); directionalLight.position.set(10, 15, 10); scene.add(directionalLight);
const ceilingLightMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.8 });
[-6, 0, 6].forEach(x => { [-9, -3, 3, 9].forEach(z => {
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.5), ceilingLightMaterial);
  panel.rotation.x = Math.PI / 2;
  panel.position.set(x, WALL_HEIGHT - 0.02, z);
  architecture.add(panel);
}); });

// Menu / HUD / Timer
let gameStarted = false, isPaused = false, infoScreenReturnTo = "main-menu", shiftComplete = false;
const SHIFT_DURATION_SECONDS = 600;
let shiftElapsedSeconds = 0;

function formatTimeMmSs(totalSeconds) {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(clamped / 60), secs = clamped % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Menu elements
const mainMenuScreenEl = document.getElementById("main-menu-screen");
const difficultyScreenEl = document.getElementById("difficulty-screen");
const gameDetailsScreenEl = document.getElementById("game-details-screen");
const howToPlayScreenEl = document.getElementById("how-to-play-screen");
const exitConfirmScreenEl = document.getElementById("exit-confirm-screen");
const pauseMenuScreenEl = document.getElementById("pause-menu-screen");
const endScreenEl = document.getElementById("end-screen");
const hudEl = document.getElementById("hud");
const hudShiftTimeEl = document.getElementById("hud-shift-time");
const hudTimeCardEl = document.getElementById("hud-time-card");
const hudDifficultyLabelEl = document.getElementById("hud-difficulty-label");
const hudTaskCountEl = document.getElementById("hud-task-count");
const hudActiveCountEl = document.getElementById("hud-active-count");
const hudFiredCountEl = document.getElementById("hud-fired-count");
const hudInspectPanelEl = document.getElementById("hud-inspect-panel");
const hudEmpNameEl = document.getElementById("hud-emp-name");
const hudEmpTaskEl = document.getElementById("hud-emp-task");
const hudEmpStrikesEl = document.getElementById("hud-emp-strikes");
const hudStatusPanelEl = document.getElementById("hud-status-panel");
const hudFocusValueEl = document.getElementById("hud-focus-value");
const hudMiniProgressFillEl = document.getElementById("hud-mini-progress-fill");

// End screen elements
const endTitleEl = document.getElementById("end-title");
const endSubtitleEl = document.getElementById("end-subtitle");
const endScoreValueEl = document.getElementById("end-score-value");
const endCorrectValueEl = document.getElementById("end-correct-value");
const endWrongValueEl = document.getElementById("end-wrong-value");
const endFiredBlockEl = document.getElementById("end-fired-block");
const endFiredListEl = document.getElementById("end-fired-list");
const endRetryBtn = document.getElementById("end-retry-btn");
const endQuitBtn = document.getElementById("end-quit-btn");

function hideAllMenuScreens() {
  mainMenuScreenEl.style.display = "none";
  difficultyScreenEl.style.display = "none";
  gameDetailsScreenEl.style.display = "none";
  howToPlayScreenEl.style.display = "none";
  exitConfirmScreenEl.style.display = "none";
  pauseMenuScreenEl.style.display = "none";
  endScreenEl.style.display = "none";
}

document.getElementById("btn-start-shift").addEventListener("click", () => {
  hideAllMenuScreens();
  difficultyScreenEl.style.display = "flex";
});
document.getElementById("difficulty-back-btn").addEventListener("click", () => {
  hideAllMenuScreens();
  mainMenuScreenEl.style.display = "flex";
});
document.querySelectorAll(".difficulty-card").forEach(btn => {
  btn.addEventListener("click", () => {
    const diff = btn.dataset.difficulty;
    if (diff) beginGameWithDifficulty(diff);
  });
});
document.getElementById("btn-game-details").addEventListener("click", () => { infoScreenReturnTo = "main-menu"; hideAllMenuScreens(); gameDetailsScreenEl.style.display = "flex"; });
document.getElementById("btn-how-to-play").addEventListener("click", () => { infoScreenReturnTo = "main-menu"; hideAllMenuScreens(); howToPlayScreenEl.style.display = "flex"; });
document.getElementById("btn-exit").addEventListener("click", () => { hideAllMenuScreens(); exitConfirmScreenEl.style.display = "flex"; });
document.getElementById("game-details-back-btn").addEventListener("click", () => { hideAllMenuScreens(); if (infoScreenReturnTo === "pause") pauseMenuScreenEl.style.display = "flex"; else mainMenuScreenEl.style.display = "flex"; });
document.getElementById("how-to-play-back-btn").addEventListener("click", () => { hideAllMenuScreens(); if (infoScreenReturnTo === "pause") pauseMenuScreenEl.style.display = "flex"; else mainMenuScreenEl.style.display = "flex"; });
document.getElementById("exit-cancel-btn").addEventListener("click", () => { hideAllMenuScreens(); mainMenuScreenEl.style.display = "flex"; });
document.getElementById("exit-confirm-btn").addEventListener("click", () => { hideAllMenuScreens(); mainMenuScreenEl.style.display = "flex"; });
document.getElementById("pause-resume-btn").addEventListener("click", resumeGame);
document.getElementById("pause-game-details-btn").addEventListener("click", () => { infoScreenReturnTo = "pause"; hideAllMenuScreens(); gameDetailsScreenEl.style.display = "flex"; });
document.getElementById("pause-how-to-play-btn").addEventListener("click", () => { infoScreenReturnTo = "pause"; hideAllMenuScreens(); howToPlayScreenEl.style.display = "flex"; });
document.getElementById("pause-main-menu-btn").addEventListener("click", returnToMainMenu);

// End screen buttons
endRetryBtn.addEventListener("click", () => {
  const diff = runState.difficulty;
  hideAllMenuScreens();
  resetSession();
  if (diff) beginGameWithDifficulty(diff);
});
endQuitBtn.addEventListener("click", () => {
  returnToMainMenu();
});

function getFiredEmployeeCount() {
  let count = 0;
  Object.keys(employeeTaskStates).forEach(name => { if (employeeTaskStates[name].fired) count++; });
  return count;
}

function beginGameWithDifficulty(difficultyKey) {
  startRun(difficultyKey);
  resetSession();
  hideAllMenuScreens();
  gameStarted = true; isPaused = false; shiftComplete = false;
  hudEl.style.display = "block";
  renderer.domElement.style.display = "block";
  requestSystemInitialized = false;
  nextTaskCooldown = FIRST_REQUEST_DELAY;
  // HUD setup
  const cfg = runState.config;
  if (hudDifficultyLabelEl) hudDifficultyLabelEl.textContent = `SHIFT 01 · ${cfg.label}`;
  if (hudTimeCardEl) hudTimeCardEl.style.display = cfg.hasTimer ? "flex" : "none";
  if (hudShiftTimeEl && cfg.hasTimer) hudShiftTimeEl.textContent = `${formatTimeMmSs(0)} / ${formatTimeMmSs(cfg.timeLimit)}`;
  if (hudTaskCountEl) hudTaskCountEl.textContent = `0 / ${cfg.answerCap}`;
  if (hudMiniProgressFillEl) hudMiniProgressFillEl.style.width = "0%";
  renderRosterSidePanel();
  updateHelpMarkers();
  updateHud();
  // Request pointer lock
  renderer.domElement.requestPointerLock();
}

function startGame() {
  // Legacy — now used as a no-op for compatibility
  beginGameWithDifficulty("easy");
}
function pauseGame() {
  isPaused = true;
  pauseMenuScreenEl.style.display = "flex";
  if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
}
function resumeGame() {
  isPaused = false;
  hideAllMenuScreens();
  if (!runState.runEnded && !shiftComplete) renderer.domElement.requestPointerLock();
}
function returnToMainMenu() {
  gameStarted = false; isPaused = false; shiftComplete = false; shiftElapsedSeconds = 0;
  hudEl.style.display = "none";
  rosterSidePanelEl.style.display = "none";
  renderer.domElement.style.display = "none";
  if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
  hideAllMenuScreens();
  mainMenuScreenEl.style.display = "flex";
  if (employeeDetailOverlayEl) { employeeDetailOverlayEl.classList.remove("active"); employeeDetailOverlayEl.style.display = "none"; }
  clearAllSpeechBubbles(); clearAllHelpMarkers();
  rosterExpanded = false;
  currentActiveRequest = null;
  resetRunState();
}
function resetSession() {
  employeeInstances.forEach(emp => {
    emp.group.visible = true;
    emp.group.traverse(child => { if (child.isMesh && child.material?.emissive) child.material.emissive.setHex(0x000000); });
  });
  firedEmployees.clear();
  for (let i = 1; i <= 12; i++) {
    const empName = `Employee${String(i).padStart(2, "0")}`;
    initializeEmployeeTaskState(empName);
    assignTasksToEmployee(empName);
  }
  currentActiveRequest = null;
  nextTaskCooldown = 0;
  requestSystemInitialized = false;
  clearAllSpeechBubbles(); clearAllHelpMarkers();
  shiftElapsedSeconds = 0; shiftComplete = false;
  inspectedEmployee = null; nearbyEmployee = null; isInspecting = false; isPaused = false;
  workstationOverlayEl.style.display = "none";
  bootScreenEl.style.display = "none";
  workstationTaskBarEl.style.display = "none";
  locateHighlights.forEach(t => clearTimeout(t)); locateHighlights.clear();
  // Reset player position
  playerPos.x = 0; playerPos.z = 10; yaw = 0; pitch = 0;
}

function showEndScreen(outcome, reason) {
  runState.endedAs = outcome;
  const cfg = runState.config;
  const correct = runState.correctCount;
  const wrong = runState.wrongCount;
  const cap = cfg ? cfg.answerCap : runState.answersGiven;
  const totalAnswered = runState.answersGiven;
  hideAllMenuScreens();
  hudEl.style.display = "none";
  rosterSidePanelEl.style.display = "none";
  renderer.domElement.style.display = "none";
  if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();

  if (outcome === "win") {
    endTitleEl.textContent = "SHIFT COMPLETE";
    endTitleEl.className = "end-title end-title-win";
    endSubtitleEl.textContent = "Perfect shift — every answer was correct.";
    endScoreValueEl.textContent = `${correct} / ${cap}`;
    endScoreValueEl.className = "end-score-value end-correct";
    endCorrectValueEl.textContent = `${correct}`;
    endWrongValueEl.textContent = `${wrong}`;
    endFiredBlockEl.style.display = "none";
    endRetryBtn.style.display = "none";
  } else {
    endTitleEl.textContent = "SHIFT FAILED";
    endTitleEl.className = "end-title end-title-fail";
    if (reason) endSubtitleEl.textContent = reason;
    else endSubtitleEl.textContent = "The shift did not meet requirements.";
    endScoreValueEl.textContent = `${correct} / ${cap}`;
    endScoreValueEl.className = "end-score-value end-wrong";
    endCorrectValueEl.textContent = `${correct}`;
    endWrongValueEl.textContent = `${wrong}`;
    if (runState.firedByPlayer.length > 0) {
      endFiredBlockEl.style.display = "block";
      endFiredListEl.innerHTML = "";
      runState.firedByPlayer.forEach(name => {
        const chip = document.createElement("span");
        chip.className = "end-fired-chip";
        chip.textContent = name;
        endFiredListEl.appendChild(chip);
      });
    } else {
      endFiredBlockEl.style.display = "none";
    }
    endRetryBtn.style.display = "inline-block";
  }
  endScreenEl.style.display = "flex";
}

// Escape to pause
window.addEventListener("keydown", e => {
  if (e.code !== "Escape" || !gameStarted || isInspecting) return;
  if (runState.runEnded || shiftComplete) return;
  if (employeeDetailOverlayEl?.classList.contains("active")) return;
  if (isPaused) resumeGame(); else pauseGame();
});

function updateHud() {
  const cap = runState.config ? runState.config.answerCap : 5;
  const total = runState.answersGiven;
  const percent = Math.min(100, (total / cap) * 100);
  if (hudTaskCountEl) hudTaskCountEl.textContent = `${total} / ${cap}`;
  if (hudMiniProgressFillEl) {
    hudMiniProgressFillEl.style.width = percent + "%";
    if (total >= cap) hudMiniProgressFillEl.classList.add("task-progress-complete");
    else hudMiniProgressFillEl.classList.remove("task-progress-complete");
  }
  const fired = getFiredEmployeeCount();
  const active = 12 - fired;
  if (hudActiveCountEl) hudActiveCountEl.textContent = `${active}/12`;
  if (hudFiredCountEl) {
    hudFiredCountEl.textContent = `${fired}`;
    if (fired > 0) hudFiredCountEl.classList.add("hud-fired-active");
    else hudFiredCountEl.classList.remove("hud-fired-active");
  }
  const focus = getFocusStatus();
  if (hudFocusValueEl) {
    hudFocusValueEl.textContent = focus.label;
    hudFocusValueEl.className = "hud-value hud-status-" + focus.key;
  }
  if (hudStatusPanelEl) hudStatusPanelEl.className = "hud-status-panel status-" + focus.key;
  if (isInspecting && inspectedEmployee) {
    const name = inspectedEmployee.group.name;
    const progress = getTaskProgress(name);
    const isFired = isEmployeeFired(name);
    hudEmpNameEl.textContent = name;
    hudEmpTaskEl.textContent = isFired ? "—" : `${Math.min(progress.current, 5)} / ${progress.total}`;
    hudEmpStrikesEl.textContent = isFired ? "FIRED" : getStrikeDisplay(name);
    hudInspectPanelEl.style.display = "block";
  } else hudInspectPanelEl.style.display = "none";
  if (rosterExpanded) renderRosterSidePanel();
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let lastTime = performance.now();
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const deltaTime = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  if (gameStarted && !isInspecting && !isPaused && !runState.runEnded && !shiftComplete) {
    updatePlayer(deltaTime);
    updateEmployeeInteraction();
  }
  if (gameStarted && !isPaused && !runState.runEnded && !shiftComplete) updateRunTimer(deltaTime);
  if (gameStarted && !runState.runEnded) updateHud();
  if (gameStarted && !isPaused && !runState.runEnded && !shiftComplete) {
    updateRequestTimer(deltaTime);
    updateSpeechBubblePositions();
    updateHelpMarkerPositions();
  }
  const t = now * 0.001;
  employeeInstances.forEach((emp, i) => {
    if (!emp.group.visible) return;
    const phase = i * 0.6;
    emp.head.rotation.y = Math.sin(t * 0.5 + phase) * 0.06;
    emp.arms.forEach(arm => { arm.rotation.x = Math.sin(t * 0.7 + phase) * 0.03; });
  });
  renderer.render(scene, camera);
}
animate();