// GLSL ES 3.0 (three prepends `#version 300 es`).
// Fake volumetric light: for each pixel, the length of the view ray's chord through the sphere, clipped at
// the ground, sets the haze. Looks like a soft ball from any angle, with no edge to catch.
precision highp float;

uniform vec3 cameraPosition;
// peak haze added through the sphere's center
uniform float uIntensity;
// world y of the floor; haze below it is not counted
uniform float uGround;

in vec3 vWorld;
flat in vec3 vCenter;
flat in float vRadius;
flat in vec3 vColor;

out vec4 fragColor;

void main(void) {
  vec3 dir = normalize(vWorld - cameraPosition);
  vec3 p = cameraPosition - vCenter;
  float b = dot(p, dir);
  float c = dot(p, p) - vRadius * vRadius;
  float h = b * b - c;

  if (h <= 0.0) {
    discard;
  }

  float s = sqrt(h);
  float t0 = max(0.0, -b - s);
  float t1 = -b + s;
  // chord through the sphere relative to the longest possible one (through the center)
  float chord = (t1 - t0) / (2.0 * vRadius);

  // stop counting haze below the floor
  if (dir.y < 0.0) {
    float tGround = (uGround - cameraPosition.y) / dir.y;
    t1 = min(t1, tGround);
  }
  float visible = clamp((t1 - t0) / max(1e-4, 2.0 * vRadius * chord), 0.0, 1.0);

  // (1 - q^2)^2 in terms of the ray's offset q from the center: flat gradient at the rim, so the haze
  // fades out with no visible edge
  float haze = uIntensity * pow(chord, 4.0) * visible;

  // additive: three adds src * alpha, so alpha stays 1
  fragColor = vec4(vColor * haze, 1.0);
}
