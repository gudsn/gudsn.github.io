// 01-getting-started.js
// - import add-ons
// - default export vs named export
// - scene, background
// - camera, PerspectiveCamera
// - Setting a position
// - renderer: antialiasing, outputColorSpace, enabling shadowMap, shadowMap type, 
// - renderer: setting size, setting clearColor, append renderer to html document
// - stats object
// - orbitControls object: damping
// - GUI value input
// - resize event listener
// - AxesHelper
// - GridHelper
// - ambient light
// - directional light, how to change the target of directional light, casting shadow
// - Mesh = geometry + material
// - cubeGeometry, torusKnotGeometry, planeGeometry, casting shadows, receiving shadows
// - MeshLambertMaterial, MeshPhongMaterial
// - rotation transformation
// - requestAnimationFrame

// main three.module.js library
import * as THREE from 'three';  

// addons: OrbitControls (jsm/controls), Stats (jsm/libs), GUI (jsm/libs)
//
// module default export & import (library에서 export하는 것이 하나뿐인 경우):
//             export default function myFunction() { ... }
//             import myFunction from './myModule'; // 중괄호 없이 import
//
// module named export & import:
//             export myFunction() { ... };
//             export const myVariable = 42;
//             import { myFunction, myVariable } from './myModule'; // 중괄호 사용

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// main scene
const scene = new THREE.Scene();
scene.backgroundColor = 0x000000;  // white background
let usePerspective = true;

// Perspective camera: fov, aspect ratio, near, far
const percamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);

// set camera position: camera.position.set(-3, 8, 2) 가 더 많이 사용됨 (약간 빠름))
percamera.position.x = 0;
percamera.position.y = 30;
percamera.position.z = 100;
percamera.lookAt(0, 0, 0);

// add camera to the scene

const d = 70;
const aspect = window.innerWidth / window.innerHeight;

const othocamera = new THREE.OrthographicCamera(
  -d * aspect,  // left
   d * aspect,  // right
   d,           // top
  -d,           // bottom
  0.1,          // near
  1000          // far
);
othocamera.position.set(0, 30, 100);
othocamera.lookAt(0, 0, 0);

let cameraActivate = percamera;

scene.add(cameraActivate);
// setup the renderer
// antialias = true: 렌더링 결과가 부드러워짐
const renderer = new THREE.WebGLRenderer({ antialias: true });

// outputColorSpace의 종류
// sRGBColorSpace: 보통 monitor에서 보이는 color로, 어두운 부분을 약간 밝게 보이게 Gamma correction을 함
// sRGBColorSpace는 PBR (Physically Based Rendering), HDR(High Dynamic Range)에서는 필수적으로 사용함
// LinearColorSpace: 모든 색상을 선형으로 보이게 함
renderer.outputColorSpace = THREE.SRGBColorSpace;

//renderer.shadowMap.enabled = true; // scene에서 shadow를 보이게

// shadowMap의 종류
// BasicShadowMap: 가장 기본적인 shadow map, 쉽고 빠르지만 부드럽지 않음
// PCFShadowMap (default): Percentage-Closer Filtering, 주변의 색상을 평균내서 부드럽게 보이게 함
// PCFSoftShadowMap: 더 부드럽게 보이게 함
// VSMShadowMap: Variance Shadow Map, 더 자연스러운 블러 효과, GPU에서 더 많은 연산 필요
//renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// 현재 열린 browser window의 width와 height에 맞게 renderer의 size를 설정
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
// attach renderer to the body of the html page
document.body.appendChild(renderer.domElement);

// add Stats: 현재 FPS를 보여줌으로써 rendering 속도 표시
const stats = new Stats();
// attach Stats to the body of the html page
document.body.appendChild(stats.dom);

// add OrbitControls: arcball-like camera control
/*const orbitControls = new OrbitControls(cameraActivate, renderer.domElement);
orbitControls.enableDamping = true; // 관성효과, 바로 멈추지 않고 부드럽게 멈춤
orbitControls.dampingFactor = 0.05; // 감속 정도, 크면 더 빨리 감속, default = 0.05
*/

// add GUI: 간단한 user interface를 제작 가능
// 사용법은 https://lil-gui.georgealways.com/ 
// http://yoonbumtae.com/?p=942 참고

const gui = new GUI();

const camFolder = gui.addFolder('Camera');
const modepara = {mode : 'Perspective'};

const campara = { 
    switch: () =>{
        usePerspective = !usePerspective;
        cameraActivate = usePerspective ? percamera : othocamera;
        modepara.mode = usePerspective ? 'Perspective' : 'Othgrapic', 
        cameraActivate.lookAt(0, 0, 0);
        onResize();
    }
 };
camFolder.add(campara, 'switch').name('Switch Camera Type');
camFolder.add(modepara, 'mode').name('Current Camera').listen();

const mercuryFolder = gui.addFolder('Mercury'); 
const merparam = {
    rspeed: 0.02,
    ospeed: 0.02
};
mercuryFolder.add(merparam, 'rspeed', 0, 0.1, 0.001).name('Rotation Speed');
mercuryFolder.add(merparam, 'ospeed', 0, 0.1, 0.001).name('Orbit Speed');

const venusFolder = gui.addFolder('Venus'); 
const venusparam = {
    rspeed: 0.015,
    ospeed: 0.015
};
venusFolder.add(venusparam, 'rspeed', 0, 0.1, 0.001).name('Rotation Speed');
venusFolder.add(venusparam, 'ospeed', 0, 0.1, 0.001).name('Orbit Speed');

const earthFolder = gui.addFolder('Earth'); 
const earthparam = {
    rspeed: 0.01,
    ospeed: 0.01
};
earthFolder.add(earthparam, 'rspeed', 0, 0.1, 0.001).name('Rotation Speed');
earthFolder.add(earthparam, 'ospeed', 0, 0.1, 0.001).name('Orbit Speed');

const marsFolder = gui.addFolder('Mars'); 
const marsparam = {
    rspeed: 0.008,
    ospeed: 0.008
};
marsFolder.add(marsparam, 'rspeed', 0, 0.1, 0.001).name('Rotation Speed');
marsFolder.add(marsparam, 'ospeed', 0, 0.1, 0.001).name('Orbit Speed');




// listen to the resize events
window.addEventListener('resize', onResize, false);
function onResize() { // resize handler
    cameraActivate.aspect = window.innerWidth / window.innerHeight;
    cameraActivate.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// add directional light
const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(0, 10, 150); // 여기서 부터 (0, 0, 0) 방향으로 light ray 방향
scene.add(dirLight);

/*----- Directional light의 target 위치 바꾸기 ----------------------

  // Default target 위치는 (0, 0, 0)임

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 10, 10); // 광원이 있는 위치

  // Target Object 생성 (dummy object), Mesh는 Object3D의 subclass
  const targetObject = new THREE.Object3D();
  targetObject.position.set(5, 0, 0); // Target's position
  scene.add(targetObject);

  // Light의 Target 지정
  light.target = targetObject;
  scene.add(light);
-----------------------------------------------------------------*/

// create a cube and add it to the scene
// BoxGeometry: width, height, depth의 default는 1
//            : default center position = (0, 0, 0)

let mercuryOrbit = 0;
let venusOrbit = 0;
let earthOrbit = 0;
let marsOrbit = 0;

const sunGeometry = new THREE.SphereGeometry(10);
const sunMaterial = new THREE.MeshBasicMaterial({color: 0xffff00});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

const textureLoader = new THREE.TextureLoader()

const mercuryGeometry = new THREE.SphereGeometry(1.5);
const mercuryTexture = textureLoader.load('Mercury.jpg');
const mercuryMaterial = new THREE.MeshStandardMaterial({
    //color: 0xa6a6a6,
    map: mercuryTexture,
    roughness: 0.8,
    metalness: 0.2
});
const mercury = new THREE.Mesh(mercuryGeometry, mercuryMaterial);
mercury.rotation.y = 0.002;
mercury.position.x = 30;
mercury.position.y = 0;
mercury.position.z = 0;
scene.add(mercury);


const venusGeometry = new THREE.SphereGeometry(3);
const venusTexture = textureLoader.load('Venus.jpg');
const venusMaterial = new THREE.MeshStandardMaterial({
    //color: 0xe39e1c,
    map: venusTexture,
    roughness: 0.8,
    metalness: 0.2
});
const venus = new THREE.Mesh(venusGeometry, venusMaterial);
venus.rotation.y = 0.015;
venus.position.x = 45;
venus.position.y = 0;
venus.position.z = 0;
scene.add(venus);

const earthGeometry = new THREE.SphereGeometry(3.5);
const earthTexture = textureLoader.load('Earth.jpg');
const earthMaterial = new THREE.MeshStandardMaterial({
    //color: 0x3498db,
    map: earthTexture,
    roughness: 0.8,
    metalness: 0.2
});
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
earth.rotation.y = 0.01;
earth.position.x = 60;
earth.position.y = 0;
earth.position.z = 0;
scene.add(earth);

const marsGeometry = new THREE.SphereGeometry(2.5);
const marsTexture = textureLoader.load('Mars.jpg');
const marsMaterial = new THREE.MeshStandardMaterial({
    //color: 0xc0382b,
    map: marsTexture,
    roughness: 0.8,
    metalness: 0.2
});
const mars = new THREE.Mesh(marsGeometry, marsMaterial);
mars.rotation.y = 0.008;
mars.position.x = 75;
mars.position.y = 0;
mars.position.z = 0;
scene.add(mars);



let step = 0;

function animate() {

    // stats와 orbitControls는 매 frame마다 update 해줘야 함
    stats.update();
    //orbitControls.update();

    step += 0.02;

    mercuryOrbit += merparam.ospeed;
    mercury.rotation.y += merparam.rspeed;
    mercury.position.x = Math.cos(mercuryOrbit) * 30;
    mercury.position.z = Math.sin(mercuryOrbit) * 30;

    venusOrbit += venusparam.ospeed;
    venus.rotation.y += venusparam.rspeed;
    venus.position.x = Math.cos(venusOrbit) * 45;
    venus.position.z = Math.sin(venusOrbit) * 45;

    earthOrbit += earthparam.ospeed;
    earth.rotation.y += earthparam.rspeed;
    earth.position.x = Math.cos(earthOrbit) * 60;
    earth.position.z = Math.sin(earthOrbit) * 60;

    marsOrbit += marsparam.ospeed;
    mars.rotation.y += marsparam.rspeed;
    mars.position.x = Math.cos(marsOrbit) * 75;
    mars.position.z = Math.sin(marsOrbit) * 75;
    

    // 모든 transformation 적용 후, renderer에 렌더링을 한번 해 줘야 함
    renderer.render(scene, cameraActivate);

    // 다음 frame을 위해 requestAnimationFrame 호출 
    requestAnimationFrame(animate);
}

animate();






