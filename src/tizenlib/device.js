import { appConfig } from "@appConfig";
import { debug } from "@unirlib/utils/debug";
import { avinfo, productinfo } from "tizen-tv-webapis";

export function device() {
  var _firmware = 0;
  var _devtype = 0; // 0:emulator  1:2011   2:2012
  var _devUID = 0;
  var _prodtype = 0;
  var _isUHD = false;
  var _modelname = "";
  var _supportAccelerator = "";

  var _tizen_platform = ""; // 2015, 2016, 2017

  device.prototype.initialize = function () {
    debug.alert("TIZEN device.prototype.initialize... ");

    // [samsung] cache firmware information
    cacheFirmware();
    debug.alert("TIZEN device.prototype.initialize _firmware: " + _firmware);
    cacheDUID();
    debug.alert("TIZEN device.prototype.initialize _devUID: " + _devUID);
    cacheisUHD();
    debug.alert("TIZEN device.prototype.initialize _isUHD: " + _isUHD);
    cacheModelName();
    debug.alert("TIZEN device.prototype.initialize _modelname: " + _modelname);
    _prodtype = productinfo.getSmartTVServerType();
    debug.alert("TIZEN device.prototype.initialize _prodtype: " + _prodtype);

    try {
      var isHdrTv = avinfo.isHdrTvSupport();
      console.log("TIZEN device.prototype.initialize isHdrTvSupport = ", isHdrTv);
    } catch (error) {
      console.log("TIZEN device.prototype.initialize isHdrTvSupport error code = ", error.code);
    }

    if (_firmware == null || _firmware.length == 0) _devtype = 0;
    else _devtype = 1;

    var ua = navigator.userAgent;
    debug.alert("device.prototype.initialize ua = " + ua);
    if (ua.search("Tizen 5.5") != -1) _tizen_platform = 2020;
    else if (ua.search("Tizen 5.0") != -1) _tizen_platform = 2019;
    else if (ua.search("Tizen 4.0") != -1) _tizen_platform = 2018;
    else if (ua.search("Tizen 3.0") != -1) _tizen_platform = 2017;
    else if (ua.search("Tizen 2.4") != -1) _tizen_platform = 2016;
    else if (ua.search("Tizen 2.3") != -1) _tizen_platform = 2015;
    else _tizen_platform = 2021;

    debug.alert("device.prototype.initialize _tizen_platform = " + _tizen_platform);
  };

  device.prototype.is_native_player_device = function () {
    var is_native = false;
    if (appConfig.PLAYER_TYPE.toLowerCase() == "ss") is_native = true;
    else if (appConfig.PLAYER_TYPE.toLowerCase() == "mdrm") is_native = false;
    else if (appConfig.PLAYER_TYPE.toLowerCase() == "dual")
      is_native = _tizen_platform == 2016 || _tizen_platform == 2017;
    var is_http = window.location.protocol == "http:";
    is_native = is_native || is_http;
    return is_native;
  };

  device.prototype.is_mdrm_player_device = function () {
    var is_mdrm = false;
    if (appConfig.PLAYER_TYPE.toLowerCase() == "ss") is_mdrm = false;
    else if (appConfig.PLAYER_TYPE.toLowerCase() == "mdrm") is_mdrm = true;
    else if (appConfig.PLAYER_TYPE.toLowerCase() == "dual")
      is_mdrm = _tizen_platform != 2016 && _tizen_platform != 2017;
    var is_https = window.location.protocol == "https:";
    is_mdrm = is_mdrm && is_https;
    return is_mdrm;
  };

  device.prototype.getDevVersion = function () {
    return productinfo.getVersion() || productinfo.getModelCode();
  };

  device.prototype.get_so = function () {
    var str = navigator.userAgent;
    var i1 = str.indexOf("Tizen");
    var i2 = str.indexOf(")");
    var res = str.substring(i1, i2);
    res = res.replace(" ", "_");
    return res;
  };

  function cacheFirmware() {
    var firmware = localStorage.getItem("firmware");
    if (firmware) {
      _firmware = firmware;
    } else {
      _firmware = productinfo.getFirmware();
      localStorage.setItem("firmware", _firmware);
    }
  }

  function cacheDUID() {
    var devUID = localStorage.getItem("devUID");
    if (devUID) {
      _devUID = devUID;
    } else {
      _devUID = productinfo.getDuid();
      localStorage.setItem("devUID", _devUID);
    }
  }

  function cacheisUHD() {
    var isUHD = localStorage.getItem("isUHD");
    if (isUHD) {
      _isUHD = isUHD;
    } else {
      _isUHD = false;
      if (productinfo.isUdPanelSupported) _isUHD = productinfo.isUdPanelSupported();
      localStorage.setItem("devUHD", _isUHD);
    }
  }

  function cacheFirmware() {
    var firmware = localStorage.getItem("firmware");
    if (firmware) {
      _firmware = firmware;
    } else {
      _firmware = productinfo.getFirmware();
      localStorage.setItem("firmware", _firmware);
    }
  }

  function cacheModelName() {
    var modelname = localStorage.getItem("modelname");
    if (modelname) {
      _modelname = modelname;
    } else {
      _modelname = productinfo.getModel();
      localStorage.setItem("modelname", _modelname);
    }
  }

  device.prototype.getProdType = function () {
    return _prodtype;
  };

  device.prototype.getDevType = function () {
    return _devtype;
  };

  device.prototype.getDevFirmware = function () {
    return _firmware;
  };

  device.prototype.getDevUID = function () {
    return _devUID;
  };

  device.prototype.isUHD = function () {
    return _isUHD;
  };

  device.prototype.getDevModel = function () {
    return _modelname;
  };

  device.prototype.getTizenPlatform = function () {
    return _tizen_platform;
  };

  device.prototype.supportAccelerator = function () {
    return _supportAccelerator;
  };

  device.prototype.validFirmware = function () {
    return true;
  };

  device.prototype.printDeviceInfo = function () {
    debug.alert("TIZEN device.prototype.printDeviceInfo _firmware: " + _firmware);
    debug.alert("TIZEN device.prototype.printDeviceInfo _devUID: " + _devUID);
    debug.alert("TIZEN device.prototype.printDeviceInfo _isUHD: " + _isUHD);
    debug.alert("TIZEN device.prototype.printDeviceInfo _supportAccelerator: " + _supportAccelerator);
    debug.alert("TIZEN device.prototype.printDeviceInfo _prodtype: " + _prodtype);

    debug.alert("TIZEN device.prototype.printDeviceInfo pluging version: " + productinfo.getVersion());
    debug.alert("TIZEN device.prototype.printDeviceInfo model code: " + productinfo.getModelCode());
    debug.alert("TIZEN device.prototype.printDeviceInfo _prodtype: " + productinfo.getSmartTVServerType());
  };
}
