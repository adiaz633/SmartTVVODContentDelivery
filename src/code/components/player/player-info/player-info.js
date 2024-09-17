import "@newPath/components/player/player-info/player-info.css";

import { AnimationsMng } from "src/code/managers/animations-mng";
import { ControlParentalMng } from "@newPath/managers/control_parental_mng";
import { DialMng } from "@newPath/managers/dial-mng";
import { KeyMng } from "src/code/managers/key-mng";
import { PipMng } from "@newPath/managers/pip-mng";
import { PlayMng } from "src/code/managers/play-mng";
import { AppStore } from "src/code/managers/store/app-store";
import {
  hidePlayerFanartMessage,
  removePlayerFanart,
  setPlayerFanart,
  showPlayerFanartMessage,
} from "src/code/views/player-view/components/player-fanart-component";
import * as PLAYER_REFS from "src/code/views/player-view/player-refs";
import { unirlib } from "@unirlib/main/unirlib";
import { Utils } from "@unirlib/utils/Utils";
import i18next from "i18next";

import { PlayerInfoAnimations } from "./player-info-animations";
import { PlayerInfoKeys } from "./player-info-keys";

export class PlayerInfoComponent extends PlayerInfoKeys {
  constructor(wrap) {
    super(wrap, "player-info", true);
    this.opts = {
      wrap, // html wrap
      data: null,
      tpl: {
        content_info: String.raw`
          <div class="content_info" id="content_info">
              <div class="content_info-div">
                <div id="titulo" class="titulo twolines"></div>
                <div id="subtitulo" class="subtitulo"></div>
                <div id="item-info" class="item-info"></div>
                <div id="hours" class="hours"></div>
                <div class="simple-button more-button" command="more">
                  <span class="button-text">...<span>
                </div>
              </div>
          </div>
        `,
        content_desc: String.raw`
          <div class="content_desc"></div>
        `,
        content_arrow: String.raw`
          <div class="content_arrow">
            <span class="icon icon-up icon_desc">
          </div>
        `,
        progress_bar: String.raw`
          <div class="progress-bar">
            <div class="time time_current"></div>
            <div class="progress-bar-back">
              <div class="progress-bar-progress" style="width: 0%;"></div>
              <div class="thumbs-progress" style="width: 0%;"></div>
            </div>
            <div class="time time_left"></div>
            <div class="time time_2live"></div>
          </div>
        `,
        publi_text: String.raw`
          <div class="publi_text">PUBLICIDAD</div>
        `,
      },

      elems: {},
      isDescription: false,
      isPrograms: false,
      isAnimating: false,
      isMore: false,
      isPip: false,
      programActive: 0,
      programs: {},
      programWidth: -1,
      programLeft: 0,
      descriptionTimeout: null,
      progressWidth: 0,
      progressLeft: 0,
      topFadeIn: null,
      numMiniguideBySideLeft: 0,
      numMiniguideBySideRight: 0,
      isHidden: true,
    };

    /**
     * Vista de player
     * @type {import("src/code/views/player-view/player-view").PlayerView}
     */
    this.playerRef = null;
    this.extras_config = { publiRoll: { percentil: [25, 50, 75] } };

    this.animations = new PlayerInfoAnimations(this);
  }

  destroy() {
    super.destroy();
    this.opts.wrap.remove("active");
    this.opts.wrap.empty();
  }

  reset_extrasConfig(item) {
    if (item === "publiRoll") this.extras_config.publiRoll = { percentil: [25, 50, 75] };
  }

  focus() {
    if (this.opts.isDescription) {
      this.hideDescription();
      this.opts.elems["progress_bar"].addClass("active");
    } else {
      if (this.opts.isMore) {
        this.hideMore();
      } else if (this.opts.isPrograms) {
        if (this.playerRef.opts.playerChannelsComp) {
          this.playerRef.opts.playerChannelsComp.showExpanded();
        }
        this.opts.elems["content_info"].eq(this.opts.programActive).addClass("active");
      } else {
        this.opts.elems["progress_bar"].addClass("active");
      }
    }
  }

  unfocus() {
    if (this.opts.isMore) return;
    if (this.opts.isPrograms) {
      this.opts.elems["content_info"].eq(this.opts.programActive).removeClass("active");
    } else {
      this.opts.elems["progress_bar"].removeClass("active");
    }
  }

  init(player) {
    this.playerRef = player;

    jQuery(this.opts.wrap).html(this.opts.tpl.app);

    this.opts.elems["programs"] = $('<div class="programs"></div>');
    this.opts.wrap.append(this.opts.elems["programs"]);

    if (!AppStore.yPlayerCommon.isVideoPlaza) {
      this.opts.wrap.removeClass("publi");

      this.opts.elems["content_info"] = $(this.opts.tpl.content_info);
      this.opts.elems["programs"].append(this.opts.elems["content_info"]);
      this.opts.elems["item_info"] = this.opts.elems["content_info"].find(".item-info");

      this.opts.elems["content_arrow"] = $(this.opts.tpl.content_arrow);
      this.opts.wrap.append(this.opts.elems["content_arrow"]);
      this.opts.elems["icon_desc"] = this.opts.elems["content_arrow"].find(".icon_desc");

      this.opts.elems["content_desc"] = $(this.opts.tpl.content_desc);
      this.opts.wrap.append(this.opts.elems["content_desc"]);
    }
    if (AppStore.yPlayerCommon.isVideoPlaza) {
      this.opts.elems["publi_text"] = $(this.opts.tpl.publi_text);
      this.opts.wrap.append(this.opts.elems["publi_text"]);

      this.opts.wrap.addClass("publi");
    }

    this.opts.elems["progress_bar"] = $(this.opts.tpl.progress_bar);
    this.opts.elems["programs"].append(this.opts.elems["progress_bar"]);
    this.opts.elems["progress-bar-back"] = this.opts.elems["progress_bar"].find(".progress-bar-back");
    this.opts.elems["progress-bar-progress"] = this.opts.elems["progress_bar"].find(".progress-bar-progress");
    this.opts.elems["thumbs-progress"] = this.opts.elems["progress_bar"].find(".thumbs-progress");
    this.opts.elems["time_current"] = this.opts.elems["progress_bar"].find(".time_current");
    this.opts.elems["time_left"] = this.opts.elems["progress_bar"].find(".time_left");
    this.opts.elems["time_2live"] = this.opts.elems["progress_bar"].find(".time_2live");

    this.opts.progressWidth = this.opts.elems["progress-bar-back"].width();
    this.opts.progressLeft = this.opts.elems["progress-bar-back"].position().left;

    if (AppStore.yPlayerCommon.isVideoPlaza) {
      this.opts.elems["progress-bar-progress"].addClass("publi");
    } else {
      this.opts.elems["progress-bar-progress"].removeClass("publi");
    }

    this.update();
    this.updateProgressBar(0);
  }

  update() {
    if (this.playerRef.isFocusedChannelApplication()) {
      this.loadAppChannelProgram();
    } else if (!this.playerRef.isCurrentChannelApplication()) {
      removePlayerFanart(this.playerRef);
    }
    if (!AppStore.yPlayerCommon.isVideoPlaza && !AppStore.yPlayerCommon.isAutoplay()) {
      if (PlayMng.player._stateAfterPlay === AppStore.yPlayerCommon.REWIND) {
        this.hideArrow();
        this.opts.elems["content_info"].css("opacity", 0);
      } else {
        this.opts.elems["content_info"].css("opacity", 1);
      }

      const currentProgram = this.playerRef.isLive
        ? this.playerRef.getCurrentProgram()
        : this.playerRef._datos_editoriales;
      this.playerRef.setTitulo(this.opts.elems["content_info"], currentProgram);
      this.playerRef.setInfo(this.opts.elems["item_info"], currentProgram);

      if (
        this.opts.isHidden &&
        this.playerRef._channel &&
        this.playerRef._channelsStack &&
        this.playerRef._channel.CodCadenaTv !== this.playerRef._channelsStack.CodCadenaTv
      ) {
        this.playerRef.opts.playerChannelsComp &&
          this.playerRef.opts.playerChannelsComp.setChannel(this.playerRef._channel.CodCadenaTv);
      }

      if (this.playerRef._mode === 1) {
        // Check allowed
        const event = this.playerRef._epg_channel[this.playerRef._eventoEnCurso];
        const allowed = event ? ControlParentalMng.instance.isContentAllowed(event) : true;
        let description = "";
        const $programCurrent = this.opts.elems["content_info"].eq(0);
        if (allowed) {
          $programCurrent.removeClass("disabled");
          description = this.getDescription();
        } else {
          $programCurrent.addClass("disabled");
          description = `<span class="not-allowed programs"><span class="subtitle">${i18next.t(
            "player.no_disponible_moral"
          )}</span></span>`;
        }
        this.updateDescription(description);

        let hora_inicio = "";
        let hora_fin = "";
        let currentProgram = this.playerRef._epg_channel[this.playerRef._eventoEnCurso];
        if (!currentProgram) {
          const channel = DialMng.instance.getCurrentChannel();
          if (channel && channel.Pases) {
            currentProgram = channel.Pases[0];
          }
        }
        if (currentProgram) {
          hora_inicio = Utils.date2String(currentProgram.FechaHoraInicio);
          hora_fin = Utils.date2String(currentProgram.FechaHoraFin);
        }
        hora_inicio = hora_inicio.replace(".", ":");
        hora_fin = hora_fin.replace(".", ":");

        if (this.opts.elems["time_current"].html() !== hora_inicio) {
          this.opts.elems["time_current"].html(hora_inicio);
        }
        if (this.opts.elems["time_left"].html() !== hora_fin) {
          this.opts.elems["time_left"].html(hora_fin);
        }
      } else {
        const description = this.getDescription();
        this.updateDescription(description);
      }

      if (this.opts.isPrograms) {
        this.stopDescriptionTimeout();

        this.opts.elems["programs"].addClass(".notransition");
        if (!this.opts.elems["programs"].hasClass("hide")) this.opts.elems["programs"].addClass("hide");
        this.opts.elems["programs"].css({
          transform: `translate3d(${0}px, 0px, 0px)`,
        });

        // Eliminamos todos excepto el current
        for (let i = 0; i < this.opts.elems["content_info"].length; i++) {
          const $program = this.opts.elems["content_info"].eq(i);
          if (!$program.hasClass("current")) $program.remove();
        }

        this.opts.elems["content_info"] = this.opts.elems["programs"].find(".content_info");
        const $program = this.opts.elems["content_info"].eq(0);
        //$program.css("left", this.opts.programLeft + "px");
        $program.removeClass("current");
        $program.removeClass("active");
        $program.find(".simple-button").css("opacity", 0);

        this.opts.wrap.removeClass("in-programs");
        this.opts.elems["programs"].removeClass("hide");
        this.showPrograms();
        this.opts.elems["content_info"].eq(this.opts.programActive).removeClass("active");
      }
    }
  }

  loadAppChannelProgram() {
    setPlayerFanart(this.playerRef);
    if (DialMng.instance.isActive()) showPlayerFanartMessage();
    this.opts.elems["time_current"].hide();
    this.opts.elems["time_left"].hide();
    this.opts.elems["item_info"].hide();
    this.opts.elems["progress-bar-progress"].css("width", "100%");
  }

  get isDescription() {
    return this.opts.isDescription;
  }
  get isPrograms() {
    return this.opts.isPrograms;
  }
  get isMore() {
    return this.opts.isMore;
  }

  updateDescription(description) {
    if (this.opts.elems["content_desc"].html() !== description) {
      this.opts.elems["content_desc"].html(description);
    }
  }

  updateDolbyIcon(isHidding = false) {
    if (this.opts.isMore) return;
    const channel = DialMng.instance.getCurrentChannel();
    const element = this.opts.elems["item_info"];
    const isDolby = channel?.isDolby && (AppStore.HdmiMng.isDolbyEnabled() || AppStore.HdmiMng.isDolbyPlusEnabled());
    const isAtmos = channel?.Atmos && (AppStore.HdmiMng.isDolbyEnabled() || AppStore.HdmiMng.isDolbyPlusEnabled());
    let dolbyElemIcon;
    let classToRemove;
    let classToAdd;

    if (isHidding) {
      if (isDolby) {
        dolbyElemIcon = element?.find(".icon-dolbyplus");
        classToRemove = "icon-dolbyplus";
      } else if (isAtmos) {
        dolbyElemIcon = element?.find(".icon-atmos");
        classToRemove = "icon-atmos";
      }
      classToAdd = "icon-dolby";
    } else {
      dolbyElemIcon = element?.find(".icon-dolby");
      if (dolbyElemIcon) {
        classToRemove = "icon-dolby";
        if (isDolby) {
          classToAdd = "icon-dolbyplus";
        } else if (isAtmos) {
          classToAdd = "icon-atmos";
        }
      }
    }
    if (dolbyElemIcon) {
      setTimeout(
        () => {
          dolbyElemIcon.removeClass(classToRemove);
          dolbyElemIcon.addClass(classToAdd);
        },
        isHidding ? 800 : 0
      );
    }
  }

  updateProgressBar(time, progressThumbs = 0) {
    const deactiveAUDQuartile = true;
    let progress = 0;
    let time2liveText = null;
    const inPrevProgram = false;
    if (AppStore.yPlayerCommon.isVideoPlaza || this.playerRef._mode === 0) {
      if (!this.playerRef._totalTime || isNaN(this.playerRef._totalTime) || this.playerRef._totalTime == 0) return;

      progress = (time / this.playerRef._totalTime) * 100;
      progress = Math.floor(progress * 1000) / 1000;

      let timeLeft = this.playerRef._totalTime - time;
      if (timeLeft < 0) timeLeft = 0;
      if (time !== undefined) {
        // Si time no existe, evitamos setear tiempos incorrectos
        const updateTimeCurrent = AppStore.yPlayerCommon.isVideoPlaza
          ? Utils.time2Text(time, false)
          : Utils.time2Text(time, true);

        const updateTimeLeft = AppStore.yPlayerCommon.isVideoPlaza
          ? Utils.time2Text(timeLeft, false)
          : Utils.time2Text(timeLeft, true);

        const updateTime = (element, newText) => {
          element.html(newText);
        };
        updateTime(this.opts.elems["time_current"], updateTimeCurrent);
        updateTime(this.opts.elems["time_left"], updateTimeLeft);
      }
    } else {
      let currentProgram = this.playerRef._epg_channel[this.playerRef._eventoEnCurso];
      if (!currentProgram) {
        const channel = DialMng.instance.getCurrentChannel();
        if (channel && channel.Pases) {
          currentProgram = channel.Pases[0];
        }
      }
      if (currentProgram) {
        if (currentProgram.isApplicationChannel()) {
          this.fillProgress();
          return;
        } else {
          const ahora = AppStore.appStaticInfo.getServerTime();
          const hora_actual = ahora.getTime();
          let difInicio = parseInt(hora_actual) - parseInt(currentProgram.FechaHoraInicio);

          const progreso_minutos = difInicio / 60000;
          progress = this.playerRef.calcProgress(progreso_minutos, currentProgram.Duracion);

          // Si hay diferencia con el directo
          const time2live = AppStore.yPlayerCommon.getTime2Live();
          if (
            time2live === 0 &&
            !AppStore.yPlayerCommon.isVideoPlaza &&
            AppStore.yPlayerCommon.isDiferido() &&
            PlayMng.player._stateAfterPlay === -1 // Añadimos si no estamos en RWD
          ) {
            if (AppStore.yPlayerCommon._position !== 0) {
              difInicio -= AppStore.yPlayerCommon._position;
            }
            AppStore.yPlayerCommon.setTime2Live(difInicio);
          }
          // Fake pause
          // time2live = 10*60000;
          if (time2live > 0) {
            const time2liveMin = time2live / 60000;
            progressThumbs = -this.playerRef.calcProgress(time2liveMin, currentProgram.Duracion);
            time2liveText = `-${Utils.ms2String(time2live)}`;
          }
          /*  if (time2live > difInicio) {
          // Estamos en un programa anterior al programa actual del directo
          inPrevProgram = true;
          progressThumbs = progress;
          progress = 0;
        } */
          // Si nos mantenemos en un programa actual ya finalizado, la barra de progreso debe seguir avanzando.
          // Las opciones de grabación en este caso deben desaparecer.
          if (this.playerRef.isCurrentSOLiveContentFinished()) {
            this.playerRef.opts.playerActionsComp?.removeButton("grabar");
            this.playerRef.opts.playerActionsComp?.removeButton("dejardegrabar");
            this.playerRef.opts.playerInfoComp.updateInfoRedDot(false);
            const time2liveDiferidoMin = time2live - (parseInt(hora_actual) - parseInt(currentProgram.FechaHoraFin));
            progressThumbs = -this.playerRef.calcProgress(time2liveDiferidoMin / 60000, currentProgram.Duracion);
          }
        }
      }
    }
    if (progress < 0) progress = 0;
    else if (progress > 100) progress = 100;

    if (progressThumbs === 0) {
      this.opts.elems["progress-bar-progress"].css("width", `${progress}%`);
      this.opts.elems["thumbs-progress"].css("width", "0%");
    } else {
      const progress0 = progress + progressThumbs;
      const minProgress = Math.min(progress, progress0);
      const maxProgress = Math.max(progress, progress0);

      if (minProgress === 100 && AppStore.yPlayerCommon.isDiferido()) {
        this.playerRef.goLive();
      }

      this.opts.elems["progress-bar-progress"].css("width", `${minProgress}%`);
      this.opts.elems["thumbs-progress"].css("width", `${maxProgress}%`);
    }

    if (
      (time2liveText || AppStore.yPlayerCommon.isPaused() || AppStore.yPlayerCommon.isDiferido()) &&
      !this.opts.isPrograms &&
      !this.opts.isMore &&
      time !== 0
    ) {
      if (this.opts.elems["time_2live"].html() !== time2liveText) {
        this.opts.elems["time_2live"].html(time2liveText);
      }
      let position = this.opts.progressLeft;
      if (!inPrevProgram) {
        position = this.opts.progressLeft - 60 + (this.opts.progressWidth * (progress + progressThumbs)) / 100;
        if (position < this.opts.progressLeft) position = this.opts.progressLeft;
      }
      this.opts.elems["time_2live"].css("left", `${position}px`);
      this.opts.elems["time_2live"].css("opacity", 1);

      // Evitamos que se cree el botón en un U7D
      if (
        !AppStore.yPlayerCommon.isVideoPlaza &&
        PlayMng.player._stateAfterPlay !== AppStore.yPlayerCommon.REWIND &&
        (time2liveText ||
          (AppStore.yPlayerCommon.isLive() &&
            (AppStore.yPlayerCommon.isPaused() || AppStore.yPlayerCommon.isDiferido())))
      ) {
        this.playerRef.opts.eventBus.emit(PLAYER_REFS.EVENTOS.GO_STARTOVERPLUS);
      }
    } else {
      this.opts.elems["time_2live"].css("opacity", 0);
      this.playerRef.removeGoLiveButton();
    }

    if (AppStore.yPlayerCommon.isVideoPlaza && !deactiveAUDQuartile) {
      const audience_sendTime = this.extras_config.publiRoll.percentil;
      const isSendPubli = audience_sendTime.length
        ? time >= Math.floor(this.playerRef._totalTime * audience_sendTime[0]) / 100
        : false;
      if (isSendPubli) {
        const percentil_value = audience_sendTime.shift(0);
        //auditar
        AppStore.tfnAnalytics.audience_playerAds("play", { evt: 2, percentile: percentil_value, ads: true });
      }
    }
  }

  fillProgress() {
    this.opts.elems["progress-bar-progress"].css("width", "100%");
  }

  getDescription() {
    const datosEditoriales = this.playerRef._datos_editoriales;
    if (datosEditoriales?.Descripcion) {
      return datosEditoriales.Descripcion;
    } else if (datosEditoriales?.description) {
      return datosEditoriales.description;
    } else if (datosEditoriales?.Sinopsis) {
      return datosEditoriales.Sinopsis;
    } else return "";
  }

  goClick(_event) {
    // var targetClass = event.target.className;
    /*
    if (this.playerRef.isShowingModal || targetClass.indexOf("more-button") >= 0) {
      this.playerRef.clickModal();
    }*/
  }

  async show() {
    this.hideDescription();
    this.opts.isHidden = false;
    if (this.opts.elems["content_desc"]) {
      this.opts.elems["content_desc"].css("opacity", 0);
    }
    if (this.opts.elems["content_info"]) {
      if (!this.opts.topFadeIn) this.opts.topFadeIn = this.opts.elems["content_info"].position().top;
      // AnimationsMng.instance.fadein(this.opts.elems["content_info"], 400, 57, this.opts.topFadeIn).then(() => {});
      this.opts.elems["content_info"].css("opacity", 1);
    }
  }

  hide() {
    this.opts.isHidden = true;
    if (this.opts.elems["content_info"]) {
      this.opts.elems["content_info"].css("opacity", 0);
    }
    if (this.opts.isDescription) {
      this.hideDescription();
    } else {
      if (this.opts.elems["content_desc"]) {
        this.opts.elems["content_desc"].css("opacity", 0);
      }
    }

    if (this.opts.isPrograms) {
      this.hidePrograms();
    }
  }

  showArrow() {
    if (this.opts.elems["content_arrow"]) {
      this.opts.elems["content_arrow"].css("opacity", 1);
    }
  }
  hideArrow() {
    if (this.opts.elems["content_arrow"]) {
      this.opts.elems["content_arrow"].css("opacity", 0);
    }
  }

  showProgress() {
    this.opts.wrap.removeClass("hide");
    this.opts.elems["progress_bar"].css("opacity", 1);
  }

  hideProgress() {
    this.opts.elems["progress_bar"].css("opacity", 0);
  }

  hideTimes() {
    this.opts.elems["time_current"].hide();
    this.opts.elems["time_left"].hide();
  }

  showTimes() {
    this.opts.elems["time_current"].show();
    this.opts.elems["time_left"].show();
  }

  async showDescription() {
    if (this.opts.isDescription) {
      return;
    }
    //
    // Bloquear para no recibir mas teclas hasta terminar la animacion
    //
    this.opts.isDescription = true;
    const unlock = await KeyMng.instance.mutex.acquire();
    try {
      clearTimeout(this.timeoutHideinfoextendida);
      this.playerRef.opts.eventBus.emit(PLAYER_REFS.EVENTOS.SHOW_DESCRIPTION);
      await this.animations.animateShowDescription();
      this.playerRef.stopTimeoutHide();
      this.startHideDescription();
    } finally {
      unlock();
    }
  }

  async hideDescription() {
    if (!this.opts.isDescription) {
      return;
    }
    this.opts.isDescription = false;
    const unlock = await KeyMng.instance.mutex.acquire();
    try {
      this.playerRef.opts.playerActionsDescComp?.opts.wrap.css("opacity", 0);
      this.playerRef.activeComponent = this;
      this.playerRef.restartTimeoutHide();
      clearTimeout(this.timeoutHideinfoextendida);
      await this.animations.animateHideDescription();
      this.playerRef.opts.eventBus.emit(PLAYER_REFS.EVENTOS.HIDE_DESCRIPTION);
    } finally {
      unlock();
    }
  }

  /** @private */
  startHideDescription() {
    const timerHideInfoExtendida = parseInt(AppStore.wsData._timerHideinfoextendida, 10);
    this.timeoutHideinfoextendida = setTimeout(() => {
      if (this.opts.isDescription) {
        this.playerRef.hide();
      }
    }, timerHideInfoExtendida);
  }

  showPrograms() {
    this.opts.elems["programs"].removeClass(".notransition");
    this.opts.elems["content_info"].addClass("transitory");

    // Creamos copia programs temporal para evitar problemas en refrescos
    this.opts.programs._eventoEnCurso = this.playerRef._eventoEnCurso;
    this.opts.programs._epg_channel = this.playerRef._epg_channel;

    this.opts.isDescription = false;
    this.opts.isPrograms = true;

    const $programCurrent = this.opts.elems["content_info"].eq(0);
    if (!$programCurrent) return;

    if (this.opts.programLeft === 0) this.opts.programLeft = $programCurrent.position().left;
    this.opts.programWidth = $programCurrent.width();
    $programCurrent.find(".simple-button").css("opacity", 1);
    $programCurrent.addClass("active");
    $programCurrent.addClass("current");

    const event = this.playerRef._epg_channel[this.playerRef._eventoEnCurso];
    const allowed = event ? ControlParentalMng.instance.isContentAllowed(event) : true;
    const programBar = document.querySelector(".progress-bar.active");
    if (programBar) {
      if (!allowed) {
        programBar.style.opacity = "0.25";
        $programCurrent.addClass("disabled");
      } else {
        programBar.style.opacity = "1";
        $programCurrent.removeClass("disabled");
      }
    }

    // Los canales sin multicast no muestran programación, quitamos elementos y salimos
    if (event?.isApplicationChannel()) {
      this.showApplicationProgram();
      return;
    } else {
      this.restoreInfo();
    }

    // Programas anteriores
    let countLeft = 0;
    for (let i = this.opts.programs._eventoEnCurso - 1; i >= 0; i--) {
      const $programInfo = this.createProgram(i);
      this.opts.elems["programs"].prepend($programInfo);
      countLeft++;
    }

    // Programas siguientes
    for (let i = this.opts.programs._eventoEnCurso + 1; i < this.opts.programs._epg_channel.length; i++) {
      const $programInfo = this.createProgram(i);
      this.opts.elems["programs"].append($programInfo);
    }

    // Creamos de los laterales (U7D y/o guiatv)
    const programOnSideLeft = this.createEndElementForSide(this.playerRef.opts.itemProgramsMiniguideLeft);
    if (programOnSideLeft) {
      this.opts.elems["programs"].prepend(programOnSideLeft);
      this.opts.numMiniguideBySideLeft = 1;
    }
    const programOnSideRight = this.createEndElementForSide(this.playerRef.opts.itemProgramsMiniguideRight);
    if (programOnSideRight) {
      this.opts.elems["programs"].append(programOnSideRight);
      this.opts.numMiniguideBySideRight = 1;
    }

    countLeft += this.opts.numMiniguideBySideLeft;
    this.opts.elems["content_info"] = this.opts.elems["programs"].find(".content_info");
    const leftOrigin = this.opts.programLeft - countLeft * this.opts.programWidth;
    this.opts.elems["content_info"].eq(0).css("margin-left", `${leftOrigin}px`);

    this.opts.programActive =
      this.opts.programs._eventoEnCurso === -1
        ? this.opts.numMiniguideBySideLeft
        : this.opts.programs._eventoEnCurso + this.opts.numMiniguideBySideLeft;

    this.opts.elems["content_info"].removeClass("transitory");
    this.opts.wrap.addClass("in-programs");
  }

  // Le pasaremos los valores que tengamos en itemProgramsMiniguideLeft y itemProgramsMiniguideRight
  createEndElementForSide(typeElement) {
    let programElement = null;
    if (typeElement) {
      typeElement = typeElement.toLowerCase();
      if (typeElement == this.playerRef._GuiaTVonSide) {
        programElement = this.createEpg();
      } else if (typeElement == this.playerRef._U7DonSide) {
        programElement = this.createU7d();
      }
    }
    return programElement;
  }

  /* Prepara programa principal si es application, lo deja sin horas, progreso ni botones */
  showApplicationProgram() {
    const program = this.opts.elems["content_info"].eq(0);
    program.find(".simple-button").css("opacity", 0);
    program.find(".hours").css("opacity", 0);
    program.find(".item-info").css("opacity", 0);
    this.opts.elems["content_info"].show();

    // Ocultamos horas de la barra de progreso
    this.opts.elems["time_current"].hide();
    this.opts.elems["time_left"].hide();

    this.opts.programActive = this.opts.programs._eventoEnCurso;

    hidePlayerFanartMessage();
    this.hideProgress();
    const textDescription = this.opts.programs._epg_channel[this.opts.programActive - 1]?.Resena;
    if (textDescription) this.updateDescription(textDescription);
  }

  /* Devuelve player-info a su estado previo si ha sido modificado */
  restoreInfo() {
    if (!this.playerRef.isCurrentChannelApplication() && !this.playerRef.isFocusedChannelApplication()) {
      hidePlayerFanartMessage();
      this.updateProgressBar();
      this.showTimes();
    }
    this.showProgress();
  }

  hidePrograms() {
    this.restoreInfo();
    if (this.opts.isAnimating) return;
    if (this._up.opts.indexInitial !== this._up.opts.index) {
      const currentProgram = this.playerRef.isLive
        ? this.playerRef.getCurrentProgram()
        : this.playerRef._datos_editoriales;
      this.playerRef.setTitulo(this.opts.elems["content_info"], currentProgram);
      this.playerRef.setInfo(this.opts.elems["item_info"], currentProgram);
      this.playerRef.opts.playerChannelsComp.setChannel(this.playerRef._channel.CodCadenaTv);
    }
    const { opts } = this;
    const self = this;
    this.opts.isPrograms = false;
    this.opts.isAnimating = true;
    this.stopDescriptionTimeout();

    this.opts.programs._eventoEnCurso = -1;
    this.opts.programs._epg_channel = [];

    // Eliminamos todos excepto el current
    for (let i = 0; i < this.opts.elems["content_info"].length; i++) {
      const $program = this.opts.elems["content_info"].eq(i);
      if (!$program.hasClass("current")) $program.remove();
    }
    this.opts.elems["content_info"] = this.opts.elems["programs"].find(".content_info");
    const $program = this.opts.elems["content_info"].eq(0);
    $program.removeClass("current");
    $program.removeClass("active");
    $program.find(".simple-button").css("opacity", 0);

    opts.elems["content_arrow"].addClass("active");
    opts.elems["content_desc"].css("opacity", 0);
    opts.wrap.removeClass("in-programs");

    self.playerRef.activeComponent = this;
    opts.elems["icon_desc"].css({ transform: `translate3d(0px, ${184}px, 0px) rotate(0deg)` });
    opts.elems["icon_desc"].one("transitionend", (event) => {
      setTimeout(() => {
        opts.elems["programs"].removeClass("hide");
        opts.elems["icon_desc"].css({
          transform: `translate3d(0px, ${0}px, 0px) rotate(0deg)`,
        });
        opts.elems["icon_desc"].one("transitionend", (event) => {
          opts.elems["content_arrow"].removeClass("active");
          opts.isAnimating = false;
        });
        opts.elems["programs"].addClass(".notransition");
        opts.elems["programs"].css({
          transform: `translate3d(${0}px, 0px, 0px)`,
        });
        self.playerRef.opts.playerActionsComp?.opts.wrap.css({
          transform: `translate3d(0px, ${0}px, 0px)`,
        });
      }, 50);
    });
  }

  createProgram(index) {
    const $programInfo = $(this.opts.tpl.content_info);
    const item_info = $programInfo.find(".item-info");
    const program = this.opts.programs._epg_channel[index];
    this.playerRef.setTitulo($programInfo, program);
    this.playerRef.setInfo(item_info, program);
    const hora_inicio = Utils.date2String(program.FechaHoraInicio);
    const hora_fin = Utils.date2String(program.FechaHoraFin);
    $programInfo.find(".hours").html(`${hora_inicio} - ${hora_fin}`);

    $programInfo.find(".simple-button").css("opacity", 1);
    $programInfo.find(".hours").css("opacity", 1);
    $programInfo.css("opacity", 1);

    const allowed = program ? ControlParentalMng.instance.isContentAllowed(program) : true;
    if (!allowed) $programInfo.addClass("disabled");
    return $programInfo;
  }

  createEpg() {
    const $programInfo = $(this.opts.tpl.content_info);
    $programInfo.find(".titulo").html("Guía TV");
    $programInfo.find(".titulo").removeClass("twolines");
    $programInfo.find(".subtitulo").html("Toda la programación");
    $programInfo.find(".subtitulo").css("opacity", 1);

    const $simpleButton = $programInfo.find(".simple-button");
    $simpleButton.attr("command", "epg");
    $simpleButton.empty();
    $simpleButton.addClass("u7d-epg");
    $simpleButton.append("<span class='icon icon-mainmenu-guia' aria-hidden='true'></span>");
    $simpleButton.css("opacity", 1);

    $programInfo.css("opacity", 1);
    return $programInfo;
  }
  createU7d() {
    const $programInfo = $(this.opts.tpl.content_info);
    $programInfo.find(".titulo").html("Últimos 7 días");
    $programInfo.find(".titulo").removeClass("twolines");
    $programInfo.find(".subtitulo").html("Toda la programación");
    $programInfo.find(".subtitulo").css("opacity", 1);

    const $simpleButton = $programInfo.find(".simple-button");
    $simpleButton.attr("command", "u7d");
    $simpleButton.empty();
    $simpleButton.addClass("u7d-epg");
    $simpleButton.append("<span class='icon icon-mainmenu-u7d' aria-hidden='true'></span>");
    $simpleButton.append("<span class='icon icon-mainmenu-recdot' aria-hidden='true'></span>");
    $simpleButton.css("opacity", 1);

    $programInfo.css("opacity", 1);
    return $programInfo;
  }

  focusProgram() {
    this.startDescriptionTimeout();
    this.opts.elems["content_info"].eq(this.opts.programActive).addClass("active");
    const difEnCurso =
      this.opts.programs._eventoEnCurso === -1
        ? (this.opts.numMiniguideBySideLeft - this.opts.programActive) * this.opts.programWidth
        : (this.opts.programs._eventoEnCurso + this.opts.numMiniguideBySideLeft - this.opts.programActive) *
          this.opts.programWidth;
    this.opts.elems["programs"].css({
      transform: `translate3d(${difEnCurso}px, 0px, 0px)`,
    });
    // Llamada asíncrona a "details" como precarga para siguientes acciones (submenú o por teclas)
    const event = this.opts.programs._epg_channel[this.opts.programActive - 1];
    if (!event.isApplicationChannel()) {
      this.playerRef._detailsController.loadDetailsTemporal(event).catch(() => {});
    }
  }

  nextProgram() {
    if (this.opts.programActive < this.opts.elems["content_info"].length - 1) {
      this.opts.elems["content_info"].eq(this.opts.programActive).removeClass("active");
      this.opts.elems["content_desc"].css("opacity", 0);
      this.opts.programActive++;
      this.focusProgram();
      return false;
    }
    return true;
  }

  prevProgram() {
    if (this.opts.programActive > 0) {
      this.opts.elems["content_info"].eq(this.opts.programActive).removeClass("active");
      this.opts.elems["content_desc"].css("opacity", 0);
      this.opts.programActive--;
      this.focusProgram();
      return false;
    }
    return true;
  }

  startDescriptionTimeout() {
    const self = this;
    this.stopDescriptionTimeout();
    this.opts.descriptionTimeout = window.setTimeout(async () => {
      let textDescription = "";
      const program = self.opts.programs._epg_channel[self.opts.programActive - 1];
      if (program) {
        const allowed = program ? ControlParentalMng.instance.isContentAllowed(program) : true;
        const programBar = document.querySelector(".progress-bar.active");
        if (allowed) {
          if (programBar && self.opts.programActive === self.playerRef._eventoEnCurso + 1) {
            textDescription = self.getDescription();
            programBar.style.opacity = "1";
          } else if (self.opts.programActive === 0) {
            textDescription = "Consulta toda la programación 7 días vista de todos los canales de la plataforma";
          } else if (self.opts.programActive === self.opts.elems["content_info"].length - 1) {
            textDescription = "Consulta la guía de programación de todos los canales de la plataforma";
          } else {
            textDescription = self.opts.programs._epg_channel[self.opts.programActive - 1].Resena;
          }
        } else {
          textDescription = `<span class="not-allowed programs"><span class="subtitle">${i18next.t(
            "player.no_disponible_moral"
          )}</span></span>`;
          if (self.opts.programActive === self.playerRef._eventoEnCurso + 1) programBar.style.opacity = "0.25";
        }
        await AnimationsMng.instance.changeText(self.opts.elems["content_desc"], 300, textDescription);
        if (!self.opts.descriptionTimeout) self.opts.elems["content_desc"].css("opacity", 0);
      }
    }, 600);
  }
  stopDescriptionTimeout() {
    if (this.opts.descriptionTimeout) {
      window.clearTimeout(this.opts.descriptionTimeout);
      this.opts.descriptionTimeout = null;
    }
  }

  showMore() {
    this.opts.isPrograms = false;
    const activeProgram = this.getProgramActive();

    for (let i = 0; i < this.opts.elems["content_info"].length; i++) {
      if (i !== this.opts.programActive) {
        this.opts.elems["content_info"].eq(i).css("opacity", 0);
      }
    }

    const allowed = $program ? ControlParentalMng.instance.isContentAllowed(activeProgram) : true;
    const $program = this.opts.elems["content_info"].eq(this.opts.programActive);
    $program.addClass("show-main");
    $program.find(".simple-button").css("opacity", 0);

    const isFav = this.playerRef.isFavorite();
    let comandoFavoritos = "add_favoritos";
    if (isFav) comandoFavoritos = "del_favoritos";

    const commands = ["valorar", comandoFavoritos, "ficha"];
    //if (this.playerRef._mode === 1) {
    commands.shift("valorar");
    //}

    if (
      activeProgram?.isGrabable() &&
      this.opts.programActive >= this.opts.programs._eventoEnCurso + 1 &&
      this.playerRef._mode === 1 &&
      activeProgram.ShowId &&
      !this.playerRef.isCurrentSOLiveContentFinished()
    ) {
      const es_grabacion_individual = unirlib.getMyLists().estaRecordinglist(activeProgram.ShowId);
      if (es_grabacion_individual) {
        commands.unshift("dejardegrabar");
      } else {
        commands.unshift("grabar");
      }
    }
    // Miramos si hay bookmarking
    let hay_bookmarking = false;
    const program = this.opts.programs._epg_channel[this.opts.programActive - 1];
    if (program) {
      hay_bookmarking = unirlib.getMyLists().get_viewing_by_id(program.ShowId, "LiveSchedule");
    }
    if (hay_bookmarking) {
      commands.unshift("continuar");
    } else if (
      this.opts.programActive < this.opts.programs._eventoEnCurso + 1 &&
      AppStore.profile.user_has_catchup() &&
      this.playerRef.getCurrentChannel().hasU7D?.enabled
    ) {
      commands.unshift("ver");
    } else if (this.opts.programActive == this.opts.programs._eventoEnCurso + 1 && program?.hasStartOver?.enabled) {
      commands.unshift("ver_inicio");
    }

    this.playerRef.opts.playerActionsDescComp.createButtons(commands);

    this.playerRef.opts.playerActionsDescComp.opts.wrap.css("opacity", 1);
    this.playerRef.activeComponent = this.playerRef.opts.playerActionsDescComp;
    if (this.opts.programActive !== this.opts.programs._eventoEnCurso + 1) {
      this.opts.elems["progress_bar"].css("opacity", 0);
    } else if (!allowed) {
      this.opts.elems["progress_bar"].css("opacity", 0.25);
    } else {
      this.opts.elems["progress_bar"].css("opacity", 1);
    }
  }

  hideMore() {
    this.opts.isMore = false;
    this.opts.isPrograms = true;

    for (let i = 0; i < this.opts.elems["content_info"].length; i++) {
      this.opts.elems["content_info"].eq(i).css("opacity", 1);
    }
    this.opts.elems["progress_bar"].css("opacity", 1);

    const $program = this.opts.elems["content_info"].eq(this.opts.programActive);
    $program.removeClass("show-main");
    $program.find(".simple-button").css("opacity", 1);
    this.playerRef.opts.playerActionsDescComp.opts.wrap.css("opacity", 0);
    this.playerRef.activeComponent = this;
  }

  showPipMenu() {
    this.opts.isPip = true;
    this.opts.isPrograms = false;

    for (let i = 0; i < this.opts.elems["content_info"].length; i++) {
      this.opts.elems["content_info"].eq(i).css("opacity", 0);
    }
    this.opts.elems["progress_bar"].css("opacity", 0);
    const $program = this.opts.elems["content_info"].eq(this.opts.programActive);
    $program.find(".simple-button").css("opacity", 0);
    this.hideArrow();

    this.updatePipMenu();
    this.playerRef.opts.playerActionsDescComp.opts.wrap.css("opacity", 1);

    this.playerRef.showHint(`<p class='player-message pip'>${i18next.t("settings.pip_message")}</p>`);
    this.playerRef.showHint(`<p class='tv-back'>${i18next.t("settings.tv_back_icon")}</p>`);
  }

  updatePipMenu() {
    let commands = ["pip_derecha", "pip_izquierda"];
    if (PipMng.instance.isActive) {
      if (PipMng.instance.position === "right") {
        commands = ["pip_quitar", "pip_izquierda", "pip_switch_derecha"];
      } else if (PipMng.instance.position === "left") {
        commands = ["pip_quitar", "pip_derecha", "pip_switch_izquierda"];
      }
    }
    this.playerRef.opts.playerActionsDescComp.init(this.playerRef, commands, true);
    this.playerRef.activeComponent = this.playerRef.opts.playerActionsDescComp;
  }

  hidePip() {
    this.opts.isPip = false;
    this.opts.isPrograms = false;
    this.playerRef.opts.playerActionsDescComp.opts.wrap.css("opacity", 0);
    this.playerRef.hideHints();
    // Dejamos como opción activa en miniguía el pip
    this.playerRef.activeComponent = this.playerRef.opts.playerActionsComp;
  }

  get isPipMenu() {
    return this.opts?.isPip;
  }

  getProgramActive() {
    return this.playerRef._epg_channel[this.opts.programActive - 1];
  }

  getIsMainProgram() {
    const isActivePrograms = this.opts.isPrograms || this.opts.isMore;
    const mainProgram = this.playerRef.getCurrentProgram();
    const activeProgram = this.getProgramActive();

    return isActivePrograms && mainProgram && activeProgram ? mainProgram === activeProgram : true;
  }

  updateInfoRedDot(show) {
    show = typeof show !== "undefined" ? show : false;
    let element = null;
    if (this.opts.isMore || this.opts.isPrograms) {
      // Actualizamos un elemento concreto de la miniEPG
      const content_info = this.opts.elems["content_info"].eq(this.opts.programActive);
      element = content_info.find(".item-info");
    } else {
      // Actualizamos el elemento central de la miniEPG
      element = this.opts.elems["item_info"];
    }
    const recDotElem = element.find(".rec_dot");

    if (!show && recDotElem.length > 0) {
      recDotElem.parent().remove();
    } else if (show && recDotElem.length == 0) {
      const item_info_element = '<div class="item-info-element"><div class="rec_dot"></div></div>';
      element.prepend(item_info_element);
    }
  }

  isPubliUI() {
    return this.opts.wrap.hasClass("publi");
  }
  getAllPrograms() {
    return this.opts.programs?._epg_channel;
  }

  updateRecordingsPrograms() {
    const allPrograms = this.getAllPrograms();
    if (!allPrograms) return;
    const allProgramContainers = this.opts.elems?.content_info;
    for (let i = 0; i < allPrograms.length; i++) {
      const indexContainer = i + 1;
      const estaRecording = unirlib.getMyLists().estaRecordinglist(allPrograms[i]._ShowId);
      const container = allProgramContainers[indexContainer];
      const element = container.querySelectorAll(".item-info")[0];
      const recDotElem = element.querySelectorAll(".rec_dot")[0];
      if (estaRecording && !recDotElem) {
        const item_info_element = '<div class="item-info-element"><div class="rec_dot"></div></div>';
        element.insertAdjacentHTML("afterbegin", item_info_element);
      } else if (!estaRecording && recDotElem) {
        const dotParent = recDotElem.parentNode;
        dotParent.remove();
      }
    }
  }

  setNotAllowed() {}

  setAllowed() {}
}
