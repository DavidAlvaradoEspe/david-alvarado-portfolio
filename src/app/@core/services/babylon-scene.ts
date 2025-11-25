import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene, SceneOptions } from "@babylonjs/core/scene";
import { FramingBehavior } from "@babylonjs/core/Behaviors/Cameras/framingBehavior";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { ISceneLoaderProgressEvent, LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import { AssetContainer } from '@babylonjs/core/assetContainer';
import { BoundingInfo } from '@babylonjs/core/Culling/boundingInfo';
import { EnvironmentHelper } from '@babylonjs/core/Helpers/environmentHelper';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Nullable } from '@babylonjs/core/types';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Animation } from '@babylonjs/core/Animations/animation';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
import {removeDuplicateInspectorStyles} from '../utils';
import { GPUParticleSystem } from '@babylonjs/core/Particles/gpuParticleSystem';
import {SphereParticleEmitter} from '@babylonjs/core';
import { ActionManager } from '@babylonjs/core/Actions/actionManager';
import { ExecuteCodeAction } from '@babylonjs/core/Actions/directActions';
import { CubicEase, EasingFunction } from '@babylonjs/core/Animations/easing';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';

// Side-effects required for Animation and Environment
import '@babylonjs/core/Animations/animatable';
import '@babylonjs/core/Materials/Textures/Loaders/envTextureLoader';
import '@babylonjs/core/Helpers/sceneHelpers';

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

const ANIMATION_CONFIG = {
  ROTATION_FPS: 60,
  ROTATION_FRAMES: 30,
  RESET_FRAMES: 30,
  SHAKE_DURATION: 250,
  SHAKE_FREQUENCY: 50,
  SHAKE_INTENSITY: 0.005,
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
  private envTexture = "/assets/textures/environmentSpecular.env";
  private isTransitioning = false;
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
  private cameraInitialAlpha: number | null = null;
  private cameraInitialBeta: number | null = null;
  private cameraInitialRadius: number | null = null;

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
      this.glowLayer.intensity = 1;
    }
    this.showDebugLayer();
  }

  private createEngine(canvas: HTMLCanvasElement) {

    this.ngZone.runOutsideAngular(() => {
      this.engine = new Engine(canvas, true, {
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
    this.saveCameraInitialPosition();
  }

  private setCameraRadiusLimits() {
    if (!this.camera) return;
    const radius = this.camera.radius;
    this.camera.lowerRadiusLimit = radius * CAMERA_CONFIG.RADIUS_LOWER_LIMIT_RATIO;
    this.camera.upperRadiusLimit = radius * CAMERA_CONFIG.RADIUS_UPPER_LIMIT_RATIO;
  }

  private saveCameraInitialPosition() {
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

  public rotateCameraByDirection(direction: 'left' | 'right' | 'up' | 'down') {
    if (!this.camera || !this.scene) return;
    const angle90 = Math.PI / 2;
    const { property, currentValue, targetValue } = this.calculateRotationTarget(direction, angle90, this.camera.alpha, this.camera.beta);
    this.animateCameraProperty(property, currentValue, targetValue);
  }

  private calculateRotationTarget(direction: string, angle90: number, currentAlpha: number, currentBeta: number) {
    switch (direction) {
      case 'right': return { property: 'alpha' as const, currentValue: currentAlpha, targetValue: currentAlpha - angle90 };
      case 'left': return { property: 'alpha' as const, currentValue: currentAlpha, targetValue: currentAlpha + angle90 };
      case 'up': return { property: 'beta' as const, currentValue: currentBeta, targetValue: Math.max(0.1, currentBeta + angle90) };
      case 'down': return { property: 'beta' as const, currentValue: currentBeta, targetValue: Math.min(Math.PI - 0.1, currentBeta - angle90) };
      default: return { property: 'alpha' as const, currentValue: 0, targetValue: 0 };
    }
  }

  private animateCameraProperty(property: 'alpha' | 'beta', from: number, to: number) {
    if (!this.camera) return;
    Animation.CreateAndStartAnimation(`cameraRotation_${property}`, this.camera, property, ANIMATION_CONFIG.ROTATION_FPS, ANIMATION_CONFIG.ROTATION_FRAMES, from, to, Animation.ANIMATIONLOOPMODE_CONSTANT);
  }

  public shakeParentBox() {
    if (!this.parentBox || !this.scene) return;
    const originalPosition = this.parentBox.position.clone();
    const startTime = Date.now();

    const shakeObserver = this.scene.onBeforeRenderObservable.add(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= ANIMATION_CONFIG.SHAKE_DURATION) {
        this.resetShake(shakeObserver, originalPosition);
      } else {
        this.applyShakeOffset(elapsed, originalPosition);
      }
    });
  }

  private resetShake(observer: any, originalPosition: Vector3) {
    if (!this.parentBox || !this.scene) return;
    this.parentBox.position.copyFrom(originalPosition);
    this.scene.onBeforeRenderObservable.remove(observer);
  }

  private applyShakeOffset(elapsed: number, originalPosition: Vector3) {
    if (!this.parentBox) return;
    const progress = elapsed / ANIMATION_CONFIG.SHAKE_DURATION;
    const amplitude = ANIMATION_CONFIG.SHAKE_INTENSITY * (1 - progress);
    const time = elapsed / 1000;
    const frequency = ANIMATION_CONFIG.SHAKE_FREQUENCY * Math.PI * 2;

    this.parentBox.position.x = originalPosition.x + Math.sin(time * frequency) * amplitude;
    this.parentBox.position.y = originalPosition.y + Math.cos(time * frequency) * amplitude * 0.7;
    this.parentBox.position.z = originalPosition.z + Math.sin(time * frequency + Math.PI / 3) * amplitude * 0.5;
  }

  public resetCameraToInitialPosition() {
    if (!this.camera || !this.hasInitialCameraPosition()) return;
    this.animateCameraReset('alpha', this.cameraInitialAlpha!);
    this.animateCameraReset('beta', this.cameraInitialBeta!);
    this.animateCameraReset('radius', this.cameraInitialRadius!);
  }

  private hasInitialCameraPosition(): boolean {
    return this.cameraInitialAlpha !== null && this.cameraInitialBeta !== null && this.cameraInitialRadius !== null;
  }

  private animateCameraReset(property: string, targetValue: number) {
    if (!this.camera) return;
    const currentValue = (this.camera as any)[property];
    Animation.CreateAndStartAnimation(`resetCamera_${property}`, this.camera, property, ANIMATION_CONFIG.ROTATION_FPS, ANIMATION_CONFIG.RESET_FRAMES, currentValue, targetValue, Animation.ANIMATIONLOOPMODE_CONSTANT);
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

  /**
   * Creates a "God of War" style release of energy orbs.
   * @param emitterMesh The mesh where orbs originate (the inner sphere)
   * @param onNavigate
   * @param color The color of the energy (Green for GoW health/solution)
   */
  public createOrbExplosion(emitterMesh: AbstractMesh, onNavigate: () => void, color: Color3 = Color3.FromHexString('#020205')): Promise<void> {
    if (!this.scene) return Promise.resolve();

    return new Promise((resolve) => {
      if (!this.scene) return resolve();

      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // ==================== PARTICLE SYSTEM ====================
      const particleCount = isMobile ? 1500 : 3000;
      let particleSystem: GPUParticleSystem | ParticleSystem;

      if (GPUParticleSystem.IsSupported) {
        particleSystem = new GPUParticleSystem("explosionParticles", { capacity: particleCount }, this.scene);
        particleSystem.activeParticleCount = particleCount;
      } else {
        particleSystem = new ParticleSystem("explosionParticles", isMobile ? 300 : 600, this.scene);
      }

      // Orb texture
      particleSystem.particleTexture = new Texture("https://www.babylonjs.com/assets/Flare.png", this.scene);
      particleSystem.emitter = emitterMesh;

      // Sphere emitter - explosion in all directions from center
      const sphereEmitter = new SphereParticleEmitter();
      sphereEmitter.radius = 0.1;
      sphereEmitter.radiusRange = 0;
      particleSystem.particleEmitterType = sphereEmitter;

      // Green orb colors - vibrant and glowing
      const orbColor = Color3.FromHexString('#00ff00'); // Bright green
      particleSystem.color1 = new Color4(orbColor.r * 3, orbColor.g * 3, orbColor.b * 3, 1);
      particleSystem.color2 = new Color4(orbColor.r * 2, orbColor.g * 2, orbColor.b * 2, 1);
      particleSystem.colorDead = new Color4(orbColor.r * 0.5, orbColor.g * 0.5, orbColor.b * 0.5, 0);

      // Small orbs
      particleSystem.minSize = 0.01;
      particleSystem.maxSize = 0.06;

      // Particle lifetime
      particleSystem.minLifeTime = 0.8;
      particleSystem.maxLifeTime = 1.2;
      particleSystem.emitRate = isMobile ? 4000 : 8000;
      particleSystem.blendMode = ParticleSystem.BLENDMODE_ADD;
      particleSystem.gravity = new Vector3(0, 0, 0);

      // Explosion outward
      particleSystem.minEmitPower = 6;
      particleSystem.maxEmitPower = 12;
      particleSystem.updateSpeed = 0.016;

      // Start emitting immediately
      particleSystem.start();

      // ==================== FLASH OVERLAY ====================
      const flashPlane = MeshBuilder.CreatePlane("transitionFlash", { size: 500 }, this.scene);
      const camera = this.scene.activeCamera;

      if (camera) {
        flashPlane.parent = camera;
        flashPlane.position = new Vector3(0, 0, 5);
        flashPlane.renderingGroupId = 3;
      }

      const flashMaterial = new StandardMaterial("transitionFlashMaterial", this.scene);
      flashMaterial.emissiveColor = color; // Cyan flash
      flashMaterial.disableLighting = true;
      flashMaterial.backFaceCulling = false;
      flashMaterial.alpha = 0;
      flashPlane.material = flashMaterial;
      flashPlane.isVisible = true;

      // ==================== SMOOTH ANIMATION ====================
      let elapsed = 0;
      const totalDuration = 2200;
      const particleStopTime = 700;
      const flashStartTime = 1200;
      const flashPeakTime = 1500;
      const navigationTime = 1600;
      const flashEndTime = 2200;
      let hasNavigated = false;

      const observer = this.scene.onBeforeRenderObservable.add(() => {
        elapsed += this.scene!.getEngine().getDeltaTime();

        // Stop emitting particles after brief burst (they'll continue flying for 3 seconds)
        if (elapsed >= particleStopTime) {
          particleSystem.emitRate = 0;
        }

        // Trigger navigation during flash (while screen is covered)
        if (elapsed >= navigationTime && !hasNavigated) {
          hasNavigated = true;
          onNavigate();
        }

        // Smooth continuous flash animation
        if (elapsed < flashStartTime) {
          // Before flash starts - 3 seconds of particle display
          flashMaterial.alpha = 0;
        } else if (elapsed < flashPeakTime) {
          // Fade in: 3000ms to 3300ms (300ms duration)
          const fadeInProgress = (elapsed - flashStartTime) / (flashPeakTime - flashStartTime);
          flashMaterial.alpha = fadeInProgress * fadeInProgress;
        } else if (elapsed < flashEndTime) {
          // Fade out: 3300ms to 4000ms (700ms duration)
          const fadeOutProgress = (elapsed - flashPeakTime) / (flashEndTime - flashPeakTime);
          // Smooth cubic ease-out to cover navigation
          flashMaterial.alpha = 1.0 - (fadeOutProgress * fadeOutProgress * fadeOutProgress);
        } else {
          // After flash ends
          flashMaterial.alpha = 0;
        }

        // Complete animation
        if (elapsed >= totalDuration) {
          if (observer) {
            this.scene?.onBeforeRenderObservable.remove(observer);
          }

          // Cleanup
          flashPlane.dispose();
          flashMaterial.dispose();

          resolve();

          // Dispose particles after they fade
          setTimeout(() => particleSystem.dispose(), 500);
        }
      });
    });
  }



  // --- NEW: ORBITAL NODES (THE CV SECTIONS) ---
  public createOrbitalNode(
    name: string,
    position: Vector3,
    colorHex: string,
    onClick: () => void
  ): AbstractMesh {
    if (!this.scene) throw new Error("Scene not initialized");

    const nodeGroup = new Mesh(name + "_group", this.scene);
    nodeGroup.position = position;

    // 1. The Planet (Sphere)
    const planet = MeshBuilder.CreateSphere(name, { diameter: 2, segments: 16 }, this.scene);
    planet.parent = nodeGroup;
    const mat = new StandardMaterial(name + "_mat", this.scene);
    mat.emissiveColor = Color3.FromHexString(colorHex);
    mat.alpha = 0.8;
    planet.material = mat;

    // 2. Atmosphere (Inner Glow)
    const atmo = MeshBuilder.CreateSphere(name + "_atmo", { diameter: 1.5, segments: 16 }, this.scene);
    atmo.parent = nodeGroup;
    const atmoMat = new StandardMaterial(name + "_atmoMat", this.scene);
    atmoMat.emissiveColor = Color3.FromHexString(colorHex);
    atmoMat.alpha = 0.3;
    atmo.material = atmoMat;

    planet.isPickable = true;
    nodeGroup.isPickable = false;

    planet.actionManager = new ActionManager(this.scene);
    planet.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
        if (!this.isTransitioning) onClick();
      })
    );

    // Setup hover effect with orange glow
    this.setupConstellationHoverEffect(planet, atmo, colorHex);

    // 4. Floating Label
    this.createHolographicLabel(name, nodeGroup, colorHex);

    // 5. Connection Beam (Laser to Center)
    this.createConnectionBeam(Vector3.Zero(), position, colorHex);

    // NO ROTATION - Orbital planets should be static
    // Only the central planet rotates

    return nodeGroup;
  }

  // --- HOVER EFFECT FOR CV CONSTELLATIONS ---
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
    if (!planet.actionManager) {
      planet.actionManager = new ActionManager(this.scene!);
    }

    const originalColor = Color3.FromHexString(originalColorHex);
    const hoverColor = Color3.FromHexString("#FF8C00"); // Dark Orange for hover
    const brightHoverColor = Color3.FromHexString("#FFA500"); // Bright Orange

    // Store original materials
    const planetMat = planet.material as StandardMaterial;
    const atmoMat = atmosphere.material as StandardMaterial;

    // Mouse ENTER - Change to orange glow
    planet.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
        if (!this.isTransitioning) {
          // Change planet to bright orange
          planetMat.emissiveColor = brightHoverColor;

          // Change atmosphere to orange glow
          atmoMat.emissiveColor = hoverColor;
        }
      })
    );

    // Mouse LEAVE - Restore original color
    planet.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
        // Restore original colors
        planetMat.emissiveColor = originalColor;
        atmoMat.emissiveColor = originalColor;
      })
    );
  }

  // --- NEW: LASER BEAMS ---
  private createConnectionBeam(start: Vector3, end: Vector3, _colorHex: string) {
    // Create the line mesh
    const points = [start, end];
    const line = MeshBuilder.CreateLines("beam", { points: points }, this.scene);
    line.color = Color3.FromHexString("#00FF00"); // Green for all connection lines
    line.alpha = 0.3;
    line.isPickable = false;
  }

  // --- NEW: 3D TEXT LABELS ---
  private createHolographicLabel(text: string, parent: AbstractMesh, _colorHex: string) {
    const planeWidth = 12;
    const planeHeight = 3;
    const plane = MeshBuilder.CreatePlane("label", { width: planeWidth, height: planeHeight }, this.scene);
    plane.parent = parent;

    // Position slightly below
    plane.position.y = -2.8;
    plane.billboardMode = Mesh.BILLBOARDMODE_ALL; // Always face camera
    plane.isPickable = false;

    // Create VERY HIGH RESOLUTION dynamic texture for maximum sharpness
    const dt = new DynamicTexture("dynamic texture", { width: 2048, height: 512 }, this.scene!);
    dt.hasAlpha = true;

    const ctx = dt.getContext();

    // Clear with transparency
    ctx.clearRect(0, 0, 2048, 512);

    // Bright, high-contrast colors for maximum legibility
    const mainColor = "#ffffff"; // Pure white for core text
    const blueGlow = "#4da6ff"; // Bright blue glow
    const darkOutline = "#000000"; // Pure black outline for maximum contrast

    // Clean, modern font - larger size
    const fontSize = 140; // Much larger for better readability
    ctx.font = `700 ${fontSize}px "Segoe UI", "Century Gothic", "Futura", "Trebuchet MS", sans-serif`;

    // Center the text
    const textMetrics = ctx.measureText(text.toUpperCase());
    const x = (2048 - textMetrics.width) / 2;
    const y = 280;

    // LAYER 1: Soft blue outer glow
    ctx.shadowColor = blueGlow;
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = blueGlow;
    ctx.fillText(text.toUpperCase(), x, y);

    // LAYER 2: Medium blue glow
    ctx.shadowBlur = 18;
    ctx.fillText(text.toUpperCase(), x, y);

    // LAYER 3: Strong black outline for definition
    ctx.shadowBlur = 0;
    ctx.lineWidth = 8; // Thick outline for crisp edges
    ctx.strokeStyle = darkOutline;
    ctx.strokeText(text.toUpperCase(), x, y);

    // LAYER 4: Inner blue glow
    ctx.shadowBlur = 12;
    ctx.shadowColor = blueGlow;
    ctx.fillStyle = blueGlow;
    ctx.fillText(text.toUpperCase(), x, y);

    // LAYER 5: Bright white core (most important for legibility)
    ctx.shadowBlur = 6;
    ctx.shadowColor = "#ffffff";
    ctx.fillStyle = mainColor; // Pure white
    ctx.fillText(text.toUpperCase(), x, y);

    // LAYER 6: Extra bright center highlight
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text.toUpperCase(), x, y);

    dt.update();

    const mat = new StandardMaterial("labelMat", this.scene!);
    mat.diffuseTexture = dt;
    mat.emissiveColor = Color3.FromHexString("#ffffff"); // White emission
    mat.emissiveColor.scale(1.3); // Bright emission
    mat.opacityTexture = dt;
    mat.alpha = 1.0;
    mat.disableLighting = true;
    mat.backFaceCulling = false;

    plane.material = mat;

    // Exclude from glow layer
    if (this.glowLayer) {
      this.glowLayer.addExcludedMesh(plane);
    }
  }

  // --- UTILS ---
  public flyToMesh(targetMesh: AbstractMesh, radius: number = 4, onComplete?: () => void) {
    if (!this.scene || !this.camera || this.isTransitioning) return;

    this.isTransitioning = true;
    const frameRate = 60;
    const duration = 120;

    // Use absolute position clone to ensure we target the world space coord
    const targetPos = targetMesh.absolutePosition.clone();

    const animRadius = new Animation("zoom", "radius", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    const animTarget = new Animation("move", "target", frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);

    const easing = new CubicEase();
    easing.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    [animRadius, animTarget].forEach(a => a.setEasingFunction(easing));

    animRadius.setKeys([{ frame: 0, value: this.camera.radius }, { frame: duration, value: radius }]);
    animTarget.setKeys([{ frame: 0, value: this.camera.target }, { frame: duration, value: targetPos }]);

    this.scene.beginDirectAnimation(this.camera, [animRadius, animTarget], 0, duration, false, 1, () => {
      this.isTransitioning = false;
      if (onComplete) onComplete();
    });
  }

  public resetCameraView(onComplete?: () => void) {
    if (!this.scene || !this.camera) return;

    this.isTransitioning = true;
    const frameRate = 60;
    const duration = 90;

    const animRadius = new Animation("zoomOut", "radius", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    const animTarget = new Animation("resetTarget", "target", frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);

    const easing = new CubicEase();
    easing.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    [animRadius, animTarget].forEach(a => a.setEasingFunction(easing));

    animRadius.setKeys([{ frame: 0, value: this.camera.radius }, { frame: duration, value: 40 }]); // Increased from 25 to 40 for better overview
    animTarget.setKeys([{ frame: 0, value: this.camera.target }, { frame: duration, value: Vector3.Zero() }]);

    this.scene.beginDirectAnimation(this.camera, [animRadius, animTarget], 0, duration, false, 1, () => {
      this.isTransitioning = false;
      if (onComplete) onComplete();
    });
  }


  public ngOnDestroy() {
    this.dispose();
  }
}
