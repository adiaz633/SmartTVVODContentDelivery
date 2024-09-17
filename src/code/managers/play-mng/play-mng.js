import { appConfig } from "@appConfig";
import { EventEmitterBaseMng } from "src/code/js/event-emitter-base-mng";
import { get_cache_channel_by_cod } from "src/code/js/lib";
import { AdsMng } from "@newPath/managers/ads-mng";
import { AutoplayMng } from "src/code/managers/autoplay-mng";
import { ControlParentalMng } from "@newPath/managers/control_parental_mng";
import { DialMng } from "@newPath/managers/dial-mng";
import { EpgMng } from "@newPath/managers/epg-mng";
import { LoaderMng } from "src/code/managers/loader-mng";
import { AppStore } from "src/code/managers/store/app-store";
import { ViewMng, viewTypeNames } from "src/code/managers/view-mng";
import { DetailsView } from "src/code/views/details/details";
import { yPlayer } from "@tvlib/yPlayer";
import { Main } from "@tvMain";
import { yPlayerAds } from "@unirlib/server/yPlayerAds";
import { PIP_SIZE } from "@unirlib/server/yPlayerCommon";
import { yPlayerShaka } from "@unirlib/server/yPlayerShaka";
import { debug } from "@unirlib/utils/debug";

import { DEFAULT_AUDIO_CODE, DEFAULT_NO_SUBTITLE, DEFAULT_SUBTITLE_CODE, MODO, NO_FUNCTION } from "./constants";
import { getPlayerViewWithWrap, newPlayerView } from "./player-view-utils";

let _instance = null;

export class PlayMng extends EventEmitterBaseMng {
  /**
   * @type {PlayMng}
   */
  static get instance() {
    if (!_instance) {
      _instance = new PlayMng();
    }
    return _instance;
  }

  constructor() {
    super("PlayMng");
    this.opts = {
      /** @type {yPlayer} */
      player: null,

      /** @type {PlayerView} */
      playerView: null,

      settingsMode: false,
      epgMode: false,
      backgroundMode: false,
      backgroundChannel: null,
      timeoutBackCh: null,
      timeoutButtonPromo: null,
      playInfo: {},
      relacionados: {},
      lastChannelPlay: null,
      directPlayMode: false,
      detailHasRelacionados: false,
      detailStreamEvents: null,
    };
    this._channel = null;
    this._epg_background = [];

    const isShaka = !AppStore.appStaticInfo.is_native_player_device();
    if (isShaka) this.opts.player = new yPlayerShaka(this);
    else this.opts.player = new yPlayer(this);

    EpgMng.instance.on("beforeLoadEpg", this._beforeLoadEpg.bind(this));
  }

  /**
   * @type {yPlayer}
   */
  static get player() {
    return PlayMng.instance.opts.player;
  }

  /**
   * @type {PlayerView}
   */
  get playerView() {
    if (!this.opts.playerView) {
      this.opts.playerView = newPlayerView();
    }
    return this.opts.playerView;
  }

  get lastChannelPlay() {
    return this.opts.lastChannelPlay;
  }

  set lastChannelPlay(value) {
    if (value !== this.opts.lastChannelPlay) {
      this.opts.lastChannelPlay = value;
    }
  }

  emptyLastChannelPlay() {
    this.opts.lastChannelPlay = null;
  }

  /**
   * Devuelve el último canal sintonizado o el canal de fondo
   *
   * @returns {any}
   */
  get safeLastPlayedChannel() {
    return this.opts.lastChannelPlay || this.backgroundChannel;
  }

  getDefaultAudioAndSubtitle(channelInfo, preferredAudio, preferredSubtitle) {
    let channel = channelInfo;
    AppStore.profileChannels.deleteOld();
    if (this._mode === 0) {
      return {
        audio: preferredAudio || DEFAULT_AUDIO_CODE,
        subtitle: preferredSubtitle || DEFAULT_SUBTITLE_CODE,
      };
    } else {
      let storedPreference = null;
      if (!preferredAudio || !preferredSubtitle) {
        channel = channel || this.opts.playerView.getCurrentChannel();
        const profileId = parseInt(AppStore.lastprofile.getUserProfileID());
        storedPreference =
          channel?.channelId && profileId >= 0
            ? AppStore.profileChannels.getProfilePreferences(profileId, channel?.channelId)
            : null;
        if (storedPreference == null) {
          // Leemos los valors del perfil
          const profile = AppStore.lastprofile?.getUserProfile();
          if (profile) {
            storedPreference = {
              audio: profile.audioCode === "auto" ? "spa" : profile.audioCode,
              subtitle: profile.subtitlesCode,
            };
          } else {
            storedPreference = {
              audio: DEFAULT_AUDIO_CODE,
              subtitle: DEFAULT_SUBTITLE_CODE,
            };
          }
        }
      }
      // Colocamos audio por defecto
      // Tres posibles situaciones:
      // 1- El audio ya viene establecido (en propiedad playInfo.preferredAudio)
      // 2- El audio según perfil
      // 3- El audio se establece con un código por defecto
      const result = {
        audio: preferredAudio || storedPreference.audio || DEFAULT_AUDIO_CODE,
        subtitle: preferredSubtitle || storedPreference.subtitle || DEFAULT_SUBTITLE_CODE,
      };

      this.opts.playInfo.preferredAudio = result.audio;
      this.opts.playInfo.preferredSubtitle = result.subtitle;
      return result;
    }
  }

  updateProfileChannel(audio, subtitle) {
    if (this._mode !== 0) {
      const channel = this.opts.playerView?.getCurrentChannel() || this.opts.playerView?._asset?.Canal;
      const profileId = parseInt(AppStore.lastprofile.getUserProfileID());
      if (channel && channel.channelId && profileId >= 0) {
        AppStore.profileChannels.updateProfilePreferences(profileId, channel.channelId, audio?.lang, subtitle?.lang);
      }
    }
  }

  /**
   *  Emite el evento desde MIto (usualmente en StartMng)
   *  @param {"player" | "pip"} type Grupo de eventos
   *  @param {MitoPlayEventArgs} eventArgs Argumento de los eventps
   */
  emitFromMitoEvent(type, eventArgs) {
    const normalizeType = `${type}`.toLowerCase();
    if (!["player", "pip"].includes(normalizeType)) {
      throw new Error(`play ${normalizeType}`);
    }
    //
    //  Asegurarse de tener un evento para normalizar el nombre
    //
    let eventName = eventArgs.event;
    if (!eventName) {
      eventName = eventArgs.evType;
    }

    if (!eventName?.length) {
      console.warn("PlayMng.emitFromMitoEvent NO EVENT NAME FOUND", eventArgs);
    }
    const normalizedEventName = `${normalizeType}_${eventName}`;
    this.emit(normalizedEventName, eventArgs);
  }

  get preferredAudio() {
    return this.opts.playInfo.preferredAudio;
  }

  set preferredAudio(value) {
    this.opts.playInfo.preferredAudio = value;
  }

  set preferredSubtitle(value) {
    this.opts.playInfo.preferredSubtitle = value;
  }

  get preferredSubtitle() {
    return this.opts.playInfo.preferredSubtitle;
  }

  getPlayInfoLive(preferredAudio, preferredSubtitle, desdeInicio = false) {
    const result = {
      rec: false,
      mode: MODO.LIVE,
      startOver: false,
      puntoReproduccion: null,
      desdeInicio,
      autoplay: false,
      promoVideo: false,
      trailer: false,
      preferredAudio,
      preferredSubtitle,
    };
    return result;
  }

  getPlayInfoCatchUp(data, url, fuente = {}) {
    const result = {
      data,
      status,
      fuente,
      canPlay: true, // Can play this content
      free: false,
      trailer: false,
      mode: MODO.VOD,
      rec: false,
      startOver: false,
      showGoLive: true,
      puntoReproduccion: null,
      desdeInicio: false,
      autoplay: false,
      resumeTime: this.opts.resumeTime,
      preferredAudio: this.opts.playInfo.preferredAudio,
      preferredSubtitle: this.opts.playInfo.preferredSubtitle,
    };
    this.opts.resumeTime = 0; // Inicializamos el valor resumeTime para siguiente reproducción
    this.opts.playInfo = {};
    result.fuente.UrlVideo = url;
    return result;
  }

  getPlayInfo(data, status) {
    const result = {
      data,
      status,
      fuente: status !== null ? status.getFuente() : null,
      canPlay: false, // Can play this content
      free: false,
      rec: false,
      startOver: false,
      mode: MODO.VOD,
      showGoLive: false,
      puntoReproduccion: null,
      desdeInicio: false,
      autoplay: false,
      promoVideo: false,
      trailer: false,
      resumeTime: this.opts.resumeTime,
      isBingeWatching: false,
    };
    const audioSubtitle = this.getDefaultAudioAndSubtitle(null, this.preferredAudio, this.preferredSubtitle);
    result.preferredAudio = audioSubtitle.audio;
    result.preferredSubtitle = audioSubtitle.subtitle;

    this.opts.resumeTime = 0; // Inicializamos el valor resumeTime para siguiente reproducción
    this.opts.playInfo = {};
    if (data === null) {
      return result;
    }

    if (data.TipoComercial && data.TipoComercial == "Gratis") {
      result.canPlay = true;
      result.free = true;
      if (!result.trailer) {
        result.trailer = data.TipoTrailer;
      }
      return result;
    } else if (AppStore.login.isAnonimousUser()) {
      result.canPlay = false;
      return result;
    } else {
      if (data.TipoContenido != "Serie" && data.TipoContenido != "Temporada") {
        if (status.es_vod() || status.es_vod_soon()) {
          // Boton de play/compra segun estatus
          if (
            status.es_suscripcion() ||
            status.es_ver() ||
            status.es_impulsivo() ||
            status.es_gratis() ||
            status.es_freemium()
          ) {
            result.canPlay = !(status.es_compra() || status.es_multiple() || status.es_vod_soon());
            return result;
          }
          // Boton de mejorar tv (ambos botones si es de comercializacion multiple)
          if (status.es_upgrade() || status.es_multiple()) {
            result.canPlay = false;
            return result;
          }
        } else if (status.es_pase() || status.es_u7d() || status.es_grabacion()) {
          if (
            status.es_suscripcion() ||
            status.es_impulsivo() ||
            status.es_gratis() ||
            status.es_freemium() ||
            status.es_ver()
          ) {
            result.canPlay = true;
            result.mode = 1;
            return result;
          } else if (status.es_compra() || status.es_multiple()) {
            result.canPlay = false;
            return result;
          }

          // Boton de mejorar tv (ambos botones si es de comercializacion multiple)
          if (status.es_upgrade() || status.es_multiple()) {
            result.canPlay = false;
            return result;
          }

          const es_grabacion_individual = status.es_grabacion();
          if (es_grabacion_individual) {
            result.canPlay = false;
            return result;
          }
        }
      } else {
        const es_serie = data.TipoContenido == "Serie";
        if (es_serie) {
          const tiene_permisos =
            status.es_suscripcion() ||
            status.es_ver() ||
            status.es_impulsivo() ||
            status.es_gratis() ||
            status.es_freemium();
          if (status.es_vod() && tiene_permisos && !status.es_no_disponible() && !status.es_vod_soon()) {
            return result;
          } else if (status.es_upgrade() || status.es_multiple()) {
            result.canPlay = false;
            return result;
          } else if (status.es_pase() && !status.es_no_disponible()) {
            return result;
          } else {
            return result;
          }
        }
      }
    }
    return result;
  }

  async play(playInfo, origin, options) {
    if (!playInfo.canPlay && (!playInfo.trailer || !playInfo.free)) {
      return;
    }
    this.opts.playInfo = playInfo;

    // await this.stopPreviousPlayer();
    if (ViewMng.instance.player) {
      // Si tenemos un player previo lo paramos para cambiar
      await this.playChange();
    }

    if (playInfo.mode === MODO.VOD) {
      // Play vod
      this.setBackgroundMode(false);
      this.playVod(playInfo, origin, options);
    } else if (playInfo.mode === MODO.LIVE) {
      // Play canal
      this.playLive(playInfo, origin);
    }
  }

  /**
   * Oculta la pantalla de origen cuando se incia efectivamente
   * la reproduccion de un video
   *
   * @private
   * @param {string} origin
   */
  _hideOriginOnPlay(origin) {
    if (ViewMng.instance.lastView?.type !== viewTypeNames.PLAYER_VIEW) return;
    const self = this;
    return this.once("player_firstFrameOnDisplay", () => {
      if (self.backgroundMode) return;
      console.warn(`_hideOnEvent ${origin}`);
      switch (origin) {
        case "FichaScene":
          AppStore.home.hide_details();
          break;
        case "GridScene":
          // ViewMng.instance.viewType("grid")?.deactivate();
          break;
        case "EpgScene":
          // ViewMng.instance.viewType("epg")?.deactivate();
          break;
        case "HomeScene":
        case "SliderScene":
          if (ViewMng.instance.active?.type !== viewTypeNames.EPG_VIEW) {
            AppStore.home.hide_home();
          }
          break;
        default:
          break;
      }
    });
  }

  async promoPublicidad(_url, origin) {
    AutoplayMng.instance.disableAutoplayCheck();
    this._hideOriginOnPlay(origin);
    AppStore.yPlayerCommon.showSpin();
    AppStore.yPlayerCommon._is_promo = true;

    this._destroyPlayerView();
    this.opts.playerView = getPlayerViewWithWrap(origin, "promoPublicidad");
    this.opts.playerView.setReproducirDesdeInicio(true);
    this.opts.playerView.setFreeContent(true);
    this.opts.playerView.setExtrasMode(false);
    this.opts.playerView.setUrlTS(null);
    //BackgroundMng.instance.hide_full_background();
    this.opts.playerView.init();
    await ViewMng.instance.push(this.opts.playerView);

    PlayMng.player.initPlayer();
    PlayMng.player.playAd(_url);
  }

  async playAd(playInfo, origin) {
    AppStore.yPlayerCommon.setAutoplay(false);
    this._hideOriginOnPlay(origin);
    AppStore.yPlayerCommon.showSpin();
    AppStore.yPlayerCommon._is_promo = true;

    this._destroyPlayerView();
    this.opts.playerView = getPlayerViewWithWrap(origin, this.playAd.name);
    this.opts.playerView.setReproducirDesdeInicio(true);
    this.opts.playerView.setFreeContent(true);
    this.opts.playerView.setExtrasMode(false);
    //BackgroundMng.instance.hide_full_background();
    this.opts.playerView.init();
    await ViewMng.instance.push(this.opts.playerView);
    this.opts.playerView.setUrlTS(null);
    AppStore.yPlayerCommon.callback_add_ads(playInfo, true);
  }

  async playVod(playInfo, origin) {
    AppStore.yPlayerCommon.setAutoplay(playInfo.autoplay);

    this._hideOriginOnPlay(origin);

    if (!playInfo.autoplay) {
      AppStore.yPlayerCommon.showSpin();
    }

    this._destroyPlayerView();

    if (!playInfo.autoplay) {
      this.opts.playerView = getPlayerViewWithWrap(origin, this.playVod.name);
      this.opts.playerView.setTimeoutListener();
    } else {
      //
      // Si no es autoplay NO generar elementos del DOM
      //
      this.opts.playerView = newPlayerView();
    }

    let formato_video = null;
    let urlTrailer = null;
    if (playInfo.trailer) {
      if (Array.isArray(playInfo.data.Trailers) && playInfo.data.Trailers.length) {
        formato_video = playInfo.data.Trailers[0].FormatoVideo;
        urlTrailer = playInfo.data.Trailers[0].uri;
      } else {
        formato_video = playInfo.data.FormatoVideo;
        urlTrailer = playInfo.data.UrlVideo;
      }

      this.opts.playerView.setUrlTS(urlTrailer);
    } else if (playInfo.data && playInfo.data.DatosAccesoAnonimo) {
      formato_video = playInfo.data.DatosAccesoAnonimo.FormatoVideo;
    }
    if (formato_video) {
      this.opts.playerView.set_formato_video(formato_video);
    }

    this.opts.playerView.setReproducirDesdeInicio(playInfo.desdeInicio);
    let itemType = "";
    if (!playInfo.trailer) {
      // VODITEM correspondiente a la comercializacion
      this.opts.playerView.set_asset(playInfo.fuente);
      if (playInfo.puntoReproduccion) {
        this.opts.playerView.setUrlTS(playInfo.puntoReproduccion);
      }
      itemType = playInfo.status ? playInfo.status.get_asset_itemType() : playInfo?.fuente?.catalogItemType;
    }
    this.opts.playerView.setIsStartOver(playInfo.startOver);
    this.opts.playerView.setShowGoLive(playInfo.showGoLive);
    this.opts.playerView.set_catalog_item_type(itemType);
    this.opts.playerView.set_datos_editoriales(playInfo.data);
    this.opts.playerView.setFreeContent(playInfo.free);
    this.opts.playerView.setIsTrailer(playInfo.trailer);
    this.opts.playerView.setExtrasMode(false);
    this.opts.playerView.init();
    if (!playInfo.autoplay) {
      await ViewMng.instance.push(this.opts.playerView);
    }
  }

  playLive(playInfo, origin) {
    const fuente = playInfo.status.get_contenido();
    if (fuente.Canal != null && fuente.Canal.PuntoReproduccion != null) {
      const channel = get_cache_channel_by_cod(fuente.Canal.CodCadenaTv);
      if (channel) {
        AppStore.yPlayerCommon.setAutoplay(false);
        this._hideOriginOnPlay(origin);

        //this._ver_desde_inicio = false;
        PlayMng.instance.playerView._desde_guiatv = this.origin == "EpgScene";
        PlayMng.instance.playerView.setOrigenScene(origin);
        PlayMng.instance.playerView.setChannel(fuente.Canal);
        PlayMng.instance.playerView.show();
      }
    }
  }

  async initPlayerView(origin = "HomeScene") {
    AppStore.yPlayerCommon.setAutoplay(false);
    if (origin === "HomeScene") {
      AppStore.home.hide_home();
    }

    this._destroyPlayerView();
    this.opts.playerView = getPlayerViewWithWrap(origin, this.initPlayerView.name);

    // Playerview init
    PlayMng.player.init(0);
    this.opts.playerView.show();
    this.opts.playerView.setGradient("gradient");

    await ViewMng.instance.push(this.opts.playerView);
  }

  async playStop() {
    await this.playChange();
    AppStore.home.show_home_wrap();
  }

  async playChangeStream(changingChannel = false) {
    if (AppStore.yPlayerCommon.isVideoPlaza) {
      await yPlayerAds.backAd();
    }
    const blankScreen = !(
      AppStore.yPlayerCommon.isLive() &&
      AppStore.yPlayerCommon.isDiferido() &&
      !this.opts.playerView.isCurrentChannelApplication()
    );
    // Cuando pasamos de live a SO no vamos a negro.
    await AppStore.yPlayerCommon.stop(false, blankScreen, changingChannel);

    AppStore.yPlayerCommon.setAutoplay(false);

    this.opts.playerView?.setReproducirDesdeInicio(false);

    if (ViewMng.instance.isTypeActive("epg") && this._origenScene == "EpgScene") {
      ViewMng.instance.viewType("epg").setChannel(this._channel.CodCadenaTv);
    }

    await this.setBackgroundMode(false);
    PlayMng.player.resetKeepAliveTimer();
  }

  async playChange() {
    await this.playChangeStream(true);
    this.emitFromMitoEvent("player", { event: "PlayerChanged" });
  }

  async stopPreviousPlayer() {
    await PlayMng.instance.stopBackgroundPlay();
    if (ViewMng.instance.player) {
      if (this.opts.playerView) this.opts.playerView.stopPinTimeout();

      // Almacenamos la info de bookmark si el modo de reproducción es VOD
      const playerView = this.opts.playerView || { getTime: NO_FUNCTION, savePuntoReproduccion: NO_FUNCTION };
      const time = playerView.getTime() || MODO.UNDEFINED;

      if (AppStore.yPlayerCommon.getMode() === MODO.VOD && time !== MODO.UNDEFINED) {
        await playerView.savePuntoReproduccion(time);
      }
    }
    this.stopTimeoutBackgroundChannel();
  }

  async playChannel(config) {
    let details_channel;
    const {
      channel = {},
      autoplay = false,
      desdeInicio = false,
      desdeCalle = false,
      linkedDevice = false,
      backgroundMode = false,
      origin = "",
      preferredAudio,
      preferredSubtitle,
    } = config;

    if (!channel) return;
    if (config.linkedDevice) this.playerView.opts.m360ParamsPlayer = config;

    const audioSubtitle = this.getDefaultAudioAndSubtitle(channel, preferredAudio, preferredSubtitle);
    this.opts.playInfo = this.getPlayInfoLive(audioSubtitle.audio, audioSubtitle.subtitle);
    AppStore.yPlayerCommon.resetTime2Live();
    // await this.stopPreviousPlayer();

    if (!autoplay && AppStore.login.isAnonimousUser()) {
      AppStore.sceneManager.get("PopLoginScene").setOriginScene(null);
      AppStore.sceneManager.get("PopLoginScene")._isReactivacion = false;
      AppStore.sceneManager.show("PopLoginScene");
      AppStore.sceneManager.focus("PopLoginScene");
    } else {
      const disponible = AppStore.channelsMng.isAvailableChannel(channel);
      const blackout_active = AppStore.channelsMng.isBlackoutActive(channel);
      if (backgroundMode) {
        // En background mode no seguimos si no allowed
        await this.setBackgroundMode(backgroundMode);
        const isAllowed = await this.isAllowed();
        if (!isAllowed) {
          await this.playChangeStream(true);
          return;
        }
      }
      AppStore.yPlayerCommon.setAutoplay(autoplay);
      if (disponible && !blackout_active) {
        if (channel?.PuntoReproduccion || channel.isApplication()) {
          if (!autoplay) {
            this._hideOriginOnPlay(origin);
            const activeView = ViewMng.instance.active;
            if (activeView && activeView.type === "recordings") {
              activeView.set_view_inactive();
            }
          } else {
            if (appConfig.PX_AUTOPLAY_BOTTOM > 0) {
              // Move player up 140px
              PlayMng.player.resize(-appConfig.PX_AUTOPLAY_BOTTOM, 0, 1280, 720);
            }
          }

          // Si backgroundMode es TRUE, ya se ha realizado esta llamada más arriba.
          if (!backgroundMode) {
            await this.setBackgroundMode(backgroundMode);
            this._destroyPlayerView();
            this.opts.playerView = getPlayerViewWithWrap(origin, this.playChannel.name);
          } else {
            this.backgroundChannel = channel;
            this.opts.playerView = newPlayerView();
            this.opts.playerView.origin = origin;
          }

          //  ----------
          //  Se requiere almacenar AQUI el ultimo canal que se haya
          //  enviado a reproducir
          //
          if (!autoplay) this.opts.lastChannelPlay = channel;
          //  ----------
          this.opts.playerView.setChannel(channel);
          this.opts.playerView.setReproducirDesdeInicio(desdeInicio);
          this.opts.playerView.setReproducirDesdeCalle(desdeCalle);
          if (!backgroundMode) {
            this.opts.playerView.setTimeoutListener();
          }
          //
          //  Al ser un canal live ya paso el first frame.
          //  En caso de reproducir el canal desde inicio con SO no debe mostrar controles si tiene publicidad.
          //
          if (desdeInicio) {
            this.opts.playerView.setIsStartOverFromEpg(origin === "EpgScene");
            PlayMng.player.stopPlayer();
            AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.PLAYING);
            AutoplayMng.instance.clearAutoplayPromo();
            if (AdsMng.instance.hasPreroll("SO", 0)) {
              this.opts.playerView.ShowController.firstFrameWasPlayed = false;
            } else {
              this.opts.playerView.ShowController.firstFrameWasPlayed = true;
            }
          }

          if (!backgroundMode) {
            details_channel = await this.opts.playerView.init();
            if (!autoplay) {
              await ViewMng.instance.push(this.opts.playerView);
            }
          } else if (!desdeInicio) {
            this.opts.playerView.startPlaying();
          }
          AppStore.yPlayerCommon.stableLive();
        }
      } else {
        //AppStore.home.getHomeSliderElem().addClass("active");
        LoaderMng.instance.hide_loader();

        if (!autoplay) {
          if ((AppStore.lastprofile.getUserProfile() || {}).isForKids && !channel.isKids) {
            ViewMng.instance.getView(ViewMng.instance.length - 1).opts.popupActive = true;
            AppStore.errors.showError("SliderScene", "SliderScene", "TV", "I_TV_2", false);
          } else if (!disponible) {
            ViewMng.instance.getView(ViewMng.instance.length - 1).opts.popupActive = true;
            AutoplayMng.instance.startSuscribir(channel);
          } else if (blackout_active) {
            ViewMng.instance.getView(ViewMng.instance.length - 1).opts.popupActive = true;
            AppStore.errors.showError("SliderScene", "SliderScene", "TV", "I_TV_1", false);
          }
        }
      }
    }
    if (linkedDevice) {
      AppStore.M360Mng.isPlayerFlyer = true;
    }
    return details_channel;
  }

  async playChannelEpg(channel) {
    if (ViewMng.instance.lastView?.type !== viewTypeNames.EPG_VIEW) {
      return;
    }

    const audioSubtitle = this.getDefaultAudioAndSubtitle(channel);
    this.opts.playInfo = this.getPlayInfoLive(audioSubtitle.audio, audioSubtitle.subtitle);

    await this.stopBackgroundPlay();
    if (AppStore.login.isAnonimousUser()) return;
    const disponible = AppStore.channelsMng.isAvailableChannel(channel);
    const blackout_active = AppStore.channelsMng.isBlackoutActive(channel);
    AppStore.yPlayerCommon.setAutoplay(false);
    if (disponible && !blackout_active) {
      if (AppStore.appStaticInfo.getTVModelName() === "iptv2") {
        const channel = ViewMng.instance.viewType("epg").getCurrentChannel();
        this.opts.player.initPlayer();

        const qualityAvailable = channel.getMaxQualityAvailable();
        debug.alert(`En playChannelEpg cargando Quality=${qualityAvailable.quality} urlTS=${qualityAvailable.urlTS}`);
        await AppStore.yPlayerCommon.resize_player_area(...PIP_SIZE);
        AppStore.yPlayerCommon.playTS(1, qualityAvailable.urlTS, channel.CasId, channel.FormatoVideo, 0);
      } else {
        AppStore.yPlayerCommon.startSession(1, channel.CasId, "CHN", "EpgScene");
      }
    }
  }

  set epgMode(value) {
    this.opts.epgMode = value;
  }
  get epgMode() {
    return this.opts.epgMode;
  }

  get backgroundMode() {
    return this.opts.backgroundMode;
  }

  async setBackgroundMode(value) {
    this.opts.backgroundMode = value;
    if (this.opts.backgroundMode) {
      await this.loadEpgBackground();
      this.opts.player.stopPlayTimeInfo();
    } else {
      this.opts.player.startPlayTimeInfo();
    }
  }

  set backgroundChannel(value) {
    this.opts.backgroundChannel = value;
  }

  get backgroundChannel() {
    return this.opts.backgroundChannel;
  }

  /**
   * @deprecated in favor of {@link backgroundChannel}
   * @returns {?}
   */
  getBackgroundChannel() {
    return this.backgroundChannel;
  }

  set settingsMode(value) {
    this.opts.settingsMode = value;
  }
  get settingsMode() {
    return this.opts.settingsMode;
  }

  set directPlayMode(value) {
    this.opts.directPlayMode = value;
  }
  get directPlayMode() {
    return this.opts.directPlayMode;
  }

  resetDirectPlayMode() {
    this.opts.directPlayMode = false;
    this.opts.detailHasRelacionados = false;
    this.opts.detailStreamEvents = null;
  }

  callback_startSession() {
    if (!this.opts.epgMode) {
      this.opts.playerView.callback_startSession();
    } else {
      const channel = ViewMng.instance.viewType("epg").getCurrentChannel();
      this.opts.player.initPlayer();
      AppStore.yPlayerCommon._urlTS = AppStore.yPlayerCommon.prepareUrl(channel.PuntoReproduccion);
      AppStore.yPlayerCommon.playTS(1, AppStore.yPlayerCommon._urlTS, channel.CasId, channel.FormatoVideo, 0);
    }
  }

  async stopBackgroundPlay() {
    debug.alert(`stopBackgroundPlay ${this.opts.backgroundMode}`);
    if (this.opts.backgroundMode) {
      // Stop playing background
      await AppStore.yPlayerCommon.stop();
      await this.setBackgroundMode(false);
    }
    this.stopTimeoutBackgroundChannel();
  }

  stopTimeoutBackgroundChannel() {
    if (this.opts.timeoutBackCh) {
      window.clearTimeout(this.opts.timeoutBackCh);
      this.opts.timeoutBackCh = null;
    }
  }

  restartTimeoutBackgroundChannel() {
    console.warn("PlayMng.restartTimeoutBackgroundChannel");
    if (this.opts.playerView?.isErrorShowing || AppStore.yPlayerCommon.isVideoPlaza) {
      console.warn("NO restartTimeoutBackgroundChannel");
      return;
    }
    this.stopTimeoutBackgroundChannel();
    this.opts.timeoutBackCh = window.setTimeout(() => {
      const lastChannel = this.opts.lastChannelPlay || this.backgroundChannel;
      if (
        lastChannel &&
        !AppStore.yPlayerCommon.isPlaying() &&
        ViewMng.instance.active?.type !== viewTypeNames.EXTERNAL_PARTNER_VIEW
      ) {
        const playConfig = {
          channel: lastChannel,
          autoplay: true,
          origin: "",
          desdeInicio: false,
          backgroundMode: true,
        };
        this.playChannel(playConfig);
      }
    }, 5000);
  }

  checkLinks(links, field) {
    let found = false;
    if (links?.length > 0) {
      for (let i = 0; i < links.length && !found; i++) {
        const rel = links[i].rel.toUpperCase();
        if (rel === field) {
          found = true;
        }
      }
    }
    return found;
  }

  /**
   * Play directo a partir de la url de la ficha
   *
   * @param {Object} config Configuración de reproducción
   * @param {Boolean} isExternal
   */
  async playDetails(config, isExternal) {
    let desdeInicio = typeof config.desdeInicio == "boolean" ? config.desdeInicio : true;
    const {
      url = "",
      linkedDevice = false,
      trailer = typeof config.trailer !== "undefined" ? config.trailer : false,
      resumeTime = 0,
      preferredAudio,
      preferredSubtitle,
    } = config;

    const self = this;

    const audioSubtitle = this.getDefaultAudioAndSubtitle(null, preferredAudio, preferredSubtitle);
    this.preferredAudio = audioSubtitle.audio;
    this.preferredSubtitle = audioSubtitle.subtitle;
    this.opts.resumeTime = resumeTime;
    this.opts.trailer = trailer;

    // await this.stopPreviousPlayer();
    const detailsWrap = jQuery(String.raw`
      <div id="details-view" class="details-view">
      </div>
    `);
    const tempDetails = new DetailsView(detailsWrap);
    tempDetails.opts.url = url;
    tempDetails.loadData().then(
      async (response) => {
        self.opts.directPlayMode = true;
        self.opts.detailHasRelacionados = self.checkLinks(response?.links, "SIMILARS");
        if (self.opts?.resumeTime > response?.DuracionEnSegundos) {
          self.opts.resumeTime = 0;
          desdeInicio = true;
        }
        await tempDetails.setDirectPlay(response, { desdeInicio, trailer }, isExternal);
        self.opts.detailStreamEvents = tempDetails.opts?.effectiveContent?.fuente?.StreamEvents;
        if (linkedDevice) {
          AppStore.M360Mng.isPlayerFlyer = true;
        }
      },
      (error) => {
        console.log(error);
      }
    );
  }

  /**
   * @method
   * @name setCustomAudio
   * @description Cambia el audio del player
   * @param {String} audioCode Código ISO 639-92 del audio
   * @param {String} videoMode 1: live / 2: vod - diferido
   * @returns null
   */
  async setCustomAudio(audioCode, videoMode) {
    const MainSetCustomAudio = typeof Main.setCustomAudio === "function" ? Main.setCustomAudio : NO_FUNCTION;
    const audios = await Main.getAudiosAvailable();
    if (audios.length > 0) {
      const [firstAudio] = audios;
      const audio = audios.find((audioElement) => audioElement.lang === audioCode) || firstAudio;
      const indexAudio = audios.findIndex((audioElement) => audioElement.lang === audioCode);
      if (indexAudio != -1) {
        this.opts.playerView.changePlayerMark("audio", indexAudio);
      }
      MainSetCustomAudio(audio);
    }
    AppStore.tfnAnalytics.player("value_change", { evt: videoMode, m360: true });
    return null;
  }

  /**
   * @method
   * @name setCustomSubtitle
   * @description Cambia el subtitlo del player
   * @param {String} subtitleCode Código ISO 639-92 del subtitulo
   * @returns null
   */
  async setCustomSubtitle(subtitleCode, videoMode) {
    const MainSetCustomSubtitle = typeof Main.setCustomSubtitle === "function" ? Main.setCustomSubtitle : NO_FUNCTION;
    const subtitulos = await Main.getSubtitlesAvailable();
    if (subtitulos.length > 0) {
      const subtitulo =
        subtitulos.find((subtitleElement) => subtitleElement.lang === subtitleCode) || DEFAULT_NO_SUBTITLE;
      let indexSub = subtitulos.findIndex((subtitleElement) => subtitleElement.lang === subtitleCode);
      if (indexSub != -1) {
        indexSub += 1;
        this.opts.playerView.changePlayerMark("subtitle", indexSub);
      }
      MainSetCustomSubtitle(subtitulo);
    }
    AppStore.tfnAnalytics.player("value_change", { evt: videoMode, m360: true });
    return null;
  }

  /**
   * @method
   * @name changeAudioSubWithM360ResumeTimeChange
   * @description Método llamado desde PlayerMediaEvent, cuando se cambia el resumeTime desde M360 junto con cambio de audio y subtitulo
   * @returns null
   */
  async changeAudioSubWithM360ResumeTimeChange() {
    if (AppStore.M360Mng.params.audio || AppStore.M360Mng.params.audio !== "")
      this.setCustomAudio(AppStore.M360Mng.params.audio);
    if (AppStore.M360Mng.params.subtitles || AppStore.M360Mng.params.subtitles !== "")
      this.setCustomSubtitle(AppStore.M360Mng.params.subtitles);
    AppStore.M360Mng.opts.isM360ChangeResumeTime = false;
    return null;
  }

  async loadEpgBackground() {
    if (this.opts.backgroundMode) {
      const jsonPrograms = await PlayMng.instance.playerView.loadChannelEpgByDvbipi(this.backgroundChannel);
      this._epg_background = EpgMng.instance.prepareProgramsByDvbipi(jsonPrograms);
    }
  }

  async isAllowed() {
    let allowed = true;
    const channel = this.opts.playerView.getCurrentChannel();
    const evento = (await channel?.getCurrentProgramEPG()) || this.getCurrentProgramInBackground();
    if (evento) {
      allowed =
        ControlParentalMng.instance.isContentAllowed(evento) &&
        !ControlParentalMng.instance.checkPINForAdultContent(evento, channel);
    }
    return allowed;
  }

  getCurrentProgramInBackground() {
    const indexEvento = PlayMng.instance.playerView.getIndexEvento(this._epg_background);
    return indexEvento !== -1 ? this._epg_background[indexEvento] : {};
  }

  async refresh() {
    const { playerView } = this.opts;
    if (playerView) {
      const isStartOver = playerView._mode === 1 && playerView.opts.playerStreamEventsComp?.hasButton();
      if (AppStore.yPlayerCommon.isPlaying() || PlayMng.instance.backgroundChannel) {
        if (AppStore.yPlayerCommon.isLive()) {
          if (!isStartOver) playerView.refresh();
        }
      }
      if (AppStore.yPlayerCommon.isDiferido()) {
        if (!isStartOver) playerView.checkDiferido();
      }

      if (AppStore.yPlayerCommon.isPlaying()) {
        if (!this.opts.player.hasPlayTimeInfo()) {
          this.opts.player.startPlayTimeInfo();
        }
      }
    }
  }

  /**
   * Reproduce el ultimo canal sintonizado
   * @param {boolean} [backgroundMode=false] true si es background
   * @returns {Promise<boolean>} true si se ha reproducido el contenido
   */
  async playLastChannel(backgroundMode = false) {
    let result = true;
    const lastChannel = this.safeLastPlayedChannel;
    if (lastChannel) {
      const channelConfig = {
        backgroundMode,
        channel: lastChannel,
        autoplay: false,
        desdeInicio: false,
        linkedDevice: false,
      };
      try {
        await this.playChannel(channelConfig);
      } catch (error) {
        result = false;
        console.error(error);
      }
    }
    return result;
  }

  /**
   * @name isPlayAllowed
   * @description Función que verifica si tenemos permisos para reproducir un contenido
   * @param {} fuente Es el contenido a reproducir
   * @param {} linkTypeContent Es el linkType de contenido puede ser: catch-up, npvr, o start-over
   * @returns {enabled: Boolean, errorCode}
   */
  isPlayAllowed(fuente, linkTypeContent = undefined) {
    let result = { enabled: false, errorCode: null };
    if (typeof fuente["isEventEpg"] === "function") {
      result = this._isPlayAllowedFromEventoEpg(fuente, linkTypeContent);
    } else {
      // "fuente" es un objeto recibido de una FICHA de Backend
      result = this._isPlayAllowedFromDetailsBackEnd(fuente, linkTypeContent);
    }

    return result;
  }

  /**
   * Cuando ha cambiado la calidad máxima del usuario (LineQuality + Resolución + Pantalla en Setting) llamaríamos a esta función
   * Además de preparar los canales también para el player live si ya NO tiene permisos de reproducción en ese canal
   * @async
   */
  async updatedUserQuality() {
    AppStore.channelsMng.overwriteWithUserQualityAllChannels();
    if (this.lastChannelPlay && !this.lastChannelPlay.getMaxQualityAvailable()) {
      await this.stopBackgroundPlay();
      this.emptyLastChannelPlay();
    }
    // Reiniciamos las cachés de canales en managers y vistas
    this.opts.playerView?.resetChannels();
    DialMng.instance.resetChannels();
  }

  /**
   * Precondiciones carga EPG
   * Si hay VOD en reproducción y se navega a la EPG, paramos el player
   */
  _beforeLoadEpg() {
    if (!AppStore.yPlayerCommon.isLive() && AppStore.yPlayerCommon.isPlaying()) {
      AppStore.yPlayerCommon.exec_stop();
    }
  }

  /** @private */
  _destroyPlayerView() {
    if (!this.opts.playerView.isInStack) {
      this.opts.playerView.destroy();
    }
  }

  _isPlayAllowedFromEventoEpg(fuente, linkTypeContent = undefined) {
    let result = { enabled: false, errorCode: null };
    if (linkTypeContent === "catch-up") {
      result = fuente.hasU7D;
      if (!result.enabled && !result.errorCode) result.errorCode = "u7d-error-generico";
    } else if (linkTypeContent === "start-over") {
      result = fuente.hasStartOver;
    } else {
      result.enabled = true;
    }
    return result;
  }

  _isPlayAllowedFromDetailsBackEnd(fuente, linkTypeContent = undefined) {
    let result = { enabled: false, errorCode: null };
    if (linkTypeContent === "catch-up") {
      if (fuente?.Canal?.hasU7D) {
        result = fuente.Canal.hasU7D;
      } else {
        result.enabled = AppStore.profile.user_has_catchup();
        result.errorCode = !result.enabled ? "u7d-sin-derechos" : null;
      }
    } else if (linkTypeContent === "start-over") {
      if (fuente?.Canal) {
        result = fuente?.Canal?.hasStartOver;
      } else {
        result.enabled = AppStore.profile.user_has_startover();
        result.errorCode = !result.enabled ? "u7d-sin-derechos" : null;
      }
      result = fuente?.Canal?.hasStartOver || result;
    } else {
      result.enabled = true;
    }

    if (!result.enabled && !result.errorCode) result.errorCode = "u7d-error-generico";
    return result;
  }
}

/**
 * Eventos de mito
 */
export const MitoEvents = Object.freeze({
  player_AdRequest: "player_AdRequest",
  player_contentTimeout: "player_contentTimeout",
  player_firstFrameOnDisplay: "player_firstFrameOnDisplay",
  player_reachedEnd: "player_reachedEnd",
  player_PlayerPlayReadyEvent: "player_PlayerPlayReadyEvent",
  player_PlayerChanged: "player_PlayerChanged",
  pip_reachedEnd: "pip_reachedEnd",
  pip_firstFrameOnDisplay: "pip_firstFrameOnDisplay",
  pip_PlayerPlayReadyEvent: "pip_PlayerPlayReadyEvent",
});

/**
 * @typedef {object} MitoPlayEventArgs
 * @property {string?} event Event name
 * @property {string?} evType Tipo de evento
 */

/**
 * @callback PlayerEventListener
 * @param {MitoPlayEventArgs} args Argumentos
 */

/** @typedef {import("src/code/views/player-view/player-view").PlayerView} PlayerView*/
