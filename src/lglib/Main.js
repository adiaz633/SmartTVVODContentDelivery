import { appConfig } from "@appConfig";
import { AutoplayMng } from "src/code/managers/autoplay-mng";
import { KeyMng } from "src/code/managers/key-mng";
import { MagicMng } from "@newPath/managers/magic-mng";
import { PlayMng } from "src/code/managers/play-mng";
import { AppStore, STORES } from "src/code/managers/store/app-store";
import { ViewMng } from "src/code/managers/view-mng";
import { device } from "@tvlib/device";
import { mapkeys } from "@tvlib/mapkeys";
import { conviva } from "@unirlib/conviva/conviva";
import { unirlib } from "@unirlib/main/unirlib";
import { ykeys } from "@unirlib/scene/ykeys";
import { debug } from "@unirlib/utils/debug";

export const Main = {};

var _mapkeys;
var _device;
var _show_scene = false;
var _status_initdata;
/* false.- NO Ejecutando handleKeyDown  true.- Ejecutando handleKeyDown*/
var _keyprocess = false;
var _keytransact = false;
var _bg_date = null;
var _lastclick = null;
var _conviva;
var _inBackground = false;

Main.onLoad = function () {
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

Main.onUnload = function () {
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
    //    	debug.alert('window.event');
  } else if (e.keyCode) {
    keyCode = e.keyCode;
  } else if (e.which) {
    keyCode = e.which;
  }

  //var sceneStr = AppStore.sceneManager._focusedScene.constructor.toString();

  AppStore.sceneManager.keyDown(keyCode);

  //TO DO _cmd.keyDown(keyCode);
};

Main.onClick = function (e) {
  // back
  if (e.pageY < 50) {
    KeyMng.instance.runKeyAction(ykeys.VK_BACK, true);
    return;
  }

  var clickid = e.srcElement.id;
  if (clickid == null || clickid == "") clickid = e.srcElement.parentNode.id;
  if (clickid == null || clickid == "") clickid = e.srcElement.parentNode.parentNode.id;

  //debug.alert('srcElement id ' + e.srcElement.id);
  //debug.alert('srcElement parent id ' + e.srcElement.parentNode.id);
  //debug.alert('srcElement parent id ' + e.srcElement.parentNode.parentNode.id);

  if (clickid != null && clickid != "") {
    _lastclick = clickid;
    AppStore.sceneManager.onClick(clickid);
  }
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

  //debug.alert('srcElement id ' + e.srcElement.id);
  //debug.alert('srcElement parent id ' + e.srcElement.parentNode.id);

  //if (clickid!=null && clickid != '')
  //	AppStore.sceneManager.onMouseOut(clickid);
};

Main.onMouseWheel = function (e) {
  if (e.wheelDelta != null && e.wheelDelta != 0) {
    if (AppStore.home.isNewActive()) AppStore.home.mouse_wheel(e.wheelDelta);
    else AppStore.sceneManager.onMouseWheel(e.wheelDelta);
  }
};

Main.IncludeJavascript = function () {
  debug.alert("Main.IncludeJavascript NETCAST");
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

  document.addEventListener(
    "cursorStateChange",
    function (event) {
      var visibility = event.detail.visibility;
      if (visibility) {
        debug.alert("Cursor appeared");
        AppStore.sceneManager.showArrows();
      } else {
        debug.alert("Cursor disappeared");
        AppStore.sceneManager.hideArrows();
      }
    },
    false
  );

  AppStore.sceneManager.show("SplashScene");
  AppStore.sceneManager.focus("SplashScene");
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
  debug.alert("Main.manageHideApp visibilitychange ->> HIDDEN");
  Main._bg_date = new Date().getTime();
  var scene_name = AppStore.yPlayerCommon.getScene().type;
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
  if (!AppStore.wsData) {
    return;
  }
};

Main.restart = function () {
  debug.alert("Main.restart restart!!");

  /*
   * Regeneramos los manejadores, pero no se vuelven a declarar los eventos.
   * Se reinicia el sistema (las variables de unirlib han de ser reseteadas previamente)
   * Se genera de nuevo el Splash para señalar el reinicio
   */

  AppStore.sceneManager.loadScenes();
};

Main.initSystem = function () {
  _device = new device();
  _device.initialize();
  AppStore.Set(STORES.device, _device);
  Main.select_player_version();
};

Main.select_player_version = function () {
  var native = _device.is_native_player_device();
  if (native) Main.load_native_version();
  else Main.load_mdrm_version();
};

Main.load_native_version = function () {
  debug.alert("Main.load_native_version...");
  var $player = $(
    '<div style="width:1920;height:1080;position:absolute;left:0px;top:0px;padding:0px;margin:0px;z-index:-99;"><object data="" type="application/vnd.ms-sstr+xml" id="media" width="1920" height="1080"	position="absolute" left="0px" top="0px" padding="0px" margin="0px" drm_type="wm-drm" autostart="false" downloadable="false" style="height: 1080px; width: 1920px;"></object></div>'
  );
  $player.appendTo($(document.body));
  var $drmobject = $('<object type="application/oipfDrmAgent" id="oipfDrm" width="0" height="0"></object>');
  $drmobject.appendTo($(document.body));
  Main.exec_initSystem();
};

Main.load_mdrm_version = function () {
  debug.alert("Main.load_mdrm_version...");
  Main._init_sem = 0;
  var $player = $(
    '<div style="width:1920;height:1080;position:absolute;left:0px;top:0px;padding:0px;margin:0px;z-index:-99;"><video id="video" width="1920" height="1080" autoplay></video></div>'
  );
  $player.appendTo($(document.body));
  Main.exec_initSystem();
};

Main.exec_initSystem = function () {
  unirlib.initSystem(
    1,
    Main.isBluRay(),
    Main.isEmulator(),
    Main.getDevUID(),
    Main.getDevType(),
    AppStore.device.validFirmware()
  );
};

Main.isKeyProcess = function () {
  //	if (keyCode==ykeys.VK_BACK)
  //	_widgetAPI.blockNavigation(event);

  return _keyprocess || _keytransact;
};

Main.isKeyProcess = function (keyCode) {
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
  var emu = _device.is_native_player_device() ? devType == 0 : false;
  debug.alert("isEmulator : " + emu);
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

Main.isUHD = function () {
  return _device.isUHD();
};

Main.returnTV = function () {
  debug.alert("Main.returnTV");
  try {
    if (!_device.isWebos() || _device.isWebos3()) {
      if (AppStore.sceneManager._focusedSceneName.search("Player") != -1) {
        AppStore.yPlayerCommon.stopSession();
      }
    }
    window.NetCastBack();
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

window.addEventListener("popstate", function (event) {
  AppStore.sceneManager.keyDown(461);
});

Main.sendDRM = function (msgType, xmlLicenseAcquisition, DRMSysID, onSuccess, onFailure) {
  var oipfDrm = document.getElementById("oipfDrm");
  if (onSuccess != null) oipfDrm.onDRMMessageResult = onSuccess;
  if (onFailure != null) oipfDrm.onDRMRightsError = onFailure;

  oipfDrm.sendDRMMessage(msgType, xmlLicenseAcquisition, DRMSysID);
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
