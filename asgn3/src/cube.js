// cube.js
class Cube {
  constructor() {
    this.type   = 'cube';
    this.color  = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.textureNum = 0;
    this.texWeight  = 1.0;
  }

  static buildVertices() {
    const v = [
      -0.5,-0.5, 0.5,  0,0,
       0.5,-0.5, 0.5,  1,0,
       0.5, 0.5, 0.5,  1,1,
      -0.5,-0.5, 0.5,  0,0,
       0.5, 0.5, 0.5,  1,1,
      -0.5, 0.5, 0.5,  0,1,
       0.5,-0.5,-0.5,  0,0,
      -0.5,-0.5,-0.5,  1,0,
      -0.5, 0.5,-0.5,  1,1,
       0.5,-0.5,-0.5,  0,0,
      -0.5, 0.5,-0.5,  1,1,
       0.5, 0.5,-0.5,  0,1,
      -0.5,-0.5,-0.5,  0,0,
      -0.5,-0.5, 0.5,  1,0,
      -0.5, 0.5, 0.5,  1,1,
      -0.5,-0.5,-0.5,  0,0,
      -0.5, 0.5, 0.5,  1,1,
      -0.5, 0.5,-0.5,  0,1,
       0.5,-0.5, 0.5,  0,0,
       0.5,-0.5,-0.5,  1,0,
       0.5, 0.5,-0.5,  1,1,
       0.5,-0.5, 0.5,  0,0,
       0.5, 0.5,-0.5,  1,1,
       0.5, 0.5, 0.5,  0,1,
      -0.5, 0.5, 0.5,  0,0,
       0.5, 0.5, 0.5,  1,0,
       0.5, 0.5,-0.5,  1,1,
      -0.5, 0.5, 0.5,  0,0,
       0.5, 0.5,-0.5,  1,1,
      -0.5, 0.5,-0.5,  0,1,
      -0.5,-0.5,-0.5,  0,0,
       0.5,-0.5,-0.5,  1,0,
       0.5,-0.5, 0.5,  1,1,
      -0.5,-0.5,-0.5,  0,0,
       0.5,-0.5, 0.5,  1,1,
      -0.5,-0.5, 0.5,  0,1,
    ];
    return new Float32Array(v);
  }

  render(gl, a_Position, a_TexCoord, u_ModelMatrix, u_BaseColor, u_TexColorWeight, u_TexUnit) {
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    gl.uniform4fv(u_BaseColor, this.color);
    gl.uniform1f(u_TexColorWeight, this.texWeight);
    gl.uniform1i(u_TexUnit, this.textureNum);

    const verts = Cube.buildVertices();
    const FSIZE = verts.BYTES_PER_ELEMENT;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 5, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 5, FSIZE * 3);
    gl.enableVertexAttribArray(a_TexCoord);

    gl.drawArrays(gl.TRIANGLES, 0, 36);
    gl.deleteBuffer(buf);
  }
}