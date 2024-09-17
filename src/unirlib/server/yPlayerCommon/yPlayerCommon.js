// @ts-check

import { appConfig } from "@appConfig";
import { parseUrl } from "src/code/js/lib";
import { AdsMng } from "@newPath/managers/ads-mng";
import { audienceManager } from "@newPath/managers/audiences/audience-mng";
import { AutoplayMng } from "src/code/managers/autoplay-mng";
import { ControlParentalMng } from "@newPath/managers/control_parental_mng";
import { KeyMng } from "src/code/managers/key-mng";
import { LoaderMng } from "src/code/managers/loader-mng";
import { ModalMng } from "src/code/managers/modal-mng";
import { PlayMng } from "src/code/managers/play-mng";
import { AppStore } from "src/code/managers/store/app-store";
import { ViewMng } from "src/code/managers/view-mng";
import { asEpgView } from "@newPath/views/as-views";
import { unirlib } from "@unirlib/main/unirlib";
import { ajaxmng } from "@unirlib/server/ajaxmng";
import { googleAnalytics } from "@unirlib/server/googleAnalytics";
import { pixelAPI } from "@unirlib/server/pixelAPI";
import { youboraAPI } from "@unirlib/server/youboraAPI";
import { adSection, initVideoplaza } from "@unirlib/server/yPlayerAds";
import { debug } from "@unirlib/utils/debug";
import { Utils } from "@unirlib/utils/Utils";
import i18next from "i18next";

import { addYoubora } from "./add_youbora";
import { YPlayerCommonMode } from "./constants";
import { YPlayerCommonStates } from "./States";

export class YPlayerCommon extends addYoubora(YPlayerCommonStates) {
  //
  //  Private
  //
  #scene;
  #sessionID;
  #sessionStored;
  #tipoContenido;
  #session_error;
  #timeout_deadman;
  #time2Live;
  #time2LiveAccum;
  #gapStartOver;
  #is_refresh;
  #isVideoPlaza;
  #msession;
  #diferido;
  #diferidoType;
  #lastPlayTs;
  #tsContentChanged;
  /** @type {valueOf<YPlayerCommonMode>} */
  #mode;
  /** @type {YPlayerCommonSkipStateEnum} */
  #skipState;
  /** @type {valueOf<YPlayerCommonStates<YPlayerCommon>>} */
  #state;

  //
  //  Public
  //
  skipStep;
  /** @deprecated */
  skipStep1000;
  _errorPopup;
  /** @deprecated There is no scene */
  _playerscene;
  _audioOk;
  _Naudio;
  _interval_ses;
  _interval_net;
  _CasID;
  _formatoVideo;
  _fw_live;
  _step_FR;
  _interval_FR;
  _interval_Pause;
  _position;
  _last_playPosition;
  _bookmarkNext;
  /**
   * @type {string | null}
   */
  _url;
  /**
   * @type {string | null}
   */
  _urlTS;
  _isChangingAudio;
  _isChangingAudioMode;
  _signonInPlayer;
  drm;
  /**
   * Indica si hay que ir a directo despues de haber pasado por
   * un **StartOver** si se hace un BACK en el {@link PlayerView} y esta
   * bandera está en _true_ se devuelve al directo
   *
   * @type {boolean}
   */
  itMustGoLive;
  _no_ads;

  constructor() {
    super();

    this.skipStep = 60;
    this.skipStep1000 = 60000;
    this._errorPopup = false;
    this._playerscene = null;
    this._audioOk = false;
    this._Naudio = 0;
    this._interval_ses = null;
    this._interval_net = null;
    this._CasID = null;
    this._formatoVideo = null;
    this._fw_live = false;
    this._step_FR = 60000;
    this._interval_FR = null;
    this._interval_Pause = null;
    this._position = 0;
    this._last_playPosition = null;
    this._bookmarkNext = -1;
    this._url = null;
    this._urlTS = null;
    this._isChangingAudio = false;
    this._isChangingAudioMode = false; // indica si se está cambiando a modo dolby para controlar el audio de prueba
    this._signonInPlayer = false;
    this.drm = "";
    this.itMustGoLive = false;
    this._no_ads = false;
    this._sendingStableLive = null;
    this.isStableLive = false;

    this.#state = this.STOPPED;
    this.#skipState = this.UNUSED;
    this.#mode = YPlayerCommonMode.VOD;
    this.#scene = null;
    this.#sessionID = null;
    this.#sessionStored = null;
    this.#tipoContenido = null;
    this.#session_error = false;
    this.#timeout_deadman = null;
    this.#time2Live = 0; // Tiempo al directo
    this.#time2LiveAccum = 0; // Tiempo al directo acumulado en previos seek
    this.#gapStartOver = 0;
    this.#is_refresh = false;
    this.#isVideoPlaza = false;
    this.#msession = 0;
    this.#diferido = false;
    this.#diferidoType = null;
    this.#lastPlayTs = null;
    this.#tsContentChanged = false;
  }

  get #player() {
    return PlayMng.player;
  }

  get #playerView() {
    return PlayMng.instance.playerView;
  }

  /**
   * Devuelve true si se ha cambiado el contenido a reproducir
   * con el {@link playTS}
   *
   * @type {boolean}
   */
  get contentChanged() {
    return this.#tsContentChanged;
  }

  /**
   * Devuelve true si es publicidad (video plaza)
   * @type {boolean}
   */
  get isVideoPlaza() {
    return this.#isVideoPlaza;
  }

  set isVideoPlaza(value) {
    if (this.#isVideoPlaza !== value) {
      this.propertyChanged("isVideoPlaza", this.#isVideoPlaza, value);
      this.#isVideoPlaza = value;
    }
  }

  /**
   * Guarda los valores de la ultima ejecucion del {@link YPlayerCommon.playTS}
   * @param {IArguments} args Argumentos con los que se llamo al play
   */
  #setLastPlayTs(args) {
    const newValue = [...args].join("-");
    if (!this.#lastPlayTs) {
      this.#lastPlayTs = newValue;
    }
    this.#tsContentChanged = this.#lastPlayTs !== newValue;
    this.#lastPlayTs = newValue;
  }

  reset() {
    this.setState(this.STOPPED);
    this.resetSkipState();
    this.stopFR();
    this.skipStep = 60;
    this.skipStep1000 = 60000;
    this._errorPopup = false;
    this._mode = YPlayerCommonMode.VOD;
    this._scene = null;
    this._playerscene = null;
    this._audioOk = false;
    this._Naudio = 0;
    this._interval_ses = null;
    this._interval_net = null;
    this._CasID = null;
    this._formatoVideo = null;
    this._fw_live = false;
    this._step_FR = 60000;
    this._interval_FR = null;
    this._interval_Pause = null;
    this._position = 0;
    this._last_playPosition = null;
    this.isVideoPlaza = false;
    this._bookmarkNext = -1;
    this._url = null;
    this._urlTS = null;
    this._isChangingAudio = false;
    this._is_promo = false;

    this.#is_refresh = false;
    this.#sessionID = null;
    this.#sessionStored = null;
    this.#tipoContenido = null;
    this.#session_error = false;
    this.#timeout_deadman = null;
    this.#time2Live = 0;
    this.#msession = 0;
    this.#diferido = false;
    // this.#isAutoplay = true;
  }

  /**
   * @param {boolean} value
   */
  setAutoplay(value) {
    AutoplayMng.instance.contentIsAutoplay = value;
  }

  isAutoplay() {
    // this.#isAutoplay;
    return AutoplayMng.instance.contentIsAutoplay;
  }

  isPlayerLiveAutoPlaying() {
    const result = (this.isPlaying() || this.isPaused() || this.isBuffering()) && this.isAutoplay();
    return result;
  }

  /**
   * @param {string} url
   */
  setUrlTS(url) {
    var urlRes = url;
    var network = AppStore.profile.get_network();
    if (network != null && network != undefined && network != "") {
      urlRes = url.replace("{network}", network);
    } else {
      urlRes = url.replace("&network={network}", "");
    }

    var suscripcion = AppStore.profile.get_suscripcion();
    if (suscripcion != null && suscripcion != undefined && suscripcion != "")
      urlRes = urlRes.replace("{suscripcion}", suscripcion);

    this._urlTS = urlRes;
  }

  isTrailer() {
    return this._playerscene === "player-view" && (this.getScene()._trailer || this.getScene()._extras_mode);
  }

  /**
   * @param {string} _type
   * @param {string} action
   */
  async sendAudience(_type, action) {
    const pos = this._position || 0;
    const fuente = PlayMng.instance?.playerView?.get_datos_editoriales() || null;
    const _plaInfo = PlayMng.instance.opts.playInfo;
    const auL = this.getCurrentAudio();
    const suL = this.getCurrentSubtitle();
    const auM = PlayMng.instance.opts.playInfo.audiioModeCode;
    const liveAction = { stop: "disconnection", play: "connection" };

    const audConfig = audienceManager.config;
    const audioMODE = (await AppStore.HdmiMng.getHdmiStatusAudioMode()) || "";
    _plaInfo.audioMode = audConfig["dolby"][audioMODE] || "";
    _plaInfo.audioModeCode = audConfig["auM"][_plaInfo.audioMode.toLowerCase()];

    if (!this.isVideoPlaza && _type === "VOD") {
      AppStore.tfnAnalytics.player(action, { evt: 2, pos, auM, auL, suL });
    } else if (this.#mode === YPlayerCommonMode.LIVE && this.isDiferido() && _type === "SO_SOp") {
      // STARTOVER
      const button = audienceManager.config.keyCodeName[KeyMng.instance.lastKeyCode];
      const trigger = button === "yellow" ? "button_yellow" : "button_restart";
      AppStore.tfnAnalytics.audience_navigation("playerOut", "start_stoverp", { trigger, auM, auL, suL }, fuente);
      AppStore.tfnAnalytics.player("disconnection", { evt: 1, auM, auL, suL });
    }
  }

  /**
   * @param {PlayerContentType} contents
   */
  #playTSPreroll(contents) {
    debug.alert("yPlayerCommon.playTS con preroll");
    PlayMng.instance.stopTimeoutBackgroundChannel();

    var contentID = "";
    if (this.#mode === YPlayerCommonMode.VOD) {
      contentID = this.#playerView.get_content_id();
      this.hideSpin();
    } else if (this.#mode === YPlayerCommonMode.LIVE && !this.isDiferido() && !this.isAutoplay()) {
      // LIVE
      this.sendAudience("LIVE", "play");
      contentID = this.#playerView._channel ? this.#playerView._channel.CodCadenaTv : "";
    } else if (this.#mode === YPlayerCommonMode.LIVE && this.isDiferido()) {
      this.sendAudience("SO_SOp", "play");
      contentID = this.#playerView.getEvento().ShowId;
    }

    debug.alert("yPlayerCommon.playTS contents: " + contents + ", contentID: " + contentID);
    var query = AppStore.wsData.getURLTkservice("tfgunir/consultas", "infopub");

    const PARAMS_R = { advId: "{advcontentId}", advContent: "{advcontents}", id: "{contentId}", content: "{contents}" };
    const isAdvContents = query.url.includes(PARAMS_R.advContent) ? PARAMS_R.advContent : PARAMS_R.content;
    const isAdvId = query.url.includes(PARAMS_R.advId) ? PARAMS_R.advId : PARAMS_R.id;

    var url_infoPub = query.url.replace(isAdvContents, contents);
    url_infoPub = url_infoPub.replace(isAdvId, contentID);
    url_infoPub = parseUrl(url_infoPub, true);

    debug.alert("yPlayerCommon.playTS WITH ADS.... url: " + url_infoPub);
    const self = this;

    try {
      Utils.ajax({
        method: "GET",
        url: url_infoPub,
        need_token: AppStore.appStaticInfo.getTVModelName() === "iptv2",
        success(data) {
          // Si se ha hecho STOP mientras se resolvía la petición (y ha navegado hacia atrás), no seguimos adelante con el flujo.
          const activeView = ViewMng.instance.active;
          const isEpgDeactivating = activeView.type === "epg" && ViewMng.instance.isViewDeactivating(activeView);
          if (
            activeView.type !== "slider" &&
            activeView.type !== "player-view" &&
            !isEpgDeactivating &&
            activeView.type !== "third-view"
          )
            return;
          self.callback_add_ads(data, true);
        },
        error(_xhr, _textStatus, _errorThrown) {
          const activeView = ViewMng.instance.active;
          console.error("timeout", activeView.type);
          if (activeView.type !== "slider" && activeView.type !== "player-view" && activeView.type !== "third-view")
            return;
          self.callback_add_ads(null, false);
        },
        timeout: 30000,
      });
    } catch (e) {
      const activeView = ViewMng.instance.active;
      console.error("timeout catch", activeView.type);
      if (activeView.type !== "slider" && activeView.type !== "player-view" && activeView.type !== "third-view") return;
      self.callback_add_ads(null, false);
    }
  }

  /**
   * @param {valueOf<YPlayerCommonMode>} playMode
   * @param {string} url
   * @param {string} casID
   * @param {FormatoVideo|undefined|null} formatoVideo
   * @param {number} position
   */
  playTS(playMode, url, casID = undefined, formatoVideo = null, position = 0) {
    this.#setLastPlayTs(arguments);

    this.fireInit();
    debug.alert("yPlayerCommon.playTS Position: " + position);
    debug.alert("yPlayerCommon.playTS CasID: " + casID);

    googleAnalytics.gaEvent("video", "play", url);

    this._position = position;
    const pos = this._position / 1000 || 0;

    this.setMode(playMode);

    this._formatoVideo = formatoVideo;
    this._CasID = casID;
    this._url = url;

    const playInfo = PlayMng.instance.opts.playInfo;
    var no_ads_bingew =
      this._playerscene == "player-view" &&
      playInfo.isBingeWatching &&
      AppStore.wsData.getContext().adserver_binge_watching == "false";

    // Check si hay preroll
    let hasPreroll = true;
    /** @type {PlayerContentType} */
    var contents = "voditems";
    this.#playerView.setMode(playMode);
    contents = this.isDiferido() ? "SO" : this.#playerView.get_content_type();

    const isTimeshifting = this.isDiferido() && this.getDiferidoType() === "time-shifting";
    if (
      this.isAutoplay() ||
      this._no_ads ||
      this.isTrailer() ||
      no_ads_bingew ||
      PlayMng.instance.epgMode ||
      (this.isLive() && !this.isDiferido()) ||
      isTimeshifting ||
      playInfo.allowPreroll === false
    ) {
      hasPreroll = false;
    } else {
      hasPreroll = AdsMng.instance.hasPreroll(contents, position);
    }

    this.setState(this.PLAYING);

    if (!hasPreroll) {
      debug.alert("this.playTS sin preroll");
      this._signonInPlayer = false;
      this.#player.playContent();
      this._no_ads = false;
      this.stableLive();
    } else {
      this.#playTSPreroll(contents);
    }
  }

  stableLive() {
    const { lastView } = ViewMng.instance;
    const isOnlyPreviewChannel = lastView?.opts?.statusPreviewChannel || AppStore.yPlayerCommon.isAutoplay() || AppStore.yPlayerCommon.isPubli();
    if (isOnlyPreviewChannel) return;

    clearTimeout(this._sendingStableLive);
    this.isStableLive = false;

    const sendTimer = Number(AppStore.wsData?.getContext().estabilidad_live || appConfig.MS_ESTABILIDAD_LIVE) * 1000;
    this._sendingStableLive = setTimeout(() => {
      if (this.isLive() && !this.isDiferido() && !AppStore.yPlayerCommon.isAutoplay()) {
        const channel = PlayMng.instance.playerView._channel;
        if (channel && !channel.isStableLive) {
          channel.isStableLive = true;
          audienceManager.lastStableChannel = channel;
          AppStore.yPlayerCommon.isStableLive = true;
          AppStore.tfnAnalytics.player("connection", { evt: 1 }, channel);

          if (channel.CodCadenaTv) {
            const secPlay = Date.now() / 1000;
            unirlib.getLastChannels().insertar_channel(channel.CodCadenaTv, secPlay);
            this.#playerView.refresh_channels();
          }
        }
        this._sendingStableLive = null;
      }
    }, sendTimer);
  }

  callback_add_ads(json, success) {
    debug.alert("yPlayerCommon.callback_add_ads success: " + success);

    const eHost = AppStore.wsData ? AppStore.wsData._AD_SERVER : false;

    if (success && eHost) {
      debug.alert("yPlayerCommon.callback_add_ads JSON PARAMETERS: " + JSON.stringify(json));

      //var eContentId	= json.vpContentId;						// 1058527;pla
      var eContentId = null;
      var eCategory = json.vpCategory;
      this.#add_extra_tags(json);
      var eTags = json.vpTags.map((tag) => parseUrl(tag)); // ['standard'];

      //eTags = ["DTHTITULAR","samsung","CPCOME"];

      debug.alert("yPlayerCommon.callback_add_ads eContentId: " + eContentId);
      debug.alert("yPlayerCommon.callback_add_ads eCategory: " + eCategory);
      debug.alert("yPlayerCommon.callback_add_ads eTags: " + JSON.stringify(eTags));
      debug.alert("yPlayerCommon.callback_add_ads eHost: " + eHost);

      //initVideoplaza(eContentId, eCategory, eTags, eHost, json.vbw, json.vwt, json.vht);
      initVideoplaza(eContentId, eCategory, eTags, eHost);
      adSection.videoStart("onbeforecontent");
    } else {
      this.isVideoPlaza = false;
      this._signonInPlayer = false;

      this.#player.playContent();
    }
  }

  #add_extra_tags(json) {
    const contentId = this.getContentId();
    const isRented = unirlib.getMyLists().isRented(contentId);

    json.vpTags.push(`pid:${AppStore.profile.get_account_number()}`);

    if (isRented) {
      json.vpTags.push("cat:alq");
    } else {
      json.vpTags.push("cat:sus");
    }
  }

  /**
   * @returns {valueOf<YPlayerCommonMode>}
   */
  getMode() {
    return this.#mode;
  }

  /**
   *
   * @param {valueOf<YPlayerCommonMode>} mode
   */
  setMode(mode) {
    this.#mode = mode;
    this._playerscene = "player-view";
  }

  getScene() {
    return this.#playerView;
  }

  isPlaying() {
    return this.#state === this.PLAYING;
  }

  isBuffering() {
    return this.#state === this.BUFFERING;
  }

  isPaused() {
    return this.#state === this.PAUSED && !this.isSkipping();
  }

  isStopped() {
    return this.#state === this.STOPPED || this.#state == this.ENDED;
  }

  isSkipping() {
    return this.#skipState === this.REWIND || this.#skipState === this.FORWARD;
  }

  /**
   * Set new state
   * @param {valueOf<YPlayerCommonStates<YPlayerCommon>>} value new state
   */
  setState(value) {
    debug.alert("yPlayerCommon.setState:" + this.#state + " -> " + value);
    this.#state = value;
    if (this.#state === this.PLAYING) {
      this._bookmarkNext = -1;
    }
  }

  backgroundMode() {
    return PlayMng.instance.backgroundMode;
  }

  resetSkipState() {
    debug.alert("resetSkipState");
    this.setSkipState(this.UNUSED);
  }

  /**
   * @returns {YPlayerCommonSkipStateEnum}
   */
  getSkipState() {
    return this.#skipState;
  }

  /**
   * @param {YPlayerCommonSkipStateEnum} value
   */
  setSkipState(value) {
    console.info("YPlayerCommon.setSkipState", value);
    this.#skipState = value;
  }

  // TODO: Verificar no hace nada solo mostrar un loader
  showSpin() {
    if (!this.isAutoplay() && !PlayMng.instance.epgMode) LoaderMng.instance.show_loader();
  }

  // TODO: Verificar no hace nada solo quitar
  hideSpin() {
    LoaderMng.instance.hide_loader();
  }

  // startCheckNet() {
  //   if (!this._interval_net) {
  //     var net_check = AppStore.wsData._network_check;

  //     if (net_check > 0) {
  //       var interv = 1000 * net_check;
  //       this._interval_net = setInterval(this.checkNet.bind(this), interv);
  //     } else if (net_check == 0) {
  //       this.checkNet();
  //     }
  //   }
  // }

  // stopCheckNet() {
  //   if (this._interval_net) {
  //     clearInterval(this._interval_net);
  //     this._interval_net = null;
  //   }
  // }

  closeCheckNet() {
    if (this._errorPopup && AppStore.appStaticInfo.checkNetworkConnection()) {
      debug.alert("yPlayerCommon.closeCheckNet");
      var prevTime = 0;
      if (this.#mode === YPlayerCommonMode.VOD) prevTime = this.getScene().getTime();
      this.#player.replayTS(prevTime);
      AppStore.errors.hideError();
      this._errorPopup = false;
    }
  }

  //var countnet = 0;
  checkNet() {
    var ok = true;
    /*
  countnet++;
  debug.alert('checkNet ' + countnet);
  if (countnet>3 && countnet<5)*/
    if (!AppStore.appStaticInfo.checkNetworkConnection()) {
      debug.alert("yPlayerCommon.checkNet PLAYER: NO HAY CONEXION A INTERNET");
      this.#playerView.reportError("PLAYER: NO HAY CONEXION A INTERNET");
      AppStore.errors.showError(this._playerscene, this._playerscene, "general", "E_Gen_3", false);
      ok = false;
      this._errorPopup = true;
    } else {
      debug.alert("yPlayerCommon.checkNet PLAYER:HAY CONEXION A INTERNET");
      if (this._errorPopup) {
        var prevtime = 0;
        if (this.#mode === YPlayerCommonMode.VOD) prevtime = this.getScene().getTime();
        this.#player.replayTS(prevtime);

        AppStore.errors.hideError();
        this._errorPopup = false;
      }
    }
    return ok;
  }

  /* GESTION DE SESIONES DEL PLAYER */

  setSessionID(sessionID) {
    this.#sessionID = sessionID;
  }

  getSessionID() {
    return this.#sessionID;
  }

  startSession(playMode, CasID, TipoContenido, scene) {
    this.setMode(playMode);
    debug.alert("yPlayerCommon.startSession... Player: " + this._playerscene + " " + CasID);
    this._CasID = CasID;
    this.#tipoContenido = TipoContenido;
    this._scene = scene;
    var session_duration = AppStore.wsData._session_duration;
    if (session_duration < 0) {
      PlayMng.instance.callback_startSession();
    } else {
      this.#newSession(false);
    }
  }

  async stop(isStopSessionNotReq, blankScreen = true, changingContent = false) {
    this.sendAudience("LIVE", "stop");
    debug.alert("yPlayerCommon.stop - STOP VIDEO ");
    this.setAutoplay(true);
    if (
      this.#mode === YPlayerCommonMode.PLAY_READY ||
      isStopSessionNotReq ||
      AppStore.appStaticInfo.getTVModelName() === "iptv2"
    ) {
      this.setSessionID(null);
      await this.exec_stop(blankScreen, changingContent);
    } else this.stopSession();
    this.isVideoPlaza = false;
  }

  async onlyStop(blankScreen = true) {
    /// Parámetros para medición de audiencias

    const { playInfo } = PlayMng.instance.opts;
    const pos = this._position / 1000 || 0;
    const isNextPlay = playInfo.buttonPlayerNext;
    const _asset = this.#playerView.getAsset();
    const _editorial = this.#playerView._datos_editoriales;
    const fuente = { ..._asset, ..._editorial };
    const isBW = playInfo.isBingeWatching ? "bw" : false;
    const listAction = !isBW
      ? { ok: isNextPlay ? "episodes" : "similars", back: "button_back", stop: "button_stop" }
      : { ok: isBW };
    const button = audienceManager.config.keyCodeName[KeyMng.instance.lastKeyCode];
    const trigger = listAction?.[button] || "eop";

    this.setState(this.STOPPED);

    await this.#player.stopPlayer(blankScreen);

    AppStore.tfnAnalytics.player("stop", { evt: 2, pos });
    if (this.#playerView.get_content_type() == "U7D" && trigger === "eop")
      AppStore.tfnAnalytics.audience_playerOut("stop", { evt: 2 });
    if (!this.isTrailer() && !playInfo.autoplay)
      AppStore.tfnAnalytics.audience_navigation("bookmarking", "ck_addbkm", { trigger }, fuente);
  }

  async exec_stop(blankScreen = true, changingContent = false) {
    //auditar
    console.warn("exec_stop", blankScreen, changingContent);
    if (this.isPlaying()) {
      if ((!this.isVideoPlaza && !this.isLive() && this.isPlaying()) || this.isTrailer()) {
        this.onlyStop();
      }
    }
    this.setAutoplay(true);
    debug.alert("this.exec_stop... ");
    if (this._interval_ses) {
      clearInterval(this._interval_ses);
      this._interval_ses = null;
    }
    if (this.#state != this.STOPPED && this.#state != this.ENDED) {
      this.setState(this.STOPPED);
      this.resetSkipState();
      if (AppStore.appStaticInfo.getTVModelName() === "iptv2") {
        // Mantenemos el canal live en background o si es VOD arrancamos timer
        // si es un diferido tambien
        if (this.#mode === YPlayerCommonMode.VOD || this.isDiferido()) {
          await this.#player.stopPlayer(blankScreen);
          if (!changingContent) PlayMng.instance.restartTimeoutBackgroundChannel();
        } else {
          const lastView = ViewMng.instance.lastView;
          if (lastView?.type === "epg") {
            const program = asEpgView(lastView).epgProgram;
            if (program.allowed && !ControlParentalMng.instance.checkPINForAdultContent(program)) {
              if (!changingContent) await PlayMng.instance.setBackgroundMode(true);
            } else {
              await this.#player.stopPlayer(blankScreen);
            }
          } else if (lastView?.type === "player-view") {
            if (this.#playerView.parentalAllowed()) {
              if (!changingContent) await PlayMng.instance.setBackgroundMode(true);
            } else {
              await this.#player.stopPlayer(blankScreen);
            }
          } else {
            await this.#player.stopPlayer(blankScreen);
            if (
              blankScreen &&
              this.isAutoplay() &&
              this.#mode === 1 &&
              (lastView?.type === "slider" ||
                lastView?.type === "settings" ||
                (lastView?.type === "popup" && this._isChangingAudioMode))
            ) {
              PlayMng.instance.restartTimeoutBackgroundChannel();
            }
          }
        }
      } else {
        // Paramos
        await this.#player.stopPlayer(blankScreen);
      }
    } else {
      youboraAPI.fireStop();
    }
    this.isVideoPlaza = false;
    //this.stopCheckNet();
    this.#stopDeadman();
    this.stopFR();
    this.stopPause();
    this.resetTime2Live();
  }

  async stopSession() {
    debug.alert("yPlayerCommon.stopSession");
    if (this._interval_ses) {
      clearInterval(this._interval_ses);
      this._interval_ses = null;
    }
    if (AppStore.appStaticInfo.getTVModelName() !== "iptv2") {
      this.#closeSession("stop_session");
    }
  }

  #newSession(refresh) {
    const _sendAUD = AppStore.yPlayerCommon.getMode() === 1 ? { evt: 1 } : { evt: 2 };
    if (refresh == true) AppStore.tfnAnalytics.player("keep_alive", { ..._sendAUD });
    this.#is_refresh = refresh == true;
    this.#closeSession("new_session");
  }

  getContentId(_force) {
    var contentID = this._CasID;

    if (AppStore.login.isAnonimousUser()) {
      contentID = this.#playerView._datos_editoriales.Id;
    } else {
      if (this.#mode === YPlayerCommonMode.LIVE) {
        if (this.#playerView && this.#playerView._channel) contentID = this.#playerView._channel.CodCadenaTv;
        else if (PlayMng.instance.epgMode)
          contentID = asEpgView(ViewMng.instance.viewType("epg")).getCurrentChannel().CodCadenaTv;
      } else if (this.#mode === YPlayerCommonMode.VOD) {
        var _origenScene = this.getScene().origin;
        var _trailer = this.getScene()._trailer;

        if (_trailer && !_force) {
          contentID = null;
        } else {
          contentID = this.getScene().get_datos_editoriales().Id;
          if (!contentID) contentID = this.getScene().get_datos_editoriales().ShowId;
        }
      }
    }

    return contentID;
  }

  getContentIdPubli() {
    if (this.#mode === YPlayerCommonMode.LIVE && this.#playerView) {
      return this.#playerView.getCurrentProgram().ShowId;
    }
    return this.getContentId();
  }

  // TODO: porque se debe iniciar sesion en el player??
  iniciarSession(first_request) {
    debug.alert("yPlayerCommon.iniciarSession...");
    this.#session_error = false;
    AppStore.playReady._first_request = first_request;
    AppStore.playReady.iniciar_setUpStream(this.getContentId(), this.#tipoContenido, this.getchUID());
  }

  getCToken() {
    const url = AppStore.wsData._SRV_CTOKEN;
    //url = Main.getDevice().setTestIPAddress(url);

    const asset = this.#playerView.getAsset();
    const data = {
      casId: asset.CasId,
      contentId: this.#playerView._datos_editoriales.Id,
      streamType: asset.streamType,
    };

    var promise = new Promise(function (resolve, reject) {
      Utils.ajax({
        url,
        method: "POST",
        data: JSON.stringify(data),
        contentType: "application/json",
        need_token: AppStore.appStaticInfo.getTVModelName() === "iptv2",
        success(data, _status, _xhr) {
          if (data && data.access_token && data.access_token.length > 0) {
            resolve(data.access_token);
          } else {
            reject();
          }
        },
        error(_xhr, _textStatus, _errorThrown) {
          reject();
        },
        timeout: 20000,
      });
    });
    return promise;
  }

  callback_new_session(ok, req_status) {
    var self = this;
    req_status = String(req_status);
    debug.alert("yPlayerCommon.callback_new_session... " + ok + ", req_status = " + req_status);
    if (
      !ok &&
      (req_status == "40101" ||
        req_status == "40301" ||
        req_status == "40302" ||
        req_status == "41002" ||
        req_status == "40306" ||
        req_status == "40307")
    ) {
      // error
      var error_msg = "";
      var error_seccion = "";
      error_seccion = "setUpStream";
      error_msg = "E_SET_1";
      if (req_status == "40301") error_msg = "E_SET_3";
      else if (req_status == "40302") error_msg = "E_SET_4";
      else if (req_status == "41002") error_msg = "E_SET_5";
      else if (req_status == "40306") error_msg = "E_SET_6";
      else if (req_status == "40307") error_msg = "E_SET_7";
      // Stop details autplay fadeout
      if (AppStore.home.getDetailsView()) {
        AppStore.home.getDetailsView().fadeout_stop();
      }
      AppStore.errors.showErrorPlay(this._playerscene, this.#scene, error_seccion, error_msg, true);
      youboraAPI.fireForceError(error_msg);
      this.exec_stop();
      this.#session_error = true;
    } else {
      var coduser = AppStore.login.getUserId();
      if (ok && coduser) {
        unirlib.getSessions().insertSession(coduser, this.#sessionID);
        unirlib.getSessions().saveSessions();
      }
      var session_duration = AppStore.wsData._session_duration;
      if (session_duration > 0) {
        var interv = 1000 * session_duration;
        if (!this._interval_ses)
          this._interval_ses = setInterval(function () {
            self.#newSession(true);
          }, interv);
      }

      if (!this.#is_refresh) PlayMng.instance.callback_startSession();
      this.#is_refresh = false;
    }
  }

  #closeSession(command) {
    if (this._errorPopup) return;
    debug.alert("yPlayerCommon.closeSession... " + command);
    var coduser = AppStore.login.getUserId();
    if (coduser != null) {
      this.#sessionStored = unirlib.getSessions().getSessionUser(coduser);
      unirlib.getSessions().debug();
    }
    debug.alert("yPlayerCommon.closeSession... this._sessionStored = " + this.#sessionStored);
    debug.alert("yPlayerCommon.closeSession... this._sessionID = " + this.#sessionID);
    if (command == "new_session") {
      if (!this.#sessionID) this.iniciarSession(true);
      else {
        debug.alert("yPlayerCommon.closeSession.. KEEPALIVE");
        this.#session_error = false;
        AppStore.playReady.keepAlive();
      }
    } else if (command == "stop_session") {
      debug.alert("yPlayerCommon.closeSession... FINISHED");
      if (this.#sessionID) AppStore.playReady.iniciar_tearDownStream(this.#sessionID);
      this.setSessionID(null);
      this.exec_stop();
    }
  }

  /* Control de hombre muerto */
  startDeadman() {
    if (AppStore.appStaticInfo.getTVModelName() !== "iptv2") {
      this.#stopDeadman();
      var inactivity_check = AppStore.wsData ? AppStore.wsData._inactivity_check : 14400;
      debug.alert("yPlayerCommon.startDeadman - start DEADMAN ---> inactivity_check = " + inactivity_check);

      if (inactivity_check) {
        var interv = 1000 * inactivity_check;
        if (!this.#timeout_deadman) this.#timeout_deadman = setInterval(this.#deadman.bind(this), interv);
      }
    }
  }

  #stopDeadman() {
    if (AppStore.appStaticInfo.getTVModelName() !== "iptv2") {
      debug.alert("yPlayerCommon.stopDeadman - stop DEADMAN");
      if (this.#timeout_deadman) {
        clearTimeout(this.#timeout_deadman);
        this.#timeout_deadman = null;
      }
    }
  }

  #deadman() {
    if (!this._errorPopup && !this.#session_error && AppStore.appStaticInfo.getTVModelName() !== "iptv2") {
      var escena_origen_player = this.#playerView.origin;
      this.#stopDeadman();
      AppStore.errors.showError("", this._playerscene, "Player", "I_PLA_1", false);
    }
  }

  checkFRStep() {
    var level = "1";
    if (this.isSkipping()) {
      if (this._step_FR == 8000) {
        level = "2";
        this._step_FR = 16000;
      } else if (this._step_FR == 16000) {
        level = "3";
        this._step_FR = 32000;
      } else if (this._step_FR == 32000) {
        level = "4";
        this._step_FR = 64000;
      } else if (this._step_FR == 64000) {
        level = "1";
        this._step_FR = 8000;
      }
    } else {
      this._step_FR = 8000;
      level = "1";
    }

    return level;
  }

  startFR() {
    this.stopFR();
    this._interval_FR = setInterval(this.#stepFR.bind(this), 1000);
  }

  // reset_FR_times() {
  //   this._accum_Pause = 0;
  //   this._time_FR = 0;
  //   this._time_FR_init = 0;
  // }

  stopFR() {
    if (this._interval_FR) {
      window.clearInterval(this._interval_FR);
      this._interval_FR = null;
    }
  }

  #stepFR() {
    const $this = this;
    const scene = this.#playerView;
    if ($this.#skipState === $this.FORWARD) {
      $this.setTime2Live($this.#time2Live - $this._step_FR);
      const timeProgress = this.getScene().getTime() - $this.#time2Live;
      const totalTime = this.#playerView.getTotalTime();

      if ($this.#mode === YPlayerCommonMode.LIVE && $this.#time2Live <= 0) {
        this.stopFR();
        $this.resetSkipState();
        scene.goLive(true);
      } else if ($this.#mode === YPlayerCommonMode.VOD && timeProgress >= totalTime) {
        this.stopFR();
        scene.stop();
      } else {
        scene.updateProgressBar(timeProgress);
      }
    } else if ($this.#skipState === $this.REWIND) {
      $this.setTime2Live($this.#time2Live + $this._step_FR);
      const timeProgress = this.getScene().getTime() - $this.#time2Live;
      const totalTime = this.#playerView.getTotalTime();

      if ($this.#mode === YPlayerCommonMode.LIVE) {
        const ahora = AppStore.appStaticInfo.getServerTime();
        const hora_actual = ahora.getTime();
        const evento = this.#playerView.getEvento();
        const difInicio = parseInt(hora_actual) - parseInt(evento.FechaHoraInicio);

        if (
          (AppStore.appStaticInfo.getTVModelName() !== "iptv2" &&
            ($this.#time2Live >= totalTime || (!appConfig.BUFFER_LIVE_ENABLED && $this.#time2Live >= difInicio))) ||
          (AppStore.appStaticInfo.getTVModelName() === "iptv2" && $this.#time2Live >= difInicio)
        ) {
          this.stopFR();
          // Eliminamos gap
          $this.#gapStartOver = 0;
          scene.playpause();
        } else {
          scene.updateProgressBar(timeProgress);
        }
      } else if ($this.#mode === YPlayerCommonMode.VOD && timeProgress <= 0) {
        this.stopFR();
        scene.playpause();
      } else {
        scene.updateProgressBar(timeProgress);
      }

      /*
    if (nextTime > 0) {
      $this._time_FR = nextTime;
      scene.updateProgressBar($this._time_FR);
    } else {
      $this._time_FR = 0;
      scene.updateProgressBar(0);
      scene.playpause();
    }*/
    }
  }

  startPause() {
    if (this.isLive()) {
      this.stopPause();
      this._interval_Pause = setInterval(this.#stepPause.bind(this), 1000);
    }
  }

  stopPause() {
    if (this._interval_Pause) {
      clearInterval(this._interval_Pause);
      this._interval_Pause = null;
    }
  }

  #stepPause() {
    this.setTime2Live(this.#time2Live + 1000);
    this.#playerView.updateProgressBar();
  }

  // setGapStartOver(value) {
  //   if (this.#gapStartOver === 0 && !this.isPaused()) {
  //     this.#gapStartOver = value;
  //   }
  // }

  getGapStartOver() {
    return this.#gapStartOver + 30000;
  }

  setTime2Live(milliseconds) {
    this.#time2Live = milliseconds;
  }

  getTime2Live() {
    return this.#time2Live;
  }

  setIsDiferido(value, linkType) {
    this.propertyChanged("isDiferido", this.#diferido, value);
    this.#diferido = value;
    this.#diferidoType = value ? linkType : null;
  }

  isDiferido() {
    return this.#diferido;
  }

  getDiferidoType() {
    return this.#diferidoType;
  }

  resetTime2Live() {
    this.setTime2Live(0);
    this.#time2LiveAccum = 0;
    this.setIsDiferido(false);
  }

  setTime2LiveAccum(value) {
    this.#time2LiveAccum = value;
  }

  getTime2LiveAccum() {
    return this.#time2LiveAccum;
  }

  skipForward() {
    this.stopPause();

    let frLevel = "1";
    if (this.#skipState === this.REWIND) {
      this._step_FR = 8000;
      this.getScene().setScreenStatus("ffx" + frLevel);
      this.setSkipState(this.FORWARD);
    } else {
      frLevel = this.checkFRStep();

      this.getScene().setScreenStatus("ffx" + frLevel);

      if (this.#skipState !== this.FORWARD) {
        this.fireEvent("fireSeekBegin");
        if (AppStore.appStaticInfo.hasPixel()) {
          pixelAPI.reportPauseStart();
        }

        if (AppStore.appStaticInfo.getTVModelName() === "iptv2") {
          if (this.isLive() && !this.isDiferido()) {
            this.#player._stateAfterPlay = this.FORWARD;
            this.#playerView.verDiferido();
          } else {
            this.#player.forward();
            this.startFR();
          }
        } else {
          this.#player.pause();
          this.startFR();
        }

        this.setSkipState(this.FORWARD);
        this.setState(this.PAUSED);
      } else {
        this.#player.forward();
      }
    }
  }

  playForward() {
    let frLevel = "1";
    if (this.#skipState === this.REWIND) {
      this._step_FR = 8000;
    } else {
      frLevel = this.checkFRStep();
    }
    this.setSkipState(this.FORWARD);
    this.getScene().setScreenStatus("ffx" + frLevel);
  }

  skipBackward() {
    this.stopPause();

    let frLevel = "1";
    if (this.#skipState === this.FORWARD) {
      this._step_FR = 8000;
      this.getScene().setScreenStatus("rwx" + frLevel);
      this.setSkipState(this.REWIND);
    } else {
      frLevel = this.checkFRStep();

      if ((this.isLive() && this.isDiferido()) || !this.isLive()) {
        // No mostramos iconos de RW al cargar por primera vez el stream SO+ con RW
        this.getScene().setScreenStatus("rwx" + frLevel);
      }

      if (this.#skipState !== this.REWIND) {
        this.setSkipState(this.REWIND);
        this.fireEvent("fireSeekBegin");
        if (AppStore.appStaticInfo.hasPixel()) {
          pixelAPI.reportPauseStart();
        }

        if (AppStore.appStaticInfo.getTVModelName() === "iptv2") {
          if (this.isLive() && !this.isDiferido()) {
            debug.alert("verDiferido skipState=", this.#skipState);
            this.#player._stateAfterPlay = this.REWIND;
            this.#playerView.verDiferido();
          } else {
            this.#player.rewind();
            this.startFR();
          }
        } else {
          this.#player.pause();
          this.startFR();
        }

        this.setState(this.PAUSED);
      } else {
        this.#player.rewind();
      }
    }
  }

  playBackward() {
    let frLevel = "1";
    if (this.#skipState === this.FORWARD) {
      this._step_FR = 8000;
    } else {
      frLevel = this.checkFRStep();
    }
    this.setSkipState(this.REWIND);
    this.getScene().setScreenStatus("rwx" + frLevel);
  }

  skipBackwardLiveSec(skiptimeMs) {
    this.setSkipState(this.REWIND);
    this.setTime2Live(skiptimeMs);
    const timeProgress = this.getScene().getTime() - this.#time2Live;
    this.#playerView.updateProgressBar(timeProgress);
    this.#playerView.playpause();
  }

  loadAudios(urlVideo) {
    debug.alert("yPlayerCommon.loadAudios");

    var url_audios = AppStore.wsData._SRV_AUDIOS;
    if (url_audios != null && url_audios != undefined && url_audios != "") {
      debug.alert("urlVideo " + urlVideo);
      urlVideo = escape(urlVideo);
      urlVideo = urlVideo.replace(/\//g, "%2F");
      debug.alert("urlVideo " + urlVideo);

      url_audios = url_audios.replace("{urlVideo}", urlVideo);

      debug.alert("url_audios = " + url_audios);

      var ajax_loader = new ajaxmng();
      ajax_loader._origen_scene = "player-view";
      ajax_loader._command = "load_audios";
      ajax_loader.load_json(url_audios);
    }
  }

  getAudioLangCode(code) {
    debug.alert("yPlayerCommon.getAudioLangCode code audio " + code);

    var code3 = code;
    if (code.length > 3) code3 = code.substring(code.length - 3, code.length);

    debug.alert("yPlayerCommon.getAudioLangCode code2 audio " + code3);

    const msg = "languages." + code3;
    let lang = i18next.t(msg);
    if (!lang || msg === lang) lang = "V.O.";

    debug.alert("yPlayerCommon.getAudioLangCode lang: " + lang);
    return lang;
  }

  getSubName(_sub) {
    const msg = "languages." + _sub;
    let lang = i18next.t(msg);
    if (!lang || msg === lang) lang = "V.O";

    return lang;
  }

  getCurrentAudio() {
    let audio = null;
    if (this.#playerView) audio = this.#playerView.getCurrentAudio();
    return audio ? audio : unirlib.getUserProfile()?.audioCode || "NONE";
  }

  getCurrentSubtitle() {
    let subtitle = null;
    if (this.#playerView) subtitle = this.#playerView.getCurrentSubtitle();
    return subtitle ? subtitle : "NONE";
  }

  getCurrentSubtitleLangCode() {
    let subtitle = null;
    if (this.#playerView) subtitle = this.#playerView.getCurrentSubtitleLangCode();
    return subtitle ? subtitle : "NONE";
  }

  getMSession() {
    return this.#msession;
  }

  isLive() {
    return this.#mode === YPlayerCommonMode.LIVE;
  }

  isStartOver() {
    return this.isLive() && this.isDiferido();
  }

  getStatusTXT() {
    var statusText = "";
    switch (this.#state) {
      case this.STOPPED:
        statusText = "STOPPED";
        break;
      case this.PLAYING:
        statusText = "PLAYING";
        break;
      case this.PAUSED:
        statusText = "PAUSED";
        if (this.#skipState === this.FORWARD) statusText = "FORWARD";
        else if (this.#skipState === this.REWIND) statusText = "REWIND";
        else statusText = "PAUSED";
        break;
      default:
        statusText = "UNUSED";
        break;
    }

    return statusText;
  }

  getCDN() {
    var cdn = null;
    if (this._playerscene) cdn = this.#playerView.getCDN();
    return cdn;
  }

  getchUID() {
    return this.#playerView.getchUID();
  }

  getCustomData() {
    var custom = "";
    if (!AppStore.appStaticInfo.isToken()) {
      custom =
        "<ContextCustomData>" +
        "<AccountNumber>" +
        AppStore.login.getAccountNumber() +
        "</AccountNumber>" +
        "<ContentId>" +
        this._CasID +
        "</ContentId>" +
        "</ContextCustomData>";
    } else {
      custom =
        "<ContextCustomData>" +
        "<AccountNumber>" +
        AppStore.login.getAccountNumber() +
        "</AccountNumber>" +
        "<ContentId>" +
        this._CasID +
        "</ContentId>" +
        "<DeviceUid>" +
        AppStore.playReady.getPlayReadyId() +
        "</DeviceUid>" +
        "</ContextCustomData>";
    }

    return custom;
  }

  hasVideoUrl() {
    return this._urlTS && this._urlTS !== "";
  }

  async resize_player_area(posx, posy, sizex, sizey) {
    await this.#player.resize(posx, posy, sizex, sizey);
  }

  // restore_player_area() {
  //   this.#player.resize(0, 0, 1280, 720);
  // }

  signonByMpDeviceIdPlayer() {
    return new Promise(function (resolve, reject) {
      var url = AppStore.wsData._SRV_SIGNON;

      debug.alert("profile.prototype.signonByMpDeviceId (en Player) url = " + url);
      var deviceId = AppStore.playReady.getPlayReadyId();
      var body = { arg0: deviceId };

      // FIXME: Se puso un valor arbitrario ya que _http_timeout no existe en wsData
      // FIXME: y el parseint de un undefined es NaN
      // var tout = parseInt(AppStore.wsData._http_timeout);
      var tout = 5000;

      Utils.ajax({
        method: "POST",
        url,
        data: body,
        dataType: "json",
        timeout: tout,
        success(data, status, xhr) {
          try {
            var response = xhr.responseText;
            var json = JSON.parse(response);

            AppStore.profile.setSignonToken(json.token);

            debug.alert("new signon token= " + json.token);
            debug.alert("json.resultCode= " + json.resultCode);
            //reactivacion: error de dispositivo fuera de cuenta
            if (json.resultCode === "23017:23018") {
              AppStore.home.popAvisoInitData();
              reject({ errorCode: json.resultCode });
            } else {
              resolve(null);
            }
          } catch (e) {
            resolve(null);
          }
        },
        error(_xhr, _textStatus, _errorThrown) {
          reject({ errorCode: -1 });
        },
      });
    });
  }

  async showErrorPlayer() {
    this.#playerView.isErrorShowing = true;
    await ModalMng.instance.showPopup("error_reproduccion");
  }

  prepareUrl(url) {
    var urlres = url;
    if (urlres) {
      var network = AppStore.profile.get_network();
      if (network) urlres = url.replace("{network}", network);
      else urlres = url.replace("&network={network}", "");
      var suscripcion = AppStore.profile.get_suscripcion();
      if (suscripcion) urlres = urlres.replace("{suscripcion}", suscripcion);
      else urlres = urlres.replace("&suscripcion={suscripcion}", "");
      this.#msession = Math.floor(Math.random() * 100000000);
      urlres = urlres.replace("{sesion}", this.#msession);
      urlres = urlres.replace("{session}", this.#msession);
    }

    return urlres;
  }

  getUrl() {
    return this._url;
  }

  getTitle() {
    return this.#playerView.getTitle() || "";
  }

  isPubli() {
    return this.isVideoPlaza;
  }

  getFormatoVideo() {
    return this._formatoVideo || null;
  }

  getType() {
    return this.isTrailer() ? "trailer" : this.#playerView.get_content_type();
  }
}

/**
 * PLayer mode  vienen de {@link YPlayerCommonMode}
 * 0:vod, 1:live, 2:playready, 3: evento,pase
 * * {@link YPlayerCommonMode.VOD} = 0
 * * {@link YPlayerCommonMode.LIVE} = 1
 * * {@link YPlayerCommonMode.PLAY_READY} = 2
 * * {@link YPlayerCommonMode.EVENT} = 3
 * @typedef {valueOf<YPlayerCommonMode>} YPlayerCommonModeEnum
 */

/**
 * Player States {@link YPlayerCommon.getState()} values are
 * * {@link YPlayerCommon.STOPPED} = 0;
 * * {@link YPlayerCommon.PLAYING } = 1;
 * * {@link YPlayerCommon.PAUSED} = 2;
 * * {@link YPlayerCommon.BUFFERING}  = 5;
 * * {@link YPlayerCommon.ENDED} = 6;
 * @typedef {0|1|2|5|6} YPlayerCommonStateEnum
 */

/**
 * Player Skip States {@link YPlayerCommon.getSkipState()} values are
 * * {@link YPlayerCommon.UNUSED} = -1;
 * * {@link YPlayerCommon.FORWARD} = 3;
 * * {@link YPlayerCommon.REWIND} = 4;
 * @typedef {-1|3|4} YPlayerCommonSkipStateEnum
 */

/**
 * @template T
 * @typedef { T[keyof T] } valueOf
 */

/**
 * @typedef {"voditems" | "SO" | "channels" | "NPVR" |  "U7D"} PlayerContentType
 */

/**
 * @typedef {"HD" | "UHD" | "SD" } FormatoVideo
 */
