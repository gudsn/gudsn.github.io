#version 300 es
in vec2 a_position;
uniform mat4 u_modelViewProjection;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    gl_PointSize = 10.0; // 교점 크기 설정
}