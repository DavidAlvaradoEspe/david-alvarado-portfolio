import { Injectable } from '@angular/core';

// --- CORE ---
import { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';

// --- MESHES ---
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';

// --- MATERIALS ---
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';



const SHIELD_CONFIG = {
  NEON_COLOR: new Color3(0.1, 1.0, 0.1),
  ROTATION_SPEED_Y: 0.001,
  ROTATION_SPEED_Z: 0.0005,
  STROKE_WIDTH: 0.08,
  TUBE_TESSELLATION: 8,
  SPHERE_SEGMENTS: 8,
  ARC_SEGMENTS: 32,
  DEFAULT_GLYPH_COUNT: 50,
  DEFAULT_RADIUS: 20,
  RADIUS_VARIATION: 4.0,
  MIN_RING_COUNT: 1,
  MAX_RING_COUNT: 3,
  BASE_RING_RADIUS: 0.8,
  RING_SPACING: 0.5,
  DOT_SCALE: 0.4,
  CONNECTOR_DOT_SCALE: 0.3,
  CONNECTOR_BASE_RADIUS: 0.6,
  MIN_LINE_LENGTH: 2.0,
  MAX_LINE_LENGTH: 4.0,
  MIN_GLYPH_SCALE: 0.2,
  MAX_GLYPH_SCALE: 0.8,
} as const;

@Injectable({
  providedIn: 'root'
})
export class ShieldSystemService {
  private shieldRoot: TransformNode | null = null;
  private neonMaterial: StandardMaterial | null = null;
  private scene: Scene | null = null;
  private isAnimating: boolean = false;

  constructor() {}

    public createShieldSystem(
    scene: Scene,
    glyphCount: number = SHIELD_CONFIG.DEFAULT_GLYPH_COUNT,
    radius: number = SHIELD_CONFIG.DEFAULT_RADIUS
  ): TransformNode {
    this.scene = scene;

    this.createNeonMaterial(scene);

    this.shieldRoot = this.generateSpaceHUD(glyphCount, radius, scene);

    return this.shieldRoot;
  }


  public startAnimation(): void {
    if (!this.scene || !this.shieldRoot || this.isAnimating) return;

    this.isAnimating = true;

    this.scene.registerBeforeRender(() => {
      if (this.shieldRoot && this.isAnimating) {
        this.shieldRoot.rotation.y += SHIELD_CONFIG.ROTATION_SPEED_Y;
      }
    });
  }


  public stopAnimation(): void {
    this.isAnimating = false;
  }


  public dispose(): void {
    this.stopAnimation();

    if (this.shieldRoot) {
      this.shieldRoot.dispose();
      this.shieldRoot = null;
    }

    if (this.neonMaterial) {
      this.neonMaterial.dispose();
      this.neonMaterial = null;
    }

    this.scene = null;
  }


  public updateRadius(newRadius: number): void {
    if (!this.scene || !this.shieldRoot) return;

    const glyphCount = this.shieldRoot.getChildren().length;
    this.dispose();
    this.createShieldSystem(this.scene, glyphCount, newRadius);
    this.startAnimation();
  }

  // ==================== PRIVATE METHODS ====================


  private createNeonMaterial(scene: Scene): void {
    this.neonMaterial = new StandardMaterial("neonMat", scene);
    this.neonMaterial.emissiveColor = SHIELD_CONFIG.NEON_COLOR;
    this.neonMaterial.diffuseColor = new Color3(0, 0, 0);
    this.neonMaterial.specularColor = new Color3(0, 0, 0);
    this.neonMaterial.alpha = 1;
  }


  private createArcPoints(
    radius: number,
    startAngle: number,
    endAngle: number,
    segments: number
  ): Vector3[] {
    const points: Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const theta = startAngle + (i / segments) * (endAngle - startAngle);
      points.push(new Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, 0));
    }
    return points;
  }


  private createStrokeMesh(points: Vector3[], width: number, scene: Scene): Mesh {
    const tube = MeshBuilder.CreateTube("stroke", {
      path: points,
      radius: width / 2,
      tessellation: SHIELD_CONFIG.TUBE_TESSELLATION,
      cap: Mesh.CAP_ALL,
      updatable: false
    }, scene);

    if (this.neonMaterial) {
      tube.material = this.neonMaterial;
    }

    return tube;
  }


  private createDot(scale: number, scene: Scene): Mesh {
    const dot = MeshBuilder.CreateSphere("dot", {
      diameter: 1,
      segments: SHIELD_CONFIG.SPHERE_SEGMENTS
    }, scene);

    dot.scaling = new Vector3(scale, scale, 0.1);

    if (this.neonMaterial) {
      dot.material = this.neonMaterial;
    }

    return dot;
  }


  private createConcentricGlyph(scene: Scene): TransformNode {
    const container = new TransformNode("glyphConcentric", scene);

    if (Math.random() > 0.2) {
      const dot = this.createDot(SHIELD_CONFIG.DOT_SCALE, scene);
      dot.parent = container;
    }

    const ringCount = Math.floor(Math.random() * SHIELD_CONFIG.MAX_RING_COUNT) + SHIELD_CONFIG.MIN_RING_COUNT;
    for (let i = 0; i < ringCount; i++) {
      const radius = SHIELD_CONFIG.BASE_RING_RADIUS + (i * SHIELD_CONFIG.RING_SPACING);
      const width = SHIELD_CONFIG.STROKE_WIDTH;

      let start = 0;
      let end = Math.PI * 2;

      if (Math.random() > 0.4) {
        start = Math.random() * Math.PI * 2;
        const gap = Math.random() * 1.5 + 0.5;
        end = start + (Math.PI * 2) - gap;
      }

      const points = this.createArcPoints(radius, start, end, SHIELD_CONFIG.ARC_SEGMENTS);
      const ring = this.createStrokeMesh(points, width, scene);
      ring.parent = container;
      ring.rotation.z = Math.random() * Math.PI * 2;
    }

    return container;
  }


  private createConnectorGlyph(scene: Scene): TransformNode {
    const container = new TransformNode("glyphConnector", scene);

    const points = this.createArcPoints(
      SHIELD_CONFIG.CONNECTOR_BASE_RADIUS,
      0,
      Math.PI * 2,
      SHIELD_CONFIG.ARC_SEGMENTS
    );
    const ring = this.createStrokeMesh(points, SHIELD_CONFIG.STROKE_WIDTH, scene);
    ring.parent = container;

    const lineLength = SHIELD_CONFIG.MIN_LINE_LENGTH +
                      Math.random() * (SHIELD_CONFIG.MAX_LINE_LENGTH - SHIELD_CONFIG.MIN_LINE_LENGTH);
    const linePoints = [
      new Vector3(SHIELD_CONFIG.CONNECTOR_BASE_RADIUS, 0, 0),
      new Vector3(SHIELD_CONFIG.CONNECTOR_BASE_RADIUS + lineLength, 0, 0)
    ];
    const line = this.createStrokeMesh(linePoints, SHIELD_CONFIG.STROKE_WIDTH, scene);
    line.parent = container;

    const dot = this.createDot(SHIELD_CONFIG.CONNECTOR_DOT_SCALE, scene);
    dot.position.x = SHIELD_CONFIG.CONNECTOR_BASE_RADIUS + lineLength;
    dot.parent = container;

    container.rotation.z = Math.random() * Math.PI * 2;

    return container;
  }

  private generateSpaceHUD(count: number, radiusFromCenter: number, scene: Scene): TransformNode {
    const rootNode = new TransformNode("shieldRoot", scene);

    for (let i = 0; i < count; i++) {
      const glyphType = Math.random();
      const glyphContainer = glyphType > 0.3
        ? this.createConcentricGlyph(scene)
        : this.createConnectorGlyph(scene);

      glyphContainer.parent = rootNode;

      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * 2 * Math.PI;

      const r = radiusFromCenter + (Math.random() * SHIELD_CONFIG.RADIUS_VARIATION);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      glyphContainer.position = new Vector3(x, y, z);

      glyphContainer.lookAt(Vector3.Zero());
      glyphContainer.rotation.x -= Math.PI / 2;

      const scale = SHIELD_CONFIG.MIN_GLYPH_SCALE +
                   Math.random() * (SHIELD_CONFIG.MAX_GLYPH_SCALE - SHIELD_CONFIG.MIN_GLYPH_SCALE);
      glyphContainer.scaling = new Vector3(scale, scale, scale);
    }

    return rootNode;
  }

  // ==================== GETTERS ====================

  public get shieldRootNode(): TransformNode | null {
    return this.shieldRoot;
  }

  public get isShieldAnimating(): boolean {
    return this.isAnimating;
  }
}

