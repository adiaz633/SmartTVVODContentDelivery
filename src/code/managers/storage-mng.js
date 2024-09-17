import { Main } from "@tvMain";

let instance = null;

export class StorageMng {
  constructor() {}

  static get instance() {
    if (instance) {
      return instance;
    }
    instance = new StorageMng();
    return instance;
  }

  async getConfigParam(param) {
    return await Main.getConfigParam(param);
  }

  async setConfigParam(param, value) {
    return await Main.setConfigParam(param, value);
  }
}
