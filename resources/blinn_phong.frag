#version 300 es
precision highp float;

#define DIRECTIONAL 0
#define POINT 1
#define SPOTLIGHT 2
#define AMBIENT 3

in vec4 frag_pos;
in vec4 frag_normal;

out vec4 output_color;

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
     return mod289(((x*34.0)+10.0)*x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v){ 
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    // First corner
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;

    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    //   x0 = x0 - 0.0 + 0.0 * C.xxx;
    //   x1 = x0 - i1  + 1.0 * C.xxx;
    //   x2 = x0 - i2  + 2.0 * C.xxx;
    //   x3 = x0 - 1.0 + 3.0 * C.xxx;
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
    vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

    // Permutations
    i = mod289(i); 
    vec4 p = permute( permute( permute(i.z + vec4(0.0, i1.z, i2.z, 1.0 )) 
    + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
    + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    // Gradients: 7x7 points over a square, mapped onto an octahedron.
    // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
    float n_ = 0.142857142857; // 1.0/7.0
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
    //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    //Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    // Mix final noise value
    vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 105.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}

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
    bool isPerlinNoise = material.isPerlinNoise;
    float time = material.time;
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
        vec3 uvw = frag_pos.xyz + 0.1*vec3(snoise(frag_pos.xyz + vec3(0.0, 0.0, time)),
            snoise(frag_pos.xyz + vec3(43.0, 17.0, time)),
            snoise(frag_pos.xyz + vec3(-17.0, -43.0, time)));
        // Six components of noise in a fractal sum
        float n = snoise(uvw - vec3(0.0, 0.0, time));
        n += 0.5 * snoise(uvw * 2.0 - vec3(0.0, 0.0, time*1.4)); 
        n += 0.25 * snoise(uvw * 4.0 - vec3(0.0, 0.0, time*2.0)); 
        n += 0.125 * snoise(uvw * 8.0 - vec3(0.0, 0.0, time*2.8)); 
        n += 0.0625 * snoise(uvw * 16.0 - vec3(0.0, 0.0, time*4.0)); 
        n += 0.03125 * snoise(uvw * 32.0 - vec3(0.0, 0.0, time*5.6)); 
        n = n * 0.7;
        // A "hot" colormap - cheesy but effective 
        intensity += vec3(n, n, n);
    }
    
    output_color = vec4(intensity, 1.0f);
    
    output_color.rgb = pow(output_color.rgb, vec3(1.0 / 2.2));  // Gamma correction
}

