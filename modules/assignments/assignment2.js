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
    vec3.set(this.camera.transform.localPosition, 0, 0, 60);
    mat4.perspective(
      this.camera.projectionMatrix,
      glMatrix.toRadian(45),
      aspectRatio,
      0.01,
      100
    );

    this.thingsToClear = [];

    this.apricot = "#BD8274"
    this.purple = "660099"
    this.white = "FFFFFF"
    this.haircolor = "#331810"
    this.mustachecolor = "551810"
    this.upmustachecolor = "#453810"
    this.clothcolor = "#005666"
    this.clothcolor2 = "#006676"
    this.pantcolor = "#030344"
    this.pantshadowcolor = "#030044"
    this.shoescolor = "#111111"

    // SimpleOrbitControl
    const orbitControlCenter = vec3.fromValues(0, 0, 0);
    this.simpleOrbitControl = new cs380.utils.SimpleOrbitControl(
      this.camera,
      orbitControlCenter
    );
    this.thingsToClear.push(this.simpleOrbitControl);

    // Mesh & Shader
    const simpleShader = await cs380.buildShader(SimpleShader);
    this.thingsToClear.push(simpleShader);

    // Generate Plane
    this.planeX = 40
    this.planeY = 40
    this.planeZ = 30
    const planeBackMesh = cs380.Mesh.fromData(cs380.primitives.generatePlane(this.planeX, this.planeY));
    const planeLeftMesh = cs380.Mesh.fromData(cs380.primitives.generatePlane(this.planeZ, this.planeY));
    const planeRightMesh = cs380.Mesh.fromData(cs380.primitives.generatePlane(this.planeZ, this.planeY));
    const planeBottomMesh = cs380.Mesh.fromData(cs380.primitives.generatePlane(this.planeX, this.planeZ));
    
    this.planeBack = new cs380.RenderObject(planeBackMesh, simpleShader);
    quat.rotateX(this.planeBack.transform.localRotation, this.planeBack.transform.localRotation, Math.PI);
    vec3.set(this.planeBack.transform.localPosition, 0, 0, - this.planeZ / 2);
    this.planeBack.uniforms.mainColor = vec3.create();
    cs380.utils.hexToRGB(this.planeBack.uniforms.mainColor, "#888888");

    this.planeLeft = new cs380.RenderObject(planeLeftMesh, simpleShader);
    quat.rotateY(this.planeLeft.transform.localRotation, this.planeLeft.transform.localRotation, - Math.PI / 2);
    vec3.set(this.planeLeft.transform.localPosition, - this.planeX / 2, 0, 0);
    this.planeLeft.uniforms.mainColor = vec3.create();
    cs380.utils.hexToRGB(this.planeLeft.uniforms.mainColor, "#BBBBBB");

    this.planeRight = new cs380.RenderObject(planeRightMesh, simpleShader);
    quat.rotateY(this.planeRight.transform.localRotation, this.planeRight.transform.localRotation, Math.PI / 2);
    vec3.set(this.planeRight.transform.localPosition, this.planeX / 2, 0, 0);
    this.planeRight.uniforms.mainColor = vec3.create();
    cs380.utils.hexToRGB(this.planeRight.uniforms.mainColor, "#888888");

    this.planeBottom = new cs380.RenderObject(planeBottomMesh, simpleShader);
    quat.rotateX(this.planeBottom.transform.localRotation, this.planeBottom.transform.localRotation, Math.PI / 2);
    vec3.set(this.planeBottom.transform.localPosition, 0, - this.planeY / 2, 0);
    this.planeBottom.uniforms.mainColor = vec3.create();
    cs380.utils.hexToRGB(this.planeBottom.uniforms.mainColor, "#000000");
    // Generate Plane End

    this.objectList = []

    const generateMesh = (mesh, color, index, parent) => {
      let object = new cs380.PickableObject(
        mesh,
        simpleShader,
        pickingShader,
        index
      );
      object.uniforms.mainColor = vec3.create();
      cs380.utils.hexToRGB(object.uniforms.mainColor, color);
      if (parent != null){
        object.transform.setParent(parent.transform);
      }
      this.objectList.push(object);
      return object
    }

    const setPixelPos = (object, x, y, z, angle = Math.PI) => {
      quat.rotateX(object.transform.localRotation, object.transform.localRotation, angle);
      vec3.set(object.transform.localPosition, x, y, z);
    }

    //initialize Object Mesh
    const headCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(4, 3, 4));
    const headHairMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(4, 1, 4));
    const unitpixelmesh = cs380.Mesh.fromData(cs380.primitives.generatePlane(0.5, 0.5));
    const bodyCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(4, 5, 2));
    const bodyDownCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(4, 1, 2));
    const armClothCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(2, 2, 2));
    const armupCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(2, 1, 2));
    const armdownCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(2, 3, 2));
    const legupCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(2, 2, 2));
    const legmidCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(2, 0.5, 2));
    const legdownCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(2, 1.5, 2));
    const shoesCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(2, 1, 2));

    this.thingsToClear.push(headCubeMesh, headHairMesh, unitpixelmesh, bodyCubeMesh, bodyDownCubeMesh);
    this.thingsToClear.push(armClothCubeMesh, armupCubeMesh, armdownCubeMesh);
    this.thingsToClear.push(legupCubeMesh, legmidCubeMesh, legdownCubeMesh, shoesCubeMesh);

    // initialize picking shader & buffer
    const pickingShader = await cs380.buildShader(cs380.PickingShader);
    this.pickingBuffer = new cs380.PickingBuffer();
    this.pickingBuffer.initialize(width, height);
    this.thingsToClear.push(pickingShader, this.pickingBuffer);

    // Body
    const downervect = -7.5
    this.bodyCube = generateMesh(bodyCubeMesh, this.clothcolor, 2, null);
    vec3.set(this.bodyCube.transform.localPosition, 0, downervect, 0);
    this.bodyDownCube = generateMesh(bodyDownCubeMesh, this.pantcolor, 2, this.bodyCube)
    vec3.set(this.bodyDownCube.transform.localPosition, 0, -3, 0);
    
    // Head
    this.headCube = generateMesh(headCubeMesh, this.apricot, 1, this.bodyCube);
    vec3.set(this.headCube.transform.localPosition, 0, 4, 0);
    this.headHair = generateMesh(headHairMesh, this.haircolor, 1, this.headCube);
    vec3.set(this.headHair.transform.localPosition, 0, 2, 0);
    this.headfrontleftHair = generateMesh(unitpixelmesh, this.haircolor, 1, this.headCube);
    setPixelPos(this.headfrontleftHair, -1.75, 1.25, 2.05);
    this.headfrontrightHair = generateMesh(unitpixelmesh, this.haircolor, 1, this.headCube);
    setPixelPos(this.headfrontrightHair, 1.75, 1.25, 2.05);
    this.headleftEye = generateMesh(unitpixelmesh, this.purple, 1, this.headCube);
    setPixelPos(this.headleftEye, -0.75, 0.25, 2.05);
    this.headrightEye = generateMesh(unitpixelmesh, this.purple, 1, this.headCube);
    setPixelPos(this.headrightEye, 0.75, 0.25, 2.05);
    this.headWhiteleftEye = generateMesh(unitpixelmesh, this.white, 1, this.headCube);
    setPixelPos(this.headWhiteleftEye, -1.25, 0.25, 2.05);
    this.headrightWhiteEye = generateMesh(unitpixelmesh, this.white, 1, this.headCube);
    setPixelPos(this.headrightWhiteEye, 1.25, 0.25, 2.05);
    this.uppermustache1 = generateMesh(unitpixelmesh, this.upmustachecolor, 1, this.headCube);
    setPixelPos(this.uppermustache1, -0.25, -0.25, 2.05);
    this.uppermustache2 = generateMesh(unitpixelmesh, this.upmustachecolor, 1, this.headCube);
    setPixelPos(this.uppermustache2, 0.25, -0.25, 2.05);
    this.downmustache1 = generateMesh(unitpixelmesh, this.mustachecolor, 1, this.headCube);
    setPixelPos(this.downmustache1, -0.75, -0.75, 2.05);
    this.downmustache2 = generateMesh(unitpixelmesh, this.mustachecolor, 1, this.headCube);
    setPixelPos(this.downmustache2, -0.75, -1.25, 2.05);
    this.downmustache3 = generateMesh(unitpixelmesh, this.mustachecolor, 1, this.headCube);
    setPixelPos(this.downmustache3, -0.25, -1.25, 2.05);
    this.downmustache4 = generateMesh(unitpixelmesh, this.mustachecolor, 1, this.headCube);
    setPixelPos(this.downmustache4, 0.25, -1.25, 2.05);
    this.downmustache5 = generateMesh(unitpixelmesh, this.mustachecolor, 1, this.headCube);
    setPixelPos(this.downmustache5, 0.75, -1.25, 2.05);
    this.downmustache6 = generateMesh(unitpixelmesh, this.mustachecolor, 1, this.headCube);
    setPixelPos(this.downmustache6, 0.75, -0.75, 2.05);
    // Head end

    // Right Arm
    this.rightArmClothCube = generateMesh(armClothCubeMesh, this.clothcolor2, 3, this.bodyCube);
    vec3.set(this.rightArmClothCube.transform.localPosition, 3, 1.5, 0);
    this.rigthUpArmCube = generateMesh(armupCubeMesh, this.apricot, 3, this.rightArmClothCube);
    vec3.set(this.rigthUpArmCube.transform.localPosition, 0, -1.5, 0);
    this.rigthDownArmCube = generateMesh(armdownCubeMesh, this.apricot, 3, this.rigthUpArmCube);
    vec3.set(this.rigthDownArmCube.transform.localPosition, 0, -2, 0);

    // Left Arm

    // Right Leg
    this.rightUpLegCube = generateMesh(legupCubeMesh, this.pantcolor, 5, this.bodyCube);
    vec3.set(this.rightUpLegCube.transform.localPosition, 1, -4.5, 0);
    this.rightMidLegCube = generateMesh(legmidCubeMesh, this.pantshadowcolor, 5, this.rightUpLegCube);
    vec3.set(this.rightMidLegCube.transform.localPosition, 0, -1.25, 0);
    this.rightDownLegCube = generateMesh(legdownCubeMesh, this.pantcolor, 5, this.rightMidLegCube);
    vec3.set(this.rightDownLegCube.transform.localPosition, 0, -1, 0);
    this.rightDownShoeCube = generateMesh(shoesCubeMesh, this.shoescolor, 5, this.rightDownLegCube);
    vec3.set(this.rightDownShoeCube.transform.localPosition, 0, -1.25, 0);

    // Left Leg

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

    const vec3create = (obj) => {
      return vec3.create(obj.transform.localPosition[0], obj.transform.localPosition[1], obj.transform.localPosition[2]);      
    }

    const quatcreate = (obj) => {
      return quat.create(obj.transform.localRotation[0], obj.transform.localRotation[1], obj.transform.localRotation[2], obj.transform.localRotation[3]);
    }

    // Make Animation Scene Start

    // Make Animation Scene End

    // animation infos
    this.animationInfoDict = [];

    let info = [];
    info["bodyT"] = vec3create(this.bodyCube);
    info["bodyR"] = quatcreate(this.bodyCube);
    info["headR"] = quatcreate(this.headCube);
    info["armRCR"] = quatcreate(this.rightArmClothCube);
    info["armRDR"] = quatcreate(this.rigthDownArmCube);
    info["legRUR"] = quatcreate(this.rightUpLegCube);
    info["legRDR"] = quatcreate(this.rightDownLegCube);
    this.animationInfoDict["default"] = info;
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
    for(let i = 0; i < this.objectList.length; i++){
      const obj = this.objectList[i]
      obj.renderPicking(this.camera)
    }

    // Render real scene
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // render() here
    this.planeBack.render(this.camera);
    this.planeLeft.render(this.camera);
    this.planeRight.render(this.camera);
    this.planeBottom.render(this.camera);
    for(let i = 0; i < this.objectList.length; i++){
      const obj = this.objectList[i]
      obj.render(this.camera)
    }
    // Animation

  }
}
