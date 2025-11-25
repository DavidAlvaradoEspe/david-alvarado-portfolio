import {Component, ElementRef, NgZone, OnDestroy, OnInit, signal, ViewChild} from '@angular/core';
import {BabylonSceneService} from '../../@core/services/babylon-scene';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {GridMaterial} from '@babylonjs/materials/grid/gridMaterial';
import {Color3, Color4} from '@babylonjs/core/Maths/math.color';
import {PuzzleStore} from '../../@core/store/puzzle.store';
import {SplashScreenService} from '../../shared/components/splash-screen/splash-screen-service';
import {Vector3} from '@babylonjs/core/Maths/math.vector';
import {CV_DATA, CVSection} from '../../shared/mockedData/data';
import {StarfieldShaderService} from './starfield-shader.service';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {AbstractMesh} from '@babylonjs/core/Meshes/abstractMesh';
import {Animation} from '@babylonjs/core/Animations/animation';

@Component({
  selector: 'app-holographic-room',
  imports: [],
  templateUrl: './holographic-room.html',
  styleUrl: './holographic-room.scss',
})
export class HolographicRoomComponent implements OnInit, OnDestroy {
  @ViewChild('renderCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  // UI State Signals
  public activeSection = signal<CVSection | null>(null);
  public isDetailsOpen = signal<boolean>(false);

  constructor(
    private babylonService: BabylonSceneService,
    private ngZone: NgZone,
    protected puzzleStore: PuzzleStore,
    private splashService: SplashScreenService,
    private starfieldShader: StarfieldShaderService
  ) {}

  ngOnInit() {
    this.splashService.show = true;
    this.puzzleStore.setLoading(true);
    this.splashService.updateMessage("INITIALIZING");

    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => this.initScene(), 0);
    });
  }

  private async initScene() {
    const canvas = this.canvasRef.nativeElement;

    if (!canvas) {
      console.error('Canvas element not found!');
      return;
    }

    try {
      // Initialize the Babylon scene
      this.babylonService.initScene(canvas, {
        createEnvironmentTexture: false,
        createLights: true,
        allowCamControls: true,
        createGlowLayer: true
      }, {
        removeKeyBoardInputs: true,
        autoElevation: false,
        disablePanning: true,
      });

      // Verify scene was created
      const scene = this.babylonService.currentScene;
      if (!scene) {
        console.error('Scene initialization failed!');
        return;
      }

      scene.clearColor = new Color4(0.02, 0.02, 0.08, 1);

     const camera = this.babylonService.currentCamera;
      if (camera) {
        camera.radius = 35;
        camera.beta = Math.PI / 2.3;
        camera.alpha = Math.PI * 2;
        camera.wheelPrecision = 40;
        camera.angularSensibilityX = 1000; // Faster horizontal rotation (default 3000)
        camera.angularSensibilityY = 1000; // Faster vertical/pitch rotation (default 3000)

        camera.lowerRadiusLimit = 5;
        camera.upperRadiusLimit = 80;

        camera.lowerBetaLimit = 0.1;
        camera.upperBetaLimit = Math.PI - 0.1;

        this.starfieldShader.initStarfieldEffect(scene, camera);
      }

      this.createGridUniverse();

      await this.loadGalaxyModel();

      await this.createCentralHologram();

      this.spawnCVConstellations();

      this.babylonService.startAnimation();

      this.ngZone.run(() => {
        this.puzzleStore.setLoading(false);
        setTimeout(() => {
          this.splashService.hide();
        }, 500);
      });
    } catch (error) {
      console.error('Failed to initialize holographic room:', error);
      this.ngZone.run(() => {
        this.splashService.updateMessage('Error loading holographic interface');
        this.puzzleStore.setLoading(false);
      });
    }
  }

  private createGridUniverse() {
    const scene = this.babylonService.currentScene;
    if (!scene) return;

    const gridSphere = MeshBuilder.CreateSphere("universe", { diameter: 100, segments: 64 }, scene);
    const gridMat = new GridMaterial("gridMat", scene);
    gridMat.majorUnitFrequency = 5;
    gridMat.minorUnitVisibility = 1;
    gridMat.gridRatio = 4;
    gridMat.mainColor = Color3.FromHexString("#005555");
    gridMat.lineColor = Color3.FromHexString("#00ffff");
    gridMat.opacity = 0.4;
    gridMat.backFaceCulling = false;

    gridSphere.material = gridMat;
    gridSphere.isPickable = false;

  }

  private async loadGalaxyModel() {
    const scene = this.babylonService.currentScene;
    if (!scene) return;

    try {
      this.splashService.updateMessage("LOADING UNIVERSE");

      const assetContainer = await this.babylonService.loadModel("assets/models/solar_system.glb");
      assetContainer.addAllToScene();

      const loadedMeshes = assetContainer.meshes;

      if (loadedMeshes.length > 0) {
        const galaxyRoot = loadedMeshes[0] as AbstractMesh;

        galaxyRoot.position = Vector3.Zero();
        galaxyRoot.scaling = new Vector3(0.1, 0.1, 0.1);

        loadedMeshes.forEach((mesh) => {
          mesh.isPickable = false;
          if (mesh.material) {
            const material = mesh.material as StandardMaterial;
            material.alpha = 0.4;
            material.backFaceCulling = false;
          }
          const glowLayer = this.babylonService.currentGlowLayer;
          if (glowLayer && mesh) {
            glowLayer.addExcludedMesh(mesh as any);
          }
        });
      }
    } catch (error) {
      console.error("Failed to load galaxy.glb:", error);
    }
  }

  private async createCentralHologram(): Promise<AbstractMesh> {
    const scene = this.babylonService.currentScene;
    if (!scene) throw new Error("Scene not initialized");
    const coreGroup = new Mesh("coreGroup", scene);
    try {
      const assetContainer = await this.babylonService.loadModel("assets/models/treasure_map.glb");
      assetContainer.addAllToScene();

      const loadedMeshes = assetContainer.meshes;
      if (loadedMeshes.length > 0) {
        const treasureMap = loadedMeshes[0] as AbstractMesh;
        treasureMap.parent = coreGroup;
        treasureMap.scaling = new Vector3(0.5, 0.5, 0.5);

        loadedMeshes.forEach((mesh) => {
          if (mesh.material) {
            const greenMat = new StandardMaterial("treasureMapGreen", scene);
            greenMat.diffuseColor = Color3.FromHexString("#00aa00");
            greenMat.specularColor = Color3.FromHexString("#33ff33");
            greenMat.emissiveColor = Color3.FromHexString("#33ff33");
            greenMat.alpha = 0.7;
            mesh.material = greenMat;
          }

          const glowLayer = this.babylonService.currentGlowLayer;
          if (glowLayer && mesh) {
            glowLayer.addExcludedMesh(mesh as any);
          }
        });

        const scaleAnim = new Animation(
          "treasureMapPulse",
          "scaling",
          30,
          Animation.ANIMATIONTYPE_VECTOR3,
          Animation.ANIMATIONLOOPMODE_CYCLE
        );

        const scaleKeys = [];
        scaleKeys.push({ frame: 0, value: new Vector3(0.5, 0.5, 0.5) });
        scaleKeys.push({ frame: 90, value: new Vector3(0.55, 0.55, 0.55) }); // 10% pulse
        scaleKeys.push({ frame: 180, value: new Vector3(0.5, 0.5, 0.5) });
        scaleAnim.setKeys(scaleKeys);
        treasureMap.animations.push(scaleAnim);
        scene.beginAnimation(treasureMap, 0, 180, true);

      }
    } catch (error) {
      console.error("Failed to load treasure_map.glb, using fallback sphere", error);

      const planet = MeshBuilder.CreateSphere("corePlanet", {
        diameter: 3,
        segments: 64
      }, scene);
      planet.parent = coreGroup;

      const planetMat = new StandardMaterial("planetMat", scene);
      planetMat.diffuseColor = Color3.FromHexString("#00aa00");
      planetMat.specularColor = Color3.FromHexString("#33ff33");
      planetMat.emissiveColor = Color3.Black();
      planetMat.alpha = 1.0;
      planet.material = planetMat;

    }

    let floatTime = 0;
    scene.onBeforeRenderObservable.add(() => {
      floatTime += 0.03; // Fast movement speed
      coreGroup.position.y = Math.sin(floatTime) * 0.25; // Group floats together
    });

    // ========================================
    // RING 1 - Static solid ring
    // ========================================
    const ring1 = MeshBuilder.CreateTorus("ring1", {
      diameter: 16,
      thickness: 0.12,
      tessellation: 48
    }, scene);
    ring1.parent = coreGroup;
    ring1.position = Vector3.Zero();
    ring1.rotation.x = Math.PI / 4;
    ring1.rotation.y = 0;
    ring1.rotation.z = 0;

    const ring1Mat = new StandardMaterial("ring1Mat", scene);
    ring1Mat.emissiveColor = Color3.FromHexString("#00ff00");
    ring1Mat.diffuseColor = Color3.Black();
    ring1Mat.specularColor = Color3.Black();
    ring1Mat.alpha = 0.85;
    ring1.material = ring1Mat;

    // ========================================
    // RING 2
    // ========================================
    const ring2Base = MeshBuilder.CreateTorus("ring2Base", {
      diameter: 16,
      thickness: 1,
      tessellation: 48
    }, scene);
    ring2Base.parent = coreGroup;
    ring2Base.position = Vector3.Zero();
    ring2Base.rotation.x = 0;
    ring2Base.rotation.y = Math.PI / 2;
    ring2Base.rotation.z = Math.PI * 1.8 ;

    // Gaseous material
    const ring2BaseMat = new StandardMaterial("ring2BaseMat", scene);
    ring2BaseMat.emissiveColor = Color3.FromHexString("#00aa00"); // Darker green
    ring2BaseMat.diffuseColor = Color3.FromHexString("#002200");
    ring2BaseMat.specularColor = Color3.Black();
    ring2BaseMat.alpha = 0.3;
    ring2Base.material = ring2BaseMat;


    return coreGroup;
  }

  private spawnCVConstellations() {
    const radius = 14;
    const sections = CV_DATA;
    const total = sections.length;

    sections.forEach((section: any, index: number) => {
      const angle = (index / total) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const y = Math.sin(angle * 3) * 1.5;

      const pos = new Vector3(x, y, z);

      const color = "#00FF00";
      const node = this.babylonService.createOrbitalNode(section.title, pos, color, () => {
        this.onNodeClicked(section, node);
      });
    });
  }

  private onNodeClicked(section: CVSection, mesh: any) {
    if (this.isDetailsOpen()) return;

    this.ngZone.run(() => {
      this.babylonService.flyToMesh(mesh, 7, () => {
        this.ngZone.run(() => {
          this.activeSection.set(section);
          this.isDetailsOpen.set(true);
        });
      });
    });
  }

  public closeDetails() {

    this.isDetailsOpen.set(false);
    setTimeout(() => {
      this.activeSection.set(null);
      this.babylonService.resetCameraView();
    }, 100);
  }

  ngOnDestroy() {
    this.starfieldShader.dispose();
    this.babylonService.dispose();
  }

}
