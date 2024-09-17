// @ts-check

import { updateAppConfig } from "@appConfig";

import { StoreMngBase } from "./store-mng-base";

let _instance;

/**
 * Config manager (posibilita carga de mensajes y config desde remoto)
 */
export class ConfigMng extends StoreMngBase {
  /**
   * @type {ConfigMng}
   */
  static get instance() {
    if (_instance === undefined) {
      _instance = new ConfigMng();
    }
    return _instance;
  }

  constructor() {
    super("tfgunir/config", "appParams", "appParams");
  }

  _afterLoad(config) {
    if (this.getValueIsEmpty(config)) {
      return;
    }
    updateAppConfig(config);
  }
}
