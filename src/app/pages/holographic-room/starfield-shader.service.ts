import { Injectable } from '@angular/core';
import { Scene } from '@babylonjs/core/scene';
import { Effect } from '@babylonjs/core/Materials/effect';
import { Vector2 } from '@babylonjs/core/Maths/math.vector';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { STARFIELD_FRAGMENT_SHADER } from './shaders/starfield.fragment';

@Injectable({
  providedIn: 'root'
})
export class StarfieldShaderService {
  private starfieldMesh: Mesh | null = null;
  private starfieldMaterial: ShaderMaterial | null = null;
  private time = 0.0;
  private scene: Scene | null = null;

  /**
   * Initialize the starfield shader effect as a background sphere
   */
  initStarfieldEffect(scene: Scene, camera: Camera): Mesh | null {
    if (!scene || !camera) {
      console.error('Scene or camera is required for starfield effect');
      return null;
    }

    this.scene = scene;

    try {

      Effect.ShadersStore['starfieldFragmentShader'] = STARFIELD_FRAGMENT_SHADER;
      Effect.ShadersStore['starfieldVertexShader'] = `
        precision highp float;

        // Attributes
        attribute vec3 position;
        attribute vec2 uv;

        // Uniforms
        uniform mat4 worldViewProjection;

        // Varying
        varying vec2 vUV;

        void main(void) {
          gl_Position = worldViewProjection * vec4(position, 1.0);
          vUV = uv;
        }
      `;

      // Create a large sphere that will serve as the background
      this.starfieldMesh = MeshBuilder.CreateSphere(
        'starfieldBackground',
        { diameter: 500, segments: 32, sideOrientation: Mesh.BACKSIDE },
        scene
      );

      // Position it at the camera's location (it will follow the camera)
      this.starfieldMesh.parent = camera;
      this.starfieldMesh.position.set(0, 0, 0);

      // Set rendering group to render first (background)
      this.starfieldMesh.renderingGroupId = 0;
      this.starfieldMesh.isPickable = false;

      // Create shader material
      this.starfieldMaterial = new ShaderMaterial(
        'starfieldMaterial',
        scene,
        {
          vertex: 'starfield',
          fragment: 'starfield',
        },
        {
          attributes: ['position', 'uv'],
          uniforms: ['worldViewProjection', 'iResolution', 'iTime'],
        }
      );

      // Set initial uniforms
      const resolution = this.getResolution(scene);
      this.starfieldMaterial.setVector2('iResolution', resolution);
      this.starfieldMaterial.setFloat('iTime', this.time);

      // Disable backface culling to see the inside of the sphere
      this.starfieldMaterial.backFaceCulling = false;

      // Apply material to mesh
      this.starfieldMesh.material = this.starfieldMaterial;

      // Update shader uniforms every frame
      scene.onBeforeRenderObservable.add(() => {
        if (this.starfieldMaterial && this.scene) {
          this.time += 0.01;
          const currentResolution = this.getResolution(this.scene);
          this.starfieldMaterial.setVector2('iResolution', currentResolution);
          this.starfieldMaterial.setFloat('iTime', this.time);
        }
      });

      return this.starfieldMesh;
    } catch (error) {
      console.error('Failed to initialize starfield shader:', error);
      return null;
    }
  }

  /**
   * Get the rendering canvas resolution
   */
  private getResolution(scene: Scene): Vector2 {
    const canvas = scene.getEngine().getRenderingCanvas();
    if (!canvas) {
      return new Vector2(1920, 1080); // Default fallback
    }
    return new Vector2(canvas.width, canvas.height);
  }

  /**
   * Reset the time to restart the animation
   */
  resetTime(): void {
    this.time = 0.0;
  }

  /**
   * Set a specific time value
   */
  setTime(time: number): void {
    this.time = time;
  }

  /**
   * Get current time
   */
  getTime(): number {
    return this.time;
  }

  /**
   * Dispose the shader effect
   */
  dispose(): void {
    if (this.starfieldMaterial) {
      this.starfieldMaterial.dispose();
      this.starfieldMaterial = null;
    }

    if (this.starfieldMesh) {
      this.starfieldMesh.dispose();
      this.starfieldMesh = null;
    }

    this.time = 0.0;
    this.scene = null;
  }
}

