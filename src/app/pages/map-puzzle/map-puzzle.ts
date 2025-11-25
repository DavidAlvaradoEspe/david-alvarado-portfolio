import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
// Loaders
import "@babylonjs/loaders/glTF";

// Rendering Effects
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
import '@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderPipelineManager';
import '@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderEffect';
import '@babylonjs/core/Layers/effectLayerSceneComponent';

// Core Types & Logic
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Animation } from '@babylonjs/core/Animations/animation';
import { QuadraticEase } from '@babylonjs/core/Animations/easing';
import { PointerEventTypes, PointerInfo } from '@babylonjs/core/Events/pointerEvents';
import { Nullable } from '@babylonjs/core/types';
import { Observer } from '@babylonjs/core/Misc/observable';
import { Scene } from '@babylonjs/core/scene';

import { BabylonSceneService } from '../../@core/services/babylon-scene';
import { SplashScreenService } from '../../shared/components/splash-screen/splash-screen-service';
import {AssetContainer} from '@babylonjs/core/assetContainer';
import { PuzzleStore } from '../../@core/store/puzzle.store';

type SwipeDirection = 'left' | 'right' | 'up' | 'down';

const PUZZLE_CONFIG = {
  SEQUENCE: ['right', 'down', 'left'] as SwipeDirection[],
  SEQUENCE_DISPLAY: ['→', '↓', '←'],
  SWIPE_THRESHOLD: 50,
  FLOATING_SPEED: 2.5,
  FLOATING_AMPLITUDE: 0.002,
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

const ANIMATION_CONFIG = {
  PULSE_DURATION: 36,
  PULSE_FPS: 30,
  CAMERA_DELAY: 200,
  VIBRATE_DELAY: 150,
  VIBRATE_ERROR_DELAY: 250,
} as const;

@Component({
  selector: 'app-map-puzzle',
  templateUrl: './map-puzzle.html',
  styleUrls: ['./map-puzzle.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class MapPuzzleComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('renderCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  public puzzleStep = 0;
  public readonly SEQUENCE_DISPLAY = PUZZLE_CONFIG.SEQUENCE_DISPLAY;

  private isAnimating = false;
  private isVibrating = false;
  private startX = 0;
  private startY = 0;

  private loadedOuterMap: AssetContainer | null = null;
  private loadedInnerMap: AssetContainer | null = null;
  private artifactNode: Mesh | undefined = undefined;
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

  ngOnInit(): void {
    this.splashService.show = true;
    this.puzzleStore.setLoading(true);
  }

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.initBabylonScene().catch(console.error);
      }, 0);
    });
  }

  private async initBabylonScene(): Promise<void> {
    this.initializeScene();

    try {
      this.splashService.updateMessage("Loading Treasure Map");

      await this.loadInnerSphere();
      await this.loadOuterMapModel();

      this.setupInteraction();
      this.finalizeSceneSetup();
    } catch (error) {
      console.error('Failed to initialize treasure map:', error);
      this.splashService.updateMessage("Error Loading Map Data");
      setTimeout(() => this.splashService.hide(), 2000);
    }
  }

  private initializeScene(): void {
    const canvas = this.canvasRef.nativeElement;

    this.babylonService.initScene(canvas, {
      createEnvironmentTexture: true,
      createLights: true,
      allowCamControls: false,
      createGlowLayer: false
    }, {
      removeKeyBoardInputs: false,
      autoElevation: false,
      disablePanning: false,
    });
  }

  private async loadInnerSphere(): Promise<void> {
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

  private async loadOuterMapModel(): Promise<void> {
    // Removed progress callback since we are simplifying the splash screen
    this.loadedOuterMap = await this.babylonService.loadModel('assets/models/treasure_map.glb');

    this.loadedOuterMap.addAllToScene();

    this.artifactNode = this.babylonService.setCameraInitialTarget(
      false,
      true,
      true,
      this.loadedOuterMap,
      true,
      true
    );

    this.setupModel();
  }

  private finalizeSceneSetup(): void {
    this.ngZone.run(() => {
      this.puzzleStore.setLoading(false);
      // Small delay to let user see "Loaded" state if you wanted, or just hide immediately
      setTimeout(() => {
        this.splashService.hide();
      }, 500);
    });
    this.babylonService.startAnimation();
  }

  private setupModel(): void {
    if (!this.babylonService.currentScene || !this.artifactNode) return;
    this.startFloatingEffect();
  }

  private startFloatingEffect(): void {
    if (!this.babylonService.currentScene || !this.artifactNode) return;

    const scene = this.babylonService.currentScene;
    let time = 0;
    const floatSpeed = PUZZLE_CONFIG.FLOATING_SPEED;
    const floatAmplitude = PUZZLE_CONFIG.FLOATING_AMPLITUDE;
    const initialY = this.artifactNode.position.y;

    this.floatingObserver = scene.onBeforeRenderObservable.add(() => {
      if (!this.isAnimating && this.artifactNode) {
        time += 0.016 * floatSpeed;
        this.artifactNode.position.y = initialY + (Math.sin(time) * floatAmplitude);
      }
    });
  }

  private setupInteraction(): void {
    if (!this.babylonService.currentScene) return;
    this.attachPointerObserver();
  }

  private attachPointerObserver(): void {
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

  private detachPointerObserver(): void {
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

  private handleSwipe(direction: SwipeDirection): void {
    if (this.isAnimating || this.puzzleStore.isUnlocked()) return;

    this.isAnimating = true;
    this.detachPointerObserver();

    this.ngZone.run(() => {
      const expectedDirection = this.SEQUENCE[this.puzzleStep];
      if (direction === expectedDirection) {
        this.puzzleStep++;
        this.onCorrectSwipe();
        if (this.puzzleStep >= this.SEQUENCE.length) this.unlockPuzzle().catch(console.error);
      } else {
        this.puzzleStep = 0;
        this.onWrongSwipe();
      }
    });
  }

  private onCorrectSwipe(): void {
    if ('vibrate' in navigator && !this.isVibrating) {
      this.isVibrating = true;
      navigator.vibrate(100);
      setTimeout(() => this.isVibrating = false, ANIMATION_CONFIG.VIBRATE_DELAY);
    }

    if (!this.mapSphere?.material || !this.babylonService.currentScene) {
      this.resetAfterAnimation();
      return;
    }

    const mat = this.mapSphere.material as PBRMaterial;
    const scene = this.babylonService.currentScene;

    const pulseAnim = new Animation('greenPulse', 'emissiveIntensity', ANIMATION_CONFIG.PULSE_FPS, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    pulseAnim.setKeys([{ frame: 0, value: 0 }, { frame: 9, value: 2 }, { frame: 18, value: 0 }, { frame: 27, value: 2 }, { frame: ANIMATION_CONFIG.PULSE_DURATION, value: 0 }]);
    pulseAnim.setEasingFunction(new QuadraticEase());

    mat.emissiveColor = MATERIAL_CONFIG.FEEDBACK_COLORS.CORRECT;
    mat.emissiveIntensity = 0;

    const animatable = scene.beginDirectAnimation(mat, [pulseAnim], 0, ANIMATION_CONFIG.PULSE_DURATION, false);

    setTimeout(() => {
      const direction = this.SEQUENCE[this.puzzleStep - 1];
      this.babylonService.rotateCameraByDirection(direction);
    }, ANIMATION_CONFIG.CAMERA_DELAY);

    animatable.onAnimationEndObservable.addOnce(() => {
      mat.emissiveColor = new Color3(0, 0, 0);
      mat.emissiveIntensity = 1;
      this.resetAfterAnimation();
    });
  }

  private onWrongSwipe(): void {
    if ('vibrate' in navigator && !this.isVibrating) {
      this.isVibrating = true;
      navigator.vibrate([50, 100, 50]);
      setTimeout(() => this.isVibrating = false, ANIMATION_CONFIG.VIBRATE_ERROR_DELAY);
    }

    this.babylonService.shakeParentBox();

    if (!this.mapSphere?.material || !this.babylonService.currentScene) {
      setTimeout(() => {
        this.babylonService.resetCameraToInitialPosition();
        this.resetAfterAnimation();
      }, 200);
      return;
    }

    const mat = this.mapSphere.material as PBRMaterial;
    const scene = this.babylonService.currentScene;

    const pulseAnim = new Animation('redPulse', 'emissiveIntensity', ANIMATION_CONFIG.PULSE_FPS, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
    pulseAnim.setKeys([{ frame: 0, value: 0 }, { frame: 9, value: 2 }, { frame: 18, value: 0 }, { frame: 27, value: 2 }, { frame: ANIMATION_CONFIG.PULSE_DURATION, value: 0 }]);
    pulseAnim.setEasingFunction(new QuadraticEase());

    mat.emissiveColor = MATERIAL_CONFIG.FEEDBACK_COLORS.WRONG;
    mat.emissiveIntensity = 0;

    const animatable = scene.beginDirectAnimation(mat, [pulseAnim], 0, ANIMATION_CONFIG.PULSE_DURATION, false);

    setTimeout(() => this.babylonService.resetCameraToInitialPosition(), ANIMATION_CONFIG.CAMERA_DELAY);

    animatable.onAnimationEndObservable.addOnce(() => {
      mat.emissiveColor = new Color3(0, 0, 0);
      mat.emissiveIntensity = 1;
      this.resetAfterAnimation();
    });
  }

  private resetAfterAnimation(): void {
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
    if (this.artifactNode && this.babylonService.currentScene) {
      const anim = new Animation('celebrateRotation', 'rotation.y', 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
      anim.setKeys([{ frame: 0, value: this.artifactNode.rotation.y }, { frame: 60, value: this.artifactNode.rotation.y + Math.PI * 2 }]);
      this.artifactNode.animations = [anim];
      celebrationAnimatable = this.babylonService.currentScene.beginAnimation(this.artifactNode, 0, 60, true);
    }

    if (this.mapSphere) {
      // Pass navigation callback to execute during flash
      this.babylonService.createOrbExplosion(this.mapSphere, () => {
        if (celebrationAnimatable) {
          celebrationAnimatable.stop();
        }
        this.cleanupResources();
        this.transitionToGridRoom();
      }).then(() => {
        // Animation complete - cleanup already done
      });
    } else {
      if (celebrationAnimatable) {
        celebrationAnimatable.stop();
      }
      this.cleanupResources();
      this.transitionToGridRoom();
    }
  }

  private cleanupResources(): void {
    // Dispose all mesh and asset containers
    if (this.artifactNode) {
      this.artifactNode.dispose();
      this.artifactNode = undefined;
    }

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

  private transitionToGridRoom(): void {
    this.ngZone.run(() => {
      this.router.navigate(['/holographic-room']).catch(console.error);
    });
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private cleanup() {
    this.cleanupResources();
    this.babylonService.dispose();
  }
}
