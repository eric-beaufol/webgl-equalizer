#pragma glslify: hsl2rgb = require(glsl-hsl2rgb)
#define PI 3.1415926538

uniform float uStrength;
attribute float aFrequency;
varying float vFrequency;

void main() {
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  
  float angle = atan(modelPosition.y, modelPosition.x);

  modelPosition.x += cos(angle) * aFrequency * uStrength;
  modelPosition.y += sin(angle) * aFrequency * uStrength;

  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;

  gl_Position = projectedPosition;

  vFrequency = aFrequency;
}