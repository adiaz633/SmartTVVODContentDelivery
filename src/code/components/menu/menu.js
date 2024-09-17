// @ts-check

import "@newPath/components/menu/menu.css";

import { appConfig } from "@appConfig";
import { IndexConstants } from "src/code/js/constants";
import { ControlParentalMng } from "@newPath/managers/control_parental_mng";
import { EnablersMng } from "@newPath/managers/enablers-mng";
import { HomeMng } from "src/code/managers/home-mng";
import { KeyMng } from "src/code/managers/key-mng";
import { ykeys } from "@unirlib/scene/ykeys";
import { AppStore } from "src/code/managers/store/app-store";
import { unirlib } from "@unirlib/main/unirlib";
import { EventEmitter } from "events";

import { CarouselBase } from "../carousel-base";
import { profileEmergencyIconMenu } from "./emergency-icon-menu";
import { rotate } from "./utils";

export class Menu extends CarouselBase {
  /** __true__ si el menú se ha inicializado */
  #isInitialized = false;
  /** Posicion inicial del primer elemento resaltado */
  #translationInitial = 0;
  #initItemIndexMenu = 0;

  /**
   * @param {Record<string, any>} opts
   */
  constructor(opts) {
    super();
    this.opts = {
      // @ts-ignore
      wrap: jQuery('[data-slider="menu"]'),
      /** @type {MenuItemData[]} */
      data: [],
      originalData: [],
      /** @type {number} */
      itemIndex: -1,
      /** @type {Record<string, HTMLElement>} */
      elems: {},
      isInfinite: true,
      fastTranslate: true,
      translation: 0,
      events: new EventEmitter(),
      isHome: false,
      type: "menu",
      tooltipShow: 0,
      tooltipHide: 0,
      currentItem: null,
      checkIconMenu: ["icon-mainmenu-setting", "icon-mainmenu-search", "icon-mainmenu-guia", "icon-mainmenu-u7d"],
      /**
       * Si el menu el circular cuantos elementos antes deber aparecer antes del
       * item seleccionado
       */
      prevItemsCount: 1,
      ...opts,
      timeOutHideToolTip: null,
      timeOutShowToolTip: null,
    };

    this.opts.originalData = opts.data;

    if (this.opts.data.length <= appConfig.MENU_MAX_NO_CIRCULAR) {
      this.opts.isInfinite = false;
      this.#changeProfileIndex();
    }
    this.on_endMove(() => {});

    this.bind_items(() => {
      this.#setInitialTranslation();
    });
  }

  /**
   * Inicializar menú
   *
   * @param {number} [itemIndex=0]
   */
  init(itemIndex = 0) {
    const context = AppStore.wsData?.getContext();
    if (KeyMng.instance.lastMappedKey === ykeys.VK_MENU) itemIndex = this.#initItemIndexMenu;
    if (this.opts.itemIndex !== itemIndex) this.opts.itemIndex = itemIndex;
    this.opts.tooltipShow = Number(context?.delayShowTooltip_menu_ficha || 500);
    this.opts.tooltipHide = Number(context?.delayHideTooltip_menu_ficha || 10000);

    AppStore.tfnAnalytics.audience_navigation("menu", "view", { col: 0, row: 1 });
    this.sel_item(itemIndex);
  }

  /**
   * create items
   * @param {() => void} afterBindItemsCallback
   */
  bind_items(afterBindItemsCallback) {
    if (!this.opts.wrap.length) {
      return false;
    }

    // DEBUG: Quitar los comentarios para crear un menu corto
    // // ----
    // const lastItem = opts.data[opts.data.length - 1];
    // opts.data = opts.data.slice(0, 6);
    // opts.data.push(lastItem);
    // // ----
    this.#removeDisabledItems()
      .then((items) => {
        this.opts.data = items.filter((menuItem) => {
          return menuItem.isEnabled === true;
        });
        this.opts.itemIndex = 0;
        this.opts.translation = 0;
        if (this.opts.isHome && !this.opts.isInfinite) {
          this.opts.itemIndex = 1;
        }
        this.#buildMenu();
        if (typeof afterBindItemsCallback === "function") {
          afterBindItemsCallback();
        }
      })
      .catch((error) => console.error(error));
  }

  /**
   * Construye la plantilla html del elemento del menu en la posicion
   * {@link index}
   *
   * @param {number} index
   * @returns {string}
   */
  bind_item(index) {
    const itemData = this.opts.data[index];
    const ariaHidden = true;
    // Control parental check
    if (itemData.ageRating_min && !ControlParentalMng.instance.isAgeRatingAllowed(itemData.ageRating_min)) {
      return "";
    }

    // Separator
    let separatorClass = "";
    let next = index + IndexConstants.endOffset;
    if (next == this.opts.data.length) {
      next = IndexConstants.start;
    }

    const is_icon = (itemData["icon"] && this.opts.checkIconMenu.includes(itemData["icon"])) || null;
    const next_is_icon = this.opts.data[next]["icon"] || null;
    const prev_is_icon = this.opts.data[index - 1]?.["icon"];
    const is_tooltip = itemData["tooltip"];
    const iconName = is_icon ? itemData["icon"] : null;

    const tagIconName = iconName ? iconName : null;
    const tag = tagIconName ? `tag="${tagIconName}"` : "";
    const title = !is_icon && itemData["menuTitle"] ? itemData["menuTitle"] : "";
    const tooltip = tagIconName && is_tooltip ? `tooltip="${itemData.tooltip}" aria-hidden="${ariaHidden}"` : "";

    //Si no hay configurado icono para la opción, no se presentará tooltip, aunque esté configurado.
    if ((title && next_is_icon) || (!is_icon && !next_is_icon && prev_is_icon)) separatorClass = "separator";
    // Profile icon
    let profilesClass = "";
    if (itemData.type === "profiles" && itemData.title.search("icon") != IndexConstants.notFound)
      profilesClass = "menu-profile";
    let classNames = `menu-item ${separatorClass} ${profilesClass} ${index === this.opts.itemIndex ? "active" : ""}`;
    classNames = classNames.replace(/\s+/g, " ").trim();

    return String.raw`<li class="${classNames}" ${tag} ${tooltip} data-index='${index}'>${title}</li>`;
  }

  /**
   * make force sliding
   *
   * @param {number} index
   */
  sel_item(index) {
    if (index < IndexConstants.start && index >= this.opts.data.length) {
      throw new Error("Indice fuera de límites");
    }
    this.opts.itemIndex = index;
    this.#buildMenu();
    const { prev, current, activateCurrent } = this.#getCurrentMenuItem();
    this.opts.translation = 0;
    //
    //  Se desplaza los elementos antes del seleccionado MENOS la posicion cuando
    //  se inicializó el menu.
    //
    const translation = this.#getCalculatedTranslation(-this.#translationInitial);
    this.#translate(-translation);
    activateCurrent();
    this.#updateTooltips(prev, current);
  }

  sel_item_move() {
    ControlParentalMng.instance.hideNotAllowed();
  }

  getType() {
    return this.opts.type;
  }

  /**
   * activate previous item
   */
  prev_slide() {
    this.#moveItem("translate-left");
  }

  /**
   * activate next item
   */
  next_slide() {
    this.#moveItem("translate-right");
  }

  /**
   * get activated item index
   */
  get_index() {
    return this.opts.itemIndex;
  }

  /**
   * destroy slider
   */
  destroy() {
    this.removeSlidersItemsActive();
    this.#destroyTooltip();
    this.opts.wrap[0].classList.remove("active");
  }

  /**
   * invoca el click del elemento activo
   */
  click() {
    const itemData = this.opts.data[this.opts.itemIndex];
    if (itemData) {
      this.opts.events.emit("menuItemClick", {
        itemIndex: this.opts.itemIndex,
        itemData,
      });
    }
  }

  /**
   * @param {string} str
   * @param {number} [positionClass]
   * // DE MOMENTO, dejo la funcionalidad comentada, porque se ha cambiado la anera de extraer la class y la estructura del HTML
  #extractClassString(str, positionClass) {
    const parser = new DOMParser();
    const item = parser.parseFromString(str, "application/xml");
    const _span = item.querySelector("span");
    const className = _span ? _span.classList[positionClass] : null;
    return className;
  }
  */

  /**
   * @param {Element} prevItem
   * @param {Element} itemIndex
   */
  #updateTooltips(prevItem, itemIndex) {
    this.#destroyTooltip();
    let currentItem = itemIndex;
    this.opts.currentItem = currentItem;

    const currentProfiles = currentItem.querySelectorAll(".perfiles-tooltip");
    const menuItem = (/** @type {Element} */ item) => {
      const element = item?.getAttribute("tooltip") || false;
      return element;
    };

    let prevProfiles = null;
    if (prevItem) {
      prevProfiles = prevItem.querySelectorAll(".perfiles-tooltip");
      if (prevProfiles.length > IndexConstants.start) {
        prevProfiles[0].classList.remove("on");
        prevProfiles[0].classList.add("off");
      }
    }

    if (currentProfiles.length > IndexConstants.start) {
      currentProfiles[0].classList.remove("off");
      currentProfiles[0].classList.add("on");
    }

    if (menuItem(currentItem) || menuItem(prevItem)) {
      this.opts.timeOutShowToolTip = setTimeout(() => {
        if (currentItem === prevItem) currentItem = this.#wrapper.querySelector(".menu-item.active");
        menuItem(currentItem) ? currentItem?.classList.add("tooltipOn") : false;
        this.opts.timeOutHideToolTip = setTimeout(() => {
          menuItem(prevItem) ? prevItem?.classList.remove("tooltipOn") : false;
          menuItem(currentItem) ? currentItem?.classList.remove("tooltipOn") : false;
        }, this.opts.tooltipHide);
      }, this.opts.tooltipShow);
    }
  }

  #changeProfileIndex() {
    const profileElement = this.opts.data.pop();
    this.opts.data.splice(IndexConstants.start, IndexConstants.start, profileElement);
  }

  /**
   * @param {number} amount
   */
  #translate(amount) {
    this.opts.translation += amount;
    const style = `transform: translate3d(${this.opts.translation}px, 0px, 0px)`;
    this.#wrapper.setAttribute("style", style);
  }

  #destroyTooltip() {
    this.opts.currentItem ? this.opts.currentItem.classList.remove("tooltipOn") : false;
    this.opts.timeOutHideToolTip ? clearTimeout(this.opts.timeOutHideToolTip) : null;
    this.opts.timeOutShowToolTip ? clearTimeout(this.opts.timeOutShowToolTip) : null;
  }

  isActiveFirstItem() {
    const notInfiniteStartIndex = 1;
    if (this.opts.isInfinite) {
      return this.opts.itemIndex === IndexConstants.start;
    }
    return this.opts.itemIndex === notInfiniteStartIndex;
  }

  checkEnabledItems() {
    this.#removeDisabledItems().then((items) => {
      const newData = items.filter((menuItem) => {
        return menuItem.isEnabled === true;
      });
      const currentItem = this.opts.data[this.opts.itemIndex];
      let targetIndex = newData.findIndex((item) => {
        return item.nombre === currentItem?.nombre;
      });
      targetIndex = targetIndex <= newData.length ? (targetIndex < 0 ? 0 : targetIndex) : 0;
      this.opts.data = newData;
      this.sel_item(targetIndex);
    });
  }

  async #removeDisabledItems() {
    const { VOD } = unirlib.getJsonConfig() ?? {};
    if (!VOD?.Submenu) return;
    const json_cfg = VOD.Menu.Item;
    const menuData = this.opts.originalData;
    const menuDataCpy = menuData.slice();
    const tempArray = [];

    for (let i = 0; i < menuDataCpy.length; i++) {
      menuDataCpy[i].isEnabled = true;
      if (menuDataCpy[i].type === "3pa" || menuDataCpy[i].type === "ep") {
        const name = menuDataCpy[i].nombre;
        const configElement = json_cfg.find((objeto) => objeto["@nombre"] === name);
        const isEnabled = await this.#getIsAvailableByEnabler(configElement["@habilitador"]);
        if (!isEnabled) menuDataCpy[i].isEnabled = false;
      }
      tempArray.push(menuDataCpy[i]);
    }
    return tempArray;
  }

  async #getIsAvailableByEnabler(/** @type {String} */ habilitador) {
    return await EnablersMng.instance.getEnablerIsAvailable(habilitador);
  }

  #setInitialTranslation() {
    if (!this.#isInitialized) {
      //
      //  Aqui se calcula el desplazamiento inicial que tiene el item inicial
      //  del menu
      //
      const initialValue = 0;
      this.#translationInitial = this.#getCalculatedTranslation(initialValue);
      this.#isInitialized = true;
    }
  }

  get #wrapper() {
    return this.opts.elems["wrapper"];
  }

  /**
   * Función que me devuelve el elemento del MENÚ que debería estar como "active", en estos momentos debería ser el 2 elemento del MENÚ.
   * @return {HTMLElement|undefined}
   */
  get #expectedItemAsActive() {
    let expectedItemAsActive = undefined;
    if (this.opts.elems["wrapper"] && this.opts.elems["wrapper"].children.length > 2) {
      const POSITION_EXPECTED_AS_SELECTED = this.opts.prevItemsCount;
      const element = this.opts.elems["wrapper"].children[POSITION_EXPECTED_AS_SELECTED];
      if (element instanceof HTMLElement) {
        expectedItemAsActive = element;
      }
    }
    return expectedItemAsActive;
  }

  #getCurrentMenuItem() {
    const prev = this.#wrapper.querySelector(".menu-item.active");
    prev?.classList.remove("active");
    const current = this.#wrapper.querySelector(`[data-index="${this.opts.itemIndex}"]`);
    if (prev !== current) prev?.classList.remove("active");
    this.addSlidersItemsActive();
    // current.classList.add("active");
    return {
      current,
      prev,
      activateCurrent: () => current.classList.add("active"),
    };
  }

  /**
   * @param {"translate-right" | "translate-left"} direction
   * @returns {void}
   */
  #moveItem(direction) {
    if (direction !== "translate-right" && direction !== "translate-left") {
      return;
    }
    this.opts.itemIndex = this.#calculateNextItemIndexFrom(this.opts.itemIndex, direction);
    const { current, prev, activateCurrent } = this.#getCurrentMenuItem();

    //  Fuerzar el borrado clases transición porque en movimientos rápidos a veces
    //  no terminan de borrarse
    this.#wrapper.classList.remove("translate-right", "translate-left");

    this.#changeSpeedTranslate();
    if (this.opts.isInfinite) {
      KeyMng.instance.kdStartAnimation();
      this.#wrapper.classList.add(direction);
      this.#wrapper.classList.remove("notransition");
    }

    if (direction === "translate-left") {
      this.#translate(current?.clientWidth);
    } else if (direction === "translate-right") {
      this.#translate(-prev?.clientWidth);
    }

    activateCurrent();
    prev?.classList.remove("tooltipOn");
    current?.classList.remove("tooltipOn");
    this.#updateTooltips(prev, current);

    this.endMove(this.opts.itemIndex);
  }

  /**
   * Captura el evento al terminar una transicion
   *
   * si se esta moviendo a la derecha o a la izquierda rota los
   * items para hacer el efecto de circularidad
   *
   * @param {TransitionEvent} event
   */
  #onTransitionEnd(event) {
    // Descartamos los eventos de los pseudoElementos (before y after)
    if (["::before", "::after"].includes(event.pseudoElement)) {
      return;
    }
    /** @type {HTMLElement|undefined} */
    // @ts-ignore
    const target = event?.target;
    this.#wrapper.classList.add("notransition");

    const direction = target?.classList.contains("translate-right") ? "translate-right" : "translate-left";
    let numMovements = this.#calculateNumOfNecessaryMovements(direction);
    while (numMovements > 0) {
      this.#sliderOneElement(direction);
      numMovements--;
    }
    this.#wrapper.classList.remove(direction);

    const fastTimeMs = 50;
    setTimeout(() => {
      KeyMng.instance.kdEndAnimation();
    }, fastTimeMs);
  }

  /**
   * Función que desliza un elemento del Menú en la dirección indicada
   * @param {"translate-right"|"translate-left"|undefined} direction Dirección en la que nos estamos moviendo.
   */
  #sliderOneElement(direction) {
    const [firstItem] = this.#wrapper.children;
    const lastItem = this.#wrapper.children[this.#wrapper.childElementCount - IndexConstants.endOffset];

    if (direction == "translate-right") {
      this.#wrapper.insertBefore(firstItem, null);
      this.#translate(firstItem.clientWidth);
    }
    if (direction == "translate-left") {
      this.#wrapper.insertBefore(lastItem, firstItem);
      this.#translate(-lastItem.clientWidth);
    }
  }

  /**
   * Función que calcula cuántas veces tenemos que desplazar para alcancar el INDEX actual.
   * ¡OJO! se hizo ésto porque al movernos de forma impulsiva horizontalmente.
   * @param {"translate-right"|"translate-left"} direction Dirección en la que nos estamos moviendo.
   */
  #calculateNumOfNecessaryMovements(direction) {
    /** @type {HTMLElement|undefined} */
    const expectedItemAsActive = this.#expectedItemAsActive;
    const expectedIndex = parseInt(expectedItemAsActive.dataset?.index);
    let numMovements = 0;
    let nextItemIndex = expectedIndex;

    if (this.opts.data.length > 0) {
      for (let i = 0; i < this.opts.data.length; i++) {
        nextItemIndex = this.#calculateNextItemIndexFrom(nextItemIndex, direction);
        numMovements++;
        if (nextItemIndex == this.opts.itemIndex) {
          break;
        }
      }
    }
    return numMovements;
  }

  #changeSpeedTranslate() {
    if (KeyMng.instance.kdPressingFast()) {
      this.#wrapper.classList.remove("slow");
      this.#wrapper.classList.add("fast");
    } else {
      this.#wrapper.classList.remove("fast");
      this.#wrapper.classList.add("slow");
    }
  }

  #getCalculatedTranslation(initialValue = 0) {
    let newValue = initialValue;
    let homeIsHidden = false;
    if (HomeMng.instance.isHidden()) {
      homeIsHidden = true;
      HomeMng.instance.show();
    }
    const items = this.#wrapper.querySelectorAll(".menu-item");
    if (this.opts.isInfinite) {
      for (let i = 0; i < this.opts.prevItemsCount; i++) {
        newValue += items[i]?.clientWidth;
      }
    } else if (this.opts.isHome) {
      newValue -= items[0]?.clientWidth;
    }
    if (homeIsHidden) {
      HomeMng.instance.hide();
    }
    return newValue;
  }

  /**
   * Obtiene los elementos del menu que se van a mostrar
   *
   * @returns {string[]}
   */
  #getMenuItems() {
    let menuItems = [];
    const { data } = this.opts;

    // Crear un arreglo de datos con los indices de posicion
    const dataWithIndex = data.map((item, index) => ({ ...item, _index: index }));
    if (this.opts.isInfinite) {
      const { prevItemsCount } = this.opts;
      menuItems = rotate(dataWithIndex, this.opts.itemIndex - prevItemsCount).map((i) => this.bind_item(i._index));
    } else {
      for (let i = 0; i < dataWithIndex.length; i++) {
        menuItems.push(this.bind_item(i));
      }
    }

    return menuItems;
  }

  #buildMenu() {
    this.opts.wrap.html("");
    const menuItems = this.#getMenuItems();
    const template = String.raw`<ul tabindex="0" class="menu-wrapper">${menuItems.join(" ")}</ul>`;
    const [container] = this.opts.wrap;
    const element = container instanceof HTMLElement ? container : document.querySelector(container);
    element.innerHTML = template;

    //
    //  Create el Wrapper
    //
    this.opts.elems["wrapper"] = document.querySelector(".menu-wrapper");
    this.opts.elems["wrapper"].focus();
    if (this.opts.isInfinite) {
      this.opts.elems["wrapper"].addEventListener("transitionend", this.#onTransitionEnd.bind(this));
    }
    profileEmergencyIconMenu();
  }

  /**
   *
   * @param {number} itemIndex Índice actual
   * @param {"translate-right"|"translate-left"|undefined} direction Dirección en la que nos movemos
   * @returns {number}
   */
  #calculateNextItemIndexFrom(itemIndex, direction) {
    let nextItemIndex = itemIndex;
    if (direction === "translate-left") {
      if (this.opts.isInfinite && itemIndex === IndexConstants.start) {
        nextItemIndex = this.opts.data.length - IndexConstants.endOffset;
      } else {
        nextItemIndex--;
      }
    }
    if (direction === "translate-right") {
      if (this.opts.isInfinite && itemIndex === this.opts.data.length - IndexConstants.endOffset) {
        nextItemIndex = IndexConstants.start;
      } else {
        nextItemIndex++;
      }
    }
    return nextItemIndex;
  }
}

/**
 * @typedef {Object} MenuItemData
 * @property {string} title
 * @property {number|number} ageRating_min
 * @property {string} tooltip Tootip de menu
 * @property {string} type
 * @property {string} nombre para hacer busquedas en el enabler
 * @property {number} _index
 * @property {boolean} isEnabled estado de habilitador
 */
