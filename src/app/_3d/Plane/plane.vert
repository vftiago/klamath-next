attribute vec3 position;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float time;

varying vec3 vPosition;

const float weight = 0.5;

void main() {
  float sin1 = sin((position.x + position.y) * 0.2 + time * 0.5 * weight);
  float sin2 = sin((position.x - position.y) * 0.4 + time * 2.0 * weight);
  float sin3 = sin((position.x + position.y) * -0.6 + time * weight);
  
  vec3 updatePosition = vec3(position.x, position.y, position.z + sin1 * 50.0 + sin2 * 10.0 + sin3 * 8.0);

  vPosition = updatePosition;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(updatePosition, 1.0);
}
