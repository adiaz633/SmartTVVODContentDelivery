// @ts-check

import { SECOND } from "src/code/js/time-utils";
import { PlayMng } from "src/code/managers/play-mng";
import { AppStore } from "src/code/managers/store/app-store";

import * as PLAYER_REFS from "./player-refs";

/**
 * Controla mostrar los controles sobre el player dependiendo si se ha ha
 * reproducido el primer frame
 */
export class PlayerScroller {
  /**
   *
   * @param {import("src/code/views/player-view/player-view").PlayerView} playerView
   */
  constructor(playerView) {
    /**
     * @private
     * @type {boolean}
     */
    this._isShowing = false;

    /**
     * @private
     * @type {boolean}
     */
    this._isAllowed = true;

    /**
     * @private
     * @type {boolean}
     */
    this._isPaused = false;

    /**
     * @private
     * @type {import("src/code/views/player-view/player-view").PlayerView}
     */
    this._playerView = playerView;

    /**
     * Array de saltos de tiempos
     * @private
     * @type {Array}
     */
    this._playerScrollSequence = [15, 15, 30, 30, 60, 90, 120, 300];

    /** @private */
    this._playerScrollSequenceTimeout = 2000;

    /** @private */
    this._currentStep = 0;

    /** @private */
    this._prevTime = 0;

    /** @private */
    this._prevDirection = undefined;

    /** @private */
    this._timeoutScroller = null;

    /**
     * @private
     * @type {boolean}
     */
    this._isScrollingfromLive = false;

    this._init();
  }

  /** @private */
  _init() {
    // @ts-ignore
    const context = AppStore.wsData.getContext();
    const playerScrollSequenceTimeout = context["playerScrollSequenceTimeout"];
    if (playerScrollSequenceTimeout) {
      this._playerScrollSequenceTimeout = Number(playerScrollSequenceTimeout);
    }
    const playerScrollSequence = context["playerScrollSequence"];
    if (playerScrollSequence) {
      this._playerScrollSequence = playerScrollSequence.split(",").map(Number);
    }
  }

  /**
   * Limpia la clase
   */
  cleanUp() {}

  /**
   * Devuelve si se está mostrando
   */
  get isShowing() {
    return this._isShowing;
  }

  /**
   * Cuando se pulsa una flecha
   * @param {PlayerScrollDirection} direction
   */
  move(direction) {
    if (AppStore.yPlayerCommon.isLive() && !AppStore.yPlayerCommon.isDiferido()) this._isScrollingfromLive = true;
    if (this._playerView.isLive && AppStore.yPlayerCommon.getTime2Live() === 0 && direction === "right") return;
    this._playerView.opts.eventBus.emit(PLAYER_REFS.EVENTOS.SALTOS_DISCRETOS_ON);
    if (this._prevDirection === undefined) {
      this._playerView.opts.playerInfoComp.showProgress();
      this._playerView.opts.playerInfoComp.hide();
      this._playerView.opts.playerInfoComp.hideArrow();
      this._playerView.opts.playerActionsComp?.hide();
    }
    if (direction !== this._prevDirection) {
      this._currentStep = 0;
    }
    const now = Date.now();
    const difTime = now - this._prevTime;
    if (difTime < 500) {
      if (this._currentStep < this._playerScrollSequence.length - 1) {
        this._currentStep++;
      }
    }

    const seconds = this._playerScrollSequence[this._currentStep];
    if (direction === "right") {
      this._playerView.setScreenStatus("scroller-ffx", { seconds });
    } else {
      this._playerView.setScreenStatus("scroller-rwx", { seconds });
    }

    this._skip(direction);

    this._prevTime = now;
    this._prevDirection = direction;
    this._restartTimeoutScroller();
  }

  /**
   * @private
   * @param {PlayerScrollDirection} direction
   */
  async _skip(direction) {
    const step = this._playerScrollSequence[this._currentStep];
    const jump = 1000 * this._playerScrollSequence[this._currentStep];
    const sign = direction === "right" ? 1 : -1;
    const newPosition = this._playerView._time + sign * jump;
    AppStore.StackManager.isJUMP = true;

    try {
      const sendAUD = direction === "right" ? "ffwdstep" : "rwdstep";
      AppStore.tfnAnalytics.player(sendAUD, { evt: 2, step, pos: newPosition, stack: true });

      if (this._playerView.isLive) {
        if (
          !this._isScrollingfromLive &&
          AppStore.yPlayerCommon.getTime2Live() === 0 &&
          !AppStore.yPlayerCommon.isDiferido() &&
          sign === -1
        ) {
          await PlayMng.instance.playerView.verDiferido();
        }
        const time2Live = AppStore.yPlayerCommon.getTime2Live() - sign * jump;

        AppStore.yPlayerCommon.setTime2Live(time2Live);
      }

      if (AppStore.yPlayerCommon.isPaused()) {
        this._isPaused = true;
        await PlayMng.player.resume();
      }
      if (newPosition < 0) {
        this._playerView.updateProgressBar(0);
      } else {
        this._playerView.setTime(newPosition);
        if (!this._isScrollingfromLive) PlayMng.player.stopPlayTimeInfo();
      }
      if (!this._isScrollingfromLive) {
        await PlayMng.player.seek(newPosition);
      }

      AppStore.yPlayerCommon._position = newPosition;
    } catch (error) {
      console.error("ERROR:", "_skip player", "direction:", direction, "step:", step, "newPosition", newPosition);
    }
  }

  /**
   * @private
   */
  _stopTimeoutScroller() {
    if (this._timeoutScroller) {
      clearTimeout(this._timeoutScroller);
      this._timeoutScroller = null;
    }
  }

  /**
   * @private
   */
  async _restartTimeoutScroller() {
    this._stopTimeoutScroller();
    this._timeoutScroller = setTimeout(() => {
      if (!this._isScrollingfromLive) PlayMng.player.startPlayTimeInfo();
      if (!this._playerView.mustShowAudioSubtitulos) this.reset();
    }, this._playerScrollSequenceTimeout);
  }

  async reset() {
    let status = null;
    const skipState = AppStore.yPlayerCommon.getSkipState();
    if (!AppStore.yPlayerCommon.isSkipping()) {
      if (this._isPaused) {
        this._playerView.pause();
        this._isPaused = false;
        status = "pause";
      } else {
        status = "play";
      }
    }
    if (this._playerView.isLive && AppStore.yPlayerCommon.getTime2Live() <= 0) {
      this._playerView.goLive();
    } else if (this._playerView.isLive && this._isScrollingfromLive) {
      this._playerView.verDiferido();
    } else if (
      this._playerView.isVod &&
      AppStore.yPlayerCommon._position >=
        (this._playerView.getAsset()?.DuracionEnSegundos * SECOND || this._playerView._totalTime)
    ) {
      PlayMng.player.processPlayStateChangeFunction(AppStore.yPlayerCommon.ENDED);
    }
    this._prevTime = 0;
    this._prevDirection = undefined;
    if (status) this._playerView.setScreenStatus(status);
    this._playerView.isPlayerScrollerActive = false;
    this._playerView.opts.eventBus.emit(PLAYER_REFS.EVENTOS.SALTOS_DISCRETOS_OFF);
    AppStore.StackManager.isJUMP = false;
    AppStore.StackManager.send();

    if (skipState === AppStore.yPlayerCommon.REWIND) {
      this._playerView.opts.eventBus.emit(PLAYER_REFS.EVENTOS.REWIND);
      this._playerView.executeFastForwardOrRewind("rewind");
      AppStore.yPlayerCommon.resetSkipState();
    } else if (skipState === AppStore.yPlayerCommon.FORWARD) {
      this._playerView.opts.eventBus.emit(PLAYER_REFS.EVENTOS.FASTFORWARD);
      this._playerView.executeFastForwardOrRewind("forward");
      AppStore.yPlayerCommon.resetSkipState();
    } else {
      if (this._playerView.mustShowAudioSubtitulos && !this._isScrollingfromLive) {
        this._stopTimeoutScroller();
        this._playerView.showAudioSubtitulosWithDelay();
      }
    }
    this._isScrollingfromLive = false;
  }
}

/**
 * @typedef {"left" | "right"} PlayerScrollDirection
 */
