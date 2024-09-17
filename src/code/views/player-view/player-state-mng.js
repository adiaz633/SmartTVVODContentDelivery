import { MODO, PlayMng } from "src/code/managers/play-mng";

/**
 * Instance
 *
 * @type {PlayerStateMng}
 */
let _instance;

/**
 * Player view state Manager. Maneja el estado del player cuando una vista que
 * constiene un PLAYER se activa y se desactiva. Se aplica en el PLayerView y en
 * el EpgView
 */
export class PlayerStateMng {
  /**
   * Singleton of _PlayerStateMng_
   *
   * @type {PlayerStateMng}
   */
  static get instance() {
    if (!_instance) {
      _instance = new PlayerStateMng();
    }
    return _instance;
  }

  /**
   * Create a new instance of _PlayerStateMng_
   */
  constructor() {
    /**
     * Stated saved
     * @type {boolean}
     * @private
     */
    this._isStateSaved = false;

    /**
     * Flag to store
     * @type {boolean}
     * @private
     */
    this._itMustToStoreState = false;
  }

  /**
   * Obtiene si es necesario obtener el valor guarado del player
   *
   * @returns {boolean} _true_ si debe recuperara el estado del player y apaga
   * la flag
   */
  _getIsMustToStore() {
    // Como es un flag para evitar copias en memoria se crea una nueva variable
    const originalValue = this._itMustToStoreState === true;
    this._itMustToStoreState = false;
    return originalValue;
  }

  /**
   * Almacenar el estado del VOD
   *
   * @param {PlayerView} playerView vista del player
   * @private
   */
  async _saveVodState(_playerView) {
    //
  }

  /**
   * restaurar el estado del VOD
   *
   * @param {PlayerView} playerView vista del player
   * @private
   */
  async _restoreVodState(playerView) {
    await PlayMng.player.playContent();
  }

  /**
   * Almacenar el estado del LIVE
   *
   * @param {PlayerView} playerView vista del player
   * @private
   */
  _saveLiveState(_playerView) {
    //
  }

  /**
   * Restaurar el estado del LIVE
   *
   * @param {PlayerView} playerView vista del player
   * @private
   */
  async _restoreLiveState(playerView) {
    await PlayMng.player.playContent();
  }

  /**
   * Habilita la recuperacion de estado del player
   */
  mustStoreState() {
    this._itMustToStoreState = true;
  }

  /**
   * Cuando se activa el player
   *
   * @param {PlayerView} playerView Vista del player
   */
  async activate(playerView) {
    //
    //  Skip si no debe almacenar el status
    //
    if (!this._getIsMustToStore()) {
      return;
    }
    try {
      if (this._isStateSaved === true) {
        this._isStateSaved = false;
        switch (playerView.mode) {
          case MODO.LIVE:
            await this._restoreLiveState(playerView);
            break;
          case MODO.VOD:
            await this._restoreVodState(playerView);
            break;
        }
      }
    } catch (error) {
      console.warn("PlayerStateMng.activate:error", error);
    }
  }

  /**
   * Cuando se inactiva el player
   *
   * @param {PlayerView} playerView vista del player
   */
  async deactivate(playerView) {
    try {
      switch (playerView.mode) {
        case MODO.LIVE:
          await this._saveLiveState(playerView);
          break;
        case MODO.VOD:
          await this._saveVodState(playerView);
          break;
      }
      this._isStateSaved = true;
    } catch (error) {
      console.warn("PlayerStateMng.deactivate:error", error);
    }
  }
}

/**
 * Estado de un VOD en el player
 *
 * @typedef {object} PlayVodState
 * @property {object} playInfo Play info
 * @property {object} position play position
 * @property {string} origin Play origin
 */
