// @ts-check

import { BaseMng } from "@newPath/managers/base-mng";
import { EventEmitter } from "events";

import { Mutex } from "./mutex";

/**
 * Bus de eventos asíncrono
 *
 * @template {Record<string, string>} TEventMap
 */
export class EventEmitterAsyncMng extends BaseMng {
  /** @type {EventEmitter} */
  #emitter = new EventEmitter();

  /** @type {Mutex} */
  #mutex = new Mutex();

  /**
   * @param {string} [managerName] Nombre del manager
   */
  constructor(managerName) {
    super(managerName || "EventEmitterAsyncMng");
  }

  /**
   * Agrega un escucha a un evento
   *
   * @param {keyof TEventMap} eventName Nombre del evento a escuchar
   * @param {AsyncListener} listener
   * @returns {()=>void} Funcion de remover el escucha
   */
  on(eventName, listener) {
    const asyncListener = this.#listenerFactory(listener);
    this.#emitter.on(/** @type {string | symbol} */ (eventName), asyncListener);
    return () => {
      this.#emitter.off(/** @type {string | symbol} */ (eventName), asyncListener);
    };
  }

  /**
   * Dispara un evento y espera que se ejecuten todos los escuchas
   *
   * @param {keyof TEventMap} eventName Nombre del evento
   * @param  {...any} args Argumentos
   */
  async emit(eventName, ...args) {
    this.#emitter.emit(/** @type {string | symbol} */ (eventName), ...args);
    const release = await this.#mutex.acquire();
    release();
  }

  /**
   * Anota una funcion con un manejo de sincronia
   *
   * @param {AsyncListener} listener
   * @returns {AsyncListener}
   */
  #listenerFactory(listener) {
    return async (...args) => {
      const release = await this.#mutex.acquire();
      try {
        await listener(...args);
      } finally {
        release();
      }
    };
  }
}

/**
 * Escucha asincrono de eventos
 * @callback AsyncListener
 * @param {...any} args Argumentos
 * @return {Promise<void>}
 */
