import gl from "../gl.js";
import { vec3, mat4, quat, glMatrix } from "../cs380/gl-matrix.js";

import * as cs380 from "../cs380/cs380.js";

import { LightType, Light, BlinnPhongShader, Material } from "../blinn_phong.js";

import { Transform } from "../cs380/transform.js";

import { SimpleShader } from "../simple_shader.js";

export default class Assignment3 extends cs380.BaseApp {
  updateUniforms = () => {
    for (let i = 0; i < this.objectList.length; i++){
      this.objectList[i].uniforms. material.isToonShading = this.isToonShading;
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

  async generateMesh (mesh, color, index, parent = null, shader, lights, materials = ["#FFFFFF", "#FFFFFF", "#FFFFFF"]) {
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
    const lighthouseLoaderResult = await cs380.MeshLoader.load({
      lighthouse: "resources/models/Round_Lighthouse.obj"
    });
    const lighthouseMesh = cs380.Mesh.fromData(lighthouseLoaderResult.lighthouse);

    const simpleShader = await cs380.buildShader(SimpleShader);
    // TODO: import BlinnPhongShader
    const blinnPhongShader = await cs380.buildShader(BlinnPhongShader);

    this.thingsToClear.push(lighthouseMesh);
    this.thingsToClear.push(simpleShader);
    this.thingsToClear.push(blinnPhongShader);

    // initialize light sources
    this.lights = [];
    this.objectList = [];

    // Plane Const
    this.planeX = 60
    this.planeY = 70
    this.planeZ = 60
        
    //For Start First
    const ambientLight = new Light(); 
    ambientLight.type = LightType.AMBIENT;
    vec3.set(ambientLight.rgb, 1.0, 1.0, 1.0);
    this.lights.push(ambientLight);

    const directionalLight = new Light();
    const lightDir = vec3.create();
    vec3.set(lightDir, -1, -1, -1);
    directionalLight.transform.lookAt(lightDir);
    cs380.utils.hexToRGB(directionalLight.rgb, "#FFFFFF");
    directionalLight.type = LightType.DIRECTIONAL;
    this.lights.push(directionalLight);

    const pointLight = new Light();
    cs380.utils.hexToRGB(pointLight.rgb, "#FFFFFF");
    pointLight.type = LightType.POINT;
    this.lights.push(pointLight);

    const spotLight = new Light();
    const lightDir2 = vec3.create();
    vec3.set(lightDir2, 0, -1, -0.3);
    spotLight.transform.lookAt(lightDir2);
    vec3.set(spotLight.rgb, 1.0, 1.0, 1.0);
    spotLight.type = LightType.SPOTLIGHT;
    this.lights.push(spotLight);

    const lightHouseLight = new Light();
    vec3.set(lightHouseLight.transform.localPosition, this.planeX / 2 - 5, this.planeY / 2 - 10, 0);
    const lightHouseDir = vec3.create();
    vec3.set(lightHouseDir, -1, -1, 0);
    vec3.set(lightHouseLight.rgb, 1.0, 1.0, 1.0);
    lightHouseLight.transform.lookAt(lightHouseDir);
    lightHouseLight.type = LightType.SPOTLIGHT;
    lightHouseLight.angle = Math.PI / 12;
    this.lights.push(lightHouseLight);

    const light4 = new Light();
    vec3.set(light4.transform.localPosition, -10, 0, 0);
    const lightDir3 = vec3.create();
    vec3.set(lightDir3, 0, -1, -0.3);
    light4.transform.lookAt(lightDir3);
    vec3.set(light4.rgb, 1.0, 0.0, 0.0);
    light4.type = LightType.SPOTLIGHT;
    this.lights.push(light4);

    const light5 = new Light();
    vec3.set(light5.transform.localPosition, 0, 0, 7.3);
    const lightDir4 = vec3.create();
    vec3.set(lightDir4, 0, -1, -0.3);
    light5.transform.lookAt(lightDir4);
    vec3.set(light5.rgb, 0.0, 1.0, 0.0);
    light5.type = LightType.SPOTLIGHT;
    this.lights.push(light5);

    const light6 = new Light();
    vec3.set(light6.transform.localPosition, 0, 0, -7.3);
    const lightDir5 = vec3.create();
    vec3.set(lightDir5, 0, -1, -0.3);
    light6.transform.lookAt(lightDir5);
    vec3.set(light6.rgb, 0.0, 0.0, 1.0);
    light6.type = LightType.SPOTLIGHT;
    this.lights.push(light6);


  // Generate Plane
    const planeBackMesh = cs380.Mesh.fromData(cs380.primitives.generatePlane(this.planeX, this.planeY));
    const planeLeftMesh = cs380.Mesh.fromData(cs380.primitives.generatePlane(this.planeZ, this.planeY));
    const planeBottomMesh = cs380.Mesh.fromData(cs380.primitives.generatePlane(this.planeX, this.planeZ));

    this.planeBack = await this.generateMesh(planeBackMesh, "#888888", 0, null, blinnPhongShader, this.lights);
    quat.rotateX(this.planeBack.transform.localRotation, this.planeBack.transform.localRotation, Math.PI);
    vec3.set(this.planeBack.transform.localPosition, 0, 0, - this.planeZ / 2);

    this.planeLeft = await this.generateMesh(planeLeftMesh, "#BBBBBB", 0, null, blinnPhongShader, this.lights);
    quat.rotateY(this.planeLeft.transform.localRotation, this.planeLeft.transform.localRotation, - Math.PI / 2);
    vec3.set(this.planeLeft.transform.localPosition, - this.planeX / 2, 0, 0);

    this.planeBottom = await this.generateMesh(planeBottomMesh, "#444444", 0, null, blinnPhongShader, this.lights);
    quat.rotateX(this.planeBottom.transform.localRotation, this.planeBottom.transform.localRotation, Math.PI / 2);
    vec3.set(this.planeBottom.transform.localPosition, 0, - this.planeY / 2, 0);
    // Generate Plane End
  
    // Generate Object
    this.lighthouse = await this.generateMesh(lighthouseMesh, "#362B00", 0, null, blinnPhongShader, this.lights);
    vec3.set(this.lighthouse.transform.localPosition, 25.0, -this.planeY / 2, 0.0);
    vec3.set(this.lighthouse.transform.localScale, 0.02, 0.02, 0.02);
    quat.rotateX(this.lighthouse.transform.localRotation, this.lighthouse.transform.localRotation, -Math.PI / 2);

    const setPixelPos = (object, x, y, z, angle = Math.PI) => {
      quat.rotateX(object.transform.localRotation, object.transform.localRotation, angle);
      vec3.set(object.transform.localPosition, x, y, z);
    }

    // Pallete
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
    this.brown = "#964B00"
    
    // Initialize Object Mesh
    const headCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(4, 3, 4));
    const headHairMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(4, 1, 4));
    const unitpixelMesh = cs380.Mesh.fromData(cs380.primitives.generatePlane(0.5, 0.5));
    const bodyCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(4, 5, 2));
    const bodyDownCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(4, 1, 2));
    const armClothCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(2, 2, 2));
    const armupCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(2, 1, 2));
    const armJointCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(1.9, 1, 1.9));
    const armdownCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(2, 3, 2));
    const legupJointCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(1.9, 1, 1.9));
    const legupCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(2, 2, 2));
    const legmidCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(1.9, 2, 1.9));
    const legdownCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(2, 1.5, 2));
    const shoesCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(2, 1, 2));

    const thinCylinderMesh = cs380.Mesh.fromData(cs380.primitives.generateCylinder(5, 0.6, 30))
    const weaponSphere = cs380.Mesh.fromData(cs380.primitives.generateSphere());
    const weaponCone = cs380.Mesh.fromData(cs380.primitives.generateCone(5, 2, 5));

    const arcBallCube = cs380.Mesh.fromData(cs380.primitives.generateCube(5, 5, 5));
    const arcBallCylinder = cs380.Mesh.fromData(cs380.primitives.generateCylinder(10, 5, 5))
    const arcBallCone = cs380.Mesh.fromData(cs380.primitives.generateCone(10, 5, 5))

    this.thingsToClear.push(headCubeMesh, headHairMesh, unitpixelMesh, bodyCubeMesh, bodyDownCubeMesh);
    this.thingsToClear.push(armClothCubeMesh, armupCubeMesh, armdownCubeMesh);
    this.thingsToClear.push(legupCubeMesh, legmidCubeMesh, legdownCubeMesh, shoesCubeMesh, arcBallCube, arcBallCylinder, arcBallCone);

    // Body
    this.bodyjoint = new Transform();
    this.bodyjoint.setParent(null);
    vec3.set(this.bodyjoint.localPosition, -20, -this.planeY / 2 + 10, 0);
    quat.rotateY(this.bodyjoint.localRotation, this.bodyjoint.localRotation, Math.PI / 4);
    this.bodyCube = await this.generateMesh(bodyCubeMesh, this.clothcolor, 2, this.bodyjoint, blinnPhongShader, this.lights);
    vec3.set(this.bodyCube.transform.localPosition, 0, 0, 0);
    this.bodyDownCube = await this.generateMesh(bodyDownCubeMesh, this.pantcolor, 2, this.bodyCube.transform, blinnPhongShader, this.lights);
    vec3.set(this.bodyDownCube.transform.localPosition, 0, -3, 0);
    
    // Head
    this.headjoint = new Transform();
    this.headjoint.setParent(this.bodyCube.transform);
    vec3.set(this.headjoint.localPosition, 0, 2.5, 0);
    this.headCube = await this.generateMesh(headCubeMesh, this.apricot, 1, this.headjoint, blinnPhongShader, this.lights);
    vec3.set(this.headCube.transform.localPosition, 0, 1.5, 0);
    this.headHair = await this.generateMesh(headHairMesh, this.haircolor, 1, this.headCube.transform, blinnPhongShader, this.lights);
    vec3.set(this.headHair.transform.localPosition, 0, 2, 0);
    this.headfrontleftHair = await this.generateMesh(unitpixelMesh, this.haircolor, 1, this.headCube.transform, blinnPhongShader, this.lights);
    setPixelPos(this.headfrontleftHair, -1.75, 1.25, 2.05);
    this.headfrontrightHair = await this.generateMesh(unitpixelMesh, this.haircolor, 1, this.headCube.transform, blinnPhongShader, this.lights);
    setPixelPos(this.headfrontrightHair, 1.75, 1.25, 2.05);
    this.headleftEye = await this.generateMesh(unitpixelMesh, this.purple, 1, this.headCube.transform, blinnPhongShader, this.lights);
    setPixelPos(this.headleftEye, -0.75, 0.25, 2.05);
    this.headrightEye = await this.generateMesh(unitpixelMesh, this.purple, 1, this.headCube.transform, blinnPhongShader, this.lights);
    setPixelPos(this.headrightEye, 0.75, 0.25, 2.05);
    this.headWhiteleftEye = await this.generateMesh(unitpixelMesh, this.white, 1, this.headCube.transform, blinnPhongShader, this.lights);
    setPixelPos(this.headWhiteleftEye, -1.25, 0.25, 2.05);
    this.headrightWhiteEye = await this.generateMesh(unitpixelMesh, this.white, 1, this.headCube.transform, blinnPhongShader, this.lights);
    setPixelPos(this.headrightWhiteEye, 1.25, 0.25, 2.05);
    this.uppermustache1 = await this.generateMesh(unitpixelMesh, this.upmustachecolor, 1, this.headCube.transform, blinnPhongShader, this.lights);
    setPixelPos(this.uppermustache1, -0.25, -0.25, 2.05);
    this.uppermustache2 = await this.generateMesh(unitpixelMesh, this.upmustachecolor, 1, this.headCube.transform, blinnPhongShader, this.lights);
    setPixelPos(this.uppermustache2, 0.25, -0.25, 2.05);
    this.downmustache1 = await this.generateMesh(unitpixelMesh, this.mustachecolor, 1, this.headCube.transform, blinnPhongShader, this.lights);
    setPixelPos(this.downmustache1, -0.75, -0.75, 2.05);
    this.downmustache2 = await this.generateMesh(unitpixelMesh, this.mustachecolor, 1, this.headCube.transform, blinnPhongShader, this.lights);
    setPixelPos(this.downmustache2, -0.75, -1.25, 2.05);
    this.downmustache3 = await this.generateMesh(unitpixelMesh, this.mustachecolor, 1, this.headCube.transform, blinnPhongShader, this.lights);
    setPixelPos(this.downmustache3, -0.25, -1.25, 2.05);
    this.downmustache4 = await this.generateMesh(unitpixelMesh, this.mustachecolor, 1, this.headCube.transform, blinnPhongShader, this.lights);
    setPixelPos(this.downmustache4, 0.25, -1.25, 2.05);
    this.downmustache5 = await this.generateMesh(unitpixelMesh, this.mustachecolor, 1, this.headCube.transform, blinnPhongShader, this.lights);
    setPixelPos(this.downmustache5, 0.75, -1.25, 2.05);
    this.downmustache6 = await this.generateMesh(unitpixelMesh, this.mustachecolor, 1, this.headCube.transform, blinnPhongShader, this.lights);
    setPixelPos(this.downmustache6, 0.75, -0.75, 2.05);
    // Head end

    //Left Arm
    this.leftArmjoint = new Transform();
    this.leftArmjoint.setParent(this.bodyCube.transform);
    vec3.set(this.leftArmjoint.localPosition, -3, 2.5, 0);
    quat.rotateX(this.leftArmjoint.localRotation, this.leftArmjoint.localRotation, - Math.PI / 2);
    this.leftArmClothCube = await this.generateMesh(armClothCubeMesh, this.clothcolor2, 3, this.leftArmjoint, blinnPhongShader, this.lights);
    vec3.set(this.leftArmClothCube.transform.localPosition, 0, -1, 0);
    this.leftUpArmCube = await this.generateMesh(armupCubeMesh, this.apricot, 3, this.leftArmClothCube.transform, blinnPhongShader, this.lights);
    vec3.set(this.leftUpArmCube.transform.localPosition, 0, -1.5, 0);
    this.leftArmJointCube = await this.generateMesh(armJointCubeMesh, this.apricot, 3, this.leftUpArmCube.transform, blinnPhongShader, this.lights);
    vec3.set(this.leftArmJointCube.transform.localPosition, 0, -0.6, 0);
    this.leftArmMidjoint = new Transform();
    this.leftArmMidjoint.setParent(this.leftArmJointCube.transform);
    vec3.set(this.leftArmMidjoint.localPosition, 0, 0, 0);
    this.leftDownArmCube = await this.generateMesh(armdownCubeMesh, this.apricot, 3, this.leftArmMidjoint, blinnPhongShader, this.lights);
    vec3.set(this.leftDownArmCube.transform.localPosition, 0, -1, 0);
    
    this.weaponCylinder = await this.generateMesh(thinCylinderMesh, this.brown, 3, this.leftDownArmCube.transform, blinnPhongShader, this.lights);
    vec3.set(this.weaponCylinder.transform.localPosition, 0, 0, -9);
    this.weaponSphere = await this.generateMesh(weaponSphere, this.brown, 3, this.weaponCylinder.transform, blinnPhongShader, this.lights);
    vec3.set(this.weaponSphere.transform.localPosition, 0, 0, 0);
    this.weaponCone = await this.generateMesh(weaponCone, "#AAAAAA", 3, this.weaponCylinder.transform, blinnPhongShader, this.lights);
    vec3.set(this.weaponCone.transform.localPosition, 0, 0, 27);


    // Right Arm
    this.rightArmjoint = new Transform();
    this.rightArmjoint.setParent(this.bodyCube.transform);
    vec3.set(this.rightArmjoint.localPosition, 3, 2.5, 0);
    this.rightArmClothCube = await this.generateMesh(armClothCubeMesh, this.clothcolor2, 4, this.rightArmjoint, blinnPhongShader, this.lights);
    vec3.set(this.rightArmClothCube.transform.localPosition, 0, -1, 0);
    this.rightUpArmCube = await this.generateMesh(armupCubeMesh, this.apricot, 4, this.rightArmClothCube.transform, blinnPhongShader, this.lights);
    vec3.set(this.rightUpArmCube.transform.localPosition, 0, -1.5, 0);
    this.rightArmJointCube = await this.generateMesh(armJointCubeMesh, this.apricot, 4, this.rightUpArmCube.transform, blinnPhongShader, this.lights);
    vec3.set(this.rightArmJointCube.transform.localPosition, 0, -0.6, 0);
    this.rightArmMidjoint = new Transform();
    this.rightArmMidjoint.setParent(this.rightArmJointCube.transform);
    vec3.set(this.rightArmMidjoint.localPosition, 0, 0, 0);
    this.rightDownArmCube = await this.generateMesh(armdownCubeMesh, this.apricot, 4, this.rightArmMidjoint, blinnPhongShader, this.lights);
    vec3.set(this.rightDownArmCube.transform.localPosition, 0, -1, 0);

    // Left Leg
    this.leftLegUpjoint = await this.generateMesh(legupJointCubeMesh, this.pantshadowcolor, 5, this.bodyCube.transform, blinnPhongShader, this.lights);
    vec3.set(this.leftLegUpjoint.transform.localPosition, -1, -3.3, 0);
    this.leftLegjoint = new Transform();
    this.leftLegjoint.setParent(this.leftLegUpjoint.transform);
    vec3.set(this.leftLegjoint.localPosition, 0, 0, 0);
    this.leftUpLegCube = await this.generateMesh(legupCubeMesh, this.pantcolor, 5, this.leftLegjoint, blinnPhongShader, this.lights);
    vec3.set(this.leftUpLegCube.transform.localPosition, 0, -1, 0);
    this.leftMidLegCube = await this.generateMesh(legmidCubeMesh, this.pantshadowcolor, 5, this.leftUpLegCube.transform, blinnPhongShader, this.lights);
    vec3.set(this.leftMidLegCube.transform.localPosition, 0, -1, 0);
    this.leftLegMidjoint = new Transform();
    this.leftLegMidjoint.setParent(this.leftMidLegCube.transform);
    vec3.set(this.leftLegMidjoint.localPosition, 0, -0.2, 0);
    this.leftDownLegCube = await this.generateMesh(legdownCubeMesh, this.pantcolor, 5, this.leftLegMidjoint, blinnPhongShader, this.lights);
    vec3.set(this.leftDownLegCube.transform.localPosition, 0, -0.4, 0);
    this.leftDownShoeCube = await this.generateMesh(shoesCubeMesh, this.shoescolor, 5, this.leftDownLegCube.transform, blinnPhongShader, this.lights);
    vec3.set(this.leftDownShoeCube.transform.localPosition, 0, -1.24, 0);

    // Right Leg
    this.rightLegUpjoint = await this.generateMesh(legupJointCubeMesh, this.pantshadowcolor, 6, this.bodyCube.transform, blinnPhongShader, this.lights);
    vec3.set(this.rightLegUpjoint.transform.localPosition, 1, -3.3, 0);
    this.rightLegjoint = new Transform();
    this.rightLegjoint.setParent(this.rightLegUpjoint.transform);
    vec3.set(this.rightLegjoint.localPosition, 0, 0, 0);
    this.rightUpLegCube = await this.generateMesh(legupCubeMesh, this.pantcolor, 6, this.rightLegjoint, blinnPhongShader, this.lights);
    vec3.set(this.rightUpLegCube.transform.localPosition, 0, -1, 0);
    this.rightMidLegCube = await this.generateMesh(legmidCubeMesh, this.pantshadowcolor, 6, this.rightUpLegCube.transform, blinnPhongShader, this.lights);
    vec3.set(this.rightMidLegCube.transform.localPosition, 0, -1, 0);
    this.rightLegMidjoint = new Transform();
    this.rightLegMidjoint.setParent(this.rightMidLegCube.transform);
    vec3.set(this.rightLegMidjoint.localPosition, 0, -0.2, 0);
    this.rightDownLegCube = await this.generateMesh(legdownCubeMesh, this.pantcolor, 6, this.rightLegMidjoint, blinnPhongShader, this.lights);
    vec3.set(this.rightDownLegCube.transform.localPosition, 0, -0.5, 0);
    this.rightDownShoeCube = await this.generateMesh(shoesCubeMesh, this.shoescolor, 6, this.rightDownLegCube.transform, blinnPhongShader, this.lights);
    vec3.set(this.rightDownShoeCube.transform.localPosition, 0, -1.25, 0);

    // ArcBall Cube
    this.ArcBallAttatchedCube = await this.generateMesh(arcBallCube , "#FF0000", 7, null, blinnPhongShader, this.lights);
    vec3.set(this.ArcBallAttatchedCube.transform.localPosition, 10, 0, 0)
  }

  async initialize() {
    // Basic setup for camera
    const { width, height } = gl.canvas.getBoundingClientRect();
    const aspectRatio = width / height;
    this.camera = new cs380.Camera();
    vec3.set(this.camera.transform.localPosition, 0, 0, 100);
    mat4.perspective(
      this.camera.projectionMatrix,
      glMatrix.toRadian(45),
      aspectRatio,
      0.1,
      1000
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
      <input type="range" min=0 max=500 value=0 step=1 id="setting-point-illuminance">
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
          vec3.set(this.lights[2].transform.localPosition, this.planeX / 2 - 10, -this.planeY / 2 + 2, val);
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
