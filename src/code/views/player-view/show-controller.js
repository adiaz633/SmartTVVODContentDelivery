import { PlayMng } from "src/code/managers/play-mng";
import { AppStore } from "src/code/managers/store/app-store";
import { ViewMng, viewTypeNames } from "src/code/managers/view-mng";

/**
 * Controla mostrar los controles sobre el player dependiendo si se ha ha
 * reproducido el primer frame
 */
export class ShowController {
  /**
   *
   * @param {PlayerView} playerView
   * @param {Boolean=} avoidShowControllerOnFirstFrame
   */
  constructor(playerView, avoidShowControllerOnFirstFrame = false) {
    /**
     * @private
     * @type {ShowControllerFunction}
     */
    this._listener;

    /**
     * @private
     * @type {boolean}
     */
    this._firstFrameWasPlayed = false;

    /**
     * En algunos casos particulares se puede bloquear que no muestre
     * los controles cuando entremos al player.
     * @private
     * @type {boolean}
     */
    this.avoidShowControllerOnFirstFrame = avoidShowControllerOnFirstFrame;

    /**
     * @private
     * @type {EventCleanupFunction[]}
     */
    this._handlers = [];

    /**
     * @private
     * @type {PlayerView}
     */
    this._playerView = playerView;

    this._init();
  }

  /**
   * Devuelve si se ha reproducido el primer frame
   */
  get firstFrameWasPlayed() {
    return this._firstFrameWasPlayed;
  }

  set firstFrameWasPlayed(newFirstFrame) {
    this._firstFrameWasPlayed = newFirstFrame;
  }

  /**
   * @private
   */
  _init() {
    this._handlers = [
      PlayMng.instance.on("player_firstFrameOnDisplay", this._onFirstFrameOnDisplay.bind(this)),
      PlayMng.instance.on("player_reachedEnd", this._onReachedEnd.bind(this)),
    ];
  }

  /**
   * @private
   */
  _onFirstFrameOnDisplay() {
    this._firstFrameWasPlayed = true;
    /*
    const { opts } = PlayMng.instance.opts;
    const { playInfo } = opts.playInfo;
    const { isBingeWatching } = playInfo.isBingeWatching;
    */
    if (typeof this._listener === "function") {
      try {
        if (ViewMng.instance.active.type !== viewTypeNames.PLAYER_VIEW || this.avoidShowControllerOnFirstFrame) {
          this.avoidShowControllerOnFirstFrame = false;
          return;
        }
        this._listener.apply(this);
        ViewMng.instance.signalReady(this._playerView);
      } catch (error) {
        console.error(`ShowController._onFirstFrameOnDisplay::error ${error.message}`);
      }
    }
  }

  /**
   * @private
   */
  _onReachedEnd() {
    this._firstFrameWasPlayed = false;
  }

  /**
   * Limpia la clase
   */
  cleanUp() {
    this._listener = undefined;
    this._firstFrameWasPlayed = false;
    this._handlers.forEach((fn) => {
      fn.apply(this);
    });
  }

  /**
   * Ejecuta la funcion _fn_ cuando se dispara un first frame on display o
   * si ya se ha producdo el evento _FFOD_ se invoca de inmediato
   * @param {ShowControllerFunction} showFunction
   */
  showOnPlayEvent(showFunction) {
    if (!this._listener) {
      this._listener = showFunction;
    }

    if (this.firstFrameWasPlayed) {
      setTimeout(() => this._onFirstFrameOnDisplay(), 200);
    }
  }
}

/**
 * @callback ShowControllerFunction
 * @returns {void}
 */

/**
 * @callback EventCleanupFunction
 * @returns {void}
 */

/**
 * @typedef {import("./player-view").PlayerView} PlayerView
 */
