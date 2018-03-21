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

let dogMesh = loadObj('./src/obj/dogMaya.obj');
let catMesh = loadObj('./src/obj/catMaya.obj');
let deerMesh = loadObj('./src/obj/deerMaya.obj');
let cowMesh = loadObj('./src/obj/cowMaya.obj');
let dog = new Mesh(dogMesh);
let cat = new Mesh(catMesh);
let deer = new Mesh(deerMesh);
let cow = new Mesh(cowMesh);

//---------------------
let maxForce = 10;
let forceRadius = 100;
let slowdownRadius = 2;
let force = vec3.fromValues(0, 0, 0);
let forceDir = vec3.fromValues(0, 0, 0);
let dist = vec3.fromValues(0, 0, 0);
//--------------------


const controls = {
  mesh: ['dog', 'cat', 'deer', 'cow'],
  particles: 40,
  mass: 10,
};

let square: Square;
let time: number = 0.0;
let particels: Array<Particle>;
let offsetsArray: Array<number>;
let colorsArray: Array<number>;
let n = 40;
let mass = 10;

let mousePos = vec2.fromValues(0, 0);
let mousedown: boolean;
let forceP = vec3.fromValues(0, 0, 0);
let selectedMesh: Mesh;
let cameraActive = true;
let dragActive = false;
let repel = false;
let repelCount = 100;
let cameraStat = new Camera(vec3.fromValues(0, 0, 0), vec3.fromValues(0, 0, 0));

function loadScene() {
  // creat square drawable
  square = new Square();
  square.create();

  particels = new Array<Particle>();
  for (let i = -n / 2; i < n / 2; i++) {
    for (let j = -n / 2; j < n / 2; j++) {
      let particelMass = mass;
      let particle = new Particle(particelMass, vec3.fromValues(i, j, 0), vec3.fromValues(0, 0, 0), vec3.fromValues(0, 0, 0), vec4.fromValues(i / n, j / n, 0, 1));
      particels.push(particle);
    }
    
  }
  
}

function updateScene(deltaT: number) {
  // might be slow??
  offsetsArray = new Array<number>();
  colorsArray = new Array<number>();


  for (let i = 0; i < particels.length; i++) {
    let particle = particels[i];

    if (selectedMesh == null) {
      // forceP = vec3.fromValues(25, 25, 0);
      slowdownRadius = 5;
    } else {
      slowdownRadius = 2;

      let vertNum = selectedMesh.vertList.length;

      if (i < vertNum) {
        forceP = selectedMesh.vertList[i];
      } else {
        forceP = vec3.fromValues(0, 0, 0);
      }
      // forceP = selectedMesh.vertList[i % vertNum];
    }


    vec3.subtract(dist, forceP, particle.pos);
    vec3.normalize(forceDir, dist);


    // force become stronger when particle close to the force point
    if (vec3.length(dist) < forceRadius) {
      vec3.scale(force, forceDir, maxForce * (1 - vec3.length(dist) / forceRadius));
    } else {
      vec3.scale(force, forceDir, 0.1);
    }

    


    if (vec3.length(dist) < slowdownRadius) {
      if (repel && repelCount > 0) {
        // repel
        vec3.subtract(dist, particle.pos, forceP);
        vec3.normalize(forceDir, dist);

        if (vec3.length(dist) > forceRadius) {
          force = vec3.fromValues(0, 0, 0);
        } else {
          vec3.scale(force, forceDir, 10);
        }

        particle.update(force, deltaT);
      } else {
        particle.slowdown(0.001 * vec3.length(dist) / slowdownRadius, deltaT); 
      }
      
    } else {
      particle.update(forceDir, deltaT);
    }

    if (vec3.length(particle.vel) > 3) {
      particle.slowdown(0.0001, deltaT);
    }



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

  var meshControl = gui.add(controls, 'mesh', ['none', 'dog', 'cat', 'deer', 'cow']);
  var particleControl = gui.add(controls, 'particles', 10, 50);
  var massControl = gui.add(controls, 'mass', 1, 10);

  meshControl.onChange(function(value: string) {
    if (value === "none") {
      selectedMesh = null;
    } else if (value === "dog") {
      resetVel();
      selectedMesh = dog;
    } else if (value === "cat") {
      resetVel();
      selectedMesh = cat;
    } else if (value === "deer") {
      resetVel();
      selectedMesh = deer;
    } else if (value === "cow") {
      resetVel();
      selectedMesh = cow;
    }


  });


  particleControl.onChange(function(value: number) {
    n = value;
    loadScene();

  });

  massControl.onChange(function(value: number) {
    mass = value;
    loadScene();

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

  const camera = new Camera(vec3.fromValues(0, 0, 50), vec3.fromValues(0, 0, 0));

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
    if (repel) {
      repelCount--;
    }

    if (cameraActive) {
      // retrive camera attr
      camera.update();
    }
    

  

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

    // if (dragActive) {
    //   calculateForceP();
    // }

  });

  canvas.addEventListener("mousedown", function(event: any) {
    mousedown = true;

    if (event.button === 0) {
      cameraActive = true;
      dragActive = false;
    } else if (event.button === 2) {
      cameraActive = false;
      dragActive = true;
      repel = false;
      calculateForceP();
    }

    mousePos[0] = event.clientX;
    mousePos[1] = canvas.height - event.clientY;

  });


  canvas.addEventListener("mouseup", function(event: any) {
    mousedown = false;

    if (event.button === 0) {
      cameraActive = true;
      dragActive = false;
    } else if (event.button === 2) {
      cameraActive = true;
      dragActive = false;
      repel = true;
      repelCount = 100;
    }

    // calculateForceP();
 
  })

  function calculateForceP() {

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

  function resetVel() {
    particels.forEach(function(particle: Particle) {
      particle.stopMoving();
    });
  }

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
