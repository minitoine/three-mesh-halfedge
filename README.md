# three-mesh-halfedge

[![build](https://img.shields.io/github/workflow/status/LokiResearch/three-svg-renderer/build)](https://img.shields.io/github/workflow/status/LokiResearch/three-svg-renderer/build)
[![npm release](https://img.shields.io/npm/v/three-mesh-halfedge)](https://img.shields.io/npm/v/three-mesh-halfedge)
[![GitHub release](https://img.shields.io/github/v/release/LokiResearch/three-mesh-halfedge)](https://img.shields.io/github/v/release/LokiResearch/three-mesh-halfedge)
[![License](https://img.shields.io/badge/License-MIT-green)](#license)

A typescript implementation of the Halfedge structure for three.js geometries.

Supports multiple topologies:
- Multiple edges between the same vertices
- Isolated polygons
- Isolated edges
- Isolated vertices
- Mixed wireframe and polygons
- Polygons with an arbitrary number of vertices and edges
- Polygons meeting only at one vertex

## Examples

- [HalfedgeDS Visualisation](https://LokiResearch.github.io/three-mesh-halfedge/build-examples/HalfedgeDSVisualisation.html)
- [Realtime contours extraction](https://LokiResearch.github.io/three-mesh-halfedge/build-examples/ExtractContours.html)

## Documentation

[![Documentation](https://img.shields.io/badge/view-Documentation-blue?label=Open)](https://LokiResearch.github.io/three-mesh-halfedge/doc/index.html)

*Documentation is in progress.*

## Code snippets

##### Example 1: Build the Halfedge structure
```ts
import * as THREE from 'three';
import { HalfedgeDS } from 'three-mesh-halfedge';

// Build the Halfedge structure from a BoxGeometry
const geometry = new THREE.BoxGeometry();
const struct = new HalfedgeDS({
	tolerance: 1e-10,
});
struct.buildFromGeometry(geometry);
```

##### Example 2: Extract the boundary halfedges of a mesh
```ts
const struct = new HalfedgeDS();
struct.buildFromGeometry(mesh.geometry);

// Get the boundary edges (keep only one halfedge for each pair)
const boundaries = new Set<Halfedge>();
for (const halfedge of struct.halfedges) {
	if (!boundaries.has(halfedge.twin) && !halfedge.face) {
		boundaries.add(halfedge);
	}
}
console.log("Boundary halfedges", boundaries);
```


##### Example 3: Get the front faces of a mesh
```ts
const struct = new HalfedgeDS();
struct.buildFromGeometry(mesh.geometry);

// Get the camera position in mesh's space
const localCameraPos = mesh.worldToLocal(camera.position.clone());

//  Get the front faces
const array = [];
for (const face of struct.faces) {
	// /!\ Danger: vertices position are in geometry local system
	if (face.isFront(localCameraPos)) { 
		array.push(face);
	}
}
console.log("Front faces", array);
```
## Useful links and references

[Kalle Rutanen Homepage - Halfedge data structures](https://kaba.hilvi.org/homepage/blog/halfedge/halfedge.htm)


