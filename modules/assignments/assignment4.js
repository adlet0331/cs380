import gl from "../gl.js";
import { vec3, mat4, quat } from "../cs380/gl-matrix.js";

import * as cs380 from "../cs380/cs380.js";

import { Skybox, SkyboxShader } from "../skybox_shader.js";

import { LightType, Light, BlinnPhongShader, Material } from "../blinn_phong.js";

import { Transform } from "../cs380/transform.js";

import { UnlitTextureShader } from "../unlit_texture_shader.js";
import { PipEdgeShader } from "../pip_edge_shader.js";
import Assignment1 from "./assignment1.js";

class PhotoFilm {
  async initialize(width, height) {
    this.enabled = false;
    this.printFinished = false;
    this.width = width;
    this.height = height;

    this.framebuffer = new Framebuffer();
    this.framebuffer.initialize(width, height);

    const planeMeshData = cs380.primitives.generatePlane(1,1);
    const planeMesh = cs380.Mesh.fromData(planeMeshData);
    const shader = await cs380.buildShader(UnlitTextureShader);
    
    this.transform = new cs380.Transform();
    quat.rotateY(this.transform.localRotation, quat.create(), Math.PI);

    this.background = new cs380.RenderObject(planeMesh, shader);
    this.background.uniforms.useScreenSpace = true;
    this.background.uniforms.useColor = true;
    this.background.uniforms.solidColor = vec3.fromValues(1,1,1);
    vec3.set(this.background.transform.localScale, 1.2, 1.4, 1);
    this.background.transform.setParent(this.transform);

    this.image = new cs380.RenderObject(planeMesh, shader);
    this.image.uniforms.useScreenSpace = true;
    this.image.uniforms.useColor = false;
    this.image.uniforms.mainTexture = this.framebuffer.colorTexture;
    vec3.set(this.image.transform.localPosition, 0, 0.1, 0);
    this.image.transform.setParent(this.transform);

    this.thingsToClear = [shader, planeMesh, this.framebuffer];

    this.handleMouseDown = (e) => {
      if (this.printFinished) this.hide();
    }
    document.addEventListener("mousedown", this.handleMouseDown);
  }

  render(camera) {
    if (!this.enabled) return;
    const prevDepthFunc = gl.getParameter(gl.DEPTH_FUNC);
    gl.depthFunc(gl.ALWAYS);
    this.background.render(camera);
    this.image.render(camera);
    gl.depthFunc(prevDepthFunc);
  }

  finalize() {
    for (const thing of this.thingsToClear) {
      thing.finalize();
    }

    document.removeEventListener("mousedown", this.handleMouseDown);
  }

  show(elapsed) {
    this.enabled = true;
    this.printFinished = false;
    this.showStartTime = elapsed;
  }

  update(elapsed) {
    if (!this.enabled) return;
    const time = elapsed - this.showStartTime;
    let yPos = 2 - Math.min(2, time * 2.8); //TODO : NEED TO CHANGE TO 0.8
    this.transform.localPosition[1] = yPos;

    this.printFinished = yPos < 0.001;
  }

  hide() {
    this.enabled = false;
  }
}
class TextureShader extends cs380.BaseShader {
  static get source() {
    return [
      [gl.VERTEX_SHADER, 'resources/uv_simple.vert'],
      [gl.FRAGMENT_SHADER, 'resources/uv_simple.frag']
    ];
  }
  generateUniformLocations() {
    return {
      projectionMatrix: gl.getUniformLocation(this.program, 'projectionMatrix'),
      cameraTransform: gl.getUniformLocation(this.program, 'cameraTransform'),
      modelTransform: gl.getUniformLocation(this.program, 'modelTransform'),
      mainTexture: gl.getUniformLocation(this.program, 'mainTexture'),
    };
  }
  setUniforms(kv) {
    this.setUniformMat4(kv, 'projectionMatrix');
    this.setUniformMat4(kv, 'cameraTransform');
    this.setUniformMat4(kv, 'modelTransform');
    this.setUniformTexture(kv, 'mainTexture', 0);
  }
}
class Framebuffer {
  constructor() {
    this.finalize();
  }

  finalize() {
    gl.deleteTexture(this.colorTexture);
    gl.deleteRenderbuffer(this.dbo);
    gl.deleteFramebuffer(this.fbo);
    this.initialized = false;
  }

  initialize(width, height) {
    if (this.initialized) this.finalize();

    this.fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    this.colorTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.colorTexture);
    // Unlike picking buffer, it uses linear sampling
    // so that the sampled image is less blocky under extreme distortion
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGB,
      width,
      height,
      0,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      null
    );

    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.colorTexture,
      0
    );

    this.dbo = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.dbo);
    gl.renderbufferStorage(
      gl.RENDERBUFFER,
      gl.DEPTH_COMPONENT16,
      width,
      height
    );

    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.RENDERBUFFER,
      this.dbo
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
}
class Pip {
  async initialize(width, height, trans, scale) {
    this.framebuffer = new Framebuffer();
    this.framebuffer.initialize(width, height);

    const planeMeshData = cs380.primitives.generatePlane(1,1);
    const planeMesh = cs380.Mesh.fromData(planeMeshData);
    const shader = await cs380.buildShader(TextureShader);
    
    this.transform = new cs380.Transform();
    quat.rotateY(this.transform.localRotation, quat.create(), Math.PI);

    this.image = new cs380.RenderObject(planeMesh, shader);
    this.image.uniforms.useScreenSpace = false;
    this.image.uniforms.useColor = true;
    this.image.uniforms.mainTexture = this.framebuffer.colorTexture;
    this.image.uniforms.width = width;
    this.image.uniforms.height = height;
    this.image.transform.localPosition = trans;
    this.image.transform.localScale = scale;
    this.image.transform.setParent(this.transform);

    this.thingsToClear = [shader, planeMesh, this.framebuffer];
  }

  render(camera) {
    //const prevDepthFunc = gl.getParameter(gl.DEPTH_FUNC);
    //gl.depthFunc(gl.ALWAYS);
    this.image.render(camera);
    //gl.depthFunc(prevDepthFunc);
  }
  finalize(){
    for (const thing of this.thingsToClear){
      thing.finalize();    
    }
  }
}
class CameraEffectPip {
  async initialize(width, height, trans, scale) {
    this.framebuffer = new Framebuffer();
    this.framebuffer.initialize(width, height);

    const planeMeshData = cs380.primitives.generatePlane(1,1);
    const planeMesh = cs380.Mesh.fromData(planeMeshData);
    const shader = await cs380.buildShader(PipEdgeShader);
    
    this.transform = new cs380.Transform();
    quat.rotateY(this.transform.localRotation, quat.create(), Math.PI);

    this.image = new cs380.RenderObject(planeMesh, shader);
    this.image.uniforms.useScreenSpace = true;
    this.image.uniforms.useColor = false;
    this.image.uniforms.mainTexture = this.framebuffer.colorTexture;
    this.image.uniforms.width = width;
    this.image.uniforms.height = height;
    this.image.transform.localPosition = trans;
    this.image.transform.localScale = scale;
    this.image.transform.setParent(this.transform);

    this.thingsToClear = [shader, planeMesh, this.framebuffer];
  }

  render(camera) {
    const prevDepthFunc = gl.getParameter(gl.DEPTH_FUNC);
    gl.depthFunc(gl.ALWAYS);
    this.image.render(camera);
    gl.depthFunc(prevDepthFunc);
  }
  finalize(){
    for (const thing of this.thingsToClear){
      thing.finalize();    
    }
  }
}
export default class Assignment4 extends cs380.BaseApp {
  updateUniforms = () => {
    for (let i = 0; i < this.objectList.length; i++){
      this.objectList[i].uniforms. material.isToonShading = this.isToonShading;
    }
  }
  updateCameraEffect = (cameraMode) => {
    this.cameraEffect = cameraMode
    console.log(cameraMode)
    let camera_mode_int = this.cameraModeMap[cameraMode]
    console.log(camera_mode_int)
    this.cameraEffectPlane.image.uniforms.camera_mode = camera_mode_int
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
  animationMove(fromvect, tovect , ratio){
    let x = fromvect[0] + (tovect[0] -  fromvect[0]) * ratio;
    let y = fromvect[1] + (tovect[1] -  fromvect[1]) * ratio;
    let z = fromvect[2] + (tovect[2] -  fromvect[2]) * ratio;
    
    vec3.set(fromvect, x, y, z);
  }
  animationRotate(fromT, toT, ratio){
    quat.slerp(fromT, fromT, toT, ratio)
  }
  createAnimation = (keyString, animationData, totalT, waitT, retT, ratioList) => {
    let dict = [];
    dict["num"] = animationData.length;
    dict["animationTime"] = totalT;
    dict["waitTime"] = waitT;
    dict["returnTime"] = retT;
    dict["keyFrameRatioList"] = ratioList;

    let datalist = [];
    for(let i = 0; i < animationData.length; i++){
      let data = [];
      data["cameraT"] = vec3.clone(animationData[i]["cameraT"]);
      data["bodyT"] = vec3.clone(animationData[i]["bodyT"]);
      data["bodyR"] = quat.clone(animationData[i]["bodyR"]);
      data["head"] = quat.clone(animationData[i]["head"]);
      data["armL1"] = quat.clone(animationData[i]["armL1"]);
      data["armL2"] = quat.clone(animationData[i]["armL2"]);
      data["armR1"] = quat.clone(animationData[i]["armR1"]);
      data["armR2"] = quat.clone(animationData[i]["armR2"]);
      data["legL1"] = quat.clone(animationData[i]["legL1"]);
      data["legL2"] = quat.clone(animationData[i]["legL2"]);
      data["legR1"] = quat.clone(animationData[i]["legR1"]);
      data["legR2"] = quat.clone(animationData[i]["legR2"]);
      datalist.push(data);
    }

    dict["dataList"] = datalist;
    this.animationInfoDict[keyString] = dict;
  }
  archieveCurrentFrame = (animStatus) => {
    let customData = [];
    let data = [];
    data["cameraT"] = vec3.clone(this.camera.transform.localPosition);
    data["bodyT"] = vec3.clone(this.bodyjoint.localPosition);
    data["bodyR"] = quat.clone(this.bodyjoint.localRotation);
    data["head"] = quat.clone(this.headjoint.localRotation);
    data["armL1"] = quat.clone(this.leftArmjoint.localRotation);
    data["armL2"] = quat.clone(this.leftArmMidjoint.localRotation);
    data["armR1"] = quat.clone(this.rightArmjoint.localRotation);
    data["armR2"] = quat.clone(this.rightArmMidjoint.localRotation);
    data["legL1"] = quat.clone(this.leftLegUpjoint.transform.localRotation);
    data["legL2"] = quat.clone(this.leftLegMidjoint.localRotation);
    data["legR1"] = quat.clone(this.rightLegUpjoint.transform.localRotation);
    data["legR2"] = quat.clone(this.rightLegMidjoint.localRotation);
    customData.push(data);
    let customFrameList = [1];
    this.createAnimation(animStatus, customData, 1, 0.5, 0.5, customFrameList);
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
    const meshLoaderResult = await cs380.MeshLoader.load({
      bunny: "resources/models/bunny.obj",
    });
    const bunnyMesh = cs380.Mesh.fromData(meshLoaderResult.bunny);
    const lighthouseLoaderResult = await cs380.MeshLoader.load({
      lighthouse: "resources/models/Round_Lighthouse.obj"
    });
    const lighthouseMesh = cs380.Mesh.fromData(lighthouseLoaderResult.lighthouse);

    // TODO: import BlinnPhongShader
    const blinnPhongShader = await cs380.buildShader(BlinnPhongShader);

    this.thingsToClear.push(bunnyMesh);
    this.thingsToClear.push(lighthouseMesh);
    this.thingsToClear.push(blinnPhongShader);

    // initialize light sources
    this.lights = [];
    this.objectList = [];

    // Plane Const
    this.planeX = 70
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

    const lightHouseLight = new Light();
    vec3.set(lightHouseLight.transform.localPosition, this.planeX / 2 - 2, -2, 2.5);
    const lightHouseDir = vec3.create();
    vec3.set(lightHouseDir, -1, -1, -0.001);
    lightHouseLight.transform.lookAt(lightHouseDir);
    vec3.set(lightHouseLight.rgb, 1.0, 1.0, 1.0);
    lightHouseLight.type = LightType.SPOTLIGHT;
    this.lights.push(lightHouseLight);
    this.lightHouseLightInitRotation = new quat.create();
    quat.copy(this.lightHouseLightInitRotation, lightHouseLight.transform.localRotation);

    const light4 = new Light();
    vec3.set(light4.transform.localPosition, -10, 0, 0);
    const lightDir3 = vec3.create();
    vec3.set(lightDir3, 0, -1, -0.01);
    light4.transform.lookAt(lightDir3);
    vec3.set(light4.rgb, 1.0, 0.0, 0.0);
    light4.type = LightType.SPOTLIGHT;
    this.lights.push(light4);

    const light5 = new Light();
    vec3.set(light5.transform.localPosition, 0, 0, 7.3);
    const lightDir4 = vec3.create();
    vec3.set(lightDir4, 0, -1, -0.01);
    light5.transform.lookAt(lightDir4);
    vec3.set(light5.rgb, 0.0, 1.0, 0.0);
    light5.type = LightType.SPOTLIGHT;
    this.lights.push(light5);

    const light6 = new Light();
    vec3.set(light6.transform.localPosition, 0, 0, -7.3);
    const lightDir5 = vec3.create();
    vec3.set(lightDir5, 0, -1, -0.01);
    light6.transform.lookAt(lightDir5);
    vec3.set(light6.rgb, 0.0, 0.0, 1.0);
    light6.type = LightType.SPOTLIGHT;
    this.lights.push(light6);


   // Generate Plane
    const planeBackMesh = cs380.Mesh.fromData(cs380.primitives.generatePlane(this.planeX, this.planeY));
    const planeLeftMesh = cs380.Mesh.fromData(cs380.primitives.generatePlane(this.planeZ, this.planeY));
    const planeBottomMesh = cs380.Mesh.fromData(cs380.primitives.generatePlane(this.planeX, this.planeZ));

    //this.planeBack = await this.generateMesh(planeBackMesh, "#888888", 0, null, blinnPhongShader, this.lights);
    //quat.rotateX(this.planeBack.transform.localRotation, this.planeBack.transform.localRotation, Math.PI);
    //vec3.set(this.planeBack.transform.localPosition, 0, 0, - this.planeZ / 2);

    //this.planeLeft = await this.generateMesh(planeLeftMesh, "#BBBBBB", 0, null, blinnPhongShader, this.lights);
    //quat.rotateY(this.planeLeft.transform.localRotation, this.planeLeft.transform.localRotation, - Math.PI / 2);
    //vec3.set(this.planeLeft.transform.localPosition, - this.planeX / 2, 0, 0);

    this.planeBottom = await this.generateMesh(planeBottomMesh, "#444444", 0, null, blinnPhongShader, this.lights);
    quat.rotateX(this.planeBottom.transform.localRotation, this.planeBottom.transform.localRotation, Math.PI / 2);
    vec3.set(this.planeBottom.transform.localPosition, 0, - this.planeY / 2, 0);
    // Generate Plane End
  
    // Generate Object
    this.bunny = await this.generateMesh(bunnyMesh, "#FFFF00", 0, null, blinnPhongShader, this.lights, ["FF0000", "00FF00", "00FF00"]);
    vec3.set(this.bunny.transform.localPosition, -20, -this.planeY / 2 + 10, 0.0);
    vec3.set(this.bunny.transform.localScale, 5, 5, 5);

    this.lighthouse = await this.generateMesh(lighthouseMesh, "#362B00", 0, null, blinnPhongShader, this.lights);
    vec3.set(this.lighthouse.transform.localPosition, 25.0, -this.planeY / 2 + 0.1, 0.0);
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
    vec3.set(this.bodyjoint.localPosition, 0, -this.planeY / 2 + 10, 10);
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
    setPixelPos(this.headfrontleftHair, -1.75, 1.25, 2.15);
    this.headfrontrightHair = await this.generateMesh(unitpixelMesh, this.haircolor, 1, this.headCube.transform, blinnPhongShader, this.lights);
    setPixelPos(this.headfrontrightHair, 1.75, 1.25, 2.15);
    this.headleftEye = await this.generateMesh(unitpixelMesh, this.purple, 1, this.headCube.transform, blinnPhongShader, this.lights);
    setPixelPos(this.headleftEye, -0.75, 0.25, 2.15);
    this.headrightEye = await this.generateMesh(unitpixelMesh, this.purple, 1, this.headCube.transform, blinnPhongShader, this.lights);
    setPixelPos(this.headrightEye, 0.75, 0.25, 2.15);
    this.headWhiteleftEye = await this.generateMesh(unitpixelMesh, this.white, 1, this.headCube.transform, blinnPhongShader, this.lights);
    setPixelPos(this.headWhiteleftEye, -1.25, 0.25, 2.15);
    this.headrightWhiteEye = await this.generateMesh(unitpixelMesh, this.white, 1, this.headCube.transform, blinnPhongShader, this.lights);
    setPixelPos(this.headrightWhiteEye, 1.25, 0.25, 2.15);
    this.uppermustache1 = await this.generateMesh(unitpixelMesh, this.upmustachecolor, 1, this.headCube.transform, blinnPhongShader, this.lights);
    setPixelPos(this.uppermustache1, -0.25, -0.25, 2.15);
    this.uppermustache2 = await this.generateMesh(unitpixelMesh, this.upmustachecolor, 1, this.headCube.transform, blinnPhongShader, this.lights);
    setPixelPos(this.uppermustache2, 0.25, -0.25, 2.15);
    this.downmustache1 = await this.generateMesh(unitpixelMesh, this.mustachecolor, 1, this.headCube.transform, blinnPhongShader, this.lights);
    setPixelPos(this.downmustache1, -0.75, -0.75, 2.15);
    this.downmustache2 = await this.generateMesh(unitpixelMesh, this.mustachecolor, 1, this.headCube.transform, blinnPhongShader, this.lights);
    setPixelPos(this.downmustache2, -0.75, -1.25, 2.15);
    this.downmustache3 = await this.generateMesh(unitpixelMesh, this.mustachecolor, 1, this.headCube.transform, blinnPhongShader, this.lights);
    setPixelPos(this.downmustache3, -0.25, -1.25, 2.15);
    this.downmustache4 = await this.generateMesh(unitpixelMesh, this.mustachecolor, 1, this.headCube.transform, blinnPhongShader, this.lights);
    setPixelPos(this.downmustache4, 0.25, -1.25, 2.15);
    this.downmustache5 = await this.generateMesh(unitpixelMesh, this.mustachecolor, 1, this.headCube.transform, blinnPhongShader, this.lights);
    setPixelPos(this.downmustache5, 0.75, -1.25, 2.15);
    this.downmustache6 = await this.generateMesh(unitpixelMesh, this.mustachecolor, 1, this.headCube.transform, blinnPhongShader, this.lights);
    setPixelPos(this.downmustache6, 0.75, -0.75, 2.15);
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
    // this.ArcBallAttatchedCube = await this.generateMesh(arcBallCube , "#FF0000", 7, null, blinnPhongShader, this.lights);
    // vec3.set(this.ArcBallAttatchedCube.transform.localPosition, 10, -this.planeY / 2 + 10, 10)
  }
  async constructHTML(){
    document.getElementById("settings").innerHTML = `
      <label for="toon-shading">Toon Shading</label>
      <input type="checkbox" id="toon-shading">
      <br/>
      <label for="setting-ambient">Ambient Light Illuminance</label>
      <input type="range" min=0 max=1 value=0.1 step=0.01 id="setting-ambient-illuminance">
      <label for="setting-illuminance">Directional Light Illuminance</label>
      <input type="range" min=0 max=1 value=0.3 step=0.01 id="setting-directional-illuminance">
      <br/>
      <label for="setting-point">Point Light Illuminance</label>
      <input type="range" min=0 max=500 value=0 step=1 id="setting-point-illuminance">
      <label for="setting-point">Point Light Z Transform</label>
      <input type="range" min=-20 max=20 value=0 step=1 id="setting-point-z">
      <br/>
      <label for="setting-spotlight">SpotLight Illuminance</label>
      <input type="range" min=0 max=5 value=3 step=0.01 id="setting-spotlight-illuminance">
      <label for="setting-spotlight-angle">SpotLight Angle</label>
      <input type="range" min=0 max=1.57 value=0.5 step=0.01 id="setting-spotlight-angle">
      <br/>
      <label for="setting-spotlight-smooth">SpotLight smooth</label>
      <input type="range" min=0.1 max=10 value=0 step=0.1 id="setting-spotlight-smooth">
      <br/>
    <!-- Camera shutter UI --> 
    <audio id="shutter-sfx">
      <source src="resources/shutter_sfx.ogg" type="audio/ogg">
    </audio> 
    <button type="button" id="shutter">Take a picture!</button><br/>

    <!-- TODO: Add camera effect lists here --> 
    <label for="setting-effect">Camera effect</label>
    <select id="setting-effect">
      <option value="None">None</option>
      <option value="ColorInversion">ColorInversion</option>
      <option value="Grayscale">Grayscale</option>
      <option value="Blurring">Blurring</option>
    </select> <br/>

    <!-- OPTIONAL: Add more UI elements here --> 

    <h3>Basic requirements</h3>
    <ul>
      <li>Reuse HW1 Animated Background [1 pt]</li>
      <li>Reuse HW2: Avatar with adjustable pose [0.5 pt]</li>
      <li>Reuse HW3: Phong shading lightings [1 pt]</li>
      <li>Skybox [0.5 pt] </li>
      <li>Camera Effects [2 pt] </li>
      <li>Show some creativity in your scene [1 pts]</li>
    </ul>
    Implement creative camera effects for your virtual camera booth. <br/>
    <strong>Have fun!</strong>
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
          this.lights[0].illuminance=val;
        });
    setInputBehavior('setting-directional-illuminance', true, true,
        (val) => { 
          this.lights[1].illuminance=val;
        });
    setInputBehavior('setting-point-illuminance', true, true,
        (val) => { 
          this.lights[2].illuminance=val;
        });
    setInputBehavior('setting-point-z', true, true,
        (val) => { 
          vec3.set(this.lights[2].transform.localPosition, this.planeX / 2 - 10, -this.planeY / 2 + 2, val);
        });
    setInputBehavior('setting-spotlight-illuminance', true, true,
        (val) => { 
          this.lights[3].illuminance=val;
        });
    setInputBehavior("setting-spotlight-smooth", true, true, 
        (val) => { 
          this.lights[3].angleSmoothness = val;
        });
    setInputBehavior("setting-spotlight-angle", true, true, 
        (val) => { 
          this.lights[3].angle = val;
        });
    setInputBehavior("toon-shading", true, false, 
        () => { 
          this.isToonShading = !this.isToonShading;
          this.updateUniforms();
        });
  }
  async handleSceneInput(){
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
    this.SelectedObjIdx = -1
    this.SelectedObject = this.bodyjoint;

    this.firstClicking = true;

    this.Idx2ArcTransform = []
    //this.Idx2ArcTransform.push(this.bodyjoint);
    this.Idx2ArcTransform.push(this.headjoint);
    this.Idx2ArcTransform.push(this.bodyjoint);
    this.Idx2ArcTransform.push(this.leftArmjoint);
    this.Idx2ArcTransform.push(this.rightArmjoint);
    this.Idx2ArcTransform.push(this.leftLegUpjoint.transform);
    this.Idx2ArcTransform.push(this.rightLegUpjoint.transform);
    //this.Idx2ArcTransform.push(this.ArcBallAttatchedCube.transform);

    // Animation Status Handling 
    this.animationStatusList = ["default", "walk", "sit", "hit", "jump", "swim"]
    this.currentStatusKey = "default"
    this.animationStartTime = 0
    this.animationKeyframeIndex = 0
    this.isAnimationRunning = false
    this.firstInput = false
    this.isPressing = false
    this.pressingTime = 0
    this.startTransformationArchieve;

    // Input per Animation Dictionary
    this.status2BindedList = []
    this.keyBindNum = 6
    this.status2BindedList["default"] = ["d"]
    this.status2BindedList["sit"] = ["s"]
    this.status2BindedList["walk"] = ["w"]
    this.status2BindedList["hit"] = ["a"]
    this.status2BindedList["jump"] = [" "]
    this.status2BindedList["swim"] = ["e"]
    // Scene Input handling
    this.handleKeyDown = (e) => {
      if (e.repeat) return;
      this.onKeyDown(e.key);
    };
    this.handleKeyUp = (e) => {
      if (e.repeat) return;
      this.onKeyUp(e.key);
    }
    this.handleMouseDown = (e) => {
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
    const shutterAudio = document.getElementById('shutter-sfx');
    document.getElementById('shutter').onclick = () => {
      this.shutterPressed = true;
      shutterAudio.play();
    };

    this.cameraEffect = 'None';
    cs380.utils.setInputBehavior(
      'setting-effect',
      (val) => {
        this.updateCameraEffect(val);
      },
      false,
      false
    );
  }
  async constructAnimation(){
    // Custom Animation Input
    this.CustomInput = false;

    // Input per Animation Dictionary
    this.status2BindedList = []
    this.keyBindNum = 6
    this.status2BindedList["default"] = ["d"]
    this.status2BindedList["sit"] = ["s"]
    this.status2BindedList["walk"] = ["w"]
    this.status2BindedList["hit"] = ["a"]
    this.status2BindedList["jump"] = [" "]
    this.status2BindedList["swim"] = ["e"]

    // Animation infos
    this.animationInfoDict = [];

    // Construct Animation
    const hPi = Math.PI / 2;
    // Default
    let defaultData = [];
    let defaultKeyframe1 = [];
    defaultKeyframe1["cameraT"] = vec3.fromValues(0, 0, 60);
    defaultKeyframe1["bodyT"] = vec3.clone(this.bodyjoint.localPosition);
    defaultKeyframe1["bodyR"] = quat.clone(this.bodyjoint.localRotation);
    defaultKeyframe1["head"] = quat.clone(this.headjoint.localRotation);
    defaultKeyframe1["armL1"] = quat.clone(this.leftArmjoint.localRotation);
    defaultKeyframe1["armL2"] = quat.clone(this.leftArmMidjoint.localRotation);
    defaultKeyframe1["armR1"] = quat.clone(this.rightArmjoint.localRotation);
    defaultKeyframe1["armR2"] = quat.clone(this.rightArmMidjoint.localRotation);
    defaultKeyframe1["legL1"] = quat.clone(this.leftLegUpjoint.transform.localRotation);
    defaultKeyframe1["legL2"] = quat.clone(this.leftLegMidjoint.localRotation);
    defaultKeyframe1["legR1"] = quat.clone(this.rightLegUpjoint.transform.localRotation);
    defaultKeyframe1["legR2"] = quat.clone(this.rightLegMidjoint.localRotation);
    defaultKeyframe1["timeRatio"] = 1;
    defaultData.push(defaultKeyframe1);
    let defaultRatioList = [1]
    this.createAnimation("default", defaultData, 1, 1, 0, defaultRatioList);

    // Walk
    let walkData = [];
    let walkKeyframe1 = [];
    walkKeyframe1["cameraT"] = new vec3.fromValues(0.5, 1, 60);
    walkKeyframe1["bodyT"] = new vec3.fromValues(0, 0 + this.bodyjoint.localPosition[1], 0 + this.bodyjoint.localPosition[2]);
    walkKeyframe1["bodyR"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe1["head"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe1["armL1"] = quat.fromEuler(new quat.create(), -90, 0, 0);
    walkKeyframe1["armL2"] = quat.fromEuler(new quat.create(), -10, 0, 0);
    walkKeyframe1["armR1"] = quat.fromEuler(new quat.create(), 50, 0, 0);
    walkKeyframe1["armR2"] = quat.fromEuler(new quat.create(), -50, 0, 0);
    walkKeyframe1["legL1"] = quat.fromEuler(new quat.create(), 50, 0, 0);
    walkKeyframe1["legL2"] = quat.fromEuler(new quat.create(), 30, 0, 0);
    walkKeyframe1["legR1"] = quat.fromEuler(new quat.create(), -70, 0, 0);
    walkKeyframe1["legR2"] = quat.fromEuler(new quat.create(), 30, 0, 0);
    walkData.push(walkKeyframe1);
    let walkKeyframe2 = [];
    walkKeyframe2["cameraT"] = new vec3.fromValues(-0.1, 0, 60);
    walkKeyframe2["bodyT"] = new vec3.fromValues(0, 0 + this.bodyjoint.localPosition[1], 0 + this.bodyjoint.localPosition[2]);
    walkKeyframe2["bodyR"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe2["head"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe2["armL1"] = quat.fromEuler(new quat.create(), -90, 0, 0);
    walkKeyframe2["armL2"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe2["armR1"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe2["armR2"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe2["legL1"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe2["legL2"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe2["legR1"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe2["legR2"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkData.push(walkKeyframe2);
    let walkKeyframe3 = [];
    walkKeyframe3["cameraT"] = new vec3.fromValues(-0.3, -1, 60);
    walkKeyframe3["bodyT"] = new vec3.fromValues(0, 0 + this.bodyjoint.localPosition[1], 0 + this.bodyjoint.localPosition[2]);
    walkKeyframe3["bodyR"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe3["head"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe3["armL1"] = quat.fromEuler(new quat.create(), -90, 0, 0);
    walkKeyframe3["armL2"] = quat.fromEuler(new quat.create(), 10, 0, 0);
    walkKeyframe3["armR1"] = quat.fromEuler(new quat.create(), -80, 0, 0);
    walkKeyframe3["armR2"] = quat.fromEuler(new quat.create(), -50, 0, 0);
    walkKeyframe3["legL1"] = quat.fromEuler(new quat.create(), -70, 0, 0);
    walkKeyframe3["legL2"] = quat.fromEuler(new quat.create(), 30, 0, 0);
    walkKeyframe3["legR1"] = quat.fromEuler(new quat.create(), 50, 0, 0);
    walkKeyframe3["legR2"] = quat.fromEuler(new quat.create(), 30, 0, 0);
    walkData.push(walkKeyframe3);
    let walkKeyframe4 = [];
    walkKeyframe4["cameraT"] = new vec3.fromValues(0, 0, 60);
    walkKeyframe4["bodyT"] = new vec3.fromValues(0, 0 + this.bodyjoint.localPosition[1], 0 + this.bodyjoint.localPosition[2]);
    walkKeyframe4["bodyR"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe4["head"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe4["armL1"] = quat.fromEuler(new quat.create(), -90, 0, 0);
    walkKeyframe4["armL2"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe4["armR1"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe4["armR2"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe4["legL1"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe4["legL2"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe4["legR1"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkKeyframe4["legR2"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    walkData.push(walkKeyframe4);
    let walkFrameList = [0.33, 0.17, 0.33, 0.17];
    this.createAnimation("walk", walkData, 0.7, 0, 0, walkFrameList);

    // Sit
    let sitData = [];
    let sitKeyframe1 = [];
    sitKeyframe1["cameraT"] = new vec3.fromValues(0, -3, 60);
    sitKeyframe1["bodyT"] = new vec3.fromValues(0, -3 + this.bodyjoint.localPosition[1], 1 + this.bodyjoint.localPosition[2]);
    sitKeyframe1["bodyR"] = quat.fromEuler(new quat.create(), 60, 0, 0);
    sitKeyframe1["head"] = quat.fromEuler(new quat.create(), -60, 0, 0);
    sitKeyframe1["armL1"] = quat.fromEuler(new quat.create(), -120, 0, 0);
    sitKeyframe1["armL2"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    sitKeyframe1["armR1"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    sitKeyframe1["armR2"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    sitKeyframe1["legL1"] = quat.fromEuler(new quat.create(), -120, 0, 0);
    sitKeyframe1["legL2"] = quat.fromEuler(new quat.create(), 60, 0, 0);
    sitKeyframe1["legR1"] = quat.fromEuler(new quat.create(), -120, 0, 0);
    sitKeyframe1["legR2"] = quat.fromEuler(new quat.create(), 60, 0, 0);
    sitData.push(sitKeyframe1);
    let sitFrameList = [1];
    this.createAnimation("sit", sitData, 0.1, 0, 0.5, sitFrameList);

    // Hit
    let hitData = [];

    let hitKeyframe1 = [];
    hitKeyframe1["cameraT"] = new vec3.fromValues(0, 0, 65);
    hitKeyframe1["bodyT"] = new vec3.fromValues(0, 0 + this.bodyjoint.localPosition[1], 1 + this.bodyjoint.localPosition[2]);
    hitKeyframe1["bodyR"] = quat.fromEuler(new quat.create(), -10, 0, 0);
    hitKeyframe1["head"] = quat.fromEuler(new quat.create(), 10, 10, 0);
    hitKeyframe1["armL1"] = quat.fromEuler(new quat.create(), -110, -30, -20);
    hitKeyframe1["armL2"] = quat.fromEuler(new quat.create(), 0, -30, 0);
    hitKeyframe1["armR1"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    hitKeyframe1["armR2"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    hitKeyframe1["legL1"] = quat.fromEuler(new quat.create(), 40, 0, 0);
    hitKeyframe1["legL2"] = quat.fromEuler(new quat.create(), -20, 0, 0);
    hitKeyframe1["legR1"] = quat.fromEuler(new quat.create(), -40, 0, 0);
    hitKeyframe1["legR2"] = quat.fromEuler(new quat.create(), 10, 0, 0);
    hitData.push(hitKeyframe1);

    let hitKeyframe2 = [];
    hitKeyframe2["cameraT"] = new vec3.fromValues(0, 0, 70);
    hitKeyframe2["bodyT"] = new vec3.fromValues(0, 0 + this.bodyjoint.localPosition[1], 1 + this.bodyjoint.localPosition[2]);
    hitKeyframe2["bodyR"] = quat.fromEuler(new quat.create(), 10, 0, 0);
    hitKeyframe2["head"] = quat.fromEuler(new quat.create(), -10, -10, 0);
    hitKeyframe2["armL1"] = quat.fromEuler(new quat.create(), -80, 30, -30);
    hitKeyframe2["armL2"] = quat.fromEuler(new quat.create(), 0, 30, 0);
    hitKeyframe2["armR1"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    hitKeyframe2["armR2"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    hitKeyframe2["legL1"] = quat.fromEuler(new quat.create(), 40, 0, 0);
    hitKeyframe2["legL2"] = quat.fromEuler(new quat.create(), -20, 0, 0);
    hitKeyframe2["legR1"] = quat.fromEuler(new quat.create(), -40, 0, 0);
    hitKeyframe2["legR2"] = quat.fromEuler(new quat.create(), 10, 0, 0);
    hitData.push(hitKeyframe2);

    let hitKeyframe3 = [];
    hitKeyframe3["cameraT"] = new vec3.fromValues(0, 0, 62);
    hitKeyframe3["bodyT"] = new vec3.fromValues(0, 0 + this.bodyjoint.localPosition[1], 1 + this.bodyjoint.localPosition[2]);
    hitKeyframe3["bodyR"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    hitKeyframe3["head"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    hitKeyframe3["armL1"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    hitKeyframe3["armL2"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    hitKeyframe3["armR1"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    hitKeyframe3["armR2"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    hitKeyframe3["legL1"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    hitKeyframe3["legL2"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    hitKeyframe3["legR1"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    hitKeyframe3["legR2"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    hitData.push(hitKeyframe3);

    let hitFrameList = [0.4, 0.2, 0.4];
    this.createAnimation("hit", hitData, 0.3, 0, 0.5, hitFrameList);

    // Jump
    let jumpData = [];
    let jumpKeyframe1 = [];
    jumpKeyframe1["cameraT"] = new vec3.fromValues(0, 8, 63);
    jumpKeyframe1["bodyT"] = new vec3.fromValues(0, 10 + this.bodyjoint.localPosition[1], 1 + this.bodyjoint.localPosition[2]);
    jumpKeyframe1["bodyR"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    jumpKeyframe1["head"] = quat.fromEuler(new quat.create(), 30, 20, 0);
    jumpKeyframe1["armL1"] = quat.fromEuler(new quat.create(), 60, 0, 0);
    jumpKeyframe1["armL2"] = quat.fromEuler(new quat.create(), 30, 0, 0);
    jumpKeyframe1["armR1"] = quat.fromEuler(new quat.create(), -60, 0, 0);
    jumpKeyframe1["armR2"] = quat.fromEuler(new quat.create(), 50, 0, 0);
    jumpKeyframe1["legL1"] = quat.fromEuler(new quat.create(), -60, 0, 0);
    jumpKeyframe1["legL2"] = quat.fromEuler(new quat.create(), 30, 0, 0);
    jumpKeyframe1["legR1"] = quat.fromEuler(new quat.create(), 60, 0, 0);
    jumpKeyframe1["legR2"] = quat.fromEuler(new quat.create(), 30, 0, 0);
    jumpData.push(jumpKeyframe1);

    let jumpKeyframe2 = [];
    jumpKeyframe2["cameraT"] = new vec3.fromValues(0, 5, 65);
    jumpKeyframe2["bodyT"] = new vec3.fromValues(0, 5 + this.bodyjoint.localPosition[1], 1 + this.bodyjoint.localPosition[2]);
    jumpKeyframe2["bodyR"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    jumpKeyframe2["head"] = quat.fromEuler(new quat.create(), -30, -20, 0);
    jumpKeyframe2["armL1"] = quat.fromEuler(new quat.create(), -60, 0, 0);
    jumpKeyframe2["armL2"] = quat.fromEuler(new quat.create(), 50, 0, 0);
    jumpKeyframe2["armR1"] = quat.fromEuler(new quat.create(), 60, 0, 0);
    jumpKeyframe2["armR2"] = quat.fromEuler(new quat.create(), 30, 0, 0);
    jumpKeyframe2["legL1"] = quat.fromEuler(new quat.create(), 60, 0, 0);
    jumpKeyframe2["legL2"] = quat.fromEuler(new quat.create(), 10, 0, 0);
    jumpKeyframe2["legR1"] = quat.fromEuler(new quat.create(), -60, 0, 0);
    jumpKeyframe2["legR2"] = quat.fromEuler(new quat.create(), 10, 0, 0);
    jumpData.push(jumpKeyframe2);

    let jumpKeyframe3 = [];
    jumpKeyframe3["cameraT"] = new vec3.fromValues(0, 0, 62);
    jumpKeyframe3["bodyT"] = new vec3.fromValues(0, -3 + this.bodyjoint.localPosition[1], 1 + this.bodyjoint.localPosition[2]);
    jumpKeyframe3["bodyR"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    jumpKeyframe3["head"] = quat.fromEuler(new quat.create(), 10, 0, 0);
    jumpKeyframe3["armL1"] = quat.fromEuler(new quat.create(), 60, 0, 0);
    jumpKeyframe3["armL2"] = quat.fromEuler(new quat.create(), 30, 0, 0);
    jumpKeyframe3["armR1"] = quat.fromEuler(new quat.create(), -60, 0, 0);
    jumpKeyframe3["armR2"] = quat.fromEuler(new quat.create(), 30, 0, 0);
    jumpKeyframe3["legL1"] = quat.fromEuler(new quat.create(), -60, 0, 0);
    jumpKeyframe3["legL2"] = quat.fromEuler(new quat.create(), 30, 0, 0);
    jumpKeyframe3["legR1"] = quat.fromEuler(new quat.create(), 60, 0, 0);
    jumpKeyframe3["legR2"] = quat.fromEuler(new quat.create(), 30, 0, 0);
    jumpData.push(jumpKeyframe3);

    let jumpFrameList = [0.4, 0.3, 0.3];
    this.createAnimation("jump", jumpData, 0.4, 0, 0.1, jumpFrameList);

    // Swim
    let swimData = [];
    let swimKeyframe1 = [];
    swimKeyframe1["cameraT"] = new vec3.fromValues(0, 5, 70);
    swimKeyframe1["bodyT"] = new vec3.fromValues(0, 5 + this.bodyjoint.localPosition[1], 1 + this.bodyjoint.localPosition[2]);
    swimKeyframe1["bodyR"] = quat.fromEuler(new quat.create(), 90, 0, 0);
    swimKeyframe1["head"] = quat.fromEuler(new quat.create(), -90, 10, 10);
    swimKeyframe1["armL1"] = quat.fromEuler(new quat.create(), 170, 0, 20);
    swimKeyframe1["armL2"] = quat.fromEuler(new quat.create(), 0, -10, -10);
    swimKeyframe1["armR1"] = quat.fromEuler(new quat.create(), 170, 0, 0);
    swimKeyframe1["armR2"] = quat.fromEuler(new quat.create(), 0, 10, 10);
    swimKeyframe1["legL1"] = quat.fromEuler(new quat.create(), -60, 0, 0);
    swimKeyframe1["legL2"] = quat.fromEuler(new quat.create(), 30, 0, 0);
    swimKeyframe1["legR1"] = quat.fromEuler(new quat.create(), 60, 0, 0);
    swimKeyframe1["legR2"] = quat.fromEuler(new quat.create(), 30, 0, 0);
    swimData.push(swimKeyframe1);

    let swimKeyframe2 = [];
    swimKeyframe2["cameraT"] = new vec3.fromValues(0, 0, 65);
    swimKeyframe2["bodyT"] = new vec3.fromValues(0, 0 + this.bodyjoint.localPosition[1], 1 + this.bodyjoint.localPosition[2]);
    swimKeyframe2["bodyR"] = quat.fromEuler(new quat.create(), 90, 0, 0);
    swimKeyframe2["head"] = quat.fromEuler(new quat.create(), -110, -10, -10);
    swimKeyframe2["armL1"] = quat.fromEuler(new quat.create(), 170, 0, -20);
    swimKeyframe2["armL2"] = quat.fromEuler(new quat.create(), 0, 10, 10);
    swimKeyframe2["armR1"] = quat.fromEuler(new quat.create(), 190, 10, 10);
    swimKeyframe2["armR2"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    swimKeyframe2["legL1"] = quat.fromEuler(new quat.create(), 60, 0, 0);
    swimKeyframe2["legL2"] = quat.fromEuler(new quat.create(), 5, 0, 0);
    swimKeyframe2["legR1"] = quat.fromEuler(new quat.create(), -60, 0, 0);
    swimKeyframe2["legR2"] = quat.fromEuler(new quat.create(), 5, 0, 0);
    swimData.push(swimKeyframe2);

    let swimKeyframe3 = [];
    swimKeyframe3["cameraT"] = new vec3.fromValues(0, 5, 70);
    swimKeyframe3["bodyT"] = new vec3.fromValues(0, 5 + this.bodyjoint.localPosition[1], 1 + this.bodyjoint.localPosition[2]);
    swimKeyframe3["bodyR"] = quat.fromEuler(new quat.create(), 90, 0, 0);
    swimKeyframe3["head"] = quat.fromEuler(new quat.create(), -90, 10, 10);
    swimKeyframe3["armL1"] = quat.fromEuler(new quat.create(), 170, 0, 20);
    swimKeyframe3["armL2"] = quat.fromEuler(new quat.create(), 0, -10, -10);
    swimKeyframe3["armR1"] = quat.fromEuler(new quat.create(), 170, 0, 0);
    swimKeyframe3["armR2"] = quat.fromEuler(new quat.create(), 0, 10, 10);
    swimKeyframe3["legL1"] = quat.fromEuler(new quat.create(), -60, 0, 0);
    swimKeyframe3["legL2"] = quat.fromEuler(new quat.create(), 30, 0, 0);
    swimKeyframe3["legR1"] = quat.fromEuler(new quat.create(), 60, 0, 0);
    swimKeyframe3["legR2"] = quat.fromEuler(new quat.create(), 30, 0, 0);
    swimData.push(swimKeyframe3);

    let swimKeyframe4 = [];
    swimKeyframe4["cameraT"] = new vec3.fromValues(0, 0, 65);
    swimKeyframe4["bodyT"] = new vec3.fromValues(0, 0 + this.bodyjoint.localPosition[1], 1 + this.bodyjoint.localPosition[2]);
    swimKeyframe4["bodyR"] = quat.fromEuler(new quat.create(), 90, 0, 0);
    swimKeyframe4["head"] = quat.fromEuler(new quat.create(), -110, -10, -10);
    swimKeyframe4["armL1"] = quat.fromEuler(new quat.create(), 170, 0, -20);
    swimKeyframe4["armL2"] = quat.fromEuler(new quat.create(), 0, 10, 10);
    swimKeyframe4["armR1"] = quat.fromEuler(new quat.create(), 190, 10, 10);
    swimKeyframe4["armR2"] = quat.fromEuler(new quat.create(), 0, 0, 0);
    swimKeyframe4["legL1"] = quat.fromEuler(new quat.create(), 60, 0, 0);
    swimKeyframe4["legL2"] = quat.fromEuler(new quat.create(), 5, 0, 0);
    swimKeyframe4["legR1"] = quat.fromEuler(new quat.create(), -60, 0, 0);
    swimKeyframe4["legR2"] = quat.fromEuler(new quat.create(), 5, 0, 0);
    swimData.push(swimKeyframe4);

    let swimFrameList = [0.25, 0.25, 0.25, 0.25];
    this.createAnimation("swim", swimData, 1.5, 0, 0.1, swimFrameList);
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
    this.SelectedObjIdx = index - 1;
    if (this.SelectedObjIdx < 0) return;
    this.SelectedObject = this.Idx2ArcTransform[this.SelectedObjIdx];
    this.SelectedObjectInitQuat = new quat.create();
    quat.copy(this.SelectedObjectInitQuat, this.SelectedObject.localRotation);

    //vec3.set(this.camera.transform.localPosition, this.SelectedObject.localPosition[0], this.SelectedObject.localPosition[1], 100)
  }
  onMouseMove(e) {
    if (this.SelectedObjIdx == -1) return;
    const canvas = gl.canvas;
    if (!this.Mousepressed) return;
    const rect = canvas.getBoundingClientRect();
    //this.prevMouseX = this.currMouseX;
    //this.prevMouseY = this.currMouseY;
    this.currMouseX = e.clientX - rect.left;
    this.currMouseY = rect.bottom - e.clientY;
    this.arcBallUpdate()
  }
  onMouseUp(e) {
    if (this.SelectedObjIdx == -1) return;
    this.Mousepressed = false;

    this.firstClicking = false;
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
    if(key == "c"){
      this.CustomInput = true;
    }
  }
  onKeyUp(key) {
    for(let i = 0; i < this.keyBindNum; i++){
      let mappedList = this.status2BindedList[this.animationStatusList[i]];
      for(let j = 0; j < mappedList.length; j++){
        if(key == mappedList[j]){
          if (this.animationStatusList[i] == this.currentStatusKey){
            this.isPressing = false;
          }
          return;
        }
      }
    }
    if(key == "c"){
      this.CustomInput = false;
      return;
    }
    // Not bounded key
    if (this.CustomInput){
      this.keyBindNum += 1;
      let animationName = "custom" + key
      this.animationStatusList.push(animationName)
      this.status2BindedList[animationName] = [key]
      this.archieveCurrentFrame(animationName);
      return;
    }
  }
  setAnimationStatus(idx){
    this.currentStatusKey = this.animationStatusList[idx];
    this.isAnimationRunning = true
    this.firstInput = true
    this.isPressing = true
    this.pressingTime = 0;
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
    if(this.isPressing && this.currentStatusKey == "swim" && timePassed >= animationTime + waitTime){
      this.setAnimationStatus(5);
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
      //this.animationMove(this.camera.transform.localPosition, currentKeyframeData["cameraT"], currentMoveRatio);
      this.animationMove(this.bodyjoint.localPosition, currentKeyframeData["bodyT"], currentMoveRatio);
      this.animationRotate(this.bodyjoint.localRotation, currentKeyframeData["bodyR"], currentMoveRatio);
      this.animationRotate(this.headjoint.localRotation, currentKeyframeData["head"], currentMoveRatio);
      this.animationRotate(this.leftArmjoint.localRotation, currentKeyframeData["armL1"], currentMoveRatio);
      this.animationRotate(this.leftArmMidjoint.localRotation, currentKeyframeData["armL2"], currentMoveRatio);
      this.animationRotate(this.rightArmjoint.localRotation, currentKeyframeData["armR1"], currentMoveRatio);
      this.animationRotate(this.rightArmMidjoint.localRotation, currentKeyframeData["armR2"], currentMoveRatio);
      this.animationRotate(this.leftLegUpjoint.transform.localRotation, currentKeyframeData["legL1"], currentMoveRatio);
      this.animationRotate(this.leftLegMidjoint.localRotation, currentKeyframeData["legL2"], currentMoveRatio);
      this.animationRotate(this.rightLegUpjoint.transform.localRotation, currentKeyframeData["legR1"], currentMoveRatio);
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
    //this.animationMove(this.camera.transform.localPosition, currentKeyframeData["cameraT"], currentMoveRatio);
    this.animationMove(this.bodyjoint.localPosition, currentKeyframeData["bodyT"], currentMoveRatio);
    this.animationRotate(this.bodyjoint.localRotation, currentKeyframeData["bodyR"], currentMoveRatio);
    this.animationRotate(this.headjoint.localRotation, currentKeyframeData["head"], currentMoveRatio);
    this.animationRotate(this.leftArmjoint.localRotation, currentKeyframeData["armL1"], currentMoveRatio);
    this.animationRotate(this.leftArmMidjoint.localRotation, currentKeyframeData["armL2"], currentMoveRatio);
    this.animationRotate(this.rightArmjoint.localRotation, currentKeyframeData["armR1"], currentMoveRatio);
    this.animationRotate(this.rightArmMidjoint.localRotation, currentKeyframeData["armR2"], currentMoveRatio);
    this.animationRotate(this.leftLegUpjoint.transform.localRotation, currentKeyframeData["legL1"], currentMoveRatio);
    this.animationRotate(this.leftLegMidjoint.localRotation, currentKeyframeData["legL2"], currentMoveRatio);
    this.animationRotate(this.rightLegUpjoint.transform.localRotation, currentKeyframeData["legR1"], currentMoveRatio);
    this.animationRotate(this.rightLegMidjoint.localRotation, currentKeyframeData["legR2"], currentMoveRatio);
  }
  arcBallUpdate() { 
    if (!this.Mousepressed){
      return;
    }

    //arcball center : 401, 401
    let relativePX = this.prevMouseX / 401 - 1
    let relativePY = this.prevMouseY / 401 - 1
    let relativeCX = this.currMouseX / 401 - 1
    let relativeCY = this.currMouseY / 401 - 1

    if (Math.pow(relativePX, 2) + Math.pow(relativePY, 2) >=1) return;
    if (Math.pow(relativeCX, 2) + Math.pow(relativeCY, 2) >=1) return;

    let v1 = vec3.fromValues(relativePX, relativePY, Math.sqrt(1 - Math.pow(relativePX, 2) - Math.pow(relativePY, 2)));
    let v2 = vec3.fromValues(relativeCX, relativeCY, Math.sqrt(1 - Math.pow(relativeCX, 2) - Math.pow(relativeCY, 2)));
     
    let angle = vec3.angle(v1, v2);
    let axisVect = vec3.create()
    vec3.cross(axisVect, v1, v2);
    vec3.normalize(axisVect, axisVect);

    let rotateQuat = quat.create();
    quat.setAxisAngle(rotateQuat, axisVect, angle)
    quat.normalize(rotateQuat, rotateQuat)
    quat.multiply(this.SelectedObject.localRotation, rotateQuat, this.SelectedObjectInitQuat)
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
  async createSkyBox(){
    // Rest of initialization below
    const textureLoader = cs380.TextureLoader.load({
      uv_checker: 'resources/uv_checker.png',

      posX: 'resources/skybox/night_left.png',
      negX: 'resources/skybox/night_right.png',
      posY: 'resources/skybox/night_top.png',
      negY: 'resources/skybox/night_bottom.png',
      posZ: 'resources/skybox/night_front.png',
      negZ: 'resources/skybox/night_back.png',
    });

    const shaderLoader = cs380.ShaderLoader.load({
      skyboxShader: SkyboxShader.source,
      textureShader: TextureShader.source,
    });

    const loaderResult = await Promise.all([textureLoader, shaderLoader]);
    const textureLoaderResult = loaderResult[0];
    const shaderLoaderResult = loaderResult[1];

    // create Skybox
    // generate cubemap texture
    const cubemap = new cs380.Cubemap();
    this.thingsToClear.push(cubemap);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    cubemap.initialize([
      [gl.TEXTURE_CUBE_MAP_POSITIVE_X, textureLoaderResult.posX],
      [gl.TEXTURE_CUBE_MAP_NEGATIVE_X, textureLoaderResult.negX],
      [gl.TEXTURE_CUBE_MAP_POSITIVE_Y, textureLoaderResult.posY],
      [gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, textureLoaderResult.negY],
      [gl.TEXTURE_CUBE_MAP_POSITIVE_Z, textureLoaderResult.posZ],
      [gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, textureLoaderResult.negZ]
    ]);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    const skyboxShader = new SkyboxShader();
    this.thingsToClear.push(skyboxShader);
    skyboxShader.initialize(shaderLoaderResult.skyboxShader);

    const cubeMeshData = cs380.primitives.generateCube();
    const skyboxMesh = cs380.Mesh.fromData(cubeMeshData);

    this.thingsToClear.push(skyboxMesh);
    this.skybox = new Skybox(skyboxMesh, skyboxShader);
    this.skybox.uniforms.mainTexture = cubemap.id;

    // Render textured cube and bunny with TextureShader
    const textureShader = new TextureShader();
    this.thingsToClear.push(textureShader);
    textureShader.initialize(shaderLoaderResult.textureShader);

    // create uvChecker texture
    const uvCheckerTexture = new cs380.Texture();
    this.thingsToClear.push(uvCheckerTexture);
    uvCheckerTexture.initialize(textureLoaderResult.uv_checker);

    //create cube
    const cubeMesh = cs380.Mesh.fromData(cubeMeshData);
    this.thingsToClear.push(cubeMesh);
    this.cube = new cs380.RenderObject(cubeMesh, textureShader);
    this.cube.uniforms.mainTexture = uvCheckerTexture.id;
    vec3.set(this.cube.transform.localPosition, 0, 0, 0);
  }
  async initialize() {
    // Basic setup for camera
    const { width, height } = gl.canvas.getBoundingClientRect();
    const aspectRatio = width / height;
    this.camera = new cs380.Camera();
    vec3.set(this.camera.transform.localPosition, 0, 0, 110);
    mat4.perspective(
      this.camera.projectionMatrix,
      (45 * Math.PI) / 180,
      aspectRatio,
      0.01,
      1000
      );
    const orbitControlCenter = vec3.fromValues(0, 0, 0);
    this.simpleOrbitControl = new cs380.utils.SimpleOrbitControl(
      this.camera,
      orbitControlCenter
    );
    
    this.width = width;
    this.height = height;
    
    // Rest of initialization below
    this.thingsToClear = [];
    this.thingsToClear.push(this.simpleOrbitControl);

    this.photo = new PhotoFilm()
    await this.photo.initialize(width, height);
    this.thingsToClear.push(this.photo);

    // TODO: initialize your object + scene here

    // initialize picking shader & buffer
    this.pickingShader = await cs380.buildShader(cs380.PickingShader);
    this.pickingBuffer = new cs380.PickingBuffer();
    this.pickingBuffer.initialize(width, height);
    this.thingsToClear.push(this.pickingShader, this.pickingBuffer);

    this.cameraModeMap = {'None' : 0, 'ColorInversion' : 1, 'Grayscale' : 2, 'Blurring' : 3}
    this.cameraShader = await cs380.buildShader(PipEdgeShader);
    this.spareBuffer = new Framebuffer()
    // Build Scene Models
    await this.buildModels();

    // Construct HTML
    await this.constructHTML();

    // Handle Event in Scene.
    await this.handleSceneInput();

    // Construct Animation
    await this.constructAnimation();

    // Construct SkyBox
    await this.createSkyBox();

    this.Ass1 = await new Assignment1();
    await this.Ass1.initialize()

    this.animatedBackground = new Pip();
    this.thingsToClear.push(this.animatedBackground);
    await this.animatedBackground.initialize(width, height, 
      vec3.fromValues(0.0, 0.0, this.planeZ / 2),
      vec3.fromValues(this.planeX, this.planeY, 1.0)
    )
    
    this.cameraEffectPlane = new CameraEffectPip();
    this.thingsToClear.push(this.cameraEffectPlane);
    await this.cameraEffectPlane.initialize(width, height,
      vec3.fromValues(0.0, 0.0, 0.0),
      vec3.fromValues(2.0, 2.0, 1.0)
    )
    
    // SimpleOrbitControl && Toon Shading
    this.isToonShading = false;

    // GL settings
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);

    // Setup GUIs
    // TODO: add camera effects of your own
    // Change "my-effect" and "My camera effect" to fitting name for your effect.
    // You can add multiple options.
  }
  update(elapsed, dt) {
    // TODO: Update objects here
    if (this.SelectedObjIdx == -1)
      this.simpleOrbitControl.update(dt);
    this.updateAnimation(elapsed);

    quat.rotateY(this.lights[3].transform.localRotation, this.lightHouseLightInitRotation, -Math.abs(Math.cos(elapsed)) + 0.5)

    // Update Frame Buffer

    // OPTIONAL: render PickableObject to the picking buffer here
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

    // Render effect-applied scene to framebuffer of the photo if shutter is pressed
    if (this.shutterPressed) {
      this.shutterPressed = false;
      this.renderImage(this.photo.framebuffer.fbo, this.photo.width, this.photo.height);
      this.photo.show(elapsed); // Initiates photo-printing animation
    }

    // Render effect-applied scene to the screen
    this.Ass1.update(elapsed, dt, this.animatedBackground.framebuffer.fbo)
    this.renderImage(null);
    
    // Photos are rendered at the very last
    this.photo.update(elapsed);
    this.photo.render(this.camera);
  }

  renderScene() {
    // TODO: render scene *without* any effect
    // It would consist of every render(...) calls of objects in the scene
    this.skybox.render(this.camera)
    this.animatedBackground.render(this.camera)
    for(let i = 0; i < this.objectList.length; i++){
      const obj = this.objectList[i]
      obj.render(this.camera)
    }
  }

  renderImage(fbo = null, width = null, height = null) {
    // Parameters:
    //  * fbo: Target framebuffer object, default is to the canvas
    //  * width: Width of the target framebuffer, default is canvas'
    //  * height: Height of the target framebuffer default is canvas'

    if (!width) width = this.width;
    if (!height) height = this.height;
    // TODO: render the scene with some camera effect to the target framebuffer object (fbo)
    // Write at least one camera effect shader, which takes a rendered texture and draws modified version of the given texture
    //
    // Step-by-step guide:
    //  1) Bind a separate framebuffer that you initialized beforehand
    //  2) Render the scene to the framebuffer
    //    - You probably need to use this.renderScene() here
    //    - If the width/height differ from the target framebuffer, use gl.viewPort(..)
    //  3) Bind a target framebuffer (fbo)
    //  4) Render a plane that fits the viewport with a camera effect shader
    //    - The plane should perfectly fit the viewport regardless of the camera movement (similar to skybox)
    //    - You may change the shader for a RenderObject like below:
    //        this.my_object.render(this.camera, *my_camera_effect_shader*)

    // TODO: Remove the following line after you implemented.
    // (and please, remove any console.log(..) within the update loop from your submission)

    // Below codes will do no effectl it just renders the scene. You may (should?) delete this.
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.cameraEffectPlane.framebuffer.fbo);
    gl.viewport(0, 0, width, height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.renderScene();

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, width, height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.cameraEffectPlane.render(this.camera);
  }
}
