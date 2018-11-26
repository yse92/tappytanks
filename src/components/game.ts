import * as BABYLON from 'babylonjs';
import { AddLabelToMesh } from './gui';
import Controls from './Controls';
import Field from './Field';

export default class Game {

  private _canvas: HTMLCanvasElement;
  private _engine: BABYLON.Engine;
  private _scene: BABYLON.Scene;
  private _camera: BABYLON.TargetCamera;
  private _light: BABYLON.Light;
  private _controls: Controls;

  private _cone: BABYLON.Mesh;

  constructor(canvasElement: string) {
    this._canvas = document.querySelector(canvasElement) as HTMLCanvasElement;
    this._engine = new BABYLON.Engine(this._canvas, true);
  }


  createScene(): void {
    this._scene = new BABYLON.Scene(this._engine);
    this._scene.actionManager = new BABYLON.ActionManager(this._scene);
    this._scene.debugLayer.show();

    this.createMainLight();
    this.createMainCone();
    this.createMainCamera();

    const field = new Field(10, 10, this._scene);

    // todo move to MoveController with controls creation etc.
    function collisionNormalizer(position: BABYLON.Vector3): BABYLON.Vector3 {
      const halfWidth = field.width / 2;
      if (position.x > halfWidth) {
        position.x = halfWidth;
      }
      if (position.x < -halfWidth) {
        position.x = -halfWidth;
      }

      const halfHeight = field.height / 2;
      if (position.z > halfHeight) {
        position.z = halfHeight;
      }
      if (position.z < -halfHeight) {
        position.z = -halfHeight;
      }

      return position;
    }

    this._controls = new Controls(this._scene, this._cone, collisionNormalizer);
  }

  doRender(): void {
    this._engine.runRenderLoop(() => {
      this._scene.render();
    });
    window.addEventListener('resize', () => {
      this._engine.resize();
    });
  }

  createMainCamera(): void {
    this._camera = new BABYLON.TargetCamera(
      'freeCamera-1',
      new BABYLON.Vector3(0, 15, 0),
      this._scene,
    );
    this._camera.setTarget(BABYLON.Vector3.Zero());
    this._camera.attachControl(this._canvas, false);
  }

  createMainLight(): void {
    this._light = new BABYLON.HemisphericLight(
      'hsLight-1',
      new BABYLON.Vector3(-50, 60, -50),
      this._scene,
    );
  }

  createMainCone(): void {
    this._cone = BABYLON.MeshBuilder.CreateCylinder(
      'cone', {
        diameterTop: 0,
        height: 1,
        tessellation: 96
      },
      this._scene);
    this._cone.position.y = 1;
    this._cone.rotation.x = -Math.PI/2;
  }

}