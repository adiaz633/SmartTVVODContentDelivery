export function deviceExo() {
  var _firmware = 0;
  var _devtype = 1;
  var _devUID = 0;
  var _prodtype = 0;

  var _version = "";
  var _isUHD = false;

  deviceExo.prototype.initialize = function () {
    /*debug.alert('initialize device ' + device.model);
		debug.alert('device.uuid ' + device.uuid);
		debug.alert('device.model ' + device.model);
		debug.alert('device.serial ' + device.serial);
		debug.alert('device.version ' + device.version);
		debug.alert('device.manufacturer ' + device.manufacturer);
		debug.alert('device.platform ' + device.platform);	*/

    this.cacheIsUHD();
  };

  deviceExo.prototype.is_native_player_device = function () {
    return true;
  };

  deviceExo.prototype.is_mdrm_player_device = function () {
    return true;
  };

  deviceExo.prototype.get_so = function () {
    var sistema = window.device.platform + "_" + window.device.version;
    return sistema;
  };

  deviceExo.prototype.getDevVersion = function () {
    return this.getDevFirmware() || this.getDevType();
  };

  deviceExo.prototype.getProdType = function () {
    return _prodtype;
  };

  deviceExo.prototype.getDevType = function () {
    const plat = typeof device === "undefined" ? 0 : window.device.platform;
    return plat;
  };

  deviceExo.prototype.getDevFirmware = function () {
    const version = typeof device === "undefined" ? "" : window.device.version;
    return version;
  };

  deviceExo.prototype.getManufacturer = function () {
    const manufacturer = typeof device === "undefined" ? "" : window.device.manufacturer;
    return manufacturer;
  };

  deviceExo.prototype.getDevModel = function () {
    const model = typeof device === "undefined" ? "" : window.device.model;
    return model;
  };

  deviceExo.prototype.getDevUID = function () {
    const uuid = typeof device === "undefined" ? "" : window.device.uuid;
    return uuid;
  };

  deviceExo.prototype.validFirmware = function () {
    var result = true;
    return result;
  };

  deviceExo.prototype.createObject = function () {};

  deviceExo.prototype.isUHD = function () {
    return _isUHD;
  };

  deviceExo.prototype.cacheIsUHD = function () {
    console.log("cacheIsUHD");
    window.isUHDDevice(function (is) {
      console.log("cacheIsUHD is " + is);
      _isUHD = is === "true" || is === true;
    });
  };
}
