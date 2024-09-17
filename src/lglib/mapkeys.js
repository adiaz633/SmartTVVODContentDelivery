import { ykeys } from "@unirlib/scene/ykeys";

export const mapkeys = function () {
  this._isDisabled = false;

  mapkeys.prototype.convert = function (keyCode) {
    var keyConvert = keyCode;

    if (this._isDisabled) {
      this._isDisabled = false;
      return keyCode;
    }

    if (keyCode == 56) keyConvert = ykeys.VK_8;
    else if (keyConvert == 107) keyConvert = ykeys.VK_CH_UP;
    else if (keyConvert == 109) keyConvert = ykeys.VK_CH_DOWN;
    else if (keyCode == 8) keyConvert = ykeys.VK_BACK;
    else if (keyCode == 20)
      // BLOQ MAYUS
      keyConvert = ykeys.VK_MAYUS;

    return keyConvert;
  };

  mapkeys.prototype.convertKeyDisable = function () {
    this._isDisabled = true;
  };
};
