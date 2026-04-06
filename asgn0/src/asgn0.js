// asgn0.js
let canvas;
let ctx;

function main() {  
  // Retrieve <canvas> element
  canvas = document.getElementById('example');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  // Get the rendering context for 2DCG
  ctx = canvas.getContext('2d');

  // Draw a black rectangle
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set color to black
  ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill a rectangle with the color
  
  // Create v1 as a Vector3
  let v1 = new Vector3([2.25, 2.25, 0]);
  drawVector(v1, "red");
}

// Draw vector function
function drawVector(v, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  
  ctx.beginPath();
  let centerX = canvas.width / 2;
  let centerY = canvas.height / 2;

  ctx.moveTo(centerX, centerY);

  let endX = centerX + v.elements[0] * 20;
  let endY = centerY - v.elements[1] * 20;

  ctx.lineTo(endX, endY);
  ctx.stroke();
}


// Draw function
function handleDrawEvent() {
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let x1 = Number(document.getElementById('xForV1').value);
  let y1 = Number(document.getElementById('yForV1').value);
  let v1 = new Vector3([x1, y1, 0]);
  drawVector(v1, "red");

  let x2 = Number(document.getElementById('xForV2').value);
  let y2 = Number(document.getElementById('yForV2').value);
  let v2 = new Vector3([x2, y2, 0]);
  drawVector(v2, "blue");
}

// Helper function for area of a triangle
function areaTriangle(v1, v2) {
  let cross = Vector3.cross(v1, v2);
  let area = cross.magnitude() / 2;
  return area;
}

// Draw operation function
function handleDrawOperationEvent() {
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let x1 = Number(document.getElementById('xForV1').value);
  let y1 = Number(document.getElementById('yForV1').value);
  let v1 = new Vector3([x1, y1, 0]);
  drawVector(v1, "red");

  let x2 = Number(document.getElementById('xForV2').value);
  let y2 = Number(document.getElementById('yForV2').value);
  let v2 = new Vector3([x2, y2, 0]);
  drawVector(v2, "blue");

  let op = document.getElementById('operation').value;
  let scalar = Number(document.getElementById('scalar').value);

  if (op === "add") {
    let v3 = v1.add(v2);
    drawVector(v3, "green");
  } 
  else if (op === "sub") {
    let v3 = v1.sub(v2);
    drawVector(v3, "green");
  } 
  else if (op === "mul") {
    let v3 = v1.mul(scalar);
    let v4 = v2.mul(scalar);
    drawVector(v3, "green");
    drawVector(v4, "green");
  } 
  else if (op === "div") {
    let v3 = v1.div(scalar);
    let v4 = v2.div(scalar);
    drawVector(v3, "green");
    drawVector(v4, "green");
  }

  if (op === "mag") {
    let m1 = v1.magnitude();
    let m2 = v2.magnitude();
    console.log("v1 magnitude:", m1);
    console.log("v2 magnitude:", m2);
  } 
  else if (op === "norm") {
    let n1 = new Vector3(v1.elements);
    let n2 = new Vector3(v2.elements);

    n1.normalize();
    n2.normalize();

    console.log("normalized v1 magnitude:", n1.magnitude());
    console.log("normalized v2 magnitude:", n2.magnitude());

    drawVector(n1, "green");
    drawVector(n2, "green");
  }

  if (op === "angle") {
    let dot = Vector3.dot(v1, v2);
    let m1 = v1.magnitude();
    let m2 = v2.magnitude();

    let cosA = dot / (m1 * m2);
    // Clamp to [-1, 1] to avoid rounding error
    if (cosA > 1) cosA = 1;
    if (cosA < -1) cosA = -1;

    let angleRad = Math.acos(cosA);
    let angleDeg = angleRad * 180 / Math.PI;

    console.log("Angle between v1 and v2 (degrees):", angleDeg);
  }

  if (op === "area") {
    let area = areaTriangle(v1, v2);
    console.log("Area of the triangle:", area);
  }
}