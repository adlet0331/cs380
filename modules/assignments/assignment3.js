import gl from "../gl.js";
import { vec3, mat4, quat, glMatrix } from "../cs380/gl-matrix.js";

import * as cs380 from "../cs380/cs380.js";

import { LightType, Light, BlinnPhongShader } from "../blinn_phong.js";

import { SimpleShader } from "../simple_shader.js";

export default class Assignment3 extends cs380.BaseApp {
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

    this.thingsToClear = [];

    // SimpleOrbitControl
    const orbitControlCenter = vec3.fromValues(0, 0, 0);
    this.simpleOrbitControl = new cs380.utils.SimpleOrbitControl(
      this.camera,
      orbitControlCenter
    );
    this.thingsToClear.push(this.simpleOrbitControl);
  
    // initialize picking shader & buffer
    const pickingShader = await cs380.buildShader(cs380.PickingShader);
    this.pickingBuffer = new cs380.PickingBuffer();
    this.pickingBuffer.initialize(width, height);
    this.thingsToClear.push(pickingShader, this.pickingBuffer);

    // generate a sphere
    const sphereMeshData = cs380.primitives.generateSphere();
    const sphereMesh = cs380.Mesh.fromData(sphereMeshData);

    // TODO: import a mesh model
    const meshLoaderResult = await cs380.MeshLoader.load({
      bunny: "resources/models/bunny.obj",
    });
    const bunnyMesh = cs380.Mesh.fromData(meshLoaderResult.bunny)

    const simpleShader = await cs380.buildShader(SimpleShader);
    // TODO: import BlinnPhongShader
    const blinnPhongShader = await cs380.buildShader(BlinnPhongShader);

    this.thingsToClear.push(sphereMesh);
    this.thingsToClear.push(bunnyMesh);
    this.thingsToClear.push(simpleShader);
    this.thingsToClear.push(blinnPhongShader);
    
    // initialize light sources
    this.lights = [];
    
    //For Start First
    const light0 = new Light(); 
    light0.type = LightType.AMBIENT;
    vec3.set(light0.rgb, 1.0, 1.0, 1.0);
    this.lights.push(light0);

    const light1 = new Light();
    const lightDir = vec3.create();
    vec3.set(lightDir, -1, -1, -1);
    light1.transform.lookAt(lightDir);
    vec3.set(light1.rgb, 0.0, 1.0, 0.0);
    light1.type = LightType.DIRECTIONAL;
    this.lights.push(light1);

    const light2 = new Light();
    vec3.set(light2.rgb, 1.0, 1.0, 1.0);
    vec3.set(light2.pos, 0.0, 0.0, 0.0);
    light2.type = LightType.POINT;
    this.lights.push(light2);
    vec3.set(light2.transform.localPosition, 0, 0, -8);

    const light3 = new Light();
    light1.transform.lookAt(lightDir);
    vec3.set(light3.rgb, 1.0, 1.0, 1.0);
    light3.type = LightType.SPOTLIGHT;
    this.lights.push(light3);

    // initialize a sphere Object
    this.sphere = new cs380.PickableObject(
      sphereMesh, 
      blinnPhongShader,
      pickingShader,
      1
    );
    vec3.set(this.sphere.transform.localPosition, -1.2, 0, 0);
    vec3.set(this.sphere.transform.localScale, 0.7, 0.7, 0.7);
    this.sphere.uniforms.lights = this.lights; 

    // TODO: initialize PickableObject or RenderObject for the imported model
    this.bunny = new cs380.PickableObject(
      bunnyMesh,
      blinnPhongShader,
      pickingShader,
      2
    );
    vec3.set(this.bunny.transform.localPosition, 1.2, 0, 0);
    vec3.set(this.bunny.transform.localScale, 0.7, 0.7, 0.7);
    this.bunny.uniforms.lights = this.lights;
    this.bunny.uniforms.mainColor = vec3.create();
    cs380.utils.hexToRGB(this.bunny.uniforms.mainColor, "#FF0000");
   
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
      <label for="setting-ambient">Ambient Light Illuminance</label>
      <input type="range" min=0 max=1 value=0 step=0.01 id="setting-ambient-illuminance">
      <label for="setting-illuminance">Directional Light Illuminance</label>
      <input type="range" min=0 max=1 value=0 step=0.01 id="setting-directional-illuminance">
      <br/>
      <label for="setting-point">Point Light Illuminance</label>
      <input type="range" min=0 max=10 value=0 step=0.1 id="setting-point-illuminance">
      <label for="setting-point">Point Light X Transform</label>
      <input type="range" min=-10 max=10 value=0 step=0.1 id="setting-point-x">
      <br/>
      <label for="setting-spotlight">SpotLight Illuminance</label>
      <input type="range" min=0 max=1 value=0 step=0.01 id="setting-spotlight-illuminance">
      <label for="setting-spotlight">SpotLight X Transform</label>
      <input type="range" min=-1 max=1 value=1 step=0.01 id="setting-spotlight-x">
      <h3>Basic requirements</h3>
      <ul>
        <li>Implement point light, and spotlight [2 pts]</li>
        <li>Update the implementation to support colored (RGB) light [1 pts]</li>
        <li>Update the implementation to support materials (reflection coefficients, shineness) [2 pts] </li>
        <li>Show some creativity in your scene [1 pts]</li>
      </ul>
      Import at least two models to show material differnece <br/>
      Use your creativity (animation, interaction, etc.) to make each light source is recognized respectively. <br/>
      <strong>Start early!</strong>
    `;
    
    // Setup GUIs
    const setInputBehavior = (id, onchange, initialize, callback) => {
      const input = document.getElementById(id);
      const callbackWrapper = 
          () => callback(input.value); // NOTE: must parse to int/float for numeric values
      if (onchange) {
        input.onchange = callbackWrapper;
        if (initialize) input.onchange();
      } else {
        input.oninput = callbackWrapper;
        if (initialize) input.oninput();
      }
    }
    setInputBehavior('setting-ambient-illuminance', true, true,
        (val) => { 
          console.log("Ambient Illuminance: " + val);
          this.lights[0].illuminance=val;
        });
    setInputBehavior('setting-directional-illuminance', true, true,
        (val) => { 
          console.log("Directional Illuminance: " + val);
          this.lights[1].illuminance=val;
        });
    setInputBehavior('setting-point-illuminance', true, true,
        (val) => { 
          console.log("Point Illuminance: " + val);
          this.lights[2].illuminance=val;
        });
    setInputBehavior('setting-point-x', true, true,
        (val) => { 
          console.log("Point X: " + val);
          vec3.set(this.lights[2].pos, val, 0.0, 0.0);
        });
    setInputBehavior('setting-spotlight-illuminance', true, true,
        (val) => { 
          console.log("Spotlight Illuminance: " + val);
          this.lights[3].illuminance=val;
        });
    setInputBehavior('setting-spotlight-x', true, true,
        (val) => { 
          console.log("Spotlight X: " + val);
          this.lights[3].illuminance=val;
        });

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
    this.simpleOrbitControl.update(dt);
    // Updates before rendering here
    
    // Render picking information first
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.pickingBuffer.fbo);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // renderPicking() here
    this.sphere.renderPicking(this.camera);
    this.bunny.renderPicking(this.camera);
    
    // Render real scene
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // render() here
    this.sphere.render(this.camera);
    this.bunny.render(this.camera);
  }
}
