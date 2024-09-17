// @ts-check

import { SingleReadValue } from "src/code/js/single-read-value";

import { BaseMng } from "./base-mng";
import { ViewMng } from "./view-mng";

let _instance;

const HOME_ID = "homewrap";
const OPACITY_SHOW = "1";
const OPACITY_HIDE = "0";
const DISPLAY_SHOW = "block";
const DISPLAY_HIDE = "none";

export class HomeMng extends BaseMng {
  /** @type {HTMLElement} */
  #element;

  /**
   * @type {SingleReadValue}
   */
  #canReload;

  /** @type {HomeMng} */
  static get instance() {
    if (!_instance) {
      _instance = new HomeMng();
    }
    return _instance;
  }

  /**
   * Devuelve una referencia al HomeView
   * @return {SliderView}
   */
  static get home() {
    const firstView = 0;
    return /** @type {?} */ (ViewMng.instance.getView(firstView));
  }

  /**
   * Devuelve una referencia al Wrap de la Home
   */
  static get homeWrap() {
    return this.instance?.element;
  }

  /**
   * Agrega un elemento html al _#homewrap_ ({@link HomeMng.element})
   *
   * @param {string} htmlTemplate Plantilla html
   * @return {JQuery<HTMLElement>}
   */
  static html(htmlTemplate) {
    return HomeMng.instance.getWrap(htmlTemplate);
  }

  constructor() {
    super("HomeMng");

    /** @private @type {HTMLElement} */
    this.#element = null;
  }

  /**
   * Bandera que indica si se debe recargar el home. Por omision siempre esta
   * en __true__
   *
   * @type {SingleReadValue<Boolean>}
   */
  get canReload() {
    if (!this.#canReload) {
      this.#canReload = new SingleReadValue(true);
    }
    return this.#canReload;
  }

  /**
   * @type {HTMLElement}
   */
  get element() {
    if (!this.#element) {
      this.#element = document.getElementById(HOME_ID);
      this.#element.style.opacity = OPACITY_SHOW;
      this.#element.style.display = DISPLAY_SHOW;
    }
    return this.#element;
  }

  /**
   * Muestra el elemento _#homewrap_
   */
  show() {
    if (!this.isEnabled) return;
    this.element.style.opacity = OPACITY_SHOW;
    this.element.style.display = DISPLAY_SHOW;
  }

  /**
   * Oculta el elemento _#homewrap_
   */
  hide() {
    if (!this.isEnabled) return;
    this.element.style.opacity = OPACITY_HIDE;
    this.element.style.display = DISPLAY_HIDE;
  }

  /**
   * Verifica si está OCULTO el elemento _#homewrap_
   */
  isHidden() {
    return this.element.style.display === DISPLAY_HIDE;
  }

  /**
   * Agrega un elemento html al _#homewrap_ ({@link HomeMng.element})
   *
   * @param {string} htmlTemplate Plantilla html
   * @return {JQuery<HTMLElement>}
   */
  getWrap(htmlTemplate) {
    return $(htmlTemplate).appendTo($(this.element));
  }
}

/**
 * Crea un elemento HTML en la raiz del _homeWrap_ ({@link HomeMng.element}).
 * utiliza el metodo {@link HomeMng.html}
 * @param {string[]} raw Cadenas de texto
 * @param  {...any} substitutions Valores a sustituir
 * @example
 * const wrap = html`<div></div>`;
 * // Wrap es un JQuery<Element>
 */
export function html(raw, ...substitutions) {
  const template = String.raw({ raw }, ...substitutions);
  return HomeMng.html(template);
}

/**
 * Devuelve la referencia al wrap general de la home
 * @returns {HTMLElement}
 */
export function homewrap() {
  return HomeMng.homeWrap;
}

/**
 * @typedef {import("src/code/views/slider/slider").SliderView} SliderView
 */
