import "@newPath/views/player-view/player-view.css";

import { appConfig } from "@appConfig";
import { DetailsModalComponent } from "@newPath/components/details/details-modal/details-modal";
import { PlayerAudioSubComponent } from "src/code/components/player/player-audio-sub/player-audio-sub";
import { PlayerFlyerComponent } from "@newPath/components/player/player-flyers/player-flyer";
import { PlayerTrickModesComponent } from "@newPath/components/player/player-trick-modes/player-trick-modes";
import * as CONSTANTS from "@newPath/constants/bingewatching";
import { EventBus } from "src/code/js/alterbus";
import { get_link_related, mapEnlace } from "src/code/js/lib";
import { getDateValues, isToday, isTomorrow } from "src/code/js/time-utils";
import { TpaEventEmitter } from "@newPath/managers/3pa-mng/3pa-event-emitter";
import { AdsMng } from "@newPath/managers/ads-mng";
import { AppChannelsMng } from "@newPath/managers/app-channels-mng";
import { audienceManager } from "@newPath/managers/audiences/audience-mng";
import { AutoplayMng } from "src/code/managers/autoplay-mng";
import { BackgroundMng } from "src/code/managers/background-mng";
import { assembleChannel } from "@newPath/managers/channels-utils";
import { ControlParentalMng } from "@newPath/managers/control_parental_mng";
import { DialMng } from "@newPath/managers/dial-mng";
import { EpgMng } from "@newPath/managers/epg-mng";
import { html } from "src/code/managers/home-mng";
import { KeyMng } from "src/code/managers/key-mng";
import { LoaderMng } from "src/code/managers/loader-mng";
import { ModalMng } from "src/code/managers/modal-mng";
import { PipMng } from "@newPath/managers/pip-mng";
import { MODO, PlayMng } from "src/code/managers/play-mng";
import { seguimiento_mng } from "@newPath/managers/seguimiento_mng";
import { AppStore } from "src/code/managers/store/app-store";
import { ViewMng } from "src/code/managers/view-mng";
import { viewTypeNames } from "src/code/managers/view-mng/view-type-names";
import { WatermarkMng } from "@newPath/managers/watermark-mng";
import { programEpgApplication } from "@newPath/model/programEpgApplication";
import { programEpgDvbipi } from "@newPath/model/programEpgDvbipi";
import { programEpgHttp } from "@newPath/model/programEpgHttp";
import { programEpgNotAvailable } from "@newPath/model/programEpgNotAvailable";
import { DetailsView } from "src/code/views/details/details";
import { SliderView } from "src/code/views/slider/slider";
import { MitoAPI } from "@tvlib/MitoAPI";
import { StartMng } from "@tvlib/start-mng";
import { Main } from "@tvMain";
import { unirlib } from "@unirlib/main/unirlib";
import { ykeys } from "@unirlib/scene/ykeys";
import { bookmarking } from "@unirlib/server/bookmarking";
import { convivaAPI } from "@unirlib/server/convivaAPI";
import { pixelAPI } from "@unirlib/server/pixelAPI";
import { adSection, adTrack } from "@unirlib/server/yPlayerAds";
import { YPlayerCommonMode } from "@unirlib/server/yPlayerCommon";
import { Tratasrt } from "@unirlib/sub/srt";
import { debug } from "@unirlib/utils/debug";
import { Utils } from "@unirlib/utils/Utils";
import i18next from "i18next";

import { getPlayerActionsComponent } from "./components/get-player-actions-components";
import { getPlayerDescActionsComponent } from "./components/get-player-desc-actions-components";
import { getPlayerPubliComponents } from "./components/get-player-publi-actions-components";
import {
  getPlayerChannelComponent,
  getPlayerInfoComponent,
  getPlayerStatusComponent,
} from "./components/player-components";
import { removePlayerFanart, showPlayerFanartMessage } from "./components/player-fanart-component";
import { PlayerActions } from "./player-actions";
import { PlayerDetailsController } from "./player-details-controller";
import * as PLAYER_REFS from "./player-refs";
import { PlayerScroller } from "./player-scroller";
import { callOnce, initializeTplNotAllowed, NO_FUNCTION } from "./player-utils";
import { PlayerViewActivator } from "./player-view-activator";
import { PlayerViewKeys } from "./player-view-keys";
import { playerViewLoader } from "./player-view-loader";
import { ShowController } from "./show-controller";

export class PlayerView extends PlayerViewKeys {
  constructor(wrap) {
    super(wrap);
    this.type = viewTypeNames.PLAYER_VIEW;
    this.opts = {
      /** @type {JQuery} */
      wrap,

      firstTime: true,
      timer_ucv: null,
      /**
       * @type {import("src/code/components/player/player-info/player-info").PlayerInfoComponent}
       */
      playerInfoComp: null,

      /**
       * @type {import("src/code/components/player/player-actions/player-actions").PlayerActionsComponent}
       */
      playerActionsComp: null,

      playerAudioSubComp: null,
      playerTrickModesComp: null,
      /**
       * @type {import("src/code/components/player/player-status/player-status").PlayerStatusComponent}
       */
      playerStatusComp: null,
      /**
       * @type {import("src/code/components/player/player-actions/player-actions").PlayerActionsComponent}
       */
      playerActionsDescComp: null,
      playerSlidersComp: null,
      /**
       * @type {import ("@newPath/components/bingewatching/bingewatching").StreamEventsComp|import ("@newPath/components/bingewatching/binge-recommendations").BingeWatchingRecommendations}
       */
      playerStreamEventsComp: null,
      /**
       * @type {import("@newPath/components/player/player-channels/player-channels").PlayerChannelsComponent}
       */
      playerChannelsComp: null,
      detailsModalComp: null,
      playerFanart: null,
      playerFanartMessage: null,
      timeoutHide: null,
      timeoutSugerenciasHide: null,
      pinTimeout: null,
      isStoping: false,
      isHiding: false,
      isShowingPlayerInfo: false,
      isPlayingChannel: false,
      hasTemporadas: false,
      hasRelacionados: false,
      /**
       * Vista de detalles
       * @type {DetailsView}
       */
      details: null,
      /** @type {JQuery|null} */
      detailsWrap: null,
      /**
       * Vista de detalles
       * @type {DetailsView}
       */
      detailsModal: null,
      detailsModalWrap: null,
      /**
       * Slider view de detalles
       * @type {DetailsView}
       */
      detailsSliders: null,
      detailsSlidersWrap: null,
      /**
       * Vista de detalles
       * @type {DetailsView}
       */
      detailsTemporal: null,
      epgMode: false,
      playerOneChannelWrap: null,
      numProgramsMiniguideEachside: 3, //Num. programas que se mostrarían por delante y por detrás del programa en curso, me sobreescribe con el CONTEXT
      itemProgramsMiniguideLeft: null,
      itemProgramsMiniguideRight: null,
      MIN_TIME_TO_LIVE: 30000,
      playerFlyer: null, // Flyer que muestra información de contenido remoto enviado (lanzar y ver)
      isPlayerFlyer: false, // Determina si se muestra el flyer
      m360ParamsPlayer: {}, //parámetros enviados por m360 como audio, subtitulo
      tpl: {
        notAllowed: String.raw`
          <div id="player-not-allowed" class="not-allowed">
            <div class="title">{{title}}</div>
            <div class="subtitle">{{subtitle}}</div>
          </div>`,
      },
      canUseDial: true,
      notAllowedElem: null,
      /** @type {EventBus} */
      eventBus: null,
      /**
       * Vista de slider de sugerencias de Live
       * @type {SliderView}
       */
      sliderSugerencias: null,
      sugerenciasClosedByTimer: false,
      /**
       * @type {import ("../../managers/bingewatching/index").BingeWatching|import ("../../managers/bingewatching/base-bingewatching").BaseBingeWatching|import ("../../managers/bingewatching/binge-recommendations").BingeRecommendation}
       */
      bingeWatchingMng: null,
      no_components: true,
    };

    this._GuiaTVonSide = "guiatv";
    this._U7DonSide = "u7d";

    this._datos_editoriales = null;
    this._catalog_item_type = "";
    this._asset = null;
    this._titulo = "";
    this._formato_video = null;
    this._urlThumbnails = "";

    this._freeContent = false;
    this._trailer = false;

    this._subtitulos = []; // Coleccion de subtitulos disponibles
    this._subtitulosUri = []; // Coleccion de subtitulos URI disponibles
    this._subtitulosTipo = []; // Coleccion de subtitulos Tipo disponibles
    this._subtitulos_play = null;

    this._idiomas = []; // Lista de idiomas disponibles

    this._isFromBegin = false;
    this._reproducir_desde_inicio = false;
    this._is_start_over = false;
    this._is_start_over_from_epg = false;
    this._show_go_live = false;
    this._isFirstEvent = false;
    this._stream_is_over = false;
    this._totalTime = 0;
    this._time = 0;
    this._showHour = true;
    this.playByTimer = false;

    this._skipback_done = false;
    this._skipback_ms = 0;
    this._ultimo_avance = 0;
    this._timerLaunchApp = null;
    this._mustShowAudioSubtitulos = false;

    /**
     * @type {import("@newPath/managers/seguimiento_mng").seguimiento_mng}
     */
    this._following_mng = null;

    this._is_changing_favorites = false;

    this._isBingeWatching = false;
    this._binge_watching_shown = false;

    this._binge_mng = null;
    this._binge_event = "";
    this._binge_events_done = null;

    /**
     * True si el {@link PlayerView} viene desde una calle de carruseles
     * @type {boolean}
     */
    this.desdeCalle = false;

    this._channel = null;
    /**
     * 0 si es vod y 1 si es live
     * @type {0 | 1}
     * @protected
     */
    this._mode = 0; // 0:vod, 1:live,
    /**
     * Se debe usar {@link PlayerView.getChannels}
     * @private
     */
    this._channels = null;
    this._channelsStack = [];
    this._channelsStackCircular = false;

    this._epg_channel = [];
    this._eventoEnCurso = -1;
    this._eventoId = -1;
    this._position = 0;

    this.copy = null;
    this.activeComponent = null;
    this.prevActiveComp = null;

    /** @type {EventBus} */
    this.opts.eventBus = new EventBus(this);

    this.isAllowed = true;

    this.globalContext = AppStore.wsData?.getContext() || {};

    /**
     * Especifica cuantos canales se van a colocar en el stack de canales
     */
    this.channelStackSize = 2;

    /** @private */
    this._showController = undefined;

    /** @private */
    this._playerScroller = undefined;
    this.isPlayerScrollerActive = false;

    /** @private */
    this._clearContentTimeoutListener = undefined;

    /** @private @type {PlayerDetailsController} */
    this._detailsController = new PlayerDetailsController(this);

    /** @private @type {PlayerActions} */
    this._playerActions = new PlayerActions(this);

    /** @private */
    this._activator = new PlayerViewActivator(this);

    //
    //  Suscripciones
    //
    /**
     * Funcion de limpieza
     * @private
     */
    this._clearOnPlayReadyEvent = PlayMng.instance.on("player_PlayerPlayReadyEvent", this._onPlayReadyEvent.bind(this));

    //
    //  Anotaciones de los eventos
    //
    this.verNext = callOnce(this.verNext.bind(this));

    // Intervalo de actualización del reloj del player, lo guardamos en la clase para limpiarlo cuando debamos.
    this.playerTimerInterval = null;
  }

  get mode() {
    return this._mode;
  }

  get isUnique() {
    // Le indica al view manager que sólo puede haber una vista del mismo
    // tipo a la vez
    return true;
  }

  get formatoVideo() {
    return this._formato_video;
  }

  /** @type {import ("../../managers/seguimiento_mng/index").seguimiento_mng} */
  get followingMng() {
    return this._following_mng;
  }

  get totalTime() {
    return this._totalTime;
  }

  get playerActions() {
    return this._playerActions;
  }

  get datosEditoriales() {
    return this._datos_editoriales;
  }

  /**
   * @type {boolean}
   */
  get showEpisodesPlayer() {
    const value = this.globalContext?.showepisodesplayer;
    if (value === undefined) {
      return true;
    }
    return `${value}` === "true";
  }

  /**
   * @type {ShowController}
   */
  get ShowController() {
    if (!this._showController) {
      this._showController = new ShowController(this, this.avoidShowControllerOnFirstFrame());
    }
    return this._showController;
  }

  avoidShowControllerOnFirstFrame() {
    return PlayMng.instance.opts?.playInfo?.isBingeWatching === true;
  }

  /**
   * @type {PlayerScroller}
   */
  get PlayerScroller() {
    if (!this._playerScroller) {
      this._playerScroller = new PlayerScroller(this);
    }
    return this._playerScroller;
  }

  /**
   * Devuelve true si el origen del player es la epg
   */
  get originIsEpg() {
    if (typeof this.origin === "string") {
      return this.origin?.toLowerCase() === "EpgScene".toLowerCase();
    }
    return this.origin?.type === viewTypeNames.EPG_VIEW;
  }

  /**
   * @type {JQuery}
   */
  get optsWrap() {
    return this.opts.wrap;
  }

  async reloadView() {
    await playerViewLoader(this);
  }

  /**
   * True si el MODO es LIVE
   * @type {boolean}
   */
  get isLive() {
    return this._mode === MODO.LIVE;
  }

  /**
   * True si el MODO es VOD
   * @type {boolean}
   */
  get isVod() {
    return this._mode === MODO.VOD;
  }

  /**
   * @type {Number}
   */
  get time() {
    return this._time;
  }

  get mustShowAudioSubtitulos() {
    return this._mustShowAudioSubtitulos;
  }

  set mustShowAudioSubtitulos(value) {
    this._mustShowAudioSubtitulos = value;
  }

  showAudioSubtitulosWithDelay() {
    setTimeout(() => {
      this._mustShowAudioSubtitulos = false;
      this.opts.playerStatusComp.hide();
      this.goGreen();
    }, 600);
  }

  /**
   * Establece el listener para el evento de timeout
   * se debe llamar _**SÓLO** si el player view **NO** está
   * en background_.
   *
   * Su caso de uso es para **LIVE** y **VOD**
   */
  setTimeoutListener() {
    if (this.isCurrentChannelApplication()) return;
    this._clearContentTimeoutListener = PlayMng.instance.on("player_contentTimeout", this._onContentTimeout.bind(this));
  }

  /**
   *  limpia el listener del timeout si ha sido definido
   */
  clearTimeoutListener() {
    if (this._clearContentTimeoutListener) {
      this._clearContentTimeoutListener();
    }
  }
  async setTimeoutLaunchApp() {
    const timerLanzamientoMod = parseInt(AppStore.wsData._timer_lanzamiento_mod, 10);
    const currentProgram = this.getCurrentProgram();
    const channel = currentProgram._Canal;
    const epInfo = await MitoAPI.instance.getAppInfo(channel._appId);
    this._timerLaunchApp = window.setTimeout(() => {
      if (ViewMng.instance.isPlayerActive()) {
        if (channel._catalogType === "external") {
          let pdevid = " ";
          if (channel._appId === "netflix") {
            pdevid = epInfo.deviceId;
          }
          AppStore.tfnAnalytics.audience_navigation(
            "ExternalPartner",
            "launch_partner_app",
            {
              pg: "TvChannels",
              mne: "TvChannels",
              chid: channel.channelId,
              epartner: channel._appId,
              launch: "automatic",
              pdevid,
            },
            channel
          );
        }
        this.launchCurrentAppChannel();
      }
    }, timerLanzamientoMod);
  }

  clearTimeoutLaunchApp() {
    if (this._timerLaunchApp) {
      window.clearTimeout(this._timerLaunchApp);
      this._timerLaunchApp = null;
    }
  }

  setMode(value) {
    this._mode = value;
  }

  async init() {
    let details_channel;
    if (!this.globalContext) this.globalContext = AppStore.wsData.getContext();
    this.opts.numProgramsMiniguideEachside = this.globalContext.numProgramsMiniguideEachside
      ? parseInt(this.globalContext.numProgramsMiniguideEachside)
      : this.opts.numProgramsMiniguideEachside;
    this.opts.itemProgramsMiniguideLeft = this.globalContext.itemProgramsMiniguideLeft
      ? this.globalContext.itemProgramsMiniguideLeft
      : this.opts.itemProgramsMiniguideLeft;
    this.opts.itemProgramsMiniguideRight = this.globalContext.itemProgramsMiniguideRight
      ? this.globalContext.itemProgramsMiniguideRight
      : this.opts.itemProgramsMiniguideRight;

    // Inicialización de los textos de la capa de contenido no permitido por control parental
    this.opts.tpl.notAllowed = initializeTplNotAllowed(this.opts.tpl.notAllowed);

    this.opts.isPlayingChannel = this.isPlayingChannel();
    PlayMng.player.init(this._mode);
    AppStore.yPlayerCommon.setMode(this._mode);
    if (this.isVod) {
      PlayMng.instance.epgMode = false;
      this.startPlaying();
      this.loadChannelLogoVOD();
    } else {
      this.loadChannels();

      const currentProgram = this.getCurrentProgram();
      this._eventoId = currentProgram.ContentId;
      if (AppStore.appStaticInfo.getTVModelName() === "iptv2") {
        this.set_datos_editoriales(currentProgram);
        this.startPlaying();
      }
      // Llamada asíncrona a "details", en "iptv2" ya NO hacemos el startPlaying
      details_channel = await this._detailsController.loadDetails().catch(() => undefined);
      const activeView = ViewMng.instance.active;
      const _isHome = activeView.opts?.isHome;
      if (details_channel && activeView && AppStore.yPlayerCommon.isAutoplay()) {
        AppStore.tfnAnalytics.audience_navigation(
          "autoPlay",
          activeView.opts?.isHome ? "launch_channel-02" : "launch_channel-01",
          { pg: activeView?.opts?.title, isHome: _isHome },
          details_channel
        );
      }
      if (AppStore.appStaticInfo.getTVModelName() !== "iptv2") {
        this.startPlaying();
      }
    }
    if (!AppStore.yPlayerCommon.isAutoplay()) {
      this.opts.wrap.addClass("active");
      this.setGradient("gradient");
    }
    // seteamos si está en mute al iniciar el vídeo para mostrar el icono
    if (AppStore.VolumeMng.volume.isMuted) AppStore.VolumeMng.showMuteIcon();
    return details_channel;
  }

  // Creamos copia del contenido actual del canal por si luego no cargamos el siguiente
  createCopy() {
    this.copy = {
      _channel: JSON.parse(JSON.stringify(this._channel)),
      _epg_channel: JSON.parse(JSON.stringify(this._epg_channel)),
      _datos_editoriales: JSON.parse(JSON.stringify(this._datos_editoriales)),
      _eventoEnCurso: this._eventoEnCurso,
      _eventoId: this._eventoId,
    };
  }

  async restoreCopy() {
    if (this.copy) {
      this.opts.playerInfoComp.opts.elems["content_info"].css("opacity", 0);
      const channel = JSON.parse(JSON.stringify(this.copy._channel));
      const epg_channel = JSON.parse(JSON.stringify(this.copy._epg_channel));

      const new_epg_channel = [];
      this._channel = assembleChannel(channel);
      if (AppStore.appStaticInfo.getTVModelName() === "iptv2") {
        for (let i = 0; i < epg_channel.length; i++) {
          let program;
          if (this._channel.isApplication()) {
            program = new programEpgApplication(epg_channel[i]);
            if (this._channel) {
              program.setCanal(this._channel);
            }
          } else {
            program = new programEpgDvbipi(epg_channel[i]);
          }
          new_epg_channel.push(program);
        }
      } else {
        for (let i = 0; i < epg_channel.length; i++) {
          const program = new programEpgHttp(epg_channel[i]);
          new_epg_channel.push(program);
        }
      }

      this._epg_channel = new_epg_channel;
      this._eventoEnCurso = this.copy._eventoEnCurso;
      this._eventoId = -1; // Para forzar el refresh

      await this.loadEpg(this._channel);

      if (this.opts.playerChannelsComp) {
        this.opts.playerChannelsComp.setInitial();
      }

      this.copy = null;
    }
  }

  // Acción cuando hacemos onover en un canal
  async onOverChannel(channel) {
    this.opts.isOnOverChannel = channel.getChannelId();
    this.createCopy();
    await this.loadEpg(channel).catch(() => undefined);
    if (this.opts.isOnOverChannel === channel.getChannelId()) {
      this.opts.playerInfoComp.opts.elems["content_desc"].css("opacity", 1);
      this.opts.isOnOverChannel = false;
    }
  }

  // Acción cuando hacemos click en un canal
  async onClickChannel(channel, playerParams) {
    const stackChannel = playerParams?.stackChannel && true;
    const showMiniguia = playerParams?.showMiniguia || false;
    const linkedDevice = playerParams?.linkedDevice || false;

    let preferredAudio, preferredSubtitle;
    if (linkedDevice) {
      const currentAudio = AppStore.yPlayerCommon.getCurrentAudio();
      const currentSubtitle = AppStore.yPlayerCommon.getCurrentSubtitle();
      preferredAudio = playerParams?.preferredAudio;
      preferredSubtitle = playerParams?.preferredSubtitle;
      const desdeInicio = playerParams?.desdeInicio || false;
      this.opts.m360ParamsPlayer.linkedDevice = true;
      if (preferredAudio && preferredAudio !== currentAudio) this.opts.m360ParamsPlayer.audio = preferredAudio;
      if (preferredSubtitle && preferredSubtitle !== currentSubtitle)
        this.opts.m360ParamsPlayer.subtitle = preferredSubtitle;
      PlayMng.instance.opts.playInfo = PlayMng.instance.getPlayInfoLive(preferredAudio, preferredSubtitle, desdeInicio);
      AppStore.M360Mng.isPlayerFlyer = true;
    } else {
      const audioSubtitle = PlayMng.instance.getDefaultAudioAndSubtitle(channel, preferredAudio, preferredSubtitle);
      PlayMng.instance.opts.playInfo = PlayMng.instance.getPlayInfoLive(audioSubtitle.audio, audioSubtitle.subtitle);
    }
    if (stackChannel) {
      //
      // Dejar solo los channelStackSize elementos en el stack. esto garantiza
      // que solo se navegaran entre los ultimos channelStackSize canales
      // se le resta 1 al total de elementos en el stack porque el
      // primer elemento del stack esta en la variable this.channel
      //
      if (this._channelsStack.length >= this.channelStackSize - 1) {
        this._channelsStack.shift();
      }
      this._channelsStack.push(this._channel);
    }
    this.setChannel(channel);
    await PipMng.instance.checkPip(this._channel);

    this.loadEpg(channel)
      .catch(async (_error) => {
        console.error("error load epg", _error);
      })
      .finally(async () => {
        PlayMng.instance.backgroundChannel = channel;
        PlayMng.instance.lastChannelPlay = channel;
        await PlayMng.instance.playChangeStream(true);
        this.opts?.playerStreamEventsComp?.removeButton();
        this.removePlayerComponents();
        this.destroyPlayerComponents();
        this.startPlaying();
        if (this.isCurrentChannelApplication() && this.opts?.playerStreamEventsComp) {
          this.opts.playerStreamEventsComp.hide();
        }
        showMiniguia ? PlayMng.instance.playerView.show() : PlayMng.instance.playerView.hide();
      });
  }

  // Volvemos de la epg con cambio de canal
  async backAndRefresh(channel, isDiffChannelPlay) {
    const self = this;
    this.hide(true);

    if (isDiffChannelPlay) {
      const qualityAvailable = channel.getMaxQualityAvailable();
      PlayMng.instance.playChangeStream();
      AppStore.yPlayerCommon.playTS(1, qualityAvailable.urlTS, channel.CasId, channel.FormatoVideo, 0);
    }

    this.setChannel(channel);
    if (this.opts.playerChannelsComp) {
      this.opts.playerChannelsComp.setChannel(channel.CodCadenaTv);
    }
    try {
      await this.loadEpg(channel);
      self.show();
    } finally {
      this.update();
    }
  }

  // Refresco de la info que se muestra en el player live
  async loadEpg(channel = null) {
    this.loadChannelEpg(channel);
    if (channel.isApplication()) {
      await this._detailsController.loadDetails();
      this.update();
      return;
    }
    this._eventoId = this.getCurrentProgram()?.ContentId;
    if (!AppStore.SettingsMng.getIsPaginasLocales() && !DialMng.instance.isActive() && !unirlib.isEmergencyMode()) {
      try {
        if (!this.isHiddenMode()) LoaderMng.instance.show_loader();
        await this._detailsController.loadDetails();
      } finally {
        if (!this.isHiddenMode()) LoaderMng.instance.hide_loader();
        this.update();
      }
    }
  }

  async update() {
    if (this.opts.playerInfoComp) {
      this.opts.playerInfoComp.update();
    }
    if (this.opts.isOnOverChannel === false || this.opts.isOnOverChannel == undefined) {
      await this.parentalCheck();
    }
    this.refreshRecordings();
  }

  async destroy() {
    this.clearTimeoutLaunchApp();
    this.clearTimeoutListener();
    this.opts.wrap?.remove();
    this.clearShowController();
    this._clearOnPlayReadyEvent();
    removePlayerFanart(this);
    return super.destroy();
  }

  clearShowController() {
    this.ShowController.cleanUp();
    this._showController = undefined;
  }

  async reset() {
    this.resetComponents();
  }

  empty() {
    this.opts.wrap?.empty();
    this.resetComponents();
    removePlayerFanart(this);
  }

  resetComponents() {
    this.opts.firstTime = true;
    this.opts.playerInfoComp = null;
    this.opts.playerActionsComp = null;
    this.opts.isPlayingChannel = false;
  }

  reloadPlayerWrap(itMustCreateComponents = true) {
    this.removePlayerComponents();
    this.destroyPlayerComponents();
    if (itMustCreateComponents) {
      this.createComponents();
    }
  }

  prevCompAfterPinModal(updateActiveComp = true) {
    if (ViewMng.instance?.lastView?.type === "pin" && !AppStore.yPlayerCommon.backgroundMode()) {
      ViewMng.instance.close(ViewMng.instance.lastView);
    }

    this.opts.canUseDial = true;
    if (updateActiveComp) this.activeComponent = this.prevActiveComp;
  }

  canSkipForwardOrRewind() {
    const isPlaying =
      AppStore.yPlayerCommon.isPlaying() || // Si no ha empezado a reproducir no continuamos
      AppStore.yPlayerCommon.isPaused() ||
      AppStore.yPlayerCommon.isSkipping();

    // Si aún no ha cambiado el stream no continuamos
    let canSkip = isPlaying && this.parentalAllowed() && PlayMng.player._stateAfterPlay === -1;

    if (canSkip && this._mode === 1) canSkip = AppStore.profile.user_has_startoverplus();
    //TODO una vez verificado su lógica, podríamos quitar este "debug.alert"
    if (!AppStore.profile.user_has_startoverplus()) {
      debug.alert("Está desactivado el 'start-over-plus'");
    }

    return canSkip;
  }

  executeFastForwardOrRewind(methodName) {
    if (!this.canSkipForwardOrRewind()) return;
    this.show();
    this.removeGoLiveButton();
    const analiticsKeyMap = {
      forward: "FWD",
      rewind: "RWD",
    };
    if (AppStore.yPlayerCommon.isVideoPlaza && methodName === "forward") {
      return;
    }

    if (
      this.activeComponent !== this.opts.playerSlidersComp &&
      !(this.activeComponent === this.opts.playerTrickModesComp && this.opts.playerTrickModesComp.isThumbnailsMode)
    ) {
      if (AppStore.appStaticInfo.getTVModelName() !== "iptv2") {
        //auditar???
        AppStore.tfnAnalytics.eventPlayer(analiticsKeyMap[`${methodName}`]);
      }
      this[`${methodName}`]();
    }
  }

  showNotAllowed() {
    ControlParentalMng.instance.showNotAllowed();
    this.opts.playerInfoComp?.setNotAllowed();
    this.opts.playerActionsComp?.setNotAllowed();
  }

  hideNotAllowed() {
    ControlParentalMng.instance.hideNotAllowed();
    this.opts.playerInfoComp?.setAllowed();
    this.opts.playerActionsComp?.setAllowed();
  }

  // async goPreviousScreen() {
  //   this.hideNotAllowed();
  //   if (AppStore.yPlayerCommon.isLive() && !AppStore.yPlayerCommon.isDiferido()) {
  //     await PlayMng.instance.setBackgroundMode(true);
  //   }
  //   await this._doPrevious();
  // }

  manageRelacionadosEpisodio() {
    if (!PlayMng.instance.directPlayMode && PlayMng.instance.opts.relacionados?.data) {
      this.opts.hasRelacionados = true;
    } else if (PlayMng.instance.directPlayMode) {
      this.opts.hasRelacionados = PlayMng.instance.opts.detailHasRelacionados;
    }
  }

  /**
   * Informa si la interfaz del player debe estar oculta,
   * se usa para saber si el player está en modo background o en modo epg
   * @returns {Boolean} true si la interfaz del player debe estar oculta
   */
  isHiddenMode() {
    return AppStore.yPlayerCommon.backgroundMode() || PlayMng.instance.epgMode;
  }

  async createComponents() {
    const isLive = this._mode === MODO.LIVE;
    this.opts.hasRelacionados = false;
    // Si ya hay componentes o es background/epg salir
    if (this.opts.playerInfoComp || this.isHiddenMode()) {
      return;
    }

    if (AppStore.yPlayerCommon.isVideoPlaza || AppStore.yPlayerCommon._is_promo) {
      AppStore.yPlayerCommon.isVideoPlaza = true;
      return getPlayerPubliComponents(this);
    }

    if (isLive) {
      this.opts.hasRelacionados = true;
    } else if (this._datos_editoriales?.TipoContenido == "Episodio") {
      this.opts.hasTemporadas = true;
      this.manageRelacionadosEpisodio();
    } else {
      this.opts.hasRelacionados = this.hasRelacionados();
    }

    if (isLive) {
      this.opts.wrap?.addClass("live");
      this.opts.wrap?.removeClass("vod");
    } else {
      this.opts.wrap?.addClass("vod");
      this.opts.wrap?.removeClass("live");
    }

    this.getComponents(isLive);

    // Lista de canales
    if (isLive) {
      this._addChannelComponent();
    } else {
      this.loadChannelLogoVOD();
    }

    if (this.opts.playerStreamEventsComp && this.opts.playerActionsComp) {
      this.opts.playerActionsComp.right = this.opts.playerStreamEventsComp;
    }

    this.activeComponent = this.opts.playerInfoComp;
    if (this.opts.playerTrickModesComp && this.opts.playerStreamEventsComp) {
      if (this.opts.playerStreamEventsComp.typeButton() === "goLive") {
        this.activeComponent.down = this.opts.playerStreamEventsComp;
        this.opts.playerStreamEventsComp.up = this.activeComponent;
      }
    }
    // Comprobamos si tenemos disponible el trick mode

    if (DialMng.instance.isActive()) {
      DialMng.instance.startHide();
    } else {
      // En proceso de lineup no mostramos el player
      if (!StartMng.instance.isDoingLineup) {
        this.show();
      } else {
        StartMng.instance.isDoingLineup = false;
      }
    }
    this.opts.no_components = false;

    ///
    /// Inicializamos el manager de Binge Watching cuando se han creado todos los componentes
    ///
    if (!this.opts.bingeWatchingMng) {
      this.opts.bingeWatchingMng = await AppStore.bingeWatching?.init(
        this,
        this._asset,
        this._datos_editoriales?.BingeWatchingAction
      );
      this.opts.eventBus.emit(PLAYER_REFS.EVENTOS.PLAY);
    }
  }

  getComponents(isLive) {
    const isAppChannel = this.isCurrentChannelApplication();

    // Creación de componentes
    getPlayerInfoComponent(this);
    getPlayerDescActionsComponent(this);

    if (!isAppChannel) {
      getPlayerActionsComponent(this, isLive);
      getPlayerStatusComponent(this);
      //getPlayerStreamEventsComponent(this);
    }

    if (isLive) this.createTimerComponent();

    // Añadimos componentes a playerview
    this.addComponent(this.opts.playerInfoComp);
    this.addComponent(this.opts.playerActionsDescComp);

    if (!isAppChannel) {
      this.addComponent(this.opts.playerActionsComp);
      this.addComponent(this.opts.playerStatusComp);
      //this.addComponent(this.opts.playerStreamEventsComp);
    }
    this.opts.playerInfoComp.down = this.opts.playerActionsComp;

    if (!isAppChannel) {
      this.opts.playerActionsComp.up = this.opts.playerInfoComp;
      this.opts.playerActionsDescComp.down = this.opts.playerInfoComp;
    }
  }

  /**
   * devuelve true si la vista __NO__ esta transparente
   * @returns {Boolean}
   */
  get isShowing() {
    if (!this.opts.wrap) return false;
    const currentOpacity = this.opts.wrap.css("opacity");
    return currentOpacity === "1" && !this.isHiding();
  }

  get isPipMenu() {
    return this.opts.playerInfoComp?.isPipMenu;
  }

  get isStoping() {
    return this.opts.isStoping;
  }

  set isStoping(value) {
    this.opts.isStoping = value;
  }

  isCurrentSOLiveContentFinished() {
    const currentProgram = this.getCurrentProgram();
    const ahora = AppStore.appStaticInfo.getServerTime();
    const hora_actual = ahora.getTime();
    return hora_actual > currentProgram.FechaHoraFin && AppStore.yPlayerCommon.isDiferido();
  }

  showInfo() {
    if (!this?.opts?.playerInfoComp) this.createComponents();
    this.opts.playerInfoComp.show();
    this.opts.playerInfoComp.showArrow();
    this.opts.playerActionsComp.show();
    //this.opts.playerStreamEventsComp.show();
    this.activeComponent = this.opts.playerInfoComp;
  }

  hideInfo() {
    if (this.opts.playerInfoComp) {
      this.opts.playerInfoComp.hide();
      this.opts.playerInfoComp.hideArrow();
      this.opts.playerInfoComp.hideProgress();
      this.activeComponent = this.opts.playerInfoComp;
    }
  }

  playpause() {
    this.opts.eventBus.emit(PLAYER_REFS.EVENTOS.STOP_FF_RWD);
    if (!this.opts.playerInfoComp || !this.parentalAllowed()) return;
    if (this.activeComponent === this.opts.playerAudioSubComp) {
      this.hideAudioSubtitulos();
    } else if (this.opts.playerInfoComp && this.isPipMenu) {
      this.opts.playerInfoComp.hidePip();
      this.show(false, "pip");
    } else if (this.activeComponent === this.opts.playerTrickModesComp) {
      this.activeComponent = this.opts.playerInfoComp;
    } else if (this.activeComponent === this.opts.playerSlidersComp) {
      this.hideDetailsSliders();
    }
    let evento = this.opts.playerInfoComp.getProgramActive();
    if (!evento) evento = this.getCurrentProgram();
    if (this._mode === 1 && !evento?.hasStartOver?.enabled) return;
    const skipState = AppStore.yPlayerCommon.getSkipState();
    if (skipState == AppStore.yPlayerCommon.REWIND || skipState == AppStore.yPlayerCommon.FORWARD) {
      this.setScreenStatus("none");
      this.resume();
      this.hideInfo();
      if (KeyMng.instance.lastKeyCode !== ykeys.VK_GREEN && KeyMng.instance.lastKeyCode !== ykeys.VK_SUBS) {
        this.opts.wrap.css("opacity", 0);
        this.opts.wrap.css("display", "none");
      }
    } else if (!unirlib.isEmergencyMode()) {
      if (AppStore.yPlayerCommon.isPaused()) {
        this.setScreenStatus("play");
        this.resume();
        if (AppStore.yPlayerCommon.isVideoPlaza) adTrack.AD_RESUME();
      } else {
        this.setScreenStatus("pause");
        this.pause();
        if (AppStore.yPlayerCommon.isVideoPlaza) adTrack.AD_PAUSE();
      }
    }
  }

  getResumeAt(link) {
    const indexTimes = link.length - 41;
    // const baseUrl = link.substring(0, indexTimes);
    const startTime = link.substring(indexTimes, indexTimes + 20);

    const startDate = new Date(startTime);
    const time2live = AppStore.yPlayerCommon.getTime2Live();
    const nowDate = new Date();
    const dif = (nowDate.getTime() - time2live - startDate.getTime()) / 1000;

    return dif;
  }

  getPuntoDiferido(startTime) {
    const startDate = new Date(startTime);
    const time2live = AppStore.yPlayerCommon.getTime2Live();
    const nowDate = new Date();
    const dif = nowDate.getTime() - time2live - startDate.getTime();
    return dif;
  }

  pause() {
    const skipState = AppStore.yPlayerCommon.getSkipState();
    if (
      !AppStore.yPlayerCommon.isPaused() &&
      skipState != AppStore.yPlayerCommon.REWIND &&
      skipState != AppStore.yPlayerCommon.FORWARD
    ) {
      PlayMng.player.pause();
      if (AppStore.yPlayerCommon.isVideoPlaza) adTrack.AD_PAUSE();
      if (AppStore.yPlayerCommon.isLive() && !AppStore.yPlayerCommon.isDiferido()) {
        const evento = this.getCurrentProgram();
        const ahora = AppStore.appStaticInfo.getServerTime();
        const hora_actual = ahora.getTime();
        const timeBookmark = parseInt(hora_actual) - parseInt(evento.FechaHoraInicio);
        this.savePuntoReproduccion(timeBookmark);
      } else {
        this.savePuntoReproduccion(this._time);
      }
      this.opts.playerStatusComp.setScreenStatus("pause");
    }
  }

  resume() {
    const skipState = AppStore.yPlayerCommon.getSkipState();
    const isRewind = skipState === AppStore.yPlayerCommon.REWIND;
    const isForward = skipState === AppStore.yPlayerCommon.FORWARD;

    if (AppStore.yPlayerCommon.isPaused() || isRewind || isForward) {
      PlayMng.player.resume();
      if (AppStore.yPlayerCommon.isVideoPlaza) adTrack.AD_RESUME();
      if (isRewind || isForward) {
        const trickMode = isForward ? "FF" : "RW";
        AppStore.yPlayerCommon.resetSkipState();
        this._playerActions.cancelAll();
        this.playSubtitles(trickMode);
        if (this.isVod) {
          AppStore.yPlayerCommon.resetTime2Live();
          AppStore.yPlayerCommon._position = this._time;
          if (!AppStore.yPlayerCommon.isVideoPlaza && isRewind) AdsMng.instance.setMidrolls();
          this.showChannelLogoVOD();
        }
      } else {
        //const pos = this._time;
        // AppStore.tfnAnalytics.player("play", { evt: 2, pos });
        this.opts.playerStatusComp.setScreenStatus("play");
      }
    }
  }

  /**
   *
   * @param {string} status
   */
  setScreenStatus(status, parameters = null) {
    console.warn("**** setScreenStatus", status, parameters);
    const skipState = AppStore.yPlayerCommon.getSkipState();
    // Stop wrap hiding animations
    this.opts.wrap.stop();
    if (!this.isShowing && this.opts.playerInfoComp) {
      // Show status only
      this.opts.playerInfoComp.hide();
      this.opts.playerInfoComp.hideArrow();
      if (status.includes("ffx") || status.includes("rwx")) {
        this.opts.playerInfoComp.showProgress();
      } else {
        this.opts.playerInfoComp.hideProgress();
      }
      if (this.opts.playerActionsComp && skipState !== AppStore.yPlayerCommon.REWIND) {
        this.opts.playerActionsComp.hide();
      }
      this.removeBingeWatching();
      this.opts.wrap.css("display", "block");
      this.opts.wrap.css("opacity", 1);
    }
    this.opts.playerStatusComp?.setScreenStatus(status, parameters);

    if (status.includes("play")) {
      this.opts.playerInfoComp?.show();
      this.opts.playerActionsComp?.show();
    }

    this.restartTimeoutHide();
  }

  createTrickModes() {
    const playerTrickModesWrap = jQuery(String.raw`
      <div id="player-trick-modes-comp" class="player-trick-modes-comp"></div>
    `).appendTo(this.opts.wrap);
    this.opts.playerTrickModesComp = new PlayerTrickModesComponent(playerTrickModesWrap);
    this.opts.playerTrickModesComp.init(this);
    this.addComponent(this.opts.playerTrickModesComp);
  }

  rewind() {
    this._playerActions.rewind.execute();
    if (AppStore.yPlayerCommon.isVideoPlaza) adTrack.AD_REWIND();
  }

  forward() {
    this._playerActions.forward.execute();
  }

  hasThumbs() {
    return this._asset && this._asset.Thumbnails;
  }

  getAsset() {
    return this._asset;
  }

  showThumbs() {
    if (this._mode === 1 || !this.hasThumbs() || AppStore.yPlayerCommon.isVideoPlaza) return;

    this.opts.playerInfoComp.showProgress();
    this.opts.playerInfoComp.hide();
    this.opts.playerInfoComp.hideArrow();
    if (this.opts.playerActionsComp) {
      this.opts.playerActionsComp.hide();
    }
    if (!this.opts.playerTrickModesComp) {
      this.createTrickModes();
    }
    this.opts.wrap.css("display", "block");
    this.opts.wrap.css("opacity", 1);

    this.opts.playerTrickModesComp.isThumbnailsMode = true;
    this.activeComponent = this.opts.playerTrickModesComp;
    const currentTime = AppStore.yPlayerCommon.getScene().getTime();
    this.opts.playerTrickModesComp.startThumbs(this._totalTime, currentTime);
  }

  /**
   * @param {import("./player-scroller").PlayerScrollDirection} direction
   */
  move(direction) {
    this.isPlayerScrollerActive = true;
    this.PlayerScroller.move(direction);
  }

  playSubtitles(trickMode) {
    // trickMode FF o RW
    if (this._subtitulos_play > 0) {
      Tratasrt.trickMode(trickMode);
      setTimeout(() => {
        Tratasrt.playSubtitles();
      }, 2000);
    }
  }

  async stop(endStream = false, isAdvertisement = false, isGoBack = false) {
    this.isErrorShowing = false;
    AppStore.PinMng.enabled = true;
    DialMng.instance.hide();
    AppStore.yPlayerCommon.hideSpin();
    WatermarkMng.instance.stop();
    PlayMng.instance.resetDirectPlayMode();
    if (AppStore.yPlayerCommon.isVideoPlaza || AppStore.yPlayerCommon._is_promo) {
      adTrack.AD_CLOSE();
      AppStore.yPlayerCommon._is_promo = false;
      AppStore.yPlayerCommon.isVideoPlaza = false;
    }

    if (this._mode === 1 && AppStore.appStaticInfo.getTVModelName() === "iptv2") {
      PipMng.instance.hidePipChannel();
      await PipMng.instance.stopPip();
    }

    this._stream_is_over = endStream;
    if (AppStore.yPlayerCommon.isDiferido() && AppStore.yPlayerCommon.isLive()) {
      // SO y SO+
      this.savePuntoReproduccion(this._time);
      if (StartMng.instance.isInStandByMode) {
        await this.stopAndLeave();
      } else if (!isGoBack) {
        this.goLive();
      }
    } else {
      await this.stopAndLeave();
      if (isGoBack) {
        return;
      }
      // Si NO es publicidad hacer un
      // pantalla previa (BACK)
      if (!isAdvertisement) {
        this.hide(true);
        if (AutoplayMng.instance.isAutoplayPromo()) {
          AutoplayMng.instance.clearAutoplayPromo();
          BackgroundMng.instance.show_full_background();
        } else {
          await this.goBack();
        }
      }
    }
  }

  async stopAndLeave() {
    if (this.opts.timer_ucv) {
      clearTimeout(this.opts.timer_ucv);
    }
    if (this.opts.isStoping) return;
    this.opts.isStoping = true;
    // Abortamos peticiones http pendientes
    AppStore.playReady.abortHttp();

    // Guardamos el punto de reproducción si es necesario
    this.savePuntoReproduccion(this._time);
    if (this._datos_editoriales?.TipoContenido == "Episodio") {
      this.reload_seguimiento();
    }
    if (this._subtitulos_play > 0) Tratasrt.stopSubtitles();

    this._time = 0;
    this._totalTime = 0;

    if (this.origin != "EpgScene" && !AppStore.yPlayerCommon.isLive() && !this.es_u7d()) {
      if (!this._freeContent && !this._trailer) {
        AppStore.yPlayerCommon.stop(false);
      } else {
        await AppStore.yPlayerCommon.exec_stop();
      }
    } else if (this.es_u7d() && !AppStore.yPlayerCommon.isVideoPlaza) {
      // Restauramos canal previamente sintonizado/enfocado en lugar de depender del timer
      // del canal en background, será más rápido, y este se encargará de hacer el stop del u7d.
      await this.restoreLiveChannel();
    }
    this.opts.isStoping = false;
    this.activeComponent = this.opts.playerInfoComp;
  }

  async restoreLiveChannel() {
    const epgView = ViewMng.instance.viewType("epg");
    this._channel = epgView?.getCurrentChannel() || PlayMng.instance.lastChannelPlay;
    const playConfig = {
      channel: this._channel,
      autoplay: false,
      origin: "HomeScene",
      desdeInicio: false,
      backgroundMode: KeyMng.instance.lastKeyCode !== ykeys.VK_KEYBOARD,
    };
    await PlayMng.instance.playChannel(playConfig);
  }

  async seekStreamEvent(/** @type {import("../binge-watching/binge-constants").StreamEvent} */ actualEvent) {
    const position = actualEvent.endTime <= this._totalTime ? actualEvent.endTime : this._totalTime - 1;
    await PlayMng.player.seek(position);
  }

  async runCommand(command) {
    const self = this;
    const channel = this.getCurrentChannel();
    const evento = this.opts.playerInfoComp.getProgramActive();
    switch (command) {
      case "ver_inicio":
        AppStore.yPlayerCommon._position = 0;
        await this.verInicio();
        break;
      case "ver":
      case "continuar":
        //
        //  Especificarle al player que debe ir al live despues
        //  del start over
        //
        AppStore.yPlayerCommon.itMustGoLive = true;
        await this.verInicio(evento);
        break;
      case "audios_subtitulos":
        this.showAudioSubtitulos();
        break;
      case "similares":
        this.showDetailsSliders("similares");
        break;
      case "sugerencias":
        this.loadSugerencias();
        break;
      case "episodios":
        this.showDetailsSliders("episodios");
        break;
      case "add_favoritos":
        if (!this.hasDetailsDataRight() && this._mode === 1) {
          debug.alert(`No disponemos de los datos_editoriales de BackEnd 'details' para ejecutar la acción ${command}`);
          break;
        }
        if (this._is_changing_favorites) break;
        this.add_favorito();
        break;
      case "del_favoritos":
        if (!this.hasDetailsDataRight() && this._mode === 1) {
          debug.alert(`No disponemos de los datos_editoriales de BackEnd 'details' para ejecutar la acción ${command}`);
          break;
        }
        if (this._is_changing_favorites) break;
        this.delete_favorito();
        break;
      case "stream_event":
        if (this.opts.playerStreamEventsComp) {
          if (this._binge_event.category == "extra") {
            this._binge_events_done[this._binge_event.id] = true;
            const position =
              this._binge_event.endTime <= this._totalTime ? this._binge_event.endTime : this._totalTime - 1;
            PlayMng.player.seek(position);
            const step = this._binge_event.endTime - this._time;
            const productID = this.get_content_id();
            const contentID = this._datos_editoriales.Id;
            AppStore.tfnAnalytics.playout_event(productID, contentID, this._time, step, this._binge_event.id);
          }
        }
        break;
      case "binge_event":
        this.verNext();
        break;
      case "grabar":
        this.start_grabacion();
        break;
      case "dejardegrabar":
        this.start_dejardegrabar();
        break;
      case "u7d":
        await this.showU7d();
        break;
      case "epg":
        this.showEpg();
        break;
      case "more":
        this.opts.playerInfoComp.opts.isMore = true;
        if (this.opts.playerChannelsComp) {
          await this.opts.playerChannelsComp.hideExpanded();
        }
        if (this.opts.detailsTemporal?.get_id() === evento?.ContentId) {
          self.opts.playerInfoComp.showMore();
        } else {
          this._detailsController
            .loadDetailsTemporal(evento)
            .then(() => {
              self.opts.playerInfoComp.showMore();
            })
            .catch(() => {});
        }
        break;
      case "go_live":
        this.goLive();
        break;
      case "ficha":
        this.showFicha();
        break;
      case "pip":
        if (!this.opts.pinTimeout) this.showPipMenu();
        break;
      case "pip_quitar":
        if (!this.isPipMenu) {
          this.showPipMenu();
          return;
        }
        await this.hidePip();
        this.opts.playerInfoComp.goBack();
        if (!PipMng.instance.hasChannelPip(channel)) {
          // Si canal actual no tiene pip, al cerrar el pip anterior, quitamos las opciones de pip recargando el wrap
          await this.reloadPlayerWrap();
        }
        this.updatePipButton();
        break;
      case "pip_derecha":
        this.setPip("right");
        break;
      case "pip_izquierda":
        this.setPip("left");
        break;
      case "pip_switch_izquierda":
      case "pip_switch_derecha":
        // Check si version PiP en el canal actual
        if (!PipMng.instance.hasChannelPip(channel)) {
          // Si el canal actual no tiene PiP, mostramos popup, ponemos el canal del PiP como principal y cerramos PiP
          await ModalMng.instance.showPopup("no_version_pip");
        } else {
          await this.interchangePipChannel();
        }
        break;
      case "siguiente_episodio":
        await self.verNext();
        break;
    }
  }

  /**
   * Prepara la vista del player para mostrar algún slider
   * @param {String} sliderType tipo de slider a mostrar
   */
  preparePlayerForSlider(sliderType) {
    this.stopTimeoutHide();
    this.opts.playerInfoComp.hide();
    this.opts.playerInfoComp.hideArrow();
    this.opts.playerInfoComp.hideProgress();
    this.opts.playerActionsComp.hide();
    this.opts.playerChannelsComp?.hide();
    this.removeBingeWatching();
    this.setGradient("gradientUp", sliderType);
  }

  /**
   * Obtiene del config los módulos correspondientes a los sliders de sugerencias (id: portada_miniguia_sugerencias)
   * y crea una SliderView con esta información manteniendo el player visible de fondo
   */
  async loadSugerencias() {
    const submenu = unirlib.getSubmenuById("portada_miniguia_sugerencias");
    if (submenu) {
      this.restartTimeoutHideSugerencias();
      this.preparePlayerForSlider("similares");
      const element = await mapEnlace(submenu, null);
      const sliderWrap = html`<div id="slider-view-player" class="sliders section sliders-player"></div>`;
      const showFanart = unirlib.getShowFanart(submenu);
      this.opts.sliderSugerencias = new SliderView(sliderWrap, false, false, showFanart);
      await this.opts.sliderSugerencias.init(element);
      this.opts.sliderSugerencias.remove_header();
      ViewMng.instance.push(this.opts.sliderSugerencias);
      this.opts.sugerenciasClosedByTimer = false;
      this.createTimerComponent(sliderWrap);
      BackgroundMng.instance.set_bg_invisible();
      //auditar
      AppStore.tfnAnalytics.audience_navigation("playerLive", "ck_opt-02", {});
    }
  }

  /**
   * Actualiza el botón de PiP de las acciones principales del player según si está activo o no
   */
  updatePipButton() {
    if (this.isPipActive()) {
      this.opts.playerActionsComp.updateButton("pip", "pip_quitar");
    } else {
      this.opts.playerActionsComp.updateButton("pip_quitar", "pip");
    }
  }

  /**
   * Elimina los posibles botones de PiP entre las acciones principales del player
   */
  removePipButton() {
    if (this.opts.playerActionsComp) {
      this.opts.playerActionsComp?.removeButton("pip");
      this.opts?.playerActionsComp?.removeButton("pip_quitar");
    }
  }

  /**
   * Muestra el menú con las opciones de PiP
   */
  showPipMenu() {
    if (this.opts.playerActionsComp) {
      this.opts.playerActionsComp.hide();
    }
    if (this.opts.playerChannelsComp) {
      this.opts.playerChannelsComp.hide();
    }
    if (this.opts.playerAudioSubComp) {
      this.opts.playerAudioSubComp.hide();
    }
    this.opts.playerInfoComp.showPipMenu();
  }

  /**
   * Obtiene el canal en reproducción en el PiP y lo reproduce como canal principal, además de cerrar el PiP.
   */
  async setPipChannelAsMain() {
    const prevPipChannel = PipMng.instance.channel;

    PlayMng.instance.backgroundChannelPip = PipMng.instance.channel;
    // Ocultamos el pip
    await this.hidePip();

    // Reproducimos en grande canal del pip
    if (this.opts.playerChannelsComp) {
      this.opts.playerChannelsComp.setChannel(prevPipChannel.CodCadenaTv);
    }

    // Ocultamos el menú de PIP
    if (this.opts.playerInfoComp && this.isPipMenu) {
      this.opts.playerInfoComp.hidePip();
    }

    await this.onClickChannel(prevPipChannel);
  }

  /**
   * Intercambia el canal principal en reproducción por el que está en PiP y viceversa, siempre que no sea el mismo.
   */
  async interchangePipChannel() {
    const channel = this.getCurrentChannel();
    const historyPip = {
      chUID: PlayMng.instance.backgroundChannel?.referenceIdByQuality,
      main: PlayMng.instance.backgroundChannelPip?.referenceIdByQuality,
    };
    if (PipMng.instance.position !== null && channel.CodCadenaTv !== PipMng.instance.channel.CodCadenaTv) {
      // Cambiamos el pip
      const prevPip = PipMng.instance.channel;
      PipMng.instance.channel = this.getCurrentChannel();
      await PipMng.instance.stopPip();

      let currentProgramNow = this.getCurrentProgramOfNow();
      if (Utils.isEmpty(currentProgramNow)) {
        currentProgramNow = Main.getCurrentProgramEPG(this._channel.getChannelId());
      }
      const isAllowed = ControlParentalMng.instance.isContentAllowed(currentProgramNow);
      if ((await PipMng.instance.isPipAvailable()) && isAllowed) {
        PipMng.instance.hidePipNotAvailable();
        AppStore.PinMng.resetPinScaped();
        await PipMng.instance.pip(PipMng.instance.position);
      } else {
        PipMng.instance.showPipNotAvailable();
      }

      // Reproducimos canal del pip
      if (this.opts.playerChannelsComp) {
        this.opts.playerChannelsComp.setChannel(prevPip.CodCadenaTv);
      }
      PipMng.instance.updatePipChannel(channel, historyPip);
      // Ocultamos el menú de PIP
      if (this.opts.playerInfoComp && this.isPipMenu) {
        this.opts.playerInfoComp.hidePip();
      }

      await this.onClickChannel(prevPip);
    }
  }

  async hidePip(updateMenu = true) {
    PipMng.instance.hidePipChannel();
    if (AppStore.appStaticInfo.getTVModelName() === "iptv2") {
      await PipMng.instance.stopPip();
    }
    if (updateMenu) this.opts.playerInfoComp.updatePipMenu();
  }

  async setPipStandby() {
    await PipMng.instance.setPipStandby();
  }

  isPipActive() {
    return PipMng.instance.isActive;
  }

  showErrorFavoritos(error) {
    let resultCode = "";
    try {
      if (error.responseText) {
        const responseJSON = JSON.parse(error.responseText);
        resultCode = responseJSON ? responseJSON.resultCode : " ";
      }
    } catch (e) {
      resultCode = "";
    }

    this.isErrorShowing = true;
    AppStore.errors.showErrorTextReplace("", "player-view", "Favorites", "E_FAV_1", false, "[CodigoError]", resultCode);
  }

  showErrorLink(error) {
    let resultCode = "";
    try {
      if (error.responseText) {
        const responseJSON = JSON.parse(error.responseText);
        resultCode = responseJSON ? responseJSON.resultCode : " ";
      }
    } catch (e) {
      resultCode = "";
    }

    this.isErrorShowing = true;
    if (resultCode !== "" && resultCode !== " ") {
      AppStore.errors.showErrorTextReplace("", "player-view", "VOD", "E_VOD_1", false, "[CodigoError]", resultCode);
    } else {
      // Si no tenemos código de error específico para sustituir, mostramos error general al usuario.
      AppStore.errors.showError(this, "player-view", "general", "E_Gen_1", false);
    }
  }

  /**
   * @private
   */
  async _showComponents(audioSub = false, activeAction = null, showIcon = true, isPlaying = false) {
    this.opts.wrap.css("display", "block");
    this.opts.wrap.css("opacity", 1);
    if (this.opts.playerInfoComp && !audioSub) {
      this.opts.playerInfoComp.show();
      this.opts.playerInfoComp.showArrow();
      this.opts.playerInfoComp.showProgress();
      this.updateTimerComponent();
    }
    if (this.opts.playerActionsComp && !audioSub) {
      if (activeAction) {
        this.opts.playerActionsComp.setActiveAction("pip");
      } else {
        this.opts.playerActionsComp.resetIndex();
      }
      this.opts.playerActionsComp.show();
      if (this.opts.playerStreamEventsComp) this.opts.playerStreamEventsComp.show();
    }
    if (this.opts.playerChannelsComp && !audioSub) this.opts.playerChannelsComp.show();

    if (this._mode === 1 && AppStore.appStaticInfo.getTVModelName() === "iptv2") {
      PipMng.instance.showPipName();
    }

    if (!audioSub) this.opts.isShowingPlayerInfo = true;
    if (showIcon && this.isVod && !AppStore.yPlayerCommon.isVideoPlaza) {
      const statusPlayer = this.opts.playerStatusComp?.getScreenStatus();
      if (
        (statusPlayer === "play" && KeyMng.instance.lastKeyCode === ykeys.VK_PLAYPAUSE) ||
        KeyMng.instance.lastKeyCode === ykeys.VK_PLAY
      )
        this.opts.playerStatusComp.setScreenStatus("play");
      else if (statusPlayer === "pause") this.opts.playerStatusComp.setScreenStatus("pause");
      else if (!isPlaying) {
        if (KeyMng.instance.lastKeyCode === ykeys.VK_YELLOW) {
          this.opts.playerStatusComp.setScreenStatus("goinit");
          if (AppStore.yPlayerCommon.isLive() && AppStore.yPlayerCommon.isDiferido()) {
            //auditar
            AppStore.tfnAnalytics.audience_navigation("playerOut", "stop_stoverp", { trigger: "button_yellow" });
          }
        } else {
          this.opts.playerStatusComp.setScreenStatus("play");
        }
      }
    }
    this.restartTimeoutHide();

    // Check si pip previo
    if (
      AppStore.yPlayerCommon.isLive() &&
      PipMng.instance.prevPosition !== null &&
      PipMng.instance.prevChannel !== null &&
      !AppStore.yPlayerCommon.isDiferido() &&
      !AppStore.yPlayerCommon.isVideoPlaza &&
      !this.isCurrentChannelApplication()
    ) {
      const { prevPosition } = PipMng.instance;
      const isPrevUHD = PipMng.instance.isChannelUHD(PipMng.instance.prevChannel);
      PipMng.instance.setPip(prevPosition, PipMng.instance.prevChannel);
      await PipMng.instance.showPipChannel();
      if (await PipMng.instance.isPipAvailable(isPrevUHD)) {
        // Seteamos payload previo
        await PipMng.instance.pip(prevPosition);
      } else {
        PipMng.instance.showPipNotAvailable();
      }
      this.updatePipButton();
    }

    this.addClass("active");
    this.opts.eventBus.emit(PLAYER_REFS.EVENTOS.SHOWPLAYER, this.getTime());
  }

  /**
   *
   * @returns {boolean} true si se esta reproduciendo
   */
  getIsPlaying() {
    return AppStore.yPlayerCommon.isPlaying();
  }

  /**
   * Devuelve el Id del contenido en reproducción (-1 si no hay datos de contenido)
   * @returns {Number}
   */
  getContentId() {
    return this._datos_editoriales?.Id || -1;
  }

  show(audioSub = false, activeAction = null, showIcon = true) {
    /** Actualizar la info en caso de venir desde calles de canales */
    if (this.desdeCalle) {
      this.opts.playerInfoComp?.update();
    }
    const self = this;
    self.opts.playerStatusComp = self.opts.playerStatusComp || {};
    self.opts.playerStatusComp.setScreenStatus =
      self.opts.playerStatusComp.setScreenStatus ||
      function () {
        return null;
      };
    self.audioSub = audioSub;
    self.activeAction = activeAction;
    self.showIcon = showIcon;
    self.isFR =
      AppStore.yPlayerCommon.getSkipState() == AppStore.yPlayerCommon.FORWARD ||
      AppStore.yPlayerCommon.getSkipState() == AppStore.yPlayerCommon.REWIND;
    self.isPlaying = AppStore.yPlayerCommon.isPlaying();
    this.ShowController.showOnPlayEvent(async () => {
      //auditar
      const isVisibleTrickModes = self.opts?.playerStatusComp?.isVisibleTrickModes
        ? self.opts.playerStatusComp.isVisibleTrickModes()
        : false;
      const isLiveRewind = PlayMng.player._stateAfterPlay === AppStore.yPlayerCommon.REWIND;
      if (
        (!DialMng.instance.isActive() && !self.isFR && !isVisibleTrickModes && !isLiveRewind) ||
        AppStore.yPlayerCommon.isVideoPlaza ||
        self.isCurrentChannelApplication()
      ) {
        await self._showComponents(self.audioSub, self.activeAction, self.showIcon, self.isPlaying);
        this.setGradient("gradient");
      }
    });
  }

  hide(fast = false) {
    ///
    /// Desactivamos la función si existe BW y estamos en onEded
    /// !FIXME: No tenemos configurado fuera de player-view la opción de esconder o no los controles dependiendo de un manager externo
    ///
    if (this.opts.bingeWatchingMng) {
      if (this.opts.bingeWatchingMng?.bingeWatchingPlayer?.onFanArt) {
        return;
      }
    }
    // si esta visible el flyer de m360, se oculta con la iteracción del usuario
    if (AppStore.M360Mng.isShowPlayerFlyer) this.hidePlayerFlyer();
    if (fast && this.optsWrap) {
      setTimeout(() => {
        this.optsWrap.css("display", "none");
        this.optsWrap.css({ opacity: 0 });
      }, 0);
    }
    // No ocultamos en RWD o FWD
    if (
      AppStore.yPlayerCommon.getSkipState() === AppStore.yPlayerCommon.FORWARD ||
      AppStore.yPlayerCommon.getSkipState() === AppStore.yPlayerCommon.REWIND
    ) {
      return;
    }

    this.opts.isShowingPlayerInfo = false;
    if (!this.optsWrap) {
      return;
    }
    if (this.opts.playerInfoComp && this.isPipMenu) {
      this.opts.playerInfoComp.hidePip();
    }
    if (this._getItMustRestartTimeoutHide()) {
      return this.restartTimeoutHide();
    }

    this.opts.isHiding = true;
    this.stopTimeoutHide();
    if (fast) {
      this._hideComponents();
      this.opts.eventBus.emit(PLAYER_REFS.EVENTOS.HIDEPLAYER, this.getTime());
    } else {
      // TODO: verificar este valor de 1000ms es muy alto

      this.optsWrap.animate(
        { opacity: 0 },
        {
          duration: 1000,
          complete: () => {
            this.optsWrap.css("display", "none");
            this._hideComponents();
            // Emitimos ocultación player
            this.opts.eventBus.emit(PLAYER_REFS.EVENTOS.HIDEPLAYER, this.getTime());
          },
        }
      );
    }
    if (
      this.activeComponent !== this.opts.playerStreamEventsComp &&
      this.opts.playerStreamEventsComp?.tipo !== CONSTANTS.TIPO_COMPONENTE.OMITIR_SEGMENTO
    ) {
      this.activeComponent = this.opts.playerInfoComp;
    }
  }

  /**
   * @private
   * @returns {boolean} true si se debe reiniciar el timer de hide
   */
  _getItMustRestartTimeoutHide() {
    return (
      this.activeComponent !== this.opts.playerInfoComp &&
      this.activeComponent !== this.opts.playerChannelsComp &&
      this.activeComponent !== this.opts.playerAudioSubComp &&
      this.activeComponent !== this.opts.playerStreamEventsComp &&
      this.activeComponent !== this.opts.detailsModalComp &&
      this.activeComponent?.type !== this.opts.playerActionsComp?.type
    );
  }

  /**
   * oculta los componentes
   *
   * @private
   */
  _hideComponents() {
    this.opts.playerInfoComp?.hide();
    this.opts.playerActionsComp?.hide();
    this.opts.playerChannelsComp?.hide();
    this.opts.playerAudioSubComp?.hide();

    if (this._mode === 1 && AppStore.appStaticInfo.getTVModelName() === "iptv2") {
      PipMng.instance.hidePipName();
    }
    this.restoreCopy();

    if (this.isCurrentChannelApplication()) {
      showPlayerFanartMessage();
    }
    // TODO: Este timeout deberia removerse en un futuro
    setTimeout(() => {
      if (AppStore.yPlayerCommon.isLive()) this.opts.playerInfoComp?.animations?.animateHideDescription();
      this.opts.isHiding = false;
    }, 500);
  }

  stopTimeoutHide() {
    if (this.opts.timeoutHide) {
      window.clearTimeout(this.opts.timeoutHide);
      this.opts.timeoutHide = null;
    }
  }

  stopTimeoutSugerenciasHide() {
    if (this.opts.timeoutSugerenciasHide) {
      window.clearTimeout(this.opts.timeoutSugerenciasHide);
      this.opts.timeoutSugerenciasHide = null;
    }
  }

  stopPinTimeout() {
    this.prevCompAfterPinModal(false);
    if (this.opts.pinTimeout) {
      window.clearTimeout(this.opts.pinTimeout);
      this.opts.pinTimeout = null;
    }
  }

  /**
   * @name getTimerHideMini
   * @description Obtiene el valor del timer para esconder la UI del player
   * @returns {number} timerHideMini - valor del timer en ms
   */
  getTimerHideMini() {
    let timerHideMini = null;
    if (AppStore.yPlayerCommon.isPubli()) return AppStore.wsData._timerHidePlayerPublicidad;

    if (this.isVod) {
      timerHideMini = AppStore.wsData._timer_hide_minivod;
    } else if (this.isCurrentChannelApplication()) {
      timerHideMini = AppStore.wsData._timer_hide_miniguide_app_channel;
    } else {
      timerHideMini = AppStore.wsData._timer_hide_miniguide;
    }

    return timerHideMini ? timerHideMini : 3000;
  }

  /**
   * @name restartTimeoutHide
   * @description Timer para las vistas que se cierren por inactividad indicar que reinicie la cuenta atrás
   */
  restartTimeoutHide() {
    if (this.activeComponent instanceof DetailsView) {
      // Si estamos en el Slider de Episodios/Similares en el player
      this.restartTimeoutHideSimilaresEpisodes();
    } else if (this.opts.playerInfoComp?.isDescription) {
      clearTimeout(this.opts.playerInfoComp?.timeoutHideinfoextendida);
      this.opts.playerInfoComp?.startHideDescription();
    } else {
      this.stopTimeoutHide();
      const self = this;
      let timerHideMini = this.getTimerHideMini();
      const EXTRA_TIME_OF_TRANSITIONS = 800;
      timerHideMini = parseInt(timerHideMini, 10);
      timerHideMini += EXTRA_TIME_OF_TRANSITIONS; // Añadimos un poco de tiempo extra por las transiciones/animaciones.
      this.opts.timeoutHide = window.setTimeout(() => {
        self.hide();
      }, timerHideMini);
    }
  }

  /**
   * @name restartTimeoutHideSimilaresEpisodes
   * @description Timer específico para sección de episodios dentro del PLAYER
   */
  restartTimeoutHideSimilaresEpisodes() {
    this.stopTimeoutHide();
    const timerhidesimilar_episodes = this.globalContext.timerhidesimilar_episodes
      ? parseInt(this.globalContext.timerhidesimilar_episodes)
      : 10000;
    //const DELAY_EXTRA_LOAD = 1000;
    this.opts.timeoutHide = window.setTimeout(() => {
      this.hideDetailsSliders(true);
    }, parseInt(timerhidesimilar_episodes /*+ DELAY_EXTRA_LOAD*/));
  }

  restartTimeoutHideSugerencias() {
    this.stopTimeoutSugerenciasHide();
    const timerhidesimilar_episodes = this.globalContext.timerhidesimilar_episodes
      ? parseInt(this.globalContext.timerhidesimilar_episodes)
      : 10000;
    this.opts.timeoutSugerenciasHide = window.setTimeout(() => {
      this.ShowController.avoidShowControllerOnFirstFrame = true;
      this.opts.sugerenciasClosedByTimer = true;
      ViewMng.instance.close(this.opts.sliderSugerencias);
    }, parseInt(timerhidesimilar_episodes));
  }

  isHiding() {
    return this.opts.isHiding;
  }

  set_asset(info) {
    if (!info) return;
    this._asset = info;
    this.setUrlTS(this._asset.UrlVideo);
  }

  setUrlTS(url) {
    AppStore.yPlayerCommon._urlTS = AppStore.yPlayerCommon.prepareUrl(url);
  }

  set_catalog_item_type(itemType) {
    this._catalog_item_type = itemType;
  }

  set_datos_editoriales(datos) {
    if (datos?.DatosEditoriales) {
      this._datos_editoriales = datos.DatosEditoriales;
    } else {
      this._datos_editoriales = datos;
    }
  }

  set_formato_video(formato) {
    this._formato_video = formato;
  }

  setFreeContent(freecontent) {
    this._freeContent = freecontent;
  }

  setIsTrailer(trailer) {
    this._trailer = trailer;
  }

  setInfoTitulo(titulo) {
    this._titulo = titulo;
  }

  setExtrasMode(extras_mode) {
    this._extras_mode = extras_mode;
  }

  setReproducirDesdeInicio(inicio) {
    this._reproducir_desde_inicio = inicio;
  }

  setReproducirDesdeCalle(desdeCalle) {
    this.desdeCalle = desdeCalle;
  }

  setIsStartOver(is_start_over) {
    this._is_start_over = is_start_over;
  }

  get IsStartOverFromEpg() {
    return this._is_start_over_from_epg;
  }

  setIsStartOverFromEpg(is_start_over_from_epg) {
    this._is_start_over_from_epg = is_start_over_from_epg;
  }

  setShowGoLive(show_go_live) {
    this._show_go_live = show_go_live;
  }

  get_datos_editoriales() {
    return this._datos_editoriales;
  }

  get_content_id(favouritesMode = false) {
    const NO_INDICE = 1;
    const playerInfoComp = this.opts.playerInfoComp || { opts: { programActive: -1, isMore: false } };
    playerInfoComp.opts = playerInfoComp.opts || { programActive: -1, isMore: false };
    let result = null;
    if (
      this.isVod ||
      (this.opts.playerInfoComp && !this.opts.playerInfoComp.opts.isMore) ||
      (this.opts.playerInfoComp && this.opts.playerInfoComp.opts.programActive === this._eventoEnCurso + 1)
    ) {
      const item_type = this._catalog_item_type?.toLowerCase();
      if (item_type == "movie" || item_type == "season" || item_type == "serie") {
        result = this._datos_editoriales.Id;
      } else if (item_type == "liveseason" || item_type == "liveseasonrecording") {
        if (this._datos_editoriales.Pases) result = this._datos_editoriales.Pases[0].SerialId;
        else result = this._datos_editoriales.SerialId;
      } else if (item_type == "liveepisode" && this._datos_editoriales.Pases) {
        if (this._datos_editoriales.Pases[0].AssetType === "NPVR") result = this._datos_editoriales.Pases[0].ShowId;
        else {
          if (favouritesMode) result = this._datos_editoriales.Pases[0].SerialId;
          else result = this._datos_editoriales.Pases[0].ShowId;
        }
      } else if (item_type == "liveepisode" && favouritesMode) {
        result = this._datos_editoriales.SerialId;
      } else if (item_type == "episode" && this._datos_editoriales.Contenedor) {
        result = this._datos_editoriales.Contenedor.Id;
      } else if (!result && this._asset && this._asset.ShowId) {
        result = this._asset.ShowId;
      }
      if (!result || result === "") result = this._datos_editoriales?.Id ? this._datos_editoriales.Id : "";
    } else {
      const indice = playerInfoComp.opts.programActive >= 1 ? playerInfoComp.opts.programActive : NO_INDICE;
      const epgChannel = this._epg_channel[indice] || { Id: "" };
      result = epgChannel.Id;
    }

    return result;
  }

  get_catalog_item_type() {
    return this._catalog_item_type;
  }

  /**
   * @returns {import("@unirlib/server/yPlayerCommon/yPlayerCommon").PlayerContentType}
   */
  get_content_type() {
    if (this._mode === 1) return "channels";
    let result = "voditems";
    if (this.es_grabacion()) result = "NPVR";
    else if (this.es_u7d()) result = "U7D";
    return result;
  }

  get_content_type_publi() {
    if (this._mode === 1) return "events";
    return this.get_content_type();
  }

  es_grabacion() {
    const es_grabacion =
      this._asset && this._asset.ShowId ? unirlib.getMyLists().estaRecordinglist(this._asset.ShowId) : false;
    return es_grabacion;
  }

  /**
   * Devuelve si el programa actual(this._asset) en reproducción es u7d o no
   * @returns {Boolean} true si es u7d, false en cualquier otro caso
   */
  es_u7d() {
    let es_u7d = false;
    this._asset = this._asset || { ShowId: null };
    if (!this.es_grabacion() && this._asset.ShowId) {
      const ahora = AppStore.appStaticInfo.getServerTime();
      const hora_fin = new Date(this._asset.HoraFin / 1);
      const es_pasado = ahora > hora_fin;
      const hace_siete_dias = new Date(ahora.getDate() - 7);
      const es_hace_siete_dias = hora_fin > hace_siete_dias;
      es_u7d = es_pasado && es_hace_siete_dias;
    }
    return es_u7d;
  }

  /**
   * Devuelve si un programEpgDvbipi pasado por parámetros es u7d o no
   * @param {programEpgDvbipi} evento puede ser el programa en reproducción o el enfocado actualmente en la miniguía
   * @returns {Boolean} true si es u7d, false en cualquier otro caso
   */
  getEventIsU7d(evento) {
    const endTime = evento.FechaHoraFin;
    const now = AppStore.appStaticInfo.getServerTime();
    return now > endTime;
  }

  async setFollowingManager() {
    if (AppStore.yPlayerCommon.isAutoplay()) {
      console.warn("setFollowingManager: autoplay");
      return null;
    }
    console.warn("setFollowingManager: playmen");
    if (this.origin == "FichaScene" && AppStore.home.getDetailsView()?.following_mng != null) {
      this._following_mng = AppStore.home.getDetailsView()?.following_mng;
      //if (this._following_mng?._actual_episode_link?.rel === "first")
      const idActual = this._datos_editoriales.Id;
      await this._following_mng.calculateNextEpisode(idActual);
    } else if (this._datos_editoriales.TipoContenido == "Episodio") {
      const idActual = this._datos_editoriales.Id;
      await this.createFollowingManager(idActual);
    } else {
      this._following_mng = null;
    }
    return this._following_mng;
  }

  setReferenceFollowingManager() {
    this._following_mng = new seguimiento_mng();
  }

  createFollowingManager(idEpisode = null) {
    if (!this._following_mng && this._datos_editoriales) {
      console.warn(`this._datos_editoriales.IdSerie ${this._datos_editoriales.IdSerie}/${this._datos_editoriales.Id}`);
      const self = this;
      this._following_mng = new seguimiento_mng();
      return this._following_mng
        .loadSeguimiento(this._datos_editoriales.IdSerie)
        .then((_resolve) => {
          self._following_mng.calculateNextEpisode(idEpisode);
        })
        .catch((error) => {
          console.warn("createFollowingManager::error", error);
        });
    }
    return Promise.resolve();
  }

  createTimerComponent(wrap) {
    const d = new Date();
    const hour = d.getHours();
    const minutes = `0${d.getMinutes()}`.slice(-2);
    const timerWrap = document.getElementById("player-timer");
    const self = this;

    if (timerWrap && !wrap) {
      clearInterval(this.playerTimerInterval);
    } else {
      const div = document.createElement("div");
      div.setAttribute("id", "player-timer");
      div.classList = "player_timer";
      div.innerHTML = `${hour}:${minutes}`;
      if (wrap) {
        wrap.append(div);
      } else {
        this.opts.wrap.append(div);
      }
    }

    clearInterval(this.playerTimerInterval);
    this.playerTimerInterval = setInterval(() => {
      self.updateTimerComponent();
    }, 10000);
  }

  updateTimerComponent() {
    const dn = new Date();
    const nhour = dn.getHours();
    const nminutes = `0${dn.getMinutes()}`.slice(-2);
    const playerTimer = document.getElementById("player-timer");
    if (playerTimer) {
      playerTimer.innerHTML = `${nhour}:${nminutes}`;
    } else {
      clearInterval(this.playerTimerInterval);
    }
  }

  // Devuelve si estamos reproduciendo, normalmente cuando venimos de la epg
  isPlayingChannel() {
    const isPlaying = AppStore.yPlayerCommon.isPlaying();
    if (this._mode === 1 && isPlaying) return true;
    return false;
  }

  async startPlaying() {
    this.clearTimeoutLaunchApp();
    //this.start_new_stream_events();

    LoaderMng.instance.hide_loader();
    if (
      ((this.opts.isPlayingChannel || this._reproducir_desde_inicio) && !this.isVod) ||
      this.isCurrentChannelApplication()
    ) {
      if (AppStore.appStaticInfo.getTVModelName() === "iptv2") {
        if (!this._reproducir_desde_inicio) await this.parentalCheck(true);
      }
      if (!this.isAllowed) return;

      // Cuando venimos de la epg no necesitamos para el player
      // Simplemente creamos las componentes:
      await this.onPlayingContent();
      // Seteamos audio/subtitulos

      // Para que solo cree los componentes una sola vez
      this.opts.isPlayingChannel = false;
      if (PlayMng.instance.epgMode) {
        PlayMng.player.resize(0, 0, 1280, 720);
      }
      PlayMng.player.startPlayTimeInfo();
      return;
    }
    if (AppStore.yPlayerCommon.hasVideoUrl()) {
      // Inicializacion Conviva
      this.initConviva();
      // Inicializacion Reproduccion
      if (this._freeContent || this._trailer) {
        this.play();
      } else {
        if (this.isVod) {
          PlayMng.instance.setBackgroundMode(false);
          // Inicializacion gestor seguimientos
          await this.setFollowingManager();
          if (AppStore.appStaticInfo.getTVModelName() === "iptv2") {
            this.callback_startSession();
          } else {
            AppStore.yPlayerCommon.startSession(
              0,
              this._asset.CasId,
              this._datos_editoriales.TipoContenido,
              this.origin
            );
          }
        } else {
          if (AppStore.appStaticInfo.getTVModelName() === "iptv2") {
            if (!this._reproducir_desde_inicio || this.isVod) await this.parentalCheck(true);
          } else {
            // Chequeamos si contenido puede visualizarse
            const evento = this.getCurrentProgram();
            const controlado = evento.Titulo
              ? evento.Titulo.toUpperCase() == "CONTENIDO PROTEGIDO POR CONTROL PARENTAL"
              : false;
            if (evento.Disponible && !controlado) {
              this.checkVerInicio();
              WatermarkMng.instance.start();
              AppStore.yPlayerCommon.startSession(1, this._CasId, "CHN", this.origin);
            } else if (controlado) {
              this.isErrorShowing = true;
              AppStore.errors.showError(this, "player-view", "TV", "I_TV_2", false);
            } else {
              this.isErrorShowing = true;
              AppStore.errors.showError(this, "player-view", "TV", "I_TV_1", false);
            }
          }
        }
      }
    } else {
      // Si no hay punto de reproduccion... Retorna a la escena de origen
      AppStore.yPlayerCommon.stop(false);
      //this.goPreviousScreen();
    }
  }

  initConviva() {
    if (unirlib.hasConvivaFlag()) {
      convivaAPI.initializeConvivaLivePass();
    }
  }

  refresh_channels() {
    const slider = ViewMng.instance.viewsType("slider").find((elem) => elem.type === "slider");
    slider.refresh_channels();
  }

  play(avance = 0) {
    debug.alert(`this.play URL:${AppStore.yPlayerCommon._urlTS} ${this._freeContent} ${this._trailer}`);
    debug.alert(`this.play avance:${avance}`);
    this._asset = this._asset || {};

    //TODO verificar cual de estas 2 líneas tiene que dejarse, había conflicto entre "release_v3" y "release/R3.10"
    // await this.createComponents();
    // Por temas de rendimiento el reload del wrap se pone en un timeout
    setTimeout(() => {
      this.reloadPlayerWrap(true);
    }, 0);

    const urlTS = AppStore.yPlayerCommon._urlTS;
    if (this._freeContent || this._trailer) {
      PlayMng.player.initPlayer();
      this.setSubtitulos(null);
      this._isFromBegin = true;
      this._isFirstEvent = true;
      this._stream_is_over = false;
      this._skipback_done = false;
      AppStore.yPlayerCommon.playTS(0, AppStore.yPlayerCommon._urlTS, null, this._formato_video, 0);
      if (!AppStore.yPlayerCommon.isAutoplay() && !PlayMng.player._onError && !AppStore.home.getPopupActive()) {
        AppStore.home.hide_home();
      }
    } else if (this.isVod) {
      PlayMng.player.initPlayer();
      PlayMng.player.setVersionIdioma(this._asset.VersionIdioma);
      const devtype = Main.getDevType();
      if (devtype == "M12" || devtype == "H12") this.setSubtitulos(this._asset.Subtitulos2012);
      else this.setSubtitulos(this._asset.Subtitulos);

      this._formato_video = this._asset.FormatoVideo;
      this._isFromBegin = avance === 0;
      this._isFirstEvent = true;
      this._skipback_done = false;
      if (AppStore.appStaticInfo.getTVModelName() !== "iptv2") AppStore.tfnAnalytics.eventPlayer("PLAY");
      AppStore.yPlayerCommon.playTS(0, urlTS, this._asset.CasId, this._formato_video, avance);
    } else {
      if (AppStore.M360Mng.channel && this.opts.m360ParamsPlayer.linkedDevice) this._channel = AppStore.M360Mng.channel;
      PlayMng.player.initPlayer();
      AppStore.yPlayerCommon.playTS(1, urlTS, this._channel.CasId, this._channel.FormatoVideo, avance);
      this.opts.m360ParamsPlayer = {};
    }
  }

  setSubtitulos(Subtitulos) {
    this.init_subs_controls();
    if (Subtitulos && Subtitulos.length) {
      this.addSubtitulo(0, "NINGUNO", null, "n");
      const nsub = Subtitulos.length;
      for (let i = 0; i < nsub; i++) {
        this.addSubtitulo(i + 1, Subtitulos[i].EtiquetaSubtitulo, Subtitulos[i].uri, Subtitulos[i].TipoSubtitulo);
      }
    }
    //this.changeSubtitulo(0);
  }

  init_subs_controls() {
    this._subtitulos = [];
    this._idiomas = [];
    this._subtitulosUri = [];
    this._subtitulosTipo = [];
  }

  addAudio(position, newaudio) {
    if (newaudio) this._idiomas[position] = newaudio;
    return this._idiomas.length;
  }

  changeAudio(iaudio) {
    PlayMng.player._isChangingAudio = true;
    PlayMng.player.changeAudio(iaudio);
  }

  addSubtitulo(position, newsubtitulo, uri, tipo) {
    if (newsubtitulo && newsubtitulo != "undefined") {
      this._subtitulos[position] = newsubtitulo;
      this._subtitulosUri[position] = uri;
      this._subtitulosTipo[position] = tipo;
    }

    return this._subtitulos.length;
  }

  changeSubtitulo(isubtitulo) {
    if (
      PlayMng.player._shaka ||
      AppStore.appStaticInfo.getTVModelName() == "android.tv" ||
      AppStore.appStaticInfo.getTVModelName() == "iptv2"
    ) {
      PlayMng.player.changeSubtitulo(isubtitulo);
    } else {
      if (isubtitulo == 0) {
        if (this._subtitulos_play != 0) {
          Tratasrt.stopSubtitles();
          this._subtitulos_play = 0;
        }
      } else {
        if (this._subtitulos_play != isubtitulo) {
          Tratasrt.stopSubtitles();
          let urlSub = this._subtitulosUri[isubtitulo];
          urlSub = urlSub.replace("/", "/");
          Tratasrt.initSubtitles(urlSub);
          this._subtitulos_play = isubtitulo;
        }
      }
    }
  }

  getCurrentAudio() {
    if (this.isCurrentChannelApplication()) return "NONE";
    let index = 0;
    if (this.opts.playerAudioSubComp) {
      index = this.opts.playerAudioSubComp.get_idioma_marcado();
    }
    const result = PlayMng.player.getAudio(index);
    return result ? result.lang : unirlib?.getUserProfile()?.audioCode;
  }

  getCurrentSubtitle() {
    if (this.isCurrentChannelApplication()) return "NONE";
    let result = "NONE";
    if (this.opts.playerAudioSubComp) {
      const index = this.opts.playerAudioSubComp.get_subtitulo_marcado();
      result = this._subtitulos[index];
    }
    if (result === "NINGUNO") result = "NONE";
    return result;
  }

  getCurrentSubtitleLangCode() {
    let result;
    if (this.opts.playerAudioSubComp) {
      const index = this.opts.playerAudioSubComp.get_subtitulo_marcado();
      result = this._subtitulosUri[index].lang;
    }
    if (!result || result === "") result = "NONE";
    return result;
  }

  changePlayerMark(type, index) {
    this.opts.playerAudioSubComp.changeMark(type, index);
  }

  getCDN() {
    let result = null;
    if (this.mode === 1) return this._cdn;
    if (this._asset && this._asset.Cadena) result = this._asset.Cadena.CDN;
    return result;
  }

  /* CONVIVA */
  startConviva() {
    let urlconviva;
    if (unirlib.hasConvivaFlag()) {
      let assetName = "";
      if (this.isVod) {
        if (this._datos_editoriales != null) assetName = this._datos_editoriales.Titulo;
        else assetName = this._titulo;

        urlconviva = AppStore.yPlayerCommon._urlTS;
        convivaAPI.isLive(false);

        convivaAPI.setCDN(this.getCDN());

        if (this._trailer) {
          assetName = `TRAILER - ${assetName}`;
          if (this._datos_editoriales != null) {
            //urlconviva = this._datos_editoriales.Trailers[0].uri;
            urlconviva =
              this._datos_editoriales.Trailers[0] && this._datos_editoriales.Trailers[0].uri
                ? this._datos_editoriales.Trailers[0].uri
                : urlconviva;
            convivaAPI.addTagsTrailer(this._datos_editoriales);
          } else convivaAPI.addTagsCommon();
        } else {
          if (this._asset != null) convivaAPI.addTagsVOD(this._asset);
          else convivaAPI.addTagsCommon();
        }
        convivaAPI.setAssetname(assetName);
        convivaAPI.setUrl(urlconviva);
        convivaAPI.createSession();
      } else {
        if (this._channel) assetName = this._channel.CodCadenaTv;
        else if (this.origin == "HomeScene" && this._freeContent) {
          assetName = `PROMO-${this._titulo}`;
          convivaAPI.initializeConvivaLivePass();
        }

        debug.alert(`startConviva assetName: ${assetName}`);

        convivaAPI.setAssetname(assetName);
        if (this._cdn != null) convivaAPI.setCDN(this._cdn);
        convivaAPI.setUrl(AppStore.yPlayerCommon._urlTS);
        convivaAPI.isLive(true);

        convivaAPI.addTagsLive(assetName);
        convivaAPI.createSession();
      }
    }

    if (AppStore.appStaticInfo.hasPixel()) {
      if (this.isVod) {
        let assetName = "";
        if (this._datos_editoriales != null) assetName = this._datos_editoriales.Titulo;
        else assetName = this._titulo;

        pixelAPI.setCDN(this.getCDN());

        pixelAPI.isLive(false);
        if (this._trailer) {
          assetName = `TRAILER - ${assetName}`;
          if (this._datos_editoriales != null) {
            const [trailer] = this._datos_editoriales.Trailers;
            urlconviva = trailer.uri;
            pixelAPI.addTagsTrailer(this._datos_editoriales);
          } else pixelAPI.addTagsCommon();
        } else {
          if (this._asset != null) pixelAPI.addTagsVOD(this._asset);
          else pixelAPI.addTagsCommon();
        }
        pixelAPI.setAssetname(assetName);

        this._time = this._ultimo_avance;
        debug.alert(`_ultimo_avance ${this._ultimo_avance}`);
        pixelAPI.createSession(this._time);
      } else {
        let assetName = "";
        if (this._channel) assetName = this._channel.CodCadenaTv;
        else if (this._origenScene == "HomeScene" && this._freeContent) assetName = `PROMO-${this._titulo}`;

        debug.alert(`start pixel assetName: ${assetName}`);

        pixelAPI.setAssetname(assetName);
        if (this._cdn != null) pixelAPI.setCDN(this._cdn);
        //pixelAPI.setUrl(AppStore.yPlayerCommon._urlTS);
        pixelAPI.isLive(true);
        pixelAPI.addTagsLive(assetName);
        pixelAPI.createSession(0);
      }
    }
  }

  reportError(errorMsg) {
    if (unirlib.hasConvivaFlag()) {
      convivaAPI.reportError(errorMsg);
    }
  }

  savePuntoReproduccion(punto) {
    // No se guarda bookmark en estos casos:
    if (
      AppStore.login.isAnonimousUser() ||
      AppStore.yPlayerCommon.isAutoplay() ||
      AppStore.yPlayerCommon.isVideoPlaza ||
      !this._datos_editoriales ||
      this._freeContent ||
      this._trailer ||
      this._extras_mode ||
      AppStore.wsData._bookmark_set < 0
    ) {
      return;
    }

    let time_elapsed = 0;
    let link = null;
    // Para VOD
    if (this._mode == 0 && this._time > 0) {
      this._time = this._time <= this._totalTime ? this._time : this._totalTime;
      const threshold = 1000 * parseInt(AppStore.wsData._threshold_in_seconds);
      const is_started = punto > threshold;
      if (is_started) {
        link = get_link_related(this._asset?.links, "bookmark");
        this._ultimo_avance = punto;
        time_elapsed = punto;
      }
    }

    // Para diferido
    if (this._mode == 1) {
      if (this._datos_editoriales.Pases) {
        link = get_link_related(this._datos_editoriales.Pases[0].links, "bookmark");
      } else {
        link = get_link_related(this._asset?.links, "bookmark");
      }
      if (AppStore.yPlayerCommon.isDiferido()) {
        const startTime = new Date(this._datos_editoriales.Pases[0].HoraInicio / 1);
        time_elapsed = this.getPuntoDiferido(startTime);
      } else if (this._mode == 1 && !AppStore.yPlayerCommon.isDiferido()) {
        time_elapsed = punto;
      }
    }

    if (time_elapsed > 0) {
      const id = null;
      const datos_ed = this._datos_editoriales;
      const origenPlayer = this.origin;

      time_elapsed = parseInt(time_elapsed / 1000);

      const self = this;
      const bmk = new bookmarking();
      bmk.post_reproduccion(id, link, time_elapsed).then(
        async (response) => {
          if (response.status == 201) {
            const form = response.data;
            unirlib.getMyLists().add_viewing_content(form);
            AppStore.home.refresh_progress_id(id);
            if (datos_ed.Id) AppStore.home.refresh_progress_id(datos_ed.Id);
            if (datos_ed.TipoContenido == "Episodio" && datos_ed.IdSerie) {
              AppStore.home.refresh_progress_id(datos_ed.IdSerie);
            }
            AppStore.home.refresh_endpoint("tfgunir/consultas", "ultimasreproducciones");
            AppStore.home.refresh_details();
          }
        },
        (error) => {
          debug.alert(error);
        }
      );
    }
  }

  delPuntoReproduccion(_id) {
    if (AppStore.yPlayerCommon.getMode() == 0 && this._datos_editoriales && !this._trailer) {
      const link = get_link_related(this._asset?.links, "bookmark");
      const id = this.get_content_id();
      const bmk = new bookmarking();
      bmk.delete_reproduccion(id, link).then(
        (response) => {
          if (response.status == 201) {
            const form = response.data;
            unirlib.getMylists().delete_viewinglist_content(form.id, form.catalogItemType);
            AppStore.home.refresh_progress_id(form.id);
            AppStore.home.refresh_endpoint("tfgunir/consultas", "ultimasreproducciones");
          }
        },
        (_error) => {
          // Nothing
        }
      );
    }
  }

  /**
   * Guarda el bookmark completado con el tiempo total del contenido una vez este ha terminado
   * Se llamará desde el evento reachedEnd
   */
  saveBookmarkCompleted() {
    this.savePuntoReproduccion(this._totalTime);
  }

  reload_seguimiento() {
    const self = this;
    return new Promise((resolve) => {
      if (self._datos_editoriales) {
        self._following_mng = new seguimiento_mng();
        self._following_mng.set_seguimiento_opts(self._datos_editoriales).then(
          (_response) => {
            self._following_mng.loadSeguimiento(self._datos_editoriales.IdSerie).then(
              (_response) => {
                self._following_mng.calculateNextEpisode().then(
                  (_response) => {},
                  (_error) => {}
                );
                AppStore.home.refresh_endpoint("tfgunir/consultas", "ultimasreproducciones");
                AppStore.home.refresh_progress_all();
                AppStore.home.refresh_focus();
                AppStore.home.refresh_details();
                resolve();
              },
              (_error) => {
                AppStore.home.refresh_endpoint("tfgunir/consultas", "ultimasreproducciones");
                AppStore.home.refresh_progress_all();
                AppStore.home.refresh_focus();
                AppStore.home.refresh_details();
                resolve();
              }
            );
          },
          (_error) => {
            debug.alert(" this.reload_seguimiento ERROR SET OPTS SEGUIMIENTO!!");
            resolve();
          }
        );
      } else {
        resolve();
      }
    });
  }

  checkDiferido() {
    //const ahora = AppStore.appStaticInfo.getServerTime();
    //const ms_now = ahora.getTime();
    //const time2live = AppStore.yPlayerCommon.getTime2Live();
    const indexEvento = this.getIndexEvento(this._epg_channel);
    if (indexEvento >= 0) {
      const evento = this._epg_channel[indexEvento];
      const controlado = evento.Titulo
        ? evento.Titulo.toUpperCase() == "CONTENIDO PROTEGIDO POR CONTROL PARENTAL"
        : false;
      const disponible = AppStore.appStaticInfo.getTVModelName() === "iptv2" ? true : evento.Disponible;
      const allowed = evento ? ControlParentalMng.instance.isContentAllowed(evento) : true;
      if (controlado || !disponible || !allowed) {
        AppStore.yPlayerCommon.stop(false);
        if (self._subtitulos_play > 0) Tratasrt.stopSubtitles();
        this.isErrorShowing = true;

        if (controlado) {
          AppStore.errors.showError(this, "player-view", "TV", "I_TV_2", false);
        } else {
          AppStore.errors.showError(this, "player-view", "TV", "I_TV_1", false);
        }
      }
    }
  }

  addPlayerFlyer(wrap) {
    this.opts.playerFlyer = new PlayerFlyerComponent(wrap);
    this.opts.playerFlyer.init();
  }

  // oculta el flyer cuando hay interacción del usuario antes de que pase el tiempo para ocultarse
  hidePlayerFlyer() {
    if (this.opts.playerFlyer) this.opts.playerFlyer.destroy();
  }

  async onPlayingContent() {
    if (ViewMng.instance?.active?.type === "popup" && ViewMng.instance.active?.opts?.popupId?.id === "I_PLA_3") {
      await PlayMng.player.stopPlayer();
    }
    debug.alert(`this.onPlayingContent firstTime ${this.opts.firstTime}`);
    debug.alert(`AppStore.yPlayerCommon.backgroundMode() ${AppStore.yPlayerCommon.backgroundMode()}`);
    debug.alert(`this._reproducir_desde_inicio ${this._reproducir_desde_inicio}`);
    if (this._mode === 1 && this._reproducir_desde_inicio) {
      this.verInicio();
      this._reproducir_desde_inicio = false;
      return;
    }
    if (
      (this.opts.firstTime && !PlayMng.instance.epgMode && !AppStore.yPlayerCommon.backgroundMode()) ||
      this.isCurrentChannelApplication()
    ) {
      this.opts.firstTime = false;
      this.setPlayerSetup();
      this.createComponents();
      this.opts.isPlayerFlyer = true;
      if (!AppStore.yPlayerCommon.isVideoPlaza) {
        AdsMng.instance.setMidrolls();
      }
      AppStore.yPlayerCommon.hideSpin();
    }

    if (!PlayMng.instance.epgMode && !AppStore.yPlayerCommon.backgroundMode()) {
      if (this.parentalAllowed()) {
        this.hideNotAllowed();
        AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.PLAYING);
        if (
          AppStore.yPlayerCommon.isLive() &&
          !AppStore.yPlayerCommon.isDiferido() &&
          AppStore.appStaticInfo.getTVModelName() === "iptv2"
        ) {
          this.updateProgressBar();
        }
      } else {
        if (!this.opts.firstTime) this.createComponents();

        // Force stop
        AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.STOPPED);
        await PlayMng.player.stopPlayer();
        this.showNotAllowed();
        this.ShowController.firstFrameWasPlayed = true;
        // BackgroundMng.instance.hide_full_background();
      }
    } else {
      AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.PLAYING);
    }
    // Instanciación del miniVod para lanzar y ver
    if (AppStore.M360Mng.isPlayerFlyer) {
      const playerWrap = ViewMng.instance.active.wrap[0];
      if (playerWrap && this.opts.isPlayerFlyer) {
        this.addPlayerFlyer(playerWrap);
      }
      AppStore.M360Mng.isPlayerFlyer = false;
    }
  }

  getTime() {
    return this._time;
  }

  getSessionTime() {
    return this._time;
  }

  getTotalTime() {
    return this._totalTime;
  }

  setTotalTime(totaltime) {
    this._totalTime = totaltime;
    const totalHour = Math.floor(totaltime / 3600000);
    if (totalHour > 0) this._showHour = true;
    else this._showHour = false;
    this._totalTimeTxt = Utils.time2Text(totaltime, this._showHour);
  }

  updateProgressBar(time) {
    const playerInfoComp = this.opts.playerInfoComp || { updateProgressBar: NO_FUNCTION };
    playerInfoComp.updateProgressBar = playerInfoComp.updateProgressBar || NO_FUNCTION;
    const isAdPaused = AppStore.yPlayerCommon.isVideoPlaza && AppStore.yPlayerCommon.isPaused();
    if (isAdPaused || !this.opts.playerInfoComp) return;
    let progressThumbs = 0;
    if (
      this.opts.playerTrickModesComp &&
      this.activeComponent === this.opts.playerTrickModesComp &&
      this.opts.playerTrickModesComp.isThumbnailsMode
    ) {
      // Si estamos en trick modes thumbnails mostramos posición futura
      progressThumbs = this.opts.playerTrickModesComp.getThumbsProgress();
    }

    playerInfoComp.updateProgressBar(time, progressThumbs);
  }

  setTimeBookmark() {
    let i_bookmark_set = parseInt(AppStore.wsData._bookmark_set);
    if (i_bookmark_set === 0) {
      i_bookmark_set = 1;
    }
    if (i_bookmark_set > 0) {
      if (AppStore.yPlayerCommon._bookmarkNext == -1) {
        const bookmark_set = 1000 * i_bookmark_set;
        AppStore.yPlayerCommon._bookmarkNext = parseInt(this._time) + bookmark_set;
      } else {
        if (this._time > AppStore.yPlayerCommon._bookmarkNext) {
          this.savePuntoReproduccion(this._time);
          const bookmark_set = 1000 * i_bookmark_set;
          AppStore.yPlayerCommon._bookmarkNext = parseInt(this._time) + bookmark_set;
        }
      }
    }
  }

  setTime(time) {
    if (this.isVod && (!this._totalTime || isNaN(this._totalTime) || this._totalTime == 0)) return;

    //debug.alert('this.setTime = ' + time + ' ' + AppStore.yPlayerCommon.isPlaying());
    this._time = time;

    AppStore.yPlayerCommon.closeCheckNet();
    if (AppStore.yPlayerCommon.isVideoPlaza) {
      if (time >= this._totalTime) {
        if (this._totalTime < 600000) {
          adSection.videoCompleted("onbeforecontent");
        }
      } else {
        adTrack.trackQuartiles(time);
        this.updateProgressBar(time);
      }
    } else {
      /**
       * FIXME: Esto es un parche para que la detección de fin de stream para OTT.
       * Revisar si es necesario cuando integremos la rama de OTT
       */
      /*if (this.isVod && time > this._totalTime) {
        if (AppStore.appStaticInfo.getTVModelName() != "android.tv") this.delPuntoReproduccion();
        else {
          if (AppStore.wsData._bookmark_set >= 0) this.savePuntoReproduccion(time);
        }
        this.stop(true); // DETECCION DE FIN DE STREAM VIA COMPARACION DE TIEMPOS
      }*/
      if (
        AppStore.yPlayerCommon.isPlaying() ||
        AppStore.yPlayerCommon.getSkipState() === AppStore.yPlayerCommon.REWIND ||
        AppStore.yPlayerCommon.getSkipState() === AppStore.yPlayerCommon.FORWARD
      ) {
        if (!AppStore.yPlayerCommon.isSkipping() && !this.isPlayerScrollerActive) {
          this.setTimeBookmark();
        }
        this.updateProgressBar(time);

        this.exec_skipback();
        // Emitimos Eventos Playing (por ejemplo, binge watching lo evalúa)
        if (this.activeComponent !== this.opts.playerSlidersComp && !AppStore.yPlayerCommon.isVideoPlaza) {
          this.opts.eventBus.emit(PLAYER_REFS.EVENTOS.PLAYING);
        }
        if (
          !AppStore.yPlayerCommon.isVideoPlaza &&
          AppStore.yPlayerCommon.getSkipState() !== AppStore.yPlayerCommon.FORWARD
        ) {
          AdsMng.instance.checkMidrolls(this._time); // Check midrolls
        }
      }
    }
    AutoplayMng.instance.autoplay_check();
  }

  setPlayerSetup() {
    if (AppStore.yPlayerCommon.isAutoplay()) {
      this.hide();
      BackgroundMng.instance.show_background_veil_only();
    }
  }

  callback_startSession() {
    if (this.isVod) {
      this.loadPuntoReproduccion();
    } else {
      this.play(AppStore.yPlayerCommon._position);
    }
  }

  async loadPuntoReproduccion() {
    const playInfo = PlayMng.instance.opts?.playInfo;
    if (playInfo?.isBingeWatching) {
      ///
      /// Venimos desde un contenido anterior con bingeWatching
      /// Calculamos el punto de reproducción del contenido que vamos a reproducir obteniendo la info de sus segmentos
      ///
      const bingeMng = await AppStore.bingeWatching.init(
        this,
        this._asset,
        this._datos_editoriales?.BingeWatchingAction
      );
      let resume_time = 0;
      if (bingeMng.bingeWatchingStreamEvents) {
        const event_show = bingeMng.bingeWatchingStreamEvents.get_plot_event();
        const tiempo_inicial = 0;
        resume_time = event_show.startTime ? event_show.startTime : tiempo_inicial;
      }

      this.continuaReproduccion(resume_time);
    } else {
      if (
        !AppStore.login.isAnonimousUser() &&
        AppStore.yPlayerCommon.getMode() == 0 &&
        this._datos_editoriales != null &&
        !this._trailer
      ) {
        const id = this.get_id_by_catalog_item_type();
        const bookmark = unirlib.getMyLists().get_viewing_by_id(id, this._catalog_item_type);
        let playbackTimeMs = 0;

        if (bookmark && bookmark.timeElapsed) {
          playbackTimeMs = bookmark.timeElapsed * 1000;

          if (bookmark.catalogItemType === "LiveEpisode" && bookmark.startTime) {
            // Chequeamos si bookmark.startTime es distinto de details.HoraInicio.
            // En ese caso es cambio en la programación y hay que reajustar
            const horaInicio = parseInt(this._asset.HoraInicio);
            const startTime = Date.parse(bookmark.startTime);
            if (horaInicio !== startTime) {
              playbackTimeMs = playbackTimeMs - (horaInicio - startTime);
              const durationMs = this._asset.DuracionEnSegundos * 1000;
              if (playbackTimeMs < 0 || playbackTimeMs >= durationMs) {
                // Cuando el bookmark pertenece al anterior o siguiente programa se asigna 0 (ver de inicio)
                playbackTimeMs = 0;
              }
            }
          }
        }

        const hay_bookmarking = bookmark && !bookmark.isCompleted && bookmark.timeElapsed;
        if (hay_bookmarking && !this._extras_mode) {
          this.continuaReproduccion(playbackTimeMs);
        } else {
          this.continuaReproduccion(0);
        }
      }
    }
  }

  get_id_by_catalog_item_type() {
    const item_type = this._catalog_item_type?.toLowerCase();
    let id;
    if (item_type == "movie" || item_type == "episode" || item_type == "season" || item_type == "serie") {
      id = this._datos_editoriales.Id;
    } else if (item_type == "liveseason" || item_type == "liveseasonrecording") {
      id = this._datos_editoriales.SerialId;
    } else if (!id && this._asset) id = this._asset.ShowId;
    if (!id || id === "") id = this._datos_editoriales.Id ? this._datos_editoriales.Id : "";
    return id;
  }

  continuaReproduccion(avance) {
    debug.alert(`continuaReproduccion avance: ${avance} ms`);

    this._ultimo_avance = 0;
    if (AppStore.yPlayerCommon.getMode() == 0 && this._datos_editoriales != null && !this._trailer) {
      AppStore.yPlayerCommon._isChangingAudio = false;

      const haypunto = !this._extras_mode && avance !== null && avance !== undefined && avance > 1000;
      this._need_skipback =
        this._is_start_over || (this._catalog_item_type != "vod" && this.globalContext.u7d_rec_islive == "true");
      debug.alert(`this._need_skipback ${this._need_skipback}`);
      this._stream_is_over = false;

      if (haypunto && !this._reproducir_desde_inicio) {
        if (this._need_skipback) {
          this._skipback_done = false;
          this.play(0);
          this._skipback_ms = avance;
        } else {
          this._ultimo_avance = avance;
          this.play(avance);
          this._reproducir_desde_inicio = false;
        }
      } else {
        if (this._need_skipback) {
          this._skipback_done = false;
          this._skipback_ms = 0;
        }
        this.play(0);
      }

      if (!AppStore.yPlayerCommon.isAutoplay() && !PlayMng.player._onError && !AppStore.home.getPopupActive()) {
        AppStore.home.hide_home();
      }
    } else if (this._trailer) {
      this.play();
    }
  }

  #registerDetailSliderAudience(sliderType) {
    const audience = audienceManager.config["playerAction"][audienceManager.get_evt()];
    switch (sliderType) {
      case "similares":
        AppStore.tfnAnalytics.audience_navigation(audience, "ck_opt", { tab: "relatedContent" });
        break;
      case "episodios":
        AppStore.tfnAnalytics.audience_navigation(audience, "play_prod", { tab: "Episodes" });
        break;
    }
  }

  // Cargamos carrusel temporadas o relacionados de la ficha
  showDetailsSliders(sliderType) {
    ///
    /// Emitimos evento para informar que se van a mostrar sliders
    ///
    this.opts.eventBus.emit(PLAYER_REFS.EVENTOS.SHOW_SLIDERS);
    this.#registerDetailSliderAudience(sliderType);
    let urlFicha = null;
    if (this._datos_editoriales.TipoContenido == "Episodio") {
      if (!this._datos_editoriales.Contenedor || !this._datos_editoriales.Contenedor.Ficha) {
        return;
      } else {
        urlFicha = this._datos_editoriales.Contenedor.Ficha;
      }
      if (!urlFicha) return;
    }

    this.preparePlayerForSlider(sliderType);

    // Creamos una ficha invisible
    const wrapTemplate = String.raw`<div id="details-view" class="details-view"></div>`;
    this.opts.detailsSlidersWrap = jQuery(wrapTemplate).appendTo(this.opts.wrap);
    this.opts.detailsSliders = new DetailsView(this.opts.detailsSlidersWrap);
    this.opts.detailsSliders.setPath("", "");
    this.opts.detailsSliders.setPlayerMode();
    this.opts.detailsSliders.setPlayerSliderType(sliderType);

    // Seteamos variable global durante el player
    AppStore.home.set_details(this.opts.detailsSliders);

    if (this._datos_editoriales.TipoContenido == "Episodio") {
      //
      // El cambio a asincrono no afecta dado que el codigo siguiente no
      // requiere esperar por la finalizacion del init
      //
      this.opts.detailsSliders.init(urlFicha, false, false);
    } else {
      if (sliderType === "similares" && this._datos_editoriales?.autoplay) {
        //
        //  Para el caso de tipo de slider de SIMILARES y es una pelicula
        //  se aunula el autoplay para evitar que se reproduzca automaticamente
        //  cuando muestre los similares
        //
        this._datos_editoriales.autoplay = undefined;
      }
      this.opts.detailsSliders.saveDataPlayer(this._datos_editoriales);
    }
    const hint = i18next.t("settings.tv_back_icon");
    this.showHint(String.raw`<p class='tv-back'>${hint}</p>`);
  }

  hideDetailsSliders(hideAll = false) {
    ///
    /// Emitimos evento para informar que se van a ocultar sliders
    ///
    this.opts.eventBus.emit(PLAYER_REFS.EVENTOS.HIDE_SLIDERS);
    this.activeComponent = this.opts.playerActionsComp;

    if (this.opts.playerSlidersComp) {
      this.opts.playerSlidersComp.destroy();
      this.opts.playerSlidersComp = null;
    }
    if (this.opts.detailsSliders) {
      this.opts.detailsSliders.destroy();
      this.opts.detailsSliders = null;
    }

    this.hideHints();

    this.setGradient("gradient");

    if (!hideAll) {
      if (!this?.opts?.playerInfoComp) this.createComponents();
      this.opts.playerInfoComp.show();
      this.opts.playerInfoComp.showArrow();
      this.opts.playerInfoComp.showProgress();
      this.opts.playerActionsComp.show();
      if (this.opts.playerChannelsComp) this.opts.playerChannelsComp.show();
    } else {
      this.hide();
    }
  }

  isAudioSubCompVisible() {
    if (this.opts.playerAudioSubComp) {
      return this.opts.playerAudioSubComp.isVisible();
    } else {
      return false;
    }
  }

  resetAudioSubComponent() {
    if (!this.isAudioSubCompVisible()) {
      $(".player-audio-sub-comp").remove();
      this.opts.playerAudioSubComp = null;
      this.createAudioSubComponent();
    }
  }

  createAudioSubComponent() {
    if (!this.opts.playerAudioSubComp && !this.isHiddenMode()) {
      const playerAudioSubWrap = jQuery(
        '<div id="player-audio-sub-comp" class="player-audio-sub-comp"></div>'
      ).appendTo(this.opts.wrap);
      this.opts.playerAudioSubComp = new PlayerAudioSubComponent(playerAudioSubWrap);
      this.opts.playerAudioSubComp.init(this);
      this.addComponent(this.opts.playerAudioSubComp);
      AppStore.yPlayerCommon._audioOk = true;
      if (this.opts.m360ParamsPlayer.linkedDevice) {
        if (this.opts.m360ParamsPlayer.audio) PlayMng.instance.setCustomAudio(this.opts.m360ParamsPlayer.audio);
        if (this.opts.m360ParamsPlayer.subtitle)
          PlayMng.instance.setCustomSubtitle(this.opts.m360ParamsPlayer.subtitle);
      }
    }
  }

  // Mostrmos selector de audio y subtítulos
  showAudioSubtitulos() {
    if (!this.parentalAllowed()) return;
    ///
    /// Emitimos evento de visualización audio y subtitulos
    ///
    this.opts.eventBus.emit(PLAYER_REFS.EVENTOS.VER_AUDIO_SUBTITULOS);
    if (AppStore.yPlayerCommon.isVideoPlaza) return;
    AppStore.yPlayerCommon._audioOk = false;
    this.opts.playerAudioSubComp.show();
    this.showHint("<p class='tv-back'>Pulsa <span class='icon tv-back__icon'></span> para volver</p>");

    this.restartTimeoutHide();
    this.opts.playerInfoComp.hide();
    this.opts.playerInfoComp.hideArrow();
    this.opts.playerInfoComp.hideProgress();
    this.opts.playerActionsComp.hide();
    //this.opts.playerStreamEventsComp.hide();
    if (this.opts.playerChannelsComp) this.opts.playerChannelsComp.hide();
    if (this.opts.playerActionsDescComp) this.opts.playerActionsDescComp.hide();

    this.activeComponent = this.opts.playerAudioSubComp;
  }

  hideAudioSubtitulos(isExecutingFastForwardOrRewind = false) {
    ///
    /// Emitimos evento de finalización de visualización audio y subtitulos
    ///
    this.opts.eventBus.emit(PLAYER_REFS.EVENTOS.VER_AUDIO_SUBTITULOS_OFF);

    AppStore.yPlayerCommon._audioOk = false;
    this.activeComponent = this.opts.playerActionsComp;

    this.hideHints();
    if (!this.opts.isShowingPlayerInfo) {
      this.hide();
    } else {
      this.opts.playerAudioSubComp.hide();
      this.opts.playerInfoComp.show();
      this.opts.playerInfoComp.showArrow();
      this.opts.playerInfoComp.showProgress();
      if (!isExecutingFastForwardOrRewind) this.opts.playerActionsComp.show();
      if (this.opts.playerChannelsComp) this.opts.playerChannelsComp.show();
      if (this.opts.playerInfoComp.isMore) {
        this.opts.playerInfoComp.opts.elems["content_desc"].css("opacity", 1);
        this.opts.playerInfoComp.hideMore();
        this.activeComponent = this.opts.playerInfoComp;
      }
    }
  }

  exec_skipback() {
    if (this._need_skipback && !this._skipback_done) {
      debug.alert("this.exec_skipback _need_skipback...");
      if (this._totalTime != 0) {
        this._skipback_done = true;
        let skip_s = 0;
        if (this._skipback_ms == 0) skip_s = this._totalTime / 1000;
        else skip_s = (this._totalTime - this._skipback_ms) / 1000;
        debug.alert(`this.exec_skipback skipBackwardLiveSec... skip_s ${skip_s} s`);
        PlayMng.player.skipBackwardLiveSec(skip_s);
        AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.BUFFERING);
        this.show();
      }
    }
  }

  // STREAM EVENTS
  start_new_stream_events() {}

  check_stream_events() {}

  createStreamEventButton(bingeEventId) {}

  createGoLiveButton() {
    if (AppStore.yPlayerCommon.isVideoPlaza) return;
    //const skipState = AppStore.yPlayerCommon.getSkipState();
    if (
      this.opts.playerActionsComp &&
      this.opts.playerStreamEventsComp &&
      !this.opts.playerStreamEventsComp.hasButton() &&
      !this.isAudioSubCompVisible()
    ) {
      this.opts.playerStreamEventsComp.createButton();
      this.opts.playerStreamEventsComp.left = this.opts.playerActionsComp;
      this.opts.playerStreamEventsComp.up = this.opts.playerInfoComp;
      this.opts.playerActionsComp.right = this.opts.playerStreamEventsComp;
    }
  }

  removeGoLiveButton() {
    if (this._mode === 1 && this.opts?.playerStreamEventsComp?.hasButton() && this.opts?.playerActionsComp) {
      this.opts.playerStreamEventsComp.left = null;
      this.opts?.playerStreamEventsComp?.removeButton();
      this.opts.playerActionsComp.right = null;
      if (!this.opts.playerInfoComp?.isPrograms && !this.opts.playerInfoComp?.isMore) {
        this.activeComponent = this.opts.playerInfoComp;
      }
    }
  }

  createBingeWatching() {}

  removeBingeWatching() {}

  ckeck_binge_events_done_available() {}

  destroyPlayerComponents() {
    const componentNames = ["playerInfoComp", "playerActionsComp", "playerChannelsComp"];
    componentNames.forEach((componentName) => {
      const component = this.opts[`${componentName}`];
      if (component) {
        component.destroy();
        this.opts[`${componentName}`] = null;
      }
    });
  }

  destroyAllPlayerComponents() {
    const componentNames = [
      "playerActionsComp",
      "playerActionsDescComp",
      "playerAudioSubComp",
      "playerChannelsComp",
      "playerFlyer",
      "playerInfoComp",
      "playerSlidersComp",
      "playerStatusComp",
      "playerTrickModesComp",
    ];
    componentNames.forEach((componentName) => {
      const component = this.opts[`${componentName}`];
      if (component) {
        component.destroy();
        this.opts[`${componentName}`] = null;
      }
    });
    this.opts.no_components = true;
  }

  /**
   * Función que elimina del wrap de la player-view los componentes, hay dos player-actions-comp (miniguía)
   */
  removePlayerComponents() {
    const componentIds = [
      "player-status-comp",
      "player-info-comp",
      "player-actions-comp",
      "player-actions-comp",
      "player-channels-comp",
      "player-audio-sub-comp",
      "player-fanart-comp",
      "player-timer",
    ];
    componentIds.forEach((componentId) => {
      const component = document.getElementById(componentId);
      if (component) {
        component.remove();
      }
    });
  }

  async verNext() {
    try {
      await this._following_mng.calculateNextEpisode(this._datos_editoriales.Id);
      await this.playNext();
    } catch (error) {
      console.warn(`verNext:error`, error);
    }
  }

  async playNext() {
    try {
      const episode = this._following_mng.get_next_episode();
      const playInfo = PlayMng.instance.getPlayInfo(episode.data, episode.status);
      playInfo.buttonPlayerNext = true;
      playInfo.desdeInicio = false;
      setTimeout(() => {
        AppStore.yPlayerCommon.setAutoplay(false);
        this.savePuntoReproduccion(this._time);
        if (this._datos_editoriales?.TipoContenido === "Episodio") {
          this.reload_seguimiento();
        }
      }, 1000);
      PlayMng.instance.play(playInfo, this.origin);
    } catch (error) {
      console.warn(`playNext:error`, error);
    }
  }

  /**
   * Reproduce el contenido que pasamos por parámetro
   * @param {Object} content Contenido a reproducir
   * @param {Number} resumeTime Tiempo de inicio
   */
  async playNextContent(content, resumeTime) {
    try {
      const dataContent = content.data || content;
      const config = PlayMng.instance.getPlayInfo(dataContent, content.status);
      config.resumeTime = resumeTime;
      config.autoplay = false;
      config.isBingeWatching = true;
      ///
      /// Lanzamos un stop previo del contenido anterior al que vamos a lanzar (en Binge Watching)
      ///
      await AppStore.yPlayerCommon.onlyStop();

      ///
      /// Ocultamos los controles del player en el primer frame de reproducción
      ///

      ///
      /// Traza de contenido a reproducir
      ///
      console.info(
        `%c[Binge Watching]%c Datos del contenido a reproducir (BEGIN)`,
        "color: white; background: blue;",
        ""
      );
      console.info(JSON.stringify(config));
      console.info(
        `%c[Binge Watching]%c Datos del contenido a reproducir (END)`,
        "color: white; background: blue;",
        ""
      );

      await PlayMng.instance.play(config, this.origin);
    } catch (error) {
      console.warn(`playNextContent:error`, error);
    }
  }

  setChannel(channel) {
    if (!PipMng.instance.isActive) AppStore.PinMng.resetPinScaped();
    this._channel = channel;
    this._mode = 1;
    this.loadChannelEpg(channel);
    this.copy = null; // Borramos copia temporal para no sobreescribir el canal seteado
    this.setUrlTS(channel.PuntoReproduccion);
    DialMng.instance.setNewDial(channel.dialNumber);

    //
    // Si es un cana live ya el first frame ha pasado
    //
    this.ShowController.firstFrameWasPlayed = true;
  }

  getCurrentChannel() {
    return this._channel;
  }

  /**
   * Devuelve el programa en curso si existe. de lo contarrio devuelve un objeto
   * vacio
   *
   * @returns {object}
   */
  getCurrentProgram() {
    if (this._epg_channel && this._epg_channel[this._eventoEnCurso]) {
      return this._epg_channel[this._eventoEnCurso];
    }
    return {};
  }

  /**
   * Función que calcula el programa DVBIPI que se está emitiendo, según la hora actual (NOW)
   */
  getCurrentProgramOfNow() {
    const indexEvento = this.getIndexEvento(this._epg_channel);
    return indexEvento !== -1 ? this._epg_channel[indexEvento] : {};
  }

  getchUID() {
    let result = "";
    if (this._channel != null) result = this._channel.ServiceUid;
    return result;
  }

  getChannelPref() {
    let isPreferential = false;
    if (this._channel != null) isPreferential = this._channel.isPreferential;
    return isPreferential ? 1 : 0;
  }

  resetChannels() {
    this._channels = null;
  }

  loadChannels() {
    if (!this._channels) {
      const hay_canales = AppStore.channelsMng.isChannelsAvailable;
      if (!hay_canales) return;
      this._channels = [];
      const { channels } = AppStore.channelsMng;
      for (let i = 0; i < channels.length; i++) {
        if (channels[i].type != "enlace" && AppStore.channelsMng.isAvailableChannel(channels[i])) {
          this._channels.push(channels[i]);
        }
      }
    }
  }

  loadChannelLogoVOD() {
    let logo_url,
      innerLogo = "";
    if (this._asset != null && (this._asset.AssetType == "NPVR" || this._asset.AssetType == "U7D")) {
      if (this._asset.Canal != null && typeof this._asset.Canal.getUrlLogo === "function") {
        logo_url = this._asset.Canal.getUrlLogo("bg_dark");
      }
      if (logo_url) {
        innerLogo = `<div id="canal" class="canal"><img id="canal-img" class="canal-img" src="${logo_url}"/></div>`;
      }
      if (!this.opts.playerOneChannelWrap) {
        this.opts.playerOneChannelWrap = jQuery('<div id="player-one-channel" class="player-one-channel"></div>');
        this.opts.playerOneChannelWrap.appendTo(this.opts.wrap);
      }
      this.opts.playerOneChannelWrap.html(innerLogo);
      this.showChannelLogoVOD();
    }
  }

  showChannelLogoVOD() {
    if (this.opts.playerOneChannelWrap) {
      this.opts.playerOneChannelWrap.removeClass("hide");
    }
  }

  hideChannelLogoVOD() {
    if (this.opts.playerOneChannelWrap) {
      this.opts.playerOneChannelWrap.addClass("hide");
    }
  }

  hideChannelLogos() {
    this.hideChannelLogoVOD();
    if (this.opts.playerChannelsComp) {
      this.opts.playerChannelsComp.hide();
    }
  }

  showChannelLogos() {
    this.showChannelLogoVOD();
    if (this.opts.playerChannelsComp) {
      this.opts.playerChannelsComp.show();
    }
  }

  /**
   * Devuelve los canales disponibles
   *
   * @returns {any[]}
   */
  getChannels() {
    this.loadChannels();
    return this._channels;
  }

  loadChannelEpg(channel) {
    //
    //  Hay casos que channel no es un dvbipi y no tiene
    //  getChannelId como funcion, por lo tanto se usa
    //  la propiedad channelId que viene del objeto
    //
    let { channelId } = channel;
    if (typeof channel.getChannelId === "function") {
      channelId = channel.getChannelId();
    }

    if (this.opts.isOnOverChannel && channelId !== this.opts.isOnOverChannel) return;

    if (AppStore.appStaticInfo.getTVModelName() === "iptv2") {
      const programsEPG = AppStore.channelsMng.getEpg(channelId);
      if (programsEPG) {
        this.setChannelEpg(programsEPG);
      } else {
        LoaderMng.instance.hide_loader();
      }
      return programsEPG;
    } else {
      return this.loadChannelEpgByHttp(channel);
    }
  }

  loadChannelEpgByHttp(channel = null) {
    const self = this;

    const query = AppStore.wsData.getURLTkservice("tfgunir/EPG", "guiaTV");
    let url_epg = query.url;
    url_epg = url_epg.replace("{PROFILE}", AppStore.login.getProfile());
    // FILTROS CONTROL PARENTAL
    const filtroNivelMoral = AppStore.preferences.getFiltroNivelMoral();
    const filtroClasificado = AppStore.preferences.getFiltroClasificado();
    if (filtroNivelMoral != "") url_epg = url_epg.replace("{NMI}", filtroNivelMoral);
    if (filtroClasificado != "") url_epg = url_epg.replace("{true/false}", filtroClasificado);

    let cod_canal = "";
    if (channel) this._channel = channel;

    cod_canal = this._channel.CodCadenaTv;
    url_epg = url_epg.replace("{CHANNEL}", cod_canal);

    // Cargamos 24 horas de epg para el canal (-12h +12h con la hora actual)
    const now = this.getFechaInicio();
    const now_ms = now.getTime();
    const ms_back = 12 * 3600 * 1000;

    const back_hours = now_ms - ms_back;
    const date_b2h = new Date(back_hours);
    const jdate = Utils.formateDateTime(date_b2h);

    url_epg = url_epg.replace("{DATETIME}", jdate);
    url_epg = url_epg.replace("{DURATION}", "0.24:00:00");

    url_epg = url_epg.replace("+", "%2B");

    const network = AppStore.profile.get_network();
    if (network && network != "") {
      url_epg = url_epg.replace("{network}", network);
    } else {
      url_epg = url_epg.replace("&network={network}", "");
    }

    const suscripcion = AppStore.profile.get_suscripcion();
    if (suscripcion && suscripcion != "") url_epg = url_epg.replace("{suscripcion}", suscripcion);

    return new Promise((resolve, _reject) => {
      Utils.ajax({
        method: "GET",
        url: url_epg,
        retryLimit: query.retries,

        success(data, status, xhr) {
          try {
            const json_data = JSON.parse(xhr.responseText);
            self.setChannelEpg(json_data);
            resolve();
          } catch (e) {
            debug.alert(`ERROR CARGA EPG ${e.toString()}`);
            resolve();
          }
        },
        error(xhr, textStatus, _errorThrown) {
          if (textStatus == "timeout") {
            this.retryLimit--;
            if (this.retryLimit >= 0) Utils.ajax(this);
            else {
              debug.alert("Error timeout epg");
              LoaderMng.instance.hide_loader();
              resolve();
            }
          } else {
            debug.alert("Error carga epg");
            LoaderMng.instance.hide_loader();
            resolve();
          }
        },
        timeout: query.timeout,
      });
    });
  }

  async loadChannelEpgByDvbipi(channel = null) {
    //const self = this;
    // Cargamos 24 horas de epg para el canal (-12h +12h con la hora actual)
    const now = this.getFechaInicio();
    const now_ms = now.getTime();
    const ms_back = 12 * 3600 * 1000;

    const back_hours = now_ms - ms_back;
    const date_b2h = new Date(back_hours);
    const jdate = Utils.formateDateTime(date_b2h);
    const duration = 24; //Cargamos 24 horas
    let channelId = "";
    if (!channel) {
      channel = this._channel || PlayMng.instance.getBackgroundChannel();
    }
    if (!channel) {
      console.warn("PlayerView.loadChannelEpgByDvbipi: No channel found");
      return;
    }

    channelId = channel.getChannelId();

    let programsEPG = null;
    programsEPG = await Main.getProgramsEPG(jdate, duration, channelId);
    //ROVI Hack para simular la reproducción de programas FAKE en un canal
    const channelsDisabled = EpgMng.instance.getChannelsForcedAsNotAvailable();
    if (channelsDisabled.includes(channelId)) programsEPG = null;

    return programsEPG;
  }

  setChannelEpg(json) {
    this._epg_channel = [];
    this._eventoEnCurso = -1;
    if (json) {
      const dataObjs =
        AppStore.appStaticInfo.getTVModelName() === "iptv2"
          ? EpgMng.instance.prepareProgramsByDvbipi(json)
          : EpgMng.instance.prepareProgramsByHttp(json);
      //var ahora = AppStore.appStaticInfo.getServerTime();
      // Calulamos el indice del evento en curso y nos quedamos con los X anteriores y Z posteriores
      const indexEvento = this.getIndexEvento(dataObjs);
      const isSameEvent =
        this._eventoId !== undefined &&
        dataObjs[indexEvento] !== undefined &&
        dataObjs[indexEvento].Id !== undefined &&
        dataObjs[indexEvento].Id === this._eventoId;
      // Fake refresco canal
      // if (dataObjs[indexEvento].Id===this._eventoId) indexEvento++;
      if (indexEvento === -1 || isSameEvent) return;

      let counter = 0;
      const numProgramOnLeft = this.getNumProgramMiniguideBySide("LEFT");
      const numProgramOnRight = this.getNumProgramMiniguideBySide("RIGHT");
      for (let i = indexEvento - numProgramOnLeft; i <= indexEvento + numProgramOnRight; i++) {
        if (i >= 0 && i < dataObjs.length) {
          this._epg_channel.push(dataObjs[i]);
          if (i === indexEvento) this._eventoEnCurso = counter;
          counter++;
        }
      }

      // Canales sin multicast no tienen streams, cancelamos timer de error y no los seteamos
      if (this.isFocusedChannelApplication()) {
        this.clearTimeoutListener();
        this._CasId = this.getCurrentProgram()?.getCanal().CasId;
        this._cdn = this.getCurrentProgram()?.getCanal().CDN;
        return;
      }

      if (this.getCurrentProgram()?.getCanal()) {
        if (this.getCurrentProgram()?.getCanal().PuntoReproduccion)
          this.setUrlTS(this.getCurrentProgram()?.getCanal().PuntoReproduccion);
        else {
          const cod = this._channel.CodCadenaTv;
          const ctxChannel = AppStore.channelsMng.getProfileChannel(cod);
          const channel = ctxChannel.ctxChannel;
          this.setUrlTS(channel.PuntoReproduccion);
        }
        this._CasId = this.getCurrentProgram()?.getCanal().CasId;
        this._cdn = this.getCurrentProgram()?.getCanal().CDN;
      } else {
        const cod = this._channel.CodCadenaTv;
        const ctxChannel = AppStore.channelsMng.getProfileChannel(cod);
        const channel = ctxChannel.ctxChannel;
        this.setUrlTS(channel.PuntoReproduccion);
        this._CasId = channel.CasId;
        this._cdn = channel.CDN;
      }
    } else {
      if (this._channel != null) {
        const cod = this._channel.CodCadenaTv;
        const ctxChannel = AppStore.channelsMng.getProfileChannel(cod);
        const channel = ctxChannel.ctxChannel;
        this.setUrlTS(channel.PuntoReproduccion);
        this._CasId = channel.CasId;
        this._cdn = channel.CDN;
      }
    }
  }

  prepareChannelEpg(jsonEvent) {
    let objProgram = {};
    if (AppStore.appStaticInfo.getTVModelName() === "iptv2") {
      objProgram = new programEpgDvbipi(jsonEvent);
    } else {
      objProgram = new programEpgHttp(jsonEvent);
    }
    return objProgram;
  }

  getIndexEvento(json, time = null) {
    let date_ms;
    if (time) {
      date_ms = time;
    } else {
      const ahora = AppStore.appStaticInfo.getServerTime();
      date_ms = ahora.getTime();
      if (AppStore.yPlayerCommon.isDiferido()) {
        const ms_now = ahora.getTime();
        const time2live = AppStore.yPlayerCommon.getTime2Live();
        date_ms = ms_now - time2live;
      }
    }
    let i = 0;
    let en_horario = false;
    while (json && json[i] && !en_horario) {
      const hora_inicio_ms = json[i].FechaHoraInicio;
      const hora_fin_ms = json[i].FechaHoraFin;
      en_horario = hora_inicio_ms < date_ms && date_ms < hora_fin_ms;
      if (en_horario) return i;
      i++;
    }
    return -1;
  }

  getFechaInicio() {
    const ahora = AppStore.appStaticInfo.getServerTime();
    const ms_now = ahora.getTime(); // milisegundos del momento actual
    let ms_init = ms_now; // milisegundos del inicio

    const cociente = 15 * 60 * 1000; // 15 minutos
    const resto = ms_now % cociente; // resto para la aproximacion
    const medio = 15 * 60 * 500; // 7,5 minutos
    if (resto < medio) ms_init = ms_init - resto;
    else ms_init = ms_init + (cociente - resto);

    const initdate = new Date(ms_init);

    return initdate;
  }

  hasRelacionados() {
    let hasRel = false;
    const links = this._datos_editoriales?.links;

    if (!links) {
      hasRel = false;
    } else if (links) {
      for (let i = 0; i < links.length; i++) {
        const rel = links[i].rel.toUpperCase();
        if (rel === "SIMILARS" || rel === "PERFORMERS2" || rel === "TAGS2" || rel === "EXTRAS") {
          hasRel = true;
        }
      }
    }
    return hasRel;
  }

  refreshRecordings() {
    if (
      (!this.opts.playerActionsComp && !this.isCurrentChannelApplication()) ||
      this.isFocusedChannelApplication() ||
      this.isCurrentSOLiveContentFinished()
    ) {
      return;
    }

    let evento = this.getCurrentProgram();
    const isMainProgram = this.opts.playerInfoComp ? this.opts.playerInfoComp.getIsMainProgram() : true;

    if (!isMainProgram || !evento) {
      evento = this.opts.playerInfoComp.getProgramActive();
    }
    const es_grabacion_individual = unirlib.getMyLists().estaRecordinglist(evento.ShowId);
    if (es_grabacion_individual) {
      if (isMainProgram && this.opts.playerActionsComp)
        this.opts.playerActionsComp.updateButton("grabar", "dejardegrabar");
      this.opts.playerActionsDescComp.updateButton("grabar", "dejardegrabar");
      this.opts.playerInfoComp.updateInfoRedDot(true);
    } else {
      if (isMainProgram && this.opts.playerActionsComp)
        this.opts.playerActionsComp.updateButton("dejardegrabar", "grabar");
      this.opts.playerActionsDescComp.updateButton("dejardegrabar", "grabar");
      this.opts.playerInfoComp.updateInfoRedDot(false);
    }
    this.opts.playerInfoComp.updateRecordingsPrograms();
  }

  isFavorite() {
    if (!this.opts.playerActionsDescComp) return;
    const details = this.opts.detailsTemporal || this.opts.details;
    if (!details) return;
    const id = details.get_content_id();
    const item_type = details.get_item_type();
    const esta = unirlib.getMyLists().esta_favorito(id, item_type);
    return esta;
  }

  refreshFavorites() {
    const esta = this.isFavorite();
    if (esta === undefined) return;
    if (!esta) {
      this.opts.playerActionsDescComp.updateButton("del_favoritos", "add_favoritos");
    } else {
      this.opts.playerActionsDescComp.updateButton("add_favoritos", "del_favoritos");
    }
  }

  async showU7d() {
    this._player_background = true;

    const submenu = unirlib.getSubmenuById("portada_miniguia_u7d");
    if (submenu) {
      const element = await mapEnlace(submenu, null);
      const activeType = element.type;
      const [epg_channel] = this._epg_channel;
      const cod_cadena_actual = epg_channel?.getCanal().CodCadenaTv;
      switch (activeType) {
        case "coleccion_horizontal":
        case "coleccion_vertical":
          PipMng.instance.hidePipChannel(true);
          PipMng.instance.stopPip();
          this.hide();
          AppStore.home.show_home_wrap();
          BackgroundMng.instance.show_full_background();
          BackgroundMng.instance.hide_bg_image();

          element.query.url = element.query.url.replace("{channel}", cod_cadena_actual);
          AppStore.home.load_grid(element);
          ViewMng.instance.viewType("grid").origin = "player-view";
          ViewMng.instance.viewType("grid").set_direct_title(element.title);
          break;
      }
    }
  }

  showEpg() {
    const programActiveIndex = this.opts.playerInfoComp.opts.programActive;
    AppStore.home.load_epg(this._channel.CodCadenaTv, "player-view", null, programActiveIndex);
  }

  checkVerInicio() {
    if (this._reproducir_desde_inicio) {
      this._reproducir_desde_inicio = false;
      const evento = this.getCurrentProgram();
      const ahora = AppStore.appStaticInfo.getServerTime();
      const hora_actual = ahora.getTime();
      const difInicio = parseInt(hora_actual) - parseInt(evento.FechaHoraInicio);
      AppStore.yPlayerCommon.setTime2Live(difInicio);
    }
  }

  async verInicio(evento = null, fromButton) {
    if (!this.parentalAllowed()) return;

    ///
    /// Emitimos evento al reproducir desde el inicio
    ///
    this.opts.eventBus.emit(PLAYER_REFS.EVENTOS.VER_INICIO);

    console.warn("verInicio", evento, this._mode);
    if (!evento && this.isVod) {
      // VER INICIO en los contenidos Unicast (VOD, PASES, GRABACIONES, U7D)
      const button = audienceManager.config.keyCodeName[KeyMng.instance.lastKeyCode];
      AppStore.tfnAnalytics.audience_navigation("playerOut", "play_prod-01", { button, position: 0 });
      if (!["u7d"].includes(this.get_content_type()?.toLowerCase())) {
        this._verInicioUnicast(fromButton);
      } else {
        // Si es un PASE o un evento de EPG, ya está la fuente necesaria en this._datos_editoriales
        const fuente =
          this._datos_editoriales.Pases?.length > 0 ? this._datos_editoriales.Pases[0] : this._datos_editoriales;
        const isPlayAllowed = PlayMng.instance.isPlayAllowed(fuente, "start-over");
        if (isPlayAllowed.enabled) {
          this._verInicioUnicast(fromButton);
        } else {
          //TODO una vez verificado su lógica, podríamos quitar este "debug.alert"
          debug.alert("Está desactivado el 'start-over'");
        }
      }
    } else {
      this.setIsStartOverFromEpg(!ViewMng.instance.isPlayerActive());
      if (evento === null) {
        evento = this.getCurrentProgram();
      }
      if (this.opts.playerInfoComp?.isMore && this._epg_channel[0]) {
        this.setChannel(this._epg_channel[0].getCanal());
      }
      if (ControlParentalMng.instance.checkPINForAdultContent(evento, evento?.getCanal())) {
        const response = await AppStore.PinMng.init();
        if (
          response.eventName === AppStore.PinMng.status.PIN_KO_BACK ||
          response.eventName === AppStore.PinMng.status.PIN_KO
        ) {
          const originView = this.originIsEpg ? ViewMng.instance.viewType("epg") : ViewMng.instance.lastView;
          originView.show();
          return false;
        } else if (response.eventName === AppStore.PinMng.status.PIN_OK) {
          // PIN parental ya validado, no lo mostramos de nuevo al hacer parentalCheck() al reproducir
          AppStore.PinMng.enabled = false;
        }
      }
      const ahora = AppStore.appStaticInfo.getServerTime();
      const hora_actual = ahora.getTime();
      const difInicio = parseInt(hora_actual) - parseInt(evento.FechaHoraInicio + AppStore.yPlayerCommon._position);
      AppStore.yPlayerCommon.setTime2Live(difInicio);
      if (AppStore.yPlayerCommon.isLive() && AppStore.yPlayerCommon.isDiferido()) {
        //auditar
        let trigger = "button_restart";
        const key = KeyMng.instance.lastKeyCode;
        if (key === ykeys.VK_YELLOW) trigger = "button_yellow";
        const fuente = PlayMng.instance.opts?.playerView?._datos_editoriales;
        AppStore.tfnAnalytics.audience_navigation("playerOut", "stop_stoverp", { trigger }, fuente);
        PlayMng.instance.opts.playInfo.startOver = true;
        AppStore.tfnAnalytics.audience_navigation("playerOut", "start_stoverp", { trigger }, fuente);
        const hasToResume = AppStore.yPlayerCommon.isSkipping() || AppStore.yPlayerCommon.isPaused();
        await PlayMng.player.seek(0);
        if (hasToResume) await this.resetStateAndResume();
      } else {
        const difFin = parseInt(hora_actual) - parseInt(evento.FechaHoraFin);

        const time2live = AppStore.yPlayerCommon.getTime2Live();
        let link = null;
        if (time2live >= this._totalTime || !appConfig.BUFFER_LIVE_ENABLED) {
          // Rewind con catch-up / start-over
          let linkType = "start-over";
          let fuente = {};
          if (difFin > 0) {
            // TODO: considerar un tiempo de guarda?
            linkType = "catch-up";
            // Cargamos details evento seleccionado
            const details = await this._detailsController.loadDetails(evento).catch(() => {});
            fuente = details.Pases[0];
            const { links } = fuente;
            link = get_link_related(links, linkType);
            PlayMng.instance?.opts?.playInfo ? (PlayMng.instance.opts.playInfo.startOver = false) : null;
          }
          await this.verDiferido(evento, difInicio, linkType, link, fuente).catch((_error) => {});
          if (PlayMng.instance?.opts?.playInfo && linkType === "start-over")
            PlayMng.instance.opts.playInfo.startOver = true;
        } else {
          if (difInicio < 0) {
            this._showFutureContentPopUp(evento?.FechaHoraFin);
          }
          // Rewind usando el buffer
          AppStore.yPlayerCommon.skipBackwardLiveSec(difInicio);
        }
      }
      if (this.opts.playerStatusComp) {
        const status = AppStore.yPlayerCommon._position === 0 ? "goinit" : "play";
        this.opts.playerStatusComp.setScreenStatus(status);
      }
    }
  }

  _showFutureContentPopUp(horaFinEvento) {
    const horaFin = new Date(horaFinEvento);
    const isTodayOrTomorrow = isToday(horaFin) || isTomorrow(horaFin);
    const dateFormatArray = isTodayOrTomorrow ? ["day", "hour"] : ["day", "month"];
    const dateObject = getDateValues(horaFin, dateFormatArray);
    let texto;
    if (isTodayOrTomorrow) {
      texto = i18next.t("date.day_at_hour", {
        day: dateObject.day,
        hour: dateObject.hour,
      });
    } else {
      texto = `${i18next.t("date.the_day")} ${i18next.t("date.day_on_month", {
        day: dateObject.day,
        month: dateObject.month,
      })}`;
    }
    ModalMng.instance.showPopup("aviso-contenido-futuro-disponible", null, null, texto.toLowerCase());
  }

  /**
   * Función que ejecuta el VER DESDE INICIO en los contenidos Unicast (VOD, PASES, GRABACIONES, U7D)
   */
  async _verInicioUnicast() {
    const hasToResume = AppStore.yPlayerCommon.isSkipping() || AppStore.yPlayerCommon.isPaused();
    PlayMng.player.seek(0);
    if (hasToResume) await this.resetStateAndResume();
    AppStore.yPlayerCommon._position = 0;
    this.opts.playerStatusComp.setScreenStatus("goinit");
    this.updateProgressBar(0);

    if (AppStore.yPlayerCommon.isPaused()) this.play();
    if (!AppStore.yPlayerCommon.isVideoPlaza) AdsMng.instance.setMidrolls();
  }

  async verDiferido(evento = null, dif2Live = 0, linkType = "time-shifting", link = null, fuente = {}) {
    if (!evento) evento = this.getCurrentProgram();
    console.warn("verDiferido", evento, dif2Live, linkType, link, fuente);

    const isPlayAllowed = PlayMng.instance.isPlayAllowed(evento, linkType);
    if (!isPlayAllowed.enabled) {
      if (linkType != "start-over" && linkType != "catch-up") {
        ModalMng.instance.showPopup(isPlayAllowed.errorCode);
      } else {
        const channel = evento?.getCanal();
        if (channel && !this._reproducir_desde_inicio) {
          const playConfig = {
            channel,
            autoplay: false,
            origin: "HomeScene",
            desdeInicio: false,
            backgroundMode: false,
          };
          await PlayMng.instance.playChannel(playConfig);
        }
        //TODO una vez verificado su lógica, podríamos quitar este "debug.alert"
        debug.alert("Está desactivado el 'start-over'");
      }
    } else {
      if (dif2Live === 0) dif2Live = AppStore.yPlayerCommon.getTime2Live();

      // TODO: Sustituir por el nuevo marcado. playstart ya no existe
      //AppStore.tfnAnalytics.playerStart(linkType);

      this._eventoId = evento.ContentId;
      this._position = 0;

      try {
        await this.checkLink(linkType, link);
        if (linkType === "catch-up") {
          // Reset player view
          await this.reset();
          const playInfo = PlayMng.instance.getPlayInfoCatchUp(evento, AppStore.yPlayerCommon._urlTS, fuente);
          playInfo.showGoLive = false;
          playInfo.desdeInicio = this._reproducir_desde_inicio;
          AppStore.yPlayerCommon.setIsDiferido(true, linkType);
          PlayMng.instance.play(playInfo, this.origin);
        } else {
          this.removePipButton();
          await PlayMng.instance.playChangeStream();
          if (this._position > 0) {
            AppStore.yPlayerCommon._position = this._position * 1000;
          }
          AppStore.yPlayerCommon.setIsDiferido(true, linkType);
          AppStore.yPlayerCommon.setTime2Live(dif2Live);
          this.startPlaying();
        }
      } catch (error) {
        debug.alert("ERROR: No start-over / catch-up url found");
        await this.goBackByOrigin();
        this.showErrorLink(error);
        PlayMng.player._stateAfterPlay = -1;
      }

      //   resultPromise = new Promise(function (resolve, reject) {
      //     self
      //       .checkLink(linkType, link)
      //       .then(async function (_response) {
      //         if (linkType === "catch-up") {
      //           // Reset player view
      //           await self.reset();
      //           const playInfo = PlayMng.instance.getPlayInfoCatchUp(evento, AppStore.yPlayerCommon._urlTS, fuente);
      //           playInfo.showGoLive = false;
      //           PlayMng.instance.play(playInfo, self.origin);
      //         } else {
      //           self.opts.playerActionsComp.removeButton("pip");
      //           await PlayMng.instance.playChangeStream();
      //           if (self._position > 0) {
      //             AppStore.yPlayerCommon._position = self._position * 1000;
      //           }
      //           AppStore.yPlayerCommon.setIsDiferido(true, linkType);
      //           AppStore.yPlayerCommon.setTime2Live(dif2Live);
      //           self.startPlaying();
      //           //auditar
      //           AppStore.tfnAnalytics.player("start_stoverp", { evt: 2 });
      //         }
      //         resolve();
      //       })
      //       .catch(function (error) {
      //         debug.alert("ERROR: No start-over / catch-up url found");
      //         self.showErrorLink(error);
      //         PlayMng.player._stateAfterPlay = -1;
      //         reject();
      //       });
      //   });
      // }
      // return resultPromise;
    }
  }

  async verGrabacion(fuente, data, linkTypeContent = undefined, desdeInicio = false) {
    if (ControlParentalMng.instance.checkPINForAdultContent(data, fuente?.Canal)) {
      const response = await AppStore.PinMng.init();
      if (
        response.eventName === AppStore.PinMng.status.PIN_KO_BACK ||
        response.eventName === AppStore.PinMng.status.PIN_KO
      ) {
        return false;
      }
    }
    const linkType = linkTypeContent || "npvr";

    const isPlayAllowed = PlayMng.instance.isPlayAllowed(fuente, linkType);
    let resultPromise = null;
    if (!isPlayAllowed.enabled) {
      ModalMng.instance.showPopup(isPlayAllowed.errorCode);
      resultPromise = Promise.reject();
    } else {
      this._eventoId = fuente.ShowId;
      const self = this;
      self._position = 0;

      const link = get_link_related(fuente.links, linkType);
      resultPromise = new Promise((resolve, reject) => {
        self
          .checkLink(linkType, link)
          .then(async (_response) => {
            // Reset player view
            await self.reset();
            const playInfo = PlayMng.instance.getPlayInfoCatchUp(data, AppStore.yPlayerCommon._urlTS, fuente);
            playInfo.showGoLive = false;
            playInfo.desdeInicio = desdeInicio;
            PlayMng.instance.play(playInfo, self.origin);
            resolve();
          })
          .catch((error) => {
            debug.alert(`ERROR: No '${linkType}' url found`);
            self.showErrorLink(error);
            reject();
          });
      });
    }
    return resultPromise;
  }

  /**
   * @method
   * @name checkDetailsM360Content
   * @description M360. Lanzamiento StartOver con vista previa Player. Obtiene details del canal enviado
   */
  async checkDetailsM360Content(channel, linkType, link) {
    this.opts.m360ParamsPlayer = {
      linkedDevice: true,
      linkType,
    };
    if (link) this.m360ParamsPlayer.link = link;
    this.opts.m360ParamsPlayer.ischangeM360Detail = true;
    if (AppStore.M360Mng.opts.channel) this.opts.details = null;
    await this._detailsController.loadDetails(channel).catch(() => {});
  }

  /**
   * @method
   * @name getM360LinkContent
   * @description M360. Lanzamiento StartOver con vista previa Player. Obtiene link  para enviarlo al método ver_diferido
   */
  getM360LinkContent() {
    let links = null;
    const effectiveContent = this.opts.details.getEffectiveContent();
    const fuente = effectiveContent.fuente ? effectiveContent.fuente : null;
    if (fuente && fuente.links) {
      links = fuente.links;
    } else if (this.opts.details.Pases && this.opts.details.Pases[0] && this.opts.details.Pases[0].links) {
      links = this.opts.details.Pases[0].links;
    }
    if (!links) return Promise.reject();
    const link = get_link_related(links, this.opts.m360ParamsPlayer.linkType);
    return link;
  }

  /**
   * @method
   * @name loadM360DetailsContent
   * @description M360. Lanzamiento StartOver con vista previa Player. envía link startOver a M360
   */
  async loadM360DetailsContent() {
    const link = this.getM360LinkContent();
    AppStore.M360Mng.playStartOverFromPlayer(link);
  }

  async checkLink(linkType, link = null) {
    debug.alert(`checkLink:${linkType}`);
    let links = null;
    if (!link) {
      if (!this.opts.details || this.opts.details.getFuente()?.Canal?.channelId !== this._channel?.channelId) {
        const evento = this.getCurrentProgram();
        const details = await this._detailsController.loadDetails(evento).catch(() => {});
        if (!details) return Promise.reject();
      }
      const effectiveContent = this.opts.details.getEffectiveContent();
      const fuente = effectiveContent.fuente ? effectiveContent.fuente : null;
      if (fuente && fuente.links) {
        links = fuente.links;
      } else if (this.opts.details.Pases && this.opts.details.Pases[0] && this.opts.details.Pases[0].links) {
        links = this.opts.details.Pases[0].links;
      }
      if (!links) return Promise.reject();
      link = get_link_related(links, linkType);
    }

    const self = this;

    return new Promise((resolve, reject) => {
      Utils.ajax({
        method: "GET",
        url: link,
        need_token: AppStore.appStaticInfo.getTVModelName() === "iptv2",
        success(data, _status, _xhr) {
          const punto_reproduccion = data;
          if (punto_reproduccion) {
            if (linkType === "start-over") {
              self._position = 0;
            } else {
              const position = self.getResumeAt(punto_reproduccion);
              self._position = position;
            }
            self.setUrlTS(punto_reproduccion);
            resolve();
          } else {
            reject();
          }
        },
        error(_xhr, _textStatus, _errorThrown) {
          reject();
        },
      });
    });
  }

  async goLive(endeOfBuffer = false, backgroundMode = false) {
    // Volvemos a poner el stream multicast del live
    AppStore.yPlayerCommon.itMustGoLive = false;
    PlayMng.instance.playerView.setScreenStatus("none");
    if ((!this._channel && this.es_u7d()) || this.es_grabacion()) this._channel = this._asset?.Canal;
    if (!this._channel && AppStore.yPlayerCommon.isDiferido() && this.originIsEpg) {
      // Si reproducimos un diferido desde la epg, volvemos al live
      const epgView = ViewMng.instance.viewType("epg");
      if (epgView) {
        this._channel = epgView.getCurrentChannel();
      }
    }
    if (!this._channel) this._channel = PlayMng.instance.getBackgroundChannel();

    //auditar
    let sendAudition = !endeOfBuffer ? "button_live" : "eob";
    const key = KeyMng.instance.lastKeyCode;
    if (key === ykeys.VK_BLUE || key === ykeys.VK_MENU) sendAudition = "others";
    else if (key === ykeys.VK_YELLOW) sendAudition = "button_yellow";
    else if (key === ykeys.VK_STOP) sendAudition = "button_stop";
    if (AppStore.yPlayerCommon.isDiferido() && AppStore.yPlayerCommon.isLive()) {
      //auditar
      const isSO = PlayMng.instance.opts?.playInfo?.startOver;
      const fuente = PlayMng.instance?.playerView?._datos_editoriales;
      const pos = AppStore.yPlayerCommon?._position;
      AppStore.tfnAnalytics.player("stop", { evt: 2, svc: isSO ? 5 : 4, pos });
      AppStore.tfnAnalytics.audience_navigation("playerOut", "stop_stoverp", { trigger: sendAudition }, fuente);
      AppStore.tfnAnalytics.audience_navigation("bookmarking", "ck_addbkm-01", { trigger: "button_live" }, fuente);
      AppStore.yPlayerCommon.isStartSOP = false;
      AppStore.yPlayerCommon.isStopSOP = true;
      PlayMng.instance.opts.playInfo.startOver = false;
    }

    this.setUrlTS(this._channel.PuntoReproduccion);
    this.removeGoLiveButton();
    AppStore.yPlayerCommon.stopPause();
    AppStore.yPlayerCommon.resetTime2Live();

    this.destroyPlayerComponents();
    this.resetComponents();
    this.setMode(1);
    AppStore.yPlayerCommon.setMode(1);
    PlayMng.instance.playChangeStream();
    AppStore.yPlayerCommon.reset();

    const playConfig = {
      channel: this._channel,
      autoplay: false,
      origin: "HomeScene",
      desdeInicio: false,
      backgroundMode,
    };
    await PlayMng.instance.playChannel(playConfig);
  }

  getLinks() {
    if (!this._epg_channel || !this.getCurrentProgram()?.getCanal()) {
      return [];
    }
    return this.getCurrentProgram()?.getCanal().links;
  }

  showFicha() {
    if (this.isVod) {
      this.createDetailsModal(this._datos_editoriales);
      AppStore.tfnAnalytics.audience_navigation("ficha", "view", {});
      AppStore.tfnAnalytics.audience_navigation("playerOut", "ck_prod", {});
    } else {
      const self = this;
      const evento = this.opts.playerInfoComp.getProgramActive();
      this._detailsController
        .loadDetails(evento)
        .then((response) => {
          this.createDetailsModal(this._datos_editoriales);
          const islive = AppStore.yPlayerCommon.isLive() && !AppStore.yPlayerCommon.isDiferido();
          const isLiveSO = AppStore.yPlayerCommon.isLive() && AppStore.yPlayerCommon.isDiferido();
          const audience = audienceManager.config["playerAction"][islive && !isLiveSO ? 1 : 2];
          AppStore.tfnAnalytics.audience_navigation(audience, !isLiveSO ? "ck_prod" : "ck_prod-02", {}, response);
          AppStore.tfnAnalytics.audience_navigation("ficha", "view", {}, response);
          AppStore.tfnAnalytics.audience_navigation("ficha", "ck_opt", {}, response);
        })
        .catch(() => {
          self.isErrorShowing = true;
          AppStore.errors.showError(this, "player-view", "TV", "I_TV_1", false);
        });
    }
  }
  hideFicha() {
    this.activeComponent = this.opts.playerActionsDescComp;
    this.opts.detailsModalComp.destroy();
    this.opts.detailsModalComp = null;
    this.opts.detailsModal.destroy();
    this.opts.detailsModal = null;
  }

  createDetailsModal(datosEditoriales) {
    this.opts.detailsModalWrap = jQuery('<div id="details-view" class="details-view"></div>').appendTo(this.opts.wrap);
    this.opts.detailsModal = new DetailsView(this.opts.detailsModalWrap);
    this.opts.detailsModal.setPath("", "");
    this.opts.detailsModal.setPlayerMode();
    this.opts.detailsModal.setDatosEditoriales(datosEditoriales);
    this.opts.detailsModal.calculateStatus();
    this.opts.detailsModal.setEffectiveContent();

    // Seteamos variable global durante el player
    AppStore.home.set_details(this.opts.detailsModal);

    // Creamos modal component
    const detailsModalWrap = jQuery('<div id="details-modal-comp" class="details-modal-comp"></div>').appendTo(
      this.opts.wrap
    );
    this.opts.detailsModalComp = new DetailsModalComponent(detailsModalWrap);
    this.opts.detailsModalComp.init(this.opts.detailsModal);

    this.activeComponent = this.opts.detailsModalComp;
  }

  getEvento() {
    const evento = this.getCurrentProgram();
    return evento;
  }

  /**
   *
   * @param {JQuery} elem Elemento de titulo
   * @param {*} datos
   * @returns
   */
  setTitulo(elem, datos) {
    if (Utils.isEmpty(datos)) {
      datos = new programEpgNotAvailable();
    }
    let titulo = null;
    let subtitulo = null;
    if (datos instanceof programEpgDvbipi || datos instanceof programEpgHttp) {
      // Si hemos recibido en datos los "programas" con la capa de abstracción
      titulo = datos.getTituloPrevioEnHover();
      subtitulo = datos.getTituloEnHover();
    } else {
      // Si hemos recibido en datos los "datos_editoriales"
      if (datos.TipoContenido == "Serie") {
        titulo = datos.TituloSerie;
      } else if (datos.TipoContenido == "Episodio") {
        titulo = datos.TituloHorLinea1;
        subtitulo = datos.TituloEpisodioLargo;
      } else {
        titulo = datos.Titulo;
        subtitulo = datos.longTitle2;
      }
    }
    if (titulo && titulo !== i18next.t("epg.title_not_available")) {
      elem.find(".titulo").html(titulo);
      elem.find(".titulo").removeClass("noinfo");
    } else {
      elem.find(".titulo").html(i18next.t("epg.not_info"));
      elem.find(".titulo").removeClass("twolines");
      elem.find(".titulo").addClass("noinfo");
    }
    if (subtitulo) {
      elem.find(".titulo").removeClass("twolines");
      elem.find(".subtitulo").html(subtitulo);
      elem.find(".subtitulo").css("opacity", 1);
    } else {
      elem.find(".titulo").addClass("twolines");
      elem.find(".subtitulo").empty();
      elem.find(".subtitulo").css("opacity", 0);
    }
  }

  /**
   * Método que setea la información del contenido en la interfaz del player
   * (icono grabación, icono rating, iconos calidad, género, año y duración)
   * @param {Object} $itemInfo elemento del DOM donde se ubicará la información
   * @param {Object} datosEditoriales datos del contenido
   */
  setInfo($itemInfo, datosEditoriales) {
    $itemInfo.empty();
    datosEditoriales = datosEditoriales || { ShowId: "", NivelMoral: "", GeneroComAntena: "" };

    // Grabaciones live
    this.setInfoRecDot($itemInfo, datosEditoriales);

    // Iconos
    this.setInfoIcons($itemInfo, datosEditoriales);

    // Año
    this.setInfoYear($itemInfo, datosEditoriales);

    // Genero
    this.setInfoGenre($itemInfo, datosEditoriales);

    // Duracion
    // this.setInfoDuration($itemInfo, datosEditoriales);
  }

  /**
   * Detecta si es una grabación para mostrar el icono rojo de grabación, únicamente para LIVE
   * @param {Object} $itemInfo elemento del DOM donde se ubicará la información
   * @param {Object} datosEditoriales datos del contenido
   */
  setInfoRecDot($itemInfo, datosEditoriales) {
    let item_info_element = null;

    if (this._mode === 1 && datosEditoriales && datosEditoriales.ShowId) {
      const es_grabacion_individual = unirlib.getMyLists().estaRecordinglist(datosEditoriales.ShowId);
      if (es_grabacion_individual) {
        item_info_element = '<div class="item-info-element"><div class="rec_dot"></div></div>';
        $(item_info_element).appendTo($itemInfo);
      }
    }
  }

  /**
   * Setea el icono de rating en la info del player, y llama a los métodos para setear los iconos de calidad
   * @param {Object} $itemInfo elemento del DOM donde se ubicará la información
   * @param {Object} datosEditoriales datos del contenido
   */
  setInfoIcons($itemInfo, datosEditoriales) {
    let item_info_element = null;

    // Rating
    item_info_element = '<div class="item-info-element iconos"><div class="item-rating"></div></div>';
    const $item_info_element = $(item_info_element);
    $item_info_element.appendTo($itemInfo);

    const $item_rating = $item_info_element.find(".item-rating");
    const icon = '<span class="icon">';

    if (datosEditoriales && datosEditoriales.NivelMoral) {
      const ratio = ControlParentalMng.instance.getIconNivelMoral(datosEditoriales);
      $(icon).addClass(ratio).appendTo($item_rating);
    }

    // Calidad
    if (AppStore.appStaticInfo.getTVModelName() === "iptv2" && this._mode === 1) {
      this.setInfoIconsLive($item_rating, icon);
    } else {
      this.setInfoIconsVOD($item_rating, icon);
    }

    // if (datosEditoriales && datosEditoriales.LenguajeSignos) {
    //   var $signos_icon = $(icon).addClass("icon-signos");
    //   $signos_icon.appendTo($item_info_element.find(".item-rating"));
    // }
  }

  /**
   * Setea los iconos de calidad para los contenidos LIVE
   * @param {Object} $item_rating elemento del DOM donde se ubicará la información
   * @param {Object} icon elemento icon del DOM
   */
  setInfoIconsLive($item_rating, icon) {
    let channel = this._channel;

    if (this.opts.isOnOverChannel) {
      // Si estamos moviéndonos (der/izq) desde el componente de canales en el player
      const channelObj = AppStore.channelsMng.getProfileChannelByChannelId(this.opts.isOnOverChannel);
      if (channelObj) channel = channelObj.channel;
    }
    if (DialMng.instance.isActive()) {
      // Si tenemos el dial activo
      channel = DialMng.instance.getCurrentChannel();
    }
    if (channel && typeof channel["isDvbipi"] === "function" && channel?.isDvbipi()) {
      const maxQualityAvailable = channel.getMaxQualityAvailable();
      if (maxQualityAvailable && maxQualityAvailable.quality === "HD") {
        const $uhd_icon = $(icon).addClass("icon-hd");
        $uhd_icon.appendTo($item_rating);
      } else if (AppStore.HdmiMng.isUHDEnabled() && maxQualityAvailable?.quality === "UHD") {
        const $uhd_icon = $(icon).addClass("icon-uhd");
        $uhd_icon.appendTo($item_rating);
      }
      if (AppStore.HdmiMng.isHDRActive(channel?.isHdr)) {
        const $hdr_icon = $(icon).addClass("icon-hdr");
        $hdr_icon.appendTo($item_rating);
      }
      this.setIconDolbyLive(channel, $item_rating, icon);
    }
  }

  /**
   * Setea el icono de Dolby en el player LIVE
   * @param {Object} channel canal actual
   * @param {Object} item_rating elemento del DOM donde se ubicará la información
   * @param {Object} icon elemento icon del DOM
   */
  setIconDolbyLive(channel, item_rating, icon) {
    const channelDolby = channel.isDolby;
    const channelAtmos = channel.Atmos;
    const dolbyEnabled = AppStore.HdmiMng.isDolbyEnabled();
    const dolbyPlusEnabled = AppStore.HdmiMng.isDolbyPlusEnabled();

    if (!this.opts.playerChannelsComp?.isExpanded()) {
      if (dolbyPlusEnabled && channelAtmos) {
        const $dolby_icon = $(icon).addClass("icon-atmos");
        $dolby_icon.appendTo(item_rating);
      } else if ((dolbyEnabled || dolbyPlusEnabled) && (channelDolby || channelAtmos)) {
        const $dolby_icon = $(icon).addClass("icon-dolbyplus");
        $dolby_icon.appendTo(item_rating);
      }
    } else if ((dolbyEnabled || dolbyPlusEnabled) && (channelDolby || channelAtmos)) {
      const $dolby_icon = $(icon).addClass("icon-dolby");
      $dolby_icon.appendTo(item_rating);
    }
  }

  /**
   * Setea los iconos de calidad para los contenidos VOD
   * @param {Object} $item_rating elemento del DOM donde se ubicará la información
   * @param {Object} icon elemento icon del DOM
   */
  setInfoIconsVOD($item_rating, icon) {
    const asset = this._asset;
    if (asset) {
      if ((asset?.FormatoVideo || asset?.Canal?.FormatoVideo) == "HD") {
        const $uhd_icon = $(icon).addClass("icon-hd");
        $uhd_icon.appendTo($item_rating);
      } else if (AppStore.HdmiMng.isUHDEnabled() && (asset?.FormatoVideo || asset?.Canal?.FormatoVideo) == "4K") {
        const $uhd_icon = $(icon).addClass("icon-uhd");
        $uhd_icon.appendTo($item_rating);
      }
      if (AppStore.HdmiMng.isHDRActive(asset?.HDR)) {
        const $hdr_icon = $(icon).addClass("icon-hdr");
        $hdr_icon.appendTo($item_rating);
      }
      this.setIconDolbyVOD(asset?.FormatoAudio, $item_rating, icon);

      // if (asset.VersionIdioma && asset.VersionIdioma > 1 && asset.VersionIdioma != 6) {
      //   var $vo_icon = $(icon).addClass("icon-vo");
      //   $vo_icon.appendTo($item_rating);
      // }
      // if (asset.Subtitulos && asset.Subtitulos.length > 0) {
      //   var $sub_icon = $(icon).addClass("icon-sub");
      //   $sub_icon.appendTo($item_rating);
      // }
    }
  }

  /**
   * Setea el icono de Dolby en el player VOD
   * @param {Object} formatoAudio formato de audio del contenido actual
   * @param {Object} item_rating elemento del DOM donde se ubicará la información
   * @param {Object} icon elemento icon del DOM
   */
  setIconDolbyVOD(formatoAudio, item_rating, icon) {
    const DOLBY = 2;
    const DOLBY_PLUS = 3;
    const DOLBY_ATMOS = 4;
    const dolbyEnabled = AppStore.HdmiMng.isDolbyEnabled();
    const dolbyPlusEnabled = AppStore.HdmiMng.isDolbyPlusEnabled();

    if (dolbyPlusEnabled && formatoAudio == DOLBY_ATMOS) {
      var $dolby_icon = $(icon).addClass("icon-atmos");
      $dolby_icon.appendTo(item_rating);
    } else if (
      (dolbyPlusEnabled || dolbyEnabled) &&
      (formatoAudio == DOLBY || formatoAudio == DOLBY_PLUS || formatoAudio == DOLBY_ATMOS)
    ) {
      var $dolby_icon = $(icon).addClass("icon-dolbyplus");
      $dolby_icon.appendTo(item_rating);
    }
  }

  /**
   * Setea el género del contenido en la info del player
   * @param {Object} $itemInfo elemento del DOM donde se ubicará la información
   * @param {Object} datosEditoriales datos del contenido
   */
  setInfoGenre($itemInfo, datosEditoriales) {
    if (!Utils.isEmpty(datosEditoriales) && datosEditoriales.GeneroComAntena !== i18next.t("epg.genre_not_available")) {
      let item_info_element = null;
      let genero = datosEditoriales.GeneroComAntena ? datosEditoriales.GeneroComAntena : "";

      if (datosEditoriales.Genero && datosEditoriales.Genero.ComAntena) {
        genero = datosEditoriales.Genero.ComAntena;
      }
      item_info_element = `<div class="item-info-element"><div class="item-genre">${genero}</div></div>`;
      $(item_info_element).appendTo($itemInfo);
    }
  }

  /**
   * Setea el año del contenido en la info del player
   * @param {Object} $itemInfo elemento del DOM donde se ubicará la información
   * @param {Object} datosEditoriales datos del contenido
   */
  setInfoYear($itemInfo, datosEditoriales) {
    let item_info_element = null;

    if (datosEditoriales.Anno) {
      item_info_element = `<div class="item-info-element"><div class="item-year">${datosEditoriales.Anno}</div></div>`;
      $(item_info_element).appendTo($itemInfo);
    }
  }

  /**
   * Setea la duración del contenido en la info del player
   * @param {Object} $itemInfo elemento del DOM donde se ubicará la información
   * @param {Object} datosEditoriales datos del contenido
   */
  setInfoDuration($itemInfo, datosEditoriales) {
    let item_info_element = null;

    if (datosEditoriales.Duracion) {
      item_info_element = `<div class="item-info-element"><div class="item-duration">${datosEditoriales.Duracion}'</div></div>`;
      $(item_info_element).appendTo($itemInfo);
    }
  }

  calcProgress(progresoMinutos, duracion) {
    return Utils.format2decimals((progresoMinutos / duracion) * 100);
  }

  setGradient(typeGradient, sliderType) {
    if (typeGradient && sliderType === "similares") typeGradient = "gradient";
    this.opts.wrap.removeClass("gradient").removeClass("gradientUp");
    if (typeGradient) this.opts.wrap.addClass(typeGradient);
  }
  getTitle() {
    let _fullTitle, _title, _subtitle;
    if (this._datos_editoriales != null) {
      if (this._datos_editoriales.TipoContenido == "Serie") {
        _title = this._datos_editoriales.TituloSerie || (this._datos_editoriales.Serie || {}).TituloSerie || "";
      } else if (this._datos_editoriales.TipoContenido == "Episodio") {
        _title = this._datos_editoriales.TituloSerie || (this._datos_editoriales.Serie || {}).TituloSerie || "";
        _subtitle = this._datos_editoriales.TituloEpisodio;
      } else {
        _title = this._datos_editoriales.Titulo;
        _subtitle = "";
      }
      if (_subtitle) {
        _fullTitle = `${_title} : ${_subtitle}`;
      } else {
        _fullTitle = _title;
      }
    } else {
      _fullTitle = this._titulo;
    }
    if (AppStore.yPlayerCommon.isPubli()) {
      _fullTitle = `Publicidad - ${_title}`;
    } else if (AppStore.yPlayerCommon.isTrailer()) {
      if (_fullTitle) {
        _fullTitle += " (Tráiler)";
      } else {
        _fullTitle += "Mini Tráiler";
      }
    }
    return _fullTitle;
  }
  getNumEpisode() {
    return parseInt(this._datos_editoriales?.NumeroEpisodio);
  }
  getNumSeason() {
    var strSeason = this._datos_editoriales?.Temporada || this._datos_editoriales?.TituloSeguimiento;
    if (strSeason) {
      const match = strSeason.match(/\d+/);
      if (match) return parseInt(match[0], 10);
    }
  }

  async setPip(position) {
    if (
      (position === "right" && PipMng.instance.position === "left") ||
      (position === "left" && PipMng.instance.position === "right")
    ) {
      // Sólo cambiamos pip de lado
      PipMng.instance.setPip(position);
      if (!PipMng.instance.showingNotAvailable) {
        await PipMng.instance.changePip(PipMng.instance.position);
      } else {
        PipMng.instance.showPipNotAvailable();
      }
      await PipMng.instance.showPipChannel();
      this.opts.playerInfoComp?.updatePipMenu();
      this.opts.playerInfoComp.goBack();
    } else {
      // Mostramos pip
      PipMng.instance.channel = this.getCurrentChannel();
      PipMng.instance.setPip(position, this.getCurrentChannel());
      await PipMng.instance.loadEpgPip();
      await PipMng.instance.showPipChannel(true);
      this.updatePipButton();
      this.opts.playerInfoComp?.updatePipMenu();
      this.opts.playerInfoComp.goBack();

      if (await PipMng.instance.isPipAvailable()) {
        await PipMng.instance.pip(PipMng.instance.position);
      } else {
        PipMng.instance.showPipNotAvailable();
        PipMng.instance.showPipWrapper();
      }
    }
  }

  // Posibles valores del parámetro "side": RIGHT or LEFT
  getNumProgramMiniguideBySide(side) {
    let numEndElement = 0;
    let valueEndElement = null;
    const allowedOnSide = [this._GuiaTVonSide, this._U7DonSide];

    if (side == "RIGHT") {
      valueEndElement = this.opts.itemProgramsMiniguideRight
        ? this.opts.itemProgramsMiniguideRight.toLowerCase()
        : null;
    } else if (side == "LEFT") {
      valueEndElement = this.opts.itemProgramsMiniguideLeft ? this.opts.itemProgramsMiniguideLeft.toLowerCase() : null;
    }
    numEndElement = allowedOnSide.includes(valueEndElement) ? 1 : 0;
    return this.opts.numProgramsMiniguideEachside - numEndElement;
  }

  getActiveCadenaTV() {
    return this._channel.CodCadenaTv;
  }

  setChannelsStackCircular(value) {
    this._channelsStackCircular = value;
  }

  get channelsStackCircular() {
    return this._channelsStackCircular;
  }

  update_details() {
    if (this.opts.detailsTemporal || this.opts.details) this.refreshFavorites();
    if (this.opts.details) this.opts.details.update_details();
  }

  ////////////////
  // GRABACIONES
  ////////////////

  get recordableComponent() {
    let recordableComponent = this.opts.details;
    const isMainProgram = this.opts.playerInfoComp ? this.opts.playerInfoComp.getIsMainProgram() : true;

    if (!isMainProgram && this.opts.detailsTemporal) {
      recordableComponent = this.opts.detailsTemporal;
    }

    return recordableComponent;
  }

  start_grabacion() {
    if (this.isVod) return;

    const self = this;
    let evento = this.getCurrentProgram();
    if (!this.opts.playerInfoComp.isPrograms && !this.opts.playerInfoComp.isMore) {
      // Acción sobre el programa actual (DIRECTO)
      self.opts.details.start_grabacion();
    } else {
      // Acción sobre el programa de la miniepg
      evento = this.opts.playerInfoComp.getProgramActive();
      if (this.opts.detailsTemporal?.get_id() === evento?.ContentId) {
        self.opts.detailsTemporal.start_grabacion();
      } else {
        // Acción ejecutada desde el menú "ShowMore" (o por teclas antes de ese menú) si NO tenemos el mismo valor en "detailsTemporal"
        this._detailsController
          .loadDetailsTemporal(evento)
          .then(() => {
            self.opts.detailsTemporal.start_grabacion();
          })
          .catch(() => {});
      }
    }
  }

  start_dejardegrabar() {
    if (this.isVod) return;

    const self = this;
    let evento = this.getCurrentProgram();
    if (!this.opts.playerInfoComp.isPrograms && !this.opts.playerInfoComp.isMore) {
      // Acción sobre el programa actual (DIRECTO)
      self.opts.details.start_dejardegrabar();
    } else {
      // Acción sobre el programa de la miniepg
      evento = this.opts.playerInfoComp.getProgramActive();
      if (this.opts.detailsTemporal?.get_id() === evento?.ContentId) {
        self.opts.detailsTemporal.start_dejardegrabar();
      } else {
        // Acción ejecutada desde el menú "ShowMore" (o por teclas antes de ese menú) si NO tenemos el mismo valor en "detailsTemporal"
        this._detailsController
          .loadDetailsTemporal(evento)
          .then(() => {
            self.opts.detailsTemporal.start_dejardegrabar();
          })
          .catch(() => {});
      }
    }
  }

  add_favorito() {
    if (this.isVod) {
      // Cuando estamos en VOD/U7D no tenemos details temporal ya que no es necesaria y los VOD no son programEpgDvbipi
      this.manage_favoritos_vod("add_favorito", "ck_addfav");
      return;
    }

    AppStore.tfnAnalytics.fichaFavorito("ck_addfav", false, true);

    // Acción ejecutada desde el menú "ShowMore". Es necesario "detailsTemporal"
    if (this.opts.playerInfoComp.isMore) {
      this.opts.detailsTemporal?.add_favorito();
      AppStore.tfnAnalytics.audience_navigation("playerLive", "ck_addfav", {}, this.opts?.detailsTemporal);
    }
  }

  delete_favorito() {
    if (this.isVod) {
      // Cuando estamos en VOD/U7D no tenemos details temporal ya que no es necesaria y los VOD no son programEpgDvbipi
      this.manage_favoritos_vod("delete_favorito", "ck_delfav");
      return;
    }

    AppStore.tfnAnalytics.fichaFavorito("ck_delfav", false, true);

    // Acción ejecutada desde el menú "ShowMore". Es necesario "detailsTemporal"
    if (this.opts.playerInfoComp.isMore) {
      this.opts.detailsTemporal?.remove_favorito();
      AppStore.tfnAnalytics.audience_navigation("playerLive", "ck_delfav", {}, this.opts?.detailsTemporal);
    }
  }

  manage_favoritos_vod(method, actionAudience) {
    const self = this;
    const data = this._datos_editoriales;

    this._is_changing_favorites = true;
    const contentId = this.get_content_id();
    const itemType = this._asset ? this._asset.catalogItemType : data.TipoContenido;
    const accountId = AppStore.profile.get_account_number();
    const profileId = AppStore.lastprofile.getUserProfileID();
    const links =
      data.TipoContenido == "Serie" || data.TipoContenido == "Temporada"
        ? data.links
        : this._asset
        ? this._asset.links
        : data.Pases[0].links;
    const link = get_link_related(links, "favorite");
    const mylists = unirlib.getMyLists();

    mylists[method](accountId, profileId, link).then(
      (response) => {
        self._is_changing_favorites = false;
        self.update_favoritos_list(method, response, contentId, itemType);
        AppStore.tfnAnalytics.audience_navigation("playerOut", actionAudience, {}, data);
      },
      (reason) => {
        self._is_changing_favorites = false;
        self.showErrorFavoritos(reason);
      }
    );
  }

  update_favoritos_list(method, response, contentId, itemType) {
    const mylists = unirlib.getMyLists();
    if (method === "add_favorito") {
      if (response.data && response.data.id) {
        mylists.update_favorito_from_list(response.data.id, response.data.catalogItemType);
      } else {
        mylists.update_favorito_from_list(contentId, itemType);
      }
      this.opts.playerActionsDescComp.updateButton("add_favoritos", "del_favoritos");
    } else if (method === "delete_favorito") {
      this._is_changing_favorites = false;
      mylists.remove_favorito_from_list(contentId, itemType);
      this.opts.playerActionsDescComp.updateButton("del_favoritos", "add_favoritos");
    }
    AppStore.home.refresh_endpoint("tfgunir/consultas", "favoritos");
    AppStore.home.refresh_focus();
    AppStore.home.refresh_details();
  }

  parentalAllowed() {
    const allowed = this.isAllowed || !AppStore.PinMng.enabled;
    return allowed;
  }

  resetIsAllowed() {
    this.isAllowed = true;
  }

  async parentalCheck(firstTime = false) {
    let evento;
    if (AppStore.yPlayerCommon.backgroundMode()) {
      evento = PlayMng.instance.getCurrentProgramInBackground();
    } else {
      if (this.opts.m360ParamsPlayer.linkedDevice && AppStore.M360Mng.channel) evento = AppStore.M360Mng.channel;
      else evento = this.getCurrentProgram();
    }
    const allowed = evento
      ? ControlParentalMng.instance.isContentAllowed(evento) &&
        !ControlParentalMng.instance.checkPINForAdultContent(evento, this._channel)
      : true;
    if (allowed !== this.isAllowed || firstTime) {
      this.isAllowed = allowed;
      if (allowed) {
        if (this.opts.pinTimeout) await ModalMng.instance.closePinPopup();
        this.hideNotAllowed();
        this.stopPinTimeout();
        this.callback_startSession();
      } else if (this.desdeCalle) {
        this.showNotAllowed();
      } else {
        // Verificamos si tenemos que mostrar el PIN
        AppStore.yPlayerCommon.setMode(YPlayerCommonMode.LIVE);
        if (
          !AppStore.yPlayerCommon.backgroundMode() &&
          ControlParentalMng.instance.checkPINForAdultContent(evento, this._channel) &&
          !unirlib.isEmergencyMode()
        ) {
          const self = this;
          debug.alert("contenido protegido");
          // Inicializamos "pinTimeout" que vamos a lanzar un PIN, para que bloquee ciertas teclas
          this.opts.pinTimeout = true;
          const backgroundModeStatus = AppStore.yPlayerCommon.backgroundMode();
          await PlayMng.instance.playChangeStream();
          await PlayMng.instance.setBackgroundMode(backgroundModeStatus);
          if (!backgroundModeStatus) await this.onPlayingContent();
          this.stopPinTimeout();
          this.opts.pinTimeout = setTimeout(async () => {
            self.opts.canUseDial = false;
            self.prevActiveComp = self.activeComponent;
            AppStore.PinMng.keys = ["VK_CHANNEL_UP", "VK_CHANNEL_DOWN"];
            LoaderMng.instance.hide_loader();
            const response = await AppStore.PinMng.init();
            if (ViewMng.instance?.lastView?.type === "pin") {
              ViewMng.instance.close(ViewMng.instance.lastView);
            }
            if (response.eventName === AppStore.PinMng.status.PIN_OK) {
              if (AppStore.M360Mng.isAdultChannel) {
                AppStore.M360Mng.activeCommand = "zapto";
                // se envia el response de M360 con un retardo para no pisar el response del comando sendKey
                setTimeout(() => {
                  AppStore.M360Mng.playM360CommandProfile("pinSuccessAdultChannel");
                }, 500);
              }
              // OK play
              self.opts.canUseDial = true;
              AppStore.PinMng.enabled = false;
              self.callback_startSession();
            } else if (response.eventName === AppStore.PinMng.status.PIN_KO && AppStore.M360Mng.isAdultChannel) {
              AppStore.M360Mng.activeCommand = "zapto";
              // se envia el response de M360 con un retardo para no pisar el response del comando sendKey
              setTimeout(() => {
                AppStore.M360Mng.playM360CommandProfile("pinFailed");
              }, 500);
            } else if (response.eventName === "VK_CHANNEL_UP") {
              self.prevCompAfterPinModal();
              self.goChannelUp();
            } else if (response.eventName === "VK_CHANNEL_DOWN") {
              self.prevCompAfterPinModal();
              self.goChannelDown();
            } else {
              self.prevCompAfterPinModal();
              self.onPlayingContent();
            }
            self.stopPinTimeout();
          }, 2000);
        } else {
          debug.alert("contenido protegido");
          const backgroundModeStatus = AppStore.yPlayerCommon.backgroundMode();
          await PlayMng.instance.playChangeStream();
          await PlayMng.instance.setBackgroundMode(backgroundModeStatus);
          if (!backgroundModeStatus) await this.onPlayingContent();
        }
      }
    }
  }

  get canUseDial() {
    if (AppStore.yPlayerCommon.isVideoPlaza) {
      return false;
    }
    if (this.activeComponent === this.opts.playerStreamEventsComp) {
      return false;
    }
    return this.opts.canUseDial;
  }

  hidePopup() {
    if (this.isVod && !AppStore.yPlayerCommon.isDiferido()) {
      this.stop();
    }
  }

  async epgEvent() {
    // Recepcion de evento epg desde MW
    if (this._channel) this.loadEpg(this._channel);
    await PipMng.instance.loadEpgPip();
    PlayMng.instance.loadEpgBackground();
  }

  async refresh() {
    const programNow = this.getCurrentProgramOfNow();
    // Check si cambio programa
    if (programNow && this._eventoId !== programNow?.ContentId && !this.isFocusedChannelApplication()) {
      TpaEventEmitter.instance.emitFromData("PlayerMediaEvent", { event: "programChanged" });
      this.loadEpg(this._channel);
    } else {
      if (
        AppStore.yPlayerCommon.isLive() &&
        !AppStore.yPlayerCommon.isDiferido() &&
        AppStore.appStaticInfo.getTVModelName() === "iptv2"
      ) {
        this.updateProgressBar();
      }
    }

    // Check control parental del pip si hay cambio de programa
    await PipMng.instance.refresh();
  }

  /**
   * Función que se ejecuta cuando se puede realizar el goBack del componente, según el "origin"
   * @name goBackByOrigin
   * @override
   */
  async goBackByOrigin() {
    await ViewMng.instance.close(this);
  }

  /**
   * Nos devuelve si tenemos cargado en "_datos_editoriales" los datos de BackEnd, no valen los datos de DVBIPI
   * @name hasDetailsDataRight
   * @returns {Boolean} Devuelve un boolean indicando si es un objeto de "details" de BackEnd.
   */
  hasDetailsDataRight() {
    const datosEditoriales = this.get_datos_editoriales();
    let hasDetailsRight =
      typeof datosEditoriales === "object" && datosEditoriales !== null && Object.keys(datosEditoriales).length;
    if (
      AppStore.appStaticInfo.getTVModelName() === "iptv2" &&
      typeof datosEditoriales["isDvbipi"] === "function" &&
      datosEditoriales.isDvbipi()
    ) {
      hasDetailsRight = false;
    }

    return hasDetailsRight;
  }

  /** @private */
  async _onContentTimeout() {
    if (this.isCurrentChannelApplication()) return;
    this.hide(true);
    await AppStore.errors.showErrorAsync("Player", "I_PLA_3");
    await this.goBack();
  }

  /**
   * Se dispara al recibir un evento de playready event.
   * si no se tiene acceso al contenido se cierra el player
   * y se regresa al punto donde se inicio la reproduccion
   *
   * @private
   * */
  async _onPlayReadyEvent(data) {
    if (ViewMng.instance.lastView !== this) {
      return;
    }
    if (data.status === "denied") {
      await this.stop(true);
      await ViewMng.instance.close(this);
    }
  }

  /**
   * Agrega el componente de canales
   * @private
   */
  _addChannelComponent() {
    if (this.opts.playerChannelsComp) {
      this.opts.playerChannelsComp.destroy();
      this.opts.playerChannelsComp = null;
    }

    getPlayerChannelComponent(this);
    this.addComponent(this.opts.playerChannelsComp);
    this.opts.playerChannelsComp.down = this.opts.playerInfoComp;
    this.opts.playerInfoComp.up = this.opts.playerChannelsComp;
  }

  /**
   * Cierra el popup de error del player.
   * En caso de error con el SO vuelve al live.
   * En otro caso, cierra el player y vuelve a la pantalla anterior.
   */
  closePlayerError() {
    if (AppStore.yPlayerCommon.isDiferido()) {
      PlayMng.instance.playerView.goLive(false);
    } else {
      this.stop();
    }
  }

  /*CANALES SIN MULTICAST */

  /**
   * Comprueba si el canal actualmente enfocado(en miniguia/playerinfo) es sin multicast
   * @returns {Boolean} true si es un canal sin multicast, false en otro caso
   */
  isFocusedChannelApplication() {
    var isApplication = false;
    const currentProgram = this.getCurrentProgram();
    if (currentProgram && Object.keys(currentProgram).length !== 0) {
      isApplication = currentProgram.isApplicationChannel();
    }
    return isApplication;
  }

  /**
   * Comprueba si el canal LIVE actualmente reproduciendo es sin multicast
   * @returns {Boolean} true si es un canal sin multicast, false en otro caso
   */
  isCurrentChannelApplication() {
    var isApplication = false;
    if (this.isLive) {
      const channel = this.getCurrentChannel();
      isApplication = channel?.isApplication();
    }
    return isApplication;
  }

  /**
   * Lanzará el canal sin multicast actualmente sintonizado (su aplicación asociada)
   */
  launchCurrentAppChannel() {
    const channel = this.getCurrentChannel();
    this.launchAppChannel(channel);
  }

  /**
   * Lanzará el canal sin multicast pasado por parámetros(su aplicación asociada)
   * @param {Object} canal a ser lanzado
   * @param {String} launchPoint punto de lanzamiento para la EP, por defecto será DIAL (18)
   */
  async launchAppChannel(channel, launchPoint = "DIAL") {
    await AppChannelsMng.instance.launchAppChannel(channel, launchPoint);
    BackgroundMng.instance.set_bg_black();
    removePlayerFanart(this);
  }
}

/** @typedef {import("src/code/components/player/player-info/player-info").PlayerInfoComponent} PlayerInfoComponent */
