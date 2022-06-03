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
    bool isPerlinNoise;
    float time;
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

float FLOOR_LENGTH = 2.0;

vec2 random(vec2 seed) {
    seed = seed + vec2(123.456, 789.123);
    float rand = fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453);
    return vec2(cos(rand * 3.14), sin(rand * 3.14));
}

void get4RandomGradientVect(inout vec2 n[4], inout vec2 g[4], inout vec2 point_vec){
    float time = material.time * 1.5;
    //float add_floor = time - floor(time / FLOOR_LENGTH) * FLOOR_LENGTH;
    //add_floor = 1.0;
    point_vec += vec2(time, time);
    g[0] = (floor(point_vec / FLOOR_LENGTH) + vec2(0.0, 0.0)) * FLOOR_LENGTH;
    g[1] = (floor(point_vec / FLOOR_LENGTH) + vec2(1.0, 0.0)) * FLOOR_LENGTH;
    g[2] = (floor(point_vec / FLOOR_LENGTH) + vec2(0.0, 1.0)) * FLOOR_LENGTH;
    g[3] = (floor(point_vec / FLOOR_LENGTH) + vec2(1.0, 1.0)) * FLOOR_LENGTH;

    vec2 random_vec = vec2(time * 1.3, time * 0.6);
    random_vec = vec2(0.0, 0.0);

    n[0] = normalize(random(g[0] + random_vec));
    n[1] = normalize(random(g[1] + random_vec));
    n[2] = normalize(random(g[2] + random_vec));
    n[3] = normalize(random(g[3] + random_vec));
 }

 float interpolate(float a0, float a1, float ratio){
     return (a1 - a0) * (3.0 - 2.0 * ratio) * ratio * ratio + a0;
 }

float perlinNoise(vec3 v){ 
    vec2 n[4];
    vec2 g[4];
    vec2 vec2d = vec2(v[0], v[2]);
    get4RandomGradientVect(n, g, vec2d);

    vec3 dot_vec = vec3(0.0, 0.0, 0.0);
    float norm_floor = FLOOR_LENGTH;
    float dot0 = dot(vec2d - g[0], n[0]) / norm_floor;
    float dot1 = dot(vec2d - g[1], n[1]) / norm_floor;
    float dot2 = dot(vec2d - g[2], n[2]) / norm_floor;
    float dot3 = dot(vec2d - g[3], n[3]) / norm_floor;
     
    float ratiox = (vec2d[0] - g[0][0]) / FLOOR_LENGTH;
    float ratioz = (vec2d[1] - g[0][1]) / FLOOR_LENGTH;

    float intp1 = interpolate(dot0, dot1, ratiox);
    float intp2 = interpolate(dot2, dot3, ratiox);
    float ret_value = interpolate(intp1, intp2, ratioz);

    return abs(ret_value);
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
    bool isPerlinNoise = material.isPerlinNoise;
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

    if (isPerlinNoise) {
        float perlin_intensity = perlinNoise((cameraTransform * frag_pos).xyz);
        intensity *= (1.0 - perlin_intensity);
    }
    
    output_color = vec4(intensity, 1.0f);
    
    output_color.rgb = pow(output_color.rgb, vec3(1.0 / 2.2));  // Gamma correction
}

