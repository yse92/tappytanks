import * as BABYLON from 'babylonjs';
import Field, { FieldControllerOpts } from './core/Field';
import MoveController from './control/MoveController';
import Player from './player/Player';
// @ts-ignore
import Stats from 'stats.js';

import PlayersController from './player/PlayersController';
import Net from './core/Net';

// todo
declare var process: any;

export default class Game {

  private _canvas: HTMLCanvasElement;
  private _engine: BABYLON.Engine;
  private _scene: BABYLON.Scene;
  private _camera: BABYLON.FollowCamera;
  private _light: BABYLON.Light;
  private _field: Field;

  private _mainPlayer: Player;
  private _moveController: MoveController;
  private playersCtrl: PlayersController;
  private net: Net;
  private stats: Stats;

  constructor(canvasElement: string) {
    this._canvas = document.querySelector(canvasElement) as HTMLCanvasElement;
    this._engine = new BABYLON.Engine(this._canvas, false, {antialias: false}, true);
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);

    this.init();
  }

  init(): void {
    this.createScene();
    this.doRender();
  }

  createScene(): void {
    this._scene = new BABYLON.Scene(this._engine);
    this._scene.actionManager = new BABYLON.ActionManager(this._scene);
    this._scene.debugLayer.show();

    this.createMainLight();
    this.createMainPlayer();
    this.createMainCamera(this._mainPlayer.model);
    this.playersCtrl = new PlayersController([], this._scene);

    this.createConnection();

  }

  // todo use as configured io and socket for whole app
  createConnection(): void {
    const url = `ws://${process.env.API_HOST}${process.env.API_PORT ? ':'+process.env.API_PORT : ''}`;

    // todo for testing deployment
    console.log(url);

    this.net = new Net({
      url,
      playersCtrl: this.playersCtrl,
      events: {
        onField: this.onField,
        onCreatePlayerSuccess: this.onCreatePlayerSuccess
      }
    });
  }

  doRender(): void {
    this._engine.runRenderLoop(() => {
      this._scene.render();
      this.stats.update();
    });
    window.addEventListener('resize', () => {
      this._engine.resize();
    });
  }

  onField = (field: FieldControllerOpts) => {
    this.playersCtrl.removeAll();
    this.createField({
      width: field.width,
      height: field.height,
      debug: field.debug,
      walls: field.walls,
      players: this.playersCtrl.getPlayers()
    });

    if (field.players) {
      field.players.forEach((p) => this.playersCtrl.addPlayer(p));
    }
  };

  onCreatePlayerSuccess = (player: any) => {
    console.log('create-player-success: ', player);
    this._mainPlayer.id = player.id;
    this._mainPlayer.setPosition(player.position);
    this._mainPlayer.setRotation(player.rotation);
    this._mainPlayer.changeColor(player.color);
    // todo set stat

    this._camera.dispose();
    this.createMainCamera(this._mainPlayer.model);
    this.createMoveController();
  };

  createField(options: FieldControllerOpts): void {
    if (this._field) {
      this._field.dispose();
      // @ts-ignore
      delete this._field;
    }

    this._field = new Field(options, this._scene);
  }

  createMainCamera(lockedTarget: BABYLON.Mesh): void {
    this._camera = new BABYLON.FollowCamera(
      'freeCamera-1',
      new BABYLON.Vector3(
        lockedTarget.position.x,
        lockedTarget.position.y + 2,
        lockedTarget.position.z),
      this._scene,
      lockedTarget
    );

    this._camera.rotationOffset = lockedTarget.rotation.z*180/Math.PI;
    this._camera.cameraAcceleration = 0.04;
    this._camera.radius = 6;
    this._camera.heightOffset = 3;

    // todo for testing
    (window as any).camera = this._camera;
  }

  createMainLight(): void {
    this._light = new BABYLON.HemisphericLight(
      'hsLight-1',
      new BABYLON.Vector3(-50, 60, -50),
      this._scene,
    );
  }

  createMainPlayer(): void {
    this._mainPlayer = new Player({
      position: new BABYLON.Vector3(0, 1, 0),
      rotation: new BABYLON.Vector3(-Math.PI / 2, 0, 0),
      color: '#ffffff',
      stat: { hp: 100, maxHp: 100},
      id: 'temp-id',
    }, this._scene);
  }

  createMoveController(): void {
    if (this._moveController) {
      this._moveController.dispose();
      // @ts-ignore
      this._moveController = null;delete this._moveController;
    }

    this._moveController = new MoveController(
      this._scene,
      this._field,
      this._mainPlayer,
      this._camera,
      this.net,
    );
  }

}
