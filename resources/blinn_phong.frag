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
    vec4 w_camera_pos= cameraTransform[0];
    vec3 camera_pos_vec = (w_camera_pos * W2C).xyz;

    float shinness = 30.0;
    
    for (int i=0; i<numLights; i++){
        if (!lights[i].enabled) continue;

        vec3 lightColor = lights[i].rgb;
        vec3 newColor = vec3(mainColor[0] * lightColor[0], mainColor[1] * lightColor[1], mainColor[2] * lightColor[2]) * lights[i].illuminance;

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
            float radian_cutoff = lights[i].angle;
            float radian_cutoff_out = lights[i].angle * 1.5;
            float angleSmoothness = lights[i].angleSmoothness;

            light_vec = normalize(frag_pos.xyz - light_pos);
            float radian_frag = acos(dot(light_dir, light_vec));
            float radian_smooth = (radian_frag - radian_cutoff) / (radian_cutoff - radian_cutoff_out);
            reflection_intensity = pow(cos(radian_frag), angleSmoothness) * min(1.0, max(0.0, radian_smooth));
        }
        else if (lights[i].type == AMBIENT) {
            // TODO: implement ambient reflection
            intensity += newColor;
            continue;
        }
        vec3 frag_normal_normalized = normalize(frag_normal.xyz);

        //Diffuse
        intensity += newColor * reflection_intensity * min(max(dot(frag_normal_normalized, - light_vec) , 0.0), 1.0);

        //Specular
        vec3 hvec = normalize(camera_pos_vec - frag_pos.xyz);

        vec3 lvec = 2.0 * frag_normal_normalized * dot(frag_normal_normalized, -light_vec) + light_vec;

        intensity += newColor * reflection_intensity * pow(max(dot(lvec, hvec), 0.0), shinness);
    }
    
    output_color = vec4(intensity, 1.0f);
    
    output_color.rgb = pow(output_color.rgb, vec3(1.0 / 2.2));  // Gamma correction
}

