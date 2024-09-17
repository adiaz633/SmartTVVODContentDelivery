import { AppStore } from "src/code/managers/store/app-store";
import { debug } from "@unirlib/utils/debug";

export const storage = function () {
  var _fileName = "unir.db";
  var _data = null;
  var _changed = false;

  storage.prototype.readFile = function () {
    debug.alert("storage.prototype.readFile: " + _fileName);
    _data = AppStore.fileUtils.readJSON(_fileName);
    debug.alert("storage.prototype.readFile FILENAME CARGADO: " + _fileName + " " + JSON.stringify(_data));
    if (_data == null) this.buildJSON();
  };

  storage.prototype.saveFile = function () {
    if (_changed) {
      debug.alert("storage.prototype.saveFile: " + _fileName);
      debug.alert("storage.prototype.saveFile: " + JSON.stringify(_data));
      AppStore.fileUtils.saveJSON(_fileName, _data);
    }
  };

  storage.prototype.deleteFile = function () {
    AppStore.fileUtils.deleteJSON(_fileName);
  };

  storage.prototype.getItem = function (key) {
    return _data[key];
  };

  storage.prototype.setItem = function (key, value) {
    _changed = true;
    _data[key] = value;
  };

  storage.prototype.buildJSON = function () {
    _data = {};
  };
};
