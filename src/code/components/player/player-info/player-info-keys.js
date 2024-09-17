import { DialMng } from "@newPath/managers/dial-mng";
import { PlayMng } from "src/code/managers/play-mng";
import { AppStore } from "src/code/managers/store/app-store";
import { ViewMng } from "src/code/managers/view-mng";
import { BaseComponent } from "src/code/views/base-component";
import { MitoAPI } from "@tvlib/MitoAPI";

export class PlayerInfoKeys extends BaseComponent {
  /**
   * Anotacion para evitar carga bajo ciertas condiciones
   * @param {Function} fn funcion a anotar
   */
  _skipIfHidingAnnotation(fn) {
    if (this.playerRef.isHiding() || PlayMng?.player?._stateAfterPlay === AppStore.yPlayerCommon.REWIND) {
      return true;
    }
    return fn.apply(this);
  }

  /**
   * Devuelve la comprobación de si es VOD, SO o Live pausado para permitir hacer el skip
   * @returns {Boolean} true si puede hacer skip
   */
  _canSkip() {
    const currentChannel = this.playerRef.getCurrentChannel();
    const hasLiveChannelSOEnabled = AppStore.yPlayerCommon.isLive() && currentChannel?.hasStartOver.enabled;
    const isStartOver = AppStore.yPlayerCommon.isStartOver();
    const isVod = this.playerRef._mode === 0;
    return !AppStore.yPlayerCommon.isVideoPlaza && (isVod || isStartOver || hasLiveChannelSOEnabled);
  }

  /**
   * Movimiento horizontal de los controles
   * @param {"prevProgram" | "nextProgram"} method
   * @returns {Promise<Boolean>}
   * @private
   */
  _moveHorizontal(method) {
    if (AppStore.yPlayerCommon.isSkipping()) return true;
    /**
     * @type {import("./player-info").PlayerInfoComponent}
     */
    return this._skipIfHidingAnnotation(() => {
      if (this.opts.isPrograms) {
        return this[`${method}`]();
      } else {
        if (!this.playerRef.isShowing) {
          this.playerRef.show(false, null, false);
        }
        if (this.playerRef.hasThumbs()) {
          this.playerRef.showThumbs();
        } else if (this._canSkip()) {
          this.playerRef.move(method == "prevProgram" ? "left" : "right");
        }
        return true;
      }
    });
  }

  goLeft() {
    return this._moveHorizontal("prevProgram");
  }

  goRight() {
    return this._moveHorizontal("nextProgram");
  }

  goChannelUp(playChannel = true, isFirstTime = false) {
    if (!AppStore.yPlayerCommon.isVideoPlaza && AppStore.yPlayerCommon.isLive()) {
      DialMng.instance.goUp(playChannel, isFirstTime);
      return true;
    }
    return false;
  }

  goChannelDown(playChannel = true, isFirstTime = false) {
    if (!AppStore.yPlayerCommon.isVideoPlaza && AppStore.yPlayerCommon.isLive()) {
      DialMng.instance.goDown(playChannel, isFirstTime);
      return true;
    }
    return false;
  }

  async goUp() {
    if (AppStore.yPlayerCommon.isSkipping()) return true;
    /** @type {import("./player-info").PlayerInfoComponent} */
    return await this._skipIfHidingAnnotation(async () => {
      if (
        this.playerRef.isCurrentChannelApplication() &&
        this.playerRef.isFocusedChannelApplication() &&
        this.playerRef.isShowing
      ) {
        await this.playerRef.opts.playerChannelsComp.showExpanded();
        this.showDescription();
        return false;
      }
      if (!this.playerRef.isShowing) {
        if (!this.goChannelUp(false, true)) {
          this.playerRef.show();
          return true;
        }
      } else if (!AppStore.yPlayerCommon.isVideoPlaza) {
        if (this.opts.isPip || this.opts.isMore) {
          return true;
        }
        if (this.opts.isPrograms) {
          return false;
        }
        if (!this.opts.isDescription) {
          if (this.playerRef.opts.playerChannelsComp) {
            await this.playerRef.opts.playerChannelsComp.showExpanded();
          }
          const description = this.getDescription();
          this.updateDescription(description);
          this.showDescription();
          return true;
        }
      }
      return true;
    });
  }

  async goDown() {
    if (AppStore.yPlayerCommon.isSkipping()) return true;
    return this._skipIfHidingAnnotation(async () => {
      if (!this.playerRef.isShowing) {
        if (!this.goChannelDown(false, true)) {
          this.playerRef.show();
          return true;
        }
      } else if (!AppStore.yPlayerCommon.isVideoPlaza) {
        if (this.playerRef.opts.popupComp) return true;
        if (this.opts.isPip) {
          this.playerRef.opts.playerActionsComp?.resetIndex();
          return true;
        } else if (this.opts.isDescription) {
          this.hideDescription();
        } else if (this.opts.isPrograms) {
          if (this.playerRef.opts.playerChannelsComp) {
            if (!this.playerRef.opts.playerChannelsComp.isInitialChannel()) {
              return true;
            }
            const progressBarActive = document.querySelector(".progress-bar.active");
            if (progressBarActive) progressBarActive.style.opacity = "1";
            if (!this.getIsMainProgram()) this.opts.elems["programs"].addClass("hide");
            await this.playerRef.restoreCopy();
            this.playerRef.opts.playerChannelsComp.hideExpanded();
          }
          this.hidePrograms();
        } else if (this.playerRef.opts.playerActionsComp?.allButtonsDisabled()) {
          return true;
        } else {
          if (this.playerRef.opts.pinTimeout) {
            // Si estamos esperando que salga el popup del PIN, desactivamos el movimiento
            return true;
          } else {
            return false;
          }
        }
      }
      return true;
    });
  }

  async goEnter() {
    if (this.playerRef.isErrorShowing) {
      AppStore.errors.hideError();
      this.playerRef.isErrorShowing = false;
      return true;
    }

    // Pulsación OK en canales sin multicast, lanza app asociada
    if (this.playerRef.isCurrentChannelApplication() && this.playerRef.isFocusedChannelApplication()) {
      const currentChannel = this.playerRef.getCurrentProgram();
      const channel = currentChannel._Canal;
      if (channel._catalogType === "external") {
        let pdevid = " ";
        if (channel._appId === "netflix") {
          const epInfo = await MitoAPI.instance.getAppInfo(channel._appId);
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
            launch: "manual",
            pdevid,
          },
          channel
        );
      }
      this.playerRef.launchCurrentAppChannel();
      return true;
    }

    if (this.playerRef.isHiding()) return true;
    if (!this.playerRef.isShowing) {
      this.playerRef.show(false, null, false);
      return true;
    } else if (this.opts.isPrograms) {
      const currentProgram = this.playerRef.getCurrentProgram();
      if (Object.keys(currentProgram).length === 0) {
        return true;
      } else {
        const $program = this.opts.elems["content_info"].eq(this.opts.programActive);
        if (!$program.hasClass("disabled")) {
          var command = $program.find(".simple-button").attr("command");
          this.playerRef.runCommand(command);
          return true;
        } else {
          ViewMng.instance.showPopup("popup_moral");
        }
      }
    } else {
      this.playerRef.playpause();
      return true;
    }
  }

  async goBack() {
    if (this.opts.isDescription) {
      this.hideDescription();
      return true;
    }

    if (this.opts.isPrograms) {
      if (this.playerRef.opts.playerChannelsComp) {
        await this.playerRef.restoreCopy();
        this.playerRef.opts.playerChannelsComp.hideExpanded();
      }
      this.hidePrograms();
      return true;
    }

    if (this.opts.isMore) {
      this.hideMore();
      return true;
    }

    if (this.opts.isPip) {
      this.hidePip();
      this.playerRef.show(false, "pip");
      return true;
    }

    return false;
  }
}
