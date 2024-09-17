import { appConfig } from "@appConfig";
import { AppStore } from "src/code/managers/store/app-store";
import { Utils } from "@unirlib/utils/Utils";

export const debug = {};

var _tracesObj = null;
var _traces_count = 0;

debug.mostrarHTML = function (id) {
  if (appConfig.DEBUG_LOG > 1) {
    console.log("Debug: Elemento con id: " + id);
    console.log($("#" + id).html());
  }
};

debug.alert = function (mensaje, mensaje2 = null) {
  if (appConfig.DEBUG_LOG > 0 && appConfig.DEBUG_LOG < 4) {
    if (mensaje2) console.log(mensaje, mensaje2);
    else console.log(mensaje);
  } else if (appConfig.DEBUG_LOG == 4) {
    if (_tracesObj == null) {
      _tracesObj = document.getElementById("logger");
    }

    if (_traces_count == 500) {
      _tracesObj.innerHTML = "CLEAR LOG</br>" + mensaje;
      _traces_count = 0;
    } else {
      _tracesObj.innerHTML = mensaje + "</br>" + _tracesObj.innerHTML;
      _traces_count++;
    }
  } else if (appConfig.DEBUG_LOG == 5) {
    //console.log(mensaje);
    //mensaje += 'Console -> ' + mensaje;
    var url_log = appConfig.DEBUG_URL + "?texto=" + encodeURIComponent(mensaje);
    Utils.ajax({ url: url_log, method: "GET" });
  } else if (appConfig.DEBUG_LOG == 6) {
    debug.startPrintingLogDemon();
    debug.printLn(mensaje);
  }
};

var _logTxt = null;
var _sendInterval = null;
debug.printLn = function (mnsj) {
  console.log(mnsj);
  if (!_logTxt) _logTxt = new Array();
  _logTxt.push(mnsj);
};

debug.startPrintingLogDemon = function () {
  if (!debug._sendInterval) debug._sendInterval = window.setInterval(debug.sendLog, 10000);
};

debug.stopPrintingLogDemon = function () {
  if (debug._sendInterval) {
    window.clearInterval(debug._sendInterval);
    debug._sendInterval = null;
  }
};

debug.sendLog = function () {
  if (AppStore.appStaticInfo.checkNetworkConnection()) {
    if (_logTxt == null) return;

    for (let i = 0; i < _logTxt.length; i++) {
      var url_log = appConfig.DEBUG_URL + "?texto=" + encodeURIComponent(_logTxt[i]);
      Utils.ajax({ url: url_log, method: "GET" });
    }
    _logTxt = null;
  }
};

let prevTime = 0;
debug.logTime = function (message) {
  const time = new Date().getTime();
  const dif = time - prevTime;
  // console.warn(`-> TIME DIFFERENCE ${message}: ${dif}`);
  prevTime = time;
};
