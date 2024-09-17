import { appConfig } from "@appConfig";
import { debug } from "@unirlib/utils/debug";

export function device() {
  var _firmware = null;
  var _devtype = null; // 0:emulator  1:2011   2:2012
  var _devUID = null;
  var _prodtype = null;
  var _devmodel = null;

  var _webos = false;
  var _webos3 = false;
  var _devVersion = null;

  device.prototype.initialize = function () {
    var device = document.getElementById("device");
    debug.alert("device.prototype.initialize device ", device);
    _devVersion = device.swVersion;
    _devUID = device.serialNumber;
    debug.alert("device.prototype.initialize _devUID " + _devUID);
    if (_devUID == undefined || _devUID == null) {
      _devUID = "1234";
      _devtype = 0;
    } else {
      if (device.chipset == "undefined") _devtype = 1;
      else _devtype = device.chipset;
    }

    var userAgent = new String(navigator.userAgent);
    debug.alert("device.prototype.initialize webos " + userAgent);

    if (userAgent.search(/webOS/) > -1) {
      _webos = true;

      if (userAgent.indexOf("AppleWebKit/537.36") > -1) _webos3 = true;
      if (userAgent.indexOf("TV-2016") > -1) _webos3 = true;
    }

    this.debug();
  };

  device.prototype.is_native_player_device = function () {
    var is_native = false;
    if (appConfig.PLAYER_TYPE.toLowerCase() == "ss") is_native = true;
    else if (appConfig.PLAYER_TYPE.toLowerCase() == "mdrm") is_native = false;
    else if (appConfig.PLAYER_TYPE.toLowerCase() == "dual") var is_native = this.is_native();
    var is_http = window.location.protocol == "http:";
    is_native = is_native || is_http;
    return is_native;
  };
 
  device.prototype.get_webos_version = function () {
    var userAgent = new String(navigator.userAgent);
    var str_split = userAgent.split(";");
    var w_version = "";
    var exito = false;
    var i = 0;
    while (!exito && i < str_split.length) {
      exito = str_split[i].search("webOS.") > -1;
      if (!exito) i++;
    }
    w_version = str_split[i];
    debug.alert("device.prototype.get_webos_version: " + w_version); // i.e: webOS.TV-2018
    return w_version;
  };

  device.prototype.get_so = function () {
    var sistema = this.get_webos_version();
    sistema = sistema ? sistema : "";
    return sistema;
  };

  device.prototype.debug = function () {
    var device = document.getElementById("device");
    debug.alert("device.manufacturer " + device.manufacturer);
    debug.alert("device.modelName " + device.modelName);
    debug.alert("device.serialNumber " + device.serialNumber);
    debug.alert("device.swVersion " + device.swVersion);
    debug.alert("device.hwVersion " + device.hwVersion);
    debug.alert("device.osdResolution " + device.osdResolution);
    debug.alert("device.uhd " + device.uhd);
    debug.alert("device.uhd8K " + device.uhd8K);
    debug.alert("device.hdr10 " + device.hdr10);
    debug.alert("device.dolbyAtmos " + device.dolbyAtmos);
  };

  device.prototype.getDevVersion = function () {
    return _devVersion || this.get_webos_version();
  };
  device.prototype.getProdType = function () {
    return _prodtype;
  };

  device.prototype.getDevType = function () {
    return _devtype;
  };

  device.prototype.getDevFirmware = function () {
    return navigator.userAgent;
  };

  device.prototype.getDevModel = function () {
    return _devmodel;
  };

  device.prototype.getDevUID = function () {
    return _devUID;
  };

  device.prototype.validFirmware = function () {
    var result = true;

    return result;
  };

  device.prototype.isWebos = function () {
    return _webos;
  };

  device.prototype.isWebos3 = function () {
    return _webos3;
  };

  device.prototype.isUHD = function () {
    return true; //TODO: check if is UHD
  };
}
