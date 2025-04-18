#version 300 es

in vec2 a_position;
in vec4 a_color;
uniform mat4 u_transform;
uniform vec4 u_color;
out vec4 v_color;

void main() {
    gl_Position = u_transform * vec4(a_position, 0.0, 1.0);
    v_color = u_color;
}  