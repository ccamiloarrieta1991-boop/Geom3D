/* ============================================================
   geometry/nets.js
   PLEGADO DEL DESARROLLO PLANO → SÓLIDO

   Cada cara es una malla independiente colgada de un "grupo
   bisagra" colocado sobre la arista de la base. Plegar consiste
   en girar cada bisagra alrededor de su propio eje X local,
   desde 0 (desarrollo completamente extendido) hasta el ángulo
   diedro del sólido. Así el plegado es geometría real, no una
   animación pregrabada: si el estudiante cambia una dimensión,
   el desarrollo y el plegado cambian con ella.

   Convención del marco de la bisagra:
     +X local  → a lo largo de la arista
     +Z local  → hacia afuera (alejándose del centro de la base)
     girar rotation.x = −α  levanta la cara hacia +Y
   ============================================================ */

const NET_FACE_COLORS = {
  base: 0x17bfa8,      // teal
  lateral: 0xf5a524,   // ámbar
  tapa: 0x2fb7ff,      // azul
};

/** Vértices 2D [x, z] de la base del sólido, en el plano XZ. */
function baseOutline(solidDef, dims) {
  if (solidDef.baseShape === 'rectangular') {
    const { largo: L, ancho: W } = dims;
    return [[-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2]];
  }
  const n = solidDef.n;
  const lado = dims.lado !== undefined ? dims.lado : dims.arista;
  const R = circunradioRegular(lado, n);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const ang = -Math.PI / 2 + i * ((2 * Math.PI) / n);
    pts.push([R * Math.cos(ang), R * Math.sin(ang)]);
  }
  return pts;
}

/** Malla poligonal plana en el plano XZ a partir de puntos [x, z]. */
function polygonMesh(points2D, color, opacity) {
  const shape = new THREE.Shape();
  shape.moveTo(points2D[0][0], points2D[0][1]);
  for (let i = 1; i < points2D.length; i++) shape.lineTo(points2D[i][0], points2D[i][1]);
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape);
  geo.rotateX(Math.PI / 2); // (x, y) -> (x, 0, y)
  return withOutline(new THREE.Mesh(geo, faceMaterial(color, opacity)));
}

/** Añade el contorno de la cara para que se vea dónde va cada pliegue. */
function withOutline(mesh, color) {
  const line = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry, 1),
    new THREE.LineBasicMaterial({ color: color || 0x0a121f })
  );
  mesh.add(line);
  return mesh;
}

function faceMaterial(color, opacity) {
  return new THREE.MeshStandardMaterial({
    color, side: THREE.DoubleSide, transparent: true,
    opacity: opacity === undefined ? 1 : opacity,
    metalness: 0.1, roughness: 0.55,
  });
}

/** Rectángulo tumbado en XZ, ancho `w` centrado en X, extendido de z=0 a z=d. */
function rectFaceMesh(w, d, color) {
  const geo = new THREE.PlaneGeometry(w, d);
  geo.rotateX(Math.PI / 2);
  geo.translate(0, 0, d / 2);
  return withOutline(new THREE.Mesh(geo, faceMaterial(color)));
}

/** Triángulo isósceles en XZ: base `w` sobre el eje X, ápice a distancia `d` en +Z. */
function triFaceMesh(w, d, color) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(
    [-w / 2, 0, 0, w / 2, 0, 0, 0, 0, d], 3));
  geo.setIndex([0, 1, 2]);
  geo.computeVertexNormals();
  return withOutline(new THREE.Mesh(geo, faceMaterial(color)));
}

/** Reexpresa la base en coordenadas locales de la arista `edgeIndex` (arista en el origen, cuerpo hacia +Z). */
function outlineInEdgeFrame(points2D, edgeIndex) {
  const n = points2D.length;
  const p0 = points2D[edgeIndex];
  const p1 = points2D[(edgeIndex + 1) % n];
  const mx = (p0[0] + p1[0]) / 2, mz = (p0[1] + p1[1]) / 2;
  let dx = p1[0] - p0[0], dz = p1[1] - p0[1];
  const len = Math.hypot(dx, dz); dx /= len; dz /= len;
  // Normal hacia el interior (hacia el centroide, que está en el origen)
  let nx = -dz, nz = dx;
  if (nx * mx + nz * mz > 0) { nx = -nx; nz = -nz; }
  return points2D.map(([x, z]) => {
    const rx = x - mx, rz = z - mz;
    return [rx * dx + rz * dz, rx * nx + rz * nz];
  });
}

/**
 * Construye el grupo plegable.
 * @returns {{ group: THREE.Group, setFold(t:number):void, foldable:boolean }}
 */
function buildFoldableNet(solidDef, dims) {
  const group = new THREE.Group();
  const hinges = [];  // { pivot, angle, mirror }

  if (solidDef.group === 'redondo') return { group, setFold() {}, foldable: false };

  const outline = baseOutline(solidDef, dims);
  const n = outline.length;

  // --- Base ---
  group.add(polygonMesh(outline, NET_FACE_COLORS.base));

  const isPrisma = solidDef.kind === 'prisma';
  const isPiramide = solidDef.kind === 'piramide' || solidDef.id === 'tetraedro';
  const isOctaedro = solidDef.id === 'octaedro';

  const height = isPrisma ? dims.alto
    : solidDef.id === 'tetraedro' ? dims.arista * Math.sqrt(2 / 3)
    : solidDef.id === 'octaedro' ? dims.arista / Math.SQRT2
    : dims.altura;

  for (let i = 0; i < n; i++) {
    const p0 = outline[i], p1 = outline[(i + 1) % n];
    const mx = (p0[0] + p1[0]) / 2, mz = (p0[1] + p1[1]) / 2;
    const edgeLen = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const apotemaArista = Math.hypot(mx, mz); // distancia del centro a esta arista

    // Marco de la bisagra: +Z hacia afuera, +X a lo largo de la arista
    const psi = Math.atan2(mz, mx);
    const pivot = new THREE.Group();
    pivot.position.set(mx, 0, mz);
    pivot.rotation.y = Math.PI / 2 - psi;
    group.add(pivot);

    if (isPrisma) {
      pivot.add(rectFaceMesh(edgeLen, height, NET_FACE_COLORS.lateral));
      hinges.push({ pivot, angle: Math.PI / 2 });

      // La tapa cuelga del borde superior de la primera cara lateral
      if (i === 0) {
        const tapaPivot = new THREE.Group();
        tapaPivot.position.set(0, 0, height);
        pivot.add(tapaPivot);
        const localOutline = outlineInEdgeFrame(outline, 0);
        tapaPivot.add(polygonMesh(localOutline, NET_FACE_COLORS.tapa));
        hinges.push({ pivot: tapaPivot, angle: Math.PI / 2 });
      }
    } else if (isPiramide) {
      const apotemaLateral = Math.hypot(height, apotemaArista);
      // La cara no solo se levanta: gira hasta pasar por encima de la bisagra,
      // de modo que su ápice cae justo sobre el centro de la base. Ese ángulo
      // es π − atan2(h, apotema), no atan2(h, apotema): con este último las
      // caras quedarían abiertas "en flor" y los ápices no se encontrarían.
      pivot.add(triFaceMesh(edgeLen, apotemaLateral, NET_FACE_COLORS.lateral));
      hinges.push({ pivot, angle: Math.PI - Math.atan2(height, apotemaArista) });
    } else if (isOctaedro) {
      // Dos pirámides cuadrangulares unidas por la base: una cara sube y otra baja
      const apotemaLateral = Math.hypot(height, apotemaArista);
      const foldAngle = Math.PI - Math.atan2(height, apotemaArista);

      pivot.add(triFaceMesh(edgeLen, apotemaLateral, NET_FACE_COLORS.lateral));
      hinges.push({ pivot, angle: foldAngle });

      const downPivot = new THREE.Group();
      downPivot.position.set(mx, 0, mz);
      downPivot.rotation.y = Math.PI / 2 - psi;
      group.add(downPivot);
      downPivot.add(triFaceMesh(edgeLen, apotemaLateral, NET_FACE_COLORS.tapa));
      hinges.push({ pivot: downPivot, angle: foldAngle, mirror: true });
    }
  }

  function setFold(t) {
    const clamped = Math.max(0, Math.min(1, t));
    hinges.forEach((h) => {
      h.pivot.rotation.x = (h.mirror ? 1 : -1) * h.angle * clamped;
    });
    // El desarrollo está apoyado en y=0 y el sólido crece hacia arriba, así
    // que al plegarse quedaría flotando por encima del centro de la cámara.
    // Se baja el grupo progresivamente para que el sólido terminado quede
    // centrado en el origen, que es a donde apunta la cámara.
    group.position.y = -centerYFinal * clamped;
  }

  // Altura del centro del sólido ya formado (el octaedro ya nace centrado).
  const centerYFinal = isOctaedro ? 0 : height / 2;

  setFold(0);

  // Radio del desarrollo extendido: el estado que más espacio ocupa, y con
  // el que hay que encuadrar la cámara para que no se salga de pantalla.
  // circunradio = distancia a los vértices; apotema = distancia a las aristas.
  const circunradio = Math.max(...outline.map(([x, z]) => Math.hypot(x, z)));
  const apotemaMax = Math.max(...outline.map(([x, z], i) => {
    const [x2, z2] = outline[(i + 1) % outline.length];
    return Math.hypot((x + x2) / 2, (z + z2) / 2);
  }));
  const flatRadius = isPrisma
    // base + cara lateral desplegada + tapa (que abarca un diámetro)
    ? apotemaMax + height + 2 * circunradio
    // base + cara triangular desplegada (apotema lateral)
    : apotemaMax + Math.hypot(height, apotemaMax);

  return { group, setFold, foldable: true, flatRadius, centerYFinal };
}

window.buildFoldableNet = buildFoldableNet;
window.baseOutline = baseOutline;
