/*-------------------------------------------------------------------------
08_Transformation.js

canvas의 중심에 한 edge의 길이가 0.3인 정사각형을 그리고, 
이를 크기 변환 (scaling), 회전 (rotation), 이동 (translation) 하는 예제임.
    T는 x, y 방향 모두 +0.5 만큼 translation
    R은 원점을 중심으로 2초당 1회전의 속도로 rotate
    S는 x, y 방향 모두 0.3배로 scale
이라 할 때, 
    keyboard 1은 TRS 순서로 적용
    keyboard 2는 TSR 순서로 적용
    keyboard 3은 RTS 순서로 적용
    keyboard 4는 RST 순서로 적용
    keyboard 5는 STR 순서로 적용
    keyboard 6은 SRT 순서로 적용
    keyboard 7은 원래 위치로 돌아옴
---------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

let isInitialized = false;
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let axesVAO;
let cubeVAO;
let finalTransform;
let e_rotationAngle = 0;
let es_rotationAngle = 0;
let s_rotationAngle = 0;
let m_rotationAngle = 0;
let ms_rotationAngle = 0;
let currentTransformType = null;
let isAnimating = true;
let lastTime = 0;
let textOverlay; 
const colors = {
    sun: [1.0, 0.0, 0.0, 1.0],
    earth: [0.0, 1.0, 1.0, 1.0],
    moon: [1.0, 1.0, 0.0, 1.0]
};

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
        requestAnimationFrame(animate);
    }).catch(error => {
        console.error('프로그램 실행 중 오류 발생:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.2, 0.3, 0.4, 1.0);
    
    return true;
}

function setupAxesBuffers(shader) {
    axesVAO = gl.createVertexArray();
    gl.bindVertexArray(axesVAO);

    const axesVertices = new Float32Array([
        -0.8, 0.0, 0.8, 0.0,  // x축
        0.0, -0.8, 0.0, 0.8   // y축
    ]);

    const axesColors = new Float32Array([
        1.0, 0.3, 0.0, 1.0, 1.0, 0.3, 0.0, 1.0,  // x축 색상
        0.0, 1.0, 0.5, 1.0, 0.0, 1.0, 0.5, 1.0   // y축 색상
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, axesVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, axesColors, gl.STATIC_DRAW);
    shader.setAttribPointer("a_color", 4, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
}

function setupCubeBuffers(shader) {
    const cubeVertices = new Float32Array([
        -0.50,  0.50,  // 좌상단
        -0.50, -0.50,  // 좌하단
         0.50, -0.50,  // 우하단
         0.50,  0.50   // 우상단
    ]);

    const indices = new Uint16Array([
        0, 1, 2,    // 첫 번째 삼각형
        0, 2, 3     // 두 번째 삼각형
    ]);

    const cubeColors = new Float32Array([
        1.0, 0.0, 0.0, 1.0,  // 빨간색
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0,
        1.0, 0.0, 0.0, 1.0
    ]);

    cubeVAO = gl.createVertexArray();
    gl.bindVertexArray(cubeVAO);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
}

function getTransformMatrices() {
    const m_T = mat4.create();
    const m_R = mat4.create();
    const ms_R = mat4.create();
    const m_S = mat4.create();
        
    const e_T = mat4.create();
    const e_R = mat4.create();
    const es_R = mat4.create();
    const e_S = mat4.create();

    const s_R = mat4.create();
    const s_S = mat4.create();

    const M = mat4.create();
    
    mat4.translate(m_T, m_T, [0.2, 0.0, 0]);
    mat4.rotate(m_R, m_R, m_rotationAngle, [0, 0, 1]);
    mat4.rotate(ms_R, ms_R, ms_rotationAngle, [0, 0, 1]);
    mat4.scale(m_S, m_S, [0.05, 0.05, 1]);

    mat4.translate(e_T, e_T, [0.7, 0.0, 0]);
    mat4.rotate(e_R, e_R, e_rotationAngle, [0, 0, 1]);
    mat4.rotate(es_R, es_R, es_rotationAngle, [0, 0, 1]);
    mat4.scale(e_S, e_S, [0.1, 0.1, 1]);

    mat4.rotate(s_R, s_R, s_rotationAngle, [0, 0, 1]);
    mat4.scale(s_S, s_S, [0.2, 0.2, 1]);
    
    return { m_T, m_R, ms_R, m_S, e_T, e_R, es_R, e_S, s_R, s_S, M };
}

function applyTransform(type) {
    finalTransform = mat4.create();
    const { m_T, m_R, ms_R, m_S, e_T, e_R, es_R, e_S, s_R, s_S, M } = getTransformMatrices();
    
    const transformOrder = {
        'moon': [m_S, ms_R, m_T, m_R, e_T, e_R],
        'sun' : [s_S, s_R],
        'earth' : [e_S, es_R, e_T, e_R]
    };

    /*
      array.forEach(...) : array 각 element에 대해 반복
    */
    if (transformOrder[type]) {
        transformOrder[type].forEach(matrix => {
            mat4.multiply(finalTransform, matrix, finalTransform);
        });
    }
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    shader.use();

    // 축 그리기
    shader.setVec4('u_color', [1.0, 0.3, 0.0, 1.0]);
    shader.setMat4("u_transform", mat4.create());
    gl.bindVertexArray(axesVAO);
    gl.drawArrays(gl.LINES, 0, 2);

    shader.setVec4('u_color', [0.0, 1.0, 0.5, 1.0]);
    shader.setMat4('u_transform', mat4.create());
    gl.drawArrays(gl.LINES, 2, 4);

    // 정사각형 그리기
    const objects = ['sun', 'earth', 'moon'];
    objects.forEach(type => {
        applyTransform(type);

        shader.setVec4('u_color', colors[type]);
        shader.setMat4("u_transform", finalTransform);

        gl.bindVertexArray(cubeVAO);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    });
}

function animate(currentTime) {
    if (!lastTime) lastTime = currentTime;
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;



    if (isAnimating) {
        s_rotationAngle += Math.PI * 0.25 * deltaTime;

        e_rotationAngle += Math.PI / 6 * deltaTime;
        es_rotationAngle += Math.PI * deltaTime;

        m_rotationAngle += Math.PI * 2 * deltaTime;
        ms_rotationAngle += Math.PI * deltaTime;

        applyTransform(currentTransformType);
    }
    render();
    requestAnimationFrame(animate);
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    return new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }

        finalTransform = mat4.create();
        
        shader = await initShader();
        setupAxesBuffers(shader);
        setupCubeBuffers(shader);
        shader.use();
        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}
