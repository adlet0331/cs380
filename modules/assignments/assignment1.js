import gl from "../gl.js";
import { vec3, mat4, quat } from "../cs380/gl-matrix.js";

import * as cs380 from "../cs380/cs380.js";

import { SolidShader } from "../solid_shader.js";
import { VertexColorShader } from "../vertex_color_shader.js";

export default class Assignment1 extends cs380.BaseApp {
  async initialize() {
    // Basic setup for camera
    const aspectRatio = gl.canvas.clientWidth / gl.canvas.clientHeight;
    this.camera = new cs380.Camera();
    vec3.set(this.camera.transform.localPosition, 0, 0, 0);
    mat4.ortho(
        this.camera.projectionMatrix,
        -2 * aspectRatio,
        +2 * aspectRatio,
        -2,
        +2,
        -2,
        +2
    );
    document.getElementById("settings").innerHTML = `
      <h3>Basic requirements</h3>
      <ul>
        <li>Add a background with color gradient</li>
        <li>Add 2 or more types of fractal-like natural objects</li>
        <li>Add framerate-independent natural animation</li>
        <li>Show some creativity in your scene</li>
      </ul>
    `;

    // Rest of initialization below
    this.backmesh = new cs380.Mesh();
    this.backmesh.addAttribute(3); // position
    this.backmesh.addAttribute(3); // color
    this.backmesh.addVertexData(
      2, 50, 0, 1, 1, 1,
      2, -2, 0, 0, 0, 0,
      -5, -2, 0, 0, 0, 0.1,
    );

    this.backmesh.initialize();
    
    this.vertexColorShader = await cs380.buildShader(VertexColorShader);

    this.background = new cs380.RenderObject(this.backmesh, this.vertexColorShader);
    // Drawing Background End
    
    //Making Objects Start
    this.colorlist = ["#7777FF", "#8888FF", "#9999FF", "#AAAAFF", "#BBBBFF", "#CCCCFF"]
    this.snowObjects = [];
    this.snowObjectsInfo = [];
    this.frostcolorlist = [ "#7755FF", "#7766FF", "#7777FF", "#7788FF", "#7799FF", "#77AAFF", "#77BBFF", "#77CCFF", "#77DDFF", "#77EEFF", 
                            "#88EEFF", "#88DDFF", "#88CCFF", "#88BBFF", "#88AAFF", "#8899FF", "#88B88F", "#8877FF", "#8866FF", "#8855FF", ]
    this.frostObjects = [];
    this.frostObjectsInfo = [];
    this.solidshader = await cs380.buildShader(SolidShader);
  }

  buildTriangle = (mesh, centerx, centery, radius, additangle) => {
    const angle = 2 * Math.PI / 3
      const point1 = vec3.fromValues(
        centerx + radius *  Math.cos(additangle),
        centery + radius *  Math.sin(additangle),
        0
      );
      mesh.addVertexData(...point1);
      const point2 = vec3.fromValues(
        centerx + radius *  Math.cos(additangle + angle),
        centery + radius *  Math.sin(additangle + angle),
        0
      );
      mesh.addVertexData(...point2);
      const point3 = vec3.fromValues(
        centerx + radius *  Math.cos(additangle + angle * 2),
        centery + radius *  Math.sin(additangle + angle * 2),
        0
      );
      mesh.addVertexData(...point3);
  }

  buildSnow = (N, radius, firstRadius) => {
    this.snowmesh = new cs380.Mesh();
    this.snowmesh.finalize();
    this.snowmesh.addAttribute(3); // position

    this.buildTriangle(this.snowmesh, 0, 0, radius * firstRadius, 0)
    this.buildTriangle(this.snowmesh, 0, 0, radius * firstRadius, Math.PI/3)
    var points = [];

    points.push(0)
    points.push(0)
    
    for (let i = 0; i< N; i++){
      // Figure new points array
      var newpoints = [];
      for (let i = 0; i< points.length/2; i++){
        const centerx = points[2 * i]
        const centery = points[2 * i + 1]
        let angle_const = Math.PI / 3
        for (let i = 0; i< 6; i++){
          newpoints.push(centerx + radius * 2 / 3 * Math.cos(angle_const * i))
          newpoints.push(centery + radius * 2 / 3 * Math.sin(angle_const * i))
        }
      }
      points = newpoints
      radius /= 3

      let flag = 0
      for (let i = 0; i< points.length / 2; i++){
        const centerx = points[2 * i]
        const centery = points[2 * i + 1]
        this.buildTriangle(this.snowmesh, centerx, centery, radius, flag * Math.PI/3)
        flag = 1 - flag
      }
    }
    this.snowmesh.drawMode = gl.TRIANGLES
    
    this.snowmesh.initialize();
  }

  addSnowObject = (radius, colorStr) => {
    this.buildSnow(5, radius, 0.8);
    let snowObject = new cs380.RenderObject(this.snowmesh, this.solidshader);
    snowObject.uniforms.mainColor = vec3.create();
    cs380.utils.hexToRGB(snowObject.uniforms.mainColor, colorStr);
    this.snowObjects.push(snowObject);
  }

  buildSquare = (mesh, startx, starty, hwidth, height, angle) => {
    const hpi = Math.PI / 2
    let point1 = vec3.fromValues(
      startx + hwidth * Math.cos(angle - hpi),
      starty + hwidth * Math.sin(angle - hpi),
      0
    )
    let point2 = vec3.fromValues(
      startx + hwidth * Math.cos(angle + hpi),
      starty + hwidth * Math.sin(angle + hpi),
      0
    )
    let point3 = vec3.fromValues(
      startx + hwidth * Math.cos(angle + hpi) + height * Math.cos(angle),
      starty + hwidth * Math.sin(angle + hpi) + height * Math.sin(angle),
      0
    )
    let point4 = vec3.fromValues(
      startx + hwidth * Math.cos(angle - hpi) + height * Math.cos(angle),
      starty + hwidth * Math.sin(angle - hpi) + height * Math.sin(angle),
      0
    )
    mesh.addVertexData(...point1);
    mesh.addVertexData(...point2);
    mesh.addVertexData(...point3);
    mesh.addVertexData(...point3);
    mesh.addVertexData(...point4);
    mesh.addVertexData(...point1);
  }

  buildFrost = (N, sx, sy, inithwidth, initLength, drawLength, randomangleadd) => {
    this.frostmesh = new cs380.Mesh();
    this.frostmesh.finalize();
    this.frostmesh.addAttribute(3); //position
    let info = {}
    info['x'] = sx
    info['y'] = sy
    info['angle'] = Math.PI * 0.5
    var startpoint = [];
    startpoint.push(info);

    for(let i = 0; i < N; i++){
      let newstartpoint = [];
      for (let j = 0; j < startpoint.length; j++){
        let info = startpoint[j];
        let startX = info['x'];
        let startY = info['y'];
        let angle = info['angle'];
        if(drawLength > 0){
          if (drawLength > initLength)
            this.buildSquare(this.frostmesh, startX, startY, inithwidth, initLength, angle);
          else
            this.buildSquare(this.frostmesh, startX, startY, inithwidth, drawLength, angle);
        }
        
        //calculate new startpoint and put in
        let newinfo = {}
        newinfo['x'] = startX + initLength * Math.cos(angle)
        newinfo['y'] = startY + initLength * Math.sin(angle)
        newinfo['angle'] = angle + randomangleadd
        newstartpoint.push(newinfo)
        if (true){
          let newinfo = {}
          newinfo['x'] = startX + initLength * Math.cos(angle)
          newinfo['y'] = startY + initLength * Math.sin(angle)
          newinfo['angle'] = angle - randomangleadd
          newstartpoint.push(newinfo)
        }
      }
      drawLength -= initLength;
      inithwidth *= 0.9
      initLength *= 0.8
      startpoint = newstartpoint
    }
    this.frostmesh.drawMode = gl.TRIANGLES
    this.frostmesh.initialize();
  }

  addFrost = (N, sx, sy, inithwidth, initLength, colorStr, angle, elapsed) => {
    this.buildFrost(N, sx, sy, inithwidth, initLength, elapsed, angle)
    let frostObj = new cs380.RenderObject(this.frostmesh, this.solidshader)
    frostObj.uniforms.mainColor = vec3.create();
    cs380.utils.hexToRGB(frostObj.uniforms.mainColor, colorStr)
    this.frostObjects.pop();
    this.frostObjects.push(frostObj);
  }

  finalize() {
    // Finalize WebGL objects (mesh, shader, texture, ...)
    //this.mesh.finalize();
    //this.shader.finalize();
  }

  update(elapsed, dt) {
    // Updates before rendering here
    const makeSnowRandomly = () => {
      const is_make = Math.random()
      if (is_make > 0.15)
        return;

      let r = Math.random() * 0.1 + 0.1
      let color = this.colorlist[Math.floor(Math.random() * this.colorlist.length)]
      this.addSnowObject(r, color)

      let info = {}
      info['time'] = elapsed
      info['changed'] = 0
      info['scale'] = 1
      info['sv'] = 0.000003
      info['r'] = r
      info['x'] = -2
      info['xv'] = Math.random() * 0.3 + 0.2
      info['yv'] = Math.random() * 0.2 + 0.1
      info['rv'] = (Math.random() * 0.03 + 0.02) * (Math.random() > 0.5 ? -1 : 1)
      info['y'] = Math.random() * 2
      this.snowObjectsInfo.push(info);
    }
    
    makeSnowRandomly();

    if (elapsed == 0){
      this.random_angle = Math.random() * 0.5 + 0.2;
    }

    this.addFrost(12, 0, -2, 0.01, 0.8, "#AAFFFF", this.random_angle, 2 * elapsed)

    // Clear canvas
    gl.clearColor(0, 0, 0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Rest of rendering below
    this.background.render(this.camera);
    
    // snow objects update & rendering
    for(let i=0; i<this.snowObjects.length; i++){
      const obj = this.snowObjects[i];
      const info = this.snowObjectsInfo[i];
      const timepassed = elapsed - info['time']
      if(-2 + info['xv'] * timepassed > 3)
        continue

      //calculate y pos for animation
      let ypos = info['y'] + dt * info['yv']
      info['y'] = ypos
      info['yv'] -= 0.01
      if(ypos < -2 + info['r'] && elapsed - info['changed'] > 0.5){
        info['yv'] = info['yv'] * (-1) * (Math.random() * 0.3 + 0.3)
        info['rv'] *= -1 
        info['changed'] = elapsed
      }
      vec3.set(obj.transform.localPosition, -2 + info['xv'] * timepassed, ypos, 0)
      quat.rotateZ(obj.transform.localRotation, obj.transform.localRotation, info['rv'])
      obj.render(this.camera);
    }

    // Frost
    for(let i=0; i<this.frostObjects.length; i++){
      const obj = this.frostObjects[i]
      cs380.utils.hexToRGB(obj.uniforms.mainColor, this.frostcolorlist[Math.floor((elapsed / 0.05) % 20)])

      obj.render(this.camera)
    }
  }
} 
