import { ykeys } from "@unirlib/scene/ykeys";

export const mapkeys = function () {
  this._isDisabled = false;

  mapkeys.prototype.convert = function (keyCode) {
    var keyConvert = keyCode;

    if (this._isDisabled) {
      this._isDisabled = false;
      return keyCode;
    }

    if (keyCode == 183) keyConvert = ykeys.VK_RED;
    else if (keyCode == 184) keyConvert = ykeys.VK_GREEN;
    else if (keyCode == 186) keyConvert = ykeys.VK_BLUE;
    else if (keyCode == 185) keyConvert = ykeys.VK_YELLOW;
    else if (keyCode == 4 || keyCode == 8) keyConvert = ykeys.VK_BACK;
    else if (keyCode == 15) keyConvert = ykeys.VK_8;
    else if (keyConvert == 166) keyConvert = ykeys.VK_CH_UP;
    else if (keyConvert == 167) keyConvert = ykeys.VK_CH_DOWN;

    /*
		else if (keyCode==20) // BLOQ MAYUS
			keyConvert = ykeys.VK_MAYUS;
*/

    return keyConvert;
  };

  mapkeys.prototype.convertKeyDisable = function () {
    this._isDisabled = true;
  };
};
