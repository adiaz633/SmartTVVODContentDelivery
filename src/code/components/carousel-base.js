// @ts-check

import { Debuggable } from "src/code/managers/base-mng";
import { EventEmitter } from "events";

export class CarouselBase extends Debuggable {
  /**
   * @type {EventEmitter}
   */
  events = new EventEmitter();

  /** @type {ListenerFunction} */
  on_sel_item;

  /** @type {ListenerFunction} */
  on_sel_item_move;

  /** @type {ListenerFunction} */
  on_endMove;

  /** @type {ListenerFunction} */
  on_click;

  constructor() {
    super(new.target.name);

    this.sel_item = _decorateWithEventEmitter(this.sel_item.bind(this), "sel_item");
    this.on_sel_item = _createMethodAddListener(this.events, "sel_item");

    this.sel_item_move = _decorateWithEventEmitter(this.sel_item_move.bind(this), "sel_item_move");
    this.on_sel_item_move = _createMethodAddListener(this.events, "sel_item_move");

    this.endMove = _decorateWithEventEmitter(this.endMove.bind(this), "endMove");
    this.on_endMove = _createMethodAddListener(this.events, "endMove");

    this.click = _decorateWithEventEmitter(this.click.bind(this), "click");
    this.on_click = _createMethodAddListener(this.events, "click");
  }

  /**
   * @type {(index: number, ...args: any[]) => void}
   */
  sel_item() {}

  /**
   * @type {(index: number, ...args: any[]) => void}
   */
  sel_item_move() {}

  /**
   * @type {(index: number, ...args: any[]) => Promise<void> | void}
   */
  endMove() {}

  click() {}

  animate_start() {}

  animate_stop() {}

  focusOnButton() {}

  removeSlidersItemsActive() {
    const sliderItems = document.querySelector(".slider-items.active");
    if (sliderItems) {
      sliderItems.classList.remove("active");
    }
  }

  addSlidersItemsActive() {
    const sliderItems = document.querySelector(".slider-items:not(.active)");
    if (sliderItems) {
      sliderItems.classList.add("active");
    }
  }
}

/**
 * Decora un metodo con un emisor de eventos
 *
 * @template {Function} T
 * @param {T} method
 * @param {keyof CarouselBase} eventName
 * @returns {T}
 */
function _decorateWithEventEmitter(method, eventName) {
  /**
   * @this {CarouselBase}
   * @param {any[]} args
   */
  // @ts-ignore
  return function (...args) {
    let lastError = undefined;
    try {
      this.log(method.name);
      return method(...args);
    } catch (error) {
      lastError = error;
    } finally {
      this.events.emit(eventName, { error: lastError });
    }
  };
}

/**
 * Crea un __addListener__ para un metodo
 *
 * @param {EventEmitter} eventEmitter
 * @param {keyof CarouselBase} eventName
 * @returns { ListenerFunction }
 */
function _createMethodAddListener(eventEmitter, eventName) {
  return function on_property(/** @type {(...args: any[]) => void} */ listener) {
    eventEmitter.addListener(eventName, listener);
    return () => {
      eventEmitter.removeListener(eventName, listener);
    };
  };
}

/**
 * Funcion de escucha que devuelve una funcion de cleanup
 * @typedef {(listener: Function) => () => void} ListenerFunction
 */
