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
    float illuminance;
    float angle;
    float angleSmoothness;
};

uniform int numLights;
uniform Light lights[10];

vec3 rgb2blackwhite(vec3 rgb) {
    float gray = dot(rgb, vec3(0.299, 0.587, 0.114));
    gray = gray > 0.5? 1.0: 0.0;
    return vec3(gray, gray, gray);
}

float random(vec3 seed) {
    seed = seed + vec3(123.456, 789.123, 456.789);
    return fract(sin(dot(seed, vec3(12.9898, 78.233, 45.5432))) * 43758.5453);
}

vec4 rgb2cmyk(vec3 rgb) {
    float r = rgb[0] / 255.0;
    float g = rgb[1] / 255.0;
    float b = rgb[2] / 255.0;
    float k = 1.0 - max(r, max(g, b));
    float c = (1.0 - r - k) / (1.0 - k);
    float m = (1.0 - g - k) / (1.0 - k);
    float y = (1.0 - b - k) / (1.0 - k);
    vec4 cmyk = vec4(c, m, y, k);
    return cmyk;
}

void main() {
    mat4 W2C = inverse(cameraTransform);
    vec3 intensity = vec3(0.0, 0.0, 0.0);
    
    vec3 N = normalize(frag_normal.xyz);
    
    for (int i=0; i<numLights; i++){
        if (lights[i].enabled == false) continue;
        //if (!lights[i].enabled) continue;
        
        float lightIlluminance = lights[i].illuminance;
        vec3 lightPos = (W2C * vec4(lights[i].pos, 1)).xyz;
        vec3 L = vec3(0);
        if (lights[i].type == DIRECTIONAL) {
            L = normalize((W2C * vec4(-lights[i].dir, 0)).xyz);
        }
        else if (lights[i].type == POINT) {
            continue;
        }
        else if (lights[i].type == SPOTLIGHT) {
            continue;
        }
        else if (lights[i].type == AMBIENT) {
            float ambient = lightIlluminance;
            intensity += ambient * mainColor;
            continue;
        }
        
        float NdotL = dot(N, L);
        float diffuse = max(0.0f, NdotL) * lightIlluminance;
            intensity += diffuse * mainColor;

        float specular = 0.0;
        if (NdotL > 0.0) {
            vec3 V = normalize(-frag_pos.xyz);
            vec3 H = normalize(L + V);
            specular = pow(max(dot(N, H), 0.0), 92.1) * lightIlluminance;
        }
        intensity += specular * mainColor;
    }
    vec2 screenSpace = gl_FragCoord.xy;
    
    // output_color = vec4(rgb2blackwhite(intensity), 1.0);
    // TODO: implement your own functions for NPR and do something with your functions to change the color value
    vec4 cmyk = rgb2cmyk(intensity);
    int screenX = int(screenSpace[0]);
    int screenY = int(screenSpace[1]);
    int INTERVAL = 5;

    vec3 colorC = vec3(0.0, 1.0, 1.0);
    vec3 colorM = vec3(1.0, 0.0, 1.0);
    vec3 colorY = vec3(1.0, 1.0, 0.0);    
    vec3 colorK = vec3(0.0, 0.0, 0.0);

    vec3 newIntensity = vec3(0.0, 0.0, 0.0);

    if ((screenX % INTERVAL == 0 && screenY % INTERVAL == 0) || (screenX % INTERVAL == 1 && screenY % INTERVAL == 0) || (screenX % INTERVAL == 0 && screenY % INTERVAL == 1) || (screenX % INTERVAL == 1 && screenY % INTERVAL == 1)){
        newIntensity = colorC * cmyk[0];
    }
    if ((screenX % INTERVAL == 2 && screenY % INTERVAL == 0) || (screenX % INTERVAL == 2 && screenY % INTERVAL == 0) || (screenX % INTERVAL == 3 && screenY % INTERVAL == 1) || (screenX % INTERVAL == 3 && screenY % INTERVAL == 1)){
        newIntensity = colorM * cmyk[1];
    }
    if ((screenX % INTERVAL == 0 && screenY % INTERVAL == 2) || (screenX % INTERVAL == 1 && screenY % INTERVAL == 2) || (screenX % INTERVAL == 0 && screenY % INTERVAL == 3) || (screenX % INTERVAL == 1 && screenY % INTERVAL == 3)){
        newIntensity = colorY * cmyk[2];
    }
    if ((screenX % INTERVAL == 2 && screenY % INTERVAL == 2) || (screenX % INTERVAL == 3 && screenY % INTERVAL == 2) || (screenX % INTERVAL == 2 && screenY % INTERVAL == 3) || (screenX % INTERVAL == 3 && screenY % INTERVAL == 3)){
        newIntensity = colorK * cmyk[3];
    }
    if (newIntensity[0] == 0.0 && newIntensity[1] == 0.0 && newIntensity[2] == 0.0){
        newIntensity = rgb2blackwhite(intensity);
    }

    output_color = vec4(newIntensity, 1.0);
    
    output_color.rgb = pow(output_color.rgb, vec3(1.0 / 2.2));  // Gamma correction
}

