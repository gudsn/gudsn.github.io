import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let isInitialized = false;
let shader;
let vao;
let positionBuffer;
let isDrawing = false;
let startPoint = null;
let tempEndPoint = null;
let shapes = {
    circle: null,
    line: null
};
let intersectionPoints = [];
let textOverlays = [];
let axes = new Axes(gl, 0.85);

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) return;
    main().then(success => {
        if (success) isInitialized = true;
    }).catch(console.error);
});

function initWebGL() {
    if (!gl) {
        alert('WebGL 2를 지원하지 않는 브라우저입니다.');
        return false;
    }

    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.2, 0.3, 1.0);
    return true;
}

function setupBuffers() {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    shader.setAttribPointer('a_position', 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
}

function convertToWebGLCoordinates(x, y) {
    return [
        (x / canvas.width) * 2 - 1,
        -((y / canvas.height) * 2 - 1)
    ];
}

function calculateIntersections() {
    intersectionPoints = [];
    if (!shapes.circle || !shapes.line) return;

    const [x1, y1] = shapes.line.start;
    const [x2, y2] = shapes.line.end;
    const [cx, cy] = shapes.circle.center;
    const r = shapes.circle.radius;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const a = dx * dx + dy * dy;
    const b = 2 * (dx * (x1 - cx) + dy * (y1 - cy));
    const c = (x1 - cx) * (x1 - cx) + (y1 - cy) * (y1 - cy) - r * r;
    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) return;

    const sqrtDisc = Math.sqrt(discriminant);
    const t1 = (-b + sqrtDisc) / (2 * a);
    const t2 = (-b - sqrtDisc) / (2 * a);

    [t1, t2].forEach(t => {
        if (t >= 0 && t <= 1) {
            const x = x1 + t * dx;
            const y = y1 + t * dy;
            intersectionPoints.push([x, y]);
        }
    });
}

function setupMouseEvents() {
    canvas.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const pos = convertToWebGLCoordinates(e.clientX - rect.left, e.clientY - rect.top);
        
        if (!shapes.circle) {
            startPoint = pos;
            isDrawing = true;
        } else if (!shapes.line) {
            startPoint = pos;
            isDrawing = true;
        }
    });

    canvas.addEventListener("mousemove", (e) => {
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        tempEndPoint = convertToWebGLCoordinates(e.clientX - rect.left, e.clientY - rect.top);
        render();
    });

    canvas.addEventListener("mouseup", () => {
        if (!isDrawing || !tempEndPoint) return;
        
        if (!shapes.circle) {
            const dx = tempEndPoint[0] - startPoint[0];
            const dy = tempEndPoint[1] - startPoint[1];
            const radius = Math.sqrt(dx * dx + dy * dy);
            shapes.circle = { center: startPoint, radius };
            
            // 원 정보만 표시
            updateText(textOverlays[0], 
                `Circle: center (${startPoint[0].toFixed(2)}, ${startPoint[1].toFixed(2)}) radius = ${radius.toFixed(2)}`);
            updateText(textOverlays[1], "");
            updateText(textOverlays[2], "");
        } else if (!shapes.line) {
            shapes.line = { start: startPoint, end: tempEndPoint };
            
            // 원과 선분 정보 표시
            updateText(textOverlays[0], 
                `Circle: center (${shapes.circle.center[0].toFixed(2)}, ${shapes.circle.center[1].toFixed(2)}) radius = ${shapes.circle.radius.toFixed(2)}`);
            updateText(textOverlays[1], 
                `Line segment: (${startPoint[0].toFixed(2)}, ${startPoint[1].toFixed(2)}) ~ (${tempEndPoint[0].toFixed(2)}, ${tempEndPoint[1].toFixed(2)})`);
            
            calculateIntersections();
            
            // 교점 정보 표시
            if (intersectionPoints.length > 0) {
                let msg = `Intersection Points: ${intersectionPoints.length} `;
                intersectionPoints.forEach((pt, i) => {
                    msg += `Point ${i+1}: (${pt[0].toFixed(2)}, ${pt[1].toFixed(2)}) `;
                });
                updateText(textOverlays[2], msg);
            } else {
                updateText(textOverlays[2], "No intersection");
            }
        }

        isDrawing = false;
        startPoint = null;
        tempEndPoint = null;
        render();
    });
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    shader.use();

    // 원 그리기
    if (shapes.circle) {
        const circle = shapes.circle;
        const segments = 100;
        const vertices = [];
        
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            vertices.push(
                circle.center[0] + circle.radius * Math.cos(angle),
                circle.center[1] + circle.radius * Math.sin(angle)
            );
        }

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        shader.setVec4("u_color", [1.0, 1.0, 0.0, 1.0]);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINE_LOOP, 0, segments);
    }

    // 선분 그리기
    if (shapes.line) {
        const lineVertices = [...shapes.line.start, ...shapes.line.end];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineVertices), gl.STATIC_DRAW);
        shader.setVec4("u_color", [1.0, 0.0, 0.0, 1.0]);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.LINES, 0, 2);
    }

    // 임시 도형 그리기
    if (isDrawing && startPoint && tempEndPoint) {
        if (!shapes.circle) {
            const dx = tempEndPoint[0] - startPoint[0];
            const dy = tempEndPoint[1] - startPoint[1];
            const radius = Math.sqrt(dx * dx + dy * dy);
            const segments = 100;
            const vertices = [];
            
            for (let i = 0; i < segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                vertices.push(
                    startPoint[0] + radius * Math.cos(angle),
                    startPoint[1] + radius * Math.sin(angle)
                );
            }

            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            shader.setVec4("u_color", [0.7, 0.7, 0.7, 1.0]);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.LINE_LOOP, 0, segments);
        } else {
            const lineVertices = [...startPoint, ...tempEndPoint];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineVertices), gl.STATIC_DRAW);
            shader.setVec4("u_color", [0.7, 0.7, 0.7, 1.0]);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.LINES, 0, 2);
        }
    }

    // 교점 그리기
    if (intersectionPoints.length > 0) {
        const points = intersectionPoints.flat();
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
        shader.setVec4("u_color", [0.0, 1.0, 1.0, 1.0]);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.POINTS, 0, intersectionPoints.length);
    }

    axes.draw(mat4.create(), mat4.create());
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
    if (!initWebGL()) return false;

    await initShader();
    setupBuffers();
    shader.use();

    // 초기에는 빈 텍스트로 설정
    textOverlays = [
        setupText(canvas, "", 1),
        setupText(canvas, "", 2),
        setupText(canvas, "", 3)
    ];

    setupMouseEvents();
    render();
    return true;
}