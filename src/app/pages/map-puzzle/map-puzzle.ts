import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, NgZone, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import "@babylonjs/loaders/glTF";

import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
import '@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderPipelineManager';
import '@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderEffect';
import '@babylonjs/core/Layers/effectLayerSceneComponent';

import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

import { Animation } from '@babylonjs/core/Animations/animation';
import { QuadraticEase } from '@babylonjs/core/Animations/easing';

import { PointerEventTypes, PointerInfo } from '@babylonjs/core/Events/pointerEvents';
import { Observer } from '@babylonjs/core/Misc/observable';
import { Nullable } from '@babylonjs/core/types';

import { Scene } from '@babylonjs/core/scene';
import { AssetContainer } from '@babylonjs/core/assetContainer';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';

import { BabylonSceneService } from '@app/@core/services';
import { SplashScreenService } from '@app/shared/components/splash-screen/splash-screen-service';
import { PuzzleStore } from '@app/@core/store/puzzle.store';
import {TranslateDirective} from '@ngx-translate/core';


type SwipeDirection = 'left' | 'right' | 'up' | 'down';

const PUZZLE_CONFIG = {
  SEQUENCE: ['right'] as SwipeDirection[],
  SEQUENCE_DISPLAY: ['right'],
  SWIPE_THRESHOLD: 50,
  FLOATING_SPEED: 2.5,
  FLOATING_AMPLITUDE: 0.015,
} as const;

const MATERIAL_CONFIG = {
  INNER_SPHERE: {
    ALBEDO_COLOR: new Color3(0, 0, 0),
    METALLIC: 0.1,
    ROUGHNESS: 0.9,
  },
  GLOW_LAYER: {
    MAIN_TEXTURE_RATIO: 0.5,
    BLUR_KERNEL_SIZE: 32,
    INTENSITY: 2.0,
  },
  FEEDBACK_COLORS: {
    CORRECT: new Color3(0, 1, 0),
    WRONG: new Color3(1, 0, 0),
    UNLOCKED: Color3.FromHexString('#00ffff'),
  },
} as const;

const MAP_ANIMATION_CONFIG = {
  PULSE_DURATION: 36,
  PULSE_FPS: 30,
  CAMERA_DELAY: 200,
  VIBRATE_DELAY: 50,
  VIBRATE_ERROR_DELAY: 150,
} as const;

const ANIMATION_CONFIG = {
  ROTATION_FPS: 30,
  ROTATION_FRAMES: 15,
  RESET_FRAMES: 15,
  SHAKE_DURATION: 500,
  SHAKE_FREQUENCY: 50,
  SHAKE_INTENSITY: 0.005,
} as const;

@Component({
  selector: 'app-map-puzzle',
  templateUrl: './map-puzzle.html',
  styleUrls: ['./map-puzzle.scss'],
  standalone: true,
  imports: [CommonModule, TranslateDirective]
})
export class MapPuzzleComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('renderCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  public puzzleStep = signal<number>(0);
  public readonly SEQUENCE_DISPLAY = PUZZLE_CONFIG.SEQUENCE_DISPLAY;

  private isAnimating = false;
  private isVibrating = false;
  private startX = 0;
  private startY = 0;

  private loadedOuterMap: AssetContainer | null = null;
  private loadedInnerMap: AssetContainer | null = null;
  private mapSphere: AbstractMesh | null = null;
  private glowLayer: GlowLayer | null = null;
  private floatingObserver: Nullable<Observer<Scene>> | null = null;
  private pointerObserver: Nullable<Observer<PointerInfo>> | null = null;

  private readonly SEQUENCE: SwipeDirection[] = PUZZLE_CONFIG.SEQUENCE;
  private readonly SWIPE_THRESHOLD = PUZZLE_CONFIG.SWIPE_THRESHOLD;

  constructor(
    private readonly babylonService: BabylonSceneService,
    private readonly splashService: SplashScreenService,
    private readonly ngZone: NgZone,
    private readonly router: Router,
    public readonly puzzleStore: PuzzleStore
  ) {}

  ngOnInit() {
    this.splashService.show = true;
    this.puzzleStore.setLoading(true);
    this.injectStructuredData();
  }

  private injectStructuredData(): void {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Interactive Treasure Map Puzzle",
      "description": "Unlock David Alvarado's portfolio by solving an interactive 3D treasure map puzzle with swipe gestures",
      "author": {
        "@type": "Person",
        "name": "David Alvarado",
        "jobTitle": "Full Stack Developer"
      },
      "isPartOf": {
        "@type": "WebSite",
        "name": "David Alvarado Portfolio",
        "url": window.location.origin
      }
    });
    document.head.appendChild(script);
  }

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.initBabylonScene().catch(console.error)
      }, 0);
    });
  }

  private async initBabylonScene() {
    this.initializeScene();

    try {
      await this.loadInnerSphere();
      await this.loadOuterMapModel();

      this.setupInteraction();

      this.initializeCameraPosition();

      this.finalizeSceneSetup();
    } catch (error) {
      console.error('Failed to initialize treasure map:', error);
      this.splashService.updateMessage("Error Loading Map Data");
      setTimeout(() => this.splashService.hide(), 2000);
    }
  }

  private initializeScene() {
    const canvas = this.canvasRef.nativeElement;

    this.babylonService.initScene(canvas, {
      createEnvironmentTexture: true,
      createLights: false,
      allowCamControls: false,
      createGlowLayer: false
    }, {
      removeKeyBoardInputs: false,
      autoElevation: false,
      disablePanning: false,
    });
  }

  private initializeCameraPosition() {
    if(this.babylonService.currentCamera){
      this.babylonService.currentCamera.alpha = Math.PI;
      this.babylonService.currentCamera.beta = 0;
      this.babylonService.saveCameraInitialPosition();
    }
  }

  private async loadInnerSphere() {
    this.loadedInnerMap = await this.babylonService.loadModel('assets/models/inner_sphere.glb');
    this.loadedInnerMap.addAllToScene();
    this.mapSphere = this.loadedInnerMap.meshes[1];

    if (this.mapSphere && this.babylonService.currentScene) {
      const blackMat = new PBRMaterial("blackSphere", this.babylonService.currentScene);
      blackMat.albedoColor = MATERIAL_CONFIG.INNER_SPHERE.ALBEDO_COLOR;
      blackMat.metallic = MATERIAL_CONFIG.INNER_SPHERE.METALLIC;
      blackMat.roughness = MATERIAL_CONFIG.INNER_SPHERE.ROUGHNESS;
      blackMat.emissiveColor = new Color3(0, 0, 0);
      this.mapSphere.material = blackMat;

      this.glowLayer = new GlowLayer("glow", this.babylonService.currentScene, {
        mainTextureRatio: MATERIAL_CONFIG.GLOW_LAYER.MAIN_TEXTURE_RATIO,
        blurKernelSize: MATERIAL_CONFIG.GLOW_LAYER.BLUR_KERNEL_SIZE
      });
      this.glowLayer.intensity = MATERIAL_CONFIG.GLOW_LAYER.INTENSITY;
    }

    this.babylonService.setCameraInitialTarget(false, false, true, this.loadedInnerMap, false, false);
    this.babylonService.scaleMesh(this.loadedInnerMap.meshes[0], 1.03);
  }

  private async loadOuterMapModel(){

    this.loadedOuterMap = await this.babylonService.loadModel('assets/models/treasure_map.glb');

    this.loadedOuterMap.addAllToScene();

    this.babylonService.setCameraInitialTarget(
      false,
      true,
      true,
      this.loadedOuterMap,
      true,
      true
    );

    this.startFloatingEffect();
  }

  private finalizeSceneSetup() {
    this.ngZone.run(() => {
      this.puzzleStore.setLoading(false);
      setTimeout(() => {
        this.splashService.hide();
      }, 500);
    });
    this.babylonService.startAnimation();
  }

  private startFloatingEffect() {
    if (!this.babylonService.currentScene || !this.babylonService.parentBox || !this.loadedInnerMap) return;
    const coreGroup = new Mesh("coreGroup", this.babylonService.currentScene);
    this.babylonService.parentBox.parent = coreGroup;
    this.loadedInnerMap.meshes[0].parent = coreGroup;
    const scene = this.babylonService.currentScene;
    let time = 0;
    const floatSpeed = PUZZLE_CONFIG.FLOATING_SPEED;
    const floatAmplitude = PUZZLE_CONFIG.FLOATING_AMPLITUDE;
    const initialY = coreGroup.position.y;

    this.floatingObserver = scene.onBeforeRenderObservable.add(() => {
      if (!this.isAnimating && coreGroup) {
        time += 0.016 * floatSpeed;
        coreGroup.position.y = initialY + (Math.sin(time) * floatAmplitude);
      }
    });
  }

  private setupInteraction() {
    if (!this.babylonService.currentScene) return;
    this.attachPointerObserver();
  }

  private attachPointerObserver() {
    if (!this.babylonService.currentScene || this.pointerObserver) return;

    this.pointerObserver = this.babylonService.currentScene.onPointerObservable.add((pointerInfo) => {
      const eventType = pointerInfo.type;

      if (eventType === PointerEventTypes.POINTERDOWN) {
        this.startX = pointerInfo.event.clientX;
        this.startY = pointerInfo.event.clientY;
      }
      else if (eventType === PointerEventTypes.POINTERUP && this.startX !== 0) {
        const dx = pointerInfo.event.clientX - this.startX;
        const dy = pointerInfo.event.clientY - this.startY;

        const direction = this.detectSwipeDirection(dx, dy);
        if (direction) this.handleSwipe(direction);

        this.startX = 0;
        this.startY = 0;
      }
    });
  }

  private detachPointerObserver() {
    if (this.pointerObserver && this.babylonService.currentScene) {
      this.babylonService.currentScene.onPointerObservable.remove(this.pointerObserver);
      this.pointerObserver = null;
      this.startX = 0;
      this.startY = 0;
    }
  }

  private detectSwipeDirection(dx: number, dy: number): SwipeDirection | null {
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (absDx < this.SWIPE_THRESHOLD && absDy < this.SWIPE_THRESHOLD) return null;
    if (absDx > absDy) return dx > 0 ? 'right' : 'left';
    return dy > 0 ? 'down' : 'up';
  }

  private handleSwipe(direction: SwipeDirection) {
    if (this.isAnimating || this.puzzleStore.isUnlocked()) return;

    this.isAnimating = true;
    this.detachPointerObserver();

    this.ngZone.run(() => {
      const expectedDirection = this.SEQUENCE[this.puzzleStep()];
      if (direction === expectedDirection) {
        this.puzzleStep.set(this.puzzleStep()+1);
        this.onCorrectSwipe();
        if (this.puzzleStep() >= this.SEQUENCE.length) this.unlockPuzzle().catch(console.error);
      } else {
        this.puzzleStep.set(0);
        this.onWrongSwipe();
      }
    });
  }

  private onCorrectSwipe() {
    if ('vibrate' in navigator && !this.isVibrating) {
      this.isVibrating = true;
      navigator.vibrate(100);
      setTimeout(() => this.isVibrating = false, MAP_ANIMATION_CONFIG.VIBRATE_DELAY);
    }

    if (!this.mapSphere?.material || !this.babylonService.currentScene) {
      this.resetAfterAnimation();
      return;
    }

    const mat = this.mapSphere.material as PBRMaterial;
    const scene = this.babylonService.currentScene;

    const pulseAnim = new Animation('greenPulse', 'emissiveIntensity', MAP_ANIMATION_CONFIG.PULSE_FPS, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    pulseAnim.setKeys([{ frame: 0, value: 0 }, { frame: 9, value: 2 }, { frame: 18, value: 0 }, { frame: 27, value: 2 }, { frame: MAP_ANIMATION_CONFIG.PULSE_DURATION, value: 0 }]);
    pulseAnim.setEasingFunction(new QuadraticEase());

    mat.emissiveColor = MATERIAL_CONFIG.FEEDBACK_COLORS.CORRECT;
    mat.emissiveIntensity = 0;

    const animatable = scene.beginDirectAnimation(mat, [pulseAnim], 0, MAP_ANIMATION_CONFIG.PULSE_DURATION, false);

    setTimeout(() => {
      const direction = this.SEQUENCE[this.puzzleStep() - 1];
      this.rotateCameraByDirection(direction);
    }, MAP_ANIMATION_CONFIG.CAMERA_DELAY);

    animatable.onAnimationEndObservable.addOnce(() => {
      mat.emissiveColor = new Color3(0, 0, 0);
      mat.emissiveIntensity = 1;
      this.resetAfterAnimation();
    });
  }

  private onWrongSwipe() {
    if ('vibrate' in navigator && !this.isVibrating) {
      this.isVibrating = true;
      navigator.vibrate([50, 100, 50]);
      setTimeout(() => this.isVibrating = false, MAP_ANIMATION_CONFIG.VIBRATE_ERROR_DELAY);
    }

    this.shakeParentBox();

    if (!this.mapSphere?.material || !this.babylonService.currentScene) {
      setTimeout(() => {
        this.resetCameraToInitialPosition();
        this.resetAfterAnimation();
      }, 200);
      return;
    }

    const mat = this.mapSphere.material as PBRMaterial;
    const scene = this.babylonService.currentScene;

    const pulseAnim = new Animation('redPulse', 'emissiveIntensity', MAP_ANIMATION_CONFIG.PULSE_FPS, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    pulseAnim.setKeys([{ frame: 0, value: 0 }, { frame: 9, value: 2 }, { frame: 18, value: 0 }, { frame: 27, value: 2 }, { frame: MAP_ANIMATION_CONFIG.PULSE_DURATION, value: 0 }]);
    pulseAnim.setEasingFunction(new QuadraticEase());

    mat.emissiveColor = MATERIAL_CONFIG.FEEDBACK_COLORS.WRONG;
    mat.emissiveIntensity = 0;

    const animatable = scene.beginDirectAnimation(mat, [pulseAnim], 0, MAP_ANIMATION_CONFIG.PULSE_DURATION, false);

    setTimeout(() => this.resetCameraToInitialPosition(), MAP_ANIMATION_CONFIG.CAMERA_DELAY);

    animatable.onAnimationEndObservable.addOnce(() => {
      mat.emissiveColor = new Color3(0, 0, 0);
      mat.emissiveIntensity = 1;
      this.resetAfterAnimation();
    });
  }

  private resetAfterAnimation() {
    this.isAnimating = false;
    this.isVibrating = false;
    if (!this.puzzleStore.isUnlocked()) this.attachPointerObserver();
  }

  private async unlockPuzzle() {
    this.puzzleStore.unlockPuzzle();
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 200]);

    this.detachPointerObserver();
    if (this.floatingObserver && this.babylonService.currentScene) {
      this.babylonService.currentScene.onBeforeRenderObservable.remove(this.floatingObserver);
      this.floatingObserver = null;
    }

    if (this.mapSphere && this.mapSphere.material) {
      const mat = this.mapSphere.material as PBRMaterial;
      mat.emissiveColor = MATERIAL_CONFIG.FEEDBACK_COLORS.UNLOCKED;
      mat.emissiveIntensity = 2;
    }

    let celebrationAnimatable: any = null;
    if (this.babylonService.parentBox && this.babylonService.currentScene) {
      const anim = new Animation('celebrateRotation', 'rotation.y', 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
      anim.setKeys([{ frame: 0, value: this.babylonService.parentBox.rotation.y }, { frame: 60, value: this.babylonService.parentBox.rotation.y + Math.PI * 2 }]);
      this.babylonService.parentBox.animations = [anim];
      celebrationAnimatable = this.babylonService.currentScene.beginAnimation(this.babylonService.parentBox, 0, 60, true);
    }
      this.createFlashTransition(() => {
        if (celebrationAnimatable) {
          celebrationAnimatable.stop();
        }
        this.cleanupResources();
        this.transitionToGridRoom();
      }).then(() => {});
  }

  private cleanupResources() {

    if (this.mapSphere) {
      this.mapSphere.dispose();
      this.mapSphere = null;
    }

    if (this.glowLayer) {
      this.glowLayer.dispose();
      this.glowLayer = null;
    }

    if (this.loadedOuterMap) {
      this.loadedOuterMap.dispose();
      this.loadedOuterMap = null;
    }

    if (this.loadedInnerMap) {
      this.loadedInnerMap.dispose();
      this.loadedInnerMap = null;
    }

    // Remove observers
    if (this.floatingObserver && this.babylonService.currentScene) {
      this.babylonService.currentScene.onBeforeRenderObservable.remove(this.floatingObserver);
      this.floatingObserver = null;
    }

    this.detachPointerObserver();
  }

  private transitionToGridRoom() {
    this.ngZone.run(() => {
      this.router.navigate(['/holographic-room']).catch(console.error);
    });
  }

  public shakeParentBox() {
    const pBox = this.babylonService.parentBox;
    const scene = this.babylonService.currentScene;
    if (!pBox || !scene) return;
    const originalPosition = pBox.position.clone();
    const startTime = Date.now();

    const shakeObserver = scene.onBeforeRenderObservable.add(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= ANIMATION_CONFIG.SHAKE_DURATION) {
        this.resetShake(shakeObserver, originalPosition);
      } else {
        this.applyShakeOffset(elapsed, originalPosition);
      }
    });
  }

  private resetShake(observer: any, originalPosition: Vector3) {
    const pBox = this.babylonService.parentBox;
    const scene = this.babylonService.currentScene;

    if (!pBox || !scene) return;
    pBox.position.copyFrom(originalPosition);
    scene.onBeforeRenderObservable.remove(observer);
  }

  private applyShakeOffset(elapsed: number, originalPosition: Vector3) {
    const pBox = this.babylonService.parentBox;
    if (!pBox) return;
    const progress = elapsed / ANIMATION_CONFIG.SHAKE_DURATION;
    const amplitude = ANIMATION_CONFIG.SHAKE_INTENSITY * (1 - progress);
    const time = elapsed / 1000;
    const frequency = ANIMATION_CONFIG.SHAKE_FREQUENCY * Math.PI * 2;

    pBox.position.x = originalPosition.x + Math.sin(time * frequency) * amplitude;
    pBox.position.y = originalPosition.y + Math.cos(time * frequency) * amplitude * 0.7;
    pBox.position.z = originalPosition.z + Math.sin(time * frequency + Math.PI / 3) * amplitude * 0.5;
  }

  public createFlashTransition( onNavigate: () => void, color: Color3 = Color3.FromHexString('#020205')): Promise<void> {
    const scene = this.babylonService.currentScene;

    if (!scene) return Promise.resolve();

    return new Promise((resolve) => {
      if (!scene) return resolve();

      const flashPlane = MeshBuilder.CreatePlane("transitionFlash", { size: 500 }, scene);
      const camera = scene.activeCamera;

      if (camera) {
        flashPlane.parent = camera;
        flashPlane.position = new Vector3(0, 0, 5);
        flashPlane.renderingGroupId = 3;
      }

      const flashMaterial = new StandardMaterial("transitionFlashMaterial", scene);
      flashMaterial.emissiveColor = color;
      flashMaterial.disableLighting = true;
      flashMaterial.backFaceCulling = false;
      flashMaterial.alpha = 0;
      flashPlane.material = flashMaterial;
      flashPlane.isVisible = true;

      let elapsed = 0;
      const totalDuration = 2500;
      const flashStartTime = 0;
      const flashPeakTime = 1500;
      const navigationTime = 1700;
      const flashEndTime = 2500;
      let hasNavigated = false;

      const observer = scene.onBeforeRenderObservable.add(() => {
        elapsed += scene!.getEngine().getDeltaTime();

        if (elapsed >= navigationTime && !hasNavigated) {
          hasNavigated = true;
          onNavigate();
        }

        if (elapsed < flashStartTime) {
          flashMaterial.alpha = 0;
        } else if (elapsed < flashPeakTime) {
          const fadeInProgress = (elapsed - flashStartTime) / (flashPeakTime - flashStartTime);
          flashMaterial.alpha = fadeInProgress * fadeInProgress;
        } else if (elapsed < flashEndTime) {
          const fadeOutProgress = (elapsed - flashPeakTime) / (flashEndTime - flashPeakTime);
          flashMaterial.alpha = 1.0 - (fadeOutProgress * fadeOutProgress * fadeOutProgress);
        } else {
          flashMaterial.alpha = 0;
        }

        if (elapsed >= totalDuration) {
          if (observer) {
            scene?.onBeforeRenderObservable.remove(observer);
          }

          flashPlane.dispose();
          flashMaterial.dispose();

          resolve();
        }
      });
    });
  }

  public rotateCameraByDirection(direction: 'left' | 'right' | 'up' | 'down') {
    const camera = this.babylonService.currentCamera;
    const scene = this.babylonService.currentScene;
    if (!camera || !scene) return;
    const angle90 = Math.PI / 2;
    const { property, currentValue, targetValue } = this.calculateRotationTarget(direction, angle90, camera.alpha, camera.beta);
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
    const camera = this.babylonService.currentCamera;
    if (!camera) return;
    Animation.CreateAndStartAnimation(`cameraRotation_${property}`, camera, property, ANIMATION_CONFIG.ROTATION_FPS, ANIMATION_CONFIG.ROTATION_FRAMES, from, to, Animation.ANIMATIONLOOPMODE_CONSTANT);
  }


  public resetCameraToInitialPosition() {
    const camera = this.babylonService.currentCamera;
    if (!camera || !this.hasInitialCameraPosition()) return;
    this.animateCameraReset('alpha', this.babylonService.cameraInitialAlpha!);
    this.animateCameraReset('beta', this.babylonService.cameraInitialBeta!);
    this.animateCameraReset('radius', this.babylonService.cameraInitialRadius!);
  }

  private hasInitialCameraPosition(): boolean {
    return this.babylonService.cameraInitialAlpha !== null && this.babylonService.cameraInitialBeta !== null && this.babylonService.cameraInitialRadius !== null;
  }

  private animateCameraReset(property: string, targetValue: number) {
    const camera = this.babylonService.currentCamera;
    if (!camera) return;
    const currentValue = (camera as any)[property];
    Animation.CreateAndStartAnimation(`resetCamera_${property}`, camera, property, ANIMATION_CONFIG.ROTATION_FPS, ANIMATION_CONFIG.RESET_FRAMES, currentValue, targetValue, Animation.ANIMATIONLOOPMODE_CONSTANT);
  }

  private cleanup() {
    this.cleanupResources();
    this.babylonService.dispose();
  }

  ngOnDestroy() {
    this.cleanup();
  }


}
