import { Injectable } from '@angular/core';

import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { ParticleSystem } from '@babylonjs/core/Particles/particleSystem';
import '@babylonjs/core/Particles/particleSystemComponent';

const NEBULA_CONFIG = {
  FOG_DENSITY: 0.008,
  FOG_COLOR: new Color3(0.01, 0.02, 0.01),
  TEXTURE_SIZE: 64,
  STARS_COUNT: 2000,
  STARS_MIN_SIZE: 0.2,
  STARS_MAX_SIZE: 0.8,
  STARS_COLOR_1: new Color4(0.5, 1.0, 0.5, 1.0),
  STARS_COLOR_2: new Color4(0.2, 0.8, 0.2, 1.0),
  STARS_EMIT_BOX_MIN: new Vector3(-100, -100, -100),
  STARS_EMIT_BOX_MAX: new Vector3(100, 100, 100),
  NEBULA_COUNT: 200,
  NEBULA_MIN_SIZE: 40.0,
  NEBULA_MAX_SIZE: 80.0,
  NEBULA_COLOR_1: new Color4(0.1, 0.4, 0.1, 0.05),
  NEBULA_COLOR_2: new Color4(0.0, 0.2, 0.0, 0.02),
  NEBULA_EMIT_BOX_MIN: new Vector3(-80, -80, -80),
  NEBULA_EMIT_BOX_MAX: new Vector3(80, 80, 80),
  PARTICLE_LIFETIME: 10800, // in seconds (3 hours)
  ENABLE_TEXTURE_REUSE: true,
} as const;

@Injectable({
  providedIn: 'root'
})
export class NebulaBackgroundService {
  private starsSystem: ParticleSystem | null = null;
  private nebulaSystem: ParticleSystem | null = null;
  private particleTexture: DynamicTexture | null = null;
  private scene: Scene | null = null;

  constructor() {}

  public createNebulaBackground(
    scene: Scene,
    enableFog: boolean = true,
    starsCount?: number,
    nebulaCount?: number
  ): void {
    this.scene = scene;

    if (enableFog) {
      this.setupFog(scene);
    }

    if (!this.particleTexture || !NEBULA_CONFIG.ENABLE_TEXTURE_REUSE) {
      this.particleTexture = this.createParticleTexture(scene);
    }

    this.createStarsSystem(scene, starsCount);
    this.createNebulaSystem(scene, nebulaCount);
  }

  public startSystems(): void {
    if (this.starsSystem) {
      this.starsSystem.start();
    }
    if (this.nebulaSystem) {
      this.nebulaSystem.start();
    }
  }

  public stopSystems(): void {
    if (this.starsSystem) {
      this.starsSystem.stop();
    }
    if (this.nebulaSystem) {
      this.nebulaSystem.stop();
    }
  }

  public dispose(): void {
    this.stopSystems();

    if (this.starsSystem) {
      this.starsSystem.dispose();
      this.starsSystem = null;
    }

    if (this.nebulaSystem) {
      this.nebulaSystem.dispose();
      this.nebulaSystem = null;
    }

    if (this.particleTexture) {
      this.particleTexture.dispose();
      this.particleTexture = null;
    }

    this.scene = null;
  }

  private setupFog(scene: Scene): void {
    scene.fogMode = Scene.FOGMODE_EXP;
    scene.fogDensity = NEBULA_CONFIG.FOG_DENSITY;
    scene.fogColor = NEBULA_CONFIG.FOG_COLOR;
  }

  private createParticleTexture(scene: Scene): DynamicTexture {
    const dynamicTexture = new DynamicTexture(
      "nebulaParticleTexture",
      NEBULA_CONFIG.TEXTURE_SIZE,
      scene,
      true
    );

    const ctx = dynamicTexture.getContext();
    const size = dynamicTexture.getSize();
    const center = size.width / 2;

    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.5)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size.width, size.height);
    dynamicTexture.update();

    return dynamicTexture;
  }

  private createStarsSystem(scene: Scene, count?: number): void {
    const particleCount = count ?? NEBULA_CONFIG.STARS_COUNT;

    this.starsSystem = new ParticleSystem("stars", particleCount, scene);
    this.starsSystem.particleTexture = this.particleTexture;
    this.starsSystem.emitter = Vector3.Zero();

    this.starsSystem.minEmitBox = NEBULA_CONFIG.STARS_EMIT_BOX_MIN;
    this.starsSystem.maxEmitBox = NEBULA_CONFIG.STARS_EMIT_BOX_MAX;

    this.starsSystem.color1 = NEBULA_CONFIG.STARS_COLOR_1;
    this.starsSystem.color2 = NEBULA_CONFIG.STARS_COLOR_2;
    this.starsSystem.colorDead = new Color4(0, 0, 0, 0);

    this.starsSystem.minSize = NEBULA_CONFIG.STARS_MIN_SIZE;
    this.starsSystem.maxSize = NEBULA_CONFIG.STARS_MAX_SIZE;

    this.starsSystem.minLifeTime = NEBULA_CONFIG.PARTICLE_LIFETIME * 60 * this.starsSystem.updateSpeed;
    this.starsSystem.maxLifeTime = this.starsSystem.minLifeTime;

    this.starsSystem.emitRate = 0;
    this.starsSystem.manualEmitCount = particleCount;
    this.starsSystem.blendMode = ParticleSystem.BLENDMODE_ADD;
  }

  private createNebulaSystem(scene: Scene, count?: number): void {
    const particleCount = count ?? NEBULA_CONFIG.NEBULA_COUNT;

    this.nebulaSystem = new ParticleSystem("nebula", particleCount, scene);
    this.nebulaSystem.particleTexture = this.particleTexture;
    this.nebulaSystem.emitter = Vector3.Zero();

    this.nebulaSystem.minEmitBox = NEBULA_CONFIG.NEBULA_EMIT_BOX_MIN;
    this.nebulaSystem.maxEmitBox = NEBULA_CONFIG.NEBULA_EMIT_BOX_MAX;

    this.nebulaSystem.color1 = NEBULA_CONFIG.NEBULA_COLOR_1;
    this.nebulaSystem.color2 = NEBULA_CONFIG.NEBULA_COLOR_2;
    this.nebulaSystem.colorDead = new Color4(0, 0, 0, 0);

    this.nebulaSystem.minSize = NEBULA_CONFIG.NEBULA_MIN_SIZE;
    this.nebulaSystem.maxSize = NEBULA_CONFIG.NEBULA_MAX_SIZE;


    this.nebulaSystem.minLifeTime = NEBULA_CONFIG.PARTICLE_LIFETIME * 60 * this.nebulaSystem.updateSpeed;
    this.nebulaSystem.maxLifeTime = this.nebulaSystem.minLifeTime;

    this.nebulaSystem.emitRate = 0;
    this.nebulaSystem.manualEmitCount = particleCount;
    this.nebulaSystem.blendMode = ParticleSystem.BLENDMODE_ADD;

    this.nebulaSystem.minInitialRotation = 0;
    this.nebulaSystem.maxInitialRotation = Math.PI * 2;
  }

  public get starsParticleSystem(): ParticleSystem | null {
    return this.starsSystem;
  }

  public get nebulaParticleSystem(): ParticleSystem | null {
    return this.nebulaSystem;
  }
}

