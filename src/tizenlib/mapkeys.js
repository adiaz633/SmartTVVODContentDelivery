import { ykeys } from "@unirlib/scene/ykeys";
import { debug } from "@unirlib/utils/debug";

export const mapkeys = function () {
  this._isDisabled = false;

  mapkeys.prototype.convert = function (keyCode) {
    var keyConvert = keyCode;

    if (this._isDisabled) {
      this._isDisabled = false;
      return keyCode;
    }

    if (keyCode == 428) keyConvert = ykeys.VK_CH_DOWN;
    else if (keyCode == 427) keyConvert = ykeys.VK_CH_UP;
    else if (keyCode == 10009) keyConvert = ykeys.VK_BACK;
    else if (keyCode == 10182) keyConvert = ykeys.VK_EXIT;

    return keyConvert;
  };

  mapkeys.prototype.convertKeyDisable = function () {
    this._isDisabled = true;
  };

  mapkeys.prototype.registerKeys = function () {
    try {
      const tizen = window.tizen;
      tizen.tvinputdevice.registerKey("0");
      tizen.tvinputdevice.registerKey("1");
      tizen.tvinputdevice.registerKey("2");
      tizen.tvinputdevice.registerKey("3");
      tizen.tvinputdevice.registerKey("4");
      tizen.tvinputdevice.registerKey("5");
      tizen.tvinputdevice.registerKey("6");
      tizen.tvinputdevice.registerKey("7");
      tizen.tvinputdevice.registerKey("8");
      tizen.tvinputdevice.registerKey("9");
      tizen.tvinputdevice.registerKey("ChannelDown");
      tizen.tvinputdevice.registerKey("ChannelUp");
      tizen.tvinputdevice.registerKey("ColorF0Red");
      tizen.tvinputdevice.registerKey("ColorF1Green");
      tizen.tvinputdevice.registerKey("ColorF2Yellow");
      tizen.tvinputdevice.registerKey("ColorF3Blue");
      tizen.tvinputdevice.registerKey("MediaFastForward");
      tizen.tvinputdevice.registerKey("MediaPause");
      tizen.tvinputdevice.registerKey("MediaPlay");
      tizen.tvinputdevice.registerKey("MediaRewind");
      tizen.tvinputdevice.registerKey("MediaStop");
      tizen.tvinputdevice.registerKey("MediaPlayPause");
      tizen.tvinputdevice.registerKey("Info");
    } catch (e) {
      debug.alert("mapkeys.prototype.registerKeys ERROR: " + e.toString());
    }
  };
};
