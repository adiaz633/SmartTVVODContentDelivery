export const ViewHubNames = Object.freeze({
  popup: Symbol("popup"),
  wizard: Symbol("wizard"),
  pin: Symbol("pin"),
  epg: Symbol("epg"),
  player: Symbol("player"),
  purchase: Symbol("purchase"),
});

let _instance;

/**
 * View Hub class
 */
export class ViewHub {
  /**
   * @type {ViewHub}
   */
  static get instance() {
    if (!_instance) {
      _instance = new ViewHub();
    }
    return _instance;
  }

  /**
   *  Add a view to the hub
   *
   * @template {T}
   * @param {HubKey} key Key to set
   * @param {T} value View class to store
   * @returns {ViewMap}
   */
  static inject(key, value) {
    return ViewHub.instance.set(key, value);
  }

  constructor() {
    /**
     * @private
     */
    this._views = new Map();
  }

  /**
   * Create a new instance of the view
   *
   * @param {HubKey} key Key to find
   * @param  {...any} args Arguments for the constructor
   * @returns {T} instantiated view
   * @template {new(...args) => BaseView} T
   */
  create(key, ...args) {
    const C = this.get(key);
    if (!C) {
      throw new Error(`ViewHub: ${key} Not found`);
    }
    return new C(...args);
  }

  /**
   * Get a view
   *
   * @template {T}
   * @param {HubKey} key Key to find
   * @returns {T}
   */
  get(key) {
    return this._views.get(key);
  }

  /**
   *  Add a view to the hub
   *
   * @template {T}
   * @param {HubKey} key Key to set
   * @param {T} value View class to store
   * @returns {ViewMap}
   */
  set(key, value) {
    return this._views.set(key, value);
  }
}

/**
 * @typedef {symbol|string} HubKey
 */

/**
 * @typedef {Map.<HubKey, T>} ViewMap<T>
 */

/**
 * @typedef {import("src/code/views/base-view").BaseView} BaseView
 */
