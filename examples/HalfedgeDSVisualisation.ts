import {GUI} from 'dat.gui';
import { AmbientLight, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, 
  LineBasicMaterial, LineSegments, Mesh, MeshPhongMaterial, PerspectiveCamera, 
  PointLight, Scene, Triangle, Vector3, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {HalfedgeDS} from '../src/index';
import {debounce} from 'throttle-debounce';
import { removeTrianglesFromGeometry, setupMeshGeometry, Shape } from './utils';

const struct = new HalfedgeDS();

const params = {
  shape: Shape.Sphere,
  holes: 0,
}

const bgColor = 0x555555;

// Init renderer
const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(bgColor, 1);
document.body.appendChild(renderer.domElement);

// Init scene
const scene = new Scene();
scene.add(new AmbientLight(0xffffff, 0.8));

// Init camera
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50);
camera.position.set(3, 3, 3);
camera.far = 100;
camera.updateProjectionMatrix();

// Init camera light
const camLight = new PointLight(0xffffff, 0.5);
camera.add(camLight);
camLight.position.set(0.5, 1, 0);
scene.add(camera);

// Init gui
const gui = new GUI();
gui.add(params, 'shape', Shape).onChange(shapeChanged);
const holesGUI = gui.add(params, 'holes', 0, 5, 1).onFinishChange(build);
gui.add({'rebuild':build}, 'rebuild');
gui.open();

// Init controls
const orbitControls = new OrbitControls(camera, renderer.domElement);

orbitControls.addEventListener('change', onOrbitChanged);

window.addEventListener('resize', function () {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  render();

}, false);

// Init mesh
const meshMaterial = new MeshPhongMaterial({
  color: 0x777777,
  flatShading: true,
  side: DoubleSide,
});
const mesh = new Mesh(new BufferGeometry(), meshMaterial);
scene.add(mesh);

// Init half edges visualizations
const structMaterial = new LineBasicMaterial({
  depthTest: true,
  depthWrite: false,
  side: DoubleSide,
  vertexColors: true,
});

const lines = new LineSegments(new BufferGeometry(), structMaterial);
scene.add(lines);

// Init HalfEdge Structure

function updateLinesGeometry() {

  const tri = new Triangle();
  const normal = new Vector3();
  const dir = new Vector3();
  const pos = new Vector3();
  const arrowHeadLDir = new Vector3();
  const arrowHeadRDir = new Vector3();
  const cross = new Vector3();
  const vertices = new Array<number>();
  const colors = new Array<number>();
  const tip = new Vector3();

  const arrowSize = 0.015;
  const crossGapFactor = 0.03;
  const dirGapFactor = 0.15;
  const normalGapFactor = 0.01
  const c = new Color();

  const loops = struct.loops();

  for (const loophe of loops) {

    c.setHex(Math.random()*0xFFFFFF);

    for (const halfedge of loophe.nextLoop()) {

      const start = halfedge.vertex.position;
      const end = halfedge.twin.vertex.position;
      const face = halfedge.face ?? halfedge.twin.face;

      if (face) {
        face.getNormal(normal);
      } else {
        tri.set(halfedge.vertex.position,
          halfedge.next.vertex.position,
          halfedge.prev.vertex.position)
        tri.getNormal(normal);  
      }

      dir.subVectors(end, start);
      cross.crossVectors(normal, dir)

      dir.multiplyScalar(dirGapFactor);
      normal.multiplyScalar(normalGapFactor);
      cross.multiplyScalar(crossGapFactor);


      // start
      pos.copy(start).add(normal).add(cross).add(dir);
      vertices.push(pos.x, pos.y, pos.z);

      // end
      tip.copy(end).add(normal).add(cross).sub(dir);
      vertices.push(tip.x, tip.y, tip.z);


      dir.normalize();
      cross.normalize();
      arrowHeadLDir.set(0,0,0).add(cross).sub(dir).normalize();
      arrowHeadRDir.set(0,0,0).sub(cross).sub(dir).normalize();
      arrowHeadLDir.multiplyScalar(arrowSize);
      arrowHeadRDir.multiplyScalar(arrowSize);

      // arrow head left
      vertices.push(tip.x, tip.y, tip.z);
      pos.copy(tip).add(arrowHeadLDir);
      vertices.push(pos.x, pos.y, pos.z);

      // arrow head right
      vertices.push(tip.x, tip.y, tip.z);
      pos.copy(tip).add(arrowHeadRDir);
      vertices.push(pos.x, pos.y, pos.z);

  
      colors.push(c.r, c.g, c.b);
      colors.push(c.r, c.g, c.b);
      colors.push(c.r, c.g, c.b);
      colors.push(c.r, c.g, c.b);
      colors.push(c.r, c.g, c.b);
      colors.push(c.r, c.g, c.b);
    }
  }

  lines.geometry.dispose();
  lines.geometry = new BufferGeometry();
  lines.geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  lines.geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));

}

function onOrbitChanged() {
  render();
}

function updateHolesGui() {
  const index = mesh.geometry.getIndex();
  const position = mesh.geometry.getAttribute('position');
  const nbOfFaces = index ? index.count/3 : position.count/3;
  holesGUI.max(nbOfFaces/3);
  params.holes = Math.min(params.holes, nbOfFaces/3);
  holesGUI.setValue(params.holes);
}

function shapeChanged() {
  setupMeshGeometry(mesh, params.shape);
  updateHolesGui();
  build();
}


const debounceBuild = debounce(200, () => {
  setupMeshGeometry(mesh, params.shape);
  removeTrianglesFromGeometry(mesh.geometry, params.holes);
  struct.clear();
  const startTime = performance.now();
  struct.buildFromGeometry(mesh.geometry);
  const endTime = performance.now();
  updateLinesGeometry();
  updateInfo(endTime - startTime);
  render();
});

function build() {
  debounceBuild();
}

function updateInfo(delta: number) {
  const info = document.getElementById('infoDiv');
  if (info) {
    info.innerHTML = `HalfEdgeDS [build ${delta.toFixed(0)}ms]`;
    info.innerHTML += `<br>${struct.faces.size} faces`;
    info.innerHTML += `<br>${struct.loops().length} loops`;
    info.innerHTML += `<br>${struct.halfedges.size/2} edges`;
    info.innerHTML += `<br>${struct.halfedges.size} halfedges`;
    info.innerHTML += `<br>${struct.vertices.size} vertices`;
  }
}

function render() {
  gui.updateDisplay();
  renderer.render(scene, camera);
}

shapeChanged();