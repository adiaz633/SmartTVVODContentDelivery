// @ts-check

import { logger, LogLevelError } from "src/code/js/logger";

import { Config } from "./config";

export class Debuggable {
  #isDebugEnabled = false;
  #name = "";

  /**
   * @param {string} name
   */
  constructor(name) {
    this.#name = name;

    if (Config.instance.getDebugIsEnabled(this.#name)) {
      this.enableDebug();
    }
  }

  enableDebug() {
    this.#isDebugEnabled = true;
  }

  get isDebugEnabled() {
    return this.#isDebugEnabled;
  }

  /**
   * Log info
   * @param  {...any} args
   * @returns
   */
  log(...args) {
    if (!this.isDebugEnabled) {
      return;
    }
    // @ts-ignore
    logger.log(`(${this.#name}):`, ...args);
  }

  /**
   * Log Error
   * @param {...any} args
   */
  logError(...args) {
    this.log(LogLevelError, ...args);
  }
}

export class BaseMng extends Debuggable {
  #isEnabled = true;

  constructor(managerName) {
    super(managerName);

    if (Config.instance.getIsDisabled(managerName)) {
      this.disableManager();
    }
  }

  get isEnabled() {
    return this.#isEnabled;
  }

  disableManager() {
    this.#isEnabled = false;
  }
}
