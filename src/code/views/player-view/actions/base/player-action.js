export class PlayerAction {
  /**
   * @param {PlayerView} playerView
   * @abstract
   */
  constructor(playerView) {
    /** @private @type {PlayerView} */
    this._playerView = playerView;

    /** @private */
    this._isExecuting = false;
  }

  /**
   * Referencia al {@link PlayerView}
   * @protected
   * @type {PlayerView}
   */
  get playerView() {
    return this._playerView;
  }

  /**
   * True si se esta ejecutando la accion
   * @type {boolean}
   */
  get isExecuting() {
    return this._isExecuting;
  }

  /**
   * Devuelve si la accion se puede ejecutar o no
   * @returns {Promise<Boolean>} resuleve a true si se puede ejecutar la promesa
   */
  async getCanExecute() {
    return true;
  }

  /**
   * Ejecuta una Acción
   * NO HACER OVERRIDE.
   * @summary Se pude hace override de {@link _execute}
   */
  async execute() {
    try {
      if (await this.getCanExecute()) {
        this._isExecuting = true;
        await this._execute();
      }
    } catch (error) {
      this._isExecuting = false;
      console.error(`PlayerAction.execute: ${error.message}`);
    }
  }

  /**
   * Cancela una Acción
   * NO HACER OVERRIDE.
   * @summary Se pude hace override de {@link _cancel}
   * @returns {Promise<boolean>} Resuelve a true si la accion estaba encendida
   * al momento de cancelarse
   */
  async cancel() {
    let wasCanceled = false;
    if (this._isExecuting) {
      this._isExecuting = false;
      try {
        await this._cancel();
        wasCanceled = true;
      } catch (error) {
        console.error(`PlayerAction.cancel: ${error.message}`);
      }
    }
    return wasCanceled;
  }

  /**
   * Callback para ejecutar el cancel. se invoca desde {@link cancel}
   * @protected
   * @override
   */
  async _cancel() {}

  /**
   * Callback para ejecutar la accion se invoca desde {@link execute}
   * @protected
   * @override
   */
  async _execute() {
    throw new Error("Must override");
  }
}

/**
 * @typedef {import("../../player-view").PlayerView} PlayerView
 */
