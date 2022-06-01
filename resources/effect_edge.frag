#version 300 es
precision highp float;

in vec2 uv;

out vec4 output_color;

uniform sampler2D mainTexture;
uniform float width;
uniform float height;
uniform int camera_mode;

void pixels_3by3(inout vec4 n[9], sampler2D tex, vec2 coord)
{
	float w = 1.0 / width; //interval of u between two fragments pixel
	float h = 1.0 / height; //interval of v between two fragments pixel

	//TODO: get 9 pixels in vec4 array, with the center of current fragment
	// Define n[0], n[1], ... n[8] respectively. Refer to the n[4] put correct coordinate to each pixel.
	n[0] = texture(tex, coord + vec2(-w, -h));
	n[1] = texture(tex, coord + vec2(0, -h));
	n[2] = texture(tex, coord + vec2(w, -h));
	n[3] = texture(tex, coord + vec2(-w, 0));
	n[4] = texture(tex, coord);
	n[5] = texture(tex, coord + vec2(w, 0));
	n[6] = texture(tex, coord + vec2(-w, h));
	n[7] = texture(tex, coord + vec2(0, h));
	n[8] = texture(tex, coord + vec2(w, h));
}

void main() {
	if (camera_mode == 1){ // Color Inversion
		output_color = vec4(vec3(1.0, 1.0, 1.0) - texture(mainTexture, uv).rgb, 1.0);
	}
	else if (camera_mode == 2){ // Grayscale
		output_color = vec4(vec3(1.0, 1.0, 1.0) * length(texture(mainTexture, uv).rgb), 1.0);
	}
	else if (camera_mode == 3){ // Blurring
		vec4 n[9];
		pixels_3by3(n, mainTexture, uv);
		vec4 mean_color;
		for (int i = 0; i < 9; i++){
			mean_color += n[i] / 9.0;
		}
		output_color = vec4(mean_color.rgb, 1.0);
	}
	else{
		vec4 n[9];
		pixels_3by3(n, mainTexture, uv);

		//TODO: calculate magnitude of sobel gradient
		vec4 grad_x = n[0] - n[2] + 2.0f * n[3] - 2.0f * n[5] + n[6] - n[8];
		vec4 grad_y = n[0] + 2.0f * n[1] + n[2] - n[6] - 2.0f * n[7] - n[8];
		vec4 grad_mag = sqrt(grad_x * grad_x + grad_y * grad_y); //put "magnitude of gradient" to grad_mag correctly.

		output_color = vec4(1.0 - grad_mag.rgb, 1.0);
	}
}

