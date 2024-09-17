import { appConfig } from "@appConfig";

let _instance;

export class Config {
  /**
   * @type {readonly string[] | undefined}
   */
  #disabledItems; // = ["TransitionMng", "LoaderMng", "HomeMng"];

  /**
   * @type {readonly string[] | undefined}
   */
  #debugableItems; // = "ViewMng";

  /**
   * @type {Config}
   */
  static get instance() {
    if (!_instance) {
      _instance = new Config();
    }
    return _instance;
  }

  get disabledItems() {
    if (!Array.isArray(this.#disabledItems)) {
      this.#disabledItems = this.#parseArray(appConfig.DISABLED_ITEMS);
    }
    return this.#disabledItems;
  }

  get debugableItems() {
    if (!Array.isArray(this.#disabledItems)) {
      this.#debugableItems = this.#parseArray(appConfig.DEBUGABLED_ITEMS);
    }
    return this.#debugableItems;
  }

  getIsDisabled(/** @type {String} */ managerName) {
    return this.disabledItems.includes(managerName.toLowerCase());
  }

  getDebugIsEnabled(/** @type {String} */ managerName) {
    return this.debugableItems.includes(managerName.toLowerCase());
  }

  #parseArray(/** @type {string} */ value) {
    if (typeof value === "string") {
      return value
        .split(/,/)
        .map((str) => str.trim().toLowerCase())
        .filter((str) => str.length);
    }
    return [];
  }
}
