#version 300 es

layout (location = 0) in vec3 aPos;

uniform float m_x;

uniform float m_y;

void main() { 
    gl_Position = vec4(aPos[0] + m_x , aPos[1] + m_y, aPos[2], 1.0);
} 