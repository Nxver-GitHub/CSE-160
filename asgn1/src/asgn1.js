// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform float u_Size;\n' +       
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  gl_PointSize = u_Size;\n' +    
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

// Global variables 
var canvas;
var gl;
var a_Position;
var u_FragColor;
var u_Size;
var g_shapesList = [];
var g_selectedType = 'point';

class Point {
  constructor() {
    this.position = [0, 0];
    this.color    = [1.0, 1.0, 1.0, 1.0];
    this.size     = 10;
  }

  render() {
    gl.vertexAttrib3f(a_Position, this.position[0], this.position[1], 0.0);
    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    gl.uniform1f(u_Size, this.size);
    gl.drawArrays(gl.POINTS, 0, 1);
  }
}

class Triangle {
  constructor() {
    this.position = [0, 0];
    this.color    = [1.0, 1.0, 1.0, 1.0];
    this.size     = 10;
  }

  render() {
    var x = this.position[0];
    var y = this.position[1];
    var d = this.size * 0.01; // scale size to WebGL coords

    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
    drawTriangle([x, y + d, x - d, y - d, x + d, y - d]);
  }
}

class Circle {
  constructor() {
    this.position = [0, 0];
    this.color    = [1.0, 1.0, 1.0, 1.0];
    this.size     = 10;
    this.segments = 10; // number of triangle segments
  }

  render() {
    var x = this.position[0];
    var y = this.position[1];
    var r = this.size * 0.01; // radius in WebGL coords

    gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);

    // Draw circle as a fan of triangles
    var angleStep = (2 * Math.PI) / this.segments;
    for (var i = 0; i < this.segments; i++) {
      var angle1 = i * angleStep;
      var angle2 = (i + 1) * angleStep;
      drawTriangle([
        x, y,                                           // center
        x + r * Math.cos(angle1), y + r * Math.sin(angle1), // point 1
        x + r * Math.cos(angle2), y + r * Math.sin(angle2)  // point 2
      ]);
    }
  }
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();

  // Draw on click and on drag
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) {
    if (ev.buttons == 1) {  // only draw if left mouse button is held
      click(ev);
    }
  };
  
  // Point button
  document.getElementById('pointBtn').onclick    = function() { g_selectedType = 'point'; };
  
  // Triangle button
  document.getElementById('triangleBtn').onclick = function() { g_selectedType = 'triangle'; };

  // Circle button
  document.getElementById('circleBtn').onclick = function() { g_selectedType = 'circle'; };

  // My drawing button
  document.getElementById('drawPictureBtn').onclick = function() {
    drawMyPicture();
  };

  // Clear button
  document.getElementById('clearButton').onclick = function() {
    g_shapesList = [];
    renderAllShapes();
  };
  
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

// Get canvas and gl content
function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

// Compile shader programs, attach js vars to GLSL vars
function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  // Get position attribute
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get color uniform
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get size uniform
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

// Function to handle clicks
function click(ev) {
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

  var shape;
  if (g_selectedType == 'point') {
    shape = new Point();
  } else if (g_selectedType == 'triangle') {
    shape = new Triangle();
  } else if (g_selectedType == 'circle') {
    shape = new Circle();
    shape.segments = document.getElementById('segmentSlider').value;
  }

  shape.position = [x, y];
  shape.color = [
    document.getElementById('redSlider').value / 255,
    document.getElementById('greenSlider').value / 255,
    document.getElementById('blueSlider').value / 255,
    document.getElementById('alphaSlider').value / 100  
  ];
  shape.size = document.getElementById('sizeSlider').value;

  g_shapesList.push(shape);
  renderAllShapes();
}

// Draw all the shapes 
function renderAllShapes() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  for (var i = 0; i < g_shapesList.length; i++) {
    g_shapesList[i].render();
  }
}

// Draw triangles
function drawTriangle(vertices) {
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.disableVertexAttribArray(a_Position);
}

// Draw my picture from paper
function drawMyPicture() {
  // Sky
  gl.uniform4f(u_FragColor, 0.53, 0.81, 0.98, 1.0);
  drawTriangle([-1.0, -0.3,  1.0, -0.3, -1.0,  1.0]);
  drawTriangle([ 1.0, -0.3,  1.0,  1.0, -1.0,  1.0]);

  // Ground
  gl.uniform4f(u_FragColor, 0.13, 0.55, 0.13, 1.0);
  drawTriangle([-1.0, -0.3,  1.0, -0.3, -1.0, -1.0]);
  drawTriangle([ 1.0, -0.3,  1.0, -1.0, -1.0, -1.0]);

  // 5 Large mountains (2 go off canvas edges)
  gl.uniform4f(u_FragColor, 0.50, 0.50, 0.55, 1.0);
  drawTriangle([-1.00, -0.3, -0.78,  0.65, -0.50, -0.3]); // L1 off-left
  drawTriangle([-0.63, -0.3, -0.37,  0.62, -0.10, -0.3]); // L2
  drawTriangle([-0.23, -0.3,  0.05,  0.64,  0.33, -0.3]); // L3
  drawTriangle([ 0.20, -0.3,  0.47,  0.61,  0.73, -0.3]); // L4
  drawTriangle([ 0.60, -0.3,  0.83,  0.64,  1.00, -0.3]); // L5 off-right

  // Large snow caps
  gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
  drawTriangle([-0.84, 0.45, -0.78, 0.65, -0.72, 0.45]);
  drawTriangle([-0.43, 0.42, -0.37, 0.62, -0.31, 0.42]);
  drawTriangle([-0.01, 0.44,  0.05, 0.64,  0.11, 0.44]);
  drawTriangle([ 0.41, 0.41,  0.47, 0.61,  0.53, 0.41]);
  drawTriangle([ 0.77, 0.43,  0.83, 0.64,  0.89, 0.43]);

  // 4 Medium mountains (in valleys between large)
  gl.uniform4f(u_FragColor, 0.42, 0.42, 0.47, 1.0);
  drawTriangle([-0.65, -0.3, -0.57,  0.20, -0.48, -0.3]); // M1
  drawTriangle([-0.26, -0.3, -0.17,  0.18, -0.07, -0.3]); // M2
  drawTriangle([ 0.17, -0.3,  0.27,  0.20,  0.36, -0.3]); // M3
  drawTriangle([ 0.57, -0.3,  0.67,  0.17,  0.76, -0.3]); // M4

  // Medium snow caps
  gl.uniform4f(u_FragColor, 0.92, 0.92, 0.92, 1.0);
  drawTriangle([-0.61, 0.10, -0.57, 0.20, -0.53, 0.10]);
  drawTriangle([-0.21, 0.08, -0.17, 0.18, -0.13, 0.08]);
  drawTriangle([ 0.22, 0.10,  0.27, 0.20,  0.32, 0.10]);
  drawTriangle([ 0.62, 0.07,  0.67, 0.17,  0.72, 0.07]);

  // 8 Small mountains (1 on each side of each medium mountain)
  gl.uniform4f(u_FragColor, 0.35, 0.35, 0.40, 1.0);
  drawTriangle([-0.74, -0.3, -0.69, 0.08, -0.64, -0.3]); // left of M1
  drawTriangle([-0.49, -0.3, -0.44, 0.08, -0.39, -0.3]); // right of M1
  drawTriangle([-0.35, -0.3, -0.30, 0.08, -0.25, -0.3]); // left of M2
  drawTriangle([-0.08, -0.3, -0.03, 0.08,  0.02, -0.3]); // right of M2
  drawTriangle([ 0.09, -0.3,  0.14, 0.08,  0.19, -0.3]); // left of M3
  drawTriangle([ 0.34, -0.3,  0.39, 0.08,  0.44, -0.3]); // right of M3
  drawTriangle([ 0.49, -0.3,  0.54, 0.06,  0.59, -0.3]); // left of M4
  drawTriangle([ 0.74, -0.3,  0.79, 0.06,  0.84, -0.3]); // right of M4

  // Sun - diamond body (yellow)
  gl.uniform4f(u_FragColor, 1.0, 0.90, 0.0, 1.0);
  drawTriangle([0.75, 0.95,  0.60, 0.75,  0.90, 0.75]); // top half diamond
  drawTriangle([0.75, 0.55,  0.60, 0.75,  0.90, 0.75]); // bottom half diamond

  // Rays - each tip touches diamond body (orange)
  gl.uniform4f(u_FragColor, 1.0, 0.60, 0.0, 1.0);

  // Top ray
  drawTriangle([0.75, 0.95,  0.68, 1.00,  0.82, 1.00]);
  // Bottom ray
  drawTriangle([0.75, 0.55,  0.68, 0.50,  0.82, 0.50]);
  // Left ray
  drawTriangle([0.60, 0.75,  0.50, 0.82,  0.50, 0.68]);
  // Right ray
  drawTriangle([0.90, 0.75,  1.00, 0.82,  1.00, 0.68]);
  // Top-left ray
  drawTriangle([0.63, 0.88,  0.52, 0.97,  0.58, 0.97]);
  // Top-right ray
  drawTriangle([0.87, 0.88,  0.92, 0.97,  0.98, 0.97]);
  // Bottom-left ray
  drawTriangle([0.63, 0.62,  0.52, 0.53,  0.58, 0.53]);
  // Bottom-right ray
  drawTriangle([0.87, 0.62,  0.92, 0.53,  0.98, 0.53]);

  // ---------------------------------------------
  // "S" initial (Navy blue)
  // ---------------------------------------------
  gl.uniform4f(u_FragColor, 0.0, 0.0, 0.5, 1.0);

  // Top horizontal bar
  drawTriangle([-0.90, -0.40,  -0.60, -0.40,  -0.90, -0.48]);
  drawTriangle([-0.60, -0.40,  -0.60, -0.48,  -0.90, -0.48]);
  
  // Top-left vertical drop
  drawTriangle([-0.90, -0.48,  -0.82, -0.48,  -0.90, -0.60]);
  drawTriangle([-0.82, -0.48,  -0.82, -0.60,  -0.90, -0.60]);
  
  // Middle horizontal bar
  drawTriangle([-0.90, -0.60,  -0.60, -0.60,  -0.90, -0.68]);
  drawTriangle([-0.60, -0.60,  -0.60, -0.68,  -0.90, -0.68]);
  
  // Bottom-right vertical drop
  drawTriangle([-0.68, -0.68,  -0.60, -0.68,  -0.68, -0.80]);
  drawTriangle([-0.60, -0.68,  -0.60, -0.80,  -0.68, -0.80]);
  
  // Bottom horizontal bar
  drawTriangle([-0.90, -0.80,  -0.60, -0.80,  -0.90, -0.88]);
  drawTriangle([-0.60, -0.80,  -0.60, -0.88,  -0.90, -0.88]);

  // ---------------------------------------------
  // "P" initial (Navy blue)
  // ---------------------------------------------
  
  // Main vertical stem (left side of P)
  drawTriangle([-0.45, -0.40,  -0.37, -0.40,  -0.45, -0.88]);
  drawTriangle([-0.37, -0.40,  -0.37, -0.88,  -0.45, -0.88]);
  
  // Top horizontal bar of the loop
  drawTriangle([-0.37, -0.40,  -0.15, -0.40,  -0.37, -0.48]);
  drawTriangle([-0.15, -0.40,  -0.15, -0.48,  -0.37, -0.48]);
  
  // Right vertical drop of the loop
  drawTriangle([-0.23, -0.48,  -0.15, -0.48,  -0.23, -0.60]);
  drawTriangle([-0.15, -0.48,  -0.15, -0.60,  -0.23, -0.60]);
  
  // Bottom horizontal bar of the loop
  drawTriangle([-0.37, -0.60,  -0.15, -0.60,  -0.37, -0.68]);
  drawTriangle([-0.15, -0.60,  -0.15, -0.68,  -0.37, -0.68]);
}