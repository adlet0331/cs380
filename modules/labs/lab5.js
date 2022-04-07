import gl from "../gl.js";
import { vec3, mat4, quat, glMatrix } from "../cs380/gl-matrix.js";

import * as cs380 from "../cs380/cs380.js";

import { SimpleShader } from "../simple_shader.js";

export default class Lab5App extends cs380.BaseApp {
  async initialize() {
    // Basic setup for camera
    const { width, height } = gl.canvas.getBoundingClientRect();
    const aspectRatio = width / height;
    this.camera = new cs380.Camera();
    vec3.set(this.camera.transform.localPosition, 0, 0, 8);
    mat4.perspective(
      this.camera.projectionMatrix,
      glMatrix.toRadian(45),
      aspectRatio,
      0.01,
      100
    );

    // things to finalize()
    this.thingsToClear = [];

    // SimpleOrbitControl
    const orbitControlCenter = vec3.fromValues(0, 0, 0);
    this.simpleOrbitControl = new cs380.utils.SimpleOrbitControl(
      this.camera,
      orbitControlCenter
    );
    this.thingsToClear.push(this.simpleOrbitControl);

    // TODO: initialize mesh and shader
    const sphereMeshData = cs380.primitives.generateSphere();
    const sphereMesh = cs380.Mesh.fromData(sphereMeshData);
    const simpleShader = await cs380.buildShader(SimpleShader);

    this.thingsToClear.push(sphereMesh, simpleShader);

    // initialize picking shader & buffer
    const pickingShader = await cs380.buildShader(cs380.PickingShader);
    this.pickingBuffer = new cs380.PickingBuffer();
    this.pickingBuffer.initialize(width, height);
    this.thingsToClear.push(pickingShader, this.pickingBuffer);

    // TODO: initialize PickableObject for your solar system
    this.sphere = new cs380.PickableObject(
      sphereMesh,
      simpleShader,
      pickingShader,
      1
    );

    this.sphere1 = new cs380.PickableObject(
      sphereMesh,
      simpleShader,
      pickingShader,
      2
    );

    this.sphere2 = new cs380.PickableObject(
      sphereMesh,
      simpleShader,
      pickingShader,
      3
    );

    this.pickedObject = [this.sphere, this.sphere1, this.sphere2]

    // Event listener for interactions
    this.handleMouseDown = (e) => {
      // e.button = 0 if it is left mouse button
      if (e.button !== 0) return;
      this.onMouseDown(e);
    };
    gl.canvas.addEventListener("mousedown", this.handleMouseDown);

    // HTML interaction
    document.getElementById("settings").innerHTML = `
      <ul>
        <li>
          <strong>Submission:</strong> 3 screenshots with your solar system;
          the camera should move around the sun, earth, and moon, respectively.
        </li>
      </ul>
    `;

    // GL settings
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
  }

  onMouseDown(e) {
    const { left, bottom } = gl.canvas.getBoundingClientRect();
    const x = e.clientX - left;
    const y = bottom - e.clientY;

    // Object with this index has just picked
    const index = this.pickingBuffer.pick(x, y);

    // TODO : write down your code
    console.log(`onMouseDown() got index ${index}`);
    this.camera.transform.setParent(this.pickedObject[index - 1].transform)
  }

  finalize() {
    gl.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.thingsToClear.forEach((it) => it.finalize());
    gl.disable(gl.CULL_FACE);
  }

  update(elapsed, dt) {
    // TODO: update your solar system movement here
    this.simpleOrbitControl.update(dt);

    vec3.set(this.sphere1.transform.localScale, 0.5, 0.5, 0.5)
    vec3.set(this.sphere1.transform.localPosition, 3 * Math.cos(elapsed), 3 * Math.sin(elapsed), 0)

    vec3.set(this.sphere2.transform.localScale, 0.3, 0.3, 0.3)
    vec3.set(this.sphere2.transform.localPosition, 
      3 * Math.cos(elapsed) + 1 * Math.cos(3 * elapsed), 
      3 * Math.sin(elapsed) + 1 * Math.sin(3 * elapsed), 
      0)

    // 1. Render picking information first
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.pickingBuffer.fbo);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    this.sphere.renderPicking(this.camera);
    this.sphere1.renderPicking(this.camera);
    this.sphere2.renderPicking(this.camera);

    // 2. Render real scene
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    this.sphere.render(this.camera);
    this.sphere1.render(this.camera);
    this.sphere2.render(this.camera);    
  }
}
