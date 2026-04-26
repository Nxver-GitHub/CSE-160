// Assignment 2: Blocky 3D Pig 

// --- Global Variables ---
// Rotation
var g_globalAngleX = 0;
var g_globalAngleY = 0;

// Animation
var g_animating = false;
var g_time = 0;

// Joint angles
var g_frontLeftThigh = 0;
var g_frontLeftCalf = 0;
var g_frontLeftHoof = 0;
var g_frontRightThigh = 0;
var g_frontRightCalf = 0;
var g_frontRightHoof = 0;
var g_backLeftThigh = 0;
var g_backLeftCalf = 0;
var g_backLeftHoof = 0;
var g_backRightThigh = 0;
var g_backRightCalf = 0;
var g_backRightHoof = 0;
var g_tailAngle = 0;
var g_earAngle = 0;

// Poke animation
var g_poking = false;
var g_pokeTime = 0;

// Mouse drag
var g_lastMouseX = 0;
var g_lastMouseY = 0;
var g_mouseDown = false;

// FPS
var g_frameCount = 0;
var g_lastFPSTime = performance.now();

// --- Color Palette 
var COLOR_BODY = [1.0, 0.72, 0.77, 1.0];        // Light pink
var COLOR_HEAD = [1.0, 0.72, 0.77, 1.0];        // Light pink
var COLOR_SNOUT = [0.96, 0.60, 0.66, 1.0];      // Darker pink
var COLOR_EAR = [1.0, 0.65, 0.72, 1.0];         // Ear pink
var COLOR_EYE = [0.1, 0.05, 0.05, 1.0];         // Near black
var COLOR_HOOF = [0.35, 0.18, 0.20, 1.0];       // Dark brownish-pink
var COLOR_CALF = [1.0, 0.55, 0.65, 1.0];        // Slightly darker pink
var COLOR_TAIL = [1.0, 0.65, 0.72, 1.0];        // Pink

// --- WebGL Variables ---
var gl;
var canvas;
var program;
var a_Position;
var u_ModelMatrix;
var u_GlobalRotation;
var u_Color;

// Buffer handles
var cubeBuffer;
var sphereBuffer;
var cubeVertexCount;
var sphereVertexCount;

// Pre-allocated matrix for performance 
var g_matrix = new Matrix4();
var g_globalRotationMatrix = new Matrix4();

// Leg matrices for hierarchical transforms
var g_flCalfMatrix = new Matrix4();
var g_frCalfMatrix = new Matrix4();
var g_blCalfMatrix = new Matrix4();
var g_brCalfMatrix = new Matrix4();
var g_flHoofMatrix = new Matrix4();
var g_frHoofMatrix = new Matrix4();
var g_blHoofMatrix = new Matrix4();
var g_brHoofMatrix = new Matrix4();

// --- Main Entry Point ---
function main() {
  setupWebGL();
  connectVariablesToGLSL();
  createGeometryBuffers();
  setupEventListeners();
  renderScene();
}

// --- WebGL Setup ---
function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl');
  
  if (!gl) {
    console.log('Failed to get WebGL context');
    return;
  }
  
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  // Vertex shader 
  var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotation;
    
    void main() {
      gl_Position = u_GlobalRotation * u_ModelMatrix * a_Position;
    }
  `;
  
  // Fragment shader 
  var FSHADER_SOURCE = `
    precision mediump float;
    uniform vec4 u_Color;
    
    void main() {
      gl_FragColor = u_Color;
    }
  `;
  
  program = createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE);
  if (!program) {
    console.log('Failed to create program');
    return;
  }
  
  gl.useProgram(program);
  
  // Get attribute and uniform locations
  a_Position = gl.getAttribLocation(program, 'a_Position');
  u_ModelMatrix = gl.getUniformLocation(program, 'u_ModelMatrix');
  u_GlobalRotation = gl.getUniformLocation(program, 'u_GlobalRotation');
  u_Color = gl.getUniformLocation(program, 'u_Color');
}

// --- Geometry Creation ---
// Pre-build cube and sphere at startup for performance
function createGeometryBuffers() {
  // Create cube vertices
  var cubeVerts = createCubeVertices();
  cubeVertexCount = cubeVerts.length / 3;
  
  cubeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cubeVerts, gl.STATIC_DRAW);
  
  // Create sphere vertices for snout 
  var sphereVerts = createSphereVertices();
  sphereVertexCount = sphereVerts.length / 3;
  
  sphereBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sphereVerts, gl.STATIC_DRAW);
}

function createCubeVertices() {
  // Unit cube: 8 vertices at +-0.5, 36 vertices (12 triangles)
  var vertices = new Float32Array([
    // Front face
    -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,
    -0.5, -0.5,  0.5,   0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,
    // Back face
    -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,
    -0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5, -0.5, -0.5,
    // Top face
    -0.5,  0.5, -0.5,  -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,
    -0.5,  0.5, -0.5,   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,
    // Bottom face
    -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5,
    -0.5, -0.5, -0.5,   0.5, -0.5,  0.5,  -0.5, -0.5,  0.5,
    // Right face
     0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5,
     0.5, -0.5, -0.5,   0.5,  0.5,  0.5,   0.5, -0.5,  0.5,
    // Left face
    -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,
    -0.5, -0.5, -0.5,  -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5,
  ]);
  return vertices;
}

function createSphereVertices() {
  // UV sphere with 8 stacks and 8 slices
  var stacks = 8;
  var slices = 8;
  var vertices = [];
  var indices = [];
  
  // Generate vertices
  for (var i = 0; i <= stacks; i++) {
    var phi = Math.PI * i / stacks;
    for (var j = 0; j <= slices; j++) {
      var theta = 2 * Math.PI * j / slices;
      var x = Math.sin(phi) * Math.cos(theta);
      var y = Math.cos(phi);
      var z = Math.sin(phi) * Math.sin(theta);
      vertices.push(x, y, z);
    }
  }
  
  // Generate triangle indices
  for (var i = 0; i < stacks; i++) {
    for (var j = 0; j < slices; j++) {
      var first = (i * (slices + 1)) + j;
      var second = first + slices + 1;
      
      indices.push(first, second, first + 1);
      indices.push(second, second + 1, first + 1);
    }
  }
  
  // Convert indices to vertex array
  var verts = [];
  for (var i = 0; i < indices.length; i++) {
    var idx = indices[i];
    verts.push(vertices[idx*3], vertices[idx*3+1], vertices[idx*3+2]);
  }
  
  return new Float32Array(verts);
}

// --- Drawing Functions
function drawCube(matrix, color) {
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  
  gl.uniformMatrix4fv(u_ModelMatrix, false, matrix.elements);
  gl.uniform4fv(u_Color, color);
  
  gl.drawArrays(gl.TRIANGLES, 0, cubeVertexCount);
}

function drawSphere(matrix, color) {
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  
  gl.uniformMatrix4fv(u_ModelMatrix, false, matrix.elements);
  gl.uniform4fv(u_Color, color);
  
  gl.drawArrays(gl.TRIANGLES, 0, sphereVertexCount);
}

// --- Main Render Function 
// ALL drawing happens here
function renderScene() {
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  // Global rotation 
  g_globalRotationMatrix.setIdentity();
  g_globalRotationMatrix.rotate(g_globalAngleY, 0, 1, 0);  // Y first
  g_globalRotationMatrix.rotate(g_globalAngleX, 1, 0, 0);  // X second
  gl.uniformMatrix4fv(u_GlobalRotation, false, g_globalRotationMatrix.elements);
  
  // Poke animation body bob
  var bodyBob = 0;
  if (g_poking) {
    bodyBob = 0.05 * Math.sin(g_pokeTime * 0.3);
  }
  
  // === BODY ===
  g_matrix.setIdentity();
  g_matrix.translate(0.05, 0.05 + bodyBob, 0);
  g_matrix.scale(0.9, 0.45, 0.55);
  drawCube(g_matrix, COLOR_BODY);
  
  // === HEAD ===
  g_matrix.setIdentity();
  g_matrix.translate(0.55, 0.12 + bodyBob, 0);
  g_matrix.scale(0.42, 0.36, 0.35);
  drawCube(g_matrix, COLOR_HEAD);
  
  // === SNOUT ===
  g_matrix.setIdentity();
  g_matrix.translate(0.9, 0.05 + bodyBob, 0);
  g_matrix.scale(0.14, 0.12, 0.1);
  drawSphere(g_matrix, COLOR_SNOUT);
  
  // === EARS ===
  // Left Ear
  g_matrix.setIdentity();
  g_matrix.translate(0.45, 0.32 + bodyBob, -0.18);
  g_matrix.rotate(g_earAngle, 0, 0, 1);
  g_matrix.rotate(-15, 1, 0, 0);
  g_matrix.scale(0.08, 0.16, 0.05);
  drawCube(g_matrix, COLOR_EAR);
  
  // Right Ear
  g_matrix.setIdentity();
  g_matrix.translate(0.45, 0.32 + bodyBob, 0.18);
  g_matrix.rotate(-g_earAngle, 0, 0, 1);
  g_matrix.rotate(-15, 1, 0, 0);
  g_matrix.scale(0.08, 0.16, 0.05);
  drawCube(g_matrix, COLOR_EAR);
  
  // === EYES ===
  // Left Eye - draw on left side of head
  g_matrix.setIdentity();
  g_matrix.translate(0.58, 0.22 + bodyBob, -0.18);
  g_matrix.scale(0.06, 0.06, 0.04);
  drawCube(g_matrix, COLOR_EYE);

  // Right Eye - draw on right side of head
  g_matrix.setIdentity();
  g_matrix.translate(0.58, 0.22 + bodyBob, 0.18);
  g_matrix.scale(0.06, 0.06, 0.04);
  drawCube(g_matrix, COLOR_EYE);
  
  // === TAIL ===
  g_matrix.setIdentity();
  g_matrix.translate(-0.45, 0.2 + bodyBob, 0);
  g_matrix.rotate(g_tailAngle, 0, 1, 0);
  g_matrix.rotate(90, 0, 0, 1);
  g_matrix.scale(0.03, 0.15, 0.03);
  drawCube(g_matrix, COLOR_TAIL);
  
  // === LEGS ===
  drawLegs(bodyBob);
}

// --- Hierarchical Leg Drawing ---
function drawLegs(bodyBob) {
  var bodyBottom = -0.175 + bodyBob;
  var thighHeight = 0.28;
  var calfHeight = 0.24;
  var hoofHeight = 0.1;
  
  // === FRONT LEFT LEG ===
  // Thigh (Level 1) - pivot at top, extend down
  g_matrix.setIdentity();
  g_matrix.translate(0.35, bodyBottom, 0.25);  // Attachment point
  g_matrix.translate(0, -thighHeight/2, 0);  // Move to top of thigh
  g_matrix.rotate(g_frontLeftThigh, 1, 0, 0);
  g_matrix.translate(0, thighHeight/2, 0);   // Pivot back
  g_matrix.scale(0.14, thighHeight, 0.14);
  drawCube(g_matrix, COLOR_BODY);
  
  // Calf (Level 2) - copy thigh, undo scale, translate to bottom, rotate, scale
  g_flCalfMatrix.set(g_matrix);
  g_flCalfMatrix.scale(1/0.14, 1/thighHeight, 1/0.14);
  g_flCalfMatrix.translate(0, -thighHeight/2, 0);  // Move to bottom of thigh
  g_flCalfMatrix.rotate(g_frontLeftCalf, 1, 0, 0);
  g_flCalfMatrix.scale(0.12, calfHeight, 0.12);
  drawCube(g_flCalfMatrix, COLOR_CALF);
  
  // Hoof (Level 3) - copy calf, undo scale, translate to bottom, rotate, scale
  g_flHoofMatrix.set(g_flCalfMatrix);
  g_flHoofMatrix.scale(1/0.12, 1/calfHeight, 1/0.12);
  g_flHoofMatrix.translate(0, -calfHeight/2, 0);  // Move to bottom of calf
  g_flHoofMatrix.rotate(g_frontLeftHoof, 1, 0, 0);
  g_flHoofMatrix.scale(0.15, hoofHeight, 0.18);
  drawCube(g_flHoofMatrix, COLOR_HOOF);
  
  // === FRONT RIGHT LEG ===
  g_matrix.setIdentity();
  g_matrix.translate(0.35, bodyBottom, -0.25);
  g_matrix.translate(0, -thighHeight/2, 0);
  g_matrix.rotate(g_frontRightThigh, 1, 0, 0);
  g_matrix.translate(0, thighHeight/2, 0);
  g_matrix.scale(0.14, thighHeight, 0.14);
  drawCube(g_matrix, COLOR_BODY);
  
  g_frCalfMatrix.set(g_matrix);
  g_frCalfMatrix.scale(1/0.14, 1/thighHeight, 1/0.14);
  g_frCalfMatrix.translate(0, -thighHeight/2, 0);
  g_frCalfMatrix.rotate(g_frontRightCalf, 1, 0, 0);
  g_frCalfMatrix.scale(0.12, calfHeight, 0.12);
  drawCube(g_frCalfMatrix, COLOR_CALF);
  
  g_frHoofMatrix.set(g_frCalfMatrix);
  g_frHoofMatrix.scale(1/0.12, 1/calfHeight, 1/0.12);
  g_frHoofMatrix.translate(0, -calfHeight/2, 0);
  g_frHoofMatrix.rotate(g_frontRightHoof, 1, 0, 0);
  g_frHoofMatrix.scale(0.15, hoofHeight, 0.18);
  drawCube(g_frHoofMatrix, COLOR_HOOF);
  
  // === BACK LEFT LEG ===
  g_matrix.setIdentity();
  g_matrix.translate(-0.35, bodyBottom, 0.25);
  g_matrix.translate(0, -thighHeight/2, 0);
  g_matrix.rotate(g_backLeftThigh, 1, 0, 0);
  g_matrix.translate(0, thighHeight/2, 0);
  g_matrix.scale(0.14, thighHeight, 0.14);
  drawCube(g_matrix, COLOR_BODY);
  
  g_blCalfMatrix.set(g_matrix);
  g_blCalfMatrix.scale(1/0.14, 1/thighHeight, 1/0.14);
  g_blCalfMatrix.translate(0, -thighHeight/2, 0);
  g_blCalfMatrix.rotate(g_backLeftCalf, 1, 0, 0);
  g_blCalfMatrix.scale(0.12, calfHeight, 0.12);
  drawCube(g_blCalfMatrix, COLOR_CALF);
  
  g_blHoofMatrix.set(g_blCalfMatrix);
  g_blHoofMatrix.scale(1/0.12, 1/calfHeight, 1/0.12);
  g_blHoofMatrix.translate(0, -calfHeight/2, 0);
  g_blHoofMatrix.rotate(g_backLeftHoof, 1, 0, 0);
  g_blHoofMatrix.scale(0.15, hoofHeight, 0.18);
  drawCube(g_blHoofMatrix, COLOR_HOOF);
  
  // === BACK RIGHT LEG ===
  g_matrix.setIdentity();
  g_matrix.translate(-0.35, bodyBottom, -0.25);
  g_matrix.translate(0, -thighHeight/2, 0);
  g_matrix.rotate(g_backRightThigh, 1, 0, 0);
  g_matrix.translate(0, thighHeight/2, 0);
  g_matrix.scale(0.14, thighHeight, 0.14);
  drawCube(g_matrix, COLOR_BODY);
  
  g_brCalfMatrix.set(g_matrix);
  g_brCalfMatrix.scale(1/0.14, 1/thighHeight, 1/0.14);
  g_brCalfMatrix.translate(0, -thighHeight/2, 0);
  g_brCalfMatrix.rotate(g_backRightCalf, 1, 0, 0);
  g_brCalfMatrix.scale(0.12, calfHeight, 0.12);
  drawCube(g_brCalfMatrix, COLOR_CALF);
  
  g_brHoofMatrix.set(g_brCalfMatrix);
  g_brHoofMatrix.scale(1/0.12, 1/calfHeight, 1/0.12);
  g_brHoofMatrix.translate(0, -calfHeight/2, 0);
  g_brHoofMatrix.rotate(g_backRightHoof, 1, 0, 0);
  g_brHoofMatrix.scale(0.15, hoofHeight, 0.18);
  drawCube(g_brHoofMatrix, COLOR_HOOF);
}

// --- Animation Update ---
function updateAnimationAngles() {
  if (!g_animating) return;
  
  var t = g_time / 1000;  // seconds
  var walkSpeed = 2.5;
  var phase = walkSpeed * t;
  
  // Thighs - smaller swing for natural walk (+-15 degrees)
  g_frontLeftThigh = 15 * Math.sin(phase);
  g_backRightThigh = 15 * Math.sin(phase);
  g_frontRightThigh = -15 * Math.sin(phase);
  g_backLeftThigh = -15 * Math.sin(phase);
  
  // Calves - symmetric bend (not asymmetric kick)
  g_frontLeftCalf = 10 * Math.sin(phase - 0.3);
  g_backRightCalf = 10 * Math.sin(phase - 0.3);
  g_frontRightCalf = -10 * Math.sin(phase - 0.3);
  g_backLeftCalf = -10 * Math.sin(phase - 0.3);
  
  // Hoofs - small opposite movement to thighs
  g_frontLeftHoof = -5 * Math.sin(phase);
  g_backRightHoof = -5 * Math.sin(phase);
  g_frontRightHoof = 5 * Math.sin(phase);
  g_backLeftHoof = 5 * Math.sin(phase);
  
  // Tail wag
  g_tailAngle = 15 * Math.sin(3 * t);
  
  // Ear wiggle
  g_earAngle = 4 * Math.sin(1.5 * t);
}

// --- Poke Animation Handler ---
function handlePokeAnimation() {
  if (!g_poking) return;
  
  g_pokeTime++;
  
  // Ears flap rapidly
  g_earAngle = 30 * Math.sin(g_pokeTime * 0.5);
  
  // Tail spins
  g_tailAngle = g_pokeTime * 5;
  
  // After 90 frames, reset 
  if (g_pokeTime > 90) {
    g_poking = false;
    g_pokeTime = 0;
    g_earAngle = 0;
    g_tailAngle = 20;
  }
}

// --- Animation Loop ---
function tick() {
  // Update FPS 
  g_frameCount++;
  var now = performance.now();
  if (now - g_lastFPSTime >= 1000) {
    document.getElementById('fps').textContent = 'FPS: ' + g_frameCount;
    g_frameCount = 0;
    g_lastFPSTime = now;
  }
  
  g_time = g_time + 16;
  
  updateAnimationAngles();
  handlePokeAnimation();
  renderScene();
  
  if (g_animating || g_poking) {
    requestAnimationFrame(tick);
  }
}

// --- Event Listeners ---
function setupEventListeners() {
  // Global rotation sliders
  document.getElementById('globalRotX').addEventListener('input', function(e) {
    g_globalAngleX = parseFloat(e.target.value);
    renderScene();
  });
  
  document.getElementById('globalRotY').addEventListener('input', function(e) {
    g_globalAngleY = parseFloat(e.target.value);
    renderScene();
  });
  
  // Animation button (per MD lines 232-236)
  document.getElementById('animBtn').addEventListener('click', function() {
    g_animating = !g_animating;
    document.getElementById('animBtn').textContent = 
      g_animating ? 'Stop Animation' : 'Start Animation';
    
    if (g_animating && !g_poking) {
      tick();
    }
  });
  
  // Leg sliders - Front Left
  document.getElementById('flThigh').addEventListener('input', function(e) {
    g_frontLeftThigh = parseFloat(e.target.value);
    renderScene();
  });
  document.getElementById('flCalf').addEventListener('input', function(e) {
    g_frontLeftCalf = parseFloat(e.target.value);
    renderScene();
  });
  document.getElementById('flHoof').addEventListener('input', function(e) {
    g_frontLeftHoof = parseFloat(e.target.value);
    renderScene();
  });
  
  // Leg sliders - Front Right
  document.getElementById('frThigh').addEventListener('input', function(e) {
    g_frontRightThigh = parseFloat(e.target.value);
    renderScene();
  });
  document.getElementById('frCalf').addEventListener('input', function(e) {
    g_frontRightCalf = parseFloat(e.target.value);
    renderScene();
  });
  document.getElementById('frHoof').addEventListener('input', function(e) {
    g_frontRightHoof = parseFloat(e.target.value);
    renderScene();
  });
  
  // Leg sliders - Back Left
  document.getElementById('blThigh').addEventListener('input', function(e) {
    g_backLeftThigh = parseFloat(e.target.value);
    renderScene();
  });
  document.getElementById('blCalf').addEventListener('input', function(e) {
    g_backLeftCalf = parseFloat(e.target.value);
    renderScene();
  });
  document.getElementById('blHoof').addEventListener('input', function(e) {
    g_backLeftHoof = parseFloat(e.target.value);
    renderScene();
  });
  
  // Leg sliders - Back Right
  document.getElementById('brThigh').addEventListener('input', function(e) {
    g_backRightThigh = parseFloat(e.target.value);
    renderScene();
  });
  document.getElementById('brCalf').addEventListener('input', function(e) {
    g_backRightCalf = parseFloat(e.target.value);
    renderScene();
  });
  document.getElementById('brHoof').addEventListener('input', function(e) {
    g_backRightHoof = parseFloat(e.target.value);
    renderScene();
  });
  
  // Tail and ears
  document.getElementById('tail').addEventListener('input', function(e) {
    g_tailAngle = parseFloat(e.target.value);
    renderScene();
  });
  document.getElementById('ears').addEventListener('input', function(e) {
    g_earAngle = parseFloat(e.target.value);
    renderScene();
  });
  
  // Mouse rotation 
  canvas.addEventListener('mousedown', function(ev) {
    if (ev.shiftKey) {
      // Poke animation 
      // Only start if not already poking
      if (!g_poking) {
        g_poking = true;
        g_pokeTime = 0;
        if (!g_animating) {
          tick();
        }
      }
    } else {
      // Start drag
      g_mouseDown = true;
      g_lastMouseX = ev.clientX;
      g_lastMouseY = ev.clientY;
    }
  });
  
  canvas.addEventListener('mousemove', function(ev) {
    if (!g_mouseDown) return;
    
    var dx = ev.clientX - g_lastMouseX;
    var dy = ev.clientY - g_lastMouseY;
    
    g_globalAngleY += dx * 0.5;
    g_globalAngleX += dy * 0.5;
    
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
    
    // Update sliders
    document.getElementById('globalRotX').value = g_globalAngleX;
    document.getElementById('globalRotY').value = g_globalAngleY;
    
    renderScene();
  });
  
  canvas.addEventListener('mouseup', function() {
    g_mouseDown = false;
  });
  
  canvas.addEventListener('mouseleave', function() {
    g_mouseDown = false;
  });
}
