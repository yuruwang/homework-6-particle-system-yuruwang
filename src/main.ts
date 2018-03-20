import {vec2, vec3, vec4} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import Particle from './particle';
import Mesh from './mesh';
import mesh from './mesh';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const PI = 3.14159;
let crowMesh = loadObj('./src/obj/carMaya.obj');
let crow = new Mesh(crowMesh);

//---------------------
let maxForce = 10;
let forceRadius = 100;
let slowdownRadius = 10;
let force = vec3.fromValues(0, 0, 0);
let forceDir = vec3.fromValues(0, 0, 0);
let dist = vec3.fromValues(0, 0, 0);
//--------------------


const controls = {
  mesh: ['crow', 'sphere'],
  cameraControl: ['on', 'off'],
};

let square: Square;
let time: number = 0.0;
let particels: Array<Particle>;
let offsetsArray: Array<number>;
let colorsArray: Array<number>;
let n = 50;

let mousePos = vec2.fromValues(0, 0);
let mousedown: boolean;
let forceP = vec3.fromValues(50, 50, 0);
let selectedMesh: Mesh;
let cameraActive = true;
let dragActive = true;

function loadScene() {
  // creat square drawable
  square = new Square();
  square.create();

  particels = new Array<Particle>();
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      // let mass = Math.random() * 100 + 10000;\
      let mass = Math.random() * 10;
      let particle = new Particle(mass, vec3.fromValues(i, j, 0), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 0, 0), vec4.fromValues(i / n, j / n, 0, 1));
      particels.push(particle);
    }
    
  }
  
}

// function updateScene(deltaT: number) {
//   // might be slow??
//   offsetsArray = new Array<number>();
//   colorsArray = new Array<number>();


//   for (let i = 0; i < particels.length; i++) {
//     let particle = particels[i];

//     if (selectedMesh == null) {
//       // forceP = vec3.fromValues(25, 25, 0);
//     } else {
//       let vertNum = selectedMesh.vertList.length;

//       if (i < vertNum) {
//         forceP = selectedMesh.vertList[i];
//       } else {
//         forceP = vec3.fromValues(25, 25, 0);
//       }
//     }


//     vec3.subtract(dist, forceP, particle.pos);
//     vec3.normalize(forceDir, dist);

//     // force become stronger when particle close to the force point
//     if (vec3.length(dist) < forceRadius) {
//       vec3.scale(force, forceDir, maxForce * (1 - vec3.length(dist) / forceRadius));
//     } else {
//       vec3.scale(force, forceDir, 0.1);
//     }
    


//     // update particle position based on the force
//     if (mousedown) {
//       // if the particle is very close to the force point, stop moving
//       if (vec3.length(dist) < slowdownRadius) {
//         particle.slowdown(vec3.length(dist) / slowdownRadius, deltaT);
      
//       } else {
//         particle.update(forceDir, deltaT);
//       }

//     }


//     offsetsArray.push(particle.pos[0]);
//     offsetsArray.push(particle.pos[1]);
//     offsetsArray.push(particle.pos[2]);

//     colorsArray.push(particle.col[0]);
//     colorsArray.push(particle.col[1]);
//     colorsArray.push(particle.col[2]);
//     colorsArray.push(particle.col[3]);

//     let offsets: Float32Array = new Float32Array(offsetsArray);
//     let colors: Float32Array = new Float32Array(colorsArray);
//     square.setInstanceVBOs(offsets, colors);
//     square.setNumInstances(n * n);

//   }
// }

function updateScene(deltaT: number) {
  // might be slow??
  offsetsArray = new Array<number>();
  colorsArray = new Array<number>();


  for (let i = 0; i < particels.length; i++) {
    let particle = particels[i];

    particle.update(vec3.fromValues(0, 0, 0), deltaT);


    offsetsArray.push(particle.pos[0]);
    offsetsArray.push(particle.pos[1]);
    offsetsArray.push(particle.pos[2]);

    colorsArray.push(particle.col[0]);
    colorsArray.push(particle.col[1]);
    colorsArray.push(particle.col[2]);
    colorsArray.push(particle.col[3]);

    let offsets: Float32Array = new Float32Array(offsetsArray);
    let colors: Float32Array = new Float32Array(colorsArray);
    square.setInstanceVBOs(offsets, colors);
    square.setNumInstances(n * n);

  }
}


function loadObj(dir: string): any {
  let OBJ = require('webgl-obj-loader');

  let data = readTextFile(dir);
  let mesh = new OBJ.Mesh(data);

  return mesh;
}

function readTextFile(dir: string) : string
{
  var allText
  var rawFile = new XMLHttpRequest();
  rawFile.open("GET", dir, false);
  rawFile.onreadystatechange = function ()
  {
      if(rawFile.readyState === 4)
      {
          if(rawFile.status === 200 || rawFile.status == 0)
          {
              allText = rawFile.responseText;
              return allText;
          }
      }
  }
  rawFile.send(null);
  return allText;
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();

  var meshControl = gui.add(controls, 'mesh', ['none', 'crow', 'sphere']);
  var cameraControl = gui.add(controls, 'cameraControl', ['on', 'off']);

  meshControl.onChange(function(value: string) {
    if (value === "none") {
      selectedMesh = null;
    } else if (value === "crow") {
      selectedMesh = crow;
    } else if (value === "sphere") {

    }

  });

  cameraControl.onChange(function(value: string) {
    if (value === "on") {
      cameraActive = true;
    } else if (value === "off") {
      cameraActive = false;
      console.log("off");
    } 

  });

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 0), vec3.fromValues(25, 25, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE); // Additive blending

  // const lambert = new ShaderProgram([
  //   new Shader(gl.VERTEX_SHADER, require('./shaders/particle-vert.glsl')),
  //   new Shader(gl.FRAGMENT_SHADER, require('./shaders/particle-frag.glsl')),
  // ]);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/custom-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/custom-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {

    camera.update();

    stats.begin();
    lambert.setTime(time++);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();


    updateScene(1);


    renderer.render(camera, lambert, [
      square,
    ]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  canvas.addEventListener("mousemove", function(event: any) {
    mousePos[0] = event.clientX;
    mousePos[1] = canvas.height - event.clientY;

  });

  canvas.addEventListener("mousedown", function(event: any) {
    mousedown = true;

    if (event.button === 0) {
      cameraActive = true;
      dragActive = false;
    } else if (event.button === 2) {
      cameraActive = false;
      dragActive = true;
    }

    mousePos[0] = event.clientX;
    mousePos[1] = canvas.height - event.clientY;
    calculateForceP();
  });


  canvas.addEventListener("mouseup", function(event: any) {
    mousedown = false;

    if (event.button === 0) {
      cameraActive = true;
      dragActive = false;
    } else if (event.button === 2) {
      cameraActive = false;
      dragActive = true;
    }

    // calculateForceP();
 
  })

  function calculateForceP() {
    console.log("canvas.width, height = " + canvas.width + "," + canvas.height);
    console.log("mouse. x, y = " + mousePos[0] + "," + mousePos[1]);

    let ndc = vec2.fromValues(mousePos[0] / canvas.width, mousePos[1] / canvas.height);
    ndc[0] = ndc[0] * 2 - 1;
    ndc[1] = ndc[1] * 2 - 1;

    let lenV = vec3.fromValues(0, 0, 0);
    vec3.subtract(lenV, camera.target, camera.position);
    let len = vec3.length(lenV);
    let alpha = camera.fovy / 2;
    let V = vec3.fromValues(0, 0, 0);
    let H = vec3.fromValues(0, 0, 0);
    vec3.scale(V, camera.up, len * Math.tan(alpha));
    vec3.scale(H, camera.right, len * Math.tan(alpha) * camera.aspectRatio);

    let h = vec3.fromValues(0, 0, 0);
    let v = vec3.fromValues(0, 0, 0);
    forceP = vec3.add(forceP, camera.target, vec3.scale(h, H, ndc[0]));
    forceP = vec3.add(forceP, forceP, vec3.scale(v, V, ndc[1]));
  } 

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
