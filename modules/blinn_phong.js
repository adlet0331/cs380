import gl from './gl.js'

import { vec3, vec4 } from "./cs380/gl-matrix.js"

import * as cs380 from './cs380/cs380.js'

export const LightType = {
  DIRECTIONAL: 0,
  POINT: 1,
  SPOTLIGHT: 2,
  AMBIENT: 3,
};

export class Material {
  constructor() {
    this.ambientColor = vec3.create();
    this.diffuseColor = vec3.create();
    this.specularColor = vec3.create();
    this.isToonShading = false;
    this.isPerlinNoise = false;
    this.time = 0.0;
  }
}

export class Light {
  constructor() {
    this.transform = new cs380.Transform();
    this.type = LightType.DIRECTIONAL;
    this.enabled = true;
    this.illuminance = 1;
    this.angle = Math.PI / 6;
    this.angleSmoothness = 0.1;
    this.rgb = vec3.create();
    this._v3 = vec3.create();
    this._v4 = vec4.create();
  }

  get pos(){
    vec3.set(this._v3, 0, 0, 0);
    vec3.transformMat4(this._v3, this._v3, this.transform.worldMatrix);
    return this._v3;
  }

  get dir() {
    vec4.set(this._v4, 0, 0, -1, 0);
    vec4.transformMat4(this._v4, this._v4, this.transform.worldMatrix);
    vec3.set(this._v3, ...this._v4);
    return this._v3;
  }

}

export class BlinnPhongShader extends cs380.BaseShader {
  static get source() {
    // Define shader codes here
    return [
      [gl.VERTEX_SHADER, "resources/blinn_phong.vert"],
      [gl.FRAGMENT_SHADER, "resources/blinn_phong.frag"],
    ];
  }

  generateUniformLocations() {
    return {
      // Below three are must-have uniform variables,
      projectionMatrix: gl.getUniformLocation(this.program, "projectionMatrix"),
      cameraTransform: gl.getUniformLocation(this.program, "cameraTransform"),
      modelTransform: gl.getUniformLocation(this.program, "modelTransform"),

      // Shader-specific uniforms
      mainColor: gl.getUniformLocation(this.program, "mainColor"),
      numLights: gl.getUniformLocation(this.program, "numLights"),
    };
  }

  setUniforms(kv) {
    this.setUniformMat4(kv, "projectionMatrix");
    this.setUniformMat4(kv, "cameraTransform");
    this.setUniformMat4(kv, "modelTransform");

    // Set shader-specific uniforms here
    this.setUniformVec3(kv, "mainColor", 1, 1, 1);

    // Materials
    const materialProperties = ['ambientColor', 'diffuseColor', 'specularColor', 'isToonShading', 'isPerlinNoise', 'time'];
    if ('material' in kv){
      const material = kv['material'];
      const getmaterial = materialProperties.reduce(
        (obj, x) => {
          obj[x] = gl.getUniformLocation(this.program, `material.${x}`);
          return obj;
        }, {}
      );
      gl.uniform3f(getmaterial.ambientColor, ...material.ambientColor);
      gl.uniform3f(getmaterial.diffuseColor, ...material.diffuseColor);
      gl.uniform3f(getmaterial.specularColor, ...material.specularColor);
      gl.uniform1i(getmaterial.isToonShading, material.isToonShading);
      gl.uniform1i(getmaterial.isPerlinNoise, material.isPerlinNoise);
      gl.uniform1f(getmaterial.time, material.time);
    }

    if ('lights' in kv) {
      const lights = kv['lights'];
      const lightProperties = ['type', 'enabled', 'pos', 'illuminance', 'rgb', 'dir', 'angle', 'angleSmoothness'];
      const numLights = Math.min(lights.length, 10);
      gl.uniform1i(this.uniformLocations.numLights, numLights);
      for (let i=0; i < numLights; i++) {
        const light = lights[i];
        const locations = lightProperties.reduce(
            (obj, x) => {
              obj[x] = gl.getUniformLocation(this.program, `lights[${i}].${x}`);
              return obj;
            }, {}
        );
        gl.uniform1i(locations.type, light.type);
        gl.uniform1i(locations.enabled, light.enabled);
        gl.uniform3f(locations.pos, ...light.pos);
        gl.uniform3f(locations.dir, ...light.dir);
        gl.uniform3f(locations.rgb, ...light.rgb);
        gl.uniform1f(locations.illuminance, light.illuminance);
        gl.uniform1f(locations.angle, light.angle);
        gl.uniform1f(locations.angleSmoothness, light.angleSmoothness);
      }
    }
    else {
      gl.uniform1i(this.uniformLocations.numLights, 0);
    }
  }
}
