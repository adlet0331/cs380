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

float random(vec3 seed) {
    seed = seed + vec3(123.456, 789.123, 456.789);
    return fract(sin(dot(seed, vec3(12.9898, 78.233, 45.5432))) * 43758.5453);
}

void main() {
    mat4 W2C = inverse(cameraTransform);
    vec3 intensity = vec3(0.0, 0.0, 0.0);

    // World 2 Camera
    vec4 w_frag_normal = frag_normal * W2C;
    vec3 frag_normal_vec = normalize(w_frag_normal.xyz);
    vec4 w_frag_pos = frag_pos * W2C;
    vec3 frag_pos_vec = w_frag_pos.xyz;

    vec4 w_camera_pos= cameraTransform[0];
    vec3 camera_pos_vec = (w_camera_pos * W2C).xyz;

    float shinness = 30.0f;
    
    for (int i=0; i<numLights; i++){
        if (!lights[i].enabled) continue;

        vec3 lightColor = lights[i].rgb;
        vec3 newColor = vec3(mainColor[0] * lightColor[0], mainColor[1] * lightColor[1], mainColor[2] * lightColor[2]) * lights[i].illuminance;

        vec4 w_light_pos = vec4(lights[i].pos[0], lights[i].pos[1], lights[i].pos[2], 0) * W2C;
        vec3 light_pos = w_light_pos.xyz;

        // Set this for Reflection
        vec3 light_vec;
        float reflection_intensity;

        if (lights[i].type == DIRECTIONAL) {
            // TODO: implement diffuse and specular reflections for directional light
            light_vec = normalize(lights[i].dir);
            reflection_intensity = 1.0;
        }
        else if (lights[i].type == POINT) {
            float dist = distance(light_pos, frag_pos_vec);
            // https://wiki.ogre3d.org/tiki-index.php?page=-Point+Light+Attenuation
            float a = 1.0;
            float b = 0.14;
            float c = 0.07;
            
            float Attenuation = 1.0 / (a + b * dist + c * dist * dist);

            light_vec = normalize(frag_pos_vec - light_pos);
            reflection_intensity = Attenuation;
        }
        else if (lights[i].type == SPOTLIGHT) {
            continue;
        }
        else if (lights[i].type == AMBIENT) {
            // TODO: implement ambient reflection
            intensity += newColor;
            continue;
        }
        //Diffuse
        intensity += newColor * reflection_intensity * min(max(dot(frag_normal_vec, -light_vec) , 0.0f), 1.0f);

        //Specular
        vec3 hvec = normalize(camera_pos_vec - frag_pos_vec);

        vec3 lvec = 2.0 * frag_normal_vec * dot(frag_normal_vec, -light_vec) + light_vec;

        intensity += newColor * reflection_intensity * max(pow(max(dot(lvec, hvec), 0.0f), shinness), 0.0f);
    }
    
    output_color = vec4(intensity, 1.0f);
    
    output_color.rgb = pow(output_color.rgb, vec3(1.0 / 2.2));  // Gamma correction
}

