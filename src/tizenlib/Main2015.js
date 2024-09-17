// Main2015
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
import { avplay, network, productinfo } from "tizen-tv-webapis";

export const Main = {};

var _fileutils;
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

var _suspended = false;

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

  Main._position_video = 0;

  Main._bg_date = null;
  Main._deeplink_mng = null;
  Main._supportAccelerator = false;

  Main._suspended = false;

  try {
    Main._mapkeys = new mapkeys();
    unirlib.setMapKeys(Main._mapkeys);
    Main._mapkeys.registerKeys();

    Main._conviva = new conviva();
  } catch (e) {
    debug.alert("Main.IncludeJavascript ERROR GENERANDO VARIABLES DE DISPOSITIVO Y ENTORNO" + e.toString());
  }

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

  network.addNetworkStateChangeListener(function (data) {
    if (data == 4) {
      debug.alert('network.addNetworkStateChangeListener CONNECTED!!!!")');
    } else if (data == 5) {
      debug.alert("network.addNetworkStateChangeListener DISCONNECTED!!!!");
    }
  });

  debug.alert('Main.IncludeJavascript addEventListener("visibilitychange")');
  document.addEventListener("visibilitychange", Main.handleVisibilityChange);

  AppStore.sceneManager.show("SplashScene");
  AppStore.sceneManager.focus("SplashScene");
};

Main.initSystem = function () {
  debug.alert("Main.initSystem TIZEN");
  debug.alert("Main.initSystem unirlib.initSystem ---> samsung (TIZEN 2015), tv_model = 6");

  Main._device = new device();
  Main._device.initialize();
  AppStore.Set(STORES.device, _device);

  return unirlib.initSystem(
    6,
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
  var emu = devType == 0;
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

var _is_hidden = false;
Main.handleVisibilityChange = function () {
  debug.alert("Main.handleVisibilityChange document.hidden = " + document.hidden);
  if (document.hidden) {
    Main._is_hidden = true;
    document.body.style.display = "none";
    Main.manageHideApp();
  } else {
    // Timeout 2s para inicialización tizen
    window.setTimeout(function () {
      Main._is_hidden = false;
      if (AppStore.network.checkMultitaskingNetworkConnection()) Main.manageShowApp();
      else Main.startCheckNetwork2Restore();
      document.body.style.display = "block";
    }, 2000);
  }
};

var _intentos;
var _checkInterval = null;
Main.startCheckNetwork2Restore = function () {
  debug.alert("Main.startCheckNetwork2Restores...");
  Main._intentos = 0;
  if (!Main._checkInterval)
    Main._checkInterval = window.setInterval(function () {
      Main.checkNetwork2Restore();
    }, 1000);
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
    var bg_reintentos = AppStore.wsData.getContext().bg_reintentos ? AppStore.wsData.getContext().bg_reintentos : 30;
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
  debug.alert("Main.manageHideApp visibilitychange ->> HIDDEN");
  debug.alert("Main.manageHideApp visibilitychange from ->> " + AppStore.sceneManager._focusedSceneName);
  debug.alert(
    "Main.manageHideApp visibilitychange timeout instant_on in secs ->> " +
      AppStore.wsData.getContext().instant_on_timeout
  );
  Main._bg_date = new Date().getTime();
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
  debug.alert("Main.manageShowApp visibilitychange ->> SHOWN");
  if (unirlib.is_incidence_mode_on()) {
    unirlib.restartApp();
    return;
  }

  // TODO: Something you want to do when resume.
  try {
    var ahora_ms = new Date().getTime();
    var diff_ms = ahora_ms - Main._bg_date;
    var limit_s = AppStore.wsData.getContext().instant_on_timeout
      ? parseInt(AppStore.wsData.getContext().instant_on_timeout)
      : 0;
    var limit_ms = limit_s * 1000;
    var fuera_de_limite = diff_ms > limit_ms;
  } catch (e) {
    debug.alert("Main.manageShowApp SHOWN error ---> " + e.toString());
  }
  if (fuera_de_limite) {
    debug.alert("Main.manageShowApp -> RESTART APP!!");
    unirlib.restartApp();
  } else if (Main.getDeepLinkMng().getIsReqDeepLink()) {
    debug.alert("Main.manageShowApp -> Se tratara el deeplink a traves del evento handleDeepLinkData");
  } else {
    debug.alert("Main.manageShowApp _focusedSceneName ->> " + AppStore.sceneManager._focusedSceneName);
    if (AppStore.home.isNewActive()) {
      debug.alert("Main.manageShowApp isNewActive ");
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
      /*
      AppStore.sceneManager.focus(AppStore.sceneManager._focusedSceneName);
      if (AppStore.sceneManager._focusedSceneName == "PlayerScene") {
        debug.alert("Main.manageShowApp CONTINUE LIVE... ");
        var scene = AppStore.yPlayerCommon.getScene().type;
        AppStore.sceneManager.get(scene).showUIDirecto();
        AppStore.sceneManager.get(scene).loadChannelGrid("callback_load_grid_show");
      } else if (AppStore.sceneManager._focusedSceneName == "PlayerVODScene") {
        if (!AppStore.yPlayerCommon._CasID || AppStore.yPlayerCommon.isVideoPlaza) {
          debug.alert("Main.manageShowApp CONTINUE VOD 2015 FREECONTENT... ");
          avplay.restore();
        } else {
          debug.alert("Main.manageShowApp CONTINUE VOD 2015 DRMCONTENT... ");
          try {
            //avplay.restore(AppStore.yPlayerCommon._url, _position_video, true);
            debug.alert("Main.manageShowApp restore... ");
            AppStore.yPlayerCommon.setAutoplay(false);
            avplay.restore(AppStore.yPlayerCommon._url, 0, true);
            debug.alert("Main.manageShowApp CONTINUE VOD restore");
            if (AppStore.yPlayerCommon._CasID) {
              var custom = AppStore.yPlayerCommon.getCustomData();
              debug.alert("PlayMng.player.replayTS customdata: " + custom);
              var liserver = Utils.getLicenseServer();
              var drmParam = { LicenseServer: liserver, CustomData: custom };
              avplay.setDrm("PLAYREADY", "SetProperties", JSON.stringify(drmParam));
              debug.alert("Main.manageShowApp CONTINUE VOD 2015... setDrm");
            }

            if (AppStore.yPlayerCommon._formatoVideo && AppStore.yPlayerCommon._formatoVideo == "3D")
              avplay.setStreamingProperty("SET_MODE_3D", "MODE_3D_EFFECT_SIDE_BY_SIDE");
            if (AppStore.yPlayerCommon._formatoVideo && AppStore.yPlayerCommon._formatoVideo == "4K") {
              if (Main.isUHD()) avplay.setStreamingProperty("SET_MODE_4K", "TRUE");
              else PlayMng.player.onError("4K UHD is not supported");
            }

            var listener = {
              onbufferingstart() {
                debug.alert("Buffering start.");
                if (!PlayMng.player._isBuffering) {
                  PlayMng.player._isBuffering = true;
                  PlayMng.player.onBufferingStart();
                }
              },
              onbufferingprogress(percent) {
                debug.alert("Buffering progress data : " + percent);
              },
              onbufferingcomplete() {
                debug.alert("- Player Event Buffering Complete.");
                PlayMng.player._isBufferingEventActive = true;
                if (PlayMng.player._isBuffering) {
                  PlayMng.player._isBuffering = false;
                  PlayMng.player.onBufferingComplete();
                  debug.alert(
                    "- Player Event Buffering Complete. Main._isStartedPlayback = " + Main._isStartedPlayback
                  );
                  if (!Main._isStartedPlayback) {
                    Main._isStartedPlayback = true;
                    Main.restorePlayback();
                  }
                  if (Main._need_audio_restore_check) Main.restoreAudio();
                }
              },
              oncurrentplaytime(currentTime) {
                if (
                  !PlayMng.player._isBufferingComplete &&
                  !PlayMng.player._isBufferingEventActive &&
                  !PlayMng.player._isBuffering
                ) {
                  PlayMng.player._isBufferingComplete = true;
                  PlayMng.player.onBufferingStart();
                  PlayMng.player.onBufferingComplete();
                  if (!Main._isStartedPlayback) {
                    Main._isStartedPlayback = true;
                    Main.restorePlayback();
                  }
                }
                PlayMng.player.onCurrentPlaybackTime(currentTime);
              },
              onevent(eventType, eventData) {
                PlayMng.player.onEvent(eventType, eventData);
              },
              onerror(eventType) {
                PlayMng.player.onError(eventType);
              },
              ondrmevent(drmEvent, drmData) {
                debug.alert("DRM callback: " + drmEvent + ", data: " + drmData);
              },
              onstreamcompleted() {
                PlayMng.player.onRenderingComplete();
              },
            };
            avplay.setListener(listener);
            debug.alert("Main.manageShowApp CONTINUE VOD 2015... setListener");
            avplay.setStreamingProperty("ADAPTIVE_INFO", "|STARTBITRATE=HIGHEST");
            debug.alert("PlayMng.player.playContent avplay.setStreamingProperty ADAPTIVE_INFO STARTBITRATE=HIGHEST");
            avplay.setDisplayRect(0, 0, 1920, 1080);
            debug.alert("Main.manageShowApp CONTINUE VOD 2015... setDisplayRect");
            avplay.setDisplayMethod("PLAYER_DISPLAY_MODE_FULL_SCREEN");
            debug.alert("Main.manageShowApp CONTINUE VOD 2015... setDisplayMethod");
            avplay.setTimeoutForBuffering(4000);
            debug.alert("Main.manageShowApp CONTINUE VOD 2015... setTimeoutForBuffering");
            avplay.prepare();
            debug.alert("Main.manageShowApp CONTINUE VOD 2015... prepare " + avplay.getState());
            Main._isStartedPlayback = true;
            PlayMng.player._isResumming = false;
            PlayMng.player._isFirstStepResumeDone = false;
            PlayMng.player._isBuffering = false;
            PlayMng.player._isBufferingComplete = false;
            PlayMng.player._isBufferingEventActive = false;
            avplay.play();
            avplay.pause();
            debug.alert("Main.manageShowApp CONTINUE VOD 2015... play");
            Main._isStartedPlayback = false;
            avplay.jumpForward(_position_video);
          } catch (e) {
            debug.alert("Main.manageShowApp CONTINUE VOD 2015... ERROR!!!");
          }
        }
      } else debug.alert("Main.manageShowApp SHOW DO NOTHING...");*/
    }
  }
};

var _isStartedPlayback = false;
Main.restorePlayback = function () {
  debug.alert("Main.restorePlayback");
  debug.alert("Main.restorePlayback CONTINUE VOD 2015... jumpForward");
  var scene = AppStore.yPlayerCommon.getScene().type;
  if (AppStore.yPlayerCommon.isPaused()) {
    debug.alert("Main.restorePlayback CONTINUE VOD 2015... PAUSE RESUME");
    avplay.pause();
  } else if (AppStore.yPlayerCommon.isSkipping()) {
    debug.alert("Main.restorePlayback CONTINUE VOD 2015... SKIPPING RESUME");
    avplay.pause();
  } else {
    avplay.play();
  }
  Main._need_audio_restore_check = true;
};

var _need_audio_restore_check = false;
Main.restoreAudio = function () {
  if (PlayMng.player._is_iaudio_changed) {
    Main._need_audio_restore_check = false;
    debug.alert("Main.restoreAudio CAMBIAR AUDIO");
    var sync = false;
    while (!sync) {
      sync = avplay.getState() == "PLAYING" || avplay.getState() == "PAUSE";
      debug.alert("Main.restorePlayback sync = " + sync);
      if (sync) {
        window.setTimeout(function () {
          PlayMng.player.changeAudio(PlayMng.player._iaudio_stream);
        }, 800);
      }
    }
  }
};

Main.getDeepLinkMng = function () {
  if (!Main._deeplink_mng) Main._deeplink_mng = new deeplinkmanager();
  return Main._deeplink_mng;
};

Main.handleDeepLinkData = function () {
  debug.alert("Main.handleDeepLinkData!! THERE IS A DEEPLIK INVOCATION ");
  AppStore.sceneManager.get("HomeScene")._is_deeplink_checked = false;
  Main.getDeepLinkMng().checkReqDeepLink();
  unirlib.gotoHome(true);
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
