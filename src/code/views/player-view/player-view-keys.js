import * as BINGE_CONSTANTS from "@newPath/constants/bingewatching";
import { SingleReadValue } from "src/code/js/single-read-value";
import { BackgroundMng } from "src/code/managers/background-mng";
import { DialMng } from "@newPath/managers/dial-mng";
import { LoaderMng } from "src/code/managers/loader-mng";
import { ModalMng } from "src/code/managers/modal-mng";
import { PlayMng } from "src/code/managers/play-mng";
import { AppStore } from "src/code/managers/store/app-store";
import { BaseViewRecordingsKeys } from "src/code/views/base-view-recordings-keys";
import { MitoAPI } from "@tvlib/MitoAPI";
import { unirlib } from "@unirlib/main/unirlib";

import { hideComponentFrom } from "./components/hide-components";
import * as PLAYER_REFS from "./player-refs";

/**
 * Tiempo de espera minimo entre pulsaciones de teclas
 */
const KEY_WAIT_IN_MS = 150;

export class PlayerViewKeys extends BaseViewRecordingsKeys {
  #isGoBackFromStop;

  /**
   * Ejecución del método de pulsación de tecla del mando delegado en cada componente
   * @param {String} keyPressed
   * @returns {Promise<Boolean>}
   */
  async #activeComponentDoKeyPressed(keyPressed) {
    /** @type {PlayerViewKeys } */
    const self = this;
    return await self.activeComponent.handlerKeyPressed(keyPressed);
  }
  /**
   * @param {JQuery|HTMLElement} wrap
   */
  constructor(wrap) {
    super(wrap);

    //
    // Anotaciones
    //
    // TODO: se cambio por usar el debounce del KeyMng
    // this.goBack = debounceAnnotation(this.goBack, KEY_WAIT_IN_MS * 2);

    /**
     * Indica si el goBack proviene de un stop
     */
    this.#isGoBackFromStop = new SingleReadValue(false);
  }

  /**
   * Ver desde el inicio
   */
  verInicio() {
    throw new Error("PlayerViewKeys: Se debe implementar");
  }

  /**
   * Detener la ejecucion
   */
  async stop(_endStream = false, _isAdvertisement = false, _isGoBack = false) {
    throw new Error("PlayerViewKeys: Se debe implementar");
  }

  /**
   * PLay pause
   */
  playpause() {
    throw new Error("PlayerViewKeys: Se debe implementar");
  }

  /**
   * Mostrar los subtitulos
   */
  showAudioSubtitulos() {
    throw new Error("PlayerViewKeys: Se debe implementar");
  }

  /**
   * Ejecuta un comando en el player
   */
  runCommand() {
    throw new Error("PlayerViewKeys: Se debe implementar");
  }

  /**
   * Mostrar controles
   * @param {boolean} _audioSub - true para mostar los subtitulos
   */
  show(_audioSub) {
    throw new Error("PlayerViewKeys: Se debe implementar");
  }

  /**
   * Ejecuta el movimiento en el player
   *
   * @param {"forward"|"rewind"} _methodName - Metodo de movimiento
   * @return {void}
   */
  executeFastForwardOrRewind(_methodName) {
    throw new Error("PlayerViewKeys: Se debe implementar");
  }

  //  --------------------------------------------------------------------------
  //  Keys
  //  --------------------------------------------------------------------------
  async onMenuPressedEvent() {
    if (unirlib.isEmergencyMode()) {
      ModalMng.instance.showPopup("arranque_error_acceso_menu");
      return true;
    }
    if (unirlib.isAppStartedFromEmergencyMode()) {
      unirlib.setAppStartedFromEmergencyMode(false);
      unirlib.setRecoverHomeFromEmergencyMode(true);
      unirlib.launchHomeScene();
    }
    this.hideNotAllowed();
    const isLive = AppStore.yPlayerCommon.isLive();
    if (isLive) {
      await PlayMng.instance.setBackgroundMode(true);
      if (AppStore.yPlayerCommon.isDiferido()) {
        const time = this.getTime();
        await this.savePuntoReproduccion(time);
        await this.goLive(false, true);
      } else {
        this._time = 0;
      }
    }

    BackgroundMng.instance.show_full_background();
    await this.stopAndLeave();
    if (isLive && this.isPipActive()) await this.setPipStandby();
    return false;
  }

  async goYellow() {
    if (this.activeComponent === this.opts.playerStreamEventsComp) {
      if (this.activeComponent.opts.tipo === BINGE_CONSTANTS.TIPO_COMPONENTE.BINGE_WATCHING_RECOMENDACIONES) {
        await this.#activeComponentDoKeyPressed("goPlay");
        return;
      }
    }
    if (!this.parentalAllowed() || unirlib.isEmergencyMode() || this.isPlayerScrollerActive) return;

    const isSimilaresMode = this.opts.detailsSliders && this.opts.detailsSliders.isPlayerSimilaresMode;

    if (AppStore.yPlayerCommon.isLive() && !AppStore.yPlayerCommon.isDiferido() && !isSimilaresMode) {
      const evento = this.getCurrentProgram();
      if (!evento?.hasStartOver?.enabled) return;
    }

    if (!this.isShowing) {
      if (DialMng.instance?.isActive()) {
        DialMng.instance?.hide();
      }
      this.show();
    }

    if (isSimilaresMode) {
      // En details sliders reproducimos de inicio el elemento del slider
      this.opts.detailsSliders.goYellow();
    } else {
      AppStore.yPlayerCommon._position = 0;
      await this.verInicio();
    }
  }

  goGreen() {
    if (this.isPlayerScrollerActive) {
      this.mustShowAudioSubtitulos = true;
      this._playerScroller.reset();
      return;
    }

    if (!this.parentalAllowed() || AppStore.yPlayerCommon.isVideoPlaza) return;

    if (this._activeComponent.type === "player-trick-modes") {
      const isPlayerAudioSubAvailable = document.getElementById("player-audio-sub-comp");
      if (isPlayerAudioSubAvailable) this.mustShowAudioSubtitulos = true;
      this.playpause(true);
      return;
    }
    if (!this.isShowing) {
      this.show(true);
    }
    this.showAudioSubtitulos();
  }

  goAudioSubs() {
    if (this._activeComponent.type === "player-trick-modes") {
      this.playpause(true);
    }
    if (!this.isShowing) {
      this.show(true);
    }
    this.showAudioSubtitulos();
  }

  goRed() {
    this.goRec();
  }

  goRec() {
    if (this.isCurrentChannelApplication() && this.isFocusedChannelApplication()) {
      ModalMng.instance.showPopup("recordings-sin-derechos", null, null);
    } else if (!this.isCurrentSOLiveContentFinished() && !unirlib.isEmergencyMode()) {
      let evento = this.getCurrentProgram();
      const isMainProgram = this.opts.playerInfoComp ? this.opts.playerInfoComp.getIsMainProgram() : true;

      if (!isMainProgram) {
        evento = this.opts.playerInfoComp.getProgramActive();
      }
      const es_grabacion_individual = unirlib.getMyLists().estaRecordinglist(evento?.ShowId);
      const es_grabable = !this.getEventIsU7d(evento) && evento?.isGrabable();
      if (es_grabacion_individual) {
        this.runCommand("dejardegrabar");
      } else {
        // Si es u7d pasado o el canal/evento NO es grabable, no intentamos grabar.
        if (es_grabable) {
          this.runCommand("grabar");
        } else {
          const title = evento?.title || "";
          ModalMng.instance.showPopup("recordings-program-not-allowed", null, null, title);
        }
      }
    }
  }

  async goStop() {
    ///
    /// Ejecutamos lógica de STOP si nos encontramos con el componente [BingeWatching] o [BingeWatching Recomendaciones] con el fanart visualizado
    /// En ese caso, hemos llegado al final de la reproducción
    ///
    if (this.opts.playerStreamEventsComp?.opts?.fanArt) {
      this.opts.playerStreamEventsComp.goStop();
      return;
    }
    /** @type {PlayerViewKeys} */
    const self = this;
    if (!self.parentalAllowed() || unirlib.isEmergencyMode()) {
      return;
    }

    if (AppStore.yPlayerCommon.isLive() && (!AppStore.yPlayerCommon.isDiferido() || self.desdeCalle)) {
      let evento = self.getCurrentProgram();
      if (self.opts.playerInfoComp.isPrograms || self.opts.playerInfoComp.isMore) {
        evento = self.opts.playerInfoComp.getProgramActive();
      }
      const es_grabacion_individual = unirlib.getMyLists().estaRecordinglist(evento?.ShowId);
      if (es_grabacion_individual) {
        self.runCommand("dejardegrabar");
      } else {
        PlayMng.player.stopPlayTimeInfo();
        if (self.desdeCalle) {
          //
          //  Forzar ocultar el PlayerView antes de simular el back
          //
          self.hide();
          //
          //  Bandera
          //
          this.#isGoBackFromStop.value = true;
          this.goBack();
        } else {
          await self.stop(false);
        }
      }
    } else if ((self.es_u7d() || self.es_grabacion()) && self._getItMustReturnToLive()) {
      // U7D lanzado desde miniguia recupera el live(como si se hiciera back)
      this._returnToLive();
    } else {
      PlayMng.player.stopPlayTimeInfo();
      await self.stop(false);
    }
  }

  async goPlayPause() {
    ///
    /// Deshabilitar el STOP cuando el componente activo sea el botón [Omitir Segmento], [BingeWatching] o [RecomendacionesBW]
    ///
    if (!this.isPlayerScrollerActive) {
      this.opts.eventBus.emit(PLAYER_REFS.EVENTOS.PLAY_PAUSE);
    }
    if (this.activeComponent === this.opts?.playerStreamEventsComp) {
      if (this.activeComponent.opts?.tipo === BINGE_CONSTANTS.TIPO_COMPONENTE.BINGE_WATCHING_RECOMENDACIONES) {
        await this.#activeComponentDoKeyPressed("goPlay");
        return;
      }
      if (this.activeComponent.opts?.tipo === BINGE_CONSTANTS.TIPO_COMPONENTE.BINGE_WATCHING) {
        return;
      }
    }

    if (!this.isPlayerScrollerActive) {
      if (!this.parentalAllowed() || unirlib.isEmergencyMode()) return;

      const isSimilaresMode = this.opts.detailsSliders && this.opts.detailsSliders.isPlayerSimilaresMode;

      if (AppStore.yPlayerCommon.isLive() && !AppStore.yPlayerCommon.isDiferido() && !isSimilaresMode) {
        const evento = this.getCurrentProgram();
        if (!evento?.hasStartOver?.enabled) return;
      }

      const skipState = AppStore.yPlayerCommon.getSkipState();
      if (
        skipState !== AppStore.yPlayerCommon.REWIND &&
        skipState !== AppStore.yPlayerCommon.FORWARD &&
        this.activeComponent !== this.opts.playerAudioSubComp &&
        this.activeComponent !== this.opts.playerSlidersComp &&
        !(this.opts.playerInfoComp && this.isPipMenu)
      ) {
        // mostramos miniguide en play/pause si no estamos con
        // avance/retroceso rápido
        this.show();
      }

      if (isSimilaresMode) {
        this.opts.detailsSliders.goPlayPause();
      } else {
        this.playpause();
      }

      if (AppStore.yPlayerCommon.isStartOver()) {
        PlayMng.instance.opts.playerView.resetAudioSubComponent();
      }
    }
  }

  goFastForward() {
    ///
    /// Si el componente activo es del módulo Binge Watching, sólo se habilita FF si el componente es [Omitir Segmento]
    ///
    const { activeComponent } = this;
    let enable = true;
    const streamComp = this.opts?.playerStreamEventsComp;

    if (activeComponent === streamComp) {
      enable =
        streamComp?.opts?.tipo === BINGE_CONSTANTS.TIPO_COMPONENTE.OMITIR_SEGMENTO ||
        streamComp?.opts?.tipo === BINGE_CONSTANTS.TIPO_COMPONENTE.VOLVER_DIRECTO;
    }

    if (enable) {
      if (!unirlib.isEmergencyMode() && !this.isPlayerScrollerActive) {
        this.opts.eventBus.emit(PLAYER_REFS.EVENTOS.FASTFORWARD);
        this.executeFastForwardOrRewind("forward");
      } else if (this.isPlayerScrollerActive) {
        AppStore.yPlayerCommon.setSkipState(AppStore.yPlayerCommon.FORWARD);
        this._playerScroller.reset();
      }
    }
  }

  goRewind() {
    ///
    /// Si el componente activo es del módulo Binge Watching, sólo se habilita FF si el componente es [Omitir Segmento]
    ///
    const { activeComponent } = this;
    let enable = true;
    const streamComp = this.opts?.playerStreamEventsComp;

    if (activeComponent === streamComp) {
      enable =
        streamComp?.opts?.tipo === BINGE_CONSTANTS.TIPO_COMPONENTE.OMITIR_SEGMENTO ||
        streamComp?.opts?.tipo === BINGE_CONSTANTS.TIPO_COMPONENTE.VOLVER_DIRECTO;
    }
    if (enable) {
      if (!unirlib.isEmergencyMode() && !this.isPlayerScrollerActive) {
        this.opts.eventBus.emit(PLAYER_REFS.EVENTOS.REWIND);
        this.executeFastForwardOrRewind("rewind");
      } else if (this.isPlayerScrollerActive) {
        AppStore.yPlayerCommon.setSkipState(AppStore.yPlayerCommon.REWIND);
        this._playerScroller.reset();
      }
    }
  }

  /**
   * Pulsación tecla atrás en el mando
   * @returns {Promise<Boolean>}
   */
  async goBack() {
    /** @type {PlayerView } */
    const self = this;
    const itComesFromStop = this.#isGoBackFromStop.value;
    window.clearTimeout(self.opts.bingeWatchingMng?.bingeWatchingPlayer?.timeoutInactivity);

    const response = await self.activeComponent.goBack();
    if (response) {
      return true;
    }

    const actionWasCancelled = await self._playerActions.cancelAll();

    if (unirlib.is_incidence_mode_on()) {
      AppStore.home.show_exit();
    }

    if (this.isErrorShowing) {
      AppStore.errors.hideError();
      this.isErrorShowing = false;
      return true;
    }

    if (this.opts.detailsModalComp) {
      this.hideFicha();
      return true;
    }

    if (self.isShowing && !actionWasCancelled) {
      // Si se estan mostrando los controles ocultarlos
      hideComponentFrom(self);
    } else {
      if (this._getItMustReturnToLive() === true) {
        this._returnToLive();
        return true;
      }

      if (this._getItMustToClose() === true) {
        await this._goBackAndStop();
        return true;
      }

      //
      //  Si no se está haciendo loop entre los canales hacer un back normal
      //
      try {
        const isLooping = await this._loopThroughChannels(self, itComesFromStop);
        if (!isLooping) {
          await this._goBackAndStop();
        }
      } catch (error) {
        console.warn(error);
      }
    }
    return true;
  }

  /**
   * Se hace el back y se cierra el player si:
   * - Es publicidad (isVideoPlaza)
   * - No es un live (!isLive)
   * @private
   * @returns {boolean} true si se debe ejecutar el back.
   */
  _getItMustToClose() {
    const isVideoPlaza = AppStore.yPlayerCommon.isVideoPlaza;
    const isLive = AppStore.yPlayerCommon.isLive();
    return isVideoPlaza || !isLive;
  }

  /**
   * Obtiene el valor que verifica si se debe volver al directo, a saber
   * * _Debe_ ser live
   * * _Debe_ ser diferido
   * * _No_ debe venir de una calle
   *
   * @private
   * @returns {boolean} _true_ si debe volver al directo
   */
  _getItMustReturnToLive() {
    // Si la vista indica que debe volver al live de manera
    // directa
    if (AppStore.yPlayerCommon.itMustGoLive) {
      return true;
    }
    const isLive = AppStore.yPlayerCommon.isLive();
    const isDiferido = AppStore.yPlayerCommon.isDiferido();
    return isLive && isDiferido && !this.desdeCalle && !this.IsStartOverFromEpg;
  }

  /**
   * Cierra la vista y detiene el player
   *
   * @private
   */
  async _goBackAndStop() {
    await this.stop(false, AppStore.yPlayerCommon.isVideoPlaza, true);
    await super.goBack();
  }

  /**
   * Regresa al live guardando el punto de la información de Bookmark.
   *
   * @private
   */
  async _returnToLive() {
    const time = this.getTime();
    await this.savePuntoReproduccion(time);
    if (AppStore.yPlayerCommon.isVideoPlaza) AppStore.yPlayerCommon.isVideoPlaza = false;
    await this.goLive();
  }

  async goUp() {
    /** @type {PlayerViewKeys} */
    const self = this;
    const operation = await self.#activeComponentDoKeyPressed("goUp");
    if (!operation) {
      self.moveTo("goUp");
    }
    return true;
  }

  async goDown() {
    /** @type {PlayerViewKeys} */
    const self = this;
    const operation = await self.#activeComponentDoKeyPressed("goDown");
    if (!operation) {
      if (
        this.opts.playerInfoComp.isMore &&
        !this.opts.detailsModalComp &&
        this.activeComponent.type !== "player-audio-sub"
      ) {
        hideComponentFrom(this);
      } else {
        super.goDown();
      }
    }
    return true;
  }

  // TODO: Quitar cuando se implementen los thumbnails
  /**
   * Pulsación izquierda
   * @returns {Promise<Boolean>}
   */
  async goLeft() {
    if (
      this.opts.bingeWatchingMng?.bingeWatchingPlayer?.onFanArt &&
      this.activeComponent !== this.opts?.playerStreamEventsComp
    ) {
      return false;
    }
    /** @type {PlayerViewKeys} */
    const self = this;
    const operation = await self.#activeComponentDoKeyPressed("goLeft");
    if (!operation) {
      if (AppStore.yPlayerCommon.isSkipping()) {
        await this.resetStateAndResume();
      }
      self.moveTo("goLeft");
    }
    return true;
  }

  // TODO: Quitar cuando se implementen los thumbnails
  /**
   * Pulsación derecha
   * @returns {Promise<Boolean>}
   */
  async goRight() {
    if (
      this.opts.bingeWatchingMng?.bingeWatchingPlayer?.onFanArt &&
      this.activeComponent !== this.opts?.playerStreamEventsComp
    ) {
      return false;
    }
    /** @type {PlayerViewKeys} */
    const self = this;
    const operation = await self.#activeComponentDoKeyPressed("goRight");
    if (!operation) {
      if (AppStore.yPlayerCommon.isSkipping()) {
        await this.resetStateAndResume();
      }
      self.moveTo("goRight");
    }
    return true;
  }
  /*goRight() {
    const skipState = AppStore.yPlayerCommon.getSkipState();
    if (
      this.activeComponent === this.opts.playerInfoComp ||
      skipState == AppStore.yPlayerCommon.REWIND ||
      skipState == AppStore.yPlayerCommon.FORWARD
    ) {
      this.goFastForward();
    } else {
      super.goRight();
    }
  }*/

  async resetStateAndResume() {
    this.activeComponent = this.opts.playerInfoComp;
    await MitoAPI.instance.resumePlayer();
    AppStore.yPlayerCommon.setState(AppStore.yPlayerCommon.PLAYING);
    AppStore.yPlayerCommon.resetSkipState();
  }

  /**
   * Hace loop entre el stack de canales si existen
   * si no detiene el player
   *
   * @private
   * @param {PlayerView} playerView
   * @returns {Promise<Boolean>} true si esta haciendo ciclos de canales de lo contrario
   * false
   */
  async _loopThroughChannels(playerView, itComesFromStop = false) {
    if (itComesFromStop) {
      return false;
    }

    let isLoopingChannels = false;
    const isVideoPlaza = AppStore.yPlayerCommon.isVideoPlaza;
    const isDiferido = AppStore.yPlayerCommon.isDiferido();
    if (playerView._channelsStack.length > 0 && !isVideoPlaza && !isDiferido) {
      LoaderMng.instance.show_loader_now();
      isLoopingChannels = true;
      if (playerView._channelsStackCircular) {
        // En una pila circular ponemos el current al principio
        playerView._channelsStack.unshift(playerView._channel);
      }
      const channel = playerView._channelsStack.pop();
      if (channel) {
        if (playerView.opts.playerChannelsComp) {
          playerView.opts.playerChannelsComp.setChannel(channel.CodCadenaTv);
        }
        playerView.hide(true);
        await playerView.onClickChannel(channel, { stackChannel: false, showMiniguia: false });
      }
    }
    return isLoopingChannels;
  }
}

/** @typedef {import("./player-view").PlayerView} PlayerView */
