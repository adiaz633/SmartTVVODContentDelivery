// Main2016
import { appConfig } from "@appConfig";
import { AutoplayMng } from "src/code/managers/autoplay-mng";
import { BackgroundMng } from "src/code/managers/background-mng";
import { KeyMng } from "src/code/managers/key-mng";
import { MagicMng } from "@newPath/managers/magic-mng";
import { PlayMng } from "src/code/managers/play-mng";
import { AppStore, STORES } from "src/code/managers/store/app-store";
import { ViewMng } from "src/code/managers/view-mng";
import { deeplinkmanager } from "@tvlib/deeplinkmanager";
import { device } from "@tvlib/device";
import { mapkeys } from "@tvlib/mapkeys";
import { conviva } from "@unirlib/conviva/conviva";
import { unirlib } from "@unirlib/main/unirlib";
import { ykeys } from "@unirlib/scene/ykeys";
import { debug } from "@unirlib/utils/debug";
import { Utils } from "@unirlib/utils/Utils";
import { network, productinfo } from "tizen-tv-webapis";

export const Main = {};

var _mapkeys;

var _device;
var _show_scene = false;

var _status_initdata;

/* false.- NO Ejecutando handleKeyDown  true.- Ejecutando handleKeyDown*/
var _keyprocess = false;
var _keytransact = false;

var _position_video = 0;

var _bg_date = null;
var _deeplink_mng = null;
var _supportAccelerator = false;

var _conviva;

var _inBackground = false;

Main.onLoad = function () {
  Main.CheckUrlParameters();
  Main.IncludeJavascript();
  /* Deeplink UMD */
  Main.getDeepLinkMng().checkReqDeepLink();
};

Main.CheckUrlParameters = function () {
  var url = window.location.href;
  var has_params = url.indexOf("?") > -1;
  if (has_params) {
    url = url.replace(/&amp;/g, "&");
    var params = url.split("?")[1];
    params = params.split("&");
    var key_values = [];
    for (var i = 0; i < params.length; i++) {
      var k_v = params[i].split("=");
      var param = { key: k_v[0], value: k_v[1] };
      key_values.push(param);
    }
    for (var i = 0; i < key_values.length; i++) Main.CheckAndSetParameter(key_values[i]);
  }
};

Main.CheckAndSetParameter = function (param) {
  var key = param.key.toUpperCase();
  var value = param.value;
  appConfig[key] = value;
};

Main.onUnload = function () {
  debug.alert("Main.onUnload");
  if (AppStore.sceneManager._focusedSceneName.search("Player") != -1) {
    if (!AppStore.yPlayerCommon.isVideoPlaza) {
      AppStore.sceneManager.get(AppStore.sceneManager._focusedSceneName).stopConviva();
    }
    AppStore.yPlayerCommon.stopSession();
  }
  debug.alert("Main.onUnload EXIT DONE!!");
};

Main.keyDown = function (e) {
  // Key handler
  var keyCode = "";
  if (window.event) {
    keyCode = e.keyCode;
  } else if (e.keyCode) {
    keyCode = e.keyCode;
  } else if (e.which) {
    keyCode = e.which;
  }

  if (keyCode == 10182) {
    // Exit key
    debug.alert("Tizen Exit pressed = 10182");
    Main.returnTV();
  } else {
    AppStore.sceneManager.keyDown(keyCode);
  }
};

Main.onClick = function (e) {
  // back
  if (e.pageY < 50) {
    KeyMng.instance.runKeyAction(ykeys.VK_BACK, true);
    return;
  }

  var clickid = e.srcElement.id;
  if (clickid === null || clickid == "") clickid = e.srcElement.parentNode.id;
  if (clickid == null || clickid == "") clickid = e.srcElement.parentNode.parentNode.id;

  if (clickid != null && clickid != "") AppStore.sceneManager.onClick(clickid);
};

Main.onMouseOver = function (e) {
  var clickid = e.srcElement.id;
  if (clickid == null || clickid == "") clickid = e.srcElement.parentNode.id;
  if (clickid == null || clickid == "") clickid = e.srcElement.parentNode.parentNode.id;

  MagicMng.instance.show_magic();

  if (clickid != null && clickid != "" && AppStore.sceneManager != null) AppStore.sceneManager.onMouseOver(clickid);
};

Main.onMouseOut = function (e) {
  var clickid = e.srcElement.id;
  if (clickid == null || clickid == "") clickid = e.srcElement.parentNode.id;
};

Main.onMouseWheel = function (e) {
  if (e.wheelDelta != null && e.wheelDelta != 0) {
    if (AppStore.home.isNewActive()) AppStore.home.mouse_wheel(e.wheelDelta);
    else AppStore.sceneManager.onMouseWheel(e.wheelDelta);
  }
};

Main.IncludeJavascript = function () {
  debug.alert("Main.IncludeJavascript TIZEN");

  Main._keyprocess = false;
  Main._keytransact = false;

  Main._bg_date = null;
  Main._deeplink_mng = null;
  Main._supportAccelerator = false;

  try {
    Main.cachesupportAccelerator();
    debug.alert("Main.IncludeJavascript acceleratorSupport = " + Main._supportAccelerator);
    if (Main._supportAccelerator) {
      debug.alert('Main.IncludeJavascript addEventListener("appcontrol")');
      window.addEventListener("appcontrol", function () {
        Main.handleDeepLinkData();
      });
    }
  } catch (e) {
    debug.alert('Main.IncludeJavascript addEventListener("appcontrol") ERROR');
  }

  try {
    Main.cacheModelTv();
    debug.alert("Main.IncludeJavascript model TV = " + Main._model);
  } catch (e) {
    debug.alert("Main.IncludeJavascript cacheModelTv ERROR");
  }

  debug.alert('Main.IncludeJavascript addEventListener("visibilitychange")');
  document.addEventListener("visibilitychange", Main.handleVisibilityChange);

  network.addNetworkStateChangeListener(function (value) {
    if (value == network.NetworkState.GATEWAY_DISCONNECTED) {
      debug.alert('addNetworkStateChangeListener GATEWAY_DISCONNECTED")');
    } else if (value == network.NetworkState.GATEWAY_CONNECTED) {
      debug.alert('addNetworkStateChangeListener GATEWAY_CONNECTED")');
    }
  });

  try {
    this.callback_loadScenes();
    Main._mapkeys = new mapkeys();
    unirlib.setMapKeys(Main._mapkeys);
    Main._mapkeys.registerKeys();
    Main._conviva = new conviva();
  } catch (e) {
    debug.alert("Main.IncludeJavascript ERROR GENERANDO VARIABLES DE DISPOSITIVO Y ENTORNO" + e.toString());
  }
};

Main.callback_loadScenes = function () {
  try {
    debug.alert("Main.callback_loadScenes mapkeys");
    Main._mapkeys = new mapkeys();
    unirlib.setMapKeys(Main._mapkeys);
    Main._mapkeys.registerKeys();
    debug.alert("Main.callback_loadScenes conviva");
    Main._conviva = new conviva();
  } catch (e) {
    debug.alert("Main.callback_loadScenes error " + e.toString());
  }

  AppStore.sceneManager.show("SplashScene");
  AppStore.sceneManager.focus("SplashScene");
};

Main.restart = function () {
  debug.alert("Main.instant_on_restart instant_on_restart!!");
  /*
   * Regeneramos los manejadores, pero no se vuelven a declarar los eventos.
   * Se reinicia el sistema (las variables de unirlib han de ser reseteadas previamente)
   * Se genera de nuevo el Splash para señalar el reinicio
   */

  AppStore.sceneManager.loadScenes();
};

Main.initSystem = function () {
  debug.alert("Main.initSystem TIZEN 2016");
  Main._device = new device();
  Main._device.initialize();
  AppStore.Set(STORES.device, _device);
  Main.select_player_version();
};

Main.select_player_version = function () {
  var tizen_plat = Main._device.getTizenPlatform();
  debug.alert("Main.select_player_version tizen_platform: (TIZEN " + tizen_plat + ")");
  if (Main._device.is_native_player_device()) Main.load_native_version();
  else Main.load_mdrm_version();
};

Main.load_native_version = function () {
  debug.alert("Main.load_native_version...");
  var $player = $(
    "<object id = 'av-player' type = 'application/AVPlayer' style='position:absolute;top:0px;left:0px;width:2015px;height:1135px;z-index:-99'></object>"
  );
  $player.appendTo($(document.body));
  unirlib.initSystem(
    7,
    Main.isBluRay(),
    Main.isEmulator(),
    Main.getDevUID(),
    Main.getDevType(),
    AppStore.device.validFirmware()
  );
};

Main.load_mdrm_version = function () {
  debug.alert("Main.load_mdrm_version...");
  var $player = $(
    '<div style="width:1920;height:1080;position:absolute;left:0px;top:0px;padding:0px;margin:0px;z-index:-99;"><video id="video" width="1920" height="1080" autoplay></video></div>'
  );
  $player.appendTo($(document.body));
  unirlib.initSystem(
    7,
    Main.isBluRay(),
    Main.isEmulator(),
    Main.getDevUID(),
    Main.getDevType(),
    AppStore.device.validFirmware()
  );
};

Main.isKeyProcess = function () {
  return Main._keyprocess || Main._keytransact;
};

Main.isKeyProcess = function (keyCode) {
  return Main._keyprocess || Main._keytransact;
};

Main.endKeyProcess = function () {
  Main._keyprocess = false;
};

Main.startKeyProcess = function () {
  Main._keyprocess = true;
};

Main.endKeyTransact = function () {
  Main._keytransact = false;
  Main._keyprocess = false;
};

Main.startKeyTransact = function () {
  Main._keytransact = true;
};

Main.isEmulator = function () {
  var devType = Main._device.getDevType();
  var emu = Main._device.is_native_player_device() ? devType == 0 : false;
  debug.alert("Main.isEmulator : " + emu);
  return emu;
};

Main.isBluRay = function () {
  var prodType = Main._device.getProdType();
  return false;
};

Main.getDevice = function () {
  return Main._device;
};

Main.getConviva = function () {
  return Main._conviva;
};

Main.getDevFirmware = function () {
  return Main._device.getDevFirmware();
};

Main.getDevModel = function () {
  return Main._device.getDevModel();
};

Main.getDevType = function () {
  return Main._device.getDevType();
};

Main.getDevUID = function () {
  return Main._device.getDevUID();
};

Main.isUHD = function () {
  return Main._device.isUHD();
};

Main.returnTV = function () {
  debug.alert("Main.returnTV");
  window.tizen.application.getCurrentApplication().exit();
};

Main.putInnerHTML = function (object, text) {
  if (object) object.innerHTML = text;
};

Main.loadBackground = function (scene) {
  var imgUrl = AppStore.wsData.getBackgroundURL();
  var sc_html = document.getElementById(scene);
  if (sc_html != null && sc_html != undefined) sc_html.style.backgroundImage = "url(" + imgUrl + ")";
};

Main.unloadBackground = function (scene) {
  var sc_html = document.getElementById(scene);
  if (sc_html != null && sc_html != undefined) sc_html.style.backgroundImage = "";
};

Main.handleVisibilityChange = function () {
  debug.alert("Main.handleVisibilityChange document.hidden = " + document.hidden);
  if (document.hidden) {
    debug.alert("Main.handleVisibilityChange HIDDEN");
    document.body.style.display = "none";
    Main.manageHideApp();
  } else {
    // Timeout 2s para inicialización tizen
    window.setTimeout(function () {
      debug.alert("Main.handleVisibilityChange SHOW");
      document.body.style.display = "block";
      try {
        if (AppStore.network.checkMultitaskingNetworkConnection()) {
          Main.manageShowApp();
        } else {
          Main.startCheckNetwork2Restore();
        }
      } catch (e) {
        debug.alert("Main.handleVisibilityChange SHOW ERROR = " + e.toString());
        Main.startCheckNetwork2Restore();
      }
    }, 2000);
  }
};

var _intentos;
var _checkInterval = null;
Main.startCheckNetwork2Restore = function () {
  debug.alert("Main.startCheckNetwork2Restores...");
  Main._intentos = 0;
  var bg_timeout =
    AppStore.wsData && AppStore.wsData.getContext().bg_timeout ? AppStore.wsData.getContext().bg_timeout : 1000;
  if (!Main._checkInterval)
    Main._checkInterval = window.setInterval(function () {
      Main.checkNetwork2Restore();
    }, bg_timeout);
};

Main.checkNetwork2Restore = function () {
  Main._intentos++;
  debug.alert("Main.checkNetwork2Restore INTENTO = " + Main._intentos);
  var hayConexion = AppStore.network.checkMultitaskingNetworkConnection();
  if (hayConexion) {
    window.clearInterval(Main._checkInterval);
    Main._checkInterval = null;
    debug.alert("Main.checkNetwork2Restore SE RECUPERA LA CONEXION DESPUES DE " + Main._intentos + " INTENTOS");
    Main._intentos = 0;
    Main.manageShowApp();
  } else {
    var bg_reintentos =
      AppStore.wsData && AppStore.wsData.getContext().bg_reintentos ? AppStore.wsData.getContext().bg_reintentos : 30;
    if (Main._intentos == bg_reintentos) {
      window.clearInterval(Main._checkInterval);
      Main._checkInterval = null;
      Main._intentos = 0;
      AppStore.errors.showErrorNetwork();
      debug.alert("Main.checkNetwork2Restore NO SE RECUPERA LA CONEXION");
    }
  }
};

Main.isInBackground = function () {
  return Main._inBackground;
};

Main.manageHideApp = function () {
  Main._inBackground = true;
  if (unirlib.is_incidence_mode_on()) {
    AppStore.yPlayerCommon.stop(true);
    return;
  }
  AppStore.appStaticInfo.stop_set_apptime_interval();
  Main._bg_date = new Date().getTime();
  Main.handleHide();
};

Main.handleHide = function () {
  debug.alert("Main.handleHide");
  if (!ViewMng.instance.isPlayerActive()) {
    PlayMng.instance.playerView.stop();
  } else {
    debug.alert("Main.manageHideApp NOT PLAYING");
    AutoplayMng.instance.autoplay_stop(true);
    // Stop promos animation
    if (
      ViewMng.instance.hasViews() &&
      ViewMng.instance.length > 0 &&
      ViewMng.instance.getView(0).opts.slidersData[ViewMng.instance.getView(0).opts.activeSlider].type === "menu"
    ) {
      ViewMng.instance.getView(0).opts.sliders[0].animate_stop();
    }
    // Clean key stack
    KeyMng.instance.kdEndAnimation();
    KeyMng.instance.cleanKeysStack(null);
  }
};

Main.manageShowApp = function () {
  Main._inBackground = false;
  debug.alert("Main.manageShowApp ->> SHOWN");
  if (unirlib.is_incidence_mode_on()) {
    unirlib.restartApp();
  } else {
    try {
      var ahora = new Date();
      var ahora_ms = ahora.getTime();
      var diff_ms = ahora_ms - Main._bg_date;
      var limit_s =
        AppStore.wsData && AppStore.wsData.getContext().instant_on_timeout
          ? parseInt(AppStore.wsData.getContext().instant_on_timeout)
          : 0;
      var limit_ms = limit_s * 1000;
      var fuera_de_limite = diff_ms > limit_ms;
      if (fuera_de_limite || unirlib.is_incidence_mode_on()) {
        debug.alert("Main.manageShowApp -> RESTART APP!!");
        unirlib.restartApp();
      } else {
        Main.handleShow();
      }
    } catch (e) {
      debug.alert("Main.manageShowApp SHOWN error ---> " + e.toString());
      unirlib.restartApp();
    }
  }
};

Main.handleShow = function () {
  debug.alert("Main.handleShow");
  if (Main._bg_date) {
    AppStore.appStaticInfo.start_set_apptime_interval();
    Main._bg_date = null;
    if (Main.getDeepLinkMng().getIsReqDeepLink()) {
      debug.alert("Main.handleShow -> handleDeepLinkData from Background");
      unirlib.gotoHome(true);
      Main.execDLCommand();
    } else {
      if (AppStore.home.isNewActive()) {
        debug.alert("Main.handleShow isNewActive ");
        if (
          ViewMng.instance.hasViews() &&
          ViewMng.instance.length > 0 &&
          ViewMng.instance.getView(0).opts.slidersData[ViewMng.instance.getView(0).opts.activeSlider].type === "menu"
        ) {
          ViewMng.instance.getView(0).active_slider(1);
          ViewMng.instance.getView(0).opts.sliders[0].animate_start();
          // AppStore.home.reload_slider_body_bg_image();
        }
        BackgroundMng.instance.show_full_background();
      } else {
        /*debug.alert("Main.manageShowApp _focusedSceneName ->> " + AppStore.sceneManager._focusedSceneName);
        AppStore.sceneManager.focus(AppStore.sceneManager._focusedSceneName);
        if (AppStore.sceneManager._focusedSceneName == "PlayerScene") {
          debug.alert("Main.manageShowApp CONTINUE LIVE... ");
          var scene = AppStore.yPlayerCommon.getScene().type;
          AppStore.sceneManager.get(scene).showUIDirecto();
          AppStore.yPlayerCommon.setAutoplay(false);
          AppStore.sceneManager.get(scene).loadChannelGrid("callback_load_grid_show");
        } else if (AppStore.sceneManager._focusedSceneName == "PlayerVODScene") {
          debug.alert("Main.manageShowApp CONTINUE VOD 2016... ");
          this.tizen2016Restore();
        } else debug.alert("Main.manageShowApp SHOW DO NOTHING...");*/
      }
    }
  } else {
    debug.alert("Main.handleShow -> RESTART APP, NO VALID DATE AT SHOWN APP!!");
    unirlib.restartApp();
  }
};

var _model = "";
Main.cacheModelTv = function () {
  var modelo = localStorage.getItem("model");
  if (modelo) {
    Main._model = modelo;
  } else {
    try {
      Main._model = productinfo.getModel();
    } catch (e) {
      Main._model = false;
    }
    localStorage.setItem("model", Main._model);
  }
};

Main.cachesupportAccelerator = function () {
  var supportAccelerator = localStorage.getItem("supportAccelerator");
  if (supportAccelerator) {
    Main._supportAccelerator = supportAccelerator;
  } else {
    try {
      Main._supportAccelerator = window.tizen.systeminfo.getCapability("http://tizen.org/custom/accelerator");
    } catch (e) {
      Main._supportAccelerator = false;
    }
    localStorage.setItem("supportAccelerator", Main._supportAccelerator);
  }
};

Main.get_url_time = function (bgd) {
  var url_time = AppStore.wsData._TIME_HOST;
  url_time = Utils.sanitizeURL(url_time);
  var _bgd = bgd;
  var promise = new Promise(function (resolve, reject) {
    Utils.ajax({
      url: url_time,
      method: "GET",
      retryLimit: 2,
      bgdate: _bgd,
      success(data, status, xhr) {
        var dateStr = xhr.getResponseHeader("date");
        var now_time = new Date(Date.parse(dateStr));
        if (now_time) {
          var dates = { now: now_time, bgdate: this.bgdate };
          resolve(dates);
        } else reject(null);
      },
      error(xhr, textStatus, errorThrown) {
        if (textStatus == "timeout") {
          this.retryLimit--;
          if (this.retryLimit >= 0) {
            Utils.ajax(this);
          } else {
            reject(null);
          }
        } else {
          reject(null);
        }
      },
      timeout: 1000,
    });
  });

  return promise;
};

/*******************************
 *    DEEPLINK MANAGEMENT
 *******************************/

Main.getDeepLinkMng = function () {
  if (!Main._deeplink_mng) Main._deeplink_mng = new deeplinkmanager();
  return Main._deeplink_mng;
};

Main.handleDeepLinkData = function () {
  debug.alert("Main.handleDeepLinkData!! THERE IS A DEEPLIK INVOCATION!! ");
  Main.enable_deeplink();
  const dlmng = Main.getDeepLinkMng();
  dlmng.checkReqDeepLink();
  if (dlmng.getIsReqDeepLink()) dlmng.setReqDeepLinkData();
  if (!Main.isInBackground()) {
    debug.alert("Main.handleDeepLinkData FROM RUNNING APP FOREGROUND!! ");
    unirlib.gotoHome(true);
    Main.execDLCommand();
  }
};

Main.execDLCommand = function () {
  const dlmng = Main.getDeepLinkMng();
  if (dlmng && dlmng.getIsReqDeepLinkOK() && !Main.is_deeplink_disabled()) {
    Main.disable_deeplink();
    dlmng.execDLCommand();
  }
};

/*
 * Este chequeo se genera para asegurar el funcionamiento de la api network y de la existencia de conexion
 * antes de generar el flujo de carga de la home + resolucion de deeplink
 */

Main.check_gotoHome_and_executeDL = function () {
  debug.alert("Main.check_gotoHome_and_executeDL...");
  if (AppStore.network.checkMultitaskingNetworkConnection()) {
    AppStore.home.setItMustKeepFocus(false);
    unirlib.gotoHome(true);
    Main.execDLCommand();
  } else Main.startCheckNetwork2Gotohome();
};

var _intentos_gotohome;
var _checkInterval_gotohome = null;
Main.startCheckNetwork2Gotohome = function () {
  debug.alert("Main.startCheckNetwork2Gotohome...");
  _intentos_gotohome = 0;
  var bg_timeout =
    AppStore.wsData && AppStore.wsData.getContext().bg_timeout ? AppStore.wsData.getContext().bg_timeout : 1000;
  if (!_checkInterval_gotohome)
    _checkInterval_gotohome = window.setInterval(function () {
      Main.checkNetwork2Gotohome();
    }, bg_timeout);
};

Main.checkNetwork2Gotohome = function () {
  _intentos_gotohome++;
  debug.alert("deeplinkmanager.checkNetwork2Gotohome REINTENTO = " + _intentos_gotohome);
  var hayConexion = AppStore.network.checkMultitaskingNetworkConnection();
  if (hayConexion) {
    window.clearInterval(_checkInterval_gotohome);
    _checkInterval_gotohome = null;
    debug.alert(
      "deeplinkmanager.checkNetwork2Gotohome SE RECUPERA LA CONEXION DESPUES DE " + _intentos_gotohome + " REINTENTOS"
    );
    _intentos_gotohome = 0;
    AppStore.home.setItMustKeepFocus(false);
    unirlib.gotoHome(true);
    Main.execDLCommand();
  } else {
    var bg_reintentos =
      AppStore.wsData && AppStore.wsData.getContext().bg_reintentos ? AppStore.wsData.getContext().bg_reintentos : 30;
    if (_intentos_gotohome == bg_reintentos) {
      window.clearInterval(_checkInterval_gotohome);
      _checkInterval_gotohome = null;
      _intentos_gotohome = 0;
      AppStore.errors.showErrorServices();
      debug.alert("deeplinkmanager.checkNetwork2Gotohome NO SE RECUPERA LA CONEXION");
    }
  }
};

var _disabled_deeplink = false;
Main.enable_deeplink = function () {
  debug.alert("Main.enable_deeplink");
  _disabled_deeplink = false;
};

Main.disable_deeplink = function () {
  debug.alert("Main.disable_deeplink");
  _disabled_deeplink = true;
};

Main.is_deeplink_disabled = function () {
  debug.alert("Main.is_deeplink_disabled is_disabled = " + _disabled_deeplink);
  return _disabled_deeplink;
};

Main.getValue = async function (scope, id) {
  // scopes: middleware, backend
  switch (scope) {
    case "backend":
      break;
  }
};

Main.setValue = async function (scope, id, json) {
  switch (scope) {
    case "backend":
      break;
  }
};
