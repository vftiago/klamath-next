// GLSL ES 3.0 (three prepends `#version 300 es`).
precision highp float;

in vec3 vLocal;
flat in vec3 vNormal;
flat in vec3 vColor;
flat in vec4 vParams;

out vec4 fragColor;

// the pale stripe between the neon ones on a striped awning
const vec3 PALE = vec3(131.0, 124.0, 128.0) / 255.0;

void main(void) {
  vec3 color = vColor;

  if (vParams.x > 0.5) {
    float stripe = floor(vLocal.x * vParams.x);
    color = mod(stripe, 2.0) < 1.0 ? vColor : PALE;
  }

  if (vParams.z < 0.5) {
    // flat shading by face, lit from above, plus a soft fall-off toward the ground
    float shade = vNormal.y > 0.5 ? 1.25 : vNormal.y < -0.5 ? 0.5 : abs(vNormal.x) > 0.5 ? 0.72 : vNormal.z > 0.5 ? 1.0 : 0.85;
    shade *= mix(0.7, 1.0, vLocal.y);
    color *= shade;
  }

  fragColor = vec4(color, 1.0);
}
