#version 300 es

layout(location = 0) in vec3 in_pos;

out vec3 uv;

uniform mat4 projectionMatrix;
uniform mat4 cameraTransform;
uniform mat4 modelTransform;

mat4 getNormalMatrix(mat4 MVM)
{
	mat4 invm = inverse(MVM);
	invm[0][3] = 0.0;
	invm[1][3] = 0.0;
	invm[2][3] = 0.0;

	return transpose(invm);
}

void main() {
  //TODO: implement uv and gl_Position
  vec4 frag_pos = modelTransform * vec4(in_pos, 1);

  uv = (transpose(inverse(cameraTransform)) * frag_pos).xyz;
  
  gl_Position = projectionMatrix * frag_pos;
}
