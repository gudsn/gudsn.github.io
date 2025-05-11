#version 300 es

precision highp float;

out vec4 FragColor;
in vec3 fragPos;  
in vec3 normal;  
in vec2 texCoord;

struct Material {
    sampler2D diffuse; // diffuse map
    vec3 specular;     // 표면의 specular color
    float shininess;   // specular 반짝임 정도
};

struct Light {
    //vec3 position;
    vec3 direction;
    vec3 ambient; // ambient 적용 strength
    vec3 diffuse; // diffuse 적용 strength
    vec3 specular; // specular 적용 strength
};

uniform Material material;
uniform Light light;
uniform vec3 u_viewPos;
uniform int toonLevels;

void main() {
    // ambient
vec3 rgb = vec3(1.0, 0.5, 0.4);
    vec3 ambient = light.ambient * rgb;
  	
    // diffuse 
    vec3 norm = normalize(normal);
    //vec3 lightDir = normalize(light.position - fragPos);
    vec3 lightDir = normalize(light.direction);
    float dotNormLight = dot(norm, lightDir);
    float diff = max(dotNormLight, 0.0);
    vec3 diffuse = light.diffuse * diff * rgb;  
    
    // specular
    vec3 viewDir = normalize(u_viewPos - fragPos);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = 0.0;
    if (dotNormLight > 0.0) {        spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
    }
    vec3 specular = light.specular * spec * material.specular;  
        
    vec3 result = ambient + diffuse + specular;
    // Toon Shading 적용
    float intensity = dot(result, vec3(1.0)); // RGB 합산 밝기
    float range = 1.9/ float(toonLevels);

    for (int i = 0; i < 10; i++) { // 10은 최대 단계 수 (GLSL의 상수 루프 제한 대응)
        if (i >= toonLevels) break; // 실제 toonLevels 제한
        float level = range * float(i + 1);
        if (intensity < level) {
            float factor = float(i + 1) / float(toonLevels); // 밝기 계수
            result = rgb * factor; // 주황색 기반 밝기 단계
            break;
        }
    }
    FragColor = vec4(result, 1.0);
} 