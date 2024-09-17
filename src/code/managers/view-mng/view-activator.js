import { patcher } from "./utils";

/**
 * Clase que se encarga de la activacion y la desactivacion de
 * la vista
 *
 * @template T
 */
export class ViewActivator {
  /**
   * crea una nueva instancia de {@link ViewActivator}
   * @param {T} baseView Base view
   */
  constructor(baseView) {
    if (!baseView) throw new Error("ViewActivator: null argument baseView");

    /** @private @type {T} */
    this._baseView = baseView;

    patcher(this, baseView, "activate");
    patcher(this, baseView, "deactivate");
  }

  /**
   * Obtiene la vista asociada
   * @type {T}
   */
  get view() {
    return this._baseView;
  }

  /**
   * Se ejecuta al activar una vista
   *
   * @param {T} target objeto original que se ha parcheado
   * @param {Function} originalMethod Metodo original que fue parcheado
   * @param {...any} args argumentos originales que se pasan a la funcion
   * @return {any}
   */
  async activate(_target, originalMethod, ...args) {
    await originalMethod(...args);
  }

  /**
   * se ejecuta al deactivar una vista
   *
   * @param {T} target objeto original que se ha parcheado
   * @param {Function} originalMethod Metodo original que fue parcheado
   * @param {...any} args argumentos originales que se pasan a la funcion
   * @return {any}
   */
  async deactivate(_target, originalMethod, ...args) {
    await originalMethod(...args);
  }
}
