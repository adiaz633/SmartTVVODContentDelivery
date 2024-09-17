import { IKeyHandler } from "src/code/managers/key-mng/keys-handler-interface";
import { ShortcutsMng } from "@newPath/managers/shortcuts-mng";
import { SEARCH_SHORTCUT_NAME } from "@newPath/managers/shortcuts-mng/shortcuts-constants";
import { AppStore } from "src/code/managers/store/app-store";
import { ViewMng } from "src/code/managers/view-mng";
import { unirlib } from "@unirlib/main/unirlib";

const directionMap = {
  goUp: "up",
  goDown: "down",
  goLeft: "left",
  goRight: "right",
  goEnter: "enter",
};

/**
 * Teclas Mapeadas por defecto para la BaseView
 */
export class BaseViewKeys extends IKeyHandler {
  constructor() {
    super();
    /**
     * True si se esta mostrando un error
     * @deprecated
     * En caso que sea una ventana de popup, esta hará el manejo de las teclas
     * @type {boolean}
     */
    this.isErrorShowing = false;

    /**
     * @type {BaseComponent}
     * @private
     */
    this._activeComponent = null;
  }

  /**
   * asigna un nuevo componente base
   *
   * @param {BaseComponent} value nuevo componente
   */
  set activeComponent(value) {
    if (value && this._activeComponent !== value) {
      if (this._activeComponent?.unfocus) this._activeComponent?.unfocus();
      this._activeComponent = value;
      if (this._activeComponent?.focus) this._activeComponent?.focus();
    }
  }

  /**
   * inicializa el componente activo como null
   */
  setNullActiveComponent() {
    this._activeComponent = null;
  }

  /**
   * Referencia la función privada
   * @param {String} keyPressed
   * @returns {Function}
   */
  moveTo(keyPressed) {
    return this._moveTo(keyPressed);
  }

  /**
   * Obtiene el componente base
   *
   * @type {BaseComponent}
   */
  get activeComponent() {
    return this._activeComponent;
  }

  //  --------------------------------------------------------------------------
  //  Eventos
  //  --------------------------------------------------------------------------

  /**
   * Se dispara cuando se deja de presionar una tecla
   * @param {Number} keyCode Código ascii de la tecla que se ha presionado
   * @return {boolean} true si se ha manejado, de lo contrario false
   */
  onKeyUpEvent(keyCode) {
    if (this.activeComponent?.onKeyUpEvent) {
      return this.activeComponent.onKeyUpEvent(keyCode);
    }
  }

  /**
   * Se dispara cuando se ha presionado la tecla reservada **VK_MENU**. para
   * algunas vistas es necesario manejar si se presiona el _menu_
   *
   * @return {boolean | Promise<boolean>} _true_ si se ha manejado, de lo contrario _false_
   */
  onMenuPressedEvent() {
    return false;
  }

  onProfilePressedEvent() {
    return false;
  }

  //  --------------------------------------------------------------------------
  //  Keys
  //  --------------------------------------------------------------------------

  async goEnter() {
    // TODO: esto no hace falta cuando este el sistema de popup nuevo
    if (this.isErrorShowing) {
      AppStore.errors.hideError();
      this.isErrorShowing = false;
      return;
    }
    return this._callComponentKeyMethodByName("goEnter");
  }

  async goBack() {
    /** @type { BaseView } */
    const thisView = this;

    if (thisView.isErrorShowing) {
      AppStore.errors.hideError();
      thisView.isErrorShowing = false;
      return true;
    }
    let canGoBack = false;
    if (thisView.activeComponent) {
      canGoBack = await thisView.activeComponent.goBack();
      if (!canGoBack) {
        if (thisView.activeComponent?.back?.isFocusable) {
          thisView.activeComponent = thisView.activeComponent.back;
          return true;
        }
        /** @type { BaseView } */
        const originView = thisView.getViewByOrigin();
        if (originView) {
          originView.goBackByOrigin();
        } else {
          thisView.focusPreviousScreen();
        }
      }
    } else {
      thisView.focusPreviousScreen();
    }
    return canGoBack;
  }

  goEpg() {
    //
    // La modificacion del comportamiento de la tecla EPG se debe hacer en cada
    // una de las vistas haciendo sobreescritura del metodo goEpg. por eso se
    // elimino la condicio de settings y se paso al setting per sé
    //
    if (!unirlib.isEmergencyMode() && unirlib.isAppStarted() && unirlib.hasServiceDirectory()) {
      ViewMng.instance.navigateTo("EpgScene");
    }
  }

  goProfile() {
    if (!AppStore.SettingsMng.getIsPaginasLocales()) ViewMng.instance.navigateTo("SettingsLocalesScene");
  }

  goKeyboard() {
    if (!AppStore.SettingsMng.getIsPaginasLocales()) ViewMng.instance.navigateTo("SearchScene");
  }

  async goChannelUp() {
    return this._moveTo("goChannelUp");
  }

  async goChannelDown() {
    return this._moveTo("goChannelDown");
  }

  async goUp() {
    return this._moveTo("goUp");
  }

  async goDown() {
    return this._moveTo("goDown");
  }

  async goLeft() {
    return this._moveTo("goLeft");
  }

  async goRight() {
    return this._moveTo("goRight");
  }

  async goKey(keyCode) {
    if (this.activeComponent?.goKey) {
      return this.activeComponent.goKey(keyCode);
    }
    return false;
  }

  /**
   * Se dispara cuando se presiona un numero del 0-9
   *
   * FIXME: Es un alias de goKey porque todos los componentes lo implementan
   * FIXME: como GoKey en una futura iteracion cambiar en todas partes
   * @param {Number} keyCode Codigo ascii de la tecla presionada
   */
  async goNumber(keyCode) {
    this.goKey(keyCode);
  }

  async goPlayPause() {
    return this._callComponentKeyMethodByName("goPlayPause");
  }

  async goStop() {
    return this._callComponentKeyMethodByName("goStop");
  }

  async goRec() {
    return this._callComponentKeyMethodByName("goRec");
  }

  async goYellow() {
    return this._callComponentKeyMethodByName("goYellow");
  }

  async goRed() {
    return this._callComponentKeyMethodByName("goRed");
  }

  async goBlue() {
    const activeView = ViewMng.instance.active;
    let useViewBehaviour = false;
    if (activeView?.onMenuPressedEvent) useViewBehaviour = await activeView.onMenuPressedEvent();
    !useViewBehaviour && ViewMng.instance.navigateTo("HomeScene");
  }

  async goGreen() {
    return this._callComponentKeyMethodByName("goGreen");
  }

  /**
   * Alias for goUp
   * @deprecated En favor de goUp
   * @return {boolean}
   */
  async goKeyUp() {
    return this._callComponentKeyMethodByName("goKeyUp");
  }

  /**
   * Call a key method by name
   *
   * @param {string} keyMethodName method name
   *
   * @private
   * @return {boolean}  true if key is handled
   */
  async _callComponentKeyMethodByName(keyMethodName) {
    if (this.isErrorShowing) {
      return true;
    }
    let itCanMove = false;
    if (this.activeComponent) {
      /** @type {Function} */
      const method = this.activeComponent[`${keyMethodName}`];
      if (typeof method === "function") {
        itCanMove = await method.call(this.activeComponent);
        const nextComponentPropertyName = directionMap[`${keyMethodName}`];
        const nextComponent = this.activeComponent[`${nextComponentPropertyName}`];
        if (!itCanMove && nextComponent?.isFocusable) {
          this.activeComponent = nextComponent;
          itCanMove = true;
        }
      }
    }
    return itCanMove;
  }

  /**
   * Ejecuta el movimiento de los componentes
   *
   * @private
   * @param {"goUp"| "goDown" | "goLeft" | "goRight"} directionKeyMethodName - Metodo a ejecutar en el componente active
   * @returns {Promise<Boolean>}
   */
  async _moveTo(directionKeyMethodName) {
    if (this.isErrorShowing) {
      return true;
    }
    let itCanMove = false;
    if (this.activeComponent) {
      const keyMethod = this.activeComponent[`${directionKeyMethodName}`];
      if (keyMethod) {
        itCanMove = await keyMethod.call(this.activeComponent);
        const nextComponentPropertyName = directionMap[`${directionKeyMethodName}`];
        const nextComponent = this.activeComponent[`${nextComponentPropertyName}`];
        if (!itCanMove && nextComponent?.isFocusable) {
          this.activeComponent = nextComponent;
          itCanMove = true;
        }
      }
    }
    return itCanMove;
  }
}

/**
 * @typedef {import("./base-view").BaseView} BaseView
 */

/**
 * @typedef {import("./base-component").BaseComponent} BaseComponent
 */
