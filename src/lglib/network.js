import { AppStore } from "src/code/managers/store/app-store";

export const network = function () {
  this._disconnected = false;

  network.prototype.setDisconnected = function (discon) {
    this._disconnected = discon;
  };



};
