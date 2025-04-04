import React, { Suspense, useRef, useEffect, useCallback } from "react";
import { Canvas, useLoader, useThree, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  useProgress,
  Environment,
  Html,
} from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

type BuildingType = "Hyperviseur" | "Laboratoire" | "Météo" | "Parking";

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="bg-black/70 text-white p-2 rounded text-sm">
        Loading model: {Math.round(progress)}%
      </div>
    </Html>
  );
}

function cloneMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) {
    return material.map((m) => m.clone());
  }
  return material.clone();
}

function City({
  onBuildingSelect,
}: {
  onBuildingSelect: (building: BuildingType) => void;
}) {
  const gltf = useLoader(GLTFLoader, "/models/main.gltf", (loader) => {
    loader.manager.setURLModifier((url) => {
      let decodedUrl = decodeURIComponent(url);

      if (
        decodedUrl.includes("textures/") ||
        decodedUrl.includes("textures%2F")
      ) {
        const parts = decodedUrl.split("/").filter(Boolean);
        const filename = parts[parts.length - 1];
        return `/models/textures/${filename}`;
      }

      if (
        decodedUrl.endsWith(".png") ||
        decodedUrl.endsWith(".jpg") ||
        decodedUrl.endsWith(".jpeg")
      ) {
        const parts = decodedUrl.split("/").filter(Boolean);
        const filename = parts[parts.length - 1];
        return `/models/textures/${filename}`;
      }

      return url;
    });
  });

  const { camera, raycaster, mouse, gl } = useThree();
  const modelReady = useRef(false);
  const selectedBuilding = useRef<THREE.Object3D | null>(null);
  const hoveredBuilding = useRef<THREE.Object3D | null>(null);
  const clickableBuildings = useRef<THREE.Object3D[]>([]);

  const buildingMaterials = useRef(
    new Map<string, Map<string, THREE.Material | THREE.Material[]>>()
  );

  const storeOriginalMaterials = useCallback((building: THREE.Object3D) => {
    if (buildingMaterials.current.has(building.uuid)) return;

    const materials = new Map<string, THREE.Material | THREE.Material[]>();

    building.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        materials.set(mesh.uuid, cloneMaterial(mesh.material));
      }
    });

    buildingMaterials.current.set(building.uuid, materials);
  }, []);

  const restoreOriginalMaterials = useCallback((building: THREE.Object3D) => {
    const materials = buildingMaterials.current.get(building.uuid);
    if (!materials) return;

    building.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const originalMaterial = materials.get(mesh.uuid);

        if (originalMaterial) {
          mesh.material = cloneMaterial(originalMaterial);
        }
      }
    });
  }, []);

  const highlightBuilding = useCallback(
    (building: THREE.Object3D) => {
      storeOriginalMaterials(building);

      building.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;

          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map((mat) => {
              const newMat = mat.clone();
              if (newMat instanceof THREE.MeshStandardMaterial) {
                newMat.emissive = new THREE.Color(0x3498db);
                newMat.emissiveIntensity = 0.5;
              }
              return newMat;
            });
          } else if (mesh.material instanceof THREE.MeshStandardMaterial) {
            const newMat = mesh.material.clone();
            newMat.emissive = new THREE.Color(0x3498db);
            newMat.emissiveIntensity = 0.5;
            mesh.material = newMat;
          }
        }
      });
    },
    [storeOriginalMaterials]
  );

  const selectBuilding = useCallback(
    (building: THREE.Object3D) => {
      if (selectedBuilding.current && selectedBuilding.current !== building) {
        restoreOriginalMaterials(selectedBuilding.current);
      }

      selectedBuilding.current = building;

      highlightBuilding(building);

      onBuildingSelect(building.name as BuildingType);
    },
    [highlightBuilding, onBuildingSelect, restoreOriginalMaterials]
  );

  const findBuildingFromIntersection = useCallback(
    (object: THREE.Object3D): THREE.Object3D | null => {
      const validBuildingNames = [
        "Hyperviseur",
        "Laboratoire",
        "Météo",
        "Meteo",
        "Parking",
      ];
      let current: THREE.Object3D | null = object;

      while (current && !validBuildingNames.includes(current.name)) {
        current = current.parent;
      }

      return current;
    },
    []
  );

  useEffect(() => {
    if (!gltf.scene) return;

    const validBuildingNames = [
      "Hyperviseur",
      "Laboratoire",
      "Météo",
      "Meteo",
      "Parking",
    ];
    const buildings: THREE.Object3D[] = [];
    console.log("gltf.scene", gltf.scene);
    gltf.scene.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.material) {
          const materials = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];

          materials.forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial) {
              const textureTypes = [
                "map",
                "normalMap",
                "roughnessMap",
                "metalnessMap",
              ];
              textureTypes.forEach((type) => {
                const texture = material[
                  type as keyof THREE.MeshStandardMaterial
                ] as THREE.Texture;
                if (texture) {
                  texture.wrapS = THREE.RepeatWrapping;
                  texture.wrapT = THREE.RepeatWrapping;
                  texture.needsUpdate = true;
                }
              });

              material.needsUpdate = true;
            }
          });
        }
      }

      if (validBuildingNames.includes(node.name)) {
        if (node.name === "Meteo") {
          node.name = "Météo";
        }

        buildings.push(node);
      }
    });

    clickableBuildings.current = buildings;

    buildings.forEach((building) => {
      storeOriginalMaterials(building);
    });

    const initialBuilding = buildings.find((b) => b.name === "Hyperviseur");
    if (initialBuilding) {
      selectedBuilding.current = initialBuilding;
      highlightBuilding(initialBuilding);
    }

    modelReady.current = true;
  }, [gltf.scene, highlightBuilding, storeOriginalMaterials]);

  useFrame(() => {
    if (!modelReady.current) return;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(gltf.scene.children, true);

    let hitBuilding: THREE.Object3D | null = null;

    for (const intersect of intersects) {
      const building = findBuildingFromIntersection(intersect.object);
      if (building) {
        hitBuilding = building;
        break;
      }
    }

    if (hitBuilding) {
      gl.domElement.style.cursor = "pointer";
      hoveredBuilding.current = hitBuilding;
    } else {
      gl.domElement.style.cursor = "auto";
      hoveredBuilding.current = null;
    }
  });

  useEffect(() => {
    if (!modelReady.current) return;

    const handleClick = () => {
      if (hoveredBuilding.current) {
        selectBuilding(hoveredBuilding.current);
      }
    };

    gl.domElement.addEventListener("click", handleClick);

    return () => {
      gl.domElement.removeEventListener("click", handleClick);
    };
  }, [gl, selectBuilding]);

  return <primitive object={gltf.scene} />;
}

type CityViewerProps = {
  onBuildingSelect: (buildingType: BuildingType) => void;
  initialBuilding?: BuildingType;
};

const CityViewer: React.FC<CityViewerProps> = ({
  onBuildingSelect,
  initialBuilding = "Hyperviseur",
}) => {
  const lastSelectedRef = useRef<BuildingType>(initialBuilding);

  const handleBuildingSelect = useCallback(
    (building: BuildingType) => {
      if (building !== lastSelectedRef.current) {
        lastSelectedRef.current = building;
        onBuildingSelect(building);
      }
    },
    [onBuildingSelect]
  );

  return (
    <div className="relative w-full h-full" style={{ minHeight: "600px" }}>
      <Canvas
        camera={{
          position: [0, 10, 20],
          fov: 75,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <Suspense fallback={<Loader />}>
          <City onBuildingSelect={handleBuildingSelect} />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            maxPolarAngle={Math.PI / 2}
          />
          <Environment preset="sunset" />
        </Suspense>
      </Canvas>
      <div className="absolute bottom-4 left-4 bg-black/70 text-white p-2 rounded text-sm z-10">
        Click on a building to view its dashboard
      </div>
    </div>
  );
};

export default CityViewer;
