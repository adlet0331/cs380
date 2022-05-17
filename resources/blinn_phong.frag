#version 300 es
precision highp float;

#define DIRECTIONAL 0
#define POINT 1
#define SPOTLIGHT 2
#define AMBIENT 3

in vec4 frag_pos;
in vec4 frag_normal;

out vec4 output_color;

uniform mat4 cameraTransform;

uniform vec3 mainColor;

struct Material {
    vec3 ambientColor;
    vec3 diffuseColor;
    vec3 specularColor;
    bool isToonShading;
};

struct Light {
    int type;
    bool enabled;
    vec3 pos;
    vec3 dir;
    vec3 rgb;
    float illuminance;
    float angle;
    float angleSmoothness;
};

uniform int numLights;
uniform Light lights[10];
uniform Material material;

float random(vec3 seed) {
    seed = seed + vec3(123.456, 789.123, 456.789);
    return fract(sin(dot(seed, vec3(12.9898, 78.233, 45.5432))) * 43758.5453);
}

void main() {
    mat4 W2C = inverse(cameraTransform);
    vec3 intensity = vec3(0.0, 0.0, 0.0);

    // World 2 Camera
    vec4 w_camera_pos= cameraTransform[3];

    vec3 camera_pos_vec = (W2C * w_camera_pos).xyz;

    vec3 frag_normal_normalized = normalize(frag_normal.xyz);
    vec3 hvec = normalize(camera_pos_vec - frag_pos.xyz);

    bool isToonShading = material.isToonShading;
    float toonConst = 3.0;

    float shinness = 30.0;
    
    for (int i=0; i<numLights; i++){
        if (!lights[i].enabled) continue;
        if (lights[i].illuminance == 0.0) continue;

        vec3 lightColor = lights[i].rgb;
        vec3 newColor = vec3(mainColor[0] * lightColor[0], mainColor[1] * lightColor[1], mainColor[2] * lightColor[2]) * lights[i].illuminance;

        vec3 ambientColor = vec3(newColor[0] * material.ambientColor[0], newColor[1] * material.ambientColor[1], newColor[2] * material.ambientColor[2]);
        vec3 diffuseColor = vec3(newColor[0] * material.diffuseColor[0], newColor[1] * material.diffuseColor[1], newColor[2] * material.diffuseColor[2]);
        vec3 specularColor = vec3(newColor[0] * material.specularColor[0], newColor[1] * material.specularColor[1], newColor[2] * material.specularColor[2]);

        vec3 light_pos = (W2C * vec4(lights[i].pos, 1.0)).xyz;
        vec3 light_dir = normalize((W2C * vec4(lights[i].dir, 0.0)).xyz);

        // Set this for Reflection
        vec3 light_vec;
        float reflection_intensity;

        if (lights[i].type == DIRECTIONAL) {
            // TODO: implement diffuse and specular reflections for directional light
            light_vec = light_dir;
            reflection_intensity = 1.0;
        }
        else if (lights[i].type == POINT) {
            float dist = distance(light_pos, frag_pos.xyz);
            // https://wiki.ogre3d.org/tiki-index.php?page=-Point+Light+Attenuation
            float a = 1.0;
            float b = 0.7;
            float c = 1.8;
            
            float Attenuation = 1.0 / (a + b * dist + c * dist * dist);

            light_vec = normalize(frag_pos.xyz - light_pos);
            reflection_intensity = Attenuation;
        }
        else if (lights[i].type == SPOTLIGHT) {
            if (lights[i].angle == 0.0) continue;
            float radian_cutoff = lights[i].angle;
            float radian_cutoff_out = lights[i].angle * 1.5;
            float angleSmoothness = lights[i].angleSmoothness;

            light_vec = normalize(frag_pos.xyz - light_pos);
            float radian_frag = acos(dot(light_dir, light_vec));
            float radian_smooth =  clamp((radian_cutoff - radian_frag) / (radian_cutoff_out - radian_cutoff), 0.0, 1.0) - 0.5;
            reflection_intensity = pow(max(0.0, cos(radian_frag)), angleSmoothness) * max(0.0, sin(radians(radian_smooth * 180.0)));
        }
        else if (lights[i].type == AMBIENT) {
            // TODO: implement ambient reflection
            intensity += ambientColor;
            continue;
        }
        vec3 lvec = 2.0 * frag_normal_normalized * dot(frag_normal_normalized, -light_vec) + light_vec;

        //Diffuse
        vec3 diffuseVec = diffuseColor * reflection_intensity * clamp(dot(frag_normal_normalized, - light_vec) , 0.0, 1.0);
        intensity += diffuseVec;

        //Specular
        vec3 specularVec = specularColor * reflection_intensity * pow(max(dot(lvec, hvec), 0.0), shinness);    
        intensity += specularVec;
    }

    if (isToonShading){
        intensity *= float(ceil(length(intensity) * toonConst)) / toonConst;
        float angle = acos(dot(hvec, frag_normal_normalized));
        intensity *= (1.0 - clamp(pow(max(sin(angle), 0.0), 300.0) * 5.0, 0.0, 1.0));
    }
    
    output_color = vec4(intensity, 1.0f);
    
    output_color.rgb = pow(output_color.rgb, vec3(1.0 / 2.2));  // Gamma correction
}

