import { debounceAnnotation } from "src/code/js/anotations";
import { EventArg } from "src/code/js/event-args";
import { EventEmitterAsyncMng } from "src/code/js/event-emitter-async-mng";
import { BaseMng } from "src/code/managers/base-mng";

import { StackList } from "./stack-list";
import { errorWrapper } from "./utils";
import { viewTypeNames } from "./view-type-names";

let _instance = null;

/**
 * Administrador de vistas
 *
 * @template T
 */
export class ViewMng extends BaseMng {
  /**
   * Obtiene el singleton del {@link ViewMng}
   * @type {ViewMng<import("./view-navigation-mng").NavigationMng>}
   */
  static get instance() {
    if (!_instance) {
      console.info("ViewMng.instance created");
      _instance = new ViewMng();
    }
    return _instance;
  }

  constructor() {
    super("ViewMng");

    /**
     * Route maps
     *
     * @type {T?}
     */
    this.routes = null;

    /**
     * @type {import("../modal-mng").ModalMng}
     */
    this.modals = null;

    this.signalReady = debounceAnnotation(this.signalReady.bind(this), 800);

    /**
     * @private
     * @type {StackList<BaseView>}
     */
    this._viewList = new StackList();

    /**
     * @private
     * @type {EventEmitterAsyncMng}
     */
    this._events = new EventEmitterAsyncMng("ViewMng");

    /**
     * True si se esta eliminando el stack
     * @private @type {boolean}
     */
    this._isCleaning = false;

    // this._activateView = time("ACT", this._activateView.bind(this));
    // this._deactivateView = time("DAC", this._deactivateView.bind(this));
    // this._destroyView = time("DES", this._destroyView.bind(this));
  }

  /**
   * Obtiene el player del stack
   * @type {PlayerView}
   */
  get player() {
    return this.viewType(viewTypeNames.PLAYER_VIEW);
  }

  /**
   * Obtiene la última vista del stack de vistas
   * @template {BaseView} T
   * @type {T}
   */
  get lastView() {
    return this.getView(this._viewList.length - 1);
  }

  /**
   * Obtiene la última vista del stack desactivada
   * @type {BaseView}
   */
  get lastViewClose() {
    return this._lastViewClose;
  }

  /**
   * Lista de Vistas
   *
   * @type {BaseView[]}
   */
  get views() {
    return this._viewList.toArray();
  }

  /**
   * Devuelve el total de vista en el stack
   */
  get length() {
    return this._viewList.length;
  }

  /**
   * Obtiene la vista ACTIVA del stack de vistas. si no hay una vista acti
   *
   * @type {BaseView | undefined}
   */
  get active() {
    const NO_ELEMENT_OR_FIRST_ELEMENT = 0;
    const ONE_ELEMENT = 1;
    const LAST_ELEMENT_OR_NOT_FOUND = -1;

    if (this.length === ONE_ELEMENT) {
      return this.getView(NO_ELEMENT_OR_FIRST_ELEMENT);
    }

    // Si hay una vista modal, ésa es la activa
    for (let viewIndex = this.length - ONE_ELEMENT; viewIndex >= NO_ELEMENT_OR_FIRST_ELEMENT; viewIndex--) {
      const thisView = this.getView(viewIndex);
      if (thisView.isModal) {
        return thisView;
      }
    }

    for (let viewIndex = this.length - 1; viewIndex >= 0; viewIndex--) {
      const thisView = this.getView(viewIndex);
      if (thisView.isActive) {
        return thisView;
      }
    }

    if (this.views.length > NO_ELEMENT_OR_FIRST_ELEMENT) {
      const [viewActive] = this.views.slice(LAST_ELEMENT_OR_NOT_FOUND);
      return viewActive;
    }
    return undefined;
  }

  /**
   * Obtiene el elemento wrap de la vista activa
   * @type {JQuery | HTMLElement}
   */
  get activeWrap() {
    return this.active?.wrap;
  }

  /**
   * Emite un evento personalizado hacia. los eventos basicos del view manager
   * no se emiten con este metodo {@link ViewMngEventNames}
   *
   * @param {string|symbol} eventName Nombre del evento a emitir
   * @param {BaseView} view vista origen del evento
   * @param  {...any} args Argumentos del evento
   * @returns {Promise<void>}
   */
  async emit(eventName, view, ...args) {
    const found = Object.entries(ViewMngEventNames).find(
      ([, value]) => `${eventName}`.toLowerCase() === value.toLowerCase()
    );
    if (found !== undefined) {
      return;
    }
    return this._events.emit(eventName, view, ...args);
  }

  /**
   * Agregar un handler a un evento
   *
   * @param {keyof ViewMngEventNames} eventName Nombre del evento
   * @param {ViewMngEventListener | ViewMngActivateDeactivateListener} listener Función del evento
   * @returns {(() => void)}
   */
  on(eventName, listener) {
    return this._events.on(eventName, listener);
  }

  /**
   * Agrega una vista al stack de vistas
   *
   * @template TView
   * @extends {BaseView}
   * @param {TView} newView Vista a ser agregada
   * @return {Promise<Void>}
   */
  async push(newView) {
    if (!newView?.type) {
      throw new Error(`ViewMng.push: Invalid view type`);
    }

    await this._ensureUniqueness(newView);

    //
    //  Si la nueva vista NO es modal desactivarla
    //
    let previousView = undefined;
    if (!newView.isModal) {
      previousView = this.lastView;
      await this._deactivateView(previousView, newView);
    }

    const urgentAlerts = ["standby"];
    const mustNotPushView =
      newView.isModal &&
      this.lastView?.type === viewTypeNames.THIRD_PARTY_VIEW &&
      this.lastView?.opts?.config?.disableAlerts;
    if (!mustNotPushView || urgentAlerts.includes(this.lastView?.opts?.popupId)) {
      this._emit(ViewMngEventNames.transition, previousView, newView);
      await this._activateView(newView);
      this._viewList.push(newView);
      this._emitWithContinue("push", { lastView: newView });
    }
  }

  /**
   * Remueve una vista del stack. ESTE METODO SÓLO SE
   * DEBE USAR EN LOS DEACTIVATES DE LAS CLASES ACTIVADORAS
   *
   * @param {BaseView} view Vista a remover del stack
   */
  async removeViewInDeactivate(view) {
    this.log("removeViewInDeactivate", view?.type);
    // Si isCleaning es true quiere decir que alguien mas esta
    // limpiando el stack y se debe evitar cerrar esta vista
    if (view._isDeactivating && !this._isCleaning) {
      this._rawRemove(view);
      await this._destroyView(view);
    }
  }

  /**
   * Envia una señal de que la vista está lista para operar
   *
   * @param {BaseView} view Vista a señalizar
   */
  signalReady(view) {
    // Si NO está en el stack no emitir la señal de listo
    if (this._viewList.indexOf(view) === -1) {
      return;
    }
    this._emit(ViewMngEventNames.ready, view);
  }

  /**
   * Agrega un suscriptor al evento READY general del bus del view mng
   *
   * @param {(BaseView) => void} listener Escucha para el evento
   * @returns {()=>void}
   */
  onReady(listener) {
    return this._events.on(ViewMngEventNames.ready, listener);
  }

  /**
   * Si la vista anterior es una 3pa este método maneja el ciclo de vida de la misma junto a procesos como la creación de pines
   *
   * @param {BaseView} viewToBeClosed Vista que procede a cerrarse
   */
  isProcedureWithTpa(viewToBeClosed, destinationView) {
    const unrefocusableSubtypes = ["create", "newpin", "confirm", "checkpin"];
    return !(
      viewToBeClosed.type === viewTypeNames.PIN_VIEW &&
      destinationView.type === viewTypeNames.THIRD_PARTY_VIEW &&
      viewToBeClosed.subtype != null &&
      unrefocusableSubtypes.includes(viewToBeClosed.subtype)
    );
  }

  /**
   * Cierra una vista activa y la saca de la lista de vistas
   * @template {BaseView} T
   * @param {T} viewToBeClosed Vista a cerrar
   * @param {Boolean} mustActivatePreviousView Bandera que indica si debe activar la vista previa
   * @returns {Promise<T|null>} Vista cerrada
   */
  async close(viewToBeClosed, mustActivatePreviousView = true) {
    if (!viewToBeClosed) {
      this.log("close: Empty stack");
      return null;
    }

    //
    //  Calcular origen y destino
    //
    let destinationView = this.lastView;
    if (this._viewList.indexOf(viewToBeClosed) === this._viewList.indexOf(this.lastView)) {
      destinationView = this.getView(this.length - 2);
    }

    const isProcedureWithTpa = this.isProcedureWithTpa(viewToBeClosed, destinationView);
    viewToBeClosed.setIsClosing(this);
    this._emit(ViewMngEventNames.transition, viewToBeClosed, destinationView);

    await this._deactivateView(viewToBeClosed);
    this._viewList.remove(viewToBeClosed);
    await this._destroyView(viewToBeClosed);

    if (!viewToBeClosed.isModal && mustActivatePreviousView && isProcedureWithTpa) {
      await this._activateView(this.lastView);
      this._emitWithContinue("pop", { lastView: viewToBeClosed });
    }

    if (this.length <= 1) {
      this._emitWithContinue("clean");
    }

    return viewToBeClosed;
  }

  /**
   * Remueve una vista del stack
   *
   * @return {Promise<BaseView|null>} Elemento extraido
   */
  async pop() {
    if (this.length <= 1) {
      this.log("pop: Empty stack");
      return null;
    }
    return await this.close(this.lastView);
  }

  /**
   *
   * @param {BaseView} view
   * @return {[BaseView, Number]|[undefined]}
   */
  getPrevViewByIndex(view) {
    const START_INDEX = 0;
    const index = this._viewList.indexOf(view);
    if (index > START_INDEX) {
      const prevIndex = index - 1;
      return [this.getView(prevIndex), prevIndex];
    }
    return [undefined];
  }

  /**
   * Devuelve la penultima entrada del stack de vistas
   */
  getPrevView() {
    if (this._viewList.length >= 2) return this.getView(this._viewList.length - 2);
    else return undefined;
  }

  /**
   * Limpia el stack de vistas.
   */
  async clear() {
    this._isCleaning = true;
    try {
      //
      //  Para cuando se actualice el home siempre debería haber una vista en el
      //  stack.
      //
      for (const view of this.views) {
        await this._clearView(view);
      }
      this._viewList = new StackList();
      this._emitWithContinue("clean");
    } finally {
      this._isCleaning = false;
    }
  }

  /**
   * Corta el stack de vista desde un indice en particualr
   * @param {number} start Indice para cortar
   */
  async splice(start) {
    if (start < 1 || this.length <= 1) {
      return [];
    }
    this._isCleaning = true;
    try {
      this._emit(ViewMngEventNames.transition, this.lastView, this.getView(start - 1));

      const splicedViews = this._viewList.splice(start);
      for (const view of splicedViews) {
        await this._clearView(view);
      }
      await this._activateViews();

      if (this._viewList.length === 1) {
        await this._emit(ViewMngEventNames.clean);
      }

      return splicedViews;
    } finally {
      this._isCleaning = false;
    }
  }

  /**
   * Obtiene una vista por indices
   *
   * @type {BaseView}
   */
  getView(index) {
    return this._viewList.item(index);
  }

  /**
   * Devuelve una instancia de vista del stack con el tipo que se le pasa por
   * parametros
   *
   * @param {String} viewTypeName nombre de la clase de la vista
   */
  getViewBy(viewTypeName = "") {
    return this._viewList._innerList.find((view) => {
      return view.type === viewTypeName;
    });
  }

  /**
   * Obtiene el elemento de wrap
   *
   * @param {number} index Posision empezando en 0 de la vista o obtener el wrap
   * @return {JQuery | HTMLElement | undefined}
   */
  getWrap(index) {
    return this.getView(index)?.wrap;
  }

  /**
   * Devuelve si hay vistas en la pila
   *
   * @return {boolean} true, si hay vistas en la pila
   */
  hasViews() {
    return this.length > 0;
  }

  /**
   * Devuelve si el player está activo
   *
   * @return {boolean} true si hay una player activo
   */
  isPlayerActive() {
    return this.isTypeActive(viewTypeNames.PLAYER_VIEW);
  }

  /**
   * Devuelve si hay un player en el stack
   *
   * @return {boolean} true si existe un player en el stack
   */
  isPlayerOrigin() {
    return this.viewType(viewTypeNames.PLAYER_VIEW) !== undefined;
  }

  /**
   * Devuelve si la vista está en proceso de desactivación y no ha terminado
   * @param {BaseView} view Vista a consultar
   * @returns {Boolean} true si está desactivando aún la vista, false en cualquier otro caso
   */
  isViewDeactivating(view) {
    return view._isDeactivating;
  }

  /**
   * Devuelve si la vista activa es del tipo especificado
   *
   * @param {valueof<viewTypeNames>|valueof<viewTypeNames>[]} type tipo de vista a evaluar
   * @return {boolean} true si la vista activa es del tipo _type_
   */
  isTypeActive(type) {
    if (Array.isArray(type)) {
      return type.includes(this.active?.type);
    }
    return this.active?.type === type;
  }

  /**
   * Devuelve si la ultima vista en el stack es del tipo especificado
   *
   * @param {valueof<viewTypeNames>} type tipo de vista a evaluar
   * @returns {boolean} true si la __ultima__ vista en el stack es del
   * tipo __type__
   */
  isTypeLast(type) {
    return this.lastView?.type === type;
  }

  /**
   * Obtiene todas las vistas del tipo __Type__
   * @param {valueof<viewTypeNames>} type tipo de vista a evaluar
   * @return {BaseView[]} arreglo de vista del tipo especificado
   */
  viewsType(type) {
    return this.views.filter((view) => view.type === type);
  }

  /**
   * Devuelve una vista del tipo __type__
   * @param {valueof<viewTypeNames>} type tipo de vista a evaluar
   * @return {BaseView|undefined} Devuelve la vista si la encuentra de lo contrario null
   */
  viewType(type) {
    return this.views.find((view) => view.type === type);
  }

  /**
   * Elimina del stack todas las vistas del tipo __type__
   * @param {valueof<viewTypeNames>} type tipo de vista a evaluar
   */
  async cleanType(type) {
    return this.cleanByFilter((view) => view.type !== type);
  }

  /**
   * Elimina del stack la primera ocurrencia
   * de la vista del type recibido por parámetros
   * @param {valueof<viewTypeNames>} type tipo de vista a eliminar
   */
  async popFirstByType(type) {
    if (this.length <= 1) {
      return;
    }
    const { views } = this;
    let deleted = false;
    let i = views.length - 1;

    while (!deleted && i >= 0) {
      const view = views[i];
      if (view.type === type) {
        await this._rawRemove(view);
        deleted = true;
      }
      i--;
    }
  }

  /**
   * Elimina del stack las vistas que cumplen con el criterio de la function
   *
   * @param {FilterFunction} filterFunction Funcion que evalua las vistas a eliminar
   */
  async cleanByFilter(filterFunction) {
    if (this.length <= 1) {
      return false;
    }
    const { views } = this;
    const filteredViews = [views[0]];
    for (let i = 1; i < views.length; i++) {
      const view = views[i];
      if (filterFunction.apply(this, [view, i])) {
        filteredViews.push(view);
      } else {
        await this._clearView(view);
      }
    }
    this._viewList.setItems(filteredViews);
    await this._activateViews();
    return true;
  }

  /**
   * Va a una de las escenas definidas en los métodos.
   *
   * @param {keyof T} sceneName Ruta a it
   * @param {...*} args Argumentos de la ruta
   * @return {boolean} true si la ruta existe, si no false
   */
  navigateTo(sceneName, ...args) {
    if (!this.routes) {
      return;
    }
    this._emit("beforeNavigate", sceneName);
    // BackgroundMng.instance.hide_bg_image();
    // ControlParentalMng.instance.hideNotAllowed();
    const navigationFunction = this.routes[`${sceneName}`];
    if (typeof navigationFunction === "function") {
      navigationFunction.call(this.routes, ...args);
      this._emit("navigate", sceneName);
    } else if (typeof this.routes.other === "function") {
      this.routes.other.call(this.routes, sceneName, ...args);
      this._emit("navigate", sceneName);
    }
  }

  /**
   * Muestra una vista de popup
   *
   * @deprecated en favor de {@link ModalMng#showPopup}
   * @param {string|{}} popupIdOrBody ID del popup definido en _popups-config.js_ o un config
   * @param {BaseView|object|null} [view] View donde están los métodos que invoca el popup
   * @param {object} [options] Opciones adicionales que se le pasan al _PopupComponent_
   * @param {Object} replacementText Texto a reemplazar en la descripición por {VAL}
   */
  /* istanbul ignore next */
  async showPopup(popupIdOrBody, view = null, options = undefined, replacementText = null) {
    return this.modals?.showPopup(popupIdOrBody, view, options, replacementText);
  }

  /**
   * Si la ultima vista es un popup, lo destruye
   * @deprecated en favor de {@link ModalMng#hidePopup}
   */
  /* istanbul ignore next */
  hidePopup(executeCallByName = true) {
    return this.modals?.hidePopup(executeCallByName);
  }

  /**
   * Muestra un wizard
   *
   * @deprecated en favor de {@link ModalMng#showWizard}
   * @param {string} configWizardPath Ruta al objeto de definicion del wizard
   * @param {EventBus} [eventBus] bus de eventos
   * @returns {import("@newPath/views/wizard/wizard-view").WizardView} vista de wizard creada
   */
  /* istanbul ignore next */
  async showWizard(configWizardPath, eventBus, config = {}) {
    return this.modals?.showWizard(configWizardPath, eventBus, config);
  }

  /**
   * Muestra la pantalla de captura de pin
   * @deprecated en favor de {@link ModalMng#showPin}
   * @param {import("@newPath/views/pin/pin-view").PinViewInitDefaultOptions} options Opciones
   */
  /* istanbul ignore next */
  async showPin(options) {
    return this.modals?.showPin(options);
  }

  /**
   * Verifica si el primer elemento del stack es el home
   *
   * @return {boolean} true si el primer elemento del stack es un slider
   */
  isViewHome() {
    return this.length === 1 && this.getView(0).type === viewTypeNames.SLIDER_VIEW;
  }

  /**
   * Desactiva una vista
   * @private
   * @param {BaseView} lastView vista a ser desactivada
   * @param {BaseView} newView
   */
  async _deactivateView(lastView, newView) {
    if (!lastView) return;
    this.log(`deactivate ${lastView.type}`);
    try {
      lastView._isDeactivating = true;
      this._lastViewClose = lastView;
      await this._emit(ViewMngEventNames.beforeDeactivate, lastView.type, lastView);
      const type = lastView.type;
      const isNotMainApp = type === viewTypeNames.THIRD_PARTY_VIEW || type === viewTypeNames.EXTERNAL_PARTNER_VIEW;
      await errorWrapper(
        async () => (isNotMainApp ? await lastView.deactivate(newView) : await lastView.deactivate()),
        "deactivate"
      );
      this._emit(ViewMngEventNames.deactivate, lastView.type, lastView);
    } finally {
      lastView._isDeactivating = false;
    }
  }

  /**
   * Activa una vista
   * @private
   * @param {BaseView} view vista a ser activada
   */
  async _activateView(view) {
    if (!view) return;
    this.log(`Activate ${view.type}`);
    await this._emit(ViewMngEventNames.beforeActivate, view.type, view);
    await errorWrapper(async () => await view.activate(), ViewMngEventNames.activate);
    await this._emit(ViewMngEventNames.activate, view.type, view);
  }

  /**
   * destruye una vista
   * @private
   * @param {BaseView} view vista a ser destruir
   */
  async _destroyView(view) {
    if (!view) return;
    this.log(`Destroy ${view.type}`);
    await errorWrapper(() => view.destroy(), ViewMngEventNames.destroy);
    await this._emit(ViewMngEventNames.destroy, view.type, view);
  }

  /**
   * Emite un evento
   *
   * @private
   * @param {keyof ViewMngEventNames} eventName Nombre del evento
   * @param {...any} eventArg Argumentos del evento
   */
  _emit(eventName, ...eventArg) {
    return this._events.emit(eventName, ...eventArg);
  }

  /**
   * Emite un evento y verifica si puede continuar con la ejecucion
   *
   * @private
   * @param {ViewMngEventNames} eventName Nopmbre del evento
   * @param {*} args Argumentos
   * @return {boolean} True si puede continuar
   */
  _emitWithContinue(eventName, args) {
    const eventArg = new EventArg(args);
    this._emit(eventName, eventArg);
    return eventArg.canContinue;
  }

  /**
   * Destruye la vista que se pasa por parametros
   *
   * @private
   * @param {BaseView} view Vista a ser destruida vista en el stack
   */
  async _clearView(view) {
    await this._deactivateView(view);
    await this._destroyView(view);
  }

  /**
   * Remueve la vista del stack SIN ejecutar los destroy casos de uso los player
   * views que se regeneran cada vez que se hace un play. se utiliza en
   * {@link _ensureUniqueness}
   *
   * @private
   * @param {BaseView} view Vista a remover
   */
  _rawRemove(view) {
    const index = this._viewList.indexOf(view);
    this._viewList.splice(index, 1);
  }

  /**
   * Asegura la unicidad de las vistas. se usa en el metodo
   * @private
   * @see {@link push}
   * @param {BaseView} newView vista
   */
  async _ensureUniqueness(newView) {
    if (newView.isUnique) {
      const otherView = this.viewType(newView.type);
      if (otherView && otherView !== newView) {
        //
        //  Remover simplemente la vista del stack sin invocar ningun metodo
        //  de los callbacks.
        //
        this._rawRemove(otherView);
        // Destruir la vista sin ejecutar el deactivate o activate
        await this._destroyView(otherView);
      }
    }
  }

  /**
   * Marca la última vista como _activa_ y la penúltima, si es posible, como
   * inactiva invocando los metodos de _activate_ y _deactivate_ de las vistas
   *
   * @private
   */
  async _activateViews() {
    if (this.length > 1) {
      const previousView = this.getView(this.length - 2);
      await this._deactivateView(previousView);
    }
    await this._activateView(this.lastView);
  }
}

/**
 * @typedef {import("src/code/views/base-view").BaseView} BaseView
 */

/**
 * Eventos disponibles
 */
export const ViewMngEventNames = Object.freeze({
  push: "push",
  pop: "pop",
  clean: "clean",
  beforeNavigate: "beforeNavigate",
  navigate: "navigate",
  transition: "transition",
  activate: "activate",
  beforeActivate: "beforeActivate",
  deactivate: "deactivate",
  beforeDeactivate: "beforeDeactivate",
  destroy: "destroy",
  ready: "ready",
});

/**
 * Funcion de los eventos
 * @callback ViewMngEventListener
 * @param {EventArg} eventArg argumento del evento
 * @return {void}
 */

/**
 * @callback ViewMngActivateDeactivateListener
 * @param {string} viewType tipo del evento
 * @param {BaseView} affectedView vista que genera el evento
 */

/**
 * Funcion que se utiliza al momento de activar o desactivar una vista
 * @callback ViewMngActivateDeactivateHandler
 * @return {Promise<void>}
 */

/**
 * @callback FilterFunction
 * @param {BaseView} view Vista a evaluar
 * @param {number} index indice en el stack
 */

/**
 * @template T
 * @typedef {T[keyof T]} valueof
 */
