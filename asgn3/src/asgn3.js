// asgn3.js - Assignment 3: Creating a Virtual World
// UCSC CSE-160 | Surya Pugazhenthi
// Note for grader: camera movement and texture setup assisted by OpenCode + Claude Code.

'use strict';

// --- GLSL Shaders ------------------------------------------------------------

const VSHADER = `
  attribute vec4 a_Position;
  attribute vec2 a_TexCoord;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  varying vec2 v_TexCoord;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    v_TexCoord  = a_TexCoord;
  }
`;

const FSHADER = `
  precision mediump float;
  uniform vec4      u_BaseColor;
  uniform float     u_TexColorWeight;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;
  uniform sampler2D u_Sampler4;
  uniform int       u_TexUnit;
  varying vec2 v_TexCoord;
  void main() {
    vec4 texColor;
    if      (u_TexUnit == 0) texColor = texture2D(u_Sampler0, v_TexCoord);
    else if (u_TexUnit == 1) texColor = texture2D(u_Sampler1, v_TexCoord);
    else if (u_TexUnit == 2) texColor = texture2D(u_Sampler2, v_TexCoord);
    else if (u_TexUnit == 4) texColor = texture2D(u_Sampler4, v_TexCoord);
    else                     texColor = texture2D(u_Sampler3, v_TexCoord);
    float t = u_TexColorWeight;
    gl_FragColor = (1.0 - t) * u_BaseColor + t * texColor;
  }
`;

// --- World Map (32×32) -------------------------------------------------------

const MAP_SIZE = 32;

const g_map = [
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,3,3,3,0,0,0,0,2,2,2,0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,3,0,3,0,0,0,0,2,0,2,0,0,0,0,0,0,3,0,3,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,3,0,3,0,0,0,0,2,0,2,0,0,0,0,0,0,3,0,3,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,3,3,3,0,0,0,0,2,2,2,0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,1,0,0,2,2,0,0,2,2,0,0,0,0,1,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,1,0,0,2,0,0,0,0,2,0,0,0,0,1,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,1,1,1,1,1,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,4,4,4,4,0,0,0,0,0,0,0,0,0,0,4,4,4,4,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,4,0,0,4,0,0,0,0,0,0,0,0,0,0,4,0,0,4,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,4,0,0,4,0,0,0,0,0,0,0,0,0,0,4,0,0,4,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,4,4,4,4,0,0,0,0,0,0,0,0,0,0,4,4,4,4,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,4],
  [4,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,4],
  [4,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
  [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
];

// --- Globals -----------------------------------------------------------------
let gl;
let canvas;
let camera;

// Uniform / attribute locations
let a_Position, a_TexCoord;
let u_ModelMatrix, u_ViewMatrix, u_ProjectionMatrix;
let u_BaseColor, u_TexColorWeight, u_TexUnit;

// Input state
const keys   = {};
let   mouseLocked = false;
let   lastMouseX  = 0, lastMouseY = 0;

// Game state
let g_gameMsg    = '';
let g_msgTimer   = 0;
let g_coins      = 0;
const TOTAL_GEMS = 5;
let g_gemPositions = [
  [5, 10], [15, 5], [20, 20], [10, 25], [25, 15]
];
let g_gemCollected = [false, false, false, false, false];

// --- Texture Setup ------------------------------------------------------------

function makeTexFromCanvas(gl, unit, cv) {
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  return tex;
}

function makeDirtTexture(gl, unit) {
  const cv  = document.createElement('canvas');
  cv.width  = 64;
  cv.height = 64;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#7a5230';
  ctx.fillRect(0, 0, 64, 64);
  const dots = [
    [3,3,4,4,'#5c3d18'],[10,8,3,3,'#8b6040'],[20,5,5,5,'#6b4422'],
    [35,3,4,4,'#9a7050'],[45,8,3,3,'#5c3d18'],[55,3,4,4,'#8b6040'],
    [2,18,3,5,'#6b4422'],[12,15,5,5,'#5c3d18'],[25,20,4,4,'#9a7050'],
    [38,15,5,3,'#8b6040'],[50,18,4,4,'#6b4422'],[5,32,4,4,'#5c3d18'],
    [18,30,5,5,'#9a7050'],[30,35,3,4,'#8b6040'],[45,30,5,4,'#6b4422'],
    [58,32,3,3,'#5c3d18'],[4,48,5,4,'#9a7050'],[16,45,4,5,'#6b4422'],
    [28,50,5,3,'#8b6040'],[42,48,4,4,'#5c3d18'],[55,46,4,5,'#9a7050'],
  ];
  dots.forEach(([x,y,w,h,c]) => { ctx.fillStyle = c; ctx.fillRect(x,y,w,h); });
  return makeTexFromCanvas(gl, unit, cv);
}

function makeStoneTexture(gl, unit) {
  const cv  = document.createElement('canvas');
  cv.width  = 64;
  cv.height = 64;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#888';
  ctx.fillRect(0, 0, 64, 64);
  const patches = [
    [2,2,8,8,'#999'], [12,4,6,6,'#777'], [24,2,10,10,'#aaa'],
    [36,6,8,6,'#888'], [48,2,12,8,'#777'], [4,16,10,10,'#999'],
    [18,14,8,12,'#aaa'], [32,16,12,8,'#888'], [46,14,10,10,'#666'],
    [2,30,8,10,'#777'], [14,28,12,12,'#999'], [30,30,10,8,'#aaa'],
    [44,28,8,12,'#888'], [4,44,10,8,'#999'], [18,42,8,10,'#777'],
    [32,44,12,8,'#666'], [48,44,6,6,'#aaa'],
  ];
  patches.forEach(([x,y,w,h,c]) => { ctx.fillStyle = c; ctx.fillRect(x,y,w,h); });
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 64; i += 16) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 64); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(64, i); ctx.stroke();
  }
  return makeTexFromCanvas(gl, unit, cv);
}

function makeGrassTexture(gl, unit) {
  const cv  = document.createElement('canvas');
  cv.width  = 64;
  cv.height = 64;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#5a8a30';
  ctx.fillRect(0, 0, 64, 64);
  const blades = [
    [1,1,3,8,'#4a7a20'],[8,4,2,10,'#6a9a40'],[16,2,3,7,'#4a7a20'],
    [24,1,2,9,'#3a6a10'],[32,3,3,8,'#6a9a40'],[40,1,2,7,'#4a7a20'],
    [48,4,3,8,'#3a6a10'],[56,2,2,9,'#6a9a40'],
    [4,20,2,8,'#6a9a40'],[12,18,3,9,'#4a7a20'],[20,20,2,8,'#3a6a10'],
    [28,19,3,7,'#6a9a40'],[36,21,2,8,'#4a7a20'],[44,18,3,9,'#3a6a10'],
    [52,20,2,8,'#6a9a40'],[60,19,2,7,'#4a7a20'],
    [2,40,3,8,'#3a6a10'],[10,38,2,9,'#6a9a40'],[18,40,3,8,'#4a7a20'],
    [26,39,2,7,'#3a6a10'],[34,41,3,8,'#6a9a40'],[42,38,2,9,'#4a7a20'],
    [50,40,3,8,'#3a6a10'],[58,39,2,7,'#6a9a40'],
  ];
  blades.forEach(([x,y,w,h,c]) => { ctx.fillStyle = c; ctx.fillRect(x,y,w,h); });
  return makeTexFromCanvas(gl, unit, cv);
}

function makeSkyTexture(gl, unit) {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 256;
  const ctx = cv.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0.0, '#1460b0');
  grad.addColorStop(0.5, '#3d8dd4');
  grad.addColorStop(1.0, '#a0cef0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = 'rgba(255,255,255,0.80)';
  [[40,50,55,18],[130,35,70,16],[20,140,45,14],[160,120,60,17],[80,190,40,12]].forEach(([x,y,w,h]) => {
    ctx.beginPath(); ctx.ellipse(x, y, w, h, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x+w*0.5, y-h*0.4, w*0.65, h*0.75, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x-w*0.4, y-h*0.3, w*0.55, h*0.65, 0, 0, Math.PI*2); ctx.fill();
  });
  return makeTexFromCanvas(gl, unit, cv);
}

function makeCheckerTexture(gl, unit, c1, c2, tileSize = 16, imgSize = 128) {
  const cv  = document.createElement('canvas');
  cv.width  = imgSize;
  cv.height = imgSize;
  const ctx = cv.getContext('2d');

  for (let y = 0; y < imgSize; y += tileSize) {
    for (let x = 0; x < imgSize; x += tileSize) {
      const evenTile = (Math.floor(x/tileSize) + Math.floor(y/tileSize)) % 2 === 0;
      ctx.fillStyle = evenTile ? c1 : c2;
      ctx.fillRect(x, y, tileSize, tileSize);
    }
  }

  return makeTexFromCanvas(gl, unit, cv);
}

function initTextures() {
  makeDirtTexture(gl, 0);
  makeStoneTexture(gl, 1);
  makeGrassTexture(gl, 2);
  makeCheckerTexture(gl, 3, '#ffe066', '#cc9900', 8, 64);

  gl.uniform1i(gl.getUniformLocation(gl.program, 'u_Sampler0'), 0);
  gl.uniform1i(gl.getUniformLocation(gl.program, 'u_Sampler1'), 1);
  gl.uniform1i(gl.getUniformLocation(gl.program, 'u_Sampler2'), 2);
  gl.uniform1i(gl.getUniformLocation(gl.program, 'u_Sampler3'), 3);
  makeSkyTexture(gl, 4);
  gl.uniform1i(gl.getUniformLocation(gl.program, 'u_Sampler4'), 4);
}

// --- Cube Draw Helpers --------------------------------------------------------

let g_cubeBuffer = null;
const g_modelMat = new Matrix4();  // reused every frame

function initCubeBuffer() {
  const verts = Cube.buildVertices();
  g_cubeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
}

function bindCubeBuffer() {
  const FSIZE = 4;
  gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 5, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 5, FSIZE * 3);
  gl.enableVertexAttribArray(a_TexCoord);
}

function drawCube(modelMatrix, baseColor, texWeight, texUnit) {
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniform4fv(u_BaseColor, baseColor);
  gl.uniform1f(u_TexColorWeight, texWeight);
  gl.uniform1i(u_TexUnit, texUnit);
  gl.drawArrays(gl.TRIANGLES, 0, 36);
}

// --- World Render -------------------------------------------------------------

function renderWorld() {
  const ex = camera.eye.elements[0];
  const ez = camera.eye.elements[2];

  // Forward direction (horizontal) for frustum culling
  const fdx = camera.at.elements[0] - ex;
  const fdz = camera.at.elements[2] - ez;
  const flen = Math.sqrt(fdx*fdx + fdz*fdz) || 1;
  const fnx = fdx/flen, fnz = fdz/flen;

  // Sky (CULL_FACE off - camera is inside the cube)
  gl.disable(gl.CULL_FACE);
  g_modelMat.setIdentity();
  g_modelMat.translate(16, 0, 16);
  g_modelMat.scale(1000, 1000, 1000);
  drawCube(g_modelMat, [0.55, 0.78, 1.0, 1.0], 0.85, 4);
  gl.enable(gl.CULL_FACE);

  // Ground - top surface at y=0 to meet block bottoms
  g_modelMat.setIdentity();
  g_modelMat.translate(16, -0.005, 16);
  g_modelMat.scale(MAP_SIZE, 0.01, MAP_SIZE);
  drawCube(g_modelMat, [0.3, 0.7, 0.2, 1.0], 0.9, 2);

  // Walls - distance (16) + frustum (-0.35 cos threshold) culling
  const MAX_D = 16;
  for (let z = 0; z < MAP_SIZE; z++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const h = g_map[z][x];
      if (h === 0) continue;

      const bx = x + 0.5 - ex;
      const bz = z + 0.5 - ez;

      // Fast AABB distance reject
      if (bx > MAX_D || bx < -MAX_D || bz > MAX_D || bz < -MAX_D) continue;

      // Frustum cull: skip blocks clearly behind camera (only when > 2 units away)
      const dist2 = bx*bx + bz*bz;
      if (dist2 > 4) {
        const dot = bx*fnx + bz*fnz;
        const dist = Math.sqrt(dist2);
        if (dot / dist < -0.35) continue;
      }

      const texUnit = (h >= 3) ? 1 : 0;
      for (let y = 0; y < h; y++) {
        g_modelMat.setIdentity();
        g_modelMat.translate(x + 0.5, y + 0.5, z + 0.5);
        drawCube(g_modelMat, [1.0, 1.0, 1.0, 1.0], 1.0, texUnit);
      }
    }
  }

  // Gems (animated collectibles)
  const now = performance.now() / 1000;
  for (let i = 0; i < g_gemPositions.length; i++) {
    if (g_gemCollected[i]) continue;
    const [gx, gz] = g_gemPositions[i];
    g_modelMat.setIdentity();
    g_modelMat.translate(gx + 0.5, 0.5 + Math.sin(now * 2 + i) * 0.15, gz + 0.5);
    g_modelMat.rotate(now * 90, 0, 1, 0);
    g_modelMat.scale(0.35, 0.35, 0.35);
    drawCube(g_modelMat, [1.0, 0.85, 0.1, 1.0], 0.7, 3);
  }
}

// --- Gem Collection -----------------------------------------------------------

function checkGemCollection() {
  const ex = camera.eye.elements[0];
  const ez = camera.eye.elements[2];

  for (let i = 0; i < g_gemPositions.length; i++) {
    if (g_gemCollected[i]) continue;
    const [gx, gz] = g_gemPositions[i];
    const dist = Math.sqrt((ex - gx - 0.5)**2 + (ez - gz - 0.5)**2);
    if (dist < 1.2) {
      g_gemCollected[i] = true;
      g_coins++;
      const el = document.getElementById('gemcount');
      if (el) el.textContent = g_coins + '/' + TOTAL_GEMS;
      if (g_coins >= TOTAL_GEMS) {
        showMsg('YOU WIN! All gems collected! 🌟', 10000);
      } else {
        showMsg(`Gem collected! ${g_coins}/${TOTAL_GEMS} ✨`);
      }
    }
  }
}

function showMsg(txt, duration = 3000) {
  g_gameMsg = txt;
  document.getElementById('msg').textContent = txt;
  clearTimeout(g_msgTimer);
  g_msgTimer = setTimeout(() => {
    g_gameMsg = '';
    document.getElementById('msg').textContent = '';
  }, duration);
}

// --- Block Add / Delete -------------------------------------------------------

function getBlockInFront() {
  const ex = camera.eye.elements[0];
  const ez = camera.eye.elements[2];
  const fx = camera.at.elements[0] - camera.eye.elements[0];
  const fz = camera.at.elements[2] - camera.eye.elements[2];
  const len = Math.sqrt(fx*fx + fz*fz);
  if (len === 0) return null;
  const nx = fx / len;
  const nz = fz / len;
  const tx = Math.floor(ex + nx * 1.5);
  const tz = Math.floor(ez + nz * 1.5);
  if (tx >= 0 && tx < MAP_SIZE && tz >= 0 && tz < MAP_SIZE) {
    return [tx, tz];
  }
  return null;
}

function addBlock() {
  const pos = getBlockInFront();
  if (!pos) return;
  const [x, z] = pos;
  if (g_map[z][x] < 4) {
    g_map[z][x]++;
    showMsg(`Added block at (${x},${z}) - height: ${g_map[z][x]}`);
  } else {
    showMsg('Block stack is already at max height (4)');
  }
}

function deleteBlock() {
  const pos = getBlockInFront();
  if (!pos) return;
  const [x, z] = pos;
  if (g_map[z][x] > 0) {
    g_map[z][x]--;
    showMsg(`Removed block at (${x},${z}) - height: ${g_map[z][x]}`);
  } else {
    showMsg('No block to remove here');
  }
}

// --- Input Handling -----------------------------------------------------------

function initInput() {
  document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'f') addBlock();
    if (e.key.toLowerCase() === 'g') deleteBlock();
  });
  document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

  canvas.addEventListener('click', () => {
    if (!mouseLocked) canvas.requestPointerLock();
  });

  document.addEventListener('pointerlockchange', () => {
    mouseLocked = document.pointerLockElement === canvas;
  });

  document.addEventListener('mousemove', e => {
    if (!mouseLocked) return;
    camera.panByMouse(e.movementX, e.movementY, 0.25);
  });
}

// --- Collision Detection -----------------------------------------------------

function cellBlocked(x, z) {
  const mx = Math.floor(x), mz = Math.floor(z);
  if (mx < 0 || mx >= MAP_SIZE || mz < 0 || mz >= MAP_SIZE) return true;
  return g_map[mz][mx] > 0;
}

function processKeys() {
  const eye = camera.eye.elements;
  const at  = camera.at.elements;

  // Snapshot X/Z before any movement
  const ex0 = eye[0], ez0 = eye[2];
  const ax0 = at[0],  az0 = at[2];
  let moved = false;

  if (keys['w']) { camera.moveForward(0.12);   moved = true; }
  if (keys['s']) { camera.moveBackwards(0.12); moved = true; }
  if (keys['a']) { camera.moveLeft(0.12);      moved = true; }
  if (keys['d']) { camera.moveRight(0.12);     moved = true; }
  if (keys['q']) camera.panLeft(3);
  if (keys['e']) camera.panRight(3);

  if (moved) {
    const newX = eye[0], newZ = eye[2];
    if (cellBlocked(newX, newZ)) {
      // Try sliding along X (keep new X, restore Z)
      if (!cellBlocked(newX, ez0)) {
        eye[2] = ez0; at[2] = az0;
        camera.updateView();
      }
      // Try sliding along Z (keep new Z, restore X)
      else if (!cellBlocked(ex0, newZ)) {
        eye[0] = ex0; at[0] = ax0;
        camera.updateView();
      }
      // Fully blocked - restore both axes
      else {
        eye[0] = ex0; eye[2] = ez0;
        at[0]  = ax0; at[2]  = az0;
        camera.updateView();
      }
    }
  }
}

// --- Render Loop --------------------------------------------------------------

let g_lastTime = 0;
let g_fps = 0;

function tick(now) {
  const dt = (now - g_lastTime) / 1000;
  g_lastTime = now;
  if (dt > 0) {
    g_fps = Math.round(1 / dt);
    const el = document.getElementById('fps');
    if (el) el.textContent = g_fps + ' FPS';
  }

  processKeys();
  checkGemCollection();
  renderFrame();

  requestAnimationFrame(tick);
}

function renderFrame() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniformMatrix4fv(u_ViewMatrix,       false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);

  bindCubeBuffer();
  renderWorld();
}

// --- Main ---------------------------------------------------------------------

function main() {
  canvas = document.getElementById('webgl');
  gl = getWebGLContext(canvas);
  if (!gl) { alert('WebGL not available'); return; }

  if (!initShaders(gl, VSHADER, FSHADER)) { alert('Shader init failed'); return; }

  a_Position  = gl.getAttribLocation(gl.program, 'a_Position');
  a_TexCoord  = gl.getAttribLocation(gl.program, 'a_TexCoord');

  u_ModelMatrix      = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_ViewMatrix       = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_BaseColor        = gl.getUniformLocation(gl.program, 'u_BaseColor');
  u_TexColorWeight   = gl.getUniformLocation(gl.program, 'u_TexColorWeight');
  u_TexUnit          = gl.getUniformLocation(gl.program, 'u_TexUnit');

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);

  initTextures();
  initCubeBuffer();

  camera = new Camera();
  camera.eye.elements[0] = 15.5;  // center of confirmed 5x5 open region
  camera.eye.elements[1] = 1.6;
  camera.eye.elements[2] = 3.5;
  camera.at.elements[0]  = 15.5;  // looking south into map interior
  camera.at.elements[1]  = 1.6;
  camera.at.elements[2]  = 15.0;
  camera.updateView();
  camera.updateProjection();

  initInput();

  showMsg('Welcome! Collect all 5 gems to win! (F=add block, G=delete block)', 5000);

  requestAnimationFrame(tick);
}

window.onload = main;