#version 300 es
precision highp float;

out vec4 FragColor;

in vec3 fragPos;
in vec3 normal;
in vec2 texCoord;

struct Material {
    sampler2D diffuse;
    vec3 specular;
    float shininess;
};

struct Light {
    vec3 direction;
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

uniform Material material;
uniform Light light;
uniform vec3 u_viewPos;
uniform int toonLevels;

void main() {
    vec3 texColor = vec3(1.0, 0.5, 0.3);

    vec3 ambient = light.ambient * texColor;

    vec3 norm = normalize(normal);
    vec3 lightDir = normalize(light.direction);
    vec3 viewDir = normalize(u_viewPos - fragPos);
    vec3 reflectDir = reflect(-lightDir, norm);

    // --- Toon Shading for Diffuse ---
    float diff = max(dot(norm, lightDir), 0.0);
    float diffStep = floor(diff * float(toonLevels)) / float(toonLevels);
    vec3 diffuse = light.diffuse * diffStep * texColor;

    // --- Toon Shading for Specular ---
    float spec = 0.0;
    if (diff > 0.0) {
        float dotRV = max(dot(viewDir, reflectDir), 0.0);
        spec = pow(dotRV, material.shininess);
    }


    float scaledSpec = spec * 3.0; // 스케일 보정

    scaledSpec = clamp(scaledSpec, 0.0, 1.0);

    float specStep = floor(scaledSpec * float(toonLevels)) / float(toonLevels);
    vec3 specular = light.specular * specStep * material.specular;

    vec3 result = ambient + diffuse + specular;
    FragColor = vec4(result, 1.0);
}

