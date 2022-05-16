import gl from "../gl.js";
import { vec3, mat4, quat, glMatrix } from "../cs380/gl-matrix.js";

import * as cs380 from "../cs380/cs380.js";

import { LightType, Light, BlinnPhongShader, Material } from "../blinn_phong.js";

import { SimpleShader } from "../simple_shader.js";

export default class Assignment3 extends cs380.BaseApp {
  updateUniforms = () => {
    for (let i = 0; i < this.objectList.length; i++){
      this.objectList[i].uniforms.material.isToonShading = this.isToonShading;
    }
  }

  setUniforms = (uniforms, ambientC = "#FFFFFF", diffuseC = "#FFFFFF", specularC = "#FFFFFF", mainC = "#FFFFFF") => {
    uniforms.mainColor = vec3.create();
    cs380.utils.hexToRGB(uniforms.mainColor, mainC);
    const material = new Material();
    cs380.utils.hexToRGB(material.ambientColor, ambientC);
    cs380.utils.hexToRGB(material.diffuseColor, diffuseC);
    cs380.utils.hexToRGB(material.specularColor, specularC);
    material.isToonShading = this.isToonShading;
    uniforms.material = material;
  }

  async generateMesh (mesh, shader, index, lights, color = "#FFFFFF", materials = ["#FFFFFF", "#FFFFFF", "#FFFFFF"], parent = null) {
    let object = new cs380.PickableObject(mesh, shader, this.pickingShader, index);
    this.setUniforms(object.uniforms, materials[0], materials[1], materials[2], color);
    object.uniforms.lights = lights;
    if (parent != null){
      object.transform.setParent(parent);
    }
    this.objectList.push(object);
    return object
  }

  async buildModels() {
    // generate a sphere
    const sphereMeshData = cs380.primitives.generateSphere();
    const sphereMesh = cs380.Mesh.fromData(sphereMeshData);

    // TODO: import a mesh model
    const meshLoaderResult = await cs380.MeshLoader.load({
      bunny: "resources/models/bunny.obj",
    });
    const bunnyMesh = cs380.Mesh.fromData(meshLoaderResult.bunny);

    const lighthouseLoaderResult = await cs380.MeshLoader.load({
      lighthouse: "resources/models/Round_Lighthouse.obj"
    });
    const lighthouseMesh = cs380.Mesh.fromData(lighthouseLoaderResult.lighthouse);

    const simpleShader = await cs380.buildShader(SimpleShader);
    // TODO: import BlinnPhongShader
    const blinnPhongShader = await cs380.buildShader(BlinnPhongShader);

    this.thingsToClear.push(sphereMesh);
    this.thingsToClear.push(bunnyMesh);
    this.thingsToClear.push(lighthouseMesh);
    this.thingsToClear.push(simpleShader);
    this.thingsToClear.push(blinnPhongShader);

    // initialize light sources
    this.lights = [];
    this.objectList = [];
        
    //For Start First
    const light0 = new Light(); 
    light0.type = LightType.AMBIENT;
    vec3.set(light0.rgb, 1.0, 1.0, 1.0);
    this.lights.push(light0);

    const light1 = new Light();
    const lightDir = vec3.create();
    vec3.set(lightDir, -1, -1, -1);
    light1.transform.lookAt(lightDir);
    cs380.utils.hexToRGB(light1.rgb, "#FFCC33");
    light1.type = LightType.DIRECTIONAL;
    this.lights.push(light1);

    const light2 = new Light();
    cs380.utils.hexToRGB(light2.rgb, "#FFFFFF");
    light2.type = LightType.POINT;
    this.lights.push(light2);

    const light3 = new Light();
    const lightDir2 = vec3.create();
    vec3.set(lightDir2, 0, -1, -0.001);
    light3.transform.lookAt(lightDir2);
    vec3.set(light3.rgb, 1.0, 1.0, 1.0);
    light3.type = LightType.SPOTLIGHT;
    this.lights.push(light3);

  // Generate Plane
    this.planeX = 20
    this.planeY = 10
    this.planeZ = 20
    const planeBackMesh = cs380.Mesh.fromData(cs380.primitives.generatePlane(this.planeX, this.planeY));
    const planeLeftMesh = cs380.Mesh.fromData(cs380.primitives.generatePlane(this.planeZ, this.planeY));
    const planeBottomMesh = cs380.Mesh.fromData(cs380.primitives.generatePlane(this.planeX, this.planeZ));

    this.planeBack = await this.generateMesh(planeBackMesh, blinnPhongShader, 0, this.lights, "#888888");
    quat.rotateX(this.planeBack.transform.localRotation, this.planeBack.transform.localRotation, Math.PI);
    vec3.set(this.planeBack.transform.localPosition, 0, 0, - this.planeZ / 2);

    this.planeLeft = await this.generateMesh(planeLeftMesh, blinnPhongShader, 0, this.lights, "#BBBBBB");
    quat.rotateY(this.planeLeft.transform.localRotation, this.planeLeft.transform.localRotation, - Math.PI / 2);
    vec3.set(this.planeLeft.transform.localPosition, - this.planeX / 2, 0, 0);

    //this.planeRight = await this.generateMesh(planeLeftMesh, blinnPhongShader, 0, this.lights, "#444444");
    //quat.rotateY(this.planeRight.transform.localRotation, this.planeRight.transform.localRotation, Math.PI / 2);
    //vec3.set(this.planeRight.transform.localPosition, this.planeX / 2, 0, 0);

    this.planeBottom = await this.generateMesh(planeBottomMesh, blinnPhongShader, 0, this.lights, "#222222");
    quat.rotateX(this.planeBottom.transform.localRotation, this.planeBottom.transform.localRotation, Math.PI / 2);
    vec3.set(this.planeBottom.transform.localPosition, 0, - this.planeY / 2, 0);
    // Generate Plane End
  
  // Generate Object
    // initialize a sphere Object
    this.sphere = await this.generateMesh(sphereMesh,  blinnPhongShader, 1, this.lights);
    vec3.set(this.sphere.transform.localPosition, -1.5, 0, 0);
    vec3.set(this.sphere.transform.localScale, 0.7, 0.7, 0.7);

    // TODO: initialize PickableObject or RenderObject for the imported model
    this.bunny = await this.generateMesh(bunnyMesh, blinnPhongShader, 2, this.lights, "#FFFFFF", ["FF0000", "FF0000", "FFFF00"]);
    vec3.set(this.bunny.transform.localPosition, 1.5, 0, 0);
    vec3.set(this.bunny.transform.localScale, 0.7, 0.7, 0.7);

    this.lighthouse = await this.generateMesh(lighthouseMesh, blinnPhongShader, 3, this.lights, "#362B00");
    vec3.set(this.lighthouse.transform.localPosition, 8.0, -this.planeY / 2, 0.0);
    vec3.set(this.lighthouse.transform.localScale, 0.006, 0.006, 0.006);
    quat.rotateX(this.lighthouse.transform.localRotation, this.lighthouse.transform.localRotation, -Math.PI / 2);
  }

  async initialize() {
    // Basic setup for camera
    const { width, height } = gl.canvas.getBoundingClientRect();
    const aspectRatio = width / height;
    this.camera = new cs380.Camera();
    vec3.set(this.camera.transform.localPosition, 0, 0, 40);
    mat4.perspective(
      this.camera.projectionMatrix,
      glMatrix.toRadian(45),
      aspectRatio,
      0.1,
      100
    );
    this.thingsToClear = [];
    // initialize picking shader & buffer
    this.pickingShader = await cs380.buildShader(cs380.PickingShader);
    this.pickingBuffer = new cs380.PickingBuffer();
    this.pickingBuffer.initialize(width, height);
    this.thingsToClear.push(this.pickingShader, this.pickingBuffer);

    await this.buildModels();

    // SimpleOrbitControl && Toon Shading
    const orbitControlCenter = vec3.fromValues(0, 0, 0);
    this.simpleOrbitControl = new cs380.utils.SimpleOrbitControl(
      this.camera,
      orbitControlCenter
    );
    this.thingsToClear.push(this.simpleOrbitControl);
    this.isToonShading = true;
  
    // Event & Inputs
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
      <label for="toon-shading">Toon Shading</label>
      <input type="checkbox" id="toon-shading">
      <br/>
      <label for="setting-ambient">Ambient Light Illuminance</label>
      <input type="range" min=0 max=1 value=0 step=0.01 id="setting-ambient-illuminance">
      <label for="setting-illuminance">Directional Light Illuminance</label>
      <input type="range" min=0 max=1 value=0 step=0.01 id="setting-directional-illuminance">
      <br/>
      <label for="setting-point">Point Light Illuminance</label>
      <input type="range" min=0 max=10 value=0 step=0.1 id="setting-point-illuminance">
      <label for="setting-point">Point Light Z Transform</label>
      <input type="range" min=-1 max=5 value=0 step=0.1 id="setting-point-z">
      <br/>
      <label for="setting-spotlight">SpotLight Illuminance</label>
      <input type="range" min=0 max=1 value=0 step=0.01 id="setting-spotlight-illuminance">
      <label for="setting-spotlight">SpotLight X Transform</label>
      <input type="range" min=-5 max=5 value=0 step=0.01 id="setting-spotlight-x">
      <br/>
      <label for="setting-spotlight-smooth">SpotLight smooth</label>
      <input type="range" min=0 max=10 value=0 step=0.01 id="setting-spotlight-smooth">
      <label for="setting-spotlight-angle">SpotLight Angle</label>
      <input type="range" min=0 max=1.57 value=0 step=0.01 id="setting-spotlight-angle">
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
    setInputBehavior('setting-point-z', true, true,
        (val) => { 
          console.log("Point X: " + val);
          vec3.set(this.lights[2].transform.localPosition, 0, 0, val);
        });
    setInputBehavior('setting-spotlight-illuminance', true, true,
        (val) => { 
          console.log("Spotlight Illuminance: " + val);
          this.lights[3].illuminance=val;
        });
    setInputBehavior('setting-spotlight-x', true, true,
        (val) => { 
          console.log("Spotlight X: " + val);
          vec3.set(this.lights[3].transform.localPosition, val, 10, 0);
        });
    setInputBehavior("setting-spotlight-smooth", true, true, 
        (val) => { 
          console.log("Spotlight Smooth: " + val);
          this.lights[3].angleSmoothness = val;
        });
    setInputBehavior("setting-spotlight-angle", true, true, 
        (val) => { 
          console.log("Spotlight angle: " + val);
          this.lights[3].angle = val;
        });
    setInputBehavior("toon-shading", true, true, 
        () => { 
          this.isToonShading = !this.isToonShading;
          this.updateUniforms();
          console.log("Toon Shading: " + this.isToonShading);
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
    for(let i = 0; i < this.objectList.length; i++){
      const obj = this.objectList[i]
      obj.renderPicking(this.camera)
    }
    
    // Render real scene
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // render() here
    for(let i = 0; i < this.objectList.length; i++){
      const obj = this.objectList[i]
      obj.render(this.camera)
    }
  }
}
