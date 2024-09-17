import { addCssClass, hasCssClass, removeCssClass } from "src/code/js/dom-utils";
import { BackgroundMng } from "src/code/managers/background-mng";
import { LoaderMng } from "src/code/managers/loader-mng";
import { AppStore } from "src/code/managers/store/app-store";
import { ViewMng } from "src/code/managers/view-mng";
import { BaseViewKeys } from "src/code/views/base-view-keys";

export class BaseView extends BaseViewKeys {
  /**
   * _true_ si la vista se está cerrando
   * @type {boolean}
   */
  #isClosing = false;

  constructor(wrap) {
    super();

    /**
     * Tipo de vista
     * @type {string}
     */
    this.type = "";

    /**
     * Origen de la vista
     * @type {BaseView | string}
     */
    this.origin = null;

    /**
     * Mnemonic value
     * @type {string}
     * @deprecated en favor de la propiedad {@link mnemonic}
     */
    this.mnemonicValue = "";

    /**
     * @private
     * @type {Object}
     */
    this.canDisturbModel = {
      aura: true,
      m360: true,
    };

    /**
     * @private
     * @type {Element}
     */
    this._wrap = wrap;

    /**
     * @private
     * @type {BaseComponent[]}
     */
    this._components = [];

    /**
     * @private
     * @type {boolean}
     */
    this._isExternalApp = false;

    /**
     * Funcion que se utiliza para cuendo se invoca el metodo
     * de {@link reloadView}
     *
     * @type {Function}
     * @example
     *
     *  function test_loader(origin) {
     *    const view = new BaseView()
     *    view.origin = origin
     *    // Establecer el cargador a esta funcion
     *    view.loader = test_loader.bind(this, origin)
     *    ViewMng.instance.push(view)
     *  }
     *
     *  ...
     *  // Esta funcion ejecutará la funcion _loader_
     *  ViewMng.instance.last?.reloadView()
     *  ...
     */
    this.loader = undefined;

    /**
     * Bandera que indica si se esta recargando una vista
     * @private
     */
    this._isReloading = false;

    /**
     * Bandera que indica si la vista se está desactivando
     * @private
     */
    this._isDeactivating = false;
    this.opts = undefined;
  }

  /**
   * Devuelve true si la vista esta en el stack
   * @type {boolean}
   */
  get isInStack() {
    return ViewMng.instance.views.indexOf(this) !== -1;
  }

  /**
   * Devuelve _true_ si la vista se esta sacando del stack
   */
  get isClosing() {
    return this.#isClosing;
  }

  /**
   * Marca la vista indicando que se esta cerrado
   * @param {ViewMng} caller debe ser la instancia del viewMng que
   * esta manejando las vistas
   */
  setIsClosing(caller) {
    if (caller === ViewMng.instance) {
      console.warn("**** BaseView.setIsClosing(true)");
      this.#isClosing = true;
    }
  }

  /**
   * Identifica la vista como interrumpible o no interrumpible (para módulos que lo requieran)
   * @return {Object}
   */
  get canDisturb() {
    return this.canDisturbModel;
  }

  /**
   * Obtiene el valor de mnemonic
   * @type {String}
   */
  get mnemonic() {
    return this.mnemonicValue;
  }

  /**
   * Establece el valor de mnemonic
   * @param {String} valor
   */
  set mnemonic(valor) {
    this.mnemonicValue = valor;
  }

  /**
   * Obtiene el elemento de Wrap
   * @type {Element}
   */
  get wrap() {
    return this._wrap;
  }

  /**
   * Lista de componentes
   * @type {BaseComponent[]}
   */
  get components() {
    return this._components;
  }

  /**
   * Especifica si la vista es una modal
   *
   * @type {boolean}
   * @deprecated In favor of {@link isModal}.
   */
  get getModal() {
    return false;
  }

  /**
   * Especifica si la vista es una modal. un alias para _getModal_ mientras se
   * unifica todo
   *
   * @type {boolean}
   */
  get isModal() {
    return this.getModal;
  }

  /**
   * Especifica si la vista puede ser destruida. caso home
   * @type {boolean}
   */
  get canBeDestroyed() {
    return true;
  }

  /**
   * Especifica si permite el uso del dial
   *
   * @type {boolean}
   */
  get canUseDial() {
    return true;
  }

  /**
   * Devuelve _true_ si la vista está activa. hasta ahora, se considera que una
   * vista esta activa si tiene _wrap_ y posee la clase _active_
   *
   * @type {boolean}
   */
  get isActive() {
    return this.wrap && hasCssClass(this.wrap, "active");
  }

  /**
   * Retorna _true_ si solo puede haber una vista del mismo tipo
   * en el stack de vistas
   * @type {boolean}
   */
  get isUnique() {
    return false;
  }

  /**
   * Se invoca cuando la vista está en el tope del stack del view-mng
   * @return {Promise<void>}
   */
  async activate() {
    addCssClass(this.wrap, "active");
  }

  /**
   * Se invoca cuando la vista ya no está en el tope del stack del view-mng
   * @return {Promise<void>}
   */
  async deactivate() {
    removeCssClass(this.wrap, "active");
  }

  /**
   * Agrega un nuevo componente a las componentes de la vista
   *
   * @param {BaseComponent} component Componente a agregar
   */
  addComponent(component) {
    this._components.push(component);
  }

  /**
   * Busca un componente por __Type__.
   * @param {string} type tipo de componente a buscar
   * @return {BaseComponent | undefined} devuelve el componente si lo encuentra de los contrario undefined
   */
  componentType(type) {
    return this._components.find((comp) => comp instanceof type);
  }

  /**
   * Remueve una clase CSS de la vista
   * @param {string} className Clase CSS a utilizar
   * @return {void}
   */
  removeClass(className) {
    if (this._wrap === null) return;
    if (typeof this._wrap.addClass === "undefined") {
      this._wrap.classList.remove(className);
    } else {
      this._wrap.removeClass(className);
    }
  }

  /**
   * Agrega una clase CSS a la vista
   * @param {string} className Clase CSS a utilizar
   * @return {void}
   */
  addClass(className) {
    if (this._wrap === null) return;
    if (typeof this._wrap.addClass === "undefined") {
      this._wrap.classList.add(className);
    } else {
      this._wrap.addClass(className);
    }
  }

  /**
   * Verifica si una clase está presente en la vista
   *
   * @param {string} className Clase CSS a utilizar
   * @return {Boolean} true si la clase existe
   */
  hasClass(className) {
    if (!this._wrap) {
      return false;
    }
    if (typeof this._wrap.addClass === "undefined") {
      return this._wrap.classList.contains(className);
    } else {
      return this._wrap.hasClass(className);
    }
  }

  /**
   * Destruye la vista y sus componentes
   */
  async destroy() {
    if (this.canBeDestroyed) {
      this._wrap?.remove();
      this._wrap = null;
      this.type = "";
      for (let i = 0; i < this._components.length; i++) {
        this._components[i].destroy();
      }
      this._components = [];
    }
  }

  /**
   * Genera un fade in en la vista
   * @param {Number} marginTop margen superior
   */
  setFadeIn(marginTop) {
    const newMarginTop = parseInt(marginTop);
    const newHeigth = Math.abs(newMarginTop) + document.querySelector("body").offsetHeight;
    this._wrap.css({
      opacity: 0,
      "margin-top": marginTop,
      height: newHeigth,
    });
  }

  /**
   * Ejecuta la animacion de fade in
   */
  runFadeIn() {
    this._wrap.animate({ "margin-top": 0, opacity: 1 }, { duration: 500 });
  }

  /**
   * Muestra un consejo (hingt) en la vista
   * @param {string} message - HTML o string a mostrar
   */
  showHint(message) {
    const hint = $(message);
    hint.addClass("hint");
    this._wrap.append(hint);
  }

  /**
   * Oculta todos los HINTS de la vista
   */
  hideHints() {
    if (this._wrap) {
      const hints = this._wrap.find(".hint");
      for (const h in hints) {
        hints.eq(h).remove();
      }
    }
  }

  /**
   * Devuelve si es la última linea
   *
   * @return {boolean} True si la vista esta en la ultima linea
   */
  isLastRow() {
    return false;
  }

  /**
   * Devuelve si es la primera linea
   *
   * @return {boolean} True si la vista esta en la primera linea
   */
  isFirstRow() {
    return false;
  }

  /**
   * Para las vistas que se cierren por inactividad indicar que reinicie la
   * la cuenta atrás
   */
  restartTimeoutHide() {
    return;
  }

  /**
   * Poner la vista en estado activo
   * @deprecated
   * @alias deactivate
   */
  set_view_inactive() {
    this.deactivate();
  }

  /**
   * Poner la vista en estado inactivo
   * @deprecated
   * @alias activate
   */
  set_view_active() {
    this.activate();
    LoaderMng.instance.hide_loader();
  }

  /**
   * Función que recupera la vista según el Origin
   * @returns {BaseView}
   */
  getViewByOrigin() {
    let originView = null;
    if (this.origin === "player-view") {
      originView = ViewMng.instance.viewType("player-view");
    } else if (this.origin === "EpgScene") {
      originView = ViewMng.instance.viewType("epg");
    }
    return originView;
  }

  /**
   * Función que se ejecuta cuando se puede realizar el goBack del componente, según el "origin"
   * @name goBackByOrigin
   */
  goBackByOrigin() {
    return false;
  }

  /**
   * Función que pone el foco en la pantalla anterior
   */
  focusPreviousScreen() {
    AppStore.home.focus_prev();
  }

  /**
   * Refresca la vista invocando la funcion que creo la vista
   * originalmente.
   *
   * @see {@link loader}
   */
  async reloadView() {
    if (this._isReloading === true) {
      return;
    }
    try {
      this._isReloading = true;
      if (typeof this.loader === "function") {
        BackgroundMng.instance.show_full_background();
        await ViewMng.instance.close(this);
        await this.loader();
      }
    } finally {
      this._isReloading = false;
    }
  }

  /**
   * Función que mostraba/activaba la vista, es una funcionalidad obsoleta, ahora se utiliza el 'activator"
   *
   * @deprecated
   */
  show() {}
}
