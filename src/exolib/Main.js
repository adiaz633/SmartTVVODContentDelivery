import { appConfig } from "@appConfig";
import { AutoplayMng } from "src/code/managers/autoplay-mng";
import { BackgroundMng } from "src/code/managers/background-mng";
import { KeyMng } from "src/code/managers/key-mng";
import { PlayMng } from "src/code/managers/play-mng";
import { AppStore, STORES } from "src/code/managers/store/app-store";
import { ViewMng } from "src/code/managers/view-mng";
import { deeplinkmanager } from "@tvlib/deeplinkmanager";
import { deviceExo } from "@tvlib/deviceExo";
import { mapkeys } from "@tvlib/mapkeys";
import { conviva } from "@unirlib/conviva/conviva";
import { unirlib } from "@unirlib/main/unirlib";
import { ykeys } from "@unirlib/scene/ykeys";
import { debug } from "@unirlib/utils/debug";

export const Main = {};

var _fileutils;
var _mapkeys;

var _device;
var _show_scene = false;
var _status_initdata;

/* false.- NO Ejecutando handleKeyDown  true.- Ejecutando handleKeyDown*/
var _keyprocess = false;
var _keytransact = false;
var _deeplinkProcessed = false;
var _bg_date = null;
var _lastclick = null;
var _conviva;
var _inBackground = false;

var _screen_list = []; // Lista de pantallas
var _isUHDAvailable = false;

Main.onLoad = function () {
  debug.alert("Main.onLoad");

  document.addEventListener("backbutton", Main.onBackNull, false);
  document.addEventListener("nativebutton", Main.onNativeButton, false);
  document.addEventListener("evt_background", Main.manageHideApp, false);
  document.addEventListener("evt_foreground", Main.manageShowApp, false);
  document.addEventListener("hdmiAdded", Main.hdmiAdded, false);
  document.addEventListener("hdmiRemoved", Main.hdmiRemoved, false);
  document.addEventListener("displayAdded", Main.onDisplayAdded, false);
  document.addEventListener("displayRemoved", Main.onDisplayRemoved, false);
  document.addEventListener("displayChanged", Main.onDisplayChanged, false);

  var hidden = "hidden";
  var visibilityChange = "visibilitychange";
  if (typeof document.webkitHidden !== "undefined") {
    // To support the webkit engine
    hidden = "webkitHidden";
    visibilityChange = "webkitvisibilitychange";
  }

  document.addEventListener(
    visibilityChange,
    function () {
      if (document[hidden]) {
        Main.manageHideApp();
      } else {
        Main.manageShowApp();
      }
    },
    true
  );

  Main.CheckUrlParameters();
  Main.IncludeJavascript();
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

Main.hdmiAdded = function () {
  console.log("hdmiAdded");
};

Main.hdmiRemoved = function () {
  if (ViewMng.instance.isPlayerActive()) {
    if (AppStore.yPlayerCommon.isPlaying()) {
      debug.alert("hdmiRemoved and isPlaying");
      Main.manageHideApp();
    }
  }
};

Main.onDisplayAdded = function () {
  console.log("onDisplayAdded");
  Main.getDisplays();
};

Main.onDisplayRemoved = function () {
  console.log("onDisplayRemoved");
  Main.getDisplays();
};

Main.onDisplayChanged = function () {
  console.log("onDisplayChanged");
  Main.getDisplays();
};

Main.getDisplays = function () {
  _screen_list = [];
  window.getDisplays(function (displays) {
    console.log("getDisplays displays typeof", typeof displays);
    if (typeof displays === "string") displays = JSON.parse(displays);
    _screen_list = displays;
    Main.cacheIsUHDAvailable();
  });
};

Main.cacheIsUHDAvailable = function () {
  const deviceUHD = AppStore.device.isUHD();
  const UHDScreen = deviceUHD ? Main.getUHDScreen() : deviceUHD;
  const manufacturer = AppStore.device.getManufacturer();
  const isManufacturerAllowed =
    !manufacturer.toLowerCase().includes("nvidia") || appConfig.UHD_MODE.toLowerCase() == "4k"; // Se fuerza a 4k si tenemos el UHD_MODE 4k activo en queryParams
  Main._isUHDAvailable = deviceUHD && UHDScreen && isManufacturerAllowed;
};

Main.isUHD = function () {
  console.log("isUHD " + Main._isUHDAvailable);
  return Main._isUHDAvailable;
};

Main.getUHDScreen = function () {
  const uhdScreens = _screen_list.filter((screen) => screen.width >= 3840);
  return uhdScreens[0] ? true : false;
};

Main.onBackNull = function () {};

Main.onBackKeyDown = function () {
  debug.alert("Main.onBackKeyDown");
  var newActive = AppStore.home.isNewActive();
  debug.alert("Main.onBackKeyDown :" + newActive);
  if (newActive) {
    var e = jQuery.Event("keydown");
    e.keyCode = ykeys.VK_BACK; // #back key code
    $(document.body).trigger(e);
  } else AppStore.sceneManager.keyDown(ykeys.VK_BACK);
};

Main.onNativeButton = function (evt) {
  if (evt.data == "185") AppStore.home.makeDocumentKeyEvent(ykeys.VK_YELLOW);
  else if (evt.data == "186") AppStore.home.makeDocumentKeyEvent(ykeys.VK_BLUE);
  else if (evt.data == "183") AppStore.home.makeDocumentKeyEvent(ykeys.VK_RED);
  else if (evt.data == "184") AppStore.home.makeDocumentKeyEvent(ykeys.VK_GREEN);
  else if (evt.data == "166") AppStore.home.makeDocumentKeyEvent(ykeys.VK_CH_UP);
  else if (evt.data == "167") AppStore.home.makeDocumentKeyEvent(ykeys.VK_CH_DOWN);
  else if (evt.data == "126") AppStore.home.makeDocumentKeyEvent(ykeys.VK_PLAY);
  else if (evt.data == "127") AppStore.home.makeDocumentKeyEvent(ykeys.VK_PAUSE);
  else if (evt.data == "85") AppStore.home.makeDocumentKeyEvent(ykeys.VK_PLAYPAUSE);
  else if (evt.data == "89") AppStore.home.makeDocumentKeyEvent(ykeys.VK_REWIND);
  else if (evt.data == "90") AppStore.home.makeDocumentKeyEvent(ykeys.VK_FAST_FORWARD);
  else if (evt.data == "86") AppStore.home.makeDocumentKeyEvent(ykeys.VK_STOP);
  else if (evt.data == "100") Main.returnTV();
  else if (evt.data == "99") AppStore.home.makeDocumentKeyEvent(ykeys.VK_RED);
  else if (evt.data == "4") Main.onBackKeyDown();
  // GAMEPAD
  else if (evt.data == "96") AppStore.home.makeDocumentKeyEvent(ykeys.VK_ENTER);
  else if (evt.data == "97") AppStore.home.makeDocumentKeyEvent(ykeys.VK_BACK);
  else if (evt.data == "102") AppStore.home.makeDocumentKeyEvent(ykeys.VK_REWIND);
  else if (evt.data == "103") AppStore.home.makeDocumentKeyEvent(ykeys.VK_FAST_FORWARD);
  else if (evt.data == "108") AppStore.home.makeDocumentKeyEvent(ykeys.VK_PLAYPAUSE);
};

Main.onUnload = function () {
  if (AppStore.sceneManager._focusedSceneName.search("Player") != -1) {
    AppStore.yPlayerCommon.stopSession();
  }
  debug.alert("Main.onUnload EXIT DONE!!");
};

Main.keyDown = function (e) {
  var keyCode = "";
  if (window.event) {
    keyCode = e.keyCode;
  } else if (e.keyCode) {
    keyCode = e.keyCode;
  } else if (e.which) {
    keyCode = e.which;
  }
  AppStore.sceneManager.keyDown(keyCode);
};

Main.onClick = function (e) {
  if (e.pageY < 50) {
    KeyMng.instance.runKeyAction(ykeys.VK_BACK, true);
    return;
  }

  var clickid = e.srcElement.id;
  if (clickid == null || clickid == "") clickid = e.srcElement.parentNode.id;
  if (clickid == null || clickid == "") clickid = e.srcElement.parentNode.parentNode.id;

  if (!AppStore.appStaticInfo.isAndroidTV()) {
    if (clickid != null && clickid != "") {
      _lastclick = clickid;
      AppStore.sceneManager.onClick(clickid);
    }
  }
};

Main.onMouseOver = function (e) {
  var clickid = e.srcElement.id;
  if (clickid == null || clickid == "") clickid = e.srcElement.parentNode.id;
  if (clickid == null || clickid == "") clickid = e.srcElement.parentNode.parentNode.id;

  if (clickid != null && clickid != "" && AppStore.sceneManager != null) AppStore.sceneManager.onMouseOver(clickid);
};

Main.onMouseOut = function (e) {
  var clickid = e.srcElement.id;
  if (clickid == null || clickid == "") clickid = e.srcElement.parentNode.id;
};

Main.onMouseWheel = function (e) {
  if (!AppStore.appStaticInfo.isAndroidTV()) {
    if (e.wheelDelta != null && e.wheelDelta != 0) {
      if (AppStore.home.isNewActive()) AppStore.home.mouse_wheel(e.wheelDelta);
      else AppStore.sceneManager.onMouseWheel(e.wheelDelta);
    }
  }
};

Main.IncludeJavascript = function () {
  debug.alert("Main.IncludeJavascript");
  this.callback_loadScenes();
};

Main.callback_loadScenes = function () {
  try {
    debug.alert("Main.callback_loadScenes");

    _mapkeys = new mapkeys();
    unirlib.setMapKeys(_mapkeys);

    _conviva = new conviva();
  } catch (e) {
    debug.alert("Main.callback_loadScenes error " + e.toString());
  }

  AppStore.sceneManager.show("SplashScene");
  AppStore.sceneManager.focus("SplashScene");
};

Main.restart = function () {
  debug.alert("Main.instant_on_restart instant_on_restart!!");
  AppStore.sceneManager.loadScenes();
};

Main.initSystem = function () {
  _device = new deviceExo();
  _device.initialize();
  AppStore.Set(STORES.device, _device);
  Main.getDisplays();

  return unirlib.initSystem(
    8,
    Main.isBluRay(),
    Main.isEmulator(),
    Main.getDevUID(),
    Main.getDevType(),
    _device.validFirmware()
  );
};

Main.isKeyProcess = function () {
  return _keyprocess || _keytransact;
};

Main.isKeyProcess = function (_keyCode) {
  return _keyprocess || _keytransact;
};

Main.endKeyProcess = function () {
  _keyprocess = false;
};

Main.startKeyProcess = function () {
  _keyprocess = true;
};

Main.endKeyTransact = function () {
  _keytransact = false;
  _keyprocess = false;
};

Main.startKeyTransact = function () {
  _keytransact = true;
};

Main.isEmulator = function () {
  var devType = _device.getDevType();
  var emu = devType == null || devType == 0;
  debug.alert("isEmulator : " + devType);
  return emu;
};

Main.isBluRay = function () {
  return false;
};

Main.getDevice = function () {
  return _device;
};

Main.getConviva = function () {
  return _conviva;
};

Main.getDevFirmware = function () {
  return _device.getDevFirmware();
};

Main.getDevModel = function () {
  return _device.getDevModel();
};

Main.getDevType = function () {
  return _device.getDevType();
};

Main.getDevUID = function () {
  return _device.getDevUID();
};

Main.returnTV = function () {
  debug.alert("Main.returnTV");
  try {
    //navigator.app.exitApp();
    window.systemExit();
  } catch (e) {
    debug.alert("Main.returnTV ERROR -> " + e.toString());
  }
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

window.addEventListener("popstate", function (_event) {
  //debug.alert('event.type '  + event.type);
  //debug.alert('window.location.hash '  + window.location.hash);
  //debug.alert('_lastclick '  + _lastclick);

  if (_lastclick == null) AppStore.sceneManager.keyDown(461);

  _lastclick = null;

  // Back
  //AppStore.sceneManager.keyDown(461);
});

Main.isInBackground = function () {
  return Main._inBackground;
};

Main.manageHideApp = function () {
  Main._inBackground = true;
  Main._deeplinkProcessed = false;
  if (unirlib.is_incidence_mode_on()) {
    AppStore.yPlayerCommon.stop(true);
    return;
  }
  debug.alert("Main.manageHideApp visibilitychange ->> HIDDEN");
  Main._bg_date = new Date().getTime();
  //var scene_name = AppStore.yPlayerCommon.getScene().type;
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
  debug.alert("Main.handleShow manageShowApp ->> SHOWN");
  Main._inBackground = false;
  AppStore.home.checkDeeplink().then(function () {
    const dlmng = Main.getDeepLinkMng();
    if (dlmng._config) {
      dlmng._deeplinkProcessed = false;
      AppStore.home.setItMustKeepFocus(false);
      Main.enable_deeplink();
      unirlib.gotoHome(true);
    } else Main.handleShow();
  });
};

Main.handleShow = function () {
  if (unirlib.is_incidence_mode_on()) {
    unirlib.restartApp();
    return;
  }
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
    debug.alert("Main.manageShowApp SHOW DO NOTHING/NOT PLAYING...");
  }
};

/**** DEEP LINKING ****/

Main.getDeepLinkMng = function () {
  if (!Main._deeplink_mng) Main._deeplink_mng = new deeplinkmanager();
  return Main._deeplink_mng;
};

var _disabled_deeplink = false;
Main.enable_deeplink = function () {
  debug.alert("deeplinkmanager.prototype.enable");
  _disabled_deeplink = false;
};

Main.disable_deeplink = function () {
  debug.alert("deeplinkmanager.prototype.disable");
  _disabled_deeplink = true;
};

Main.is_deeplink_disabled = function () {
  debug.alert("Main.handleVisibilityChange is_deeplink_disabled = " + _disabled_deeplink);
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
