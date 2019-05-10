window.VRPointCloud = (function () {
  "use strict";

  var pointCloudVS = [
    "uniform mat4 projectionMat;",
    "uniform mat4 modelViewMat;",
    "uniform mat3 normalMat;",
    "attribute vec3 position;",
    "attribute vec2 texCoord;",
    "attribute vec3 normal;",
    "attribute vec3 color;",
    "varying vec2 vTexCoord;",
    "varying vec3 vLight;",

    "const vec3 lightDir = vec3(0.75, 0.5, 1.0);",
    "const vec3 ambientColor = vec3(0.2, 0.2, 0.2);",
    "const vec3 lightColor = vec3(0.9, 0.9, 0.9);",

    "void main() {",
    "  vec3 normalRotated = normalMat * normal;",
    "  float lightFactor = max(dot(normalize(lightDir), normalRotated), 0.0);",
    "  vLight = ambientColor + ((lightColor*color) * lightFactor);",
    // "  vLight = ambientColor + (lightColor * lightFactor);",
    "  vTexCoord = texCoord;",
    "  gl_Position = projectionMat * modelViewMat * vec4( position, 1.0 );",
    "}",
  ].join("\n");

  var pointCloudFS = [
    "precision mediump float;",
    "uniform sampler2D diffuse;",
    "varying vec2 vTexCoord;",
    "varying vec3 vLight;",

    "void main() {",
    "  gl_FragColor = vec4(vLight, 1.0);      //* texture2D(diffuse, vTexCoord);",
    "}",
  ].join("\n");


  var PointCloud = function (gl, texture, gridSize, cubeScale, halfOnly, autorotate) {
    this.gl = gl;

    if (!gridSize) {
      gridSize = 10;
    }

    this.statsMat = mat4.create();
    this.normalMat = mat3.create();
    this.heroRotationMat = mat4.create();
    this.heroModelViewMat = mat4.create();
    this.autoRotationMat = mat4.create();
    this.cubesModelViewMat = mat4.create();

    this.texture = texture;

    this.program = new WGLUProgram(gl);
    this.program.attachShaderSource(pointCloudVS, gl.VERTEX_SHADER);
    this.program.attachShaderSource(pointCloudFS, gl.FRAGMENT_SHADER);
    this.program.bindAttribLocation({
      position: 0,
      texCoord: 1,
      normal: 2,
      color: 3,
    });
    this.program.link();

    this.autorotate = autorotate;

    this.cubeVerts = [];
    this.cubeIndices = [];

    // Build a single cube.
    this.appendCube = function(x, y, z, size, r,g,b) {
      if (r==undefined){
        r = 0.0;
        g = 0.0;
        b = 0.0;
      }

      if (!size) size = 0.2;
      if (cubeScale) size *= cubeScale;
      // Bottom
      var idx = this.cubeVerts.length / 11.0;
      this.cubeIndices.push(idx, idx + 1, idx + 2);
      this.cubeIndices.push(idx, idx + 2, idx + 3);
      //                  X         Y         Z         U    V    NX    NY   NZ   R  G  B
      this.cubeVerts.push(x - size, y - size, z - size, 0.0, 1.0, 0.0, -1.0, 0.0, r, g, b);
      this.cubeVerts.push(x + size, y - size, z - size, 1.0, 1.0, 0.0, -1.0, 0.0, r, g, b);
      this.cubeVerts.push(x + size, y - size, z + size, 1.0, 0.0, 0.0, -1.0, 0.0, r, g, b);
      this.cubeVerts.push(x - size, y - size, z + size, 0.0, 0.0, 0.0, -1.0, 0.0, r, g, b);

      // Top
      idx = this.cubeVerts.length / 11.0;
      this.cubeIndices.push(idx, idx + 2, idx + 1);
      this.cubeIndices.push(idx, idx + 3, idx + 2);

      this.cubeVerts.push(x - size, y + size, z - size, 0.0, 0.0, 0.0, 1.0, 0.0, r, g, b);
      this.cubeVerts.push(x + size, y + size, z - size, 1.0, 0.0, 0.0, 1.0, 0.0, r, g, b);
      this.cubeVerts.push(x + size, y + size, z + size, 1.0, 1.0, 0.0, 1.0, 0.0, r, g, b);
      this.cubeVerts.push(x - size, y + size, z + size, 0.0, 1.0, 0.0, 1.0, 0.0, r, g, b);

      // Left
      idx = this.cubeVerts.length / 11.0;
      this.cubeIndices.push(idx, idx + 2, idx + 1);
      this.cubeIndices.push(idx, idx + 3, idx + 2);

      this.cubeVerts.push(x - size, y - size, z - size, 0.0, 1.0, -1.0, 0.0, 0.0, r, g, b);
      this.cubeVerts.push(x - size, y + size, z - size, 0.0, 0.0, -1.0, 0.0, 0.0, r, g, b);
      this.cubeVerts.push(x - size, y + size, z + size, 1.0, 0.0, -1.0, 0.0, 0.0, r, g, b);
      this.cubeVerts.push(x - size, y - size, z + size, 1.0, 1.0, -1.0, 0.0, 0.0, r, g, b);

      // Right
      idx = this.cubeVerts.length / 11.0;
      this.cubeIndices.push(idx, idx + 1, idx + 2);
      this.cubeIndices.push(idx, idx + 2, idx + 3);

      this.cubeVerts.push(x + size, y - size, z - size, 1.0, 1.0, 1.0, 0.0, 0.0, r, g, b);
      this.cubeVerts.push(x + size, y + size, z - size, 1.0, 0.0, 1.0, 0.0, 0.0, r, g, b);
      this.cubeVerts.push(x + size, y + size, z + size, 0.0, 0.0, 1.0, 0.0, 0.0, r, g, b);
      this.cubeVerts.push(x + size, y - size, z + size, 0.0, 1.0, 1.0, 0.0, 0.0, r, g, b);

      // Back
      idx = this.cubeVerts.length / 11.0;
      this.cubeIndices.push(idx, idx + 2, idx + 1);
      this.cubeIndices.push(idx, idx + 3, idx + 2);

      this.cubeVerts.push(x - size, y - size, z - size, 1.0, 1.0, 0.0, 0.0, -1.0, r, g, b);
      this.cubeVerts.push(x + size, y - size, z - size, 0.0, 1.0, 0.0, 0.0, -1.0, r, g, b);
      this.cubeVerts.push(x + size, y + size, z - size, 0.0, 0.0, 0.0, 0.0, -1.0, r, g, b);
      this.cubeVerts.push(x - size, y + size, z - size, 1.0, 0.0, 0.0, 0.0, -1.0, r, g, b);

      // Front
      idx = this.cubeVerts.length / 11.0;
      this.cubeIndices.push(idx, idx + 1, idx + 2);
      this.cubeIndices.push(idx, idx + 2, idx + 3);

      this.cubeVerts.push(x - size, y - size, z + size, 0.0, 1.0, 0.0, 0.0, 1.0, r, g, b);
      this.cubeVerts.push(x + size, y - size, z + size, 1.0, 1.0, 0.0, 0.0, 1.0, r, g, b);
      this.cubeVerts.push(x + size, y + size, z + size, 1.0, 0.0, 0.0, 0.0, 1.0, r, g, b);
      this.cubeVerts.push(x - size, y + size, z + size, 0.0, 0.0, 0.0, 0.0, 1.0, r, g, b);
    }

    // Build the cube sea
    // for (var x = 0; x < gridSize; ++x) {
    //   for (var y = 0; y < gridSize; ++y) {
    //     for (var z = 0; z < gridSize; ++z) {
    //       appendCube(x - (gridSize / 2), y - (gridSize / 2), z - (gridSize / 2));
    //     }
    //   }
    // }

    

    this.vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.cubeVerts), gl.STATIC_DRAW);

    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.cubeIndices), gl.STATIC_DRAW);


    this.render = function (points, colors, projectionMat, modelViewMat, stats, timestamp) {
      var gl = this.gl;
      var program = this.program;

      program.use();


      this.cubeVerts = [];
      this.cubeIndices = [];
      for (let i=0; i<points.length; i++) {
        let p = points[i];
        let c = colors[i];
          this.appendCube(p[0], p[1], p[2], 0.02, c[0], c[1], c[2]);
      }

      this.indexCount = this.cubeIndices.length;
      // Add some "hero cubes" for separate animation.
      this.heroOffset = this.cubeIndices.length;
      // appendCube(0, 0.25, -0.8, 0.05);
      // appendCube(0.8, 0.25, 0, 0.05);
      // appendCube(0, 0.25, 0.8, 0.05);
      // appendCube(-0.8, 0.25, 0, 0.05);
      this.heroCount = this.cubeIndices.length - this.heroOffset;

      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.cubeVerts), gl.STATIC_DRAW);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.cubeIndices), gl.STATIC_DRAW);



      if (this.autorotate && timestamp) {
        mat4.fromRotation(this.autoRotationMat, timestamp / 500, [0, -1, 0]);
        mat4.multiply(this.cubesModelViewMat, modelViewMat, this.autoRotationMat);
        mat3.fromMat4(this.normalMat, this.autoRotationMat);
      } else {
        this.cubesModelViewMat = modelViewMat;
        mat3.identity(this.normalMat);
      }

      gl.uniformMatrix4fv(program.uniform.projectionMat, false, projectionMat);
      gl.uniformMatrix4fv(program.uniform.modelViewMat, false, this.cubesModelViewMat);
      gl.uniformMatrix3fv(program.uniform.normalMat, false, this.normalMat);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

      gl.enableVertexAttribArray(program.attrib.position);
      gl.enableVertexAttribArray(program.attrib.texCoord);
      gl.enableVertexAttribArray(program.attrib.normal);
      gl.enableVertexAttribArray(program.attrib.color);

      gl.vertexAttribPointer(program.attrib.position, 3, gl.FLOAT, false, 4*11, 0);
      gl.vertexAttribPointer(program.attrib.texCoord, 2, gl.FLOAT, false, 4*11, 4*3);
      gl.vertexAttribPointer(program.attrib.normal, 3, gl.FLOAT, false, 4*11, 4*(3+2));
      gl.vertexAttribPointer(program.attrib.color, 3, gl.FLOAT, false, 4*11, 4*(3+2+3));

      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(this.program.uniform.diffuse, 0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);

      gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);

      if (timestamp) {
        mat4.fromRotation(this.heroRotationMat, timestamp / 2000, [0, 1, 0]);
        mat4.multiply(this.heroModelViewMat, modelViewMat, this.heroRotationMat);
        gl.uniformMatrix4fv(program.uniform.modelViewMat, false, this.heroModelViewMat);

        // We know that the additional model matrix is a pure rotation,
        // so we can just use the non-position parts of the matrix
        // directly, this is cheaper than the transpose+inverse that
        // normalFromMat4 would do.
        mat3.fromMat4(this.normalMat, this.heroRotationMat);
        gl.uniformMatrix3fv(program.uniform.normalMat, false, this.normalMat);

        gl.drawElements(gl.TRIANGLES, this.heroCount, gl.UNSIGNED_SHORT, this.heroOffset * 2);
      }

      if (stats) {
        // To ensure that the FPS counter is visible in VR mode we have to
        // render it as part of the scene.
        mat4.fromTranslation(this.statsMat, [0, -0.3, -0.5]);
        mat4.scale(this.statsMat, this.statsMat, [0.3, 0.3, 0.3]);
        mat4.rotateX(this.statsMat, this.statsMat, -0.75);
        mat4.multiply(this.statsMat, modelViewMat, this.statsMat);
        stats.render(projectionMat, this.statsMat);
      }
    };


  };

  

  return PointCloud;
})();
