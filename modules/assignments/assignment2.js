import gl from "../gl.js";
import { vec3, mat4, quat, glMatrix } from "../cs380/gl-matrix.js";

import * as cs380 from "../cs380/cs380.js";

import { SimpleShader } from "../simple_shader.js";

export default class Assignment2 extends cs380.BaseApp {
  async initialize() {
    // Basic setup for camera
    const { width, height } = gl.canvas.getBoundingClientRect();
    const aspectRatio = width / height;
    this.camera = new cs380.Camera();
    vec3.set(this.camera.transform.localPosition, 0, 0, 50);
    mat4.perspective(
      this.camera.projectionMatrix,
      glMatrix.toRadian(45),
      aspectRatio,
      0.01,
      100
    );

    this.thingsToClear = [];

    // SimpleOrbitControl
    const orbitControlCenter = vec3.fromValues(0, 0, 0);
    this.simpleOrbitControl = new cs380.utils.SimpleOrbitControl(
      this.camera,
      orbitControlCenter
    );
    this.thingsToClear.push(this.simpleOrbitControl);

    // Mesh & Shader
    const sphereMeshData = cs380.primitives.generateSphere();
    const sphereMesh = cs380.Mesh.fromData(sphereMeshData);
    const simpleShader = await cs380.buildShader(SimpleShader);
    this.thingsToClear.push(sphereMesh, simpleShader);

    // Generate Plane
    this.planeX = 30
    this.planeY = 30
    this.planeZ = 30
    this.planeColorStr = "#888888"
    const planeBackMesh = cs380.Mesh.fromData(cs380.primitives.generatePlane(this.planeX, this.planeY));
    const planeLeftMesh = cs380.Mesh.fromData(cs380.primitives.generatePlane(this.planeZ, this.planeY));
    const planeRightMesh = cs380.Mesh.fromData(cs380.primitives.generatePlane(this.planeY, this.planeZ));
    const planeBottomMesh = cs380.Mesh.fromData(cs380.primitives.generatePlane(this.planeX, this.planeY));
    
    this.planeBack = new cs380.RenderObject(planeBackMesh, simpleShader);
    quat.rotateX(this.planeBack.transform.localRotation, this.planeBack.transform.localRotation, Math.PI);
    vec3.set(this.planeBack.transform.localPosition, 0, 0, - this.planeZ / 2);
    this.planeBack.uniforms.mainColor = vec3.create();
    cs380.utils.hexToRGB(this.planeBack.uniforms.mainColor, this.planeColorStr);

    this.planeLeft = new cs380.RenderObject(planeLeftMesh, simpleShader);
    quat.rotateY(this.planeLeft.transform.localRotation, this.planeLeft.transform.localRotation, - Math.PI / 2);
    vec3.set(this.planeLeft.transform.localPosition, - this.planeX / 2, 0, 0);
    this.planeLeft.uniforms.mainColor = vec3.create();
    cs380.utils.hexToRGB(this.planeLeft.uniforms.mainColor, this.planeColorStr);

    this.planeRight = new cs380.RenderObject(planeRightMesh, simpleShader);
    quat.rotateY(this.planeRight.transform.localRotation, this.planeRight.transform.localRotation, Math.PI / 2);
    vec3.set(this.planeRight.transform.localPosition, this.planeX / 2, 0, 0);
    this.planeRight.uniforms.mainColor = vec3.create();
    cs380.utils.hexToRGB(this.planeRight.uniforms.mainColor, this.planeColorStr);

    this.planeBottom = new cs380.RenderObject(planeBottomMesh, simpleShader);
    quat.rotateX(this.planeBottom.transform.localRotation, this.planeBottom.transform.localRotation, Math.PI / 2);
    vec3.set(this.planeBottom.transform.localPosition, 0, - this.planeY / 2, 0);
    this.planeBottom.uniforms.mainColor = vec3.create();
    cs380.utils.hexToRGB(this.planeBottom.uniforms.mainColor, "#000000");
    // Generate Plane End

    // initialize picking shader & buffer
    const pickingShader = await cs380.buildShader(cs380.PickingShader);
    this.pickingBuffer = new cs380.PickingBuffer();
    this.pickingBuffer.initialize(width, height);
    this.thingsToClear.push(pickingShader, this.pickingBuffer);

    this.sphere = new cs380.PickableObject(
      sphereMesh,
      simpleShader,
      pickingShader,
      1
    );
    this.sphere.uniforms.mainColor = vec3.create();
    cs380.utils.hexToRGB(this.sphere.uniforms.mainColor, "#00FF00");

    // Event listener for interactions
    this.handleKeyDown = (e) => {
      // e.repeat is true when the key has been helded for a while
      if (e.repeat) return;
      this.onKeyDown(e.key);
    };
    this.handleMouseDown = (e) => {
      // e.button = 0 if it is left mouse button
      if (e.button !== 0) return;
      this.onMouseDown(e);
    };

    document.addEventListener("keydown", this.handleKeyDown);
    gl.canvas.addEventListener("mousedown", this.handleMouseDown);

    document.getElementById("settings").innerHTML = `
      <h3>Basic requirements</h3>
      <ul>
        <li>Generate 3D geometric objects: cone and cylinder</li>
        <li>Construct your avatar with hierarchical modeling containing at least 10 parts</li>
        <li>Introduce interactive avatar posing from keyboard and mouse inputs</li>
        <li>Show some creativity in your scene</li>
      </ul>
      <strong>Start early!</strong>
    `;

    // GL settings
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
  }

  onKeyDown(key) {
    console.log(`key down: ${key}`);
  }

  onMouseDown(e) {
    const { left, bottom } = gl.canvas.getBoundingClientRect();
    const x = e.clientX - left;
    const y = bottom - e.clientY;

    // Object with this index has just picked
    const index = this.pickingBuffer.pick(x, y);

    console.log(`onMouseDown() got index ${index}`);
  }

  finalize() {
    // Finalize WebGL objects (mesh, shader, texture, ...)
    document.removeEventListener("keydown", this.handleKeyDown);
    gl.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.thingsToClear.forEach((it) => it.finalize());
  }

  update(elapsed, dt) {
    // Updates before rendering here
    this.simpleOrbitControl.update(dt);

    // Render picking information first
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.pickingBuffer.fbo);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // renderPicking() here
    this.sphere.renderPicking(this.camera);

    // Render real scene
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // render() here
    this.sphere.render(this.camera);
    this.planeBack.render(this.camera);
    this.planeLeft.render(this.camera);
    this.planeRight.render(this.camera);
    this.planeBottom.render(this.camera);
  }
}
