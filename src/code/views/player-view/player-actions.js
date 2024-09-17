import { PlayerForwardAction } from "./actions/player-forward-action";
import { PlayerRewindAction } from "./actions/player-rewind-action";

/**
 * Maneja las acciones del player
 */
export class PlayerActions {
  /**
   *
   * @param {PlayerView} playerView
   */
  constructor(playerView) {
    /**
     * Avance Rapido
     * @type {PlayerAction} */
    this.forward = new PlayerForwardAction(playerView);

    /**
     * Retroceso rapido
     * @type {PlayerAction} */
    this.rewind = new PlayerRewindAction(playerView);

    /**
     * Grupo de acciones cancelables
     * @private
     * @type {PlayerAction[]}
     */
    this._cancelableActions = [this.rewind, this.forward];
  }

  /**
   * Cancelar todas las acciones que se deban cancelar, ejemplo
   * el FF o el RWD
   * @returns {Promise<Boolean>} Resuelve a true si alguna de las
   * acciones fue activada previamente
   */
  async cancelAll() {
    return this._cancelableActions.reduce(async (result, action) => {
      if ((await result) === true) {
        return result;
      }
      return await action.cancel();
    }, Promise.resolve(false));
  }
}

/**
 * @typedef {import("../player-view").PlayerView} PlayerView
 */

/**
 * @typedef {import("./actions/base/player-action").PlayerAction} PlayerAction
 */
