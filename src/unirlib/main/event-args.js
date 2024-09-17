// @ts-check

/**
 * Argumentos para los eventos
 */
export class EventArg {
  #canContinue = true;
  /** @type {Record<string,any>} */
  #args;

  /**
   * @param {Record<string,any>} args
   */
  constructor(args) {
    this.#args = args;
  }

  /**
   * Evitar que el evento continúe
   */
  preventDefault() {
    this.#canContinue = false;
  }

  /**
   * True si el evento puede continuar
   */
  get canContinue() {
    return this.#canContinue;
  }

  get args() {
    return this.#args;
  }
}
