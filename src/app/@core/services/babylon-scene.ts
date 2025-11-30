import { Injectable, NgZone, OnDestroy } from '@angular/core';

// --- CORE ENGINE ---
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene, SceneOptions } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Nullable } from '@babylonjs/core/types';

// --- CAMERAS & INPUTS ---
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { FramingBehavior } from "@babylonjs/core/Behaviors/Cameras/framingBehavior";

// --- LIGHTS ---
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";

// --- LOADING & ASSETS ---
import { ISceneLoaderProgressEvent, LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import { AssetContainer } from '@babylonjs/core/assetContainer';
import "@babylonjs/loaders/glTF";

// --- MESHES & GEOMETRY ---
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { BoundingInfo } from '@babylonjs/core/Culling/boundingInfo';

// --- MATERIALS  ---

import "@babylonjs/core/Materials/PBR/pbrMaterial";
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';

// --- ENVIRONMENT ---
import { EnvironmentHelper } from '@babylonjs/core/Helpers/environmentHelper';
import '@babylonjs/core/Materials/Textures/Loaders/envTextureLoader';
import '@babylonjs/core/Helpers/sceneHelpers';

// --- ANIMATION
import '@babylonjs/core/Animations/animatable';

import { removeDuplicateInspectorStyles } from '../utils';

// Configuration Constants
const CAMERA_CONFIG = {
  INITIAL_ALPHA: Math.PI / 2,
  INITIAL_BETA: 15 * Math.PI / 32,
  INITIAL_RADIUS: 3,
  WHEEL_PRECISION: 200,
  ANGULAR_SENSITIVITY: 3000,
  FRAMING_TIME: 0,
  ELEVATION_RETURN_TIME: 3000,
  ELEVATION_WAIT_TIME: 9000,
  RADIUS_ADJUSTMENT: 1.5,
  RADIUS_LOWER_LIMIT_RATIO: 0.5,
  RADIUS_UPPER_LIMIT_RATIO: 2.0,
} as const;



const LIGHT_CONFIG = {
  POINT_LIGHT_INTENSITY: 0.2,
  HEMISPHERIC_LIGHT_INTENSITY: 0.2,
} as const;

interface CameraOptions {
  removeKeyBoardInputs: boolean;
  autoElevation: boolean;
  disablePanning: boolean;
}

interface CustomSceneOptions {
  createEnvironmentTexture: boolean;
  createLights: boolean;
  allowCamControls: boolean;
  createGlowLayer: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BabylonSceneService implements OnDestroy {
  // Core Babylon Objects
  private engine: Engine | null = null;
  private scene: Scene | null = null;
  private camera: ArcRotateCamera | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private framingBehavior: FramingBehavior | null = null;
  private envTexture = "assets/textures/environmentSpecular.env";
  private glowLayer: GlowLayer | null = null;
  // Meshes and Helpers
  public parentBox: Mesh | null = null;
  private meshToZoom: Mesh | null = null;
  private sceneHelper: Nullable<EnvironmentHelper> | null = null;
  // Lights
  private pointLightBottom: PointLight | null = null;
  private hemisphericLightLeft: HemisphericLight | null = null;
  private hemisphericLightRight: HemisphericLight | null = null;

  // Camera State
  public cameraInitialAlpha: number | null = null;
  public cameraInitialBeta: number | null = null;
  public cameraInitialRadius: number | null = null;

  // Debug
  private keydownListener!: (event: KeyboardEvent) => void;
  private isInspectorLoaded = false;

  constructor(private ngZone: NgZone) {}

  public get currentGlowLayer(): GlowLayer | null {
    return this.glowLayer;
  }

  public initScene(canvas: HTMLCanvasElement, sceneOptions: CustomSceneOptions, cameraOptions: CameraOptions) {
    this.createEngine(canvas);
    this.createScene();
    this.createPrincipalCamera(cameraOptions);

    if (sceneOptions.createEnvironmentTexture) this.createDefaultEnvironment();
    if (sceneOptions.createLights) this.createDefaultLights();
    if (sceneOptions.allowCamControls) this.allowCamControls(true);
    if (sceneOptions.createGlowLayer && this.scene) {
      this.glowLayer = new GlowLayer("glow", this.scene);
      this.glowLayer.intensity = 0.8;
    }
    this.showDebugLayer();
  }

  private createEngine(canvas: HTMLCanvasElement) {

    this.ngZone.runOutsideAngular(() => {
      this.engine = new Engine(canvas, true, {
        adaptToDeviceRatio: true,
        preserveDrawingBuffer: true,
        stencil: true,
        disableWebGL2Support: false
      });
    });
    this.canvas = canvas;
  }

  private createScene() {
    this.scene = new Scene(this.engine!, {
      preserveDrawingBuffer: true
    } as SceneOptions);
  }

  public allowCamControls(enabled: boolean) {
    if (!this.scene || !this.camera) return;
    this.scene.activeCamera = this.camera;

    if (enabled) {
      this.camera.attachControl(this.canvas!, true);
    } else {
      this.camera.detachControl();
    }
  }

  private createPrincipalCamera(options: CameraOptions) {
    if (!this.scene) return;

    this.camera = new ArcRotateCamera(
      "mainCamera",
      CAMERA_CONFIG.INITIAL_ALPHA,
      CAMERA_CONFIG.INITIAL_BETA,
      CAMERA_CONFIG.INITIAL_RADIUS,
      Vector3.Zero(),
      this.scene
    );

    this.scene.setActiveCameraById(this.camera.id);
    this.configureCameraSettings(options);
  }

  private configureCameraSettings(options: CameraOptions) {
    if (!this.camera) return;

    this.camera.wheelPrecision = CAMERA_CONFIG.WHEEL_PRECISION;
    this.camera.angularSensibilityX = CAMERA_CONFIG.ANGULAR_SENSITIVITY;
    this.camera.angularSensibilityY = CAMERA_CONFIG.ANGULAR_SENSITIVITY;
    this.camera.minZ = 0;
    this.camera.useFramingBehavior = true;

    if (this.camera.framingBehavior) {
      this.framingBehavior = this.camera.framingBehavior;
      this.configureFramingBehavior(options.autoElevation);
    }

    if (options.removeKeyBoardInputs) {
      this.camera.inputs.removeByType("ArcRotateCameraKeyboardMoveInput");
    }

    if (options.disablePanning) {
      this.camera._useCtrlForPanning = false;
      this.camera.panningSensibility = 0;
    }
  }

  private configureFramingBehavior(autoElevation: boolean) {
    if (!this.framingBehavior) return;

    if (autoElevation) {
      this.framingBehavior.elevationReturnTime = -1;
      this.framingBehavior.autoCorrectCameraLimitsAndSensibility = false;
    } else {
      this.framingBehavior.elevationReturnTime = CAMERA_CONFIG.ELEVATION_RETURN_TIME;
      this.framingBehavior.elevationReturnWaitTime = CAMERA_CONFIG.ELEVATION_WAIT_TIME;
    }
  }

  public rendererLoopCallback = () => {
    this.engine?.resize();
    this.scene?.render();
  };

  private onResize = () => {
    if (!this.engine) return;
    this.engine.resize();
  }

  public startAnimation() {
    if (!this.engine) return;

    this.ngZone.runOutsideAngular(() => {
      this.engine!.runRenderLoop(this.rendererLoopCallback);
      window.addEventListener('resize', this.onResize);
    });
  }

  public stopAnimation() {
    if (!this.engine) return;
    this.engine.stopRenderLoop(this.rendererLoopCallback);
    window.removeEventListener('resize', this.onResize);
  }

  public async loadModel(
    modelPath: string,
    onProgress?: (event: ISceneLoaderProgressEvent) => void
  ): Promise<AssetContainer> {
    if (!this.scene) throw new Error('Scene not initialized.');

    try {
      return await LoadAssetContainerAsync(modelPath, this.scene, {
        name: this.extractFileName(modelPath),
        pluginExtension: ".glb",
        onProgress: onProgress
      });
    } catch (error) {
      throw new Error(`Failed to load model from "${modelPath}": ${error}`);
    }
  }

  private extractFileName(path: string): string {
    return path.split('/').pop() || '';
  }

  public setCameraInitialTarget(
    doubleClickToCenter = false,
    setRadius = true,
    setPositionZero = false,
    model?: any,
    saveMeshToZoom = true,
    setParentBox = true
  ): Mesh | undefined {
    if (!model?.meshes) return undefined;

    const parentBox = this.createParentBoundingBox(model.meshes, setPositionZero);

    if (setParentBox) this.parentBox = parentBox;
    if (setRadius) this.setRadius(doubleClickToCenter, saveMeshToZoom);

    return parentBox;
  }

  private createParentBoundingBox(meshes: AbstractMesh[], setPositionZero: boolean): Mesh {
    const boundingInfo = this.calculateCombinedBoundingInfo(meshes);
    const parentBox = this.createBoundingBoxMesh(boundingInfo);
    const root = meshes[0];

    root.setBoundingInfo(boundingInfo);
    root.computeWorldMatrix(true);
    root.setParent(parentBox);
    root.isPickable = true;

    if (setPositionZero) parentBox.position.set(0, 0, 0);

    parentBox.normalizeToUnitCube(true);
    parentBox.computeWorldMatrix(true);
    parentBox.refreshBoundingInfo(true, true);
    parentBox.isPickable = true;

    return parentBox;
  }

  private calculateCombinedBoundingInfo(meshes: AbstractMesh[]): BoundingInfo {
    let min: Vector3 | null = null;
    let max: Vector3 | null = null;

    meshes[0].scaling.scaleInPlace(1);

    const children = meshes[0].getChildMeshes();
    for (const mesh of children) {
      mesh.refreshBoundingInfo(true, true);
      mesh.computeWorldMatrix(true);
      const boundingBox = mesh.getBoundingInfo().boundingBox;

      min = min ? Vector3.Minimize(min, boundingBox.minimumWorld) : boundingBox.minimumWorld.clone();
      max = max ? Vector3.Maximize(max, boundingBox.maximumWorld) : boundingBox.maximumWorld.clone();
    }

    return new BoundingInfo(min!, max!);
  }

  private createBoundingBoxMesh(boundingInfo: BoundingInfo): Mesh {
    const size = boundingInfo.boundingBox.maximumWorld.subtract(boundingInfo.boundingBox.minimumWorld);
    const center = boundingInfo.boundingBox.centerWorld;

    const box = MeshBuilder.CreateBox("parentBox" + Math.random(), { size: 1 }, this.scene!);
    box.scaling.copyFrom(size);
    box.position.copyFrom(center);
    box.visibility = 0.4;
    box.isVisible = false;
    return box;
  }

  public setRadius(doubleClickToCenter: boolean, saveMeshToZoom = true, setLimits = true) {
    if (!this.parentBox || !this.framingBehavior) return;

    const clonedMesh = this.createZoomMesh();
    this.frameCamera(clonedMesh, doubleClickToCenter);

    if (saveMeshToZoom) {
      this.meshToZoom = clonedMesh;
    } else {
      clonedMesh.dispose(false, true);
    }

    this.finalizeCameraSetup(doubleClickToCenter, setLimits);
  }

  private createZoomMesh(): Mesh {
    const mesh = this.parentBox!.clone("clone" + Math.random());
    mesh.getChildren().forEach((child: any) => {
      child.setParent(null);
      child.dispose();
      this.scene?.removeMesh(child);
    });
    this.scaleMesh(mesh, CAMERA_CONFIG.RADIUS_ADJUSTMENT);
    return mesh;
  }

  private frameCamera(mesh: Mesh, doubleClickToCenter: boolean) {
    if (!this.framingBehavior) return;
    this.framingBehavior.framingTime = CAMERA_CONFIG.FRAMING_TIME;
    this.framingBehavior.zoomOnMesh(mesh, false, () => {
      if (!doubleClickToCenter) this.framingBehavior?.detach();
    });
  }

  private finalizeCameraSetup(doubleClickToCenter: boolean, setLimits: boolean) {
    if (!this.camera) return;

    if (!doubleClickToCenter) {
      this.camera.useFramingBehavior = true;
      if (this.camera.framingBehavior) this.framingBehavior = this.camera.framingBehavior;
      this.camera._useCtrlForPanning = false;
      this.camera.panningSensibility = 0;
      this.camera.wheelPrecision = CAMERA_CONFIG.WHEEL_PRECISION;
      this.camera.angularSensibilityX = CAMERA_CONFIG.ANGULAR_SENSITIVITY;
      this.camera.angularSensibilityY = CAMERA_CONFIG.ANGULAR_SENSITIVITY;
    }

    if (setLimits) this.setCameraRadiusLimits();
  }

  private setCameraRadiusLimits() {
    if (!this.camera) return;
    const radius = this.camera.radius;
    this.camera.lowerRadiusLimit = radius * CAMERA_CONFIG.RADIUS_LOWER_LIMIT_RATIO;
    this.camera.upperRadiusLimit = radius * CAMERA_CONFIG.RADIUS_UPPER_LIMIT_RATIO;
  }

  public saveCameraInitialPosition() {
    if (!this.camera || this.cameraInitialAlpha !== null) return;
    this.cameraInitialAlpha = this.camera.alpha;
    this.cameraInitialBeta = this.camera.beta;
    this.cameraInitialRadius = this.camera.radius;
  }

  public scaleMesh(mesh: Mesh | AbstractMesh, factor = 1) {
    const scale = 1 / factor;
    mesh.scaling.set(mesh.scaling.x * scale, mesh.scaling.y * scale, mesh.scaling.z * scale);
    mesh.refreshBoundingInfo(true, true);
    mesh.computeWorldMatrix();
  }

  private createDefaultEnvironment(): void {
    if (!this.scene) return;
    this.scene.clearColor = new Color4(0, 0, 0, 0);
    const options: any = {
      createGround: false,
      createSkybox: false,
      environmentTexture: this.envTexture,
    };
    try {
      this.sceneHelper = this.scene.createDefaultEnvironment(options);
      if (this.sceneHelper) {
        this.sceneHelper.setMainColor(new Color3(0.4, 0.4, 0.4));
      }
    } catch (e) {
      console.warn("Environment creation failed, likely network issue loading texture:", e);
    }
  }

  private createDefaultLights() {
    if (!this.scene) return;
    const whiteColor = new Color3(1, 1, 1);

    this.pointLightBottom = this.createPointLight("pointLight", new Vector3(0, -0.8, 0), whiteColor, LIGHT_CONFIG.POINT_LIGHT_INTENSITY);
    this.hemisphericLightLeft = this.createHemisphericLight("hemisphericLightLeft", new Vector3(-1, 0, 0), whiteColor, LIGHT_CONFIG.HEMISPHERIC_LIGHT_INTENSITY);
    this.hemisphericLightRight = this.createHemisphericLight("hemisphericLightRight", new Vector3(1, 0, 0), whiteColor, LIGHT_CONFIG.HEMISPHERIC_LIGHT_INTENSITY);
  }

  private createPointLight(name: string, position: Vector3, color: Color3, intensity: number): PointLight {
    const light = new PointLight(name, position, this.scene!);
    light.diffuse = color;
    light.specular = color;
    light.intensity = intensity;
    return light;
  }

  private createHemisphericLight(name: string, direction: Vector3, color: Color3, intensity: number): HemisphericLight {
    const light = new HemisphericLight(name, direction, this.scene!);
    light.diffuse = color;
    light.specular = color;
    light.intensity = intensity;
    return light;
  }

  public get currentScene(): Scene | null { return this.scene; }
  public get currentCamera(): ArcRotateCamera | null { return this.camera; }


  private showDebugLayer() {
    this.keydownListener = (event: KeyboardEvent) => {
      if (this.isInputFieldFocused(event)) return;
      if (event.key.toLowerCase() === 'i') this.toggleDebugLayer().catch(console.error);
    };
    window.addEventListener('keydown', this.keydownListener);
  }

  private isInputFieldFocused(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement;
    return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
  }

  private async toggleDebugLayer(): Promise<void> {
    if (!this.scene) return;
    if (this.scene.debugLayer?.isVisible()) {
      this.scene.debugLayer.hide();
      return;
    }

    if (!this.isInspectorLoaded) {
      try {
        await Promise.all([
          import("babylonjs-inspector"),
          import("@babylonjs/core/Debug/debugLayer"),
          import("@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent"),
          import("@babylonjs/core/Engines/Extensions/engine.query"),
        ]);

        this.isInspectorLoaded = true;
      } catch (error) {
        console.error("Failed to load Babylon Inspector:", error);
        return;
      }
    }
    await this.scene.debugLayer.show({
      enablePopup: true,
      enableClose: true,
      embedMode: true
    });
    removeDuplicateInspectorStyles("https://use.typekit.net/cta4xsb.css");
  }


  public dispose() {
    this.stopAnimation();
    if (this.keydownListener) window.removeEventListener('keydown', this.keydownListener);
    this.scene?.dispose();
    this.engine?.dispose();
    this.scene = null;
    this.engine = null;
    this.camera = null;
  }

  public ngOnDestroy() {
    this.dispose();
  }
}
