import "@newPath/components/player/player-status/player-status.css";

import { AppStore } from "src/code/managers/store/app-store";
import { BaseComponent } from "src/code/views/base-component";
import i18next from "i18next";

import * as PLAYER_REFS from "../../../views/player-view/player-refs";

export class PlayerStatusComponent extends BaseComponent {
  constructor(wrap) {
    super(wrap, "player-status", true);
    this.opts = {
      wrap,
      tpl: {
        icon: '<div id="playervod_player_status_icon" class="player_status_icon"></div>',
      },
      elems: {},
    };
    this.player_status_timeout = null;
    /** @type {import ("../../../views/player-view").PlayerView} */
    this.playerRef = null;
    this.isActiveTrickModes = false;
  }

  init(player) {
    this.playerRef = player;
    this.bind();
  }

  bind() {
    this.opts.elems["player_status_icon"] = $(this.opts.tpl.icon);
    this.opts.wrap.append(this.opts.elems["player_status_icon"]);
    this.isActiveTrickModes = false;
  }

  focus() {}
  unfocus() {}
  goClick() {}

  getScreenStatus() {
    if (
      this.opts.elems["player_status_icon"] &&
      this.opts.elems["player_status_icon"][0] &&
      this.opts.elems["player_status_icon"][0].querySelector(".icon") &&
      this.opts.elems["player_status_icon"][0].querySelector(".icon").className
    ) {
      const classElement = this.opts.elems["player_status_icon"][0].querySelector(".icon").className;
      if (classElement.includes("pause")) return "pause";
      else if (classElement.includes("play") || classElement.includes("ver-inicio")) return "play";
    }
  }
  setScreenStatus(status, parameters = null) {
    this.clear_timeoutStatusScreenBgClear();
    this.opts.elems["player_status_icon"].empty();
    this.opts.wrap.removeClass("ffwrwd");
    this.isActiveTrickModes = false;
    switch (status) {
      case "restart":
        if (this.playerRef.opts.playerInfoComp) {
          jQuery('<span class="icon icon-play">').appendTo(this.opts.elems["player_status_icon"]);
          this.playerRef.opts.wrap.css("opacity", 1);
          this.playerRef.opts.playerInfoComp.show();
          this.playerRef.opts.playerInfoComp.showArrow();
          this.playerRef.opts.playerInfoComp.showProgress();
          if (this.playerRef.opts.playerActionsComp) {
            this.playerRef.opts.playerActionsComp.resetIndex();
            this.playerRef.opts.playerActionsComp.show();
          }
          this.playerRef.activeComponent = this.playerRef.opts.playerInfoComp;
        }
        AppStore.yPlayerCommon.resetSkipState();
        this.playerRef.play();
        this.playerRef.showChannelLogos();
        break;
      case "play":
        jQuery('<span class="icon icon-play">').appendTo(this.opts.elems["player_status_icon"]);
        this.show();
        this.start_timeoutStatusScreenBgClear();
        this.playerRef.showChannelLogos();
        break;
      case "pause":
        jQuery('<span class="icon icon-pause">').appendTo(this.opts.elems["player_status_icon"]);
        this.show();
        this.playerRef.showChannelLogos();
        break;
      case "goinit":
        jQuery('<span class="icon icon-ver-inicio">').appendTo(this.opts.elems["player_status_icon"]);
        this.show();
        this.start_timeoutStatusScreenBgClear();
        this.playerRef.showChannelLogos();
        break;
      case "none":
        this.show();
        this.playerRef.hide(true);
        this.start_timeoutStatusScreenBgClear();
        this.playerRef.showChannelLogos();
        break;
      case "rwx1":
      case "rwx2":
      case "rwx3":
      case "rwx4":
      case "ffx1":
      case "ffx2":
      case "ffx3":
      case "ffx4":
        {
          this.playerRef.opts.playerInfoComp.hide();
          this.playerRef.hideChannelLogos();
          this.opts.wrap.addClass("ffwrwd");
          const pow = parseInt(status.substring(3, 4));
          let rewindClass = "";
          let isRewind = false;
          if (status.search("rw") != -1) {
            rewindClass = " rewind";
            isRewind = true;
          }
          for (let i = 0; i < 4; i++) {
            let activeClass = "";
            if (!isRewind && i < pow) activeClass = " active";
            else if (isRewind && 3 - i < pow) activeClass = " active";
            jQuery(`<span class="icon icon-play${activeClass}${rewindClass}">`).appendTo(
              this.opts.elems["player_status_icon"]
            );
          }
          this.show();
          this.isActiveTrickModes = true;
        }
        break;
      case "scroller-ffx":
      case "scroller-rwx":
        {
          /** @type {import ("../../../views/player-view/player-view").PlayerView*/
          const player = this.playerRef;

          player.opts.playerInfoComp.hide();
          player.hideChannelLogos();
          const { seconds } = parameters;
          let time = 0;
          let units = "";
          if (seconds < 60) {
            time = seconds;
            units = i18next.t("settings.seconds");
          } else {
            time = Math.trunc(seconds / 60);
            units = time === 1 ? i18next.t("settings.minute") : i18next.t("settings.minutes");
          }

          jQuery(
            `<span class="icon icon-${status}">${time}</span><span class="units">${units.toUpperCase()}</span>`
          ).appendTo(this.opts.elems["player_status_icon"]);

          this.show();
          ///
          /// Emitimos el evento donde se muestra el icono de saltos discretos
          ///
          player.opts.eventBus.emit(PLAYER_REFS.EVENTOS.SALTOS_DISCRETOS);
          this.isActiveTrickModes = true;
        }

        break;

      default:
        this.hide();
        break;
    }
  }

  start_timeoutStatusScreenBgClear() {
    const self = this;
    const timerHideIconMinivod = AppStore.wsData.getContext().timerHideIconMinivod
      ? parseInt(AppStore.wsData.getContext().timerHideIconMinivod)
      : 500;
    if (!this.player_status_timeout) {
      this.player_status_timeout = window.setTimeout(() => {
        self.hide();
      }, timerHideIconMinivod);
    }
  }

  clear_timeoutStatusScreenBgClear() {
    if (this.player_status_timeout) {
      window.clearTimeout(this.player_status_timeout);
      this.player_status_timeout = null;
    }
  }

  isVisibleTrickModes() {
    return this.isActiveTrickModes;
  }

  destroy() {
    this.opts.elems["player_status_icon"].remove();
  }
}
