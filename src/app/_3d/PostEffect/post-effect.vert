attribute vec4 position;
attribute vec2 uv;

varying vec2 vUv;

void main() {
  vUv = uv;
  
  gl_Position = position;
}
