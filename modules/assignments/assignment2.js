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
    const unitpixelmesh = cs380.Mesh.fromData(cs380.primitives.generatePlane(0.5, 0.5));
    const bodyCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(4, 5, 2));
    const bodyDownCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(4, 1, 2));
    const armClothCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(2, 2, 2));
    const armupCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(2, 1, 2));
    const armdownCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(2, 3, 2));
    const legupCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(2, 2, 2));
    const legmidCubeMesh = cs380.Mesh.fromData(cs380.primitives.generateCube(1.9, 2, 1.9));
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
    this.headfrontleftHair = generateMesh(unitpixelmesh, this.haircolor, 1, this.headCube.transform);
    setPixelPos(this.headfrontleftHair, -1.75, 1.25, 2.05);
    this.headfrontrightHair = generateMesh(unitpixelmesh, this.haircolor, 1, this.headCube.transform);
    setPixelPos(this.headfrontrightHair, 1.75, 1.25, 2.05);
    this.headleftEye = generateMesh(unitpixelmesh, this.purple, 1, this.headCube.transform);
    setPixelPos(this.headleftEye, -0.75, 0.25, 2.05);
    this.headrightEye = generateMesh(unitpixelmesh, this.purple, 1, this.headCube.transform);
    setPixelPos(this.headrightEye, 0.75, 0.25, 2.05);
    this.headWhiteleftEye = generateMesh(unitpixelmesh, this.white, 1, this.headCube.transform);
    setPixelPos(this.headWhiteleftEye, -1.25, 0.25, 2.05);
    this.headrightWhiteEye = generateMesh(unitpixelmesh, this.white, 1, this.headCube.transform);
    setPixelPos(this.headrightWhiteEye, 1.25, 0.25, 2.05);
    this.uppermustache1 = generateMesh(unitpixelmesh, this.upmustachecolor, 1, this.headCube.transform);
    setPixelPos(this.uppermustache1, -0.25, -0.25, 2.05);
    this.uppermustache2 = generateMesh(unitpixelmesh, this.upmustachecolor, 1, this.headCube.transform);
    setPixelPos(this.uppermustache2, 0.25, -0.25, 2.05);
    this.downmustache1 = generateMesh(unitpixelmesh, this.mustachecolor, 1, this.headCube.transform);
    setPixelPos(this.downmustache1, -0.75, -0.75, 2.05);
    this.downmustache2 = generateMesh(unitpixelmesh, this.mustachecolor, 1, this.headCube.transform);
    setPixelPos(this.downmustache2, -0.75, -1.25, 2.05);
    this.downmustache3 = generateMesh(unitpixelmesh, this.mustachecolor, 1, this.headCube.transform);
    setPixelPos(this.downmustache3, -0.25, -1.25, 2.05);
    this.downmustache4 = generateMesh(unitpixelmesh, this.mustachecolor, 1, this.headCube.transform);
    setPixelPos(this.downmustache4, 0.25, -1.25, 2.05);
    this.downmustache5 = generateMesh(unitpixelmesh, this.mustachecolor, 1, this.headCube.transform);
    setPixelPos(this.downmustache5, 0.75, -1.25, 2.05);
    this.downmustache6 = generateMesh(unitpixelmesh, this.mustachecolor, 1, this.headCube.transform);
    setPixelPos(this.downmustache6, 0.75, -0.75, 2.05);
    // Head end

    // Right Arm
    this.rightArmjoint = new Transform();
    this.rightArmjoint.setParent(this.bodyCube.transform);
    vec3.set(this.rightArmjoint.localPosition, 3, 2.5, 0);
    this.rightArmClothCube = generateMesh(armClothCubeMesh, this.clothcolor2, 3, this.rightArmjoint);
    vec3.set(this.rightArmClothCube.transform.localPosition, 0, -1, 0);
    this.rigthUpArmCube = generateMesh(armupCubeMesh, this.apricot, 3, this.rightArmClothCube.transform);
    vec3.set(this.rigthUpArmCube.transform.localPosition, 0, -1.5, 0);
    this.rightArmMidjoint = new Transform();
    this.rightArmMidjoint.setParent(this.rigthUpArmCube.transform);
    vec3.set(this.rightArmMidjoint.localPosition, 0, -0.3, 0);
    this.rigthDownArmCube = generateMesh(armdownCubeMesh, this.apricot, 3, this.rightArmMidjoint);
    vec3.set(this.rigthDownArmCube.transform.localPosition, 0, -1.5, 0);

    // Left Arm

    // Right Leg
    this.rightLegjoint = new Transform();
    this.rightLegjoint.setParent(this.bodyCube.transform);
    vec3.set(this.rightLegjoint.localPosition, 1, -3.2, 0);
    this.rightUpLegCube = generateMesh(legupCubeMesh, this.pantcolor, 5, this.rightLegjoint);
    vec3.set(this.rightUpLegCube.transform.localPosition, 0, -1, 0);
    this.rightMidLegCube = generateMesh(legmidCubeMesh, this.pantshadowcolor, 5, this.rightUpLegCube.transform);
    vec3.set(this.rightMidLegCube.transform.localPosition, 0, -1.25, 0);
    this.rightLegMidjoint = new Transform();
    this.rightLegMidjoint.setParent(this.rightMidLegCube.transform);
    vec3.set(this.rightLegMidjoint.localPosition, 0, -0.4, 0);
    this.rightDownLegCube = generateMesh(legdownCubeMesh, this.pantcolor, 5, this.rightLegMidjoint);
    vec3.set(this.rightDownLegCube.transform.localPosition, 0, -0.5, 0);
    this.rightDownShoeCube = generateMesh(shoesCubeMesh, this.shoescolor, 5, this.rightDownLegCube.transform);
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

    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keyup", this.handleKeyUp);
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

    const vec3create = (transf) => {
      return vec3.fromValues(transf[0], transf[1], transf[2]);      
    }

    const quatcreate = (transf) => {
      return quat.fromValues(transf[0], transf[1], transf[2], transf[3]);
    }

    // Input per Animation Dictionary
    this.status2BindedList = []
    this.keyBindNum = 2
    this.status2BindedList["sit"] = ["s"]
    this.status2BindedList["walk"] = ["ArrowUp", "ArrowLeft", "ArrowRight", "ArrowBack"]

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
        data["armR1"] = quatcreate(animationData[i]["armR1"]);
        data["armR2"] = quatcreate(animationData[i]["armR2"]);
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
    defaultKeyframe1["armR1"] = quatcreate(this.rightArmjoint.localRotation);
    defaultKeyframe1["armR2"] = quatcreate(this.rightArmMidjoint.localRotation);
    defaultKeyframe1["legR1"] = quatcreate(this.rightLegjoint.localRotation);
    defaultKeyframe1["legR2"] = quatcreate(this.rightLegMidjoint.localRotation);
    defaultKeyframe1["timeRatio"] = 1;
    defaultData.push(defaultKeyframe1);
    let defaultRatioList = [1]
    createAnimation("default", defaultData, 1, 1, 1, defaultRatioList);

    // Walk
    let walkData = [];
    let walkKeyframe1 = [];
    walkKeyframe1["bodyT"] = new vec3.fromValues(0, downervect, 0);
    walkKeyframe1["bodyR"] = new quat.fromValues(0, 0, 0, 1);
    walkKeyframe1["head"] = new quat.fromValues(0, 0, 0, 1);
    walkKeyframe1["armR1"] = new quat.fromValues(hPi / 3, 0, 0, 1);
    walkKeyframe1["armR2"] = new quat.fromValues(- hPi / 6, 0, 0, 1);
    walkKeyframe1["legR1"] = new quat.fromValues(- hPi  / 3, 0, 0, 1);
    walkKeyframe1["legR2"] = new quat.fromValues(hPi / 6, 0, 0, 1);
    walkData.push(walkKeyframe1);
    let walkKeyframe2 = [];
    walkKeyframe2["bodyT"] = new vec3.fromValues(0, downervect, 0);
    walkKeyframe2["bodyR"] = new quat.fromValues(0, 0, 0, 1);
    walkKeyframe2["head"] = new quat.fromValues(0, 0, 0, 1);
    walkKeyframe2["armR1"] = new quat.fromValues(0, 0, 0, 1);
    walkKeyframe2["armR2"] = new quat.fromValues(0, 0, 0, 1);
    walkKeyframe2["legR1"] = new quat.fromValues(0, 0, 0, 1);
    walkKeyframe2["legR2"] = new quat.fromValues(0, 0, 0, 1);
    walkData.push(walkKeyframe2);
    let walkKeyframe3 = [];
    walkKeyframe3["bodyT"] = new vec3.fromValues(0, downervect, 0);
    walkKeyframe3["bodyR"] = new quat.fromValues(0, 0, 0, 1);
    walkKeyframe3["head"] = new quat.fromValues(0, 0, 0, 1);
    walkKeyframe3["armR1"] = new quat.fromValues(- hPi / 3, 0, 0, 1);
    walkKeyframe3["armR2"] = new quat.fromValues(- hPi / 6, 0, 0, 1);
    walkKeyframe3["legR1"] = new quat.fromValues(hPi / 3, 0, 0, 1);
    walkKeyframe3["legR2"] = new quat.fromValues(hPi / 6, 0, 0, 1);
    walkData.push(walkKeyframe3);
    let walkKeyframe4 = [];
    walkKeyframe4["bodyT"] = new vec3.fromValues(0, downervect, 0);
    walkKeyframe4["bodyR"] = new quat.fromValues(0, 0, 0, 1);
    walkKeyframe4["head"] = new quat.fromValues(0, 0, 0, 1);
    walkKeyframe4["armR1"] = new quat.fromValues(0, 0, 0, 1);
    walkKeyframe4["armR2"] = new quat.fromValues(0, 0, 0, 1);
    walkKeyframe4["legR1"] = new quat.fromValues(0, 0, 0, 1);
    walkKeyframe4["legR2"] = new quat.fromValues(0, 0, 0, 1);
    walkData.push(walkKeyframe4);
    let walkFrameList = [0.25, 0.25, 0.25, 0.25];
    createAnimation("walk", walkData, 1, 0, 0, walkFrameList);

    // Sit
    let sitData = [];
    let sitKeyframe1 = [];
    sitKeyframe1["bodyT"] = new vec3.fromValues(0, downervect, 0);
    sitKeyframe1["bodyR"] = new quat.fromValues(hPi / 3, 0, 0, 1);
    sitKeyframe1["head"] = new quat.fromValues(- hPi / 3, 0, 0, 1);
    sitKeyframe1["armR1"] = new quat.fromValues(0, 0, 0, 1);
    sitKeyframe1["armR2"] = new quat.fromValues(0, 0, 0, 1);
    sitKeyframe1["legR1"] = new quat.fromValues(- hPi * 2 / 3, 0, 0, 1);
    sitKeyframe1["legR2"] = new quat.fromValues(hPi / 3, 0, 0, 1);
    sitData.push(sitKeyframe1);
    let sitFrameList = [1];
    createAnimation("sit", sitData, 2, 0, 0.5, sitFrameList);

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
    let x = (toT[0] -  fromT[0]) * ratio;
    let y = (toT[1] -  fromT[1]) * ratio;
    let z = (toT[2] -  fromT[2]) * ratio;

    quat.rotateX(fromT, fromT, x);
    quat.rotateY(fromT, fromT, y);
    quat.rotateZ(fromT, fromT, z);
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
    if (timePassed > totalTime){
      this.isAnimationRunning = false;
      return;
    }
    if (timePassed > animationTime && timePassed < animationTime + waitTime){
      return;
    }
    // Return to Default state
    if (timePassed > animationTime + waitTime){
      // is Pressing, keep 
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
      this.animationRotate(this.rightArmjoint.localRotation, currentKeyframeData["armR1"], currentMoveRatio);
      this.animationRotate(this.rightArmMidjoint.localRotation, currentKeyframeData["armR2"], currentMoveRatio);
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
    this.animationRotate(this.rightArmjoint.localRotation, currentKeyframeData["armR1"], currentMoveRatio);
    this.animationRotate(this.rightArmMidjoint.localRotation, currentKeyframeData["armR2"], currentMoveRatio);
    this.animationRotate(this.rightLegjoint.localRotation, currentKeyframeData["legR1"], currentMoveRatio);
    this.animationRotate(this.rightLegMidjoint.localRotation, currentKeyframeData["legR2"], currentMoveRatio);
    console.log(this.bodyCube.transform.localRotation)
    console.log("ASDFASDf")
  }

  onKeyDown(key) {
    for(let i = 1; i <= this.keyBindNum; i++){
      let mappedList = this.status2BindedList[this.animationStatusList[i]];
      for(let j = 0; j < mappedList.length; j++){
        if(key == mappedList[j]){
          this.setAnimationStatus(i);
          console.log(`key down: ${key}`);
          return;
        }
      }
    }
  }

  onKeyUp(key) {
    if (key == "s"){
      console.log("Sit up");
      if (this.currentStatusKey == "sit"){
        this.isPressing = false;
      }
    }
    console.log(`key Up: ${key}`);
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
    this.updateAnimation(elapsed);
  }
}
