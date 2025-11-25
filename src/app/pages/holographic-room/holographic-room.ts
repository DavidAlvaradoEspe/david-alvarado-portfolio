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
import { ActionManager } from '@babylonjs/core/Actions/actionManager';
import { ExecuteCodeAction } from '@babylonjs/core/Actions/directActions';
import { CubicEase, EasingFunction } from '@babylonjs/core/Animations/easing';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';

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
  private isTransitioning = false;

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
        createLights: false,
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
      const node = this.createOrbitalNode(section.title, pos, color, () => {
        this.onNodeClicked(section, node);
      });
    });
  }

  private onNodeClicked(section: CVSection, mesh: any) {
    if (this.isDetailsOpen()) return;

    this.ngZone.run(() => {
      this.flyToMesh(mesh, 7, () => {
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
      this.resetCameraView();
    }, 100);
  }



  public createOrbitalNode(
    name: string,
    position: Vector3,
    colorHex: string,
    onClick: () => void
  ): AbstractMesh {
    const scene = this.babylonService.currentScene;
    if (!scene) throw new Error("Scene not initialized");

    const nodeGroup = new Mesh(name + "_group", scene);
    nodeGroup.position = position;

    const planet = MeshBuilder.CreateSphere(name, { diameter: 2, segments: 16 }, scene);
    planet.parent = nodeGroup;
    const mat = new StandardMaterial(name + "_mat", scene);
    mat.emissiveColor = Color3.FromHexString(colorHex);
    mat.alpha = 0.8;
    planet.material = mat;

    const atmo = MeshBuilder.CreateSphere(name + "_atmo", { diameter: 1.5, segments: 16 }, scene);
    atmo.parent = nodeGroup;
    const atmoMat = new StandardMaterial(name + "_atmoMat", scene);
    atmoMat.emissiveColor = Color3.FromHexString(colorHex);
    atmoMat.alpha = 0.3;
    atmo.material = atmoMat;

    planet.isPickable = true;
    nodeGroup.isPickable = false;

    planet.actionManager = new ActionManager(scene);
    planet.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
        if (!this.isTransitioning) onClick();
      })
    );

    this.setupConstellationHoverEffect(planet, atmo, colorHex);

    this.createHolographicLabel(name, nodeGroup, colorHex);

    this.createConnectionBeam(Vector3.Zero(), position, colorHex);

    return nodeGroup;
  }

  /**
   * Optimized hover effect that changes glow color to orange on mouse over
   * @param planet - The main planet mesh (pickable sphere)
   * @param atmosphere - The atmosphere glow mesh
   * @param originalColorHex - Original color to restore on mouse out
   */
  private setupConstellationHoverEffect(
    planet: Mesh,
    atmosphere: Mesh,
    originalColorHex: string
  ) {

    const scene = this.babylonService.currentScene;
    if (!planet.actionManager) {
      planet.actionManager = new ActionManager(scene!);
    }

    const originalColor = Color3.FromHexString(originalColorHex);
    const hoverColor = Color3.FromHexString("#FF8C00");
    const brightHoverColor = Color3.FromHexString("#FFA500");

    // Store original materials
    const planetMat = planet.material as StandardMaterial;
    const atmoMat = atmosphere.material as StandardMaterial;

    planet.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
        if (!this.isTransitioning) {
          planetMat.emissiveColor = brightHoverColor;
          atmoMat.emissiveColor = hoverColor;
        }
      })
    );

    planet.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
        // Restore original colors
        planetMat.emissiveColor = originalColor;
        atmoMat.emissiveColor = originalColor;
      })
    );
  }

  private createConnectionBeam(start: Vector3, end: Vector3, _colorHex: string) {
    // Create the line mesh
    const points = [start, end];
    const line = MeshBuilder.CreateLines("beam", { points: points }, this.babylonService.currentScene);
    line.color = Color3.FromHexString("#00FF00");
    line.alpha = 0.3;
    line.isPickable = false;
  }

  private createHolographicLabel(text: string, parent: AbstractMesh, _colorHex: string) {
    const scene = this.babylonService.currentScene;
    const planeWidth = 12;
    const planeHeight = 3;
    const plane = MeshBuilder.CreatePlane("label", { width: planeWidth, height: planeHeight }, scene);
    plane.parent = parent;

    plane.position.y = -2.8;
    plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
    plane.isPickable = false;

    const dt = new DynamicTexture("dynamic texture", { width: 2048, height: 512 }, scene!);
    dt.hasAlpha = true;

    const ctx = dt.getContext();

    ctx.clearRect(0, 0, 2048, 512);

    const mainColor = "#ffffff"; // Pure white for core text
    const blueGlow = "#4da6ff"; // Bright blue glow
    const darkOutline = "#000000"; // Pure black outline for maximum contrast

    const fontSize = 140;
    ctx.font = `700 ${fontSize}px "Segoe UI", "Century Gothic", "Futura", "Trebuchet MS", sans-serif`;

    // Center the text
    const textMetrics = ctx.measureText(text.toUpperCase());
    const x = (2048 - textMetrics.width) / 2;
    const y = 280;

    ctx.shadowColor = blueGlow;
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = blueGlow;
    ctx.fillText(text.toUpperCase(), x, y);

    ctx.shadowBlur = 18;
    ctx.fillText(text.toUpperCase(), x, y);

    ctx.shadowBlur = 0;
    ctx.lineWidth = 8; // Thick outline for crisp edges
    ctx.strokeStyle = darkOutline;
    ctx.strokeText(text.toUpperCase(), x, y);

    ctx.shadowBlur = 12;
    ctx.shadowColor = blueGlow;
    ctx.fillStyle = blueGlow;
    ctx.fillText(text.toUpperCase(), x, y);

    ctx.shadowBlur = 6;
    ctx.shadowColor = "#ffffff";
    ctx.fillStyle = mainColor; // Pure white
    ctx.fillText(text.toUpperCase(), x, y);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text.toUpperCase(), x, y);

    dt.update();

    const mat = new StandardMaterial("labelMat", this.babylonService.currentScene!);
    mat.diffuseTexture = dt;
    mat.emissiveColor = Color3.FromHexString("#ffffff"); // White emission
    mat.emissiveColor.scale(1.3); // Bright emission
    mat.opacityTexture = dt;
    mat.alpha = 1.0;
    mat.disableLighting = true;
    mat.backFaceCulling = false;

    plane.material = mat;

    if (this.babylonService.currentGlowLayer) {
      this.babylonService.currentGlowLayer.addExcludedMesh(plane);
    }
  }

  public flyToMesh(targetMesh: AbstractMesh, radius: number = 4, onComplete?: () => void) {
    const scene = this.babylonService.currentScene;
    const camera = this.babylonService.currentCamera;
    if (!scene || !camera || this.isTransitioning) return;

    this.isTransitioning = true;
    const frameRate = 30;
    const duration = 60;

    const targetPos = targetMesh.absolutePosition.clone();

    const animRadius = new Animation("zoom", "radius", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    const animTarget = new Animation("move", "target", frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);

    const easing = new CubicEase();
    easing.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    [animRadius, animTarget].forEach(a => a.setEasingFunction(easing));

    animRadius.setKeys([{ frame: 0, value: camera.radius }, { frame: duration, value: radius }]);
    animTarget.setKeys([{ frame: 0, value: camera.target }, { frame: duration, value: targetPos }]);

    scene.beginDirectAnimation(camera, [animRadius, animTarget], 0, duration, false, 1, () => {
      this.isTransitioning = false;
      if (onComplete) onComplete();
    });
  }

  public resetCameraView(onComplete?: () => void) {
    const scene = this.babylonService.currentScene;
    const camera = this.babylonService.currentCamera;
    if (!scene || !camera) return;

    this.isTransitioning = true;
    const frameRate = 60;
    const duration = 90;

    const animRadius = new Animation("zoomOut", "radius", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    const animTarget = new Animation("resetTarget", "target", frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);

    const easing = new CubicEase();
    easing.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    [animRadius, animTarget].forEach(a => a.setEasingFunction(easing));

    animRadius.setKeys([{ frame: 0, value: camera.radius }, { frame: duration, value: 40 }]); // Increased from 25 to 40 for better overview
    animTarget.setKeys([{ frame: 0, value: camera.target }, { frame: duration, value: Vector3.Zero() }]);

    scene.beginDirectAnimation(camera, [animRadius, animTarget], 0, duration, false, 1, () => {
      this.isTransitioning = false;
      if (onComplete) onComplete();
    });
  }

  ngOnDestroy() {
    this.starfieldShader.dispose();
    this.babylonService.dispose();
  }

}
