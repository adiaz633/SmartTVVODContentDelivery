// @ts-check

import { BaseMng } from "@newPath/managers/base-mng";
import { EventEmitter } from "events";

/**
 * Base de eventos
 *
 * @template {Record<string, string>} TEventMap
 */
export class EventEmitterBaseMng extends BaseMng {
  /** @type {EventEmitter} */
  #emitter = new EventEmitter();

  /**
   * @param {string} [managerName] Nombre del manager
   */
  constructor(managerName) {
    super(managerName || "EventEmitterBaseMng");
  }

  /**
   * Asocia un escucha a un evento y devuelve la funcion de cancelacion de escucha
   * @param {keyof TEventMap} eventName Nombre del evento
   * @param {EventEmitterBaseListener<TEventMap>} listener funcion de escucha del evento
   */
  on(eventName, listener) {
    this.#emitter.on(/** @type {string | symbol} */ (eventName), listener);
    return () => {
      this.#emitter.off(/** @type {string | symbol} */ (eventName), listener);
    };
  }

  /**
   * Asocia un escucha a un evento para UNA SOLA VEZ y devuelve la funcion de cancelacion de escucha
   * @param {keyof TEventMap} eventName Nombre del evento
   * @param {EventEmitterBaseListener<TEventMap>} listener funcion de escucha del evento
   */
  once(eventName, listener) {
    this.#emitter.once(/** @type {string | symbol} */ (eventName), listener);
    return () => {
      this.#emitter.off(/** @type {string | symbol} */ (eventName), listener);
    };
  }

  /**
   * @template TEventArg
   * @param {keyof TEventMap} eventName Nombre del evento
   * @param {TEventArg} eventArg argumento del evento
   */
  emit(eventName, eventArg) {
    this.#emitter.emit(/** @type {string | symbol} */ (eventName), eventArg);
  }
}

/**
 * @template TArgument
 * @callback EventEmitterBaseListener
 * @param {TArgument} eventArgument
 * @returns {void}
 */
