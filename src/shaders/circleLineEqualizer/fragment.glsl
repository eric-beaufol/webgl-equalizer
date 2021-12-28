varying float vFrequency;

void main() {
  vec3 color = mix(vec3(1.), vec3(.1, .1, .8), vFrequency / 50.);

  gl_FragColor = vec4(color, 1.);
}