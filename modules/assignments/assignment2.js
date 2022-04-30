import gl from "../gl.js";
import { vec3, mat4, quat, glMatrix } from "../cs380/gl-matrix.js";

import * as cs380 from "../cs380/cs380.js";

import { SimpleShader } from "../simple_shader.js";

import { Transform } from "../cs380/transform.js";

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
    this.brown = "#964B00"

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
        object.transform.setParent(parent);
      }
      this.objectList.push(object);
      return object
    }

    const setPixelPos = (object, x, y, z, angle = Math.PI) => {
      quat.rotateX(object.transform.localRotation, object.transform.localRotation, angle);
      vec3.set(object.transform.localPosition, x, y, z);
    }

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

    this.thingsToClear.push(headCubeMesh, headHairMesh, unitpixelMesh, bodyCubeMesh, bodyDownCubeMesh);
    this.thingsToClear.push(armClothCubeMesh, armupCubeMesh, armdownCubeMesh);
    this.thingsToClear.push(legupCubeMesh, legmidCubeMesh, legdownCubeMesh, shoesCubeMesh);

    // initialize picking shader & buffer
    const pickingShader = await cs380.buildShader(cs380.PickingShader);
    this.pickingBuffer = new cs380.PickingBuffer();
    this.pickingBuffer.initialize(width, height);
    this.thingsToClear.push(pickingShader, this.pickingBuffer);

    // Body
    const downervect = -7.5
    this.bodyjoint = new Transform();
    this.bodyjoint.setParent(null);
    vec3.set(this.bodyjoint.localPosition, 0, downervect, 0);
    this.bodyCube = generateMesh(bodyCubeMesh, this.clothcolor, 2, this.bodyjoint);
    vec3.set(this.bodyCube.transform.localPosition, 0, 0, 0);
    this.bodyDownCube = generateMesh(bodyDownCubeMesh, this.pantcolor, 2, this.bodyCube.transform);
    vec3.set(this.bodyDownCube.transform.localPosition, 0, -3, 0);
    
    // Head
    this.headjoint = new Transform();
    this.headjoint.setParent(this.bodyCube.transform);
    vec3.set(this.headjoint.localPosition, 0, 2.5, 0);
    this.headCube = generateMesh(headCubeMesh, this.apricot, 1, this.headjoint);
    vec3.set(this.headCube.transform.localPosition, 0, 1.5, 0);
    this.headHair = generateMesh(headHairMesh, this.haircolor, 1, this.headCube.transform);
    vec3.set(this.headHair.transform.localPosition, 0, 2, 0);
    this.headfrontleftHair = generateMesh(unitpixelMesh, this.haircolor, 1, this.headCube.transform);
    setPixelPos(this.headfrontleftHair, -1.75, 1.25, 2.05);
    this.headfrontrightHair = generateMesh(unitpixelMesh, this.haircolor, 1, this.headCube.transform);
    setPixelPos(this.headfrontrightHair, 1.75, 1.25, 2.05);
    this.headleftEye = generateMesh(unitpixelMesh, this.purple, 1, this.headCube.transform);
    setPixelPos(this.headleftEye, -0.75, 0.25, 2.05);
    this.headrightEye = generateMesh(unitpixelMesh, this.purple, 1, this.headCube.transform);
    setPixelPos(this.headrightEye, 0.75, 0.25, 2.05);
    this.headWhiteleftEye = generateMesh(unitpixelMesh, this.white, 1, this.headCube.transform);
    setPixelPos(this.headWhiteleftEye, -1.25, 0.25, 2.05);
    this.headrightWhiteEye = generateMesh(unitpixelMesh, this.white, 1, this.headCube.transform);
    setPixelPos(this.headrightWhiteEye, 1.25, 0.25, 2.05);
    this.uppermustache1 = generateMesh(unitpixelMesh, this.upmustachecolor, 1, this.headCube.transform);
    setPixelPos(this.uppermustache1, -0.25, -0.25, 2.05);
    this.uppermustache2 = generateMesh(unitpixelMesh, this.upmustachecolor, 1, this.headCube.transform);
    setPixelPos(this.uppermustache2, 0.25, -0.25, 2.05);
    this.downmustache1 = generateMesh(unitpixelMesh, this.mustachecolor, 1, this.headCube.transform);
    setPixelPos(this.downmustache1, -0.75, -0.75, 2.05);
    this.downmustache2 = generateMesh(unitpixelMesh, this.mustachecolor, 1, this.headCube.transform);
    setPixelPos(this.downmustache2, -0.75, -1.25, 2.05);
    this.downmustache3 = generateMesh(unitpixelMesh, this.mustachecolor, 1, this.headCube.transform);
    setPixelPos(this.downmustache3, -0.25, -1.25, 2.05);
    this.downmustache4 = generateMesh(unitpixelMesh, this.mustachecolor, 1, this.headCube.transform);
    setPixelPos(this.downmustache4, 0.25, -1.25, 2.05);
    this.downmustache5 = generateMesh(unitpixelMesh, this.mustachecolor, 1, this.headCube.transform);
    setPixelPos(this.downmustache5, 0.75, -1.25, 2.05);
    this.downmustache6 = generateMesh(unitpixelMesh, this.mustachecolor, 1, this.headCube.transform);
    setPixelPos(this.downmustache6, 0.75, -0.75, 2.05);
    // Head end

    //Left Arm
    this.leftArmjoint = new Transform();
    this.leftArmjoint.setParent(this.bodyCube.transform);
    vec3.set(this.leftArmjoint.localPosition, -3, 2.5, 0);
    quat.rotateX(this.leftArmjoint.localRotation, this.leftArmjoint.localRotation, - Math.PI / 2);
    this.leftArmClothCube = generateMesh(armClothCubeMesh, this.clothcolor2, 3, this.leftArmjoint);
    vec3.set(this.leftArmClothCube.transform.localPosition, 0, -1, 0);
    this.leftUpArmCube = generateMesh(armupCubeMesh, this.apricot, 3, this.leftArmClothCube.transform);
    vec3.set(this.leftUpArmCube.transform.localPosition, 0, -1.5, 0);
    this.leftArmJointCube = generateMesh(armJointCubeMesh, this.apricot, 3, this.leftUpArmCube.transform);
    vec3.set(this.leftArmJointCube.transform.localPosition, 0, -0.6, 0);
    this.leftArmMidjoint = new Transform();
    this.leftArmMidjoint.setParent(this.leftArmJointCube.transform);
    vec3.set(this.leftArmMidjoint.localPosition, 0, 0, 0);
    this.leftDownArmCube = generateMesh(armdownCubeMesh, this.apricot, 3, this.leftArmMidjoint);
    vec3.set(this.leftDownArmCube.transform.localPosition, 0, -1, 0);
    
    this.weaponCylinder = generateMesh(thinCylinderMesh, this.brown, 3, this.leftDownArmCube.transform);
    vec3.set(this.weaponCylinder.transform.localPosition, 0, 0, -9)
    this.weaponSphere = generateMesh(weaponSphere, this.brown, 3, this.weaponCylinder.transform)
    vec3.set(this.weaponSphere.transform.localPosition, 0, 0, 0)
    this.weaponCone = generateMesh(weaponCone, "#AAAAAA", 3, this.weaponCylinder.transform)
    vec3.set(this.weaponCone.transform.localPosition, 0, 0, 27)


    // Right Arm
    this.rightArmjoint = new Transform();
    this.rightArmjoint.setParent(this.bodyCube.transform);
    vec3.set(this.rightArmjoint.localPosition, 3, 2.5, 0);
    this.rightArmClothCube = generateMesh(armClothCubeMesh, this.clothcolor2, 4, this.rightArmjoint);
    vec3.set(this.rightArmClothCube.transform.localPosition, 0, -1, 0);
    this.rightUpArmCube = generateMesh(armupCubeMesh, this.apricot, 4, this.rightArmClothCube.transform);
    vec3.set(this.rightUpArmCube.transform.localPosition, 0, -1.5, 0);
    this.rightArmJointCube = generateMesh(armJointCubeMesh, this.apricot, 4, this.rightUpArmCube.transform);
    vec3.set(this.rightArmJointCube.transform.localPosition, 0, -0.6, 0);
    this.rightArmMidjoint = new Transform();
    this.rightArmMidjoint.setParent(this.rightArmJointCube.transform);
    vec3.set(this.rightArmMidjoint.localPosition, 0, 0, 0);
    this.rightDownArmCube = generateMesh(armdownCubeMesh, this.apricot, 4, this.rightArmMidjoint);
    vec3.set(this.rightDownArmCube.transform.localPosition, 0, -1, 0);

    // Left Leg
    this.leftLegUpjoint = generateMesh(legupJointCubeMesh, this.pantshadowcolor, 5, this.bodyCube.transform);
    vec3.set(this.leftLegUpjoint.transform.localPosition, -1, -3.3, 0);
    this.leftLegjoint = new Transform();
    this.leftLegjoint.setParent(this.leftLegUpjoint.transform);
    vec3.set(this.leftLegjoint.localPosition, 0, 0, 0);
    this.leftUpLegCube = generateMesh(legupCubeMesh, this.pantcolor, 5, this.leftLegjoint);
    vec3.set(this.leftUpLegCube.transform.localPosition, 0, -1, 0);
    this.leftMidLegCube = generateMesh(legmidCubeMesh, this.pantshadowcolor, 5, this.leftUpLegCube.transform);
    vec3.set(this.leftMidLegCube.transform.localPosition, 0, -1, 0);
    this.leftLegMidjoint = new Transform();
    this.leftLegMidjoint.setParent(this.leftMidLegCube.transform);
    vec3.set(this.leftLegMidjoint.localPosition, 0, -0.2, 0);
    this.leftDownLegCube = generateMesh(legdownCubeMesh, this.pantcolor, 5, this.leftLegMidjoint);
    vec3.set(this.leftDownLegCube.transform.localPosition, 0, -0.4, 0);
    this.leftDownShoeCube = generateMesh(shoesCubeMesh, this.shoescolor, 5, this.leftDownLegCube.transform);
    vec3.set(this.leftDownShoeCube.transform.localPosition, 0, -1.24, 0);

    // Right Leg
    this.rightLegUpjoint = generateMesh(legupJointCubeMesh, this.pantshadowcolor, 6, this.bodyCube.transform);
    vec3.set(this.rightLegUpjoint.transform.localPosition, 1, -3.3, 0);
    this.rightLegjoint = new Transform();
    this.rightLegjoint.setParent(this.rightLegUpjoint.transform);
    vec3.set(this.rightLegjoint.localPosition, 0, 0, 0);
    this.rightUpLegCube = generateMesh(legupCubeMesh, this.pantcolor, 6, this.rightLegjoint);
    vec3.set(this.rightUpLegCube.transform.localPosition, 0, -1, 0);
    this.rightMidLegCube = generateMesh(legmidCubeMesh, this.pantshadowcolor, 6, this.rightUpLegCube.transform);
    vec3.set(this.rightMidLegCube.transform.localPosition, 0, -1, 0);
    this.rightLegMidjoint = new Transform();
    this.rightLegMidjoint.setParent(this.rightMidLegCube.transform);
    vec3.set(this.rightLegMidjoint.localPosition, 0, -0.2, 0);
    this.rightDownLegCube = generateMesh(legdownCubeMesh, this.pantcolor, 6, this.rightLegMidjoint);
    vec3.set(this.rightDownLegCube.transform.localPosition, 0, -0.5, 0);
    this.rightDownShoeCube = generateMesh(shoesCubeMesh, this.shoescolor, 6, this.rightDownLegCube.transform);
    vec3.set(this.rightDownShoeCube.transform.localPosition, 0, -1.25, 0);

    // Left Leg

    // Event listener for interactions
    this.handleKeyDown = (e) => {
      // e.repeat is true when the key has been helded for a while
      if (e.repeat) return;
      this.onKeyDown(e.key);
    };
    this.handleKeyUp = (e) => {
      if (e.repeat) return;
      this.onKeyUp(e.key);
    }
    this.handleMouseDown = (e) => {
      // e.button = 0 if it is left mouse button
      if (e.button !== 0) return;
      this.onMouseDown(e);
    };
    this.handleMouseMove = (e) => {
      if (e.button !== 0) return;
      if (!this.Mousepressed) return;
      this.onMouseMove(e);
    }
    this.handleMouseUp = (e) => {
      if (e.button !== 0) return;
      this.onMouseUp(e);
    }

    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keyup", this.handleKeyUp);
    gl.canvas.addEventListener("mousedown", this.handleMouseDown);
    document.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("mouseup", this.handleMouseUp);
    gl.canvas.addEventListener("wheel", this.handleWheel);

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

    const vec3create = (transf) => {
      return vec3.fromValues(transf[0], transf[1], transf[2]);      
    }

    const quatcreate = (transf) => {
      return quat.fromValues(transf[0], transf[1], transf[2], transf[3]);
    }

    // Input per Animation Dictionary
    this.status2BindedList = []
    this.keyBindNum = 3
    this.status2BindedList["default"] = ["d"]
    this.status2BindedList["sit"] = ["s"]
    this.status2BindedList["walk"] = ["ArrowUp", "ArrowLeft", "ArrowRight", "ArrowDown"]

    // Implement ArcBall per Picking Objects

    this.prevMouseX = 0;
    this.prevMouseY = 0;
    this.currMouseX = 0;
    this.currMouseY = 0;

    this.Mousepressed = false;
    this.arcBallDir = vec3.fromValues(0, 1, 0);
    this.arcBallUp = vec3.fromValues(0, 1, 0);

    this.arcBallRadius = 0
    this.arcBallAltitude = Math.PI / 2
    this.arcBallAzimuth = Math.PI / 2

    // arcBallDict
    this.SelectedObjIdx = 0
    this.SelectedObject = this.bodyjoint;

    this.firstClicking = true;

    this.Idx2ArcTransform = []
    this.Idx2ArcTransform.push(this.camera.transform);
    this.Idx2ArcTransform.push(this.headjoint);
    this.Idx2ArcTransform.push(this.bodyjoint);
    this.Idx2ArcTransform.push(this.leftArmjoint);
    this.Idx2ArcTransform.push(this.rightArmjoint);
    this.Idx2ArcTransform.push(this.leftLegjoint);
    this.Idx2ArcTransform.push(this.rightLegjoint);

    this.IdxSpeedList = [1e3, 1e4 * 3, 1e4 * 3, 1e4 * 3, 1e4 * 3, 1e4 * 3, 1e4 * 3]

    // Animation Status Handling 
    this.animationStatusList = ["default", "walk", "sit", "hit", "posing"]
    this.currentStatusKey = "default"
    this.animationStartTime = 0
    this.animationKeyframeIndex = 0
    this.isAnimationRunning = false
    this.firstInput = false
    this.isPressing = false
    this.pressingTime = 0
    this.startTransformationArchieve;

    // Animation infos
    this.animationInfoDict = [];

    const createAnimation = (keyString, animationData, totalT, waitT, retT, ratioList) => {
      let dict = [];
      dict["num"] = animationData.length;
      console.log("Animation keyframe len: " + dict["num"]);
      dict["animationTime"] = totalT;
      dict["waitTime"] = waitT;
      dict["returnTime"] = retT;
      dict["keyFrameRatioList"] = ratioList;

      let datalist = [];
      for(let i = 0; i < animationData.length; i++){
        let data = [];
        data["bodyT"] = vec3create(animationData[i]["bodyT"]);
        data["bodyR"] = quatcreate(animationData[i]["bodyR"]);
        data["head"] = quatcreate(animationData[i]["head"]);
        data["armL1"] = quatcreate(animationData[i]["armL1"]);
        data["armL2"] = quatcreate(animationData[i]["armL2"]);
        data["armR1"] = quatcreate(animationData[i]["armR1"]);
        data["armR2"] = quatcreate(animationData[i]["armR2"]);
        data["legL1"] = quatcreate(animationData[i]["legL1"]);
        data["legL2"] = quatcreate(animationData[i]["legL2"]);
        data["legR1"] = quatcreate(animationData[i]["legR1"]);
        data["legR2"] = quatcreate(animationData[i]["legR2"]);
        datalist.push(data);
      }

      dict["dataList"] = datalist;
      this.animationInfoDict[keyString] = dict;
    }

    // Construct Animation

    const hPi = Math.PI / 2;

    // Default
    let defaultData = [];
    let defaultKeyframe1 = [];
    defaultKeyframe1["bodyT"] = vec3create(this.bodyCube.transform.localPosition);
    defaultKeyframe1["bodyR"] = quatcreate(this.bodyCube.transform.localRotation);
    defaultKeyframe1["head"] = quatcreate(this.headjoint.localRotation);
    defaultKeyframe1["armL1"] = quatcreate(this.leftArmjoint.localRotation);
    defaultKeyframe1["armL2"] = quatcreate(this.leftArmMidjoint.localRotation);
    defaultKeyframe1["armR1"] = quatcreate(this.rightArmjoint.localRotation);
    defaultKeyframe1["armR2"] = quatcreate(this.rightArmMidjoint.localRotation);
    defaultKeyframe1["legL1"] = quatcreate(this.leftLegjoint.localRotation);
    defaultKeyframe1["legL2"] = quatcreate(this.leftLegMidjoint.localRotation);
    defaultKeyframe1["legR1"] = quatcreate(this.rightLegjoint.localRotation);
    defaultKeyframe1["legR2"] = quatcreate(this.rightLegMidjoint.localRotation);
    defaultKeyframe1["timeRatio"] = 1;
    defaultData.push(defaultKeyframe1);
    let defaultRatioList = [1]
    createAnimation("default", defaultData, 1, 1, 0, defaultRatioList);

    // Walk
    let walkData = [];
    let walkKeyframe1 = [];
    walkKeyframe1["bodyT"] = new vec3.fromValues(0, 0, 0);
    walkKeyframe1["bodyR"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe1["head"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe1["armL1"] = quat.fromEuler(new quat.create(), -80, 0, 0);
    walkKeyframe1["armL2"] = quat.fromEuler(new quat.create(), -50, 0, 0);
    walkKeyframe1["armR1"] = quat.fromEuler(new quat.create(), 50, 0, 0);
    walkKeyframe1["armR2"] = quat.fromEuler(new quat.create(), -50, 0, 0);
    walkKeyframe1["legL1"] = quat.fromEuler(new quat.create(), 50, 0, 0);
    walkKeyframe1["legL2"] = quat.fromEuler(new quat.create(), 30, 0, 0);
    walkKeyframe1["legR1"] = quat.fromEuler(new quat.create(), -70, 0, 0);
    walkKeyframe1["legR2"] = quat.fromEuler(new quat.create(), 30, 0, 0);
    walkData.push(walkKeyframe1);
    let walkKeyframe2 = [];
    walkKeyframe2["bodyT"] = new vec3.fromValues(0, 0, 0);
    walkKeyframe2["bodyR"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe2["head"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe2["armL1"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe2["armL2"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe2["armR1"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe2["armR2"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe2["legL1"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe2["legL2"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe2["legR1"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe2["legR2"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkData.push(walkKeyframe2);
    let walkKeyframe3 = [];
    walkKeyframe3["bodyT"] = new vec3.fromValues(0, 0, 0);
    walkKeyframe3["bodyR"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe3["head"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe3["armL1"] = quat.fromEuler(new quat.create(), 50, 0, 0);
    walkKeyframe3["armL2"] = quat.fromEuler(new quat.create(), -50, 0, 0);
    walkKeyframe3["armR1"] = quat.fromEuler(new quat.create(), -80, 0, 0);
    walkKeyframe3["armR2"] = quat.fromEuler(new quat.create(), -50, 0, 0);
    walkKeyframe3["legL1"] = quat.fromEuler(new quat.create(), -70, 0, 0);
    walkKeyframe3["legL2"] = quat.fromEuler(new quat.create(), 30, 0, 0);
    walkKeyframe3["legR1"] = quat.fromEuler(new quat.create(), 50, 0, 0);
    walkKeyframe3["legR2"] = quat.fromEuler(new quat.create(), 30, 0, 0);
    walkData.push(walkKeyframe3);
    let walkKeyframe4 = [];
    walkKeyframe4["bodyT"] = new vec3.fromValues(0, 0, 0);
    walkKeyframe4["bodyR"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe4["head"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe4["armL1"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe4["armL2"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe4["armR1"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe4["armR2"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe4["legL1"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe4["legL2"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe4["legR1"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe4["legR2"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkData.push(walkKeyframe4);
    let walkFrameList = [0.33, 0.17, 0.33, 0.17];
    createAnimation("walk", walkData, 0.7, 0, 0, walkFrameList);

    // Sit
    let sitData = [];
    let sitKeyframe1 = [];
    sitKeyframe1["bodyT"] = new vec3.fromValues(0, - 3, 1);
    sitKeyframe1["bodyR"] = quat.fromEuler(new quat.create(), 60, 0, 0);
    sitKeyframe1["head"] = quat.fromEuler(new quat.create(), -60, 0, 0);
    sitKeyframe1["armL1"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    sitKeyframe1["armL2"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    sitKeyframe1["armR1"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    sitKeyframe1["armR2"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    sitKeyframe1["legL1"] = quat.fromEuler(new quat.create(), -120, 0, 0);
    sitKeyframe1["legL2"] = quat.fromEuler(new quat.create(), 60, 0, 0);
    sitKeyframe1["legR1"] = quat.fromEuler(new quat.create(), -120, 0, 0);
    sitKeyframe1["legR2"] = quat.fromEuler(new quat.create(), 60, 0, 0);
    sitData.push(sitKeyframe1);
    let sitFrameList = [1];
    createAnimation("sit", sitData, 0.1, 0, 0.5, sitFrameList);

  }

  archieveCurrentStatus = () => {
    let data = [];
    data["bodyT"] = vec3create(this.bodyCube.transform.localPosition);
    data["bodyR"] = quatcreate(this.bodyCube.transform.localRotation);
    data["head"] = quatcreate(this.headjoint.localRotation);
    data["armR1"] = quatcreate(this.rightArmjoint.localRotation);
    data["armR2"] = quatcreate(this.rightArmMidjoint.localRotation);
    data["legR1"] = quatcreate(this.rightLegjoint.localRotation);
    data["legR2"] = quatcreate(this.rightLegMidjoint.localRotation);
    this.startTransformationArchieve = data;
  }

  setAnimationStatus(idx){
    console.log(this.animationStatusList[idx]);
    this.currentStatusKey = this.animationStatusList[idx];
    this.isAnimationRunning = true
    this.firstInput = true
    this.isPressing = true
    this.pressingTime = 0;
  }

  animationMove(fromvect, tovect , ratio){
    let x = fromvect[0] + (tovect[0] -  fromvect[0]) * ratio;
    let y = fromvect[1] + (tovect[1] -  fromvect[1]) * ratio;
    let z = fromvect[2] + (tovect[2] -  fromvect[2]) * ratio;
    
    vec3.set(fromvect, x, y, z);
  }

  animationRotate(fromT, toT, ratio){
    quat.lerp(fromT, fromT, toT, ratio)
  }

  updateAnimation(elapsed){
    // Only One Animation at a time
    if (this.firstInput){
      this.animationStartTime = elapsed;
      this.firstInput = false;
    }

    if (!this.isAnimationRunning) return;

    let currentAnimationInfo = this.animationInfoDict[this.currentStatusKey];

    let animationTime = currentAnimationInfo["animationTime"];
    let waitTime = currentAnimationInfo["waitTime"];
    let returnTime = currentAnimationInfo["returnTime"];
    let totalTime = animationTime + waitTime + returnTime;
    let totalFrame = currentAnimationInfo["num"];

    if (totalFrame != currentAnimationInfo["dataList"].length){
      console.log("Error! " + currentAnimationInfo + " DataList Length is Different!");
    }

    let timePassed = elapsed - this.animationStartTime - this.pressingTime;
    // is Pressing, keep walking
    if(this.isPressing && this.currentStatusKey == "walk" && timePassed >= animationTime + waitTime){
      this.setAnimationStatus(1);
      return;
    }
    if (timePassed > totalTime){
      this.isAnimationRunning = false;
      return;
    }
    if (timePassed > animationTime && timePassed < animationTime + waitTime){
      return;
    }
    // Return to Default state
    if (timePassed > animationTime + waitTime){
      if(this.isPressing){
        this.pressingTime += timePassed - animationTime + waitTime;
        timePassed = timePassed - animationTime - waitTime;
        return;
      }
      // Now Play KeyFrame Animation
      currentAnimationInfo = this.animationInfoDict["default"]
      let currentKeyframeData = currentAnimationInfo["dataList"][0];
      let currentMoveRatio = (timePassed - waitTime - animationTime) / returnTime
      if (currentMoveRatio > 0.8){
        currentMoveRatio = 1
      }
      this.animationMove(this.bodyCube.transform.localPosition, currentKeyframeData["bodyT"], currentMoveRatio);
      this.animationRotate(this.bodyCube.transform.localRotation, currentKeyframeData["bodyR"], currentMoveRatio);
      this.animationRotate(this.headjoint.localRotation, currentKeyframeData["head"], currentMoveRatio);
      this.animationRotate(this.leftArmjoint.localRotation, currentKeyframeData["armL1"], currentMoveRatio);
      this.animationRotate(this.leftArmMidjoint.localRotation, currentKeyframeData["armL2"], currentMoveRatio);
      this.animationRotate(this.rightArmjoint.localRotation, currentKeyframeData["armR1"], currentMoveRatio);
      this.animationRotate(this.rightArmMidjoint.localRotation, currentKeyframeData["armR2"], currentMoveRatio);
      this.animationRotate(this.leftLegjoint.localRotation, currentKeyframeData["legL1"], currentMoveRatio);
      this.animationRotate(this.leftLegMidjoint.localRotation, currentKeyframeData["legL2"], currentMoveRatio);
      this.animationRotate(this.rightLegjoint.localRotation, currentKeyframeData["legR1"], currentMoveRatio);
      this.animationRotate(this.rightLegMidjoint.localRotation, currentKeyframeData["legR2"], currentMoveRatio);
      return;
    }

    let idx = 0;
    let ratioList = currentAnimationInfo["keyFrameRatioList"];
    let accumulatedRatio = 0;
    let currentRatio = 0;
    for (let i = 0; i< currentAnimationInfo["num"]; i++){
      currentRatio = ratioList[i];
      if (timePassed >= accumulatedRatio * animationTime && timePassed <= animationTime * (accumulatedRatio + currentRatio)){
        idx = i;
        break;
      }
      accumulatedRatio += currentRatio
    }
    // Now Play KeyFrame Animation
    let currentKeyframeData = currentAnimationInfo["dataList"][idx];
    let currentMoveRatio = (timePassed - accumulatedRatio * animationTime) / (animationTime * currentRatio)
    if (currentMoveRatio > 0.8){
      currentMoveRatio = 1
    }
    this.animationMove(this.bodyCube.transform.localPosition, currentKeyframeData["bodyT"], currentMoveRatio);
    this.animationRotate(this.bodyCube.transform.localRotation, currentKeyframeData["bodyR"], currentMoveRatio);
    this.animationRotate(this.headjoint.localRotation, currentKeyframeData["head"], currentMoveRatio);
    this.animationRotate(this.leftArmjoint.localRotation, currentKeyframeData["armL1"], currentMoveRatio);
    this.animationRotate(this.leftArmMidjoint.localRotation, currentKeyframeData["armL2"], currentMoveRatio);
    this.animationRotate(this.rightArmjoint.localRotation, currentKeyframeData["armR1"], currentMoveRatio);
    this.animationRotate(this.rightArmMidjoint.localRotation, currentKeyframeData["armR2"], currentMoveRatio);
    this.animationRotate(this.leftLegjoint.localRotation, currentKeyframeData["legL1"], currentMoveRatio);
    this.animationRotate(this.leftLegMidjoint.localRotation, currentKeyframeData["legL2"], currentMoveRatio);
    this.animationRotate(this.rightLegjoint.localRotation, currentKeyframeData["legR1"], currentMoveRatio);
    this.animationRotate(this.rightLegMidjoint.localRotation, currentKeyframeData["legR2"], currentMoveRatio);
  }

  onKeyDown(key) {
    for(let i = 0; i < this.keyBindNum; i++){
      let mappedList = this.status2BindedList[this.animationStatusList[i]];
      for(let j = 0; j < mappedList.length; j++){
        if(key == mappedList[j]){
          this.setAnimationStatus(i);
          return;
        }
      }
    }
    console.log(`key down: ${key}`);
  }

  onKeyUp(key) {
    for(let i = 0; i < this.keyBindNum; i++){
      let mappedList = this.status2BindedList[this.animationStatusList[i]];
      for(let j = 0; j < mappedList.length; j++){
        if(key == mappedList[j]){
          if (this.animationStatusList[i] == this.currentStatusKey){
            this.isPressing = false;
          }
          console.log(`key up: ${key}`);
          return;
        }
      }
    }
  }

  onMouseDown(e) {
    const { left, bottom } = gl.canvas.getBoundingClientRect();
    const mouseX = e.clientX - left;
    const mouseY = bottom - e.clientY;

    this.prevMouseX = mouseX;
    this.prevMouseY = mouseY;
    this.currMouseX = mouseX;
    this.currMouseY = mouseY;

    // Object with this index has just picked
    const index = this.pickingBuffer.pick(mouseX, mouseY);

    if (index != this.SelectedObjIdx){
      this.arcBallAltitude = Math.PI / 2
      this.arcBallAzimuth = Math.PI / 2
    }

    this.Mousepressed = true;
    this.SelectedObjIdx = index;
    this.SelectedObject = this.Idx2ArcTransform[this.SelectedObjIdx];
    console.log(`Select Index: ${index}`);
  }

  onMouseMove(e) {
    console.log("Move")
    const canvas = gl.canvas;
    if (!this.Mousepressed) return;
    const rect = canvas.getBoundingClientRect();
    this.prevMouseX = this.currMouseX;
    this.prevMouseY = this.currMouseY;
    this.currMouseX = e.clientX - rect.left;
    this.currMouseY = rect.bottom - e.clientY;
  }

  onMouseUp(e) {
    this.Mousepressed = false;

    this.firstClicking = false;
  }

  arcBallUpdate(dt, damping = 0.5) {
    if (!this.Mousepressed){
      return;
    }

    let speed = this.IdxSpeedList[this.SelectedObjIdx]

    let deltaX = (this.currMouseX - this.prevMouseX) / gl.canvas.clientWidth;
    let deltaY = (this.currMouseY - this.prevMouseY) / gl.canvas.clientHeight;
    if (!this.pressed) {
      const damp = Math.pow(damping, dt);
      this.prevMouseX = damp * this.prevMouseX + (1 - damp) * this.currMouseX;
      this.prevMouseY = damp * this.prevMouseY + (1 - damp) * this.currMouseY;
    } else {
      this.prevMouseX = this.currMouseX;
      this.prevMouseY = this.currMouseY;
    }

    speed *= Math.PI / 180;
    if (this.radius == 0) speed *= -1;
    this.arcBallAltitude += deltaY * speed * dt;
    this.arcBallAltitude = Math.max(0.0001, Math.min(this.arcBallAltitude, Math.PI - 0.0001));

    this.arcBallAzimuth += deltaX * speed * dt;
    while (this.arcBallAzimuth < -Math.PI) this.arcBallAzimuth += 2 * Math.PI;
    while (this.arcBallAzimuth > Math.PI) this.arcBallAzimuth -= 2 * Math.PI;

    const dir = this.arcBallDir;
    const dirR = this.arcBallRadius == 0 ? 1 : this.arcBallRadius;
    const pos = this.SelectedObject.localPosition;

    const r = dirR * Math.sin(this.arcBallAltitude);
    const y = - dirR * Math.cos(this.arcBallAltitude);
    const x = - r * Math.cos(this.arcBallAzimuth);
    const z = r * Math.sin(this.arcBallAzimuth);

    vec3.set(dir, x, y, z);
    if (this.radius > 0) vec3.add(pos, this.SelectedObject.localPosition, dir);
    else vec3.set(pos, ...this.SelectedObject.localPosition);

    vec3.normalize(dir, dir);
    vec3.negate(dir, dir);
    this.SelectedObject.lookAt(dir, this.arcBallUp);
  }

  finalize() {
    // Finalize WebGL objects (mesh, shader, texture, ...)
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
    gl.canvas.removeEventListener("mousedown", this.handleMouseDown);
    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("mouseup", this.handleMouseUp);
    gl.canvas.removeEventListener("wheel", this.handleWheel);
    this.thingsToClear.forEach((it) => it.finalize());
  }

  update(elapsed, dt) {
    // Updates before rendering here
    // if (!this.Mousepressed)
      // this.simpleOrbitControl.update(dt);

    this.arcBallUpdate(dt);

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
    this.updateAnimation(elapsed);
    //quat.rotateY(this.bodyjoint.localRotation, this.bodyjoint.localRotation, dt / 2);
  }
}
