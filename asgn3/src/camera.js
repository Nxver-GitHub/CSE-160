// camera.js
class Camera {
  constructor() {
    this.fov = 60;
    this.eye = new Vector3([0, 1, 5]);
    this.at  = new Vector3([0, 1, 0]);
    this.up  = new Vector3([0, 1, 0]);

    this.viewMatrix       = new Matrix4();
    this.projectionMatrix = new Matrix4();

    this.updateView();
    this.updateProjection();
  }

  updateView() {
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0],  this.at.elements[1],  this.at.elements[2],
      this.up.elements[0],  this.up.elements[1],  this.up.elements[2]
    );
  }

  updateProjection() {
    const canvas = document.getElementById('webgl');
    this.projectionMatrix.setPerspective(
      this.fov,
      canvas.width / canvas.height,
      0.1,
      1000
    );
  }

  moveForward(speed = 0.2) {
    const fx = this.at.elements[0] - this.eye.elements[0];
    const fz = this.at.elements[2] - this.eye.elements[2];
    const len = Math.sqrt(fx*fx + fz*fz);
    if (len === 0) return;
    const nx = fx/len, nz = fz/len;
    this.eye.elements[0] += nx * speed;
    this.eye.elements[2] += nz * speed;
    this.at.elements[0]  += nx * speed;
    this.at.elements[2]  += nz * speed;
    this.updateView();
  }

  moveBackwards(speed = 0.2) {
    const fx = this.eye.elements[0] - this.at.elements[0];
    const fz = this.eye.elements[2] - this.at.elements[2];
    const len = Math.sqrt(fx*fx + fz*fz);
    if (len === 0) return;
    const nx = fx/len, nz = fz/len;
    this.eye.elements[0] += nx * speed;
    this.eye.elements[2] += nz * speed;
    this.at.elements[0]  += nx * speed;
    this.at.elements[2]  += nz * speed;
    this.updateView();
  }

  moveLeft(speed = 0.2) {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);

    let s = Vector3.cross(this.up, f);
    s.normalize();
    s.mul(speed);
    this.eye.add(s);
    this.at.add(s);
    this.updateView();
  }

  moveRight(speed = 0.2) {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);

    let s = Vector3.cross(f, this.up);
    s.normalize();
    s.mul(speed);
    this.eye.add(s);
    this.at.add(s);
    this.updateView();
  }

  panLeft(alpha = 5) {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);

    let rotMat = new Matrix4();
    rotMat.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
    let fPrime = rotMat.multiplyVector3(f);

    this.at.set(this.eye);
    this.at.add(fPrime);
    this.updateView();
  }

  panRight(alpha = 5) {
    this.panLeft(-alpha);
  }

  panByMouse(dx, dy, sensitivity = 0.3) {
    this.panLeft(-dx * sensitivity);

    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);

    let right = Vector3.cross(f, this.up);
    right.normalize();

    let pitchMat = new Matrix4();
    pitchMat.setRotate(dy * sensitivity, right.elements[0], right.elements[1], right.elements[2]);
    let fPrime = pitchMat.multiplyVector3(f);
    fPrime.normalize();

    let dot = fPrime.elements[1];
    if (Math.abs(dot) < 0.99) {
      this.at.set(this.eye);
      this.at.add(fPrime);
      this.updateView();
    }
  }
}