// @ts-check

import { AppStore } from "src/code/managers/store";
import { Main } from "@tvMain";
import { serverRequest } from "@unirlib/server/server-request";

import { BaseMng } from "./base-mng";

const EMPTY_VALUE = "";
const isObject = (/** @type {?} */ o) => typeof o === "object" && !Array.isArray(o);

/**
 * Clase base que maneja obtener valores desde el directorio de servicios
 * y almacenarlos localmente
 *
 * @template T
 */
export class StoreMngBase extends BaseMng {
  #service = "";
  #endpoint = "";
  #storageKey = "";

  /**
   * @param {string} service
   * @param {string} endpoint
   * @param {string} storageKey
   */
  constructor(service, endpoint, storageKey) {
    super(storageKey);
    this.#endpoint = endpoint;
    this.#service = service;
    this.#storageKey = storageKey;
  }

  get storageKey() {
    return this.#storageKey;
  }

  /**
   * Verifica si la data esta vacia
   * @param {StoredValue<T>} value
   * @returns {boolean} true si la data es vacia
   */
  getValueIsEmpty(value) {
    return value === EMPTY_VALUE;
  }

  /**
   * Carga la informacion bien sea desde local o desde el directorio de
   * servicios
   */
  async load() {
    if (this.isEnabled) {
      try {
        const value = await this.#readValue();
        await this.#writeToStorage(value);
        this._afterLoad(value);
      } catch (error) {
        this.logError("load:error", error);
      }
    } else {
      this._afterLoad(await this._getDefaultValue());
      return;
    }
  }

  /**
   * Obtiene el valor por omision si falla el local y el remoto
   *
   * @returns {Promise<StoredValue<T>>}
   */
  async _getDefaultValue() {
    return EMPTY_VALUE;
  }

  /**
   * @type {AfterLoad<StoredValue<T>>}
   */
  _afterLoad() {
    throw new Error("Must Implement _afterLoad");
  }

  async clearStorage() {
    try {
      const value = await this.#readFromStorage();
      if (!this.getValueIsEmpty(value)) {
        await Main.setConfigParam(this.#storageKey, EMPTY_VALUE);
      }
    } catch (error) {
      this.logError("clearStorage:error", error);
    }
  }

  async #readValue() {
    /** @type {StoredValue<T>} */
    let value = await this.#readFromRemote();
    if (this.getValueIsEmpty(value)) {
      value = await this.#readFromStorage();
    }
    if (this.getValueIsEmpty(value)) {
      value = await this._getDefaultValue();
    }
    return value;
  }

  /**
   * @returns {Promise<T|"">}
   */
  async #readFromRemote() {
    /** @type {StoredValue<T>} */
    let response = EMPTY_VALUE;
    try {
      const url = await this.#getServiceUrl();
      if (isObject(url) && url?.url.length) {
        response = await serverRequest(url, { interval: 0 });
        this.log("#readFromRemote success");
      } else {
        throw new Error(`${this.#service}/${this.#endpoint} is empty`);
      }
    } catch (error) {
      this.logError("#readFromRemote:error", error);
    }
    return response;
  }

  async #getServiceUrl() {
    return AppStore.wsData.getURLTkservice(this.#service, this.#endpoint);
  }

  /**
   * @returns {Promise<StoredValue<T>>}
   */
  async #readFromStorage() {
    /** @type {StoredValue<T>} */
    let value = EMPTY_VALUE;
    try {
      value = await Main.getConfigParam(this.#storageKey);
      if (this.getValueIsEmpty(value)) {
        throw new Error(`Local '${this.#storageKey}' is empty`);
      }
      this.log("#readFromStorage success");
    } catch (error) {
      this.logError("#readFromStorage:error", error);
    }
    return value;
  }

  /**
   * @param {StoredValue<T>} value
   */
  async #writeToStorage(value) {
    try {
      await Main.setConfigParam(this.#storageKey, value);
      this.log("#writeToStorage success");
    } catch (error) {
      this.logError("#writeToStorage:error", error);
    }
  }
}

/**
 * @template T
 * @callback AfterLoad
 * @param {T} data
 * @returns {void}
 */

/**
 * @template T
 * @typedef {T | ""} StoredValue
 */
