import { BackgroundMng } from "src/code/managers/background-mng";
import { ControlParentalMng } from "@newPath/managers/control_parental_mng";
import { DialMng } from "@newPath/managers/dial-mng";
import { HomeMng } from "src/code/managers/home-mng";
import { PlayMng } from "src/code/managers/play-mng";
import { ViewMng } from "src/code/managers/view-mng";
import { ViewActivator } from "src/code/managers/view-mng/view-activator";
import { yPlayerCommon } from "@unirlib/server/yPlayerCommon";

import { hidePlayerFanartMessage, removePlayerFanart, updateFanartUrl } from "./components/player-fanart-component";

export class PlayerViewActivator extends ViewActivator {
  /**
   * @param {PlayerView} playerView
   */
  async activate(playerView, originalActivate) {
    //
    // Si se activa una vista de player quitar el modo background y mostrar los
    // controles si hubiere
    //
    await PlayMng.player.setFullscreen();
    await PlayMng.instance.setBackgroundMode(false);
    BackgroundMng.instance.hide_full_background(playerView);
    HomeMng.instance.hide();
    playerView.show();
    if (playerView.isCurrentChannelApplication() && playerView.isFocusedChannelApplication()) {
      updateFanartUrl(playerView);
    }
    return originalActivate();
  }

  /**
   * @param {PlayerView} playerView
   */
  async deactivate(playerView, originalDeactivate) {
    if (!yPlayerCommon.isLive()) {
      playerView.reloadPlayerWrap(false);
    }
    if (playerView.isPipActive() && !ViewMng.instance.isPlayerActive()) {
      // PiP activado y playerView NO activa(esta en stack), si llega un deactivate, ponemos PiP en standby
      await playerView.setPipStandby();
    }
    await originalDeactivate();
    HomeMng.instance.show();
    if (!playerView.opts?.sliderSugerencias) this.#showBackgroundIfNeeded(playerView);

    playerView.hide(true);
    DialMng.instance.hide(0);
    if (playerView.opts.detailsSliders) {
      // Si existen los sliders de relacionados, al desactivar la vista debemos destruirlos
      playerView.opts.detailsSliders.destroy();
      playerView.setGradient();
    }

    if (yPlayerCommon.isLive() && !yPlayerCommon.isVideoPlaza) {
      hidePlayerFanartMessage();
      await this.deactivateLive(playerView);
    } else {
      removePlayerFanart(playerView);
      await ViewMng.instance.removeViewInDeactivate(playerView);
    }

    if (yPlayerCommon.isVideoPlaza) {
      await this.deactivateVideoPlaza();
    }
  }

  async deactivateVideoPlaza() {
    await PlayMng.instance.playLastChannel(true);
  }

  /**
   * @param {PlayerView} playerView
   */
  async deactivateLive(playerView) {
    playerView.hideNotAllowed();
    playerView.resetIsAllowed();
    if (yPlayerCommon.isLive() && !yPlayerCommon.isDiferido()) {
      await PlayMng.instance.setBackgroundMode(true);
      const program = playerView.getCurrentProgram();
      const isXRated = ControlParentalMng.instance.getEventIsXRated(program);
      if (isXRated) {
        const channel = DialMng.instance.getDefaultChannel();
        const playConfig = {
          channel,
          autoplay: false,
          origin: "",
          desdeInicio: false,
          backgroundMode: true,
        };
        PlayMng.instance.playChannel(playConfig);
      }
    }
  }

  /**
   * Muestra el background si es necesario hacerlo
   * Se muestra el background si:
   * * La vista previa a la actual __NO__ es _Home_
   * * El slider activo __NO__ es el de _Channels_
   * @param {PlayerView} playerView
   */
  #showBackgroundIfNeeded(playerView) {
    //
    //  Si la pantalla anterior al player es el home y esta parado
    //  en los canales NO mostrar el background
    //  FIXME: Esto es FEO, no debería haber una especializacion aqui.
    //  FIXME: Quizas se debe poner algo en el BAckgroundMgn
    const [prevView] = ViewMng.instance.getPrevViewByIndex(playerView);

    let sliderType = null;
    if (prevView?.type === "slider") {
      sliderType = prevView.get_active_slider().getType();
    }
    if (!prevView?.isHome || sliderType !== "channels") {
      BackgroundMng.instance.show_full_background();
    }
  }
}

/** @typedef {import("./player-view").PlayerView} PlayerView */
